import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../infrastructure/entities';
import { User } from './user.entity';

/**
 * OAuth Account Entity
 * Stores OAuth provider connections for users
 * Allows a single user to have multiple OAuth providers
 */
@Entity('oauth_accounts')
@Index(['provider', 'providerId'], { unique: true })
export class OAuthAccount extends BaseEntity {
  @Column({ type: 'enum', enum: ['google', 'github', 'facebook', 'discord'] })
  provider!: 'google' | 'github' | 'facebook' | 'discord';

  @Column({ type: 'varchar', length: 255 })
  providerId!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  accessToken?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  refreshToken?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  tokenExpiresAt?: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  userId!: string;
}
