/**
 * Command Execution Service Interface
 * Defines the contract for command execution and lifecycle management
 * Follows Dependency Inversion Principle - high-level modules depend on abstractions
 */
export interface ICommandExecutionService {
    /**
     * Handle incoming chat message from platforms
     */
    handleIncomingMessage(message: any): Promise<void>;

    /**
     * Handle command result from desktop
     */
    handleCommandResult(result: any): Promise<void>;

    /**
     * Execute a command on a specific session
     */
    executeCommand(sessionId: string, command: string, options?: {
        userMessage?: string;
        userId?: string;
    }): Promise<boolean>;

    /**
     * Cancel a running command
     */
    cancelCommand(sessionId: string): Promise<boolean>;

    /**
     * Get status of a command execution
     */
    getCommandStatus(sessionId: string): Promise<'idle' | 'running' | 'cancelled' | 'failed'>;
}
