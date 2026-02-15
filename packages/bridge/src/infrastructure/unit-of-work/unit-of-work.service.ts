import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository, ObjectLiteral, QueryRunner } from 'typeorm';
import { AsyncLocalStorage } from 'async_hooks';
import { IUnitOfWork } from './unit-of-work.interface';

/**
 * Unit of Work Service
 * Implements transaction management using Unit of Work pattern
 * Refactored to use AsyncLocalStorage for transaction context propagation
 * Now supports Singleton scope (safe for WebSockets/Events)
 */
@Injectable()
export class UnitOfWork implements IUnitOfWork {
  private readonly logger = new Logger(UnitOfWork.name);
  private readonly asyncLocalStorage = new AsyncLocalStorage<QueryRunner>();

  constructor(private readonly dataSource: DataSource) { }

  /**
   * Get the current transaction query runner from AsyncLocalStorage
   */
  private getQueryRunner(): QueryRunner | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Begin a new transaction
   * @deprecated Use withTransaction() instead for safe context management
   */
  async beginTransaction(): Promise<void> {
    throw new Error('Manual transaction management is not supported in Singleton UnitOfWork. Use withTransaction() instead.');
  }

  /**
   * Commit the current transaction
   * @deprecated Use withTransaction() instead for safe context management
   */
  async commitTransaction(): Promise<void> {
    throw new Error('Manual transaction management is not supported in Singleton UnitOfWork. Use withTransaction() instead.');
  }

  /**
   * Rollback the current transaction
   * @deprecated Use withTransaction() instead for safe context management
   */
  async rollbackTransaction(): Promise<void> {
    throw new Error('Manual transaction management is not supported in Singleton UnitOfWork. Use withTransaction() instead.');
  }

  /**
   * Check if currently in a transaction
   */
  isTransactionActive(): boolean {
    const queryRunner = this.getQueryRunner();
    return !!queryRunner && queryRunner.isTransactionActive;
  }

  /**
   * Execute callback within a transaction
   * Automatically commits on success, rolls back on error
   */
  async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    // If already in transaction, reuse it (nested transaction support could be added here if needed)
    // For now, we reuse the existing transaction context if present
    const existingRunner = this.getQueryRunner();
    if (existingRunner && existingRunner.isTransactionActive) {
      return callback();
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    return this.asyncLocalStorage.run(queryRunner, async () => {
      try {
        const result = await callback();
        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        throw error;
      } finally {
        if (!queryRunner.isReleased) {
          await queryRunner.release();
        }
      }
    });
  }

  /**
   * Get repository for an entity
   * Returns transactional repository if inside a transaction, otherwise default repository
   */
  getRepository<Entity extends ObjectLiteral>(entity: new () => Entity): Repository<Entity> {
    const queryRunner = this.getQueryRunner();

    if (queryRunner?.manager) {
      return queryRunner.manager.getRepository(entity);
    }

    return this.dataSource.getRepository(entity);
  }
}
