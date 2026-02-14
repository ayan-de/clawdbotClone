import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BridgeLogger } from '../../logger';
import { AuthModule } from '../../application/auth';
import { BridgeWebSocketGateway } from './bridge-websocket.gateway';
import { DesktopGateway } from './desktop.gateway';
import { IDesktopGateway } from './interfaces/desktop-gateway.interface';
import { ConfigModule } from '../../config';
import { SessionModule } from '../../application/session/session.module';

/**
 * WebSocket Module
 * Provides real-time communication functionality
 * Follows SOLID - Single Responsibility: Only handles WebSocket connections
 */
@Module({
  imports: [ConfigModule, EventEmitterModule, SessionModule, AuthModule],
  providers: [
    BridgeLogger,
    BridgeWebSocketGateway,
    {
      provide: IDesktopGateway,
      useClass: DesktopGateway,
    },
    DesktopGateway, // Providing concrete class too for internal module consumption if needed (e.g. BridgeWebSocketGateway)
  ],
  exports: [BridgeWebSocketGateway, IDesktopGateway],
})
export class WebSocketModule { }
