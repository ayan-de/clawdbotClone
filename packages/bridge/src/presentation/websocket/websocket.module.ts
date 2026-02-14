import { Module } from '@nestjs/common';
import { BridgeLogger } from '../../logger';
import { AuthService } from '../../application/auth';
import { BridgeWebSocketGateway } from './bridge-websocket.gateway';
import { ConfigModule } from '../../config';

/**
 * WebSocket Module
 * Provides real-time communication functionality
 * Follows SOLID - Single Responsibility: Only handles WebSocket connections
 */
@Module({
  imports: [ConfigModule],
  providers: [
    BridgeLogger,
    {
      provide: AuthService,
      useExisting: AuthService,
    },
    BridgeWebSocketGateway,
  ],
  exports: [BridgeWebSocketGateway],
})
export class WebSocketModule {}
