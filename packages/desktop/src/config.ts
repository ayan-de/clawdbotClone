import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

/**
 * Desktop TUI Configuration
 * Manages CLI arguments, config file, and environment variables
 */

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration structure
 */
export interface OrbitConfig {
  /** Bridge Server WebSocket URL */
  bridgeUrl: string;

  /** Desktop connection token */
  token?: string;

  /** Desktop name (optional) */
  desktopName?: string;

  /** Default workspace directory */
  workspace?: string;

  /** Enable debug logging */
  debug?: boolean;

  /** Log file path */
  logFile?: string;

  /** Connection timeout in seconds */
  timeout?: number;

  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
}

/**
 * CLI Arguments structure
 */
export interface CliArgs {
  token?: string;
  bridgeUrl?: string;
  desktopName?: string;
  workspace?: string;
  debug?: boolean;
  help?: boolean;
  version?: boolean;
  config?: string; // Custom config file path
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<OrbitConfig> = {
  bridgeUrl: 'ws://localhost:5000',
  debug: false,
  timeout: 30,
  autoReconnect: true,
};

/**
 * Config directory location
 * ~/.orbit/
 */
const getConfigDir = (): string => {
  const homeDir = os.homedir();
  return path.join(homeDir, '.orbit');
};

/**
 * Config file location
 * ~/.orbit/config.json
 */
const getConfigFilePath = (customPath?: string): string => {
  if (customPath) {
    return path.resolve(customPath);
  }
  return path.join(getConfigDir(), 'config.json');
};

/**
 * Ensure config directory exists
 */
const ensureConfigDir = (): void => {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
};

/**
 * Parse CLI arguments
 * Supports: --token, --bridge-url, --desktop-name, --workspace, --debug, --help, --version, --config
 */
export const parseCliArgs = (): CliArgs => {
  const args: CliArgs = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');

      switch (key) {
        case 'token':
          args.token = value || process.argv[++i];
          break;
        case 'bridge-url':
          args.bridgeUrl = value || process.argv[++i];
          break;
        case 'desktop-name':
          args.desktopName = value || process.argv[++i];
          break;
        case 'workspace':
          args.workspace = value || process.argv[++i];
          break;
        case 'debug':
          args.debug = true;
          break;
        case 'help':
          args.help = true;
          break;
        case 'version':
          args.version = true;
          break;
        case 'config':
          args.config = value || process.argv[++i];
          break;
        default:
          // Unknown argument, could log warning
          break;
      }
    }
  }

  return args;
};

/**
 * Load configuration from file
 * Merges with default config
 */
export const loadConfig = (cliArgs: CliArgs): OrbitConfig => {
  const configPath = getConfigFilePath(cliArgs.config);

  // Check if config file exists
  let fileConfig: Partial<OrbitConfig> = {};
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(configContent);
    } catch (error: any) {
      console.error(`Error reading config file: ${error.message}`);
      // Continue with defaults
    }
  }

  // Merge: CLI args > File config > Defaults
  const mergedConfig: OrbitConfig = {
    ...DEFAULT_CONFIG,
    ...fileConfig,
  } as OrbitConfig;

  // Override with CLI arguments (highest priority)
  if (cliArgs.token) mergedConfig.token = cliArgs.token;
  if (cliArgs.bridgeUrl) mergedConfig.bridgeUrl = cliArgs.bridgeUrl;
  if (cliArgs.desktopName) mergedConfig.desktopName = cliArgs.desktopName;
  if (cliArgs.workspace) mergedConfig.workspace = cliArgs.workspace;
  if (cliArgs.debug !== undefined) mergedConfig.debug = cliArgs.debug;

  return mergedConfig;
};

/**
 * Save configuration to file
 */
