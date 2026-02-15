/**
 * Desktop TUI Types
 * Type definitions for Desktop TUI application
 */

/**
 * WebSocket connection state
 */
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

/**
 * Message types from Bridge Server
 */
export enum BridgeMessageType {
  // Connection messages
  AUTHENTICATE = 'authenticate',
  AUTHENTICATED = 'authenticated',
  AUTH_ERROR = 'auth_error',

  // Command messages
  COMMAND_REQUEST = 'command_request',
  COMMAND_RESULT = 'command_result',
  COMMAND_ERROR = 'command_error',

  // Output messages
  OUTPUT_STREAM = 'output_stream',
  OUTPUT_END = 'output_end',

  // System messages
  HEARTBEAT = 'heartbeat',
  HEARTBEAT_ACK = 'heartbeat_ack',
  ERROR = 'error',

  // Session messages
  SESSION_CREATED = 'session_created',
  SESSION_CLOSED = 'session_closed',
}

/**
 * Message types to Bridge Server
 */
export enum DesktopMessageType {
  // Connection
  AUTHENTICATE = 'authenticate',
  HEARTBEAT = 'heartbeat',

  // Command execution
  COMMAND_STARTED = 'command_started',
  COMMAND_OUTPUT = 'command_output',
  COMMAND_COMPLETE = 'command_complete',
  COMMAND_ERROR = 'command_error',

  // Status
  STATUS_UPDATE = 'status_update',
  CAPABILITIES = 'capabilities',
}

/**
 * Bridge message structure
 */
export interface BridgeMessage {
  type: BridgeMessageType;
  sessionId?: string;
  data?: any;
  timestamp?: number;
  error?: string;
}

/**
 * Desktop message structure
 */
export interface DesktopMessage {
  type: DesktopMessageType;
  sessionId?: string;
  data?: any;
  timestamp: number;
}

/**
 * Command execution result
 */
export interface CommandResult {
  command: string;
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  duration?: number;
  error?: string;
  signal?: NodeJS.Signals | string;
}

/**
 * Session information
 */
export interface SessionInfo {
  sessionId: string;
  userId: string;
  desktopId?: string;
  createdAt: Date;
  status: 'active' | 'inactive' | 'closed';
}

/**
 * Desktop capabilities
 */
export interface DesktopCapabilities {
  os: string;
  osVersion: string;
  arch: string;
  hostname: string;
  shell: string;
  workspace: string;
}

/**
 * UI component state
 */
export interface UiState {
  connectionState: ConnectionState;
  sessionId?: string;
  lastCommand?: string;
  outputLines: string[];
  isProcessing: boolean;
}

/**
 * Command history item
 */
export interface CommandHistoryItem {
  command: string;
  timestamp: number;
  result?: CommandResult;
}
