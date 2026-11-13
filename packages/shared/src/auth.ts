import { z } from 'zod';
import type { UserRole } from './enums';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'Email không hợp lệ' }));

/** Login accepts an email (customers/admins) or a technician code such as TECH-088. */
export const loginSchema = z
  .object({
    identifier: z.string().trim().min(3, 'Vui lòng nhập email hoặc mã kỹ thuật viên').max(254),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(128),
  })
  .strict();
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
    email,
    phone: z
      .string()
      .trim()
      .regex(/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ')
      .optional(),
    password: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .max(128)
      .regex(/[A-Za-z]/, 'Mật khẩu cần có chữ cái')
      .regex(/\d/, 'Mật khẩu cần có chữ số'),
  })
  .strict();
export type RegisterInput = z.infer<typeof registerSchema>;

/** Mobile clients send the refresh token in the body; web clients use the httpOnly cookie. */
export const refreshSchema = z
  .object({
    refreshToken: z.string().min(20).max(512).optional(),
  })
  .strict();
export type RefreshInput = z.infer<typeof refreshSchema>;

export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  technicianCode: string | null;
}

export interface AuthResponse {
  accessToken: string;
  /** Seconds until the access token expires */
  expiresIn: number;
  user: AuthUser;
  /** Only returned to mobile clients (header `x-client-type: mobile`) */
  refreshToken?: string;
}

/** Claims inside the access JWT. Keep it small: it travels on every request. */
export interface AccessTokenClaims {
  sub: string;
  role: UserRole;
  /** Session (refresh-token family) id, lets us revoke a whole device session */
  sid: string;
}
