/**
 * JWT Payload Interface
 * Defines the structure of the JWT token payload
 */
export interface JwtPayload {
  /**
   * User ID
   */
  sub: string;

  /**
   * User email
   */
  email?: string;

  /**
   * Issuer
   */
  iss?: string;

  /**
   * Audience
   */
  aud?: string;

  /**
   * Expiration time
   */
  exp?: number;

  /**
   * Issued at
   */
  iat?: number;

  /**
   * JWT ID
   */
  jti?: string;
}
