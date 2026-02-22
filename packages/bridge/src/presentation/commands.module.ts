import { Module } from '@nestjs/common';
import { CommandsController } from './controllers/commands.controller';
import { CommandsService } from './services/commands.service';
import { WebSocketModule } from './websocket';

/**
 * Commands Module
 *
 * Provides REST API endpoints for command execution.
 * Coordinates with Desktop Gateway via WebSocket to execute commands.
 */
@Module({
  imports: [WebSocketModule],
  controllers: [CommandsController],
  providers: [CommandsService],
  exports: [CommandsService],
})
export class CommandsModule {}
