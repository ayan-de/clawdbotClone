/**
 * Application Constants
 * Centralized constants for easy maintenance
 */

export const APP_CONSTANTS = {
  // Metadata keys
  IS_PUBLIC_KEY: 'isPublic',
  REQUIRE_AUTH_KEY: 'requireAuth',

  // Headers
  AUTHORIZATION_HEADER: 'authorization',
  BEARER_PREFIX: 'Bearer ',

  // Events
  // WebSocket events
  WS_EVENT: {
    CONNECT: 'connection',
    DISCONNECT: 'disconnect',
    MESSAGE: 'message',
    ERROR: 'error',
    HEARTBEAT: 'heartbeat',
  },

  // Session events
  SESSION_EVENT: {
    CREATED: 'session:created',
    EXPIRED: 'session:expired',
    TERMINATED: 'session:terminated',
  },

  // Command events
  COMMAND_EVENT: {
    EXECUTE: 'command:execute',
    OUTPUT: 'command:output',
    ERROR: 'command:error',
    COMPLETE: 'command:complete',
    CANCEL: 'command:cancel',
  },

  // Rate limiting
  RATE_LIMIT: {
    TTL_MS: 60000, // 1 minute
    DEFAULT_MAX: 100,
  },

  // Timeouts
  TIMEOUT: {
    WEBSOCKET_HEARTBEAT: 30000, // 30 seconds
    SESSION: 3600000, // 1 hour
    COMMAND: 300000, // 5 minutes
  },

  // Error codes
  ERROR_CODE: {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },
} as const;
