import { Profile } from 'passport';

/**
 * OAuth Provider Interface
 * Strategy Pattern - allows different OAuth providers (Google, GitHub, etc.)
 * Follows SOLID - Open/Closed: Add new providers without modifying existing code
 *
 * @example
 * class GoogleOAuthStrategy implements IOAuthProvider {
 *   async verifyToken(token: string): Promise<OAuthProfile> {
 *     // Verify Google token and get user profile
 *   }
 * }
 */
export interface IOAuthProvider {
  /**
   * Provider name (e.g., 'google', 'github', 'facebook')
   */
  readonly provider: string;

  /**
   * Verify OAuth access token and get user profile
   * @param accessToken - OAuth access token
   * @returns User profile information
   */
  verifyToken(accessToken: string): Promise<OAuthProfile>;
}

/**
 * OAuth Profile
 * Standardized user profile from any OAuth provider
 */
export interface OAuthProfile {
  /**
   * Unique identifier from the OAuth provider
   */
  providerId: string;

  /**
   * User's email address
   */
  email?: string;

  /**
   * User's display name
   */
  displayName?: string;

  /**
   * User's first name
   */
  firstName?: string;

  /**
   * User's last name
   */
  lastName?: string;

  /**
   * Profile picture URL
   */
  picture?: string;

  /**
   * Raw profile data from the provider
   */
  raw?: Profile;
}
