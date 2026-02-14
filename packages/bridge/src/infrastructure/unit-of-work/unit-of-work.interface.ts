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
export interface IUnitOfWork {
  /**
   * Begin a new transaction
   */
  beginTransaction(): Promise<void>;

  /**
   * Commit the current transaction
   */
  commitTransaction(): Promise<void>;

  /**
   * Rollback the current transaction
   */
  rollbackTransaction(): Promise<void>;

  /**
   * Check if currently in a transaction
   */
  isTransactionActive(): boolean;

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
  withTransaction<T>(callback: () => Promise<T>): Promise<T>;

  /**
   * Get repository for an entity
   */
  getRepository<Entity extends ObjectLiteral>(entity: new () => Entity): Repository<Entity>;
}

/**
 * Token for dependency injection
 * Use this to inject the UnitOfWork service
 */
export const IUnitOfWork = Symbol('IUnitOfWork');
