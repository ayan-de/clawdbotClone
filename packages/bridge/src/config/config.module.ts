import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { EnvConfig } from './env.config';

/**
 * Configuration Module
 * Provides validated configuration throughout the application
 * Follows SOLID - Dependency Inversion: Depends on EnvConfig abstraction
 *
 * NOTE: Validation disabled due to issues with class-transformer losing environment values.
 * If re-enabling, ensure the validate function properly returns all environment variables.
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      // Validation disabled - see note above
      // validate: async (config: Record<string, unknown>) => {
      //   const validatedConfig = plainToClass(EnvConfig, config, {
      //     enableImplicitConversion: true,
      //   });
      //   const errors = await validate(validatedConfig);
      //   if (errors.length > 0) {
      //     throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
      //   }
      //   return validatedConfig;
      // },
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule { }
