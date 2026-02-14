import { Module } from '@nestjs/common';
import { CommandOrchestratorService } from './command-orchestrator.service';
import { UserOrchestrationService } from './user-orchestration.service';
import { DesktopSelectorService } from './desktop-selector.service';
import { WebSocketModule } from '../../presentation/websocket/websocket.module';
import { AdaptersModule } from '../adapters/adapters.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

/**
 * Execution Module
 * Coordinates command execution between Adapters and Desktop
 * Follows Single Responsibility Principle - split into focused services
 */
@Module({
    imports: [
        WebSocketModule,
        AdaptersModule,
        SessionModule,
        UsersModule,
        EventEmitterModule,
    ],
    providers: [
        CommandOrchestratorService,
        UserOrchestrationService,
        DesktopSelectorService,
    ],
    exports: [
        CommandOrchestratorService,
        UserOrchestrationService,
        DesktopSelectorService,
    ],
})
export class ExecutionModule { }
