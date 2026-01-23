import { generateEmbedding } from '../services/embeddings.js';
import { search, listFiles } from '../services/lancedb.js';
import { readMarkdownFile } from '../services/markdown.js';
import { config } from '../config.js';
import { join } from 'path';
import type { SearchResult, IndexedFile } from '../types.js';

export async function obsidianSearch(
  query: string,
  limit: number = 5,
  fileFilter?: string
): Promise<SearchResult[]> {
  const queryVector = await generateEmbedding(query);
  return search(queryVector, limit, fileFilter);
}

export async function obsidianListFiles(
  pattern?: string,
  limit: number = 50
): Promise<IndexedFile[]> {
  return listFiles(pattern, limit);
}

export async function obsidianGetFile(filePath: string): Promise<string> {
  const fullPath = join(config.obsidianVaultPath, filePath);
  return readMarkdownFile(fullPath);
}
