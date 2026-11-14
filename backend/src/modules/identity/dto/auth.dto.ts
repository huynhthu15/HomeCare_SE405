import { UserRole, UserStatus, loginSchema, refreshSchema, registerSchema } from '@homecare/shared';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Schemas live in @homecare/shared so web and mobile validate with the exact same rules.
export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
// Web clients may POST /auth/refresh with no body at all (cookie only); Express 5 then leaves
// req.body undefined, so treat a missing body as {}.
export class RefreshDto extends createZodDto(refreshSchema.default({})) {}

export const listUsersQuerySchema = z
  .object({
    role: z.enum(Object.values(UserRole) as [UserRole, ...UserRole[]]).optional(),
    status: z.enum(Object.values(UserStatus) as [UserStatus, ...UserStatus[]]).optional(),
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export class ListUsersQueryDto extends createZodDto(listUsersQuerySchema) {}

export const updateUserStatusSchema = z
  .object({
    status: z.enum(Object.values(UserStatus) as [UserStatus, ...UserStatus[]]),
    reason: z.string().trim().min(3).max(300),
  })
  .strict();
export class UpdateUserStatusDto extends createZodDto(updateUserStatusSchema) {}
