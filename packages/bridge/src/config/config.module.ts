import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { EnvConfig } from './env.config';

/**
 * Configuration Module
 * Provides validated configuration throughout the application
 * Follows SOLID - Dependency Inversion: Depends on EnvConfig abstraction
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: async (config: Record<string, unknown>) => {
        const validatedConfig = plainToClass(EnvConfig, config, {
          enableImplicitConversion: true,
        });

        const errors = await validate(validatedConfig);

        if (errors.length > 0) {
          const errorMessages = errors.map(error =>
            Object.values(error.constraints ?? {}).join(', ')
          ).join('; ');

          throw new Error(`Configuration validation failed: ${errorMessages}`);
        }

        return validatedConfig;
      },
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
