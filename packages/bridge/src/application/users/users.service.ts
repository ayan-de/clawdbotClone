import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../domain/entities';
import { OAuthAccount } from '../domain/entities/oauth-account.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { IUnitOfWork } from '../../infrastructure';

/**
 * Users Service
 * Handles user CRUD operations following Repository pattern
 * Follows SOLID - Single Responsibility: Only handles user operations
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly unitOfWork: IUnitOfWork) { }

  /**
   * Get user repository
   */
  private getUserRepository(): Repository<User> {
    return this.unitOfWork.getRepository(User);
  }

  /**
   * Get OAuth account repository
   */
  private getOAuthAccountRepository(): Repository<OAuthAccount> {
    return this.unitOfWork.getRepository(OAuthAccount);
  }

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.unitOfWork.withTransaction(async () => {
      const userRepo = this.getUserRepository();

      // Check if email already exists
      const existingUser = await userRepo.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const user = userRepo.create({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        displayName: createUserDto.displayName,
        picture: createUserDto.picture,
      });

      const savedUser = await userRepo.save(user);
      this.logger.log(`User created: ${savedUser.email}`);

      return this.toResponseDto(savedUser);
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserResponseDto> {
    const userRepo = this.getUserRepository();

    const user = await userRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const userRepo = this.getUserRepository();

    const user = await userRepo.findOne({ where: { email } });

    if (!user) {
      return null;
    }

    return this.toResponseDto(user);
  }

  /**
   * Find user entity by email (internal use)
   */
  async findEntityByEmail(email: string): Promise<User | null> {
    const userRepo = this.getUserRepository();
    return userRepo.findOne({ where: { email } });
  }

  /**
   * Find user by OAuth provider and provider ID
   */
  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<UserResponseDto | null> {
    const oauthRepo = this.getOAuthAccountRepository();

    const oauthAccount = await oauthRepo.findOne({
      where: {
        provider: provider as any,
        providerId,
      },
      relations: ['user'],
    });

    if (!oauthAccount) {
      return null;
    }

    return this.toResponseDto(oauthAccount.user);
  }

  /**
   * Find user by Telegram username
   */
  async findByTelegramUsername(telegramUsername: string): Promise<UserResponseDto | null> {
    const userRepo = this.getUserRepository();

    const user = await userRepo.findOne({
      where: { telegramUsername },
    });

    if (!user) {
      return null;
    }

    return this.toResponseDto(user);
  }

  /**
   * Find user entity by Telegram username (internal use)
   */
  async findEntityByTelegramUsername(telegramUsername: string): Promise<User | null> {
    const userRepo = this.getUserRepository();
    return userRepo.findOne({ where: { telegramUsername } });
  }

  /**
   * Find user entity by ID (internal use)
   */
  async findEntityById(id: string): Promise<User | null> {
    const userRepo = this.getUserRepository();
    return userRepo.findOne({ where: { id } });
  }

  /**
   * Get all users (with pagination)
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: UserResponseDto[]; total: number }> {
    const userRepo = this.getUserRepository();

    const [users, total] = await userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      users: users.map((user) => this.toResponseDto(user)),
      total,
    };
  }

  /**
   * Update user
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.unitOfWork.withTransaction(async () => {
      const userRepo = this.getUserRepository();

      const user = await userRepo.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if email is being changed and already exists
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await userRepo.findOne({
          where: { email: updateUserDto.email },
        });

        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }
      }

      // Update user fields
      Object.assign(user, updateUserDto);

      const savedUser = await userRepo.save(user);
      this.logger.log(`User updated: ${savedUser.email}`);

      return this.toResponseDto(savedUser);
    });
  }

  /**
   * Delete user (soft delete - mark as inactive)
   */
  async delete(id: string): Promise<void> {
    return this.unitOfWork.withTransaction(async () => {
      const userRepo = this.getUserRepository();

      const user = await userRepo.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Soft delete - mark as inactive
      user.isActive = false;
      await userRepo.save(user);

      this.logger.log(`User deactivated: ${user.email}`);
    });
  }

  /**
   * Hard delete user
   */
  async hardDelete(id: string): Promise<void> {
    return this.unitOfWork.withTransaction(async () => {
      const userRepo = this.getUserRepository();

      const user = await userRepo.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await userRepo.delete(id);
      this.logger.log(`User deleted: ${user.email}`);
    });
  }

  /**
   * Get user's OAuth accounts
   */
  async getOAuthAccounts(userId: string): Promise<OAuthAccount[]> {
    const oauthRepo = this.getOAuthAccountRepository();

    return oauthRepo.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Convert User entity to Response DTO
   */
  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      picture: user.picture,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      telegramUsername: user.telegramUsername,
      telegramId: user.telegramId,
      selectedAiProvider: user.selectedAiProvider,
    };
  }
}
