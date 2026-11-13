import type { AuthResponse, AuthUser, LoginInput, RegisterInput, UserRole } from '@homecare/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, applySession, clearSession, onAuthChange, refreshSession } from '../lib/api-client';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: Status;
  user: AuthUser | null;
  login(input: LoginInput): Promise<AuthUser>;
  register(input: RegisterInput): Promise<AuthUser>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const unsubscribe = onAuthChange((next) => {
      setUser(next);
      setStatus(next ? 'authenticated' : 'anonymous');
    });
    // Silent sign-in: if the httpOnly refresh cookie is still valid we get a new access token
    void refreshSession();
    return unsubscribe;
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const data = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: input,
      auth: false,
    });
    applySession(data);
    return data.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: input,
      auth: false,
    });
    applySession(data);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api<void>('/auth/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function homePathFor(role: UserRole): string {
  if (role === 'ADMIN') return '/admin/users';
  if (role === 'TECHNICIAN') return '/technician';
  return '/';
}
