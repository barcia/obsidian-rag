#!/usr/bin/env bun

import { rmSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';

const command = process.argv[2];
const DATA_DIR = resolve(homedir(), '.local/share/obsidian-rag');

async function main() {
  switch (command) {
    case 'mcp-server':
      const { runServer } = await import('./server.js');
      await runServer();
      break;

    case 'index':
      const { runIndexer } = await import('./indexer.js');
      await runIndexer();
      break;

    case 'reindex':
      const { TABLE_NAME } = await import('./services/lancedb.js');
      console.log('Removing existing database...');
      rmSync(resolve(DATA_DIR, `${TABLE_NAME}.lance`), { recursive: true, force: true });
      console.log('Starting fresh index...\n');
      const { runIndexer: reindex } = await import('./indexer.js');
      await reindex();
      break;

    default:
      console.log(`obsidian-rag v1.0.0

Usage:
  obsidian-rag mcp-server   Start MCP server (stdio)
  obsidian-rag index        Index the Obsidian vault
  obsidian-rag reindex      Delete database and re-index

Config: ~/.local/share/obsidian-rag/.env
  OPENROUTER_API_KEY   API key for embeddings
  OBSIDIAN_VAULT_PATH  Path to Obsidian vault
`);
      process.exit(command ? 1 : 0);
  }
}

main();
