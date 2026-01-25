# Obsidian RAG MCP Server

MCP server para Obsidian con búsqueda semántica (RAG). Usa LanceDB y OpenRouter.

## Instalación

```bash
mkdir -p ~/.local/opt && cd ~/.local/opt
git clone <repo-url> obsidian-rag
cd obsidian-rag
git checkout $(git describe --tags --abbrev=0)  # última tag
pnpm install && pnpm build
```

Crear symlinks para uso:

```bash
mkdir -p ~/.local/bin/obsidian-rag
ln -sf ~/.local/opt/obsidian-rag/dist/indexer.js ~/.local/bin/obsidian-rag/indexer.js
ln -sf ~/.local/opt/obsidian-rag/dist/server-mcp.js ~/.local/bin/obsidian-rag/server-mcp.js
```

## Configuración

```bash
mkdir -p ~/.config/obsidian-rag
cp config.json.example ~/.config/obsidian-rag/config.json
# Editar con tu API key y path del vault
```

## MCP Client

En `~/.claude.json`:

```json
{
  "mcpServers": {
    "obsidian-rag": {
      "command": "fnm",
      "args": ["exec", "--using=24", "node", "~/.local/bin/obsidian-rag/server-mcp.js"]
    }
  }
}
```

## Auto-indexing (macOS)

```bash
cp local.obsidian-rag.index.plist.example ~/Library/LaunchAgents/local.obsidian-rag.index.plist
# Editar paths en el plist
launchctl load ~/Library/LaunchAgents/local.obsidian-rag.index.plist
```

## Tools

| Tool | Descripción |
|------|-------------|
| `obsidian_search` | Búsqueda semántica |
| `obsidian_list_files` | Listar archivos indexados |
| `obsidian_get_file` | Contenido completo de un archivo |
| `obsidian_get_uri` | URI de Obsidian para una nota |
| `obsidian_get_daily_uri` | URI para nota diaria |
| `obsidian_open_note` | Abrir nota en Obsidian |
| `obsidian_open_daily` | Abrir nota diaria en Obsidian |
| `obsidian_get_backlinks` | Notas que enlazan a un archivo |
| `obsidian_get_tags` | Tags con frecuencia |
| `obsidian_get_metadata` | Frontmatter de un archivo |
