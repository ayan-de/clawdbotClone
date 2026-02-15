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
  private _clients: Map<string, Socket> | null = null;

  constructor(protected readonly bridgeLogger: BridgeLogger) {
    this._logger = new Logger(this.constructor.name);
    this._logger.log(`BaseWebSocketGateway constructor called for ${this.constructor.name}`);
  }

  protected get clients(): Map<string, Socket> {
    if (!this._clients) {
      this._clients = new Map<string, Socket>();
    }
    return this._clients;
  }

  protected set clients(value: Map<string, Socket>) {
    this._clients = value;
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
    if (!this._clients) {
      this._clients = new Map<string, Socket>();
    }
    this.logger.log(`WebSocket Gateway initialized: ${this.constructor.name}`);
    this.setupHeartbeat();
  }

  /**
   * Client connection
   */
  handleConnection(client: Socket): void {
    if (!this._clients) {
      this._clients = new Map<string, Socket>();
    }
    this._clients.set(client.id, client);
    (client as any).connectedAt = Date.now();
    (client as any).lastHeartbeat = Date.now();

    this.logger.debug(`Client connected: ${client.id} (Total: ${this._clients.size})`);

    // Send connected event
    client.emit('connected', {
      sessionId: (client as any).sessionId,
      timestamp: Date.now(),
    });
  }

  /**
   * Client disconnection
   */
  handleDisconnect(client: Socket): void {
    if (this._clients) {
      this._clients.delete(client.id);
      this.logger.debug(`Client disconnected: ${client.id} (Total: ${this._clients.size})`);
    } else {
      this.logger.debug(`Client disconnected: ${client.id}`);
    }
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
    if (!this._clients) {
      return;
    }

    const now = Date.now();
    const HEARTBEAT_TIMEOUT = 120000; // 2 minutes

    // Convert keys to array to avoid modification during iteration issues
    const clientIds = Array.from(this._clients.keys());

    for (const clientId of clientIds) {
      const client = this._clients.get(clientId);
      if (!client) continue;

      const lastHeartbeat = (client as any).lastHeartbeat || (client as any).connectedAt || now;

      if (now - lastHeartbeat > HEARTBEAT_TIMEOUT) {
        this.logger.warn(`Stale client detected: ${clientId}`);
        client.disconnect(true);
        this._clients.delete(clientId);
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
