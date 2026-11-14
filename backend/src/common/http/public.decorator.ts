import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'homecare:isPublic';

/**
 * Every route requires a valid access token by default (global JwtAuthGuard).
 * Mark the few anonymous endpoints explicitly — this keeps "forgot to protect a route" impossible.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
