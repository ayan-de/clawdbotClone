
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BridgeLogger } from '../../logger';
import { DesktopTokensService } from '../../application/desktop-tokens/desktop-tokens.service';
import { ISessionService } from '../../application/session/interfaces/session.service.interface';
import { BaseWebSocketGateway } from './base-websocket.gateway';

/**
 * Desktop Gateway
 * Handles WebSocket connections from Desktop TUI clients
 * Routes commands to desktop and streams output back to Telegram
 *
 * Architecture:
 * Desktop TUI → DesktopGateway (WebSocket) → MessageRouterService → Telegram
 */
@WebSocketGateway({
  namespace: 'desktop',
  cors: { origin: '*' },
})
export class DesktopGateway extends BaseWebSocketGateway implements OnGatewayInit {
  // Map: socketId → sessionId
  private socketToSession = new Map<string, string>();

  // Map: sessionId → socketId (reverse lookup for sendCommand)
  private sessionToSocket = new Map<string, string>();

  // Map: userId → array of session IDs (for that user)
  private userSessions = new Map<string, string[]>();

  constructor(
    @Inject(DesktopTokensService)
    private readonly desktopTokensService: DesktopTokensService,
    @Inject(ISessionService)
    private readonly sessionService: ISessionService,
    @Inject(BridgeLogger)
    bridgeLogger: BridgeLogger,
    @Inject(EventEmitter2)
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(bridgeLogger);
    // Verify DI worked
    if (!this.desktopTokensService) {
      console.error('WARNING: desktopTokensService is undefined after DI!');
    }
  }

  /**
   * Gateway initialization
   */
  afterInit(): void {
    super.afterInit();
    this.logger.log(`Desktop Gateway initialized with namespace: /desktop`);
  }

  /**
   * Desktop client connects
   * Validates connection token and creates session
   */
  handleConnection(client: any): void {
    const socketId = client.id;

    this.logger.log(`Desktop client connecting: ${socketId}, namespace: ${client.nsp?.name}`);

    // Also call parent to add to clients map
    super.handleConnection(client);

    // Wait for authentication message from desktop
    // Timeout after 30 seconds if not authenticated
    const authTimeout = setTimeout(() => {
      if (!this.socketToSession.has(socketId)) {
        this.logger.warn(`Desktop connection timeout: ${socketId}`);
        client.disconnect(true);
      }
    }, 30000);

    client.on('authenticate', async (data: any) => {
      clearTimeout(authTimeout);
      this.logger.log(`Authentication message received from ${socketId}`);

      await this.handleAuthentication(client, data);
    });

    client.on('command_output', async (data: any) => {
      await this.handleCommandOutput(client, data);
    });

    client.on('command_complete', async (data: any) => {
      await this.handleCommandComplete(client, data);
    });

    client.on('command_error', async (data: any) => {
      await this.handleCommandError(client, data);
    });

    client.on('heartbeat', () => {
      (client as any).lastHeartbeat = Date.now();
      client.emit('heartbeat_ack');
    });

    // Handle disconnection
    client.on('disconnect', () => {
      clearTimeout(authTimeout);
      this.handleDisconnection(socketId);
    });
  }

  /**
   * Handle authentication from Desktop TUI
   * Validates Desktop Connection Token and links to user session
   */
  private async handleAuthentication(client: any, data: any): Promise<void> {
    const { token, desktopName, capabilities } = data || {};
    const socketId = client.id;

    this.logger.log(`Authenticating desktop: ${socketId}, desktop: ${desktopName}`);

    // Validate token using DesktopTokensService
    const validation = await this.desktopTokensService.validateToken(token);

    if (!validation.valid || !validation.userId) {
      this.logger.error(`Desktop authentication failed: ${validation.error}`);
      client.emit('auth_error', { error: validation.error });
      client.disconnect(true);
      return;
    }

    const userId = validation.userId;
    this.logger.log(`Desktop authenticated successfully for user: ${userId}`);

    // Get or create session for this desktop
    const session = await this.sessionService.getOrCreateSession(
      { id: userId } as any,
      'desktop',
      { desktopName },
    );

    // Attach desktop to session
    await this.sessionService.attachDesktop(session.id, socketId);

    // Track bidirectional mapping
    this.socketToSession.set(socketId, session.id);
    this.sessionToSocket.set(session.id, socketId);
    this.userSessions.set(userId, (this.userSessions.get(userId) || []).concat(session.id));

    // Send success response
    client.data = { userId, sessionId: session.id };
    client.emit('authenticated', {
      sessionId: session.id,
      userId,
    });

    this.logger.log(`Desktop linked to session: ${session.id}, socket: ${socketId}`);
  }

