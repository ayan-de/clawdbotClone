import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BridgeLogger } from './logger/logger.service';
import { AppModule } from './app.module';

/**
 * Bootstrap the NestJS application
 * Includes graceful shutdown, error handling, and CORS configuration
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Enable graceful shutdown
    // logger: false, // We'll use our custom logger
  });

  const configService = app.get(ConfigService);

  // Get logger instance
  const logger = app.get(BridgeLogger);
  app.useLogger(logger);

  // Enable CORS with configuration
  const corsOrigin = configService.get<string>('CORS_ORIGIN') ?? '*';
  app.enableCors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are provided
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );


  const port = configService.get<number>('PORT', 3000);
  const appName = configService.get<string>('APP_NAME', 'OrbitBridge');

  await app.listen(port);

  logger.log(`🌉 ${appName} Server listening on port ${port}`, 'Bootstrap');
  logger.log(`📝 Environment: ${configService.get<string>('NODE_ENV', 'development')}`, 'Bootstrap');
  logger.log(`🌍 CORS Origin: ${corsOrigin}`, 'Bootstrap');

  // Graceful shutdown handlers
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    logger.log(`⚠️  Received ${signal}, shutting down gracefully...`, 'Bootstrap');

    try {
      await app.close();
      logger.log(`✅ Application closed successfully`, 'Bootstrap');
      process.exit(0);
    } catch (error) {
      logger.error(`❌ Error during shutdown: ${error}`, 'Bootstrap');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`, error.stack, 'Bootstrap');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error(
      `Unhandled Rejection at: ${promise}, reason: ${reason}`,
      'Bootstrap'
    );
  });
}

// Handle top-level errors
bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error);
  process.exit(1);
});
