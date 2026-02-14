import { Injectable, Scope } from '@nestjs/common';
import type { LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';

/**
 * Bridge Logger Service
 * Singleton pattern implementation for centralized logging
 * Follows SOLID - Single Responsibility: Only handles logging
 *
 * @Injectable({ scope: Scope.DEFAULT }) ensures singleton behavior in NestJS
 */
@Injectable({ scope: Scope.DEFAULT })
export class BridgeLogger implements NestLoggerService {
  private logger!: winston.Logger;
  private static instance: BridgeLogger;

  constructor(private readonly configService: ConfigService) {
    // Singleton pattern - ensure only one instance
    if (BridgeLogger.instance) {
      this.logger = BridgeLogger.instance.logger;
      return this;
    }

    BridgeLogger.instance = this;

    const logLevel = this.configService.get<string>('LOG_LEVEL') ?? 'info';
    const logDir = this.configService.get<string>('LOG_DIR') ?? './logs';
    const logToFile = this.configService.get<boolean>('LOG_TO_FILE') ?? true;
    const appName = this.configService.get<string>('APP_NAME') ?? 'OrbitBridge';

    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.splat(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
            let logMessage = `${timestamp} [${level}]`;

            if (context) {
              logMessage += ` [${context}]`;
            }

            logMessage += ` ${message}`;

            if (Object.keys(meta).length > 0) {
              logMessage += ` ${JSON.stringify(meta)}`;
            }

            if (stack) {
              logMessage += `\n${stack}`;
            }

            return logMessage;
          }),
        ),
      }),
    ];

    // File transport with daily rotation
    if (logToFile) {
      transports.push(
        new DailyRotateFile({
          dirname: logDir,
          filename: `${appName}-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.json(),
          ),
        }),
        // Error log file
        new DailyRotateFile({
          level: 'error',
          dirname: logDir,
          filename: `${appName}-error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.json(),
          ),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      defaultMeta: { service: appName },
      transports,
    });
  }

  /**
   * Log a message at the verbose level
   */
  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }

  /**
   * Log a message at the debug level
   */
  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  /**
   * Log a message at the info level
   */
  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  /**
   * Log a message at the warn level
   */
  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  /**
   * Log a message at the error level
   */
  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { context, trace });
  }

  /**
   * Set the log level at runtime
   */
  setLevel(level: string): void {
    this.logger.level = level;
  }

  /**
   * Get the current logger instance
   */
  getInstance(): winston.Logger {
    return this.logger;
  }
}
