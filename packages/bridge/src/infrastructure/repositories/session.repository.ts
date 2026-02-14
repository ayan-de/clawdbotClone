import { EntityRepository, Repository } from 'typeorm';
import { Session } from '../../application/domain/entities/session.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SessionRepository {
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
}
