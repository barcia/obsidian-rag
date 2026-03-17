import { homedir } from 'os';
import { resolve } from 'path';
import { existsSync } from 'fs';

export const DATA_DIR = resolve(homedir(), '.local/share/obsidian-rag');

function expandPath(path: string): string {
  if (!path) return '';
  if (path.startsWith('~')) {
    return path.replace('~', homedir());
  }
  return resolve(path);
}

const vaultPath = expandPath(process.env.OBSIDIAN_VAULT_PATH || '');

export const config = {
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  obsidianVaultPath: vaultPath,
  lancedbPath: DATA_DIR,
  embeddingModel: 'openai/text-embedding-3-large',
  embeddingDimension: 3072,
  chunkSize: 1000,
  chunkOverlap: 100,
};

export function validateConfig(): void {
  if (!config.openrouterApiKey) {
    throw new Error('Missing environment variable: OPENROUTER_API_KEY');
  }
  if (!config.obsidianVaultPath) {
    throw new Error('Missing environment variable: OBSIDIAN_VAULT_PATH');
  }
  if (!existsSync(config.obsidianVaultPath)) {
    throw new Error(`Vault path does not exist: ${config.obsidianVaultPath}`);
  }
  if (config.chunkOverlap >= config.chunkSize) {
    throw new Error(`chunkOverlap (${config.chunkOverlap}) must be less than chunkSize (${config.chunkSize})`);
  }
}
