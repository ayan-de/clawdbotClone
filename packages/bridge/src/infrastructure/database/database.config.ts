import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Database Configuration
 * Follows SOLID - Single Responsibility: Only handles database config
 */
export class DatabaseConfig {
  /**
   * Get TypeORM module options
   * Used for configuring TypeORM in NestJS
   */
  static getOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    const synchronize = configService.get<boolean>('DB_SYNCHRONIZE', false);

    return {
      type: 'postgres',
      url: this.getDatabaseUrl(configService),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: synchronize && !isProduction, // Never sync in production
      logging: !isProduction && configService.get<string>('LOG_LEVEL') === 'debug',
      ssl: this.getSSLOptions(isProduction, configService),
      extra: {
        max: 20, // connection pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
    };
  }

  /**
   * Get DataSource options
   * Used for creating DataSource directly (migrations, CLI)
   */
  static getDataSourceOptions(configService: ConfigService): DataSourceOptions {
    return {
      ...this.getOrmOptions(configService),
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      subscribers: [__dirname + '/subscribers/*{.ts,.js}'],
    } as DataSourceOptions;
  }

  /**
   * Get database connection URL
   * Supports both individual config fields and NEON_DATABASE_URL
   */
  private static getDatabaseUrl(configService: ConfigService): string {
    // Check for Neon database URL first
    const neonUrl = configService.get<string>('NEON_DATABASE_URL');
    if (neonUrl) {
      return neonUrl;
    }

    // Build URL from individual config fields
    const host = configService.get<string>('DB_HOST', 'localhost');
    const port = configService.get<number>('DB_PORT', 5432);
    const username = configService.get<string>('DB_USERNAME', 'postgres');
    const password = configService.get<string>('DB_PASSWORD', '');
    const database = configService.get<string>('DB_NAME', 'orbit_bridge');

    return `postgresql://${username}:${password}@${host}:${port}/${database}`;
  }

  /**
   * Get SSL options for database connection
   * Neon requires SSL
   */
  private static getSSLOptions(
    isProduction: boolean,
    configService: ConfigService,
  ): boolean | { rejectUnauthorized: boolean } {
    const sslEnabled = configService.get<boolean>('DB_SSL', isProduction);

    if (!sslEnabled) {
      return false;
    }

    // For Neon, we need to allow unauthorized SSL in development
    // but be strict in production
    if (configService.get<string>('NEON_DATABASE_URL')) {
      // Neon always requires SSL
      return isProduction ? true : { rejectUnauthorized: false };
    }

    return true;
  }

  /**
   * Create DataSource for migrations/seeding
   */
  static async createDataSource(
    configService: ConfigService,
  ): Promise<DataSource> {
    const AppDataSource = new DataSource(this.getDataSourceOptions(configService));
    return AppDataSource.initialize();
  }
}
