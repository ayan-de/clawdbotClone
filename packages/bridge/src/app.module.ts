import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { LoggerModule } from './logger';
import { UnitOfWorkModule } from './infrastructure';
import { AuthModule } from './application/auth';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './application/auth/guards';

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

    // Presentation Layer (to be added)
    // ControllersModule,
    // WebSocketModule,

    // Domain Layer is shared via @orbit/common package
  ],
  controllers: [],
  providers: [
    // Global JWT auth guard (applies to all routes unless @Public() is used)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
