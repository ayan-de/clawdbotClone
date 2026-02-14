import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { REQUIRE_AUTH_KEY, RequireAuthOptions } from '../../../common/decorators';

/**
 * OAuth Auth Guard
 * Protects routes by requiring specific OAuth provider
 * Use @RequireAuth({ oauthProviders: ['google'] }) to specify providers
 *
 * @example usage:
 * @UseGuards(OAuthAuthGuard)
 * @RequireAuth({ oauthProviders: ['google'] })
 * @Get('google-callback')
 * googleCallback() {
 *   return 'Google auth callback';
 * }
 */
@Injectable()
export class OAuthAuthGuard extends AuthGuard('google') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Check if route requires specific OAuth provider
   */
  canActivate(context: ExecutionContext): boolean {
    const requireAuth = this.reflector.getAllAndOverride<RequireAuthOptions | undefined>(
      REQUIRE_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no specific OAuth requirements, allow all
    if (!requireAuth || !requireAuth.oauthProviders) {
      return true;
    }

    // Check if requested provider is allowed
    const request = context.switchToHttp().getRequest();
    const provider = request.query.provider || 'google'; // Default to Google

    return requireAuth.oauthProviders.includes(provider);
  }
}
