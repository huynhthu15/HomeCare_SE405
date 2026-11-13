import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@homecare/shared';

export const ROLES_KEY = 'homecare:roles';

/** Restrict a route or controller to some roles: `@Roles('ADMIN')`. Checked by the global RolesGuard. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
