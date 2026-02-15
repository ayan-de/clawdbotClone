import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Desktop Connection Token Entity
 * One-time tokens used to authenticate Desktop TUI with Bridge Server
 * Tokens are generated via web app and used by Desktop TUI to establish WebSocket connection
 */
@Entity('desktop_connection_tokens')
@Index(['token'], { unique: true })
@Index(['userId'])
export class DesktopConnectionToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Random token string (e.g., "orbit-dsk-abc123xyz")
   * User copies this from web app and pastes into Desktop TUI
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  token!: string;

  /**
   * User who owns this token
   * Links the desktop connection to the user's account
   */
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  /**
   * Whether this token has been used
   * Tokens are one-time use only for security
   */
  @Column({ type: 'boolean', default: false })
  used: boolean = false;

  /**
   * Token expiration time (default: 24 hours)
   * Tokens expire automatically to prevent long-lived credentials
   */
  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Date;

  /**
   * When this token was used to authenticate a desktop
   * Null until token is successfully used
   */
  @Column({ type: 'timestamp with time zone', nullable: true })
  usedAt?: Date;

  /**
   * Optional desktop name (e.g., "MacBook Pro", "Home PC")
   * Helps users identify which desktop is connected
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  desktopName?: string;

  /**
   * IP address of desktop that used this token (for security auditing)
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  /**
   * Set expiration time before insert
   * Tokens expire after 24 hours by default
   */
  @BeforeInsert()
  setExpiration() {
    if (!this.expiresAt) {
      const EXPIRATION_HOURS = 24;
      this.expiresAt = new Date(Date.now() + EXPIRATION_HOURS * 60 * 60 * 1000);
    }
  }
}
