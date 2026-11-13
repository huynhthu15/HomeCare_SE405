import type { ApiErrorBody, AuthResponse, AuthUser, ErrorCode } from '@homecare/shared';

/**
 * Single HTTP entry point for the web app.
 * - Access token lives ONLY in memory (never localStorage -> not stealable by XSS).
 * - Refresh token is an httpOnly cookie the browser sends to /api/v1/auth automatically.
 * - On 401 the client refreshes once and retries. Refreshes are single-flight within a tab and
 *   serialized across tabs with the Web Locks API, because the server treats a replayed refresh
 *   token as theft and revokes the whole session.
 */
const BASE = '/api/v1';
const LOCK_NAME = 'homecare-auth-refresh';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: ApiErrorBody['details'],
    readonly requestId?: string,
  ) {
    super(message);
  }
}

type Listener = (user: AuthUser | null) => void;

let accessToken: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let inflightRefresh: Promise<AuthResponse | null> | null = null;
const listeners = new Set<Listener>();
const channel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('homecare-auth') : null;

/** Subscribe to sign-in / sign-out / silent-refresh results. */
export function onAuthChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(user: AuthUser | null): void {
  for (const l of listeners) l(user);
}

/** Store a fresh session and schedule a proactive refresh 60 s before the access token expires. */
export function applySession(data: AuthResponse): void {
  accessToken = data.accessToken;
  if (refreshTimer) clearTimeout(refreshTimer);
  const inMs = Math.max((data.expiresIn - 60) * 1000, 10_000);
  refreshTimer = setTimeout(() => void refreshSession(), inMs);
  emit(data.user);
}

export function clearSession(broadcast = true): void {
  accessToken = null;
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
  emit(null);
  if (broadcast) channel?.postMessage('logout');
}

// Logging out in one tab logs out every tab
channel?.addEventListener('message', (e) => {
  if (e.data === 'logout') clearSession(false);
});

export function refreshSession(): Promise<AuthResponse | null> {
  inflightRefresh ??= withCrossTabLock(doRefresh).finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
}

async function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(LOCK_NAME, fn);
  }
  return fn();
}

async function doRefresh(): Promise<AuthResponse | null> {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  }).catch(() => null);

  if (!res || !res.ok) {
    clearSession(false);
    return null;
  }
  const data = (await res.json()) as AuthResponse;
  applySession(data);
  return data;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Set false for anonymous endpoints (login/register) — skips the refresh-and-retry. */
  auth?: boolean;
  headers?: Record<string, string>;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true } = options;
  let res = await send(path, options);

  if (res.status === 401 && auth) {
    const refreshed = await refreshSession();
    if (refreshed) res = await send(path, options);
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function send(
  path: string,
  { method = 'GET', body, query, headers }: RequestOptions,
): Promise<Response> {
  const qs = query
    ? '?' +
      new URLSearchParams(
        Object.entries(query)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  return fetch(`${BASE}${path}${qs}`, {
    method,
    credentials: 'same-origin',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function toApiError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as Partial<ApiErrorBody> | null;
  return new ApiError(
    res.status,
    body?.code ?? 'INTERNAL',
    body?.message ?? 'Không thể kết nối máy chủ',
    body?.details,
    body?.requestId,
  );
}
