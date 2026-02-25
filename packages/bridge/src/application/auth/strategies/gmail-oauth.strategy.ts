import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { IOAuthProvider, OAuthProfile } from './oauth-provider.interface';
import { HttpService } from '@nestjs/axios';
import { OAuth2Client } from 'google-auth-library';

/**
 * Gmail OAuth Strategy
 *
 * Implements Gmail-specific OAuth for sending emails.
 * Uses Gmail-specific scope: https://www.googleapis.com/auth/gmail.send
 *
 * @example usage:
 * @Get('auth/gmail/authorize')
 * @UseGuards(AuthGuard('gmail'))
 * async gmailAuth() { return 'Auth with Gmail'; }
 */
@Injectable()
export class GmailOAuthStrategy extends PassportStrategy(Strategy, 'gmail') implements IOAuthProvider {
  readonly provider = 'gmail';
  private readonly clientID: string;
  private readonly clientSecret: string;
  private readonly callbackURL: string;
  private readonly agentAPIUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    // Get config values first
    const clientId = configService.get<string>('GMAIL_CLIENT_ID', '');
    const clientSecret = configService.get<string>('GMAIL_CLIENT_SECRET', '');
    const callbackUrl = configService.get<string>('GMAIL_REDIRECT_URI', '');
    const agentApiUrl = configService.get<string>('AGENT_API_URL', 'http://localhost:8000');

    if (!clientId) {
      console.warn('⚠️  GMAIL_CLIENT_ID is missing! Gmail OAuth will not work.');
    }

    // Call super() first with config values
    super({
      clientID: clientId || 'missing_client_id', // Prevent crash on startup
      clientSecret: clientSecret || 'missing_client_secret',
      callbackURL: callbackUrl || 'http://localhost:5000/auth/gmail/callback',
      scope: ['https://www.googleapis.com/auth/gmail.send'], // Gmail-specific scope
    });

    // Now can use this
    this.clientID = clientId || 'missing_client_id';
    this.clientSecret = clientSecret || 'missing_client_secret';
    this.callbackURL = callbackUrl || 'http://localhost:5000/auth/gmail/callback';
    this.agentAPIUrl = agentApiUrl;
  }

  /**
   * Get OAuth authorization URL
   *
   * Generates URL for redirecting user to Google OAuth consent screen
   */
  getOAuthUrl(userId: string): string {
    const oauth2Client = new OAuth2Client({
      clientId: this.clientID,
      clientSecret: this.clientSecret,
      redirectUri: this.callbackURL,
    });

    return oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: 'https://www.googleapis.com/auth/gmail.send',
      state: userId, // For CSRF protection
    });
  }

  /**
   * Validate OAuth response
   *
   * Called when Google redirects back with authorization code
   * Stores tokens in Python Agent database
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<void> {
    try {
      const user = this.extractProfileFromGoogle(profile);

      // Get user's email from Gmail API for better accuracy
      let gmailEmail = user.email as string;
      try {
        const gmailProfile = await this.fetchGmailProfile(accessToken);
        if (gmailProfile && gmailProfile.emailAddress) {
          gmailEmail = gmailProfile.emailAddress;
        }
      } catch (error: any) {
        console.warn('Could not fetch Gmail profile:', error);
      }

      // Store tokens in Python Agent database
      await this.storeTokensInPythonAgent(
        (profile as any).id || user.providerId,
        gmailEmail as string || '',
        accessToken,
        refreshToken,
      );

      // Attach tokens to user for use in callback
      (user as any).accessToken = accessToken;
      (user as any).refreshToken = refreshToken;
      (user as any).emailAddress = gmailEmail;

      done(null, user);
    } catch (error) {
      done(error as any, null);
    }
  }

  /**
   * Verify OAuth token (for interface compatibility)
   */
  async verifyToken(accessToken: string): Promise<OAuthProfile> {
    // For now, return a simple profile
    // In production, you could verify token with Google's tokeninfo endpoint
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
   * Fetch user's Gmail profile to get email address
   */
  private async fetchGmailProfile(accessToken: string): Promise<any> {
    try {
      const response = await this.httpService.axiosRef.get(
        'https://www.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = (error as any).message || 'Failed to fetch Gmail profile';
      throw new Error(errorMessage);
    }
  }

  /**
   * Store OAuth tokens in Python Agent database
   *
   * This allows Python agent to use Gmail API for sending emails
   */
  private async storeTokensInPythonAgent(
    userId: string,
    emailAddress: string,
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    try {
      await this.httpService.axiosRef.post(
        `${this.agentAPIUrl}/api/v1/email/oauth/store-tokens`,
        {
          user_id: userId,
          email_address: emailAddress,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 3600, // 1 hour
        },
      );
      console.log(`✓ Gmail tokens stored for user ${userId} (${emailAddress})`);
    } catch (error: any) {
      const errorMessage = (error as any).message || 'Token storage failed';
      console.error('Failed to store Gmail tokens in Python Agent:', error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Convert Google profile to standardized OAuthProfile
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
}
