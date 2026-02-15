import { parseCliArgs, showHelp, showVersion, validateConfig, loadConfig, runSetupWizard } from './config';
import { Logger, LogLevel } from './logger';
import { ConnectionState } from './types';

/**
 * Orbit Desktop TUI - Main Entry Point
 * Handles CLI argument parsing, configuration, and initialization
 */

const logger = Logger.getInstance();

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
    const configDirExists = existsSync(`${require('os').homedir()}/.orbit`);

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

    // TODO: Phase 2 - Initialize Socket.io client
    // TODO: Phase 2 - Initialize TUI (blessed)
    // TODO: Phase 2 - Connect to Bridge Server
    // TODO: Phase 2 - Wait for user input

    // For now, just show connection state
    displayConnectionStatus(ConnectionState.CONNECTING);

    logger.info('✓ Desktop TUI initialized successfully');
    logger.info('Note: Full functionality coming in Phase 2');

    // Wait a bit to show status, then exit
    setTimeout(() => {
      displayConnectionStatus(ConnectionState.DISCONNECTED);
      process.exit(0);
    }, 3000);

  } catch (error: any) {
    logger.error(`Failed to start Orbit Desktop TUI: ${error.message}`);
    if (error.stack) {
      logger.debug(error.stack);
    }
    process.exit(1);
  }
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
 * Run main if this is the entry point
 */
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}
