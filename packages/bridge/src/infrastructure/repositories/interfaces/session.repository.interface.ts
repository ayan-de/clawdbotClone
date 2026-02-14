import { Session } from '../../../application/domain/entities/session.entity';

/**
 * Session Repository Interface
 * Defines the contract for session data access operations
 * Follows Dependency Inversion Principle - high-level modules depend on abstractions
 */
export interface ISessionRepository {
    /**
     * Create a new session
     */
    create(session: Partial<Session>): Promise<Session>;

    /**
     * Find an active session by user ID
     */
    findActiveByUserId(userId: string): Promise<Session | null>;

    /**
     * Find a session by ID
     */
    findById(id: string): Promise<Session | null>;

    /**
     * Update a session
     */
    update(id: string, update: Partial<Session>): Promise<void>;

    /**
     * Delete a session by ID
     */
    delete(id: string): Promise<void>;

    /**
     * Find all sessions for a user
     */
    findByUserId(userId: string): Promise<Session[]>;
}
