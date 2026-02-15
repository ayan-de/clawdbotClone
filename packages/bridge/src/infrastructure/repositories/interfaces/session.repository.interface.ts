import { Session } from '../../../application/domain/entities/session.entity';

/**
 * Session Repository Interface
 * Defines the contract for session data access operations
 * Follows Dependency Inversion Principle - high-level modules depend on abstractions
 */
export abstract class ISessionRepository {
    /**
     * Create a new session
     */
    abstract create(session: Partial<Session>): Promise<Session>;

    /**
     * Find an active session by user ID
     */
    abstract findActiveByUserId(userId: string): Promise<Session | null>;

    /**
     * Find a session by ID
     */
    abstract findById(id: string): Promise<Session | null>;

    /**
     * Update a session
     */
    abstract update(id: string, update: Partial<Session>): Promise<void>;

    /**
     * Delete a session by ID
     */
    abstract delete(id: string): Promise<void>;

    /**
     * Find all sessions for a user
     */
    abstract findByUserId(userId: string): Promise<Session[]>;

    /**
     * Find a session by desktop ID (socket ID)
     */
    abstract findByDesktopId(desktopId: string): Promise<Session | null>;
}
