import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { LoggerModule } from './logger';
import { UnitOfWorkModule } from './infrastructure';
import { AuthModule } from './application/auth';
import { UsersModule } from './application/users';
import { SessionModule } from './application/session/session.module';
import { DesktopTokensModule } from './application/desktop-tokens/desktop-tokens.module';
import { WebSocketModule } from './presentation/websocket';
import { AdaptersModule } from './application/adapters';
import { ExecutionModule } from './application/execution/execution.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './application/auth/guards';
import { AppController } from './app.controller';

/**
 * Root Application Module
 * Follows Clean Architecture - Composition root for all modules
 *
 * Clean Architecture Layers:
 * - Presentation: Controllers, Gateways, DTOs
 * - Application: Services, Use Cases
 * - Domain: Entities, Interfaces, Patterns
 * - Infrastructure: Database, Adapters, External API
 */
@Module({
  imports: [
    // Infrastructure Layer
    ConfigModule,
    LoggerModule,
    UnitOfWorkModule,

    // Application Layer
    AuthModule,
    UsersModule,
    SessionModule,
    DesktopTokensModule,
    ExecutionModule,

    // Presentation Layer
    WebSocketModule,
    AdaptersModule,

    // Domain Layer is shared via @orbit/common package
  ],
  controllers: [AppController],
  providers: [
    // Global JWT auth guard (applies to all routes unless @Public() is used)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
