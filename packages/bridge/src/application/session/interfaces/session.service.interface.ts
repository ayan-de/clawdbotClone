import { Session } from '../../domain/entities/session.entity';
import { User } from '../../domain/entities/user.entity';

/**
 * Session Service Interface
 * Defines the contract for session management operations
 * Follows Dependency Inversion Principle - high-level modules depend on abstractions
 */
export interface ISessionService {
    /**
     * Get or create a session for a user on a specific platform
     */
    getOrCreateSession(
        user: User,
        platform: string,
        platformMetadata?: Record<string, any>
    ): Promise<Session>;

    /**
     * Attach a desktop (socket ID) to a session
     */
    attachDesktop(sessionId: string, desktopSocketId: string): Promise<void>;

    /**
     * Detach a desktop from a session
     */
    detachDesktop(sessionId: string): Promise<void>;

    /**
     * Close a session
     */
    closeSession(sessionId: string): Promise<void>;

    /**
     * Get session by ID
     */
    getSession(sessionId: string): Promise<Session | null>;

    /**
     * Get all active sessions for a user
     */
    getActiveSessionsByUserId(userId: string): Promise<Session[]>;

    /**
     * Check if a session is valid (active and has a desktop attached)
     */
    isSessionValid(sessionId: string): Promise<boolean>;
}
