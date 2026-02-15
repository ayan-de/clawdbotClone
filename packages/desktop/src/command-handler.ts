import { spawn, type ChildProcess } from 'child_process';
import { Logger } from './logger';
import {
  validateCommand,
  getSafeWorkingDir,
  parseCommand,
  COMMAND_TIMEOUT,
  MAX_OUTPUT_SIZE,
  type ValidationResult,
} from './security';
import type { CommandResult, DesktopMessageType } from './types';

const logger = Logger.getInstance();

/**
 * Command execution result
 */
export interface ExecutedCommand {
  command: string;
  result: CommandResult;
  processId?: number;
}

/**
 * Command Handler class
 * Executes shell commands safely with streaming output
 */
export class CommandHandler {
  private activeProcesses = new Map<number, ChildProcess>();
  private workingDir: string;
  private outputCallbacks = new Map<number, (output: string) => void>();

  constructor(workingDir?: string) {
    this.workingDir = getSafeWorkingDir(workingDir);
  }

  /**
   * Execute a command with streaming output
   */
  async executeCommand(
    command: string,
    onOutput?: (output: string) => void,
    onProgress?: (progress: { stdout?: string; stderr?: string }) => void,
  ): Promise<ExecutedCommand> {
    logger.debug(`Executing command: ${command}`);

    // Validate command first
    const validation: ValidationResult = validateCommand(command, this.workingDir);

    if (!validation.valid) {
      const errorResult: CommandResult = {
        command,
        success: false,
        error: validation.error,
      };

      if (onOutput) {
        onOutput(`Error: ${validation.error}\n`);
      }

      return { command, result: errorResult };
    }

    // Use validated/sanitized command
    const safeCommand = validation.safeCommand || command;

    // Parse command into name and arguments
    const { name: commandName, args: commandArgs } = parseCommand(safeCommand);

    logger.debug(`Parsed command: ${commandName} ${commandArgs.join(' ')}`);

    return new Promise<ExecutedCommand>((resolve) => {
      let stdout = '';
      let stderr = '';
      let stdoutSize = 0;
      let stderrSize = 0;

      const startTime = Date.now();

      // Spawn process
      const childProcess = spawn(commandName, commandArgs, {
        cwd: this.workingDir,
        env: { ...process.env, PATH: process.env.PATH },
        shell: false, // Safer: no shell expansion
      });

      const processId = childProcess.pid || Date.now();

      // Track active process
      this.activeProcesses.set(processId, childProcess);

      // Timeout handler
      const timeoutId = setTimeout(() => {
        logger.warn(`Command timed out: ${safeCommand}`);
        this.killProcess(processId, 'Command timed out');
      }, COMMAND_TIMEOUT);

      // Cleanup on timeout if command completes
      childProcess.on('close', () => {
        clearTimeout(timeoutId);
      });

      // Handle stdout
      childProcess.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString('utf-8');

        // Check output size limit
        stdoutSize += chunk.length;
        if (stdoutSize > MAX_OUTPUT_SIZE) {
          logger.warn(`Output limit reached, truncating stdout`);
          childProcess.stdout?.destroy();
          return;
        }

        stdout += chunk;

        // Stream to callback
        if (onOutput) {
          onOutput(chunk);
        }

        if (onProgress) {
          onProgress({ stdout: chunk });
        }
      });

      // Handle stderr
      childProcess.stderr?.on('data', (data: Buffer) => {
        const chunk = data.toString('utf-8');

        // Check output size limit
        stderrSize += chunk.length;
        if (stderrSize > MAX_OUTPUT_SIZE) {
          logger.warn(`Output limit reached, truncating stderr`);
          childProcess.stderr?.destroy();
          return;
        }

        stderr += chunk;

        // Stream to callback
        if (onOutput) {
          onOutput(chunk);
        }

        if (onProgress) {
          onProgress({ stderr: chunk });
        }
      });

      // Handle process exit
      childProcess.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
        const duration = Date.now() - startTime;

        this.activeProcesses.delete(processId);
        clearTimeout(timeoutId);

        const result: CommandResult = {
          command: safeCommand,
          success: code === 0,
          stdout,
          stderr,
          exitCode: code || undefined,
          duration,
          signal: signal || undefined,
        };

        if (code === 0) {
          logger.debug(`Command completed successfully in ${duration}ms: ${safeCommand}`);
        } else {
          logger.warn(`Command failed with code ${code}: ${safeCommand}`);
        }

        resolve({ command: safeCommand, result, processId });
      });

      // Handle process error
      childProcess.on('error', (error: Error) => {
        const duration = Date.now() - startTime;

        this.activeProcesses.delete(processId);
        clearTimeout(timeoutId);

        const errorResult: CommandResult = {
          command: safeCommand,
          success: false,
          error: error.message,
          duration,
        };

        logger.error(`Command error: ${safeCommand} - ${error.message}`);

        resolve({ command: safeCommand, result: errorResult, processId });
      });
    });
  }

  /**
   * Kill a running process
   */
  killProcess(processId: number, reason?: string): boolean {
    const process = this.activeProcesses.get(processId);

    if (!process) {
      logger.warn(`Process not found: ${processId}`);
      return false;
    }

    logger.debug(`Killing process ${processId}: ${reason}`);

    try {
      // Try graceful shutdown first
      process.kill('SIGTERM');

      // Wait a bit, then force kill if still running
      setTimeout(() => {
        if (this.activeProcesses.has(processId)) {
          logger.debug(`Force killing process ${processId}`);
          process.kill('SIGKILL');
        }
      }, 500);

      this.activeProcesses.delete(processId);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to kill process ${processId}: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Kill all active processes
   */
  killAllProcesses(reason?: string): number {
    const killedCount = this.activeProcesses.size;

    for (const [processId, process] of this.activeProcesses.entries()) {
      try {
        process.kill('SIGTERM');
        setTimeout(() => {
          if (this.activeProcesses.has(processId)) {
            process.kill('SIGKILL');
          }
        }, 500);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to kill process ${processId}: ${errorMessage}`);
      }
    }

    this.activeProcesses.clear();

    if (killedCount > 0) {
      logger.info(`Killed ${killedCount} active processes: ${reason}`);
    }

    return killedCount;
  }

  /**
   * Get active process count
   */
  getActiveProcessCount(): number {
    return this.activeProcesses.size;
  }

  /**
   * Get list of active process IDs
   */
  getActiveProcessIds(): number[] {
    return Array.from(this.activeProcesses.keys());
  }

  /**
   * Change working directory
   */
  setWorkingDir(newDir: string): boolean {
    try {
      const validation = validateCommand(`cd ${newDir}`, this.workingDir);

      if (!validation.valid) {
        logger.error(`Cannot change to directory: ${validation.error}`);
        return false;
      }

      const safeDir = validation.safeCommand?.split(/\s+/)[1];

      if (safeDir) {
        this.workingDir = safeDir;
        logger.info(`Working directory changed to: ${this.workingDir}`);
        return true;
      }

      return false;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to change directory: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get current working directory
   */
  getWorkingDir(): string {
    return this.workingDir;
  }

  /**
   * Execute multiple commands sequentially
   * Useful for command chains like "cd ~/projects/test && code ."
   */
  async executeCommands(
    commands: string[],
    onOutput?: (output: string) => void,
  ): Promise<ExecutedCommand[]> {
    const results: ExecutedCommand[] = [];

    for (const command of commands) {
      // Check if previous command failed
      const lastResult = results[results.length - 1];
      if (lastResult && !lastResult.result.success) {
        logger.warn(`Stopping execution: previous command failed`);
        break;
      }

      const result = await this.executeCommand(command, onOutput);
      results.push(result);
    }

    return results;
  }

  /**
   * Parse chained commands (&& separated)
   * Returns individual commands
   */
  parseChainedCommands(command: string): string[] {
    return command.split(/\s*&&\s*/).map((cmd) => cmd.trim()).filter((cmd) => cmd.length > 0);
  }

  /**
   * Execute command with auto-chaining support
   */
  async executeWithAutoChain(
    command: string,
    onOutput?: (output: string) => void,
  ): Promise<ExecutedCommand[]> {
    // Check if command contains chains
    if (command.includes(' && ')) {
      const commands = this.parseChainedCommands(command);

      if (commands.length > 1) {
        logger.debug(`Executing chained commands: ${commands.length}`);
        return this.executeCommands(commands, onOutput);
      }
    }

    // Single command
    const result = await this.executeCommand(command, onOutput);
    return [result];
  }

  /**
   * Cleanup on shutdown
   */
  cleanup(): void {
    const killedCount = this.killAllProcesses('Shutdown');
    logger.info(`Command handler cleanup complete`);
  }
}

// Cleanup on process exit
process.on('exit', () => {
  // Cleanup will be handled by CommandHandler instance if created
});

process.on('SIGINT', () => {
  // Cleanup will be handled by CommandHandler instance if created
});

process.on('SIGTERM', () => {
  // Cleanup will be handled by CommandHandler instance if created
});
