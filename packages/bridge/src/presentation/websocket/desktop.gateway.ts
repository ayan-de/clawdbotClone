
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BridgeLogger } from '../../logger';
import { DesktopConnectionToken } from '../../application/domain/entities/desktop-connection-token.entity';
import { ISessionService } from '../../application/session/interfaces/session.service.interface';
import { BaseWebSocketGateway } from './base-websocket.gateway';

/**
 * Desktop Gateway
 * Handles WebSocket connections from Desktop TUI clients
 * Routes commands to desktop and streams output back to Telegram
 *
 * Architecture:
 * Desktop TUI → DesktopGateway (WebSocket) → MessageRouterService → Telegram
 *
 * NOTE: Services are resolved via ModuleRef/DataSource because NestJS gateway
 * constructor DI is unreliable when extending a base class.
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

  // Resolved lazily — gateway constructor DI is unreliable
  private dataSource!: DataSource;
  private sessionService!: ISessionService;
  private eventEmitter!: EventEmitter2;

  constructor(
    bridgeLogger: BridgeLogger,
    private readonly moduleRef: ModuleRef,
  ) {
    super(bridgeLogger);
  }

  /**
   * Gateway initialization — resolve services via ModuleRef
   */
  afterInit(): void {
    super.afterInit();

    // Resolve services via ModuleRef — DataSource is @Global() and always available
    this.dataSource = this.moduleRef.get(DataSource, { strict: false });
    this.sessionService = this.moduleRef.get(ISessionService, { strict: false });
    this.eventEmitter = this.moduleRef.get(EventEmitter2, { strict: false });

    this.logger.log(`Desktop Gateway initialized with namespace: /desktop`);
    this.logger.log(`Services resolved — dataSource: ${!!this.dataSource}, session: ${!!this.sessionService}, events: ${!!this.eventEmitter}`);
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

      try {
        await this.handleAuthentication(client, data);
      } catch (error: any) {
        this.logger.error(`Authentication failed for ${socketId}: ${error.message}`);
        this.logger.error(`Stack: ${error.stack}`);
        client.emit('auth_error', { error: error.message || 'Authentication failed' });
        client.disconnect(true);
      }
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
   * Validate a desktop connection token directly using DataSource
   * Bypasses DesktopTokensService because ModuleRef fails to resolve its dependencies
   */
  private async validateTokenDirect(token: string): Promise<{
    valid: boolean;
    userId?: string;
    desktopName?: string;
    error?: string;
  }> {
    const repo = this.dataSource.getRepository(DesktopConnectionToken);

    const tokenEntity = await repo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!tokenEntity) {
      this.logger.warn(`Invalid desktop connection token attempted: ${token}`);
      return { valid: false, error: 'Invalid connection token' };
    }

    if (tokenEntity.expiresAt < new Date()) {
      this.logger.warn(`Expired desktop connection token: ${token}`);
      return { valid: false, error: 'Connection token has expired. Please generate a new one.' };
    }

    if (tokenEntity.used) {
      this.logger.warn(`Already used desktop connection token: ${token}`);
      return { valid: false, error: 'Connection token has already been used. Please generate a new one.' };
    }

    // Mark token as used
    await repo.update(tokenEntity.id, {
      used: true,
      usedAt: new Date(),
    });

    this.logger.log(`Desktop connection token validated for user ${tokenEntity.userId}`);

    return {
      valid: true,
      userId: tokenEntity.userId,
      desktopName: tokenEntity.desktopName,
    };
  }

  /**
   * Handle desktop authentication
   */
  private async handleAuthentication(client: any, data: any): Promise<void> {
    const { token, desktopName, capabilities } = data || {};
    const socketId = client.id;

    this.logger.log(`Authenticating desktop: ${socketId}, desktop: ${desktopName}`);

    // Validate token directly via DataSource (reliable, bypasses broken ModuleRef chain)
    const validation = await this.validateTokenDirect(token);

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

    // Emit desktop.connected event so MessageRouter can notify Telegram
    this.eventEmitter.emit('desktop.connected', {
      userId,
      sessionId: session.id,
      desktopName: desktopName || capabilities?.hostname || 'Unknown',
    });

    this.logger.log(`Desktop linked to session: ${session.id}, socket: ${socketId}`);
  }

  /**
   * Handle command output from desktop
   */
  private async handleCommandOutput(client: any, data: any): Promise<void> {
    const { sessionId, requestId, output } = data || {};
    const userId = client.data?.userId;

    if (!userId || !output) return;

    this.logger.debug(`Command output from ${client.id}: ${output?.substring(0, 80)}`);

    // Emit event for MessageRouter to route to Telegram
    this.eventEmitter.emit('desktop.output', {
      userId,
      sessionId,
      requestId,
      output,
    });
  }

  /**
   * Handle command completion from desktop
   */
  private async handleCommandComplete(client: any, data: any): Promise<void> {
    const { sessionId, requestId, result } = data || {};
    const userId = client.data?.userId;

    if (!userId) return;

    this.logger.debug(`Command complete from ${client.id}: ${requestId}`);

    // Emit event for MessageRouter to route to Telegram
    this.eventEmitter.emit('desktop.complete', {
      userId,
      sessionId,
      requestId,
      result,
    });
  }

  /**
   * Handle command error from desktop
   */
  private async handleCommandError(client: any, data: any): Promise<void> {
    const { sessionId, requestId, error } = data || {};
    const userId = client.data?.userId;

    if (!userId) return;

    this.logger.error(`Command error from ${client.id}: ${error}`);

    // Emit event for MessageRouter to route to Telegram
    this.eventEmitter.emit('desktop.error', {
      userId,
      sessionId,
      requestId,
      error,
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
  async sendCommand(sessionId: string, command: string, requestId?: string, trusted: boolean = false): Promise<void> {
    this.logger.log(`Sending command to session: ${sessionId}, command: ${command}, trusted: ${trusted}`);

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
      trusted,
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
      const socketId = this.sessionToSocket.get(sessionId);
      if (socketId) {
        const client = this.clients.get(socketId);
        if (client) {
          client.disconnect(true);
        }
      }
    }
  }

  /**
   * Get the first available session ID
   * Used by REST API command execution when no specific session is provided
   *
   * @returns First available session ID or null
   */
  getFirstAvailableSession(): string | null {
    const sessionIds = Array.from(this.sessionToSocket.keys());
    return sessionIds.length > 0 ? sessionIds[0] : null;
  }

  /**
   * Get all available session IDs
   *
   * @returns Array of all active session IDs
   */
  getAllSessionIds(): string[] {
    return Array.from(this.sessionToSocket.keys());
  }

  /**
   * Check if a session is connected
   *
   * @param sessionId Session ID to check
   * @returns True if session is connected
   */
  isSessionConnected(sessionId: string): boolean {
    return this.sessionToSocket.has(sessionId);
  }
}
