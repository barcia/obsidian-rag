function timestamp(): string {
  return new Date().toISOString();
}

export function log(message: string): void {
  console.log(`[${timestamp()}] ${message}`);
}

export function logError(message: string, error?: unknown): void {
  const errorStr = error instanceof Error ? error.message : String(error);
  console.error(`[${timestamp()}] ERROR: ${message}${error ? ` - ${errorStr}` : ''}`);
}
