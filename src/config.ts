import { homedir } from 'os';
import { resolve, basename } from 'path';

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
  vaultName: basename(vaultPath),
  lancedbPath: DATA_DIR,
  embeddingModel: 'openai/text-embedding-3-large',
  embeddingDimension: 3072,
  chunkSize: 1000,
  chunkOverlap: 100,
};

export function validateConfig(): void {
  if (!config.openrouterApiKey) {
    console.error('Missing environment variable: OPENROUTER_API_KEY');
    process.exit(1);
  }
  if (!config.obsidianVaultPath) {
    console.error('Missing environment variable: OBSIDIAN_VAULT_PATH');
    process.exit(1);
  }
}
