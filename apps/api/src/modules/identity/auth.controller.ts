import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthResponse, AuthUser } from '@homecare/shared';
import type { CookieOptions, Request, Response } from 'express';
import { AppConfig } from '../../common/config/app-config';
import { AppException } from '../../common/http/app.exception';
import { Public } from '../../common/http/public.decorator';
import { requestMeta } from '../../common/http/request-meta';
import { AuthService, IssuedTokens } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { AuthenticatedUser, REFRESH_COOKIE, REFRESH_COOKIE_PATH } from './identity.types';

/**
 * Web clients: refresh token travels only in an httpOnly, SameSite=Strict cookie scoped to /api/v1/auth
 * (JavaScript can never read it -> XSS cannot steal it). Access token is kept in memory.
 * Mobile clients (header `x-client-type: mobile`): refresh token is returned in the body and
 * stored in the OS secure storage (expo-secure-store).
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AppConfig,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.deliver(req, res, await this.auth.register(dto, requestMeta(req)));
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.deliver(req, res, await this.auth.login(dto, requestMeta(req)));
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const fromCookie = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    const raw = isMobile(req) ? dto.refreshToken : fromCookie;
    if (!raw) {
      throw AppException.unauthenticated('Phiên đăng nhập đã hết hạn', 'AUTH_REFRESH_INVALID');
    }
    try {
      return this.deliver(req, res, await this.auth.refresh(raw, requestMeta(req)));
    } catch (err) {
      if (!isMobile(req)) res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
      throw err;
    }
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(user.sessionId, user.id, requestMeta(req));
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout-all')
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logoutEverywhere(user.id, requestMeta(req));
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUser> {
    return this.auth.me(user.id);
  }

  private deliver(req: Request, res: Response, issued: IssuedTokens): AuthResponse {
    if (isMobile(req)) {
      return { ...issued.response, refreshToken: issued.refreshToken };
    }
    res.cookie(REFRESH_COOKIE, issued.refreshToken, {
      ...this.cookieOptions(),
      maxAge: this.config.get('REFRESH_TOKEN_TTL_DAYS') * 24 * 60 * 60 * 1000,
    });
    return issued.response;
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE'),
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
    };
  }
}

function isMobile(req: Request): boolean {
  return req.headers['x-client-type'] === 'mobile';
}
