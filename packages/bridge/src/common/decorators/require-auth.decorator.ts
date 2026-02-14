import { SetMetadata } from '@nestjs/common';

/**
 * Require Auth Decorator
 * Marks routes that require specific authentication
 * Follows Decorator Pattern - adds authentication metadata to routes
 *
 * @example
 * @RequireAuth('admin')
 * @Post('admin/users')
 * createAdminUser(@Body() dto: CreateUserDto) {
 *   return this.usersService.createAdmin(dto);
 * }
 */
export const REQUIRE_AUTH_KEY = 'requireAuth';

export interface RequireAuthOptions {
  roles?: string[];
  permissions?: string[];
  oauthProviders?: string[];
}

export const RequireAuth = (options?: RequireAuthOptions) =>
  SetMetadata(REQUIRE_AUTH_KEY, options ?? {});
