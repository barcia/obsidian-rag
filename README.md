# Obsidian RAG MCP Server 🗄️🧠

A Model Context Protocol (MCP) server that provides semantic search capabilities for your Obsidian vault. It allows AI models (like Claude or Cursor) to search and retrieve content from your personal knowledge base using natural language.

## Features

- **Semantic Vector Search**: Find notes by meaning, not just keywords, using OpenAI embeddings and LanceDB.
- **Local Knowledge Base**: High-performance local vector storage using [LanceDB](https://lancedb.com/).
- **Incremental Indexing**: Intelligent indexing that only processes new or modified files using hash-based tracking.
- **Privacy First**: Your data stays local; only text fragments are sent to the embedding provider.

## 🛠 Tools Provided

The following tools are exposed to the MCP client:

- `obsidian_search`: Performs a semantic search across the vault. Returns relevant document chunks based on a natural language query.
- `obsidian_list_files`: Lists all indexed files, with optional pattern filtering.
- `obsidian_get_file`: Retrieves the full markdown content of a specific note.

## 🚀 Installation

> **Note**: These instructions are for macOS and Linux. Windows users might need to use WSL or Git Bash.

### Prerequisites

- [Node.js](https://nodejs.org/) (v24 or higher)
- [pnpm](https://pnpm.io/)
- An Obsidian vault.
- An OpenAI-compatible API key (defaulting to [OpenRouter](https://openrouter.ai/)).

### Setup

1. **Clone the repository**:
   (Recommended for macOS/Linux: `~/.local/opt`)
   ```bash
   mkdir -p ~/.local/opt && cd ~/.local/opt
   git clone https://github.com/yourusername/obsidian-rag.git
   cd obsidian-rag
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build the project**:
   ```bash
   pnpm run build
   ```

4. **Set environment variables**:
   The server requires two environment variables:
   - `OPENROUTER_API_KEY`: Your API key from [OpenRouter](https://openrouter.ai/).
   - `OBSIDIAN_VAULT_PATH`: Absolute path to your Obsidian vault (e.g., `/Users/you/Documents/Obsidian`).

### 🔍 Initial Indexing

Run the indexer once to create the initial vector database:
```bash
pnpm run index
```

To force a complete re-index (drops the existing database and indexes from scratch):
```bash
pnpm run reindex
```

## 🔌 Integration

### Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "obsidian-rag": {
      "command": "node",
      "args": ["/absolute/path/to/obsidian-rag/dist/server-mcp.js"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-your-api-key",
        "OBSIDIAN_VAULT_PATH": "/absolute/path/to/vault"
      }
    }
  }
}
```

### Cursor

1. Go to **Settings > Cursor Settings > MCP**.
2. Click **+ Add New MCP Server**.
3. Name: `obsidian-rag`
4. Type: `command`
5. Command: `node /absolute/path/to/obsidian-rag/dist/server-mcp.js`
6. Add environment variables: `OPENROUTER_API_KEY` and `OBSIDIAN_VAULT_PATH`.

## 🕒 Auto-indexing (macOS)

You can keep your index up to date automatically using the provided `plist` template.

1. Copy the template to your LaunchAgents folder:
   ```bash
   cp templates/local.obsidian-rag.index.plist.example ~/Library/LaunchAgents/local.obsidian-rag.index.plist
   ```
2. Edit the file:
   - Replace `{HOME}` with your home directory path (e.g., `/Users/yourname`).
   - Replace `{OBSIDIAN_VAULT_PATH}` with your vault path.
   - Replace `{YOUR_API_KEY}` with your OpenRouter API key.
3. Load the agent:
   ```bash
   launchctl load ~/Library/LaunchAgents/local.obsidian-rag.index.plist
   ```

## 🧪 Development

- `pnpm run build`: Compile the TypeScript code.
- `pnpm run typecheck`: Run type checking.
- `pnpm run reindex`: Drop the database and re-index the vault from scratch.
- `pnpm test`: Run tests using Vitest.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
