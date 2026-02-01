# Obsidian RAG MCP Server 🗄️🧠

A powerful Model Context Protocol (MCP) server that provides Retrieval-Augmented Generation (RAG) capabilities for your Obsidian vault. It allows AI models (like Claude or Cursor) to semantically search, analyze, and interact with your personal knowledge base.

## Features

- **Semantic Vector Search**: Find notes by meaning, not just keywords, using OpenAI embeddings and LanceDB.
- **Local Knowledge Base**: High-performance local vector storage using [LanceDB](https://lancedb.com/).
- **Incremental Indexing**: Intelligent indexing that only processes new or modified files using hash-based tracking.
- **Deep Vault Analysis**: Tools to explore backlinks, tags, and metadata for better context understanding.
- **Obsidian Integration**: Open notes or daily notes directly in the Obsidian app from your AI chat.
- **Privacy First**: Your data stays local; only text fragments are sent to the embedding provider.

## 🛠 Tools Provided

The following tools are exposed to the MCP client:

### Search & Retrieval
- `obsidian_search`: Performs a semantic search across the vault. Returns relevant document chunks based on a natural language query.
- `obsidian_list_files`: Lists all indexed files, with optional pattern filtering.
- `obsidian_get_file`: Retrieves the full markdown content of a specific note.

### Interaction
- `obsidian_get_uri`: Generates an `obsidian://` URI link for a note.
- `obsidian_get_daily_uri`: Generates an `obsidian://` URI link for today's daily note.
- `obsidian_open_note`: Opens a specific note directly in the Obsidian app.
- `obsidian_open_daily`: Opens the daily note directly in the Obsidian app.

### Analysis
- `obsidian_get_backlinks`: Lists all notes that link to a specific note.
- `obsidian_get_tags`: Lists all unique tags in the vault with their frequency count.
- `obsidian_get_metadata`: Retrieves frontmatter/properties and file statistics without the full content.

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

4. **Configure the server**:
   Create the configuration directory and copy the example config:
   ```bash
   mkdir -p ~/.config/obsidian-rag
   cp templates/config.json.example ~/.config/obsidian-rag/config.json
   ```
   Edit `~/.config/obsidian-rag/config.json` with your details:
   - `openrouterApiKey`: Your API key.
   - `obsidianVaultPath`: Absolute path to your Obsidian vault.

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
      "args": ["/absolute/path/to/obsidian-rag/dist/server-mcp.js"]
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

## 🕒 Auto-indexing (macOS)

You can keep your index up to date automatically using the provided `plist` template.

1. Copy the template to your LaunchAgents folder:
   ```bash
   cp templates/local.obsidian-rag.index.plist.example ~/Library/LaunchAgents/local.obsidian-rag.index.plist
   ```
2. Edit the file to replace `{HOME}` and `{OBSIDIAN_VAULT_PATH}` with your actual absolute paths.
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
