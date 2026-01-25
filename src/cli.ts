#!/usr/bin/env bun

import { rmSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';
import pkg from '../package.json';

const command = process.argv[2];
const VERSION = pkg.version;
const DATA_DIR = resolve(homedir(), '.local/share/obsidian-rag');
const TABLE_NAME = 'obsidian_chunks';

async function main() {
  try {
    switch (command) {
      case 'mcp-server': {
        const { runServer } = await import('./server.js');
        await runServer();
        break;
      }

      case 'index': {
        const { runIndexer } = await import('./indexer.js');
        await runIndexer();
        break;
      }

      case 'reindex': {
        console.log('Removing existing database...');
        rmSync(resolve(DATA_DIR, `${TABLE_NAME}.lance`), { recursive: true, force: true });
        console.log('Starting fresh index...\n');
        const { runIndexer } = await import('./indexer.js');
        await runIndexer();
        break;
      }

      default:
        console.log(`obsidian-rag v${VERSION}

Usage:
  obsidian-rag mcp-server   Start MCP server (stdio)
  obsidian-rag index        Index the Obsidian vault
  obsidian-rag reindex      Delete database and re-index

Config: ~/.config/obsidian-rag/config.json
`);
        process.exit(command ? 1 : 0);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
