import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnauthorizedException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../application/auth';
import { BridgeLogger } from '../../logger';
import { BaseWebSocketGateway } from './base-websocket.gateway';
import { GatewayAuth } from './decorators';
import { User } from '../../application/domain/entities';
import { ISessionService } from '../../application/session/interfaces/session.service.interface';

/**
 * Bridge WebSocket Gateway
 * Handles real-time communication with desktop clients
 * Provides session-based message routing for command execution
 *
 * @example connection:
 * const socket = io('ws://localhost:3000');
 * socket.emit('auth:token', { token: 'jwt_token' });
 */
@WebSocketGateway({
  namespace: 'bridge',
  cors: {
    origin: '*', // Configure from environment in production
    credentials: true,
  },
})
export class BridgeWebSocketGateway
  extends BaseWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    bridgeLogger: BridgeLogger,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly sessionService: ISessionService,
  ) {
    super(bridgeLogger);
  }

  /**
   * Handle client connection
   * Wait for authentication before fully accepting
   */
  override handleConnection(client: Socket): void {
    (client as any).isAuthenticated = false;
    (client as any).lastHeartbeat = Date.now();
    (client as any).isAlive = true;

    // Set connection timeout - client must authenticate within 10 seconds
    const authTimeout = setTimeout(() => {
      if (!(client as any).isAuthenticated) {
        this.logger.warn(
          `Client authentication timeout: ${client.id}`,
        );
        client.emit('auth:error', {
          message: 'Authentication timeout',
        });
        client.disconnect(true);
      }
    }, 10000);

    // Store timeout for cleanup
    (client as any).authTimeout = authTimeout;

    this.logger.debug(
      `Client connecting: ${client.id}`,
    );
  }

  /**
   * Handle client disconnection
   */
  override handleDisconnect(client: Socket): void {
    // Clear auth timeout
    if ((client as any).authTimeout) {
      clearTimeout((client as any).authTimeout);
    }

    const userId = (client as any).user?.id;
    const sessionId = (client as any).sessionId;

    if (sessionId) {
      // Leave session room
      client.leave(`session:${sessionId}`);
      this.logger.debug(
        `Client left session: ${sessionId}`,
      );
    }

    // Log disconnection
    this.logger.log(
      `Client disconnected: ${client.id} | User: ${userId} | Session: ${sessionId}`,
    );

    // Cleanup
    this.clients.delete(client.id);
  }

  /**
   * Authenticate client with JWT token
   */
  @SubscribeMessage('auth:token')
  async handleAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { token: string },
  ): Promise<void> {
    try {
      const { token } = body;

      if (!token) {
        throw new BadRequestException('Token is required');
      }

      // Verify token
      const user = await this.authService.validateUser(
        this.authService.verifyToken(token),
      );

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Clear auth timeout
      if ((client as any).authTimeout) {
        clearTimeout((client as any).authTimeout);
      }

      // Mark client as authenticated
      (client as any).isAuthenticated = true;
      (client as any).user = user;
      (client as any).userId = user.id;

      // Join user-specific room
      client.join(`user:${user.id}`);

      this.logger.log(
        `Client authenticated: ${client.id} | User: ${user.email}`,
      );

      // Send success event
      client.emit('auth:success', {
        user,
      });
    } catch (error: any) {
      this.logger.error(
        `Authentication failed for client ${client.id}: ${error.message}`,
      );
      client.emit('auth:error', {
        message: error.message || 'Authentication failed',
      });
      client.disconnect(true);
    }
  }

  /**
   * Handle heartbeat ping from client
   */
  @SubscribeMessage('ping')
  override handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { timestamp?: number },
  ): void {
    super.handlePing(client, body);
  }

  /**
   * Handle command execution request
   */
  @SubscribeMessage('command:execute')
  async handleCommandExecute(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: {
      sessionId: string;
      command: string;
      userMessage?: string;
    },
    @GatewayAuth() user: User,
  ): Promise<void> {
    const { sessionId, command, userMessage } = body;

    if (!sessionId || !command) {
      client.emit('error', {
        message: 'sessionId and command are required',
      });
      return;
    }

    // Validate session ownership (to be implemented in session module)
    // For now, allow all authenticated users to execute commands

    // Join session room for streaming output
    client.join(`session:${sessionId}`);
    (client as any).sessionId = sessionId;

    this.logger.log(
      `Command execution requested: ${sessionId} by ${user.email}`,
    );

    // Emit command to execution service (to be implemented)
    this.server.to('command-executor').emit('command:execute', {
      sessionId,
      command,
      userMessage,
      userId: user.id,
    });

    // Acknowledge command received
    client.emit('command:started', {
      sessionId,
      command,
    });
  }

  /**
   * Handle command cancellation
   */
  @SubscribeMessage('command:cancel')
  handleCommandCancel(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { sessionId: string },
    @GatewayAuth() user: User,
  ): void {
    const { sessionId } = body;

    if (!sessionId) {
      client.emit('error', {
        message: 'sessionId is required',
      });
      return;
    }

    this.logger.log(
      `Command cancellation requested: ${sessionId} by ${user.email}`,
    );

    // Emit cancel event to execution service
    this.server.to('command-executor').emit('command:cancel', {
      sessionId,
      userId: user.id,
    });

    client.emit('command:progress', {
      sessionId,
      progress: -1, // Cancelled
      message: 'Command cancelled',
    });
  }

  /**
   * Handle session join
   */
  @SubscribeMessage('session:join')
  async handleSessionJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { sessionId: string },
    @GatewayAuth() user: User,
  ): Promise<void> {
    try {
      const { sessionId } = body;

      const session = await this.sessionService.getSession(sessionId);

      if (!session) {
        throw new NotFoundException(`Session ${sessionId} not found`);
      }

      if (session.userId !== user.id) {
        throw new ForbiddenException(`You do not have access to session ${sessionId}`);
      }

      client.join(`session:${sessionId}`);
      (client as any).sessionId = sessionId;

      this.logger.log(
        `Client joined session: ${sessionId} by ${user.email}`,
      );

      client.emit('session:joined', {
        sessionId,
        userId: user.id,
        status: 'ok'
      });
    } catch (error: any) {
      this.logger.error(`Session join failed: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  /**
   * Handle session leave
   */
  @SubscribeMessage('session:leave')
  handleSessionLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { sessionId: string },
    @GatewayAuth() user: User,
  ): void {
    const { sessionId } = body;

    client.leave(`session:${sessionId}`);

    if ((client as any).sessionId === sessionId) {
      (client as any).sessionId = undefined;
    }

    this.logger.log(
      `Client left session: ${sessionId} by ${user.email}`,
    );
  }

  /**
   * Broadcast message to session
   * Used by other services to send updates to all clients in a session
   */
  broadcastToSession(sessionId: string, event: string, data: any): void {
    this.broadcastToRoom(`session:${sessionId}`, event, data);
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, event: string, data: any): void {
    this.broadcastToRoom(`user:${userId}`, event, data);
  }
}
