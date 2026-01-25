import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config, validateConfig } from './config.js';
import { initDB } from './services/lancedb.js';
import { obsidianSearch, obsidianListFiles, obsidianGetFile } from './tools/search.js';
import { getObsidianUri, getDailyUri, openNote, openDaily } from './tools/obsidian-uri.js';
import { getBacklinks, getAllTags, getMetadata } from './tools/vault-analysis.js';
import pkg from '../package.json';

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
      {
        name: 'obsidian_get_uri',
        description: 'Generate an Obsidian URI link for a note. Returns the URI without opening anything.',
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
      {
        name: 'obsidian_get_daily_uri',
        description: 'Generate an Obsidian URI link for the daily note. Returns the URI without opening anything.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'obsidian_open_note',
        description: 'Opens a note in the Obsidian app. SIDE-EFFECT: This will launch or focus Obsidian on the user\'s system. Only use when the user explicitly asks to open a note in Obsidian.',
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
      {
        name: 'obsidian_open_daily',
        description: 'Opens the daily note in the Obsidian app. SIDE-EFFECT: This will launch or focus Obsidian on the user\'s system. Only use when the user explicitly asks to open the daily note.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'obsidian_get_backlinks',
        description: 'Find all notes that link to a specific note (backlinks). Useful for understanding how notes are connected.',
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
      {
        name: 'obsidian_get_tags',
        description: 'List all unique tags in the vault with their frequency count. Includes both inline #tags and frontmatter tags.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of tags to return (default: 50, sorted by frequency)',
              default: 50,
            },
          },
        },
      },
      {
        name: 'obsidian_get_metadata',
        description: 'Get only the frontmatter/properties of a file without the full content. Includes file stats like modified date.',
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
        const query = args?.query as string;
        const limit = (args?.limit as number) || 5;
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
        const limit = (args?.limit as number) || 50;

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
        const filePath = args?.file_path as string;

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

      case 'obsidian_get_uri': {
        const filePath = args?.file_path as string;
        const uri = getObsidianUri(filePath);

        return {
          content: [
            {
              type: 'text',
              text: uri,
            },
          ],
        };
      }

      case 'obsidian_get_daily_uri': {
        const uri = getDailyUri();

        return {
          content: [
            {
              type: 'text',
              text: uri,
            },
          ],
        };
      }

      case 'obsidian_open_note': {
        const filePath = args?.file_path as string;
        const uri = await openNote(filePath);

        return {
          content: [
            {
              type: 'text',
              text: `Opened in Obsidian: ${uri}`,
            },
          ],
        };
      }

      case 'obsidian_open_daily': {
        const uri = await openDaily();

        return {
          content: [
            {
              type: 'text',
              text: `Opened daily note in Obsidian: ${uri}`,
            },
          ],
        };
      }

      case 'obsidian_get_backlinks': {
        const filePath = args?.file_path as string;
        const backlinks = await getBacklinks(filePath);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(backlinks, null, 2),
            },
          ],
        };
      }

      case 'obsidian_get_tags': {
        const limit = (args?.limit as number) || 50;
        const tags = await getAllTags();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tags.slice(0, limit), null, 2),
            },
          ],
        };
      }

      case 'obsidian_get_metadata': {
        const filePath = args?.file_path as string;
        const metadata = await getMetadata(filePath);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(metadata, null, 2),
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

async function main() {
  try {
    validateConfig();
    await initDB();

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Obsidian RAG MCP server started');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

export { main as runServer };
