import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { IOAuthProvider, OAuthProfile } from './oauth-provider.interface';

/**
 * Google OAuth Strategy
 * Implements OAuth authentication with Google
 * Follows Strategy Pattern - interchangeable with other OAuth providers
 *
 * @example usage:
 * @Get('auth/google')
 * @UseGuards(AuthGuard('google'))
 * googleAuth() { return 'Auth with Google' }
 */
@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') implements IOAuthProvider {
  readonly provider = 'google';

  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID', '');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET', '');
    const callbackURL = configService.get<string>('GOOGLE_REDIRECT_URI', '');

    if (!clientID) {
      console.warn('⚠️ GOOGLE_CLIENT_ID is missing! Google OAuth will not work.');
    }

    super({
      clientID: clientID || 'missing_client_id', // Prevent crash on startup
      clientSecret: clientSecret || 'missing_client_secret',
      callbackURL: callbackURL || 'http://localhost:5000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  /**
   * Validate OAuth response
   * Called when Google redirects back with authorization code
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    try {
      const user = this.extractProfileFromGoogle(profile);
      // Attach tokens to user for use in callback
      (user as any).accessToken = accessToken;
      (user as any).refreshToken = refreshToken;
      (user as any).profile = profile;
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }

  /**
   * Verify OAuth token (for interface compatibility)
   * Note: In practice, validate() handles the OAuth flow
   * This method exists for interface compatibility
   */
  async verifyToken(accessToken: string): Promise<OAuthProfile> {
    // In a real implementation, you would verify the token with Google's tokeninfo endpoint
    // For now, we'll return a placeholder
    return {
      providerId: '',
      email: '',
      displayName: '',
      firstName: '',
      lastName: '',
      picture: '',
    };
  }

  /**
   * Convert Google profile to standardized OAuthProfile
   * This is a helper method used in the validate flow
   */
  private extractProfileFromGoogle(profile: any): OAuthProfile {
    const emails = profile.emails;
    const primaryEmail = emails?.find((e: any) => e.verified);

    return {
      providerId: profile.id,
      email: primaryEmail?.value,
      displayName: profile.displayName,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      picture: profile.photos?.[0]?.value,
      raw: profile,
    };
  }

  /**
   * Static helper for extracting profile from Google OAuth response
   */
  static extractProfile(profile: any): OAuthProfile {
    const emails = profile.emails;
    const primaryEmail = emails?.find((e: any) => e.verified);

    return {
      providerId: profile.id,
      email: primaryEmail?.value,
      displayName: profile.displayName,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      picture: profile.photos?.[0]?.value,
      raw: profile,
    };
  }
}
