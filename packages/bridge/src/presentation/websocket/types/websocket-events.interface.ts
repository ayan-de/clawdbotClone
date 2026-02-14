import { User } from '../../../application/domain/entities';

/**
 * WebSocket Events
 * Defines all possible events for WebSocket communication
 */

// Client → Server Events
export interface WSClientEvents {
  // Authentication
  'auth:token': { token: string };

  // Heartbeat
  'ping': { timestamp?: number };

  // Command execution
  'command:execute': {
    sessionId: string;
    command: string;
    userMessage?: string;
  };

  'command:cancel': { sessionId: string };

  // Session management
  'session:join': { sessionId: string };
  'session:leave': { sessionId: string };
}

// Server → Client Events
export interface WSServerEvents {
  // Authentication
  'auth:success': { user: Omit<User, 'password'> };
  'auth:error': { message: string };

  // Heartbeat
  'pong': { timestamp: number };

  // Command execution
  'command:started': { sessionId: string; command: string };
  'command:output': { sessionId: string; stdout: string };
  'command:error': { sessionId: string; stderr: string };
  'command:complete': { sessionId: string; success: boolean };
  'command:progress': { sessionId: string; progress: number; message?: string };

  // Session management
  'session:created': { sessionId: string; userId: string };
  'session:expired': { sessionId: string };
  'session:terminated': { sessionId: string };

  // Connection
  'connected': { sessionId?: string };
  'disconnected': { reason?: string };

  // Error
  'error': { message: string; code?: string };
}

/**
 * WebSocket Client Info
 * Stores information about connected clients
 */
export interface WSClient {
  id: string;
  userId?: string;
  user?: User;
  sessionId?: string;
  connectedAt: Date;
  lastHeartbeat: Date;
  isAlive: boolean;
}

/**
 * WebSocket Message
 * Generic message wrapper
 */
export interface WSMessage<T = any> {
  event: string;
  data: T;
  timestamp: number;
}
