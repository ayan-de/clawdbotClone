import { EntityRepository, Repository } from 'typeorm';
import { Session } from '../../application/domain/entities/session.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISessionRepository } from './interfaces/session.repository.interface';

@Injectable()
export class SessionRepository implements ISessionRepository {
    constructor(
        @InjectRepository(Session)
        private readonly repository: Repository<Session>,
    ) { }

    async create(session: Partial<Session>): Promise<Session> {
        return this.repository.save(session);
    }

    async findActiveByUserId(userId: string): Promise<Session | null> {
        return this.repository.findOne({
            where: { userId, status: 'active' },
            order: { createdAt: 'DESC' },
        });
    }

    async findById(id: string): Promise<Session | null> {
        return this.repository.findOne({ where: { id } });
    }

    async update(id: string, update: Partial<Session>): Promise<void> {
        await this.repository.update(id, update);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async findByUserId(userId: string): Promise<Session[]> {
        return this.repository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async findByDesktopId(desktopId: string): Promise<Session | null> {
        return this.repository.findOne({ where: { desktopId, status: 'active' } });
    }
}
