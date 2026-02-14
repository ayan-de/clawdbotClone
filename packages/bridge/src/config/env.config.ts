import { IsString, IsInt, IsOptional, IsBoolean, IsPort } from 'class-validator';

/**
 * Environment configuration DTO with validation
 * Follows SOLID - Single Responsibility: Only handles config validation
 */
export class EnvConfig {
  // Application Config
  @IsString()
  @IsOptional()
  APP_NAME: string = 'OrbitBridge';

  @IsPort()
  @IsOptional()
  PORT: string = '3000';

  @IsString()
  @IsOptional()
  NODE_ENV: 'development' | 'production' | 'test' = 'development';

  // Database Config
  @IsString()
  @IsOptional()
  DB_HOST: string = 'localhost';

  @IsPort()
  @IsOptional()
  DB_PORT: string = '5432';

  @IsString()
  @IsOptional()
  DB_USERNAME: string = 'postgres';

  @IsString()
  @IsOptional()
  DB_PASSWORD: string = '';

  @IsString()
  @IsOptional()
  DB_NAME: string = 'orbit_bridge';

  @IsBoolean()
  @IsOptional()
  DB_SYNCHRONIZE: boolean = false;


  // JWT Config
  @IsString()
  @IsOptional()
  JWT_SECRET: string = 'default_jwt_secret_change_in_production';

  @IsInt()
  @IsOptional()
  JWT_EXPIRATION: number = 3600; // 1 hour in seconds

  // OAuth - Google
  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID: string = '';

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET: string = '';

  @IsString()
  @IsOptional()
  GOOGLE_REDIRECT_URI: string = '';

  // Logging Config
  @IsString()
  @IsOptional()
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug' | 'verbose' = 'info';

  @IsString()
  @IsOptional()
  LOG_DIR: string = './logs';

  @IsBoolean()
  @IsOptional()
  LOG_TO_FILE: boolean = true;

  // CORS Config
  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = '*';

  // Rate Limiting
  @IsInt()
  @IsOptional()
  RATE_LIMIT_TTL: number = 60; // 60 seconds

  @IsInt()
  @IsOptional()
  RATE_LIMIT_MAX: number = 100; // 100 requests per TTL
}
