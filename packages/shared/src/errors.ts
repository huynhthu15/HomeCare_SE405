/**
 * Stable machine-readable error codes. The API always answers errors as
 * `ApiErrorBody`; clients branch on `code`, never on the (Vietnamese) message.
 */
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',

  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_TAKEN: 'AUTH_EMAIL_TAKEN',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_REFRESH_INVALID: 'AUTH_REFRESH_INVALID',
  AUTH_REFRESH_REUSED: 'AUTH_REFRESH_REUSED',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ApiErrorBody {
  statusCode: number;
  code: ErrorCode;
  message: string;
  /** Field-level validation issues, when code = VALIDATION_FAILED */
  details?: Array<{ path: string; message: string }>;
  /** Correlates with the server log line (x-request-id) */
  requestId?: string;
}
