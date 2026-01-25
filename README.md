# Obsidian RAG MCP Server

MCP server for Obsidian with semantic search (RAG) and vault analysis tools. Uses LanceDB for vector storage and OpenRouter for embeddings.

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
bun install
bun run build
cp dist/obsidian-rag-* ~/.local/bin/obsidian-rag
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
obsidian-rag index        # Index your vault
obsidian-rag reindex      # Delete database and re-index
obsidian-rag mcp-server   # Start MCP server
```

## MCP Client

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "obsidian-rag": {
      "command": "{YOUR_HOME}/.local/bin/obsidian-rag",
      "args": ["mcp-server"]
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
bun run mcp-server   # Run server
bun run index        # Run indexer  
bun run reindex      # Fresh re-index
bun test             # Run tests
bun run build        # Compile binary
```
