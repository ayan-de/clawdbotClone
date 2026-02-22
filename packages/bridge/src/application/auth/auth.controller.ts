import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';
import { OAuthProfile } from './strategies/oauth-provider.interface';
import { Public } from '../../common/decorators';

/**
 * Auth Controller
 * Handles OAuth authentication endpoints
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleStrategy: GoogleOAuthStrategy,
  ) { }

  /**
   * Google OAuth redirect
   * Redirects user to Google's OAuth consent screen
   */
  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport handles the redirect
    return 'Auth with Google';
  }

  /**
   * Google OAuth callback
   * Called when Google redirects back with authorization code
   */
  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: any,
    @Res() res: Response,
  ) {
    // req.user is already the OAuthProfile object returned by the strategy
    const profile = req.user as OAuthProfile;

    // Find or create user
    const user = await this.authService.findOrCreateUser(
      'google',
      profile,
      (profile as any).accessToken,
      (profile as any).refreshToken,
    );

    // Generate JWT token
    const accessToken = this.authService.generateAccessToken(user);

    // Redirect to frontend with token
    // In production, you might want to use a secure cookie instead
    const redirectUrl = this.authService['configService'].get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    // Check if user has Telegram username set
    // If not, redirect to signup page, otherwise to dashboard
    if (!user.telegramUsername) {
      return res.redirect(
        `${redirectUrl}/signup?token=${accessToken}`,
      );
    }

    return res.redirect(
      `${redirectUrl}/dashboard?token=${accessToken}`,
    );
  }

  /**
   * Validate JWT token
   * Returns user information if token is valid
   */
  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Req() req: any) {
    return {
      valid: true,
      user: req.user,
    };
  }

  /**
   * Logout endpoint
   * In a real implementation, you would invalidate the token
   */
  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async logout() {
    // For JWT, logout is handled client-side by removing the token
    // You could implement token blacklisting here
    return { message: 'Logged out successfully' };
  }
}
