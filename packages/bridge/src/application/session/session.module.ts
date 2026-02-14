import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionService } from './session.service';
import { SessionRepository } from '../../infrastructure/repositories/session.repository';
import { Session } from '../domain/entities/session.entity';
import { ISessionRepository } from '../../infrastructure/repositories/interfaces/session.repository.interface';
import { ISessionService } from './interfaces/session.service.interface';

@Module({
    imports: [TypeOrmModule.forFeature([Session])],
    providers: [
        {
            provide: ISessionService,
            useClass: SessionService,
        },
        SessionService, // Keep the concrete class too if needed, but rarely. Let's remove it if possible or alias it.
        // Actually best is to just provide the interface.
        // If internal components rely on SessionService (concrete), they might break.
        // But usually we should rely on interfaces.
        // However, standard practice:
        // providers: [SessionService] -> provides Token: SessionService, Value: SessionService instance
        // We want Token: ISessionService, Value: SessionService instance
        // If we also want Token: SessionService for legacy/other injection, we can use useExisting.
        // But let's assume we want to enforce interface usage.
        {
            provide: ISessionRepository,
            useClass: SessionRepository,
        },
    ],
    exports: [ISessionService],
})
export class SessionModule { }
