/**
 * Response DTO for Desktop Connection Token
 * Returned to web app when user requests a connection token
 */
export class DesktopTokenResponse {
  /** The connection token to copy to Desktop TUI */
  token!: string;

  /** User-friendly token display format (e.g., "orbit-dsk-abc123") */
  displayToken!: string;

  /** Expiration time (ISO string) */
  expiresAt!: string;

  /** Desktop name (if provided) */
  desktopName?: string;

  /** Instructions for user */
  instructions!: string;

  /** CLI command to connect (convenient copy-paste) */
  connectCommand!: string;
}
