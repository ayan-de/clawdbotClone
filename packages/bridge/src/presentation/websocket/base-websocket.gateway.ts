import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { BridgeLogger } from '../../logger';

/**
 * Base WebSocket Gateway
 * Provides common functionality for all WebSocket gateways
 * Follows Template Method Pattern - base class with shared logic
 *
 * @example
 * @WebSocketGateway({ namespace: 'desktop', cors: { origin: '*' } })
 * export class DesktopGateway extends BaseWebSocketGateway {
 *   @SubscribeMessage('message')
 *   handleMessage(client: Socket, data: any) {
 *     // Handle message
 *   }
 * }
 */
export abstract class BaseWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  protected server!: Server;

  private _logger: Logger | null = null;
  protected clients = new Map<string, Socket>();

  constructor(protected readonly bridgeLogger: BridgeLogger) {
    this._logger = new Logger(this.constructor.name);
  }

  protected get logger(): Logger {
    if (!this._logger) {
      this._logger = new Logger(this.constructor.name);
    }
    return this._logger;
  }

  /**
   * Gateway initialization
   */
  afterInit(): void {
    this.logger.log(`WebSocket Gateway initialized: ${this.constructor.name}`);
    this.logger.debug(`Clients map initialized: ${!!this.clients}, size: ${this.clients?.size}`);
    this.setupHeartbeat();
  }

  /**
   * Client connection
   */
  handleConnection(client: Socket): void {
    this.clients.set(client.id, client);
    this.logger.debug(`Client connected: ${client.id} (Total: ${this.clients.size})`);

    // Send connected event
    client.emit('connected', {
      sessionId: (client as any).sessionId,
    });
  }

  /**
   * Client disconnection
   */
  handleDisconnect(client: Socket): void {
    this.clients.delete(client.id);
    const userId = (client as any).user?.id;

    this.logger.debug(
      `Client disconnected: ${client.id} (Total: ${this.clients.size})`,
    );

    // Send disconnected event
    client.emit('disconnected', {
      reason: client.data?.reason || 'client_disconnect',
    });
  }

  /**
   * Gateway destruction
   */
  beforeDestroy(): void {
    this.logger.log(
      `WebSocket Gateway destroying: ${this.constructor.name}`,
    );
    // Clear all clients
    this.clients.clear();
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any): void {
    this.server.emit(event, {
      event,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast to specific room
   */
  broadcastToRoom(room: string, event: string, data: any): void {
    this.server.to(room).emit(event, {
      event,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Send to specific client
   */
  sendToClient(clientId: string, event: string, data: any): boolean {
    const client = this.clients.get(clientId);

    if (!client) {
      this.logger.warn(`Client not found: ${clientId}`);
      return false;
    }

    client.emit(event, {
      event,
      data,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Send error to client
   */
  sendError(clientId: string, message: string, code?: string): void {
    this.sendToClient(clientId, 'error', { message, code });
  }

  /**
   * Get connected clients
   */
  getConnectedClients(): Socket[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Setup heartbeat mechanism
   * Detects stale connections and cleans them up
   */
  private setupHeartbeat(): void {
    // Heartbeat check every 30 seconds
    const heartbeatInterval = setInterval(() => {
      this.checkHeartbeat();
    }, 30000);

    // Cleanup on destroy
    process.on('beforeExit', () => {
      clearInterval(heartbeatInterval);
    });
  }

  /**
   * Check heartbeat of all clients
   */
  private checkHeartbeat(): void {
    if (!this.clients) {
      this.logger.warn(`Clients map not initialized in checkHeartbeat. Keys on this: ${Object.keys(this)}`);
      return;
    }

    const now = Date.now();
    const STALE_TIMEOUT = 120000; // 2 minutes

    for (const [clientId, client] of this.clients.entries()) {
      const lastHeartbeat = (client as any).lastHeartbeat || 0;

      if (now - lastHeartbeat > STALE_TIMEOUT) {
        this.logger.warn(`Stale client detected: ${clientId}`);
        client.disconnect(true);
        this.clients.delete(clientId);
      }
    }
  }

  /**
   * Handle heartbeat ping from client
   */
  protected handlePing(client: Socket, data: { timestamp?: number }): void {
    (client as any).lastHeartbeat = Date.now();
    (client as any).isAlive = true;

    // Respond with pong
    client.emit('pong', { timestamp: Date.now() });
  }
}
