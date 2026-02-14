import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IOAuthProvider, OAuthProfile } from './oauth-provider.interface';
import { GoogleOAuthStrategy } from './google-oauth.strategy';

/**
 * OAuth Provider Factory
 * Factory Pattern - creates OAuth provider instances based on configuration
 * Follows SOLID - Open/Closed: Add new providers without modifying factory
 *
 * @example usage:
 * const googleProvider = factory.create('google');
 * const profile = await googleProvider.authenticate(accessToken);
 */
@Injectable()
export class OAuthProviderFactory {
  private readonly providers = new Map<string, IOAuthProvider>();

  constructor(
    private readonly googleStrategy: GoogleOAuthStrategy,
    private readonly configService: ConfigService,
  ) {
    // Register available providers
    this.registerProvider('google', this.googleStrategy);

    // Future providers can be registered here:
    // this.registerProvider('github', this.githubStrategy);
    // this.registerProvider('facebook', this.facebookStrategy);
  }

  /**
   * Register an OAuth provider
   */
  private registerProvider(name: string, provider: IOAuthProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Create/get an OAuth provider by name
   * @throws Error if provider not found
   */
  create(providerName: string): IOAuthProvider {
    const provider = this.providers.get(providerName.toLowerCase());

    if (!provider) {
      const availableProviders = Array.from(this.providers.keys()).join(', ');
      throw new Error(
        `OAuth provider '${providerName}' not found. Available providers: ${availableProviders}`,
      );
    }

    return provider;
  }

  /**
   * Check if a provider is available
   */
  hasProvider(providerName: string): boolean {
    return this.providers.has(providerName.toLowerCase());
  }

  /**
   * Get all available provider names
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Authenticate with a specific provider
   * Convenience method that combines create() and verifyToken()
   */
  async authenticate(
    providerName: string,
    accessToken: string,
  ): Promise<OAuthProfile> {
    const provider = this.create(providerName);
    return provider.verifyToken(accessToken);
  }
}
