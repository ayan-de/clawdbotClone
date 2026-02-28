import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DesktopGateway } from '../websocket/desktop.gateway';
import { CommandResponseDto } from '../dto/execute-command.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Commands Service
 *
 * SINGLE AUTHORITY for all shell command execution in the Bridge architecture.
 *
 * Architecture Responsibilities:
 * - Python Agent: NLP translation, intent classification, planning
 * - Bridge (this service): Command execution orchestration (AUTHORITY)
 * - Desktop TUI: Actual shell command execution (only here)
 *
 * SINGLE AUTHORITY RULE:
 * This service is the ONLY component that should initiate shell command execution.
 * All command requests MUST route through this service.
 *
 * Provides synchronous interface over asynchronous WebSocket communication.
 */
@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);

  // Map requestId -> Promise resolver for command results
  private readonly pendingCommands = new Map<
    string,
    {
      resolve: (value: CommandResponseDto) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
      startTime: number;
      command: string;
    }
  >();

  constructor(
    private readonly desktopGateway: DesktopGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Subscribe to desktop events to resolve pending commands
    this.subscribeToDesktopEvents();
  }

  /**
   * Subscribe to desktop completion events to resolve pending commands
   */
  private subscribeToDesktopEvents(): void {
    // Command completed successfully
    this.eventEmitter.on('desktop.complete', (data: any) => {
      this.logger.debug(`Received desktop.complete: ${data.requestId}`);
      this.resolveCommand(data.requestId, {
        stdout: data.result?.stdout || '',
        stderr: data.result?.stderr || '',
        exit_code: data.result?.exitCode || 0,
      });
    });

    // Command failed with error
    this.eventEmitter.on('desktop.error', (data: any) => {
      this.logger.debug(`Received desktop.error: ${data.requestId}`);
      this.resolveCommand(data.requestId, {
        stdout: data.result?.stdout || '',
        stderr: data.result?.stderr || data.error || 'Command failed',
        exit_code: data.result?.exitCode || 1,
      });
    });
  }

  /**
   * Resolve a pending command with results
   */
  private resolveCommand(
    requestId: string,
    result: { stdout: string; stderr: string; exit_code: number },
  ): void {
    const pending = this.pendingCommands.get(requestId);

    if (!pending) {
      this.logger.warn(`Received result for unknown requestId: ${requestId}`);
      return;
    }

    const { resolve, timeout, startTime, command } = pending;
    const duration_ms = Date.now() - startTime;

    // Clear timeout
    clearTimeout(timeout);

    // Remove from pending
    this.pendingCommands.delete(requestId);

    // Resolve promise with result
    resolve({
      command,
      stdout: result.stdout,
      stderr: result.stderr,
      exit_code: result.exit_code,
      duration_ms,
      success: result.exit_code === 0,
    });

    this.logger.log(`Command completed: ${command} (${duration_ms}ms)`);
  }

  /**
   * Execute a command synchronously (with timeout)
   *
   * @param options Command execution options
   * @returns Command execution result
   */
  async executeCommand(options: {
    command: string;
    cwd?: string;
    timeout?: number;
    trusted?: boolean;
  }): Promise<CommandResponseDto> {
    const { command, cwd, timeout = 30000, trusted = false } = options;
    const startTime = Date.now();
    const requestId = `rest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    this.logger.log(`Executing command via REST: ${command} (requestId: ${requestId})`);

    // Check if we have any connected desktops
    // For now, we'll use the first available session
    // In production, you'd want to select based on user/session context
    const sessionId = await this.getAvailableSession();

    if (!sessionId) {
      throw new Error('No desktop connected');
    }

    // Create promise for this command
    const promise = new Promise<CommandResponseDto>((resolve, reject) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingCommands.delete(requestId);
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      // Store pending command
      this.pendingCommands.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle,
        startTime,
        command,
      });
    });

    // Send command to desktop via WebSocket
    try {
      await this.desktopGateway.sendCommand(sessionId, command, requestId, trusted);
    } catch (error: any) {
      // Clean up pending command on send failure
      this.pendingCommands.delete(requestId);
      throw error;
    }

    // Wait for result
    return promise;
  }

  /**
   * Get an available desktop session
   *
   * For now, returns the first available session.
   * In production, you'd want session/user context from the request.
   */
  private async getAvailableSession(): Promise<string | null> {
    // Access the sessionToSocket map from DesktopGateway
    // Since it's private, we need to use a workaround
    // For now, let's use the first available session

    // TODO: Implement proper session selection based on:
    // - User context (from JWT or API key)
    // - Session metadata
    // - Load balancing across multiple desktops

    // For MVP, we'll need to add a method to DesktopGateway
    // to expose connected sessions

    // Temporary: check if we can get any session
    // This requires DesktopGateway to expose session info
    // Let's add a method to get first session

    // Since DesktopGateway.sessionToSocket is private, we need to
    // either make it public or add a getter method

    // For now, let's assume there's at least one session
    // In production, this should be based on user authentication

    // Return a default session ID for testing
    // The desktop should have connected with a session ID
    // Get first available session from DesktopGateway
    const sessionId = this.desktopGateway.getFirstAvailableSession();

    if (!sessionId) {
      return null;
    }

    return sessionId;
  }

  /**
   * Build full command string from command and args
   */
  buildCommandString(command: string, args: string[] = []): string {
    if (!args || args.length === 0) {
      return command;
    }

    // Escape arguments with spaces or special characters
    const escapedArgs = args.map((arg) => {
      // Simple escaping: wrap in quotes if needed
      if (arg.includes(' ') || arg.includes('\t') || arg.includes('&')) {
        return `"${arg.replace(/"/g, '\\"')}"`;
      }
      return arg;
    });

    return `${command} ${escapedArgs.join(' ')}`;
  }
}