  /**
   * Handle command output from Desktop TUI
   * Streams output back to Telegram (via MessageRouterService)
   */
  private async handleCommandOutput(client: any, data: any): Promise<void> {
    const { sessionId, requestId, output } = data || {};
    const socketId = client.id;

    if (!sessionId) {
      this.logger.warn(`Command output without sessionId: ${socketId}`);
      return;
    }

    this.logger.debug(`Received output from desktop ${socketId}: ${output?.substring(0, 50)}...`);

    // Find the session
    const session = await this.sessionService.getSession(sessionId);

    if (!session) {
      this.logger.warn(`Session not found: ${sessionId}`);
      return;
    }

    // Emit event for MessageRouterService
    this.eventEmitter.emit('desktop.output', {
      sessionId,
      userId: session.userId,
      requestId,
      output,
      timestamp: Date.now(),
    });

    // Emit to session room (optional, for other observers)
    this.server.to(`session_${sessionId}`).emit('desktop_output', {
      sessionId,
      requestId,
      output,
      timestamp: Date.now(),
    });

    this.logger.debug(`Output forwarded to session: ${sessionId}`);
  }

  /**
   * Handle command completion from Desktop TUI
   */
  private async handleCommandComplete(client: any, data: any): Promise<void> {
    const { sessionId, requestId, result } = data || {};

    if (!sessionId) {
      this.logger.warn(`Command complete without sessionId: ${client.id}`);
      return;
    }

    this.logger.debug(`Command completed: ${result?.command}, success: ${result?.success}`);

    const session = await this.sessionService.getSession(sessionId);

    // Emit event for MessageRouterService
    this.eventEmitter.emit('desktop.complete', {
      sessionId,
      userId: session?.userId,
      requestId,
      result,
      timestamp: Date.now(),
    });

    // Broadcast completion to session room
    this.server.to(`session_${sessionId}`).emit('desktop_complete', {
      sessionId,
      requestId,
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle command error from Desktop TUI
   */
  private async handleCommandError(client: any, data: any): Promise<void> {
    const { sessionId, requestId, error } = data || {};

    if (!sessionId) {
      this.logger.warn(`Command error without sessionId: ${client.id}`);
      return;
    }

    this.logger.error(`Command error: ${error}`);

    const session = await this.sessionService.getSession(sessionId);

    // Emit event for MessageRouterService
    this.eventEmitter.emit('desktop.error', {
      sessionId,
      userId: session?.userId,
      requestId,
      error,
      timestamp: Date.now(),
    });

    // Broadcast error to session room
    this.server.to(`session_${sessionId}`).emit('desktop_error', {
      sessionId,
      requestId,
      error,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle desktop disconnection
   */
  private async handleDisconnection(socketId: string): Promise<void> {
    this.logger.log(`Desktop disconnected: ${socketId}`);

    // Find session for this socket
    const sessionId = this.socketToSession.get(socketId);
    const session = sessionId
      ? await this.sessionService.getSession(sessionId)
      : await this.sessionService.getSessionByDesktopId(socketId);

    if (session) {
      // Detach desktop from session
      await this.sessionService.detachDesktop(session.id);

      // Remove reverse mapping
      this.sessionToSocket.delete(session.id);

      // Remove from user sessions tracking
      if (session.userId) {
        const userSessions = this.userSessions.get(session.userId) || [];
        const updatedSessions = userSessions.filter((id) => id !== session.id);
        this.userSessions.set(session.userId, updatedSessions);
      }
    }

    // Remove from socket-to-session tracking
    this.socketToSession.delete(socketId);

    // Call parent's disconnect handler
    const client = this.clients.get(socketId);
    if (client) {
      super.handleDisconnect(client);
    }

    this.logger.log(`Desktop connection closed: ${socketId}`);
  }

  /**
   * Send command to Desktop TUI
   * Called by MessageRouterService when user sends command via Telegram
   */
  async sendCommand(sessionId: string, command: string, requestId?: string): Promise<void> {
    this.logger.log(`Sending command to session: ${sessionId}, command: ${command}`);

    const socketId = this.sessionToSocket.get(sessionId);

    if (!socketId) {
      this.logger.warn(`No desktop connected for session: ${sessionId}. Known sessions: ${Array.from(this.sessionToSocket.keys()).join(', ')}`);
      throw new Error('No desktop connected for this session');
    }

    this.logger.log(`Emitting command_request to socket: ${socketId}`);

    this.server.to(socketId).emit('command_request', {
      sessionId,
      requestId: requestId || `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      command,
      timestamp: Date.now(),
    });
  }

  /**
   * Get connected desktops for a user
   */
  async getConnectedDesktops(userId: string): Promise<{ sessionId: string; desktopName?: string }[]> {
    const sessionIds = this.userSessions.get(userId) || [];

    const sessions: any[] = [];
    for (const sessionId of sessionIds) {
      const session = await this.sessionService.getSession(sessionId);
      if (session) {
        sessions.push({
          sessionId: session.id,
          desktopName: session.metadata?.desktopName,
        });
      }
    }

    return sessions;
  }

  /**
   * Get active desktop count for a user
   */
  getActiveDesktopCount(userId: string): number {
    return (this.userSessions.get(userId) || []).length;
  }

  /**
   * Disconnect all desktops for a user
   */
  async disconnectAllDesktops(userId: string): Promise<void> {
    const sessionIds = this.userSessions.get(userId) || [];

    for (const sessionId of sessionIds) {
      const session = await this.sessionService.getSession(sessionId);
      if (session && session.desktopId) {
        const socket = this.clients.get(session.desktopId);
        if (socket) {
          socket.disconnect(true);
        }
      }
    }
  }
}
