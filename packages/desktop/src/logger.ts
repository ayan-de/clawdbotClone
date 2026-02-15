import fs from 'fs';
import path from 'path';
import { getLogFilePath } from './config';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Logger class for Desktop TUI
 * Supports both console and file logging
 */
export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logToFile: boolean = false;
  private logFilePath: string = '';
  private outputCache: string[] = [];
  private cacheMaxSize: number = 100;

  private constructor() {
    this.logFilePath = getLogFilePath();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Configure logger
   */
  configure(level?: LogLevel, logToFile?: boolean): void {
    if (level) {
      this.logLevel = level;
    }
    if (logToFile !== undefined) {
      this.logToFile = logToFile;
    }
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  };

  /**
   * Colorize message based on level
   */
  private colorize(level: LogLevel, message: string): string {
    if (this.logToFile) {
      return message; // No colors in log file
    }

    switch (level) {
      case LogLevel.DEBUG:
        return `${COLORS.gray}${message}${COLORS.reset}`;
      case LogLevel.INFO:
        return `${COLORS.cyan}${message}${COLORS.reset}`;
      case LogLevel.WARN:
        return `${COLORS.yellow}${message}${COLORS.reset}`;
      case LogLevel.ERROR:
        return `${COLORS.red}${message}${COLORS.reset}`;
      default:
        return message;
    }
  }

  /**
   * Check if should log at this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Write to log file
   */
  private writeToFile(message: string): void {
    if (!this.logToFile) return;

    this.outputCache.push(message);

    if (this.outputCache.length >= this.cacheMaxSize) {
      this.flushCache();
    }
  }

  /**
   * Flush cached output to file
   */
  private flushCache(): void {
    if (this.outputCache.length === 0) return;

    try {
      fs.appendFileSync(this.logFilePath, this.outputCache.join('\n') + '\n', 'utf-8');
      this.outputCache = [];
    } catch (error: any) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  /**
   * Debug level log
   */
  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const formattedMessage = this.formatMessage(LogLevel.DEBUG, message);
    const colorized = this.colorize(LogLevel.DEBUG, formattedMessage);

    console.debug(colorized, ...args);
    this.writeToFile(formattedMessage);
  }

  /**
   * Info level log
   */
  info(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const formattedMessage = this.formatMessage(LogLevel.INFO, message);
    const colorized = this.colorize(LogLevel.INFO, formattedMessage);

    console.log(colorized, ...args);
    this.writeToFile(formattedMessage);
  }

  /**
   * Warn level log
   */
  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const formattedMessage = this.formatMessage(LogLevel.WARN, message);
    const colorized = this.colorize(LogLevel.WARN, formattedMessage);

    console.warn(colorized, ...args);
    this.writeToFile(formattedMessage);
  }

  /**
   * Error level log
   */
  error(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const formattedMessage = this.formatMessage(LogLevel.ERROR, message);
    const colorized = this.colorize(LogLevel.ERROR, formattedMessage);

    console.error(colorized, ...args);
    this.writeToFile(formattedMessage);
  }

  /**
   * Clean up - flush cache on exit
   */
  cleanup(): void {
    this.flushCache();
  }
}

// Ensure cleanup on process exit
process.on('exit', () => {
  Logger.getInstance().cleanup();
});

process.on('SIGINT', () => {
  Logger.getInstance().cleanup();
});

process.on('SIGTERM', () => {
  Logger.getInstance().cleanup();
});
