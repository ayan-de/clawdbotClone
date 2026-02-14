import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../domain/entities/user.entity';

/**
 * User Orchestration Service
 * Handles user lookup and creation for command execution
 * Follows Single Responsibility Principle - focused solely on user management
 */
@Injectable()
export class UserOrchestrationService {
    private readonly logger = new Logger(UserOrchestrationService.name);

    constructor(
        private readonly usersService: UsersService,
    ) { }

    /**
     * Find or create a user based on platform user ID
     */
    async findOrCreateUser(platform: string, platformUserId: string, username?: string): Promise<User> {
        const email = `${platform}_${platformUserId}@bridge.local`;
        let user = await this.usersService.findEntityByEmail(email);

        if (!user) {
            await this.usersService.create({
                email,
                firstName: username || 'Guest',
                lastName: platform,
                displayName: username || `Guest ${platformUserId}`,
            });
            user = await this.usersService.findEntityByEmail(email);
        }

        if (!user) {
            throw new Error('Failed to create user');
        }

        this.logger.debug(`User found/created: ${user.email}`);
        return user;
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<User | null> {
        return this.usersService.findEntityByEmail(email);
    }

    /**
     * Generate bridge email for platform user
     */
    generateBridgeEmail(platform: string, platformUserId: string): string {
        return `${platform}_${platformUserId}@bridge.local`;
    }
}
