import { Session } from '../../domain/entities/session.entity';
import { User } from '../../domain/entities/user.entity';

/**
 * Session Service Interface
 * Defines the contract for session management operations
 * Follows Dependency Inversion Principle - high-level modules depend on abstractions
 */
export abstract class ISessionService {
    /**
     * Get or create a session for a user on a specific platform
     */
    abstract getOrCreateSession(
        user: User,
        platform: string,
        platformMetadata?: Record<string, any>
    ): Promise<Session>;

    /**
     * Attach a desktop (socket ID) to a session
     */
    abstract attachDesktop(sessionId: string, desktopSocketId: string): Promise<void>;

    /**
     * Detach a desktop from a session
     */
    abstract detachDesktop(sessionId: string): Promise<void>;

    /**
     * Close a session
     */
    abstract closeSession(sessionId: string): Promise<void>;

    /**
     * Get session by ID
     */
    abstract getSession(sessionId: string): Promise<Session | null>;

    /**
     * Get all active sessions for a user
     */
    abstract getActiveSessionsByUserId(userId: string): Promise<Session[]>;

    /**
     * Check if a session is valid (active and has a desktop attached)
     */
    abstract isSessionValid(sessionId: string): Promise<boolean>;

    /**
     * Get session by desktop ID
     */
    abstract getSessionByDesktopId(desktopId: string): Promise<Session | null>;

    /**
     * Update session metadata
     */
    abstract updateSessionMetadata(sessionId: string, metadata: Record<string, any>): Promise<void>;
}
