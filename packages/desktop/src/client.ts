import { io, Socket } from 'socket.io-client';
import { Logger } from './logger';
import { OrbitConfig } from './config';
import { CommandHandler } from './command-handler';
import {
  ConnectionState,
  BridgeMessageType,
  DesktopMessageType,
  DesktopMessage,
  BridgeMessage,
} from './types';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const logger = Logger.getInstance();

export class DesktopClient {
  private socket: Socket | null = null;
  // ... existing code ...

  /**
   * Get desktop capabilities
   */
  private getCapabilities(): any {
    const os = require('os');
    const process = require('process');

    return {
      os: os.platform(),
      osVersion: os.release(),
      arch: os.arch(),
      hostname: os.hostname(),
      shell: process.env.SHELL || 'unknown',
      nodeVersion: process.version,
      workspace: this.commandHandler.getWorkingDir(),
    };
  }
  private config: OrbitConfig;
  private commandHandler: CommandHandler;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private sessionId?: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // 2 seconds
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(config: OrbitConfig) {
    this.config = config;
    this.commandHandler = new CommandHandler(config.workspace);
  }

  /**
   * Connect to Bridge Server
   */
  async connect() {
    if (this.socket?.connected) {
      logger.warn('Already connected to Bridge Server');
      return true;
    }

    if (!this.config.token) {
      logger.error('No connection token available');
      return false;
    }

    this.setConnectionState(ConnectionState.CONNECTING);
    logger.info(`Connecting to Bridge Server at ${this.config.bridgeUrl}`);

    return new Promise<boolean>((resolve) => {
      // Create Socket.io client
      this.socket = io(this.config.bridgeUrl, {
        reconnection: this.config.autoReconnect ?? true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: this.config.timeout ? this.config.timeout * 1000 : 30000,
        transports: ['websocket'],
        upgrade: false,
      });

      logger.debug(`Socket.io client created with options: ${JSON.stringify({
        reconnection: this.config.autoReconnect,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: this.config.timeout ? this.config.timeout * 1000 : 30000,
        transports: ['websocket'],
        upgrade: false,
      })}`);

      // Handle connection success
      this.socket.on('connect', () => {
        logger.info(`Socket connected event received`);
        this.handleConnect();
        resolve(true);
      });

      // Handle connection error
      this.socket.on('connect_error', (error: Error) => {
        logger.error(`Socket connect_error: ${error.message}`);
        this.handleConnectError(error);
        resolve(false);
      });

      // Handle disconnection
      this.socket.on('disconnect', (reason: string) => {
        logger.info(`Socket disconnected: ${reason}`);
        this.handleDisconnect(reason);
      });

      // Handle incoming messages from Bridge Server
      this.socket.on('message', (data: BridgeMessage) => {
        this.handleMessage(data);
      });

      // Handle specific message types
      this.setupMessageHandlers();

      // Handle errors
      this.socket.on('error', (error: Error) => {
        logger.error(`Socket error: ${error.message}`);
        this.handleError(error);
      });
    });
  }

  /**
   * Setup handlers for specific message types
   */
  private setupMessageHandlers(): void {
    if (!this.socket) return;

    // Command execution request from Bridge
    this.socket.on(BridgeMessageType.COMMAND_REQUEST, async (data: any) => {
      await this.handleCommandRequest(data);
    });

    // Heartbeat from Bridge
    this.socket.on(BridgeMessageType.HEARTBEAT, () => {
      this.sendHeartbeatAck();
    });

    // Session created confirmation
    this.socket.on(BridgeMessageType.AUTHENTICATED, (data: any) => {
      logger.info(`Successfully authenticated with Bridge Server. Session: ${data?.sessionId}`);
      // Data is sent directly, not wrapped in a 'data' property
      this.sessionId = data?.sessionId || data?.id;
      // Start heartbeat to keep connection alive
      this.startHeartbeat();
    });

    // Session closed
    this.socket.on(BridgeMessageType.SESSION_CLOSED, (data: any) => {
      logger.warn(`Session closed: ${data.reason || 'Unknown'}`);
      this.sessionId = undefined;
    });
  }

  /**
   * Handle successful connection
   */
  private handleConnect(): void {
    this.setConnectionState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    logger.info(`Connected to Bridge Server. Socket ID: ${this.socket?.id}`);

    // Authenticate with token
    this.authenticate();
  }

  /**
   * Authenticate with Desktop Connection Token
   */
  private authenticate(): void {
    if (!this.socket || !this.config.token) {
      logger.error('Cannot authenticate: socket or token not available');
      return;
    }

    const authData = {
      token: this.config.token,
      desktopName: this.config.desktopName,
      capabilities: this.getCapabilities(),
    };

    logger.debug(`Sending authentication message: ${JSON.stringify({ ...authData, token: authData.token?.substring(0, 10) + '...' })}`);

    // Emit to 'authenticate' event (not 'message')
    this.socket.emit('authenticate', authData);
    logger.info('Authentication message sent');
  }

