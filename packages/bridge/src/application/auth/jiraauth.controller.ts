import { Controller, Get, Query, Res, Post, Body } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

/**
 * Jira Auth Controller
 *
 * Handles Jira OAuth 1.0a flow for API token authentication.
 * Similar to Gmail but using Jira's OAuth flow.
 *
 * Jira OAuth Flow:
 * 1. Redirect to Jira authorize URL
 * 2. User approves → Jira redirects with auth code
 * 3. Exchange code for OAuth tokens
 * 4. Exchange OAuth tokens for Jira API token
 * 5. Store API token in Python Agent
 */
@Controller('auth/jira')
export class JiraAuthController {
  private readonly agentAPIUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.agentAPIUrl = configService.get<string>('AGENT_API_URL', 'http://localhost:8000');
  }

  /**
   * Jira OAuth authorize endpoint
   *
   * Redirects user to Jira OAuth consent screen
   */
  @Get('authorize')
  @Public()
  async authorize(
    @Query('user_id') userId: string,
    @Query('redirect_uri') redirectUri?: string,
    @Res() res: Response,
  ) {
    // Get Jira OAuth settings
    const jiraClientId = this.configService.get<string>('JIRA_CLIENT_ID', '');
    const jiraScope = this.configService.get<string>('JIRA_SCOPE', 'read:jira-work');

    if (!jiraClientId) {
      return res.status(400).json({
        error: 'JIRA_CLIENT_ID not configured'
      });
    }

    // Build Jira OAuth authorize URL
    // Format: https://auth.atlassian.com/authorize?client_id={clientId}&scope={scope}&redirect_uri={uri}&state={userId}&response_type=code
    const authUrl = new URL('https://auth.atlassian.com/authorize');
    authUrl.searchParams.set('client_id', jiraClientId);
    authUrl.searchParams.set('scope', jiraScope);
    authUrl.searchParams.set('redirect_uri', redirectUri || 'http://localhost:3000/auth/jira/callback');
    authUrl.searchParams.set('state', userId);
    authUrl.searchParams.set('response_type', 'code');

    console.log(`Jira authorize URL generated for user ${userId}`);

    // Redirect to Jira OAuth
    return res.redirect(authUrl.toString());
  }

  /**
   * Jira OAuth callback endpoint
   *
   * Called when Jira redirects back with OAuth tokens
   * Exchanges OAuth tokens for Jira API token
   * Stores API token in Python Agent
   */
  @Get('callback')
  @Public()
  async callback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Query('redirect_uri') redirectUri?: string,
    @Res() res: Response,
  ) {
    if (!code) {
      return res.status(400).json({
        error: 'Authorization code not received'
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'User ID not received in state'
      });
    }

    try {
      // Step 1: Exchange OAuth code for OAuth tokens
      const oauthTokens = await this.exchangeCodeForTokens(code, redirectUri);

      // Step 2: Exchange OAuth tokens for Jira API token
      const apiToken = await this.exchangeOAuthTokensForApiToken(
        userId,
        oauthTokens.access_token
      );

      // Step 3: Get Jira user information
      const jiraBaseUrl = this.configService.get<string>('JIRA_BASE_URL', '');
      const userProfile = await this.getJiraUserProfile(jiraBaseUrl, apiToken);

      if (!userProfile) {
        throw new Error('Failed to retrieve Jira user profile');
      }

      // Step 4: Store API token and username in Python Agent
      await this.storeTokensInAgent(userId, userProfile, apiToken);

      console.log(`✅ Jira connected for user ${userId} (${userProfile.displayName})`);

      // Redirect to frontend
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

      return res.redirect(
        `${frontendUrl}/dashboard?jira=connected&username=${encodeURIComponent(userProfile.displayName)}`
      );

    } catch (error: any) {
      console.error('Jira OAuth callback error:', error);

      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
      return res.redirect(
        `${frontendUrl}/dashboard?jira=error&message=${encodeURIComponent((error as any).message || 'Authentication failed')}`
      );
    }
  }

  /**
   * Exchange OAuth code for OAuth tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    redirectUri?: string
  ): Promise<{ access_token: string; refresh_token?: string }> {
    const jiraClientId = this.configService.get<string>('JIRA_CLIENT_ID', '');
    const jiraClientSecret = this.configService.get<string>('JIRA_CLIENT_SECRET', '');

    const response = await this.httpService.axiosRef.post(
      'https://auth.atlassian.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: jiraClientId,
        client_secret: jiraClientSecret,
        code: code,
        redirect_uri: redirectUri || 'http://localhost:3000/auth/jira/callback',
      }).toString(),
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
    };
  }

  /**
   * Exchange OAuth tokens for Jira API token
   */
  private async exchangeOAuthTokensForApiToken(
    userId: string,
    oauthAccessToken: string
  ): Promise<string> {
    const jiraBaseUrl = this.configService.get<string>('JIRA_BASE_URL', '');

    // Build Jira URL-encoded Basic Auth header
    // Jira uses OAuth 2.0 with PKCE for API token exchange
    const response = await this.httpService.axiosRef.post(
      `${jiraBaseUrl}/rest/api/3/oauth2/token`,
      {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        client_id: null, // Can be null for API token exchange
        client_secret: null, // Can be null for API token exchange
        assertion: oauthAccessToken,
        redirect_uri: 'https://oauth-2.googleusercontent.com/o/oauth2/token', // Required by Jira
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const data = response.data as any;
    return data.access_token;
  }

  /**
   * Get Jira user profile information
   */
  private async getJiraUserProfile(
    jiraBaseUrl: string,
    apiToken: string
  ): Promise<{ displayName: string; emailAddress: string }> {
    const response = await this.httpService.axiosRef.get(
      `${jiraBaseUrl}/rest/api/3/myself`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
      },
    );

    const data = response.data as any;
    return {
      displayName: data.displayName,
      emailAddress: data.emailAddress,
    };
  }

  /**
   * Store tokens in Python Agent
   */
  private async storeTokensInAgent(
    userId: string,
    userProfile: { displayName: string; emailAddress: string },
    apiToken: string
  ): Promise<void> {
    const jiraBaseUrl = this.configService.get<string>('JIRA_BASE_URL', '');

    // Store in Python Agent token store
    await this.httpService.axiosRef.post(
      `${this.agentAPIUrl}/api/v1/jira/oauth/store-tokens`,
      {
        user_id: userId,
        base_url: jiraBaseUrl,
        email: userProfile.emailAddress,
        api_token: apiToken,
        username: userProfile.displayName,
      },
    );
  }
}
