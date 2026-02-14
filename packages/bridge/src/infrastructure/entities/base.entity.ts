import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Base Entity
 * Provides common fields for all entities
 * Follows DRY principle - Don't Repeat Yourself
 *
 * @example
 * @Entity('users')
 * export class User extends BaseEntity {
 *   @Column()
 *   email: string;
 * }
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
