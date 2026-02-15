import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BridgeLogger } from '../../logger';
import { AuthModule } from '../../application/auth';
import { BridgeWebSocketGateway } from './bridge-websocket.gateway';
import { DesktopGateway } from './desktop.gateway';
import { IDesktopGateway } from './interfaces/desktop-gateway.interface';
import { ConfigModule } from '../../config';
import { SessionModule } from '../../application/session/session.module';
import { DesktopTokensModule } from '../../application/desktop-tokens/desktop-tokens.module';

/**
 * WebSocket Module
 * Provides real-time communication functionality
 * Follows SOLID - Single Responsibility: Only handles WebSocket connections
 */
@Module({
  imports: [
    ConfigModule,
    EventEmitterModule,
    SessionModule,
    AuthModule,
    DesktopTokensModule,
  ],
  providers: [
    BridgeLogger,
    BridgeWebSocketGateway,
    DesktopGateway,
    {
      provide: IDesktopGateway,
      useExisting: DesktopGateway,
    },
  ],
  exports: [BridgeWebSocketGateway, DesktopGateway, IDesktopGateway],
})
export class WebSocketModule { }
