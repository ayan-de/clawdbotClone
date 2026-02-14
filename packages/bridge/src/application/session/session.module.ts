import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionService } from './session.service';
import { SessionRepository } from '../../infrastructure/repositories/session.repository';
import { Session } from '../domain/entities/session.entity';
import { User } from '../domain/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Session])],
    providers: [SessionService, SessionRepository],
    exports: [SessionService],
})
export class SessionModule { }
