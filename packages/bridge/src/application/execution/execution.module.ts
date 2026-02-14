import { Module } from '@nestjs/common';
import { CommandExecutionService } from './command-execution.service';
import { WebSocketModule } from '../../presentation/websocket/websocket.module';
import { AdaptersModule } from '../adapters/adapters.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

/**
 * Execution Module
 * Coordinates command execution between Adapters and Desktop
 */
@Module({
    imports: [
        WebSocketModule,
        AdaptersModule,
        EventEmitterModule,
    ],
    providers: [CommandExecutionService],
    exports: [CommandExecutionService],
})
export class ExecutionModule { }
