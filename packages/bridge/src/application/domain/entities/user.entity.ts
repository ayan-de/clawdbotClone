import {
  Entity,
  Column,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BaseEntity } from '../../../infrastructure/entities';

/**
 * User Entity
 * Represents a user in the system
 * Can be associated with multiple OAuth providers
 */
@Entity('users')
@Index(['email'], { unique: true })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  picture?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean = true;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;

  // Relationships with OAuth providers will be added when we create OAuthProvider entity
  // @OneToMany(() => OAuthAccount, (account) => account.user)
  // oauthAccounts: OAuthAccount[];
}
