/**
 * Public API of the identity module. Other modules import ONLY from here:
 *   import { CurrentUser, Roles, AuthenticatedUser } from '../identity';
 */
export { IdentityModule } from './identity.module';
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { RolesGuard } from './guards/roles.guard';
export { TokenService } from './token.service';
export { CurrentUser } from './decorators/current-user.decorator';
export { Roles } from './decorators/roles.decorator';
export { Public } from '../../common/http/public.decorator';
export type { AuthenticatedUser } from './identity.types';
