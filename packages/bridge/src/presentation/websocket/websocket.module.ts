import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BridgeLogger } from '../../logger';
import { AuthService } from '../../application/auth';
import { BridgeWebSocketGateway } from './bridge-websocket.gateway';
import { DesktopGateway } from './desktop.gateway';
import { ConfigModule } from '../../config';

/**
 * WebSocket Module
 * Provides real-time communication functionality
 * Follows SOLID - Single Responsibility: Only handles WebSocket connections
 */
@Module({
  imports: [ConfigModule, EventEmitterModule],
  providers: [
    BridgeLogger,
    {
      provide: AuthService,
      useExisting: AuthService,
    },
    BridgeWebSocketGateway,
    DesktopGateway,
  ],
  exports: [BridgeWebSocketGateway, DesktopGateway],
})
export class WebSocketModule { }
