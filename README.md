# Obsidian RAG MCP Server

MCP server for Obsidian with semantic search (RAG) and vault analysis tools. Uses LanceDB for vector storage and OpenRouter for embeddings.

## Requirements

- Node.js >= 24.0.0
- pnpm

## Tools

| Tool | Description |
|------|-------------|
| `obsidian_search` | Semantic search in your vault |
| `obsidian_list_files` | List indexed files |
| `obsidian_get_file` | Get full file content |
| `obsidian_get_uri` | Get Obsidian URI for a note |
| `obsidian_get_daily_uri` | Get Obsidian URI for daily note |
| `obsidian_open_note` | Open note in Obsidian app (side-effect) |
| `obsidian_open_daily` | Open daily note in Obsidian app (side-effect) |
| `obsidian_get_backlinks` | Find notes linking to a file |
| `obsidian_get_tags` | List all tags with frequency |
| `obsidian_get_metadata` | Get file frontmatter only |

## Install

```bash
git clone <repo-url> && cd obsidian-rag
pnpm install
pnpm build
```

## Configure

```bash
mkdir -p ~/.config/obsidian-rag
cp config.json.example ~/.config/obsidian-rag/config.json
```

```json
{
  "openrouterApiKey": "sk-or-your-api-key",
  "obsidianVaultPath": "~/Documents/Obsidian"
}
```

## Usage

```bash
pnpm index        # Index your vault
pnpm server-mcp   # Start MCP server
```

## MCP Client

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "obsidian-rag": {
      "command": "node",
      "args": ["{YOUR_PROJECT_PATH}/dist/server-mcp.js"]
    }
  }
}
```

## Auto-indexing (macOS)

```bash
cp local.obsidian-rag.index.plist.example ~/Library/LaunchAgents/local.obsidian-rag.index.plist
# Edit plist with your paths
launchctl load ~/Library/LaunchAgents/local.obsidian-rag.index.plist
```

Re-indexes on vault changes (throttled 10 min).

## Development

```bash
pnpm dev:server-mcp   # Run server (tsx, no build)
pnpm dev:index        # Run indexer (tsx, no build)
pnpm test             # Run tests
pnpm typecheck        # Type check
pnpm build            # Transpile to dist/
```
