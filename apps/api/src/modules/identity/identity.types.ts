import type { UserRole } from '@homecare/shared';

/** What the global JwtAuthGuard attaches to `req.user` for every authenticated request. */
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  /** Session id (sid claim) — used to log out exactly this device */
  sessionId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const REFRESH_COOKIE = 'hc_rt';
/** Cookie is only ever sent to the auth endpoints, never to the rest of the API. */
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

export const redisKeys = {
  /** Present while a revoked session's access tokens may still be unexpired */
  revokedSession: (sid: string) => `auth:revoked-sid:${sid}`,
  loginFailures: (identifier: string) => `auth:login-fail:${identifier.toLowerCase()}`,
};

export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_LOCK_SECONDS = 15 * 60;
