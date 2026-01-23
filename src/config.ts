import { config as dotenvConfig } from 'dotenv';
import { homedir } from 'os';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

dotenvConfig({ path: resolve(projectRoot, '.env') });

function expandPath(path: string, relativeToProject = false): string {
  if (path.startsWith('~')) {
    return path.replace('~', homedir());
  }
  if (path.startsWith('/')) {
    return path;
  }
  // Relative paths resolve from project root, not cwd
  if (relativeToProject) {
    return resolve(projectRoot, path);
  }
  return resolve(path);
}

export const config = {
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  obsidianVaultPath: expandPath(process.env.OBSIDIAN_VAULT_PATH || '~/Documents/Obsidian'),
  lancedbPath: expandPath(process.env.DATA_PATH || '~/.local/share/obsidian-rag'),
  embeddingModel: 'openai/text-embedding-3-small',
  embeddingDimension: 1536,
  chunkSize: 1000,
  chunkOverlap: 100,
};

export function validateConfig(): void {
  if (!config.openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY is required. Set it in .env or environment variables.');
  }
  
}
