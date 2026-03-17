import * as lancedb from '@lancedb/lancedb';
import * as arrow from 'apache-arrow';
import { config } from '../config.js';
import type { DocumentChunk, SearchResult, IndexedFile, ChunkMetadata } from '../types.js';

export const TABLE_NAME = 'obsidian_chunks';

let db: lancedb.Connection | null = null;
let table: lancedb.Table | null = null;

function getTableSchema(): arrow.Schema {
  return new arrow.Schema([
    new arrow.Field('id', new arrow.Utf8(), false),
    new arrow.Field('file_path', new arrow.Utf8(), false),
    new arrow.Field('file_name', new arrow.Utf8(), false),
    new arrow.Field('chunk_index', new arrow.Int32(), false),
    new arrow.Field('content', new arrow.Utf8(), false),
    new arrow.Field(
      'vector',
      new arrow.FixedSizeList(
        config.embeddingDimension,
        new arrow.Field('item', new arrow.Float32(), true)
      ),
      false
    ),
    new arrow.Field('metadata', new arrow.Utf8(), false),
    new arrow.Field('updated_at', new arrow.Float64(), false),
  ]);
}

export async function initDB(): Promise<void> {
  db = await lancedb.connect(config.lancedbPath);

  const tableNames = await db.tableNames();
  if (tableNames.includes(TABLE_NAME)) {
    table = await db.openTable(TABLE_NAME);
  }
}

export async function ensureTable(): Promise<lancedb.Table> {
  if (!db) {
    await initDB();
  }

  if (!table) {
    const tableNames = await db!.tableNames();
    if (!tableNames.includes(TABLE_NAME)) {
      table = await db!.createEmptyTable(TABLE_NAME, getTableSchema());
    } else {
      table = await db!.openTable(TABLE_NAME);
    }
  }

  return table;
}

function escapeSqlString(value: string): string {
  // Escape single quotes by doubling them (SQL standard)
  return value.replace(/'/g, "''");
}

/**
 * Upserts chunks into the database. Deletes existing chunks for the same file_path before inserting.
 * WARNING: Not transactional — LanceDB does not support transactions. The indexer must be single-writer
 * to avoid race conditions between delete and add operations.
 */
export async function upsertChunks(chunks: DocumentChunk[]): Promise<void> {
  if (chunks.length === 0) return;

  const tbl = await ensureTable();

  const filePaths = [...new Set(chunks.map(c => c.file_path))];
  for (const filePath of filePaths) {
    await tbl.delete(`file_path = '${escapeSqlString(filePath)}'`);
  }

  // Build data with explicit column order matching the schema
  const data = chunks.map(chunk => ({
    id: chunk.id,
    file_path: chunk.file_path,
    file_name: chunk.file_name,
    chunk_index: chunk.chunk_index,
    content: chunk.content,
    vector: Array.from(chunk.vector),  // Ensure it's a plain array
    metadata: chunk.metadata,
    updated_at: chunk.updated_at,
  }));
  
  await tbl.add(data);
}

export async function search(
  queryVector: number[],
  limit: number = 5,
  fileFilter?: string
): Promise<SearchResult[]> {
  const tbl = await ensureTable();

  let query = tbl.search(queryVector).limit(limit);

  if (fileFilter) {
    query = query.where(`file_name LIKE '%${escapeSqlString(fileFilter)}%'`);
  }

  const results = await query.toArray();

  return results.map((row: Record<string, unknown>) => {
    let metadata: ChunkMetadata;
    try {
      metadata = JSON.parse(row.metadata as string) as ChunkMetadata;
    } catch {
      metadata = { headers: [], tags: [], frontmatter: {} };
    }
    return {
      file_path: row.file_path as string,
      file_name: row.file_name as string,
      content: row.content as string,
      metadata,
      score: row._distance != null ? 1 - (row._distance as number) : 0,
      chunk_index: row.chunk_index as number,
    };
  });
}

export async function deleteByFile(filePath: string): Promise<void> {
  const tbl = await ensureTable();
  await tbl.delete(`file_path = '${escapeSqlString(filePath)}'`);
}

export async function listFiles(pattern?: string, limit: number = 50): Promise<IndexedFile[]> {
  const tbl = await ensureTable();

  const allRows = await tbl.query().select(['file_path', 'file_name', 'updated_at']).toArray();

  const fileMap = new Map<string, IndexedFile>();

  for (const row of allRows) {
    const filePath = row.file_path as string;
    const fileName = row.file_name as string;
    const updatedAt = row.updated_at as number;

    if (pattern && !fileName.toLowerCase().includes(pattern.toLowerCase())) {
      continue;
    }

    const existing = fileMap.get(filePath);
    if (existing) {
      existing.chunk_count++;
      existing.updated_at = Math.max(existing.updated_at, updatedAt);
    } else {
      fileMap.set(filePath, {
        file_path: filePath,
        file_name: fileName,
        chunk_count: 1,
        updated_at: updatedAt,
      });
    }
  }

  return Array.from(fileMap.values())
    .sort((a, b) => b.updated_at - a.updated_at)
    .slice(0, limit);
}

function isValidFilePath(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.length === 0) return false;
  // File paths should only contain printable ASCII and common unicode
  // They should not contain binary data or control characters
  if (!/^[\p{L}\p{N}\p{P}\p{S}\p{Zs}./\-_]+$/u.test(value)) return false;
  // Should look like a file path (contain .md)
  if (!value.endsWith('.md') && !value.includes('/')) return false;
  return true;
}

export async function getIndexedFilePaths(): Promise<Map<string, number>> {
  const tbl = await ensureTable();
  const allRows = await tbl.query().select(['file_path', 'updated_at']).toArray();

  const fileMap = new Map<string, number>();

  for (const row of allRows) {
    const rawPath = row.file_path;
    const updatedAt = row.updated_at as number;
    
    // Skip corrupted rows where file_path is not a valid string
    if (!isValidFilePath(rawPath)) {
      continue;
    }
    
    // Normalize to NFC to handle macOS NFD filesystem paths consistently
    const filePath = rawPath.normalize('NFC');
    
    const existing = fileMap.get(filePath);
    if (!existing || existing < updatedAt) {
      fileMap.set(filePath, updatedAt);
    }
  }

  return fileMap;
}

export async function closeDB(): Promise<void> {
  table = null;
  db = null;
}

export async function dropDatabase(): Promise<void> {
  if (!db) {
    db = await lancedb.connect(config.lancedbPath);
  }
  const tableNames = await db.tableNames();
  if (tableNames.includes(TABLE_NAME)) {
    await db.dropTable(TABLE_NAME);
  }
  table = null;
}
