import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, OAuthAccount } from '../domain/entities';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Users Module
 * Provides user management functionality
 * Follows SOLID - Single Responsibility: Only handles users
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, OAuthAccount]),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: configService.get<number>('RATE_LIMIT_TTL', 60) * 1000, // convert to ms
            limit: configService.get<number>('RATE_LIMIT_MAX', 100),
          },
        ],
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
