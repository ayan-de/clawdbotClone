import { parseCliArgs, showHelp, showVersion, validateConfig, loadConfig, runSetupWizard } from './config';
import { Logger, LogLevel } from './logger';
import { ConnectionState } from './types';
import { DesktopClient } from './client';
import { CommandHandler } from './command-handler';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Orbit Desktop TUI - Main Entry Point
 * Handles CLI argument parsing, configuration, and initialization
 */

const logger = Logger.getInstance();

// Global variables for graceful shutdown
let desktopClient: DesktopClient | null = null;
let commandHandler: CommandHandler | null = null;
let isShuttingDown = false;

/**
 * Main function
 */
export async function main() {
  try {
    // Parse CLI arguments
    const cliArgs = parseCliArgs();

    // Handle help
    if (cliArgs.help) {
      showHelp();
      process.exit(0);
    }

    // Handle version
    if (cliArgs.version) {
      showVersion();
      process.exit(0);
    }

    // Check if token is provided or config exists
    const { existsSync } = await import('fs');
    const os = require('os');
    const configDirExists = existsSync(`${os.homedir()}/.orbit`);

    // Run setup wizard if first run
    if (!configDirExists && !cliArgs.token) {
      await runSetupWizard();
      return;
    }

    // Load configuration
    const config = loadConfig(cliArgs);

    // Configure logger
    logger.configure(
      config.debug ? LogLevel.DEBUG : LogLevel.INFO,
      config.debug,
    );

    logger.info('🚀 Orbit Desktop TUI starting...');
    logger.debug(`Config loaded: ${JSON.stringify(config, null, 2)}`);

    // Validate configuration
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      logger.error('Configuration errors:');
      validationErrors.forEach((error) => logger.error(`  - ${error}`));
      process.exit(1);
    }

    // Check for token
    if (!config.token) {
      logger.warn('No connection token found.');
      logger.info('Please run one of the following:');
      logger.info('  1. orbit-desktop --token <your-token>');
      logger.info('  2. Visit https://orbit.ayande.xyz to generate a token');
      process.exit(1);
    }

    logger.info(`Connecting to Bridge Server at ${config.bridgeUrl}`);
    logger.debug(`Connection token: ${config.token.substring(0, 8)}...`);

    // Initialize Command Handler
    commandHandler = new CommandHandler(config.workspace);
    logger.debug('Command handler initialized');

    // Initialize Desktop Client
    desktopClient = new DesktopClient(config);
    logger.debug('Desktop client initialized');

    // Connect to Bridge Server
    const connected = await desktopClient.connect();
    if (!connected) {
      logger.error('Failed to connect to Bridge Server');
      process.exit(1);
    }

    logger.info('✓ Connected to Bridge Server');
    logger.info(`✓ Desktop Name: ${config.desktopName || 'Not specified'}`);
    logger.info('✓ Ready to receive commands from Telegram');
    logger.info('');
    logger.info('---');
    logger.info('Orbit Desktop TUI is running.');
    logger.info('Press Ctrl+C to stop.');
    logger.info('---');

    // Keep process alive
    await new Promise(() => { });

  } catch (error: any) {
    logger.error(`Failed to start Orbit Desktop TUI: ${error.message}`);
    if (error.stack) {
      logger.debug(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return; // Already shutting down
  }

  isShuttingDown = true;
  logger.info(`\nReceived ${signal}, shutting down gracefully...`);

  // Disconnect from Bridge Server
  if (desktopClient) {
    logger.info('Disconnecting from Bridge Server...');
    desktopClient.disconnect();
  }

  // Cleanup command handler (kill running processes)
  if (commandHandler) {
    const killedCount = commandHandler.killAllProcesses(signal);
    if (killedCount > 0) {
      logger.info(`Killed ${killedCount} active processes`);
    }
  }

  // Cleanup logger
  logger.info('Cleanup complete');
  logger.info('Goodbye!');

  // Exit with success
  process.exit(0);
}

/**
 * Setup signal handlers for graceful shutdown
 */
function setupSignalHandlers(): void {
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    logger.info('\nSIGINT received');
    await gracefulShutdown('SIGINT');
  });

  // Handle SIGTERM
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received');
    await gracefulShutdown('SIGTERM');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error(`Uncaught exception: ${error.message}`);
    logger.error(error.stack || 'No stack trace');
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any) => {
    logger.error(`Unhandled promise rejection: ${reason}`);
    process.exit(1);
  });

  logger.debug('Signal handlers registered');
}

/**
 * Display connection status
 */
function displayConnectionStatus(state: ConnectionState): void {
  const statusMap = {
    [ConnectionState.DISCONNECTED]: '❌ Disconnected',
    [ConnectionState.CONNECTING]: '🔄 Connecting...',
    [ConnectionState.CONNECTED]: '✅ Connected',
    [ConnectionState.RECONNECTING]: '🔄 Reconnecting...',
    [ConnectionState.ERROR]: '❌ Connection Error',
  };

  console.log(statusMap[state]);
}

/**
 * Display system info
 */
function displaySystemInfo(): void {
  const os = require('os');
  const process = require('process');

  logger.info('');
  logger.info('=== System Information ===');
  logger.info(`Platform:    ${os.platform()}`);
  logger.info(`OS Version:  ${os.release()}`);
  logger.info(`Architecture: ${os.arch()}`);
  logger.info(`Hostname:    ${os.hostname()}`);
  logger.info(`Shell:       ${process.env.SHELL || 'unknown'}`);
  logger.info(`Node.js:     ${process.version}`);
  logger.info(`Workspace:    ${commandHandler?.getWorkingDir() || 'N/A'}`);
  logger.info('===========================');
  logger.info('');
}

/**
 * Run main if this is entry point
 */
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  setupSignalHandlers();
  main();
}
