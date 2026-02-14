import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { LoggerModule } from './logger';

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

    // Presentation Layer (to be added)
    // ControllersModule,
    // WebSocketModule,

    // Application Layer (to be added)
    // UsersModule,
    // AuthModule,

    // Domain Layer is shared via @orbit/common package
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
