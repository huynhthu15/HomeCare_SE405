import type { Request } from 'express';

/** Client information recorded on sessions and audit logs. */
export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

export function requestMeta(req: Request): RequestMeta {
  const ua = req.headers['user-agent'];
  return {
    // req.ip honours `trust proxy`, so behind Nginx this is the real client IP
    ip: req.ip ?? null,
    userAgent: typeof ua === 'string' ? ua.slice(0, 255) : null,
  };
}
