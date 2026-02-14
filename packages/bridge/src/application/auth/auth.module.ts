import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleOAuthStrategy, JwtStrategy, OAuthProviderFactory } from './strategies';
import { JwtAuthGuard, OAuthAuthGuard } from './guards';
import { User, OAuthAccount } from '../domain/entities';

/**
 * Auth Module
 * Provides authentication and authorization functionality
 * Follows SOLID - Single Responsibility: Only handles auth
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, OAuthAccount]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'secret'),
        signOptions: {
          expiresIn: configService.get<number>('JWT_EXPIRATION', 3600),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleOAuthStrategy,
    JwtStrategy,
    OAuthProviderFactory,
    JwtAuthGuard,
    OAuthAuthGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    OAuthAuthGuard,
    GoogleOAuthStrategy,
  ],
})
export class AuthModule {}
