import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../domain/entities';
import { OAuthAccount } from '../domain/entities/oauth-account.entity';
import { OAuthProfile } from './strategies/oauth-provider.interface';
import { JwtPayload } from './jwt/jwt-payload.interface';
import { IUnitOfWork } from '../../infrastructure';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';

/**
 * Auth Service
 * Handles authentication, token generation, and user management
 * Follows SOLID - Single Responsibility: Only handles auth operations
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly unitOfWork: IUnitOfWork,
    private readonly googleStrategy: GoogleOAuthStrategy,
  ) {}

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
   * Generate JWT access token
   */
  generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const expiresIn = this.configService.get<number>('JWT_EXPIRATION', 3600);
    const secret = this.configService.get<string>('JWT_SECRET', 'secret');

    return this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'secret'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Find or create user from OAuth profile
   * Called during OAuth callback
   */
  async findOrCreateUser(
    provider: string,
    profile: OAuthProfile,
    accessToken?: string,
    refreshToken?: string,
  ): Promise<User> {
    return this.unitOfWork.withTransaction(async () => {
      const oauthRepo = this.getOAuthAccountRepository();
      const userRepo = this.getUserRepository();

      // Check if OAuth account exists
      let oauthAccount = await oauthRepo.findOne({
        where: {
          provider: provider as any,
          providerId: profile.providerId,
        },
        relations: ['user'],
      });

      if (oauthAccount) {
        // Update existing OAuth account with new tokens
        oauthAccount.accessToken = accessToken;
        oauthAccount.refreshToken = refreshToken;
        await oauthRepo.save(oauthAccount);

        // Update user's last login
        oauthAccount.user.lastLoginAt = new Date();
        await userRepo.save(oauthAccount.user);

        this.logger.log(`User logged in via ${provider}: ${oauthAccount.user.email}`);
        return oauthAccount.user;
      }

      // Check if user exists with the same email
      let user = await userRepo.findOne({
        where: { email: profile.email },
      });

      if (!user) {
        // Create new user
        user = userRepo.create({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          displayName: profile.displayName,
          picture: profile.picture,
          lastLoginAt: new Date(),
        });

        await userRepo.save(user);
        this.logger.log(`New user created via ${provider}: ${user.email}`);
      } else {
        // Update existing user's last login
        user.lastLoginAt = new Date();
        await userRepo.save(user);
        this.logger.log(`Existing user logged in via ${provider}: ${user.email}`);
      }

      // Create OAuth account for the user
      oauthAccount = oauthRepo.create({
        provider: provider as any,
        providerId: profile.providerId,
        userId: user.id,
        accessToken,
        refreshToken,
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
      });

      await oauthRepo.save(oauthAccount);

      return user;
    });
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: string): Promise<User | null> {
    const userRepo = this.getUserRepository();
    return userRepo.findOne({ where: { id: userId } });
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const userRepo = this.getUserRepository();
    return userRepo.findOne({ where: { email } });
  }

  /**
   * Validate JWT payload and return user
   */
  async validateUser(payload: JwtPayload): Promise<User | null> {
    if (!payload.sub) {
      return null;
    }

    return this.findUserById(payload.sub);
  }
}
