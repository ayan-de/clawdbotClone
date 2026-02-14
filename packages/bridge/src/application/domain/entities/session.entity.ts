import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('sessions')
export class Session {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    userId!: string; // The user who owns the session

    @ManyToOne(() => User, (user) => user.id)
    user!: User;

    @Column({ nullable: true })
    desktopId?: string; // The specific desktop connected to this session (socket ID)

    @Column({ default: 'active' })
    status!: 'active' | 'inactive' | 'closed';

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>; // Store platform info (e.g., telegram chat_id)

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
