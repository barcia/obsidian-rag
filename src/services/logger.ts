import { appendFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { config } from '../config.js';

function getLogFile(): string | undefined {
  const logFile = process.env.LOG_FILE;
  if (!logFile) return undefined;

  // If LOG_FILE is just "1" or "true", use DATA_PATH from config
  if (logFile === '1' || logFile === 'true') {
    return join(config.lancedbPath, 'index.log');
  }

  // Expand ~ if present
  if (logFile.startsWith('~')) {
    const { homedir } = require('os');
    return logFile.replace('~', homedir());
  }

  return logFile;
}

const LOG_FILE = getLogFile();

function timestamp(): string {
  return new Date().toISOString();
}

function writeToFile(message: string): void {
  if (!LOG_FILE) return;

  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true });
    appendFileSync(LOG_FILE, message + '\n');
  } catch {
    // Fallback to console if file write fails
    console.error(message);
  }
}

export function log(message: string): void {
  const formatted = `[${timestamp()}] ${message}`;
  if (LOG_FILE) {
    writeToFile(formatted);
  } else {
    console.log(message);
  }
}

export function logError(message: string, error?: unknown): void {
  const errorStr = error instanceof Error ? error.message : String(error);
  const formatted = `[${timestamp()}] ERROR: ${message}${error ? ` - ${errorStr}` : ''}`;
  if (LOG_FILE) {
    writeToFile(formatted);
  } else {
    console.error(message, error || '');
  }
}

export function isFileLogging(): boolean {
  return !!LOG_FILE;
}
