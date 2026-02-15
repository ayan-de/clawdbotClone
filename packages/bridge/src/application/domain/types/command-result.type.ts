/**
 * Command Result Type
 * Represents the result of a command execution
 * Used to communicate command execution status and output
 */
export interface CommandResult {
  /** The command that was executed */
  command: string;
  /** Whether the command executed successfully */
  success: boolean;
  /** Standard output from the command */
  stdout: string;
  /** Standard error output from the command */
  stderr: string;
  /** Exit code returned by the command */
  exitCode: number;
  /** Timestamp when the command was executed */
  timestamp: Date;
}
