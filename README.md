# Obsidian RAG MCP Server

Local RAG system for semantic search in your Obsidian vault using LanceDB and OpenRouter.

## Installation

1. Clone the repository to `~/.local/mcp`:

```bash
mkdir -p ~/.local/mcp
cd ~/.local/mcp
git clone <repo-url> obsidian-rag
cd obsidian-rag
```

2. Configure the `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```
OPENROUTER_API_KEY=sk-or-your-api-key
OBSIDIAN_VAULT_PATH=~/Documents/Obsidian
DATA_PATH=~/.local/share/obsidian-rag
```

> **Note**: Data is stored in `~/.local/share/obsidian-rag/` by default.

3. Install dependencies and build:

```bash
pnpm install
pnpm run build
```

4. Create symlinks for the executables:

```bash
mkdir -p ~/.local/bin/obsidian-rag
ln -sf ~/.local/mcp/obsidian-rag/dist/server.js ~/.local/bin/obsidian-rag/server.js
ln -sf ~/.local/mcp/obsidian-rag/dist/indexer.js ~/.local/bin/obsidian-rag/indexer.js
```

## Usage

### Index the vault

**Interactive mode** (terminal with visual output):

```bash
pnpm run index
```

**Automatic mode** (for cron/launchctl, writes to log):

```bash
pnpm run index:cron
```

Logs are saved to `~/.local/share/obsidian-rag/index.log`

### Configure in MCP client

Add to your MCP configuration (e.g., `~/.claude.json`):

```json
{
  "mcpServers": {
    "obsidian-rag": {
      "command": "node",
      "args": ["/Users/{USER}/.local/bin/obsidian-rag/server.js"]
    }
  }
}
```

### Automatic indexing with launchctl (macOS)

The `local.obsidian-rag.index.plist` file runs the indexer **every 4 hours**.

1. Copy the plist to LaunchAgents:

```bash
cp local.obsidian-rag.index.plist ~/Library/LaunchAgents/
```

2. Load the service:

```bash
launchctl load ~/Library/LaunchAgents/local.obsidian-rag.index.plist
```

3. Useful commands:

```bash
# Run manually
launchctl start local.obsidian-rag.index

# View logs
cat ~/.local/share/obsidian-rag/index.log

# Uninstall
launchctl unload ~/Library/LaunchAgents/local.obsidian-rag.index.plist
```

## Available MCP Tools

### `obsidian_search`

Semantic search in the vault.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Natural language query |
| `limit` | number | Number of results (default: 5) |
| `file_filter` | string | Filter by filename (optional) |

### `obsidian_list_files`

List indexed files.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pattern` | string | Filter by name (optional) |
| `limit` | number | Maximum results (default: 50) |

### `obsidian_get_file`

Get the full content of a file.

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_path` | string | Relative path to the vault |

## Directory Structure

```
~/.local/
├── mcp/obsidian-rag/            # Source code
├── bin/obsidian-rag/            # Symlinks to executables
│   ├── server.js
│   └── indexer.js
└── share/obsidian-rag/          # Data
    ├── obsidian_chunks.lance/   # Vector database
    └── index.log                # Indexing logs
```
