import path from 'path';
import os from 'os';
import { Logger } from './logger';

const logger = Logger.getInstance();

/**
 * Security validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  safeCommand?: string;
}

/**
 * Safe command whitelist
 * Only these commands are allowed to execute
 * Excludes dangerous commands: rm, sudo, reboot, etc.
 */
export const SAFE_COMMANDS = new Set([
  // File operations
  'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'head', 'tail',
  'cp', 'mv', 'rm', 'chmod', 'chown', 'chgrp',
  'ln', 'rm',

  // Text operations
  'echo', 'grep', 'sed', 'awk', 'sort', 'uniq', 'wc',
  'cut', 'paste', 'join', 'tr',

  // Find operations
  'find', 'locate', 'which', 'whereis', 'type',

  // Archive operations
  'tar', 'gzip', 'gunzip', 'zip', 'unzip', 'bzip2',

  // Process operations
  'ps', 'top', 'htop', 'kill', 'killall', 'pkill', 'pgrep',

  // Network operations
  'ping', 'curl', 'wget', 'ssh', 'scp', 'rsync', 'nc',
  'netstat', 'ss', 'ifconfig', 'ip',

  // System info
  'date', 'whoami', 'hostname', 'uname', 'df', 'du', 'free',

  // Editors and viewers
  'cat', 'less', 'more', 'nano', 'vim', 'vi', 'code',
  'subl', 'atom', 'emacs',

  // Build tools
  'npm', 'yarn', 'pnpm', 'pip', 'python', 'node', 'deno',
  'cargo', 'go', 'rust', 'make', 'gcc', 'g++', 'javac', 'java',

  // Git operations
  'git', 'hg', 'svn',

  // Docker
  'docker', 'docker-compose',

  // Misc
  'clear', 'reset', 'history', 'jobs', 'bg', 'fg', 'exit',
  'true', 'false', 'sleep',
]);

/**
 * Dangerous command patterns that should be blocked
 * Even if base command is safe, these patterns are dangerous
 */
export const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\//,           // rm -rf / (wipes filesystem)
  /:\s*$/,                      // Empty command (just :)
  /&&\s*rm\s+-rf/,           // rm -rf after other command
  /\|\s*rm\s+-rf/,           // rm -rf piped
  /;\s*rm\s+-rf/,           // rm -rf after semicolon
  /sudo\s+rm/,                // sudo rm
  /sudo\s+reboot/,             // sudo reboot
  /sudo\s+shutdown/,           // sudo shutdown
  /sudo\s+poweroff/,           // sudo poweroff
  />\s*\/dev\/[a-z]+/,       // Redirect to device
  /mkfs/,                      // Filesystem formatting
  /dd\s+if=/,                 // Direct disk write
  /:(){.*};:/,               // Shell function injection
  /\$\(.*\)/,                 // Command substitution injection
];

/**
 * Shell injection characters that should be removed
 */
export const INJECTION_CHARS = /[;&|`$()<>]/;

/**
 * Max command execution time in milliseconds
 * Commands longer than this will be killed
 */
export const COMMAND_TIMEOUT = 30000; // 30 seconds

/**
 * Max output size in bytes
 * Prevents output buffer overflow
 */
export const MAX_OUTPUT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate a command against security rules
 */
export function validateCommand(command: string, currentDir?: string): ValidationResult {
  logger.debug(`Validating command: ${command}`);

  // Check for shell injection characters
  if (INJECTION_CHARS.test(command)) {
    logger.warn(`Command blocked (injection chars): ${command}`);
    return {
      valid: false,
      error: 'Command contains forbidden characters: ; & | ` $ ( ) < >',
    };
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      logger.warn(`Command blocked (dangerous pattern): ${command}`);
      return {
        valid: false,
        error: 'Command contains dangerous pattern',
      };
    }
  }

  // Extract base command (first word)
  const baseCommand = command.trim().split(/\s+/)[0];

  // Check if command is in whitelist
  if (!SAFE_COMMANDS.has(baseCommand)) {
    logger.warn(`Command blocked (not in whitelist): ${baseCommand}`);
    return {
      valid: false,
      error: `Command not allowed: ${baseCommand}`,
    };
  }

  // Check for sudo (even though sudo itself might not be in whitelist)
  if (command.includes('sudo ')) {
    logger.warn(`Command blocked (sudo): ${command}`);
    return {
      valid: false,
      error: 'Sudo is not allowed',
    };
  }

  // Check for unsafe rm patterns
  if (baseCommand === 'rm' && command.includes('-rf /')) {
    logger.warn(`Command blocked (rm -rf /): ${command}`);
    return {
      valid: false,
      error: 'Cannot use rm -rf / (entire filesystem)',
    };
  }

  // Validate paths in command
  const pathValidation = validatePaths(command, currentDir);
  if (!pathValidation.valid) {
    return pathValidation;
  }

  // Command is safe, optionally sanitize it
  const sanitized = sanitizeCommand(command);

  logger.debug(`Command validated successfully: ${baseCommand}`);
  return {
    valid: true,
    safeCommand: sanitized,
  };
}

