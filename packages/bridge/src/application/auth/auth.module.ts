import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GmailController } from './gmailauth.controller';
import { GoogleOAuthStrategy, GmailOAuthStrategy, JwtStrategy, OAuthProviderFactory } from './strategies';
import { JwtAuthGuard, OAuthAuthGuard } from './guards';
import { User, OAuthAccount } from '../domain/entities';

/**
 * Auth Module
 *
 * Provides authentication and authorization functionality
 * Follows SOLID - Single Responsibility: Only handles auth
 */
@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([User, OAuthAccount]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'secret'),
        signOptions: {
          expiresIn: Number(configService.get<number>('JWT_EXPIRATION', 3600)),
        },
      }),
    }),
  ],
  controllers: [AuthController, GmailController],
  providers: [
    AuthService,
    GoogleOAuthStrategy,
    GmailOAuthStrategy,
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
    GmailOAuthStrategy,
    PassportModule,
  ],
})
export class AuthModule { }
