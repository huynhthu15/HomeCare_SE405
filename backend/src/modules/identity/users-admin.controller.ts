import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { requestMeta } from '../../common/http/request-meta';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { ListUsersQueryDto, UpdateUserStatusDto } from './dto/auth.dto';
import type { AuthenticatedUser } from './identity.types';
import { AdminUserView, Page, UsersAdminService } from './users-admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly users: UsersAdminService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto): Promise<Page<AdminUserView>> {
    return this.users.list(query);
  }

  @Patch(':id/status')
  setStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: Request,
  ): Promise<AdminUserView> {
    return this.users.setStatus(actor, id, dto.status, dto.reason, requestMeta(req));
  }
}