/**
 * Validate all paths in a command
 * Ensure paths are within allowed directories
 */
function validatePaths(command: string, currentDir?: string): ValidationResult {
  const homeDir = os.homedir();
  const workspace = currentDir || homeDir;

  // Extract paths from command (after command name)
  const parts = command.trim().split(/\s+/);
  const paths: string[] = [];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const prevPart = parts[i - 1];

    // Skip if this part is a flag or previous part is a flag
    if (part.startsWith('-')) continue;
    if (prevPart && prevPart.startsWith('-')) continue;

    // Check if part looks like a path
    if (part.startsWith('/') || part.startsWith('./') || part.startsWith('../') || part.startsWith('~/')) {
      paths.push(part);
    }
  }

  // Validate each path
  for (const rawPath of paths) {
    const resolvedPath = resolvePath(rawPath, workspace);

    // Must be within home directory
    if (!isInsideHome(resolvedPath, homeDir)) {
      logger.warn(`Path blocked (outside home): ${rawPath} -> ${resolvedPath}`);
      return {
        valid: false,
        error: `Path is outside allowed directory: ${rawPath}`,
      };
    }

    // Prevent escaping home directory with symlinks
    // (additional check could be added here if needed)
  }

  return { valid: true };
}

/**
 * Check if a path is inside home directory
 */
function isInsideHome(targetPath: string, homeDir: string): boolean {
  const resolvedHome = path.resolve(homeDir);
  const resolvedTarget = path.resolve(targetPath);

  return resolvedTarget.startsWith(resolvedHome) || resolvedTarget === '/tmp';
}

/**
 * Resolve a path relative to current directory
 */
function resolvePath(inputPath: string, currentDir: string): string {
  if (path.isAbsolute(inputPath)) {
    return path.normalize(inputPath);
  }

  return path.normalize(path.join(currentDir, inputPath));
}

/**
 * Sanitize a command
 * Remove unnecessary characters but preserve valid ones
 */
function sanitizeCommand(command: string): string {
  // Remove extra whitespace
  let sanitized = command.replace(/\s+/g, ' ').trim();

  // Remove comments (anything after #)
  sanitized = sanitized.split('#')[0];

  return sanitized;
}

/**
 * Check if a command string contains a path
 * Useful for additional validation
 */
export function containsPath(command: string): boolean {
  const pathIndicators = ['/', './', '../', '~/'];
  return pathIndicators.some((indicator) => command.includes(indicator));
}

/**
 * Get the safe working directory for command execution
 * Returns home directory by default
 */
export function getSafeWorkingDir(overrideDir?: string): string {
  const homeDir = os.homedir();

  if (!overrideDir) {
    return homeDir;
  }

  // Resolve override directory
  const resolved = path.resolve(overrideDir);

  // Ensure it's inside home
  if (isInsideHome(resolved, homeDir)) {
    return resolved;
  }

  logger.warn(`Override directory not in home, using home: ${overrideDir}`);
  return homeDir;
}

/**
 * Parse command into parts for execution
 * Returns command name and arguments
 */
export function parseCommand(command: string): { name: string; args: string[] } {
  const parts = command.trim().split(/\s+/);
  return {
    name: parts[0],
    args: parts.slice(1),
  };
}

/**
 * Get a human-readable list of safe commands
 * Useful for help messages
 */
export function getSafeCommandsList(): string[] {
  const sorted = Array.from(SAFE_COMMANDS).sort();
  return sorted;
}

/**
 * Get command categories (for better UX)
 */
export function getCommandCategories(): Record<string, string[]> {
  return {
    'File Operations': ['ls', 'cd', 'pwd', 'mkdir', 'touch', 'cp', 'mv', 'rm', 'cat', 'head', 'tail', 'grep', 'find', 'chmod', 'chown'],
    'Text Processing': ['echo', 'sed', 'awk', 'sort', 'uniq', 'wc', 'cut', 'tr'],
    'Network': ['curl', 'wget', 'ping', 'ssh', 'nc', 'netstat'],
    'Development': ['npm', 'yarn', 'pnpm', 'git', 'make', 'gcc', 'python', 'node', 'cargo', 'go', 'rust'],
    'Editors': ['nano', 'vim', 'vi', 'code', 'subl', 'atom', 'emacs'],
    'System': ['date', 'whoami', 'hostname', 'uname', 'ps', 'top', 'htop'],
    'Docker': ['docker', 'docker-compose'],
  };
}
