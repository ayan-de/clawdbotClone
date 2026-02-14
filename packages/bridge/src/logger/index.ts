export * from './logger.service';
export * from './logger.module';

// Re-export BridgeLogger with a simpler name for convenience
export { BridgeLogger as LoggerService } from './logger.service';
