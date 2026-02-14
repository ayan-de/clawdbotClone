import {
    WebSocketGateway,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BridgeLogger } from '../../logger';
import { BaseWebSocketGateway } from './base-websocket.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IDesktopGateway } from './interfaces/desktop-gateway.interface';

/**
 * Desktop WebSocket Gateway
 * Handles connections from Desktop TUI clients
 */
@WebSocketGateway({
    namespace: 'desktop',
    cors: {
        origin: '*',
    },
})
export class DesktopGateway
    extends BaseWebSocketGateway
    implements IDesktopGateway, OnGatewayConnection, OnGatewayDisconnect {

    private readonly desktopSockets = new Map<string, Socket>();

    constructor(
        bridgeLogger: BridgeLogger,
        private readonly eventEmitter: EventEmitter2,
    ) {
        super(bridgeLogger);
    }

    override handleConnection(client: Socket) {
        super.handleConnection(client);
        this.logger.log(`Desktop connected: ${client.id}`);

        // Require registration within 5 seconds
        setTimeout(() => {
            if (!this.desktopSockets.has(client.id)) {
                this.logger.warn(`Desktop ${client.id} failed to register in time`);
                client.disconnect();
            }
        }, 5000);
    }

    override handleDisconnect(client: Socket) {
        super.handleDisconnect(client);
        this.desktopSockets.delete(client.id);
        this.eventEmitter.emit('desktop.disconnected', { socketId: client.id });
    }

    /**
     * Handle desktop registration
     */
    @SubscribeMessage('register')
    handleRegister(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { id: string; capabilities: string[] },
    ) {
        this.logger.log(`Desktop registered: ${body.id} (${client.id})`);
        this.desktopSockets.set(client.id, client);

        // Notify system that a desktop is available
        this.eventEmitter.emit('desktop.registered', {
            id: body.id,
            socketId: client.id,
            capabilities: body.capabilities
        });

        return { status: 'ok' };
    }

    /**
     * Handle command result from desktop
     */
    @SubscribeMessage('result')
    handleResult(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: any,
    ) {
        this.logger.debug(`Received result from desktop: ${JSON.stringify(body).substring(0, 100)}...`);
        this.eventEmitter.emit('command.result', body);
    }

    /**
     * Send command to a specific desktop socket
     */
    sendCommand(socketId: string, command: any): boolean {
        const socket = this.desktopSockets.get(socketId);
        if (socket) {
            socket.emit('execute', command);
            return true;
        }
        return false;
    }

    /**
     * Get first available desktop (Simple MVP Logic)
     */
    getFirstAvailableDesktop(): string | null {
        if (this.desktopSockets.size === 0) return null;
        return this.desktopSockets.keys().next().value || null;
    }

    /**
     * Get all connected desktop socket IDs
     */
    getConnectedDesktops(): string[] {
        return Array.from(this.desktopSockets.keys());
    }

    /**
     * Check if a desktop socket is connected
     */
    isDesktopConnected(socketId: string): boolean {
        return this.desktopSockets.has(socketId);
    }
}
