import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators';

/**
 * JWT Auth Guard
 * Protects routes by requiring a valid JWT token
 * Respects @Public() decorator to bypass authentication
 *
 * @example usage:
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Check if route is public
   * Bypasses authentication if @Public() decorator is present
   */
  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    // console.log('JwtAuthGuard.canActivate called for handler:', context.getHandler().name);
    return super.canActivate(context) as boolean;
  }

  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (err || !user) {
      console.error('JwtAuthGuard.handleRequest failed:', err, user, info);
      throw err || new UnauthorizedException('You are not authorized');
    }
    return user;
  }
}
