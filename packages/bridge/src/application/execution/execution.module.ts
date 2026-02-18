import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CommandOrchestratorService } from './command-orchestrator.service';
import { UserOrchestrationService } from './user-orchestration.service';
import { DesktopSelectorService } from './desktop-selector.service';
import { AgentService } from './agent.service';
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
        HttpModule,
        WebSocketModule,
        forwardRef(() => AdaptersModule),
        SessionModule,
        UsersModule,
        EventEmitterModule,
    ],
    providers: [
        CommandOrchestratorService,
        UserOrchestrationService,
        DesktopSelectorService,
        AgentService,
    ],
    exports: [
        CommandOrchestratorService,
        UserOrchestrationService,
        DesktopSelectorService,
        AgentService,
    ],
})
export class ExecutionModule { }
