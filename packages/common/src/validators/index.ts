// Command validation utilities

import { z } from 'zod';

export const safeCommands = [
  'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'echo',
  'grep', 'find', 'cp', 'mv', 'rm', 'chmod', 'chown',
  'date', 'whoami', 'uname', 'sleep', 'head', 'tail',
  'wc', 'sort', 'uniq'
] as const;

export type SafeCommand = typeof safeCommands[number];

export const CommandSchema = z.object({
  command: z.string().min(1),
  args: z.array(z.string()).optional()
});

export function validateCommand(command: string): { valid: boolean; reason?: string } {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];

  if (!safeCommands.includes(cmd as SafeCommand)) {
    return { valid: false, reason: `Command '${cmd}' is not allowed` };
  }

  return { valid: true };
}
