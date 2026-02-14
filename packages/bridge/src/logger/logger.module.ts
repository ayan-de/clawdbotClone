import { Module } from '@nestjs/common';
import { ConfigModule } from '../config';
import { BridgeLogger } from './logger.service';

/**
 * Logger Module
 * Provides singleton BridgeLogger throughout the application
 * Follows SOLID - Dependency Inversion: Other modules depend on BridgeLogger abstraction
 */
@Module({
  imports: [ConfigModule],
  providers: [BridgeLogger],
  exports: [BridgeLogger],
})
export class LoggerModule {}
