import { Injectable, Scope } from '@nestjs/common';
import { DataSource, Repository, ObjectLiteral, QueryRunner } from 'typeorm';
import { IUnitOfWork } from './unit-of-work.interface';

/**
 * Unit of Work Service
 * Implements transaction management using Unit of Work pattern
 * Follows SOLID - Single Responsibility: Only handles transactions
 *
 * @Injectable({ scope: Scope.REQUEST }) creates a new instance per request
 * This ensures transactions are isolated per request
 *
 * @example
 * @Injectable({ scope: Scope.REQUEST })
 * export class UsersService {
 *   constructor(private readonly unitOfWork: UnitOfWork) {}
 *
 *   async createUserWithProfile(userDto: CreateUserDto) {
 *     return this.unitOfWork.withTransaction(async () => {
 *       const user = await this.userRepository.create(userDto);
 *       const profile = await this.profileRepository.create({ user });
 *       return { user, profile };
 *     });
 *   }
 * }
 */
@Injectable({ scope: Scope.REQUEST })
export class UnitOfWork implements IUnitOfWork {
  private readonly repositories = new Map<Function, Repository<any>>();
  private transactionActive = false;
  private queryRunner: QueryRunner | null = null;

  constructor(private readonly dataSource: DataSource) {}

  private getOrCreateQueryRunner(): QueryRunner {
    if (!this.queryRunner) {
      this.queryRunner = this.dataSource.createQueryRunner();
      this.queryRunner.connect();
    }
    return this.queryRunner;
  }

  /**
   * Begin a new transaction
   */
  async beginTransaction(): Promise<void> {
    if (this.transactionActive) {
      throw new Error('Transaction already active');
    }

    const queryRunner = this.getOrCreateQueryRunner();
    await queryRunner.startTransaction();
    this.transactionActive = true;
  }

  /**
   * Commit the current transaction
   */
  async commitTransaction(): Promise<void> {
    if (!this.transactionActive) {
      throw new Error('No active transaction to commit');
    }

    if (this.queryRunner?.isTransactionActive) {
      await this.queryRunner.commitTransaction();
    }

    await this.releaseQueryRunner();
    this.transactionActive = false;
  }

  /**
   * Rollback the current transaction
   */
  async rollbackTransaction(): Promise<void> {
    if (!this.transactionActive) {
      throw new Error('No active transaction to rollback');
    }

    if (this.queryRunner?.isTransactionActive) {
      await this.queryRunner.rollbackTransaction();
    }

    await this.releaseQueryRunner();
    this.transactionActive = false;
  }

  /**
   * Check if currently in a transaction
   */
  isTransactionActive(): boolean {
    return this.transactionActive;
  }

  /**
   * Execute callback within a transaction
   * Automatically commits on success, rolls back on error
   */
  async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      await this.beginTransaction();
      const result = await callback();
      await this.commitTransaction();
      return result;
    } catch (error) {
      if (this.transactionActive) {
        await this.rollbackTransaction();
      }
      throw error;
    }
  }

  /**
   * Get repository for an entity
   * Returns cached repository if already fetched in current transaction
   */
  getRepository<Entity extends ObjectLiteral>(entity: new () => Entity): Repository<Entity> {
    if (!this.repositories.has(entity)) {
      // If in transaction, use queryRunner's repository
      if (this.transactionActive && this.queryRunner) {
        const repository = this.queryRunner.manager.getRepository(entity);
        this.repositories.set(entity, repository);
      } else {
        const repository = this.dataSource.getRepository(entity);
        this.repositories.set(entity, repository);
      }
    }

    return this.repositories.get(entity) as Repository<Entity>;
  }

  /**
   * Release query runner resources
   */
  private async releaseQueryRunner(): Promise<void> {
    if (this.queryRunner) {
      await this.queryRunner.release();
      this.queryRunner = null;
    }
    this.repositories.clear();
  }

  /**
   * Clean up resources when scope ends
   */
  onModuleDestroy() {
    if (this.transactionActive) {
      this.rollbackTransaction().catch((error) => {
        console.error('Failed to rollback transaction on destroy:', error);
      });
    }
    this.releaseQueryRunner().catch((error) => {
      console.error('Failed to release query runner on destroy:', error);
    });
  }
}
