import { SetMetadata } from '@nestjs/common';

/**
 * Public Route Decorator
 * Marks routes that should be accessible without authentication
 * Follows Decorator Pattern - adds metadata to routes
 *
 * @example
 * @Public()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 */
export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
