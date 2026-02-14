import { Repository, ObjectLiteral } from 'typeorm';

/**
 * Unit of Work Interface
 * Defines contract for transaction management
 * Follows SOLID - Interface Segregation: Focused on transaction operations
 *
 * Unit of Work Pattern:
 * - Maintains list of objects affected by a business transaction
 * - Coordinates writing out changes and resolving concurrency problems
 * - Provides atomic operations - all succeed or all fail
 */
export abstract class IUnitOfWork {
  /**
   * Begin a new transaction
   */
  abstract beginTransaction(): Promise<void>;

  /**
   * Commit the current transaction
   */
  abstract commitTransaction(): Promise<void>;

  /**
   * Rollback the current transaction
   */
  abstract rollbackTransaction(): Promise<void>;

  /**
   * Check if currently in a transaction
   */
  abstract isTransactionActive(): boolean;

  /**
   * Execute callback within a transaction
   * Automatically commits on success, rolls back on error
   *
   * @example
   * await unitOfWork.withTransaction(async () => {
   *   await userRepo.save(user);
   *   await profileRepo.save(profile);
   * });
   */
  abstract withTransaction<T>(callback: () => Promise<T>): Promise<T>;

  /**
   * Get repository for an entity
   */
  abstract getRepository<Entity extends ObjectLiteral>(entity: new () => Entity): Repository<Entity>;
}
