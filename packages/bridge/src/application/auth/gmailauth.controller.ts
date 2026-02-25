import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { OAuth2Client } from 'google-auth-library';

/**
 * Gmail OAuth Controller
 *
 * Handles Gmail-specific OAuth for email sending functionality.
 * Separate from general Google OAuth to use Gmail-specific scopes.
 */
@Controller('auth/gmail')
export class GmailController {
  private readonly oauth2Client: OAuth2Client;
  private readonly agentAPIUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const clientId = configService.get<string>('GMAIL_CLIENT_ID', '');
    const clientSecret = configService.get<string>('GMAIL_CLIENT_SECRET', '');
    const callbackUrl = configService.get<string>('GMAIL_REDIRECT_URI', '');
    this.agentAPIUrl = configService.get<string>('AGENT_API_URL', 'http://localhost:8000');

    this.oauth2Client = new OAuth2Client({
      clientId,
      clientSecret,
      redirectUri: callbackUrl,
    });
  }

  /**
   * Gmail OAuth authorize endpoint
   *
   * Redirects user to Gmail OAuth consent screen
   * Uses Gmail-specific scope for sending emails and reading profile.
   */
  @Get('authorize')
  @Public()
  async authorize(@Query('user_id') userId: string, @Res() res: Response) {
    // Generate authorization URL with user_id as state
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
      state: userId, // For CSRF protection and user identification
    });

    // Redirect to Google OAuth
    return res.redirect(authUrl);
  }

  /**
   * Gmail OAuth callback endpoint
   *
   * Called when Google redirects back with authorization code
   * Exchanges code for tokens and stores them in Python Agent
   */
  @Get('callback')
  @Public()
  async callback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    try {
      if (!code) {
        throw new Error('Authorization code not received');
      }

      if (!userId) {
        throw new Error('User ID not received in state');
      }

      // Exchange authorization code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      const accessToken = tokens.access_token;
      const refreshToken = tokens.refresh_token;

      if (!accessToken) {
        throw new Error('Access token not received');
      }

      // Set access token to fetch Gmail profile
      this.oauth2Client.setCredentials({ access_token: accessToken });

      // Fetch user's Gmail email address
      const gmailResponse = await this.httpService.axiosRef.get(
        'https://www.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const emailAddress = gmailResponse.data.emailAddress;

      if (!emailAddress) {
        throw new Error('Could not retrieve Gmail email address');
      }

      // Store tokens in Python Agent database
      await this.httpService.axiosRef.post(
        `${this.agentAPIUrl}/api/v1/email/oauth/store-tokens`,
        {
          user_id: userId,
          email_address: emailAddress,
          access_token: accessToken,
          refresh_token: refreshToken || '', // Refresh token may not be available on re-authorization
          expires_in: tokens.expiry_date
            ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
            : 3600,
        },
      );
      console.log(`✓ Gmail tokens stored for user ${userId} (${emailAddress})`);

      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );

      // Redirect to frontend with success
      return res.redirect(
        `${frontendUrl}/dashboard?email=connected&email_address=${encodeURIComponent(emailAddress)}`,
      );
    } catch (error: any) {
      console.error('Gmail OAuth callback error:', error);

      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );

      // Redirect to frontend with error
      return res.redirect(
        `${frontendUrl}/dashboard?email=error&message=${encodeURIComponent((error as any).message || 'Authentication failed')}`,
      );
    }
  }

  /**
   * Get Gmail connection status
   *
   * Checks if user has Gmail tokens stored in Python Agent
   */
  @Get('status')
  @Public()
  async status(@Query('user_id') userId: string) {
    if (!userId) {
      return {
        connected: false,
        emailAddress: null,
        provider: null,
      };
    }

    try {
      // Query Python Agent for Gmail connection status
      const response = await this.httpService.axiosRef.get(
        `${this.agentAPIUrl}/api/v1/email/status`,
        {
          params: { user_id: userId },
        },
      );

      const data = response.data;
      return {
        connected: data.connected || false,
        emailAddress: data.email_address || null,
        provider: data.provider || 'gmail',
      };
    } catch (error: any) {
      // Assume not connected if there's an error
      return {
        connected: false,
        emailAddress: null,
        provider: null,
      };
    }
  }
}
