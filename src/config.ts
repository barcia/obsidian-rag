import { config as loadDotenv } from 'dotenv';
import { homedir } from 'os';
import { resolve } from 'path';

const DATA_DIR = resolve(homedir(), '.local/share/obsidian-rag');
const ENV_PATH = resolve(DATA_DIR, '.env');

loadDotenv({ path: ENV_PATH });

function expandPath(path: string): string {
  if (path.startsWith('~')) {
    return path.replace('~', homedir());
  }
  return resolve(path);
}

export const config = {
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  obsidianVaultPath: expandPath(process.env.OBSIDIAN_VAULT_PATH || ''),
  lancedbPath: DATA_DIR,
  embeddingModel: process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small',
  embeddingDimension: 1536,
  chunkSize: 1000,
  chunkOverlap: 100,
};

export function validateConfig(): void {
  if (!config.openrouterApiKey) {
    throw new Error(`OPENROUTER_API_KEY is required. Set it in ${ENV_PATH}`);
  }
  if (!config.obsidianVaultPath) {
    throw new Error(`OBSIDIAN_VAULT_PATH is required. Set it in ${ENV_PATH}`);
  }
}
