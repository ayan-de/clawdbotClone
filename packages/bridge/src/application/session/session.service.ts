import { Injectable, Logger } from '@nestjs/common';
import { ISessionRepository } from '../../infrastructure/repositories/interfaces/session.repository.interface';
import { Session } from '../domain/entities/session.entity';
import { User } from '../domain/entities/user.entity';
import { ISessionService } from './interfaces/session.service.interface';

@Injectable()
export class SessionService implements ISessionService {
    private readonly logger = new Logger(SessionService.name);

    constructor(
        private readonly sessionRepository: ISessionRepository,
    ) { }

    /**
     * Get or create a session for a user
     */
    async getOrCreateSession(
        user: User,
        platform: string,
        platformMetadata?: Record<string, any>
    ): Promise<Session> {
        // Find existing active session
        const existingSession = await this.sessionRepository.findActiveByUserId(user.id);

        if (existingSession) {
            // Reuse active session for the same user
            return existingSession;
        }

        // Create new session
        const newSession = await this.sessionRepository.create({
            userId: user.id,
            status: 'active',
            desktopName: platformMetadata?.desktopName,
            metadata: {
                platform,
                ...platformMetadata
            }
        });

        this.logger.log(`Created new session ${newSession.id} for user ${user.id} on ${platform}`);
        return newSession;
    }

    /**
     * Attach a desktop to a session
     */
    async attachDesktop(sessionId: string, desktopSocketId: string): Promise<void> {
        await this.sessionRepository.update(sessionId, { desktopId: desktopSocketId });
        this.logger.log(`Attached desktop ${desktopSocketId} to session ${sessionId}`);
    }

    /**
     * Detach a desktop from a session
     */
    async detachDesktop(sessionId: string): Promise<void> {
        await this.sessionRepository.update(sessionId, { desktopId: undefined });
        this.logger.log(`Detached desktop from session ${sessionId}`);
    }

    /**
     * Close a session
     */
    async closeSession(sessionId: string): Promise<void> {
        await this.sessionRepository.update(sessionId, { status: 'closed' });
        this.logger.log(`Closed session ${sessionId}`);
    }

    /**
     * Get session by ID
     */
    async getSession(sessionId: string): Promise<Session | null> {
        return this.sessionRepository.findById(sessionId);
    }

    /**
     * Get all active sessions for a user
     */
    async getActiveSessionsByUserId(userId: string): Promise<Session[]> {
        const sessions = await this.sessionRepository.findByUserId(userId);
        return sessions.filter(s => s.status === 'active');
    }

    /**
     * Check if a session is valid (active and has a desktop attached)
     */
    async isSessionValid(sessionId: string): Promise<boolean> {
        const session = await this.getSession(sessionId);
        return session !== null && session.status === 'active' && !!session.desktopId;
    }

    /**
     * Get session by desktop ID
     */
    async getSessionByDesktopId(desktopId: string): Promise<Session | null> {
        return this.sessionRepository.findByDesktopId(desktopId);
    }

    /**
     * Update session metadata
     */
    async updateSessionMetadata(sessionId: string, metadata: Record<string, any>): Promise<void> {
        await this.sessionRepository.update(sessionId, {
            metadata: metadata
        });
        this.logger.log(`Updated session ${sessionId} metadata`);
    }
}
