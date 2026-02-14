import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Current User Decorator
 * Extracts the current authenticated user from the request
 * Follows Decorator Pattern - adds custom parameter extraction
 *
 * @example
 * @Post('profile')
 * updateProfile(
 *   @CurrentUser() user: User,
 *   @Body() updateDto: UpdateUserDto
 * ) {
 *   return this.usersService.update(user.id, updateDto);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
