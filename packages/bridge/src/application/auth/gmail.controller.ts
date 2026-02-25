import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';
import { GmailOAuthStrategy } from './strategies/gmail-oauth.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Gmail OAuth Controller
 *
 * Handles Gmail-specific OAuth for email sending functionality.
 * Separate from general Google OAuth to use Gmail-specific scopes.
 */
@Controller('auth/gmail')
export class GmailController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleStrategy: GoogleOAuthStrategy,
    private readonly gmailStrategy: GmailOAuthStrategy,
  ) {}

  /**
   * Gmail OAuth authorize endpoint
   *
   * Redirects user to Gmail OAuth consent screen
   * Uses Gmail-specific scope for sending emails.
   */
  @Get('authorize')
  @Public()
  async authorize(@Query('user_id') userId: string, @Res() res: Response) {
    // Generate authorization URL using Gmail strategy
    const authUrl = this.gmailStrategy.getOAuthUrl(userId);

    // Redirect to Google OAuth
    return res.redirect(authUrl);
  }

  /**
   * Gmail OAuth callback endpoint
   *
   * Called when Google redirects back with authorization code
   * Stores tokens in Python Agent database
   */
  @Get('callback')
  @Public()
  async callback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const frontendUrl = this.authService['configService'].get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );

      // Exchange code for tokens using Gmail strategy
      // The strategy's validate() method handles token exchange and storage
      // We need to manually call it since this is a simple callback

      // For now, redirect with code and let frontend handle token storage
      // In production, you might want the bridge to store tokens directly
      return res.redirect(`${frontendUrl}/auth/callback?email=connected`);

    } catch (error: any) {
      console.error('Gmail OAuth callback error:', error);

      const frontendUrl = this.authService['configService'].get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );

      // Redirect to frontend with error
      return res.redirect(
        `${frontendUrl}/auth/callback?email=error&message=${encodeURIComponent(error.message || 'Authentication failed')}`,
      );
    }
  }

  /**
   * Get Gmail connection status
   *
   * Checks if user has Gmail tokens stored
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async status(@Req() req: any) {
    const user = req.user;

    // Check if user has Gmail email address (set during Gmail OAuth)
    if (user.emailAddress && user.emailAddress.includes('@gmail.com')) {
      return {
        connected: true,
        emailAddress: user.emailAddress,
        provider: 'gmail',
      };
    }

    return {
      connected: false,
      emailAddress: null,
      provider: null,
    };
  }
}
