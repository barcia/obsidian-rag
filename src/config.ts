import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';

export const CONFIG_PATH = resolve(homedir(), '.config/obsidian-rag/config.json');
export const DATA_DIR = resolve(homedir(), '.local/share/obsidian-rag');

interface ConfigFile {
  openrouterApiKey?: string;
  obsidianVaultPath?: string;
}

function loadConfig(): ConfigFile {
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }
  try {
    const content = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error parsing ${CONFIG_PATH}:`, error instanceof Error ? error.message : error);
    return {};
  }
}

function expandPath(path: string): string {
  if (!path) return '';
  if (path.startsWith('~')) {
    return path.replace('~', homedir());
  }
  return resolve(path);
}

const fileConfig = loadConfig();

export const config = {
  openrouterApiKey: fileConfig.openrouterApiKey || '',
  obsidianVaultPath: expandPath(fileConfig.obsidianVaultPath || ''),
  lancedbPath: DATA_DIR,
  embeddingModel: 'openai/text-embedding-3-large',
  embeddingDimension: 3072,
  chunkSize: 1000,
  chunkOverlap: 100,
};

export function validateConfig(): void {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`Config file not found: ${CONFIG_PATH}`);
    console.error(`Create it with:\n  mkdir -p ~/.config/obsidian-rag`);
    console.error(`  cp config.json.example ~/.config/obsidian-rag/config.json`);
    process.exit(1);
  }
  if (!config.openrouterApiKey) {
    console.error(`Missing "openrouterApiKey" in ${CONFIG_PATH}`);
    process.exit(1);
  }
  if (!config.obsidianVaultPath) {
    console.error(`Missing "obsidianVaultPath" in ${CONFIG_PATH}`);
    process.exit(1);
  }
}
