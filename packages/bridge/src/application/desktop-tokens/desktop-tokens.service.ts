import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DesktopConnectionToken } from '../domain/entities/desktop-connection-token.entity';
import { IUnitOfWork } from '../../infrastructure';
import { CreateDesktopTokenDto } from '../domain/dto/create-desktop-token.dto';
import { DesktopTokenResponse } from '../domain/dto/desktop-token-response.dto';

/**
 * Desktop Connection Tokens Service
 * Handles generation and validation of desktop connection tokens
 * Follows SOLID - Single Responsibility: Only manages desktop tokens
 */
@Injectable()
export class DesktopTokensService {
  private readonly logger = new Logger(DesktopTokensService.name);
  private readonly TOKEN_PREFIX = 'orbit-dsk-';
  private readonly TOKEN_LENGTH = 16;

  constructor(@Inject(IUnitOfWork) private readonly unitOfWork: IUnitOfWork) { }

  /**
   * Get desktop connection token repository
   */
  private getRepository(): Repository<DesktopConnectionToken> {
    return this.unitOfWork.getRepository(DesktopConnectionToken);
  }

  /**
   * Generate a new desktop connection token for a user
   * Tokens are one-time use and expire after 24 hours
   */
  async generateToken(userId: string, dto?: CreateDesktopTokenDto): Promise<DesktopTokenResponse> {
    return this.unitOfWork.withTransaction(async () => {
      const repo = this.getRepository();

      // Generate random token string
      const randomPart = this.generateRandomString(this.TOKEN_LENGTH);
      const token = `${this.TOKEN_PREFIX}${randomPart}`;

      // Check for unused active tokens for this user
      const existingActiveTokens = await repo.find({
        where: {
          userId,
          used: false,
        },
      });

      // Optionally revoke old tokens for security
      if (existingActiveTokens.length > 0) {
        this.logger.log(`Found ${existingActiveTokens.length} existing tokens for user ${userId}, marking as used`);
        await repo.update(
          { userId, used: false },
          { used: true, usedAt: new Date() },
        );
      }

      // Create new token
      const tokenEntity = repo.create({
        token,
        userId,
        desktopName: dto?.desktopName,
      });

      const savedToken = await repo.save(tokenEntity);
      this.logger.log(
        `Desktop connection token generated for user ${userId}: ${token}`,
      );

      // Get bridge URL from config
      const bridgeUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      return {
        token: savedToken.token,
        displayToken: savedToken.token,
        expiresAt: savedToken.expiresAt.toISOString(),
        desktopName: savedToken.desktopName,
        instructions: 'Copy the command below and run it in your terminal to connect your desktop.',
        connectCommand: `orbit-desktop --token ${savedToken.token}`,
      };
    });
  }

  /**
   * Validate a desktop connection token
   * Called when Desktop TUI authenticates via WebSocket
   */
  async validateToken(token: string, ipAddress?: string): Promise<{
    valid: boolean;
    userId?: string;
    desktopName?: string;
    error?: string;
  }> {
    const repo = this.getRepository();

    const tokenEntity = await repo.findOne({
      where: { token },
      relations: ['user'],
    });

    // Check if token exists
    if (!tokenEntity) {
      this.logger.warn(`Invalid desktop connection token attempted: ${token}`);
      return {
        valid: false,
        error: 'Invalid connection token',
      };
    }

    // Check if token has expired
    if (tokenEntity.expiresAt < new Date()) {
      this.logger.warn(`Expired desktop connection token attempted: ${token}`);
      return {
        valid: false,
        error: 'Connection token has expired. Please generate a new one.',
      };
    }

    // Check if token has already been used
    if (tokenEntity.used) {
      this.logger.warn(`Already used desktop connection token attempted: ${token}`);
      return {
        valid: false,
        error: 'Connection token has already been used. Please generate a new one.',
      };
    }

    // Mark token as used
    await repo.update(tokenEntity.id, {
      used: true,
      usedAt: new Date(),
      ipAddress,
    });

    this.logger.log(
      `Desktop connection token validated for user ${tokenEntity.userId}: ${token}`,
    );

    return {
      valid: true,
      userId: tokenEntity.userId,
      desktopName: tokenEntity.desktopName,
    };
  }

  /**
   * Revoke (invalidate) all tokens for a user
   * Useful for security or when user changes their mind
   */
  async revokeAllTokens(userId: string): Promise<{ revoked: number }> {
    const repo = this.getRepository();

    const result = await repo.update(
      {
        userId,
        used: false,
      },
      {
        used: true,
        usedAt: new Date(),
      },
    );

    this.logger.log(
      `Revoked ${result.affected || 0} desktop connection tokens for user ${userId}`,
    );

    return {
      revoked: result.affected || 0,
    };
  }

  /**
   * Get active (unused) tokens for a user
   */
  async getActiveTokens(userId: string): Promise<DesktopConnectionToken[]> {
    const repo = this.getRepository();

    return repo.find({
      where: {
        userId,
        used: false,
        expiresAt: { $gt: new Date() } as any, // Active tokens not expired
      },
      order: {
        createdAt: 'DESC',
      },
      take: 10,
    });
  }

  /**
   * Generate a cryptographically secure random string
   * Uses crypto module for better randomness than Math.random()
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const crypto = require('crypto');

    const randomValues = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }

    return result;
  }

  /**
   * Clean up expired and used tokens (scheduled task)
   * Call this from a cron job or cleanup service
   */
  async cleanupExpiredTokens(): Promise<{ deleted: number }> {
    const repo = this.getRepository();

    // Delete tokens that are both expired and used (older than 7 days)
    const deleteDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await repo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .andWhere('used = :used', { used: true })
      .andWhere('usedAt < :deleteDate', { deleteDate })
      .execute();

    const deletedCount = result.affected || 0;

    if (deletedCount > 0) {
      this.logger.log(`Cleaned up ${deletedCount} expired desktop tokens`);
    }

    return {
      deleted: deletedCount,
    };
  }
}