export const saveConfig = (config: Partial<OrbitConfig>): void => {
  ensureConfigDir();

  const configPath = getConfigFilePath();
  const currentConfig = loadConfig({});

  // Merge new config with existing
  const mergedConfig = {
    ...currentConfig,
    ...config,
  };

  try {
    fs.writeFileSync(
      configPath,
      JSON.stringify(mergedConfig, null, 2),
      'utf-8',
    );
  } catch (error: any) {
    throw new Error(`Failed to save config: ${error.message}`);
  }
};

/**
 * Validate configuration
 * Returns validation errors if any
 */
export const validateConfig = (config: OrbitConfig): string[] => {
  const errors: string[] = [];

  // Validate bridge URL
  if (!config.bridgeUrl) {
    errors.push('Bridge URL is required');
  } else {
    try {
      new URL(config.bridgeUrl);
    } catch {
      errors.push('Invalid bridge URL format');
    }
  }

  // Validate workspace if provided
  if (config.workspace) {
    if (!fs.existsSync(config.workspace)) {
      errors.push(`Workspace directory does not exist: ${config.workspace}`);
    }
  }

  // Validate timeout
  if (config.timeout !== undefined) {
    if (config.timeout < 1 || config.timeout > 300) {
      errors.push('Timeout must be between 1 and 300 seconds');
    }
  }

  return errors;
};

/**
 * Display help message
 */
export const showHelp = (): void => {
  console.log(`
Orbit Desktop TUI v1.0.0

USAGE:
  orbit-desktop [OPTIONS]

OPTIONS:
  --token <token>           Desktop connection token (from web app)
  --bridge-url <url>       Bridge server WebSocket URL (default: ws://localhost:5000)
  --desktop-name <name>    Desktop name for identification
  --workspace <path>        Default workspace directory
  --debug                   Enable debug logging
  --config <path>          Custom config file path
  --version                 Show version
  --help                    Show this help message

EXAMPLES:
  orbit-desktop --token orbit-dsk-abc123xyz
  orbit-desktop --bridge-url ws://production.example.com:5000 --debug
  orbit-desktop --token orbit-dsk-abc123xyz --desktop-name "My MacBook Pro"

FILES:
  ~/.orbit/config.json        Configuration file
  ~/.orbit/logs/              Log files directory

For more information, visit: https://orbit.ayande.xyz/docs
  `.trim());
};

/**
 * Display version
 */
export const showVersion = (): void => {
  console.log('Orbit Desktop TUI v1.0.0');
};

/**
 * Setup wizard for first-time users
 * Prompts user for required configuration
 */
export const runSetupWizard = async (): Promise<Partial<OrbitConfig>> => {
  const readline = (await import('readline')).createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      readline.question(prompt, (answer) => resolve(answer));
    });
  };

  console.log('\n=== Orbit Desktop TUI Setup ===\n');

  // Ask for bridge URL
  const bridgeUrl = await question(
    `Bridge Server WebSocket URL [ws://localhost:5000]: `,
  );

  // Ask for token
  const token = await question('Desktop connection token (from web app): ');

  // Ask for desktop name (optional)
  const desktopName = await question(
    'Desktop name (optional, press Enter to skip): ',
  );

  readline.close();

  const config: Partial<OrbitConfig> = {
    bridgeUrl: bridgeUrl.trim() || DEFAULT_CONFIG.bridgeUrl,
    token: token.trim() || undefined,
    desktopName: desktopName.trim() || undefined,
  };

  // Save config
  ensureConfigDir();
  const configPath = getConfigFilePath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

  console.log('\n✓ Configuration saved to', configPath);
  console.log('\nYou can now run: orbit-desktop\n');

  return config;
};

/**
 * Get log directory path
 * ~/.orbit/logs/
 */
export const getLogDir = (): string => {
  const logDir = path.join(getConfigDir(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
};

/**
 * Generate log file path with timestamp
 */
export const getLogFilePath = (): string => {
  const logDir = getLogDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  return path.join(logDir, `orbit-${timestamp}.log`);
};
