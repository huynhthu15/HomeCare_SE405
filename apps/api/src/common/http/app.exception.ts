import { HttpException, HttpStatus } from '@nestjs/common';
import type { ApiErrorBody, ErrorCode } from '@homecare/shared';

/**
 * The only exception business code should throw. `code` is stable for clients,
 * `message` is shown to users (Vietnamese).
 */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
    readonly details?: ApiErrorBody['details'],
  ) {
    super({ code, message, details }, status);
  }

  static unauthenticated(message = 'Vui lòng đăng nhập lại', code: ErrorCode = 'UNAUTHENTICATED') {
    return new AppException(code, message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(message = 'Bạn không có quyền thực hiện thao tác này') {
    return new AppException('FORBIDDEN', message, HttpStatus.FORBIDDEN);
  }

  static notFound(message = 'Không tìm thấy dữ liệu') {
    return new AppException('NOT_FOUND', message, HttpStatus.NOT_FOUND);
  }

  static conflict(code: ErrorCode, message: string) {
    return new AppException(code, message, HttpStatus.CONFLICT);
  }
}
