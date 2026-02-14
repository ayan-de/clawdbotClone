import { Injectable, Logger } from '@nestjs/common';
import { SessionRepository } from '../../infrastructure/repositories/session.repository';
import { Session } from '../../application/domain/entities/session.entity';
import { User } from '../../application/domain/entities/user.entity';

@Injectable()
export class SessionService {
    private readonly logger = new Logger(SessionService.name);

    constructor(
        private readonly sessionRepository: SessionRepository,
    ) { }

    /**
     * Get or create a session for a user
     */
    async getOrCreateSession(user: User, platform: string, platformMetadata?: any): Promise<Session> {
        // Find existing active session
        const existingSession = await this.sessionRepository.findActiveByUserId(user.id);

        if (existingSession) {
            // Check if we need to update metadata or desktop?
            // For now, just return.
            // If the user connects from a different platform, maybe we should still reuse the session? 
            // Or create a new one?
            // "Session" here maps to a logical conversation/workspace.
            // Let's reuse active sessions.
            return existingSession;
        }

        // Create new session
        const newSession = await this.sessionRepository.create({
            userId: user.id,
            status: 'active',
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
}