  /**
   * Handle connection error
   */
  private handleConnectError(error: Error): void {
    this.setConnectionState(ConnectionState.ERROR);
    logger.error(`Connection error: ${error.message}`);

    if (error.message.includes('Authentication failed')) {
      logger.error('Invalid connection token. Please generate a new one from the web app.');
      process.exit(1);
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(reason: string): void {
    this.setConnectionState(ConnectionState.DISCONNECTED);
    logger.warn(`Disconnected from Bridge Server: ${reason}`);

    this.stopHeartbeat();

    // Handle auto-reconnect if enabled
    if (this.config.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  /**
   * Handle generic error
   */
  private handleError(error: Error): void {
    logger.error(`Socket error: ${error.message}`);
  }

  /**
   * Handle incoming message from Bridge Server
   */
  private handleMessage(data: BridgeMessage): void {
    logger.debug(`Received message from Bridge: ${JSON.stringify(data)}`);

    switch (data.type) {
      case BridgeMessageType.AUTHENTICATED:
        logger.info('Authentication successful');
        this.sessionId = data.data?.sessionId;
        break;

      case BridgeMessageType.SESSION_CREATED:
        logger.info(`Session created: ${data.data?.sessionId}`);
        this.sessionId = data.data?.sessionId;
        break;

      case BridgeMessageType.SESSION_CLOSED:
        logger.warn(`Session closed: ${data.data?.reason}`);
        break;

      default:
        logger.debug(`Unhandled message type: ${data.type}`);
        break;
    }
  }

  /**
   * Handle command execution request from Bridge
   */
  private async handleCommandRequest(data: any): Promise<void> {
    // Bridge sends data directly, not wrapped in a 'data' property
    const { command, requestId, sessionId, trusted } = data || {};
    // Use sessionId from data, or fallback to stored sessionId
    const sid = sessionId || this.sessionId;

    logger.info(`Received command: ${command} (session: ${sid}, requestId: ${requestId}, trusted: ${trusted})`);

    try {
      // Execute command with streaming output
      const result = await this.commandHandler.executeCommand(
        command,
        (output: string) => {
          this.sendCommandOutput(sid, requestId, output);
        },
        (progress: { stdout?: string; stderr?: string }) => {
          this.sendCommandProgress(sid, requestId, progress);
        },
        trusted === true,  // Pass trusted flag
      );

      // Send completion message
      this.sendCommandComplete(sid, requestId, result.result);

    } catch (error: any) {
      logger.error(`Command execution error: ${error.message}`);

      // Send error message
      this.socket?.emit('command_error', {
        sessionId: sid,
        requestId,
        error: error.message,
      });
    }
  }

  /**
   * Send command output to Bridge Server
   */
  private sendCommandOutput(sessionId: string | undefined, requestId: string, output: string): void {
    this.socket?.emit('command_output', {
      sessionId: sessionId || this.sessionId,
      requestId,
      output,
    });
  }

  /**
   * Send command progress to Bridge Server
   */
  private sendCommandProgress(sessionId: string | undefined, requestId: string, progress: { stdout?: string; stderr?: string }): void {
    this.socket?.emit('command_output', {
      sessionId: sessionId || this.sessionId,
      requestId,
      output: progress.stdout || progress.stderr || '',
    });
  }

  /**
   * Send command completion to Bridge Server
   */
  private sendCommandComplete(sessionId: string | undefined, requestId: string, result: any): void {
    this.socket?.emit('command_complete', {
      sessionId: sessionId || this.sessionId,
      requestId,
      result,
    });
    logger.debug(`Command completed: ${requestId}`);
  }

  /**
   * Send heartbeat ack to Bridge Server
   */
  private sendHeartbeatAck(): void {
    const message: DesktopMessage = {
      type: DesktopMessageType.HEARTBEAT,
      data: {
        sessionId: this.sessionId,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.socket?.emit('heartbeat', message.data);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeatAck();
    }, 30000); // Every 30 seconds

    logger.debug('Heartbeat started');
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
      logger.debug('Heartbeat stopped');
    }
  }



  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | undefined {
    return this.sessionId;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED && (this.socket?.connected ?? false);
  }

  /**
   * Disconnect from Bridge Server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.stopHeartbeat();
    logger.info('Disconnected from Bridge Server');
  }

  /**
   * Update connection state
   */
  private setConnectionState(state: ConnectionState): void {
    const previousState = this.connectionState;
    this.connectionState = state;

    if (previousState !== state) {
      logger.debug(`Connection state: ${previousState} → ${state}`);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopHeartbeat();
    this.disconnect();
    this.commandHandler.cleanup();
    logger.info('Desktop client cleanup complete');
  }

  /**
   * Get Socket.io socket instance (for testing purposes)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}
