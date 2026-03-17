import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config, validateConfig } from './config.js';
import { initDB, closeDB } from './services/lancedb.js';
import { obsidianSearch, obsidianListFiles, obsidianGetFile } from './tools/search.js';
import { log, logError } from './services/logger.js';
import pkg from '../package.json' with { type: 'json' };

const MAX_SEARCH_LIMIT = 100;
const MAX_LIST_LIMIT = 500;

const server = new Server(
  {
    name: 'obsidian-rag',
    version: pkg.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'obsidian_search',
        description: 'Semantic search in the Obsidian vault. Returns relevant document chunks based on natural language query.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language search query',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 5)',
              default: 5,
            },
            file_filter: {
              type: 'string',
              description: 'Optional: filter results by filename (partial match)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'obsidian_list_files',
        description: 'List all indexed files from the Obsidian vault',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Optional: filter files by name pattern',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of files to return (default: 50)',
              default: 50,
            },
          },
        },
      },
      {
        name: 'obsidian_get_file',
        description: 'Get the full content of a specific markdown file from the vault',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: {
              type: 'string',
              description: 'Relative path to the file within the vault',
            },
          },
          required: ['file_path'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'obsidian_search': {
        if (typeof args?.query !== 'string' || !args.query.trim()) {
          throw new Error('query must be a non-empty string');
        }
        const query = args.query;
        const limit = Math.min((args?.limit as number) || 5, MAX_SEARCH_LIMIT);
        const fileFilter = args?.file_filter as string | undefined;

        const results = await obsidianSearch(query, limit, fileFilter);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'obsidian_list_files': {
        const pattern = args?.pattern as string | undefined;
        const limit = Math.min((args?.limit as number) || 50, MAX_LIST_LIMIT);

        const files = await obsidianListFiles(pattern, limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(files, null, 2),
            },
          ],
        };
      }

      case 'obsidian_get_file': {
        if (typeof args?.file_path !== 'string' || !args.file_path.trim()) {
          throw new Error('file_path must be a non-empty string');
        }
        const filePath = args.file_path;

        const content = await obsidianGetFile(filePath);

        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

async function cleanup() {
  log('Shutting down...');
  await closeDB();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function main() {
  try {
    validateConfig();
    await initDB();

    const transport = new StdioServerTransport();
    await server.connect(transport);

    log('Obsidian RAG MCP server started');
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
}

export { main as runServer };

main();
