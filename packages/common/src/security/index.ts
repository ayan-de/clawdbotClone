// Security utilities

import path from 'path';
import fs from 'fs';

export function sanitizeInput(input: string): string {
  return input
    .replace(/;/g, '')
    .replace(/\|/g, '')
    .replace(/&/g, '')
    .replace(/\n/g, '')
    .trim();
}

export function isPathSafe(targetPath: string, allowedBase: string = process.env.HOME || '/'): boolean {
  const resolvedPath = path.resolve(targetPath);
  const resolvedBase = path.resolve(allowedBase);

  return resolvedPath.startsWith(resolvedBase + path.sep) || resolvedPath === resolvedBase;
}

export const SAFE_COMMANDS = [
  'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'echo',
  'grep', 'find', 'cp', 'mv', 'rm', 'chmod', 'chown',
  'date', 'whoami', 'uname', 'sleep', 'head', 'tail',
  'wc', 'sort', 'uniq'
] as const;
