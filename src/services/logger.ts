import { appendFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from '../config.js';

function timestamp(): string {
  return new Date().toISOString();
}

export function log(message: string): void {
  const formatted = `[${timestamp()}] ${message}`;
  if (config.logPath) {
    mkdirSync(dirname(config.logPath), { recursive: true });
    appendFileSync(config.logPath, formatted + '\n');
  } else {
    console.log(formatted);
  }
}

export function logError(message: string, error?: unknown): void {
  const errorStr = error instanceof Error ? error.message : String(error);
  const formatted = `[${timestamp()}] ERROR: ${message}${error ? ` - ${errorStr}` : ''}`;
  if (config.logPath) {
    mkdirSync(dirname(config.logPath), { recursive: true });
    appendFileSync(config.logPath, formatted + '\n');
  } else {
    console.error(formatted);
  }
}
