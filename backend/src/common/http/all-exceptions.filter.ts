import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { ApiErrorBody, ErrorCode } from '@homecare/shared';
import type { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma/client';
import { AppException } from './app.exception';

const statusToCode: Record<number, ErrorCode> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
};

/**
 * Framework-raised errors (unknown route, malformed JSON, ParseUUIDPipe…) carry English text that
 * can reveal internals ("Cannot GET /api/v1/…"). Clients get a Vietnamese message per status instead;
 * business code throws AppException with its own message.
 */
const statusToMessage: Record<number, string> = {
  400: 'Dữ liệu không hợp lệ',
  401: 'Vui lòng đăng nhập lại',
  403: 'Bạn không có quyền thực hiện thao tác này',
  404: 'Không tìm thấy dữ liệu yêu cầu',
  405: 'Thao tác không được hỗ trợ',
  409: 'Dữ liệu bị xung đột, vui lòng tải lại',
  413: 'Dữ liệu gửi lên quá lớn',
  415: 'Định dạng dữ liệu không được hỗ trợ',
  429: 'Bạn thao tác quá nhanh, vui lòng thử lại sau',
};

/**
 * Turns every error into the shared `ApiErrorBody` shape. Internal details (stack traces,
 * SQL errors) are logged with the request id but never sent to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') throw exception;

    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string }>();
    const res = ctx.getResponse<Response>();
    const body = this.toBody(exception);
    body.requestId = typeof req.id === 'string' ? req.id : undefined;

    if (body.statusCode >= 500) {
      this.logger.error(
        { err: exception, requestId: body.requestId, path: req.url },
        'Unhandled error',
      );
    }

    res.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (exception instanceof AppException) {
      return {
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      const details =
        zodError instanceof ZodError
          ? zodError.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
          : undefined;
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_FAILED',
        message: 'Dữ liệu không hợp lệ',
        details,
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        code: 'RATE_LIMITED',
        message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau',
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return { statusCode: 409, code: 'CONFLICT', message: 'Dữ liệu đã tồn tại' };
      }
      if (exception.code === 'P2025') {
        return { statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu' };
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message =
        statusToMessage[status] ??
        (status >= 500 ? 'Hệ thống đang gặp sự cố, vui lòng thử lại' : 'Yêu cầu không hợp lệ');
      return { statusCode: status, code: statusToCode[status] ?? 'INTERNAL', message };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL',
      message: 'Hệ thống đang gặp sự cố, vui lòng thử lại',
    };
  }
}
