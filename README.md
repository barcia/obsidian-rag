# Obsidian RAG MCP Server

Sistema RAG local para búsqueda semántica en tu vault de Obsidian usando LanceDB y OpenRouter.

## Instalación

1. Clona el repositorio en `~/.local/mcp`:

```bash
mkdir -p ~/.local/mcp
cd ~/.local/mcp
git clone <repo-url> obsidian-rag
cd obsidian-rag
```

2. Configura el `.env`:

```bash
cp .env.example .env
```

Edita `.env` con tu configuración:

```
OPENROUTER_API_KEY=sk-or-tu-api-key
OBSIDIAN_VAULT_PATH=~/Documents/Obsidian
DATA_PATH=~/.local/share/obsidian-rag
```

> **Nota**: Los datos se guardan en `~/.local/share/obsidian-rag/` por defecto.

3. Instala dependencias y compila:

```bash
pnpm install
pnpm run build
```

4. Crea symlinks para los ejecutables:

```bash
mkdir -p ~/.local/bin/obsidian-rag
ln -sf ~/.local/mcp/obsidian-rag/dist/server.js ~/.local/bin/obsidian-rag/server.js
ln -sf ~/.local/mcp/obsidian-rag/dist/indexer.js ~/.local/bin/obsidian-rag/indexer.js
```

## Uso

### Indexar el vault

**Modo interactivo** (terminal con output visual):

```bash
pnpm run index
```

**Modo automático** (para cron/launchctl, escribe a log):

```bash
pnpm run index:cron
```

Los logs se guardan en `~/.local/share/obsidian-rag/index.log`

### Configurar en cliente MCP

Agrega a tu configuración MCP (ej. `~/.claude.json`):

```json
{
  "mcpServers": {
    "obsidian-rag": {
      "command": "node",
      "args": ["~/.local/bin/obsidian-rag/server.js"]
    }
  }
}
```

### Indexación automática con launchctl (macOS)

El archivo `local.obsidian-rag.index.plist` ejecuta el indexador **cada 4 horas**.

1. Copia el plist a LaunchAgents:

```bash
cp local.obsidian-rag.index.plist ~/Library/LaunchAgents/
```

2. Carga el servicio:

```bash
launchctl load ~/Library/LaunchAgents/local.obsidian-rag.index.plist
```

3. Comandos útiles:

```bash
# Ejecutar manualmente
launchctl start local.obsidian-rag.index

# Ver logs
cat ~/.local/share/obsidian-rag/index.log

# Desinstalar
launchctl unload ~/Library/LaunchAgents/local.obsidian-rag.index.plist
```

## Tools MCP disponibles

### `obsidian_search`

Búsqueda semántica en el vault.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `query` | string | Consulta en lenguaje natural |
| `limit` | number | Número de resultados (default: 5) |
| `file_filter` | string | Filtrar por nombre de archivo (opcional) |

### `obsidian_list_files`

Listar archivos indexados.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `pattern` | string | Filtro por nombre (opcional) |
| `limit` | number | Máximo de resultados (default: 50) |

### `obsidian_get_file`

Obtener contenido completo de un archivo.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `file_path` | string | Ruta relativa al vault |

## Estructura

```
~/.local/
├── mcp/obsidian-rag/     # Código fuente
├── bin/obsidian-rag/          # Symlinks a ejecutables
│   ├── server.js
│   └── indexer.js
└── share/obsidian-rag/        # Datos
    ├── obsidian_chunks.lance/ # Base de datos vectorial
    └── index.log              # Logs de indexación
```
