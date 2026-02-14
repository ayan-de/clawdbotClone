import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: ['.env.local', '.env'] });

/**
 * TypeORM DataSource for CLI migrations
 * Used by typeorm CLI commands for migration management
 */
export const AppDataSource = new DataSource({
  type: 'postgres',

  // Use Neon URL if available, otherwise build from individual config
  url: process.env.NEON_DATABASE_URL ||
    `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,

  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  subscribers: [__dirname + '/../../subscribers/*{.ts,.js}'],

  synchronize: false,
  logging: process.env.NODE_ENV === 'development' && process.env.LOG_LEVEL === 'debug',

  ssl: process.env.NEON_DATABASE_URL
    ? process.env.NODE_ENV === 'production'
      ? true
      : { rejectUnauthorized: false }
    : process.env.DB_SSL === 'true',

  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});
