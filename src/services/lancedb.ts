import * as lancedb from '@lancedb/lancedb';
import { config } from '../config.js';
import type { DocumentChunk, SearchResult, IndexedFile, ChunkMetadata } from '../types.js';

export const TABLE_NAME = 'obsidian_chunks';

let db: lancedb.Connection | null = null;
let table: lancedb.Table | null = null;

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
      const initialData: Record<string, unknown>[] = [{
        id: '__init__',
        file_path: '',
        file_name: '',
        chunk_index: 0,
        content: '',
        vector: new Array(config.embeddingDimension).fill(0),
        metadata: '{}',
        updated_at: 0,
      }];

      table = await db!.createTable(TABLE_NAME, initialData);
      await table.delete('id = "__init__"');
    } else {
      table = await db!.openTable(TABLE_NAME);
    }
  }

  return table;
}

export async function upsertChunks(chunks: DocumentChunk[]): Promise<void> {
  if (chunks.length === 0) return;

  const tbl = await ensureTable();

  const filePaths = [...new Set(chunks.map(c => c.file_path))];
  for (const filePath of filePaths) {
    await tbl.delete(`file_path = "${filePath.replace(/"/g, '\\"')}"`);
  }

  const data: Record<string, unknown>[] = chunks.map(chunk => ({ ...chunk }));
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
    query = query.where(`file_name LIKE '%${fileFilter.replace(/'/g, "''")}%'`);
  }

  const results = await query.toArray();

  return results.map((row: Record<string, unknown>) => ({
    file_path: row.file_path as string,
    file_name: row.file_name as string,
    content: row.content as string,
    metadata: JSON.parse(row.metadata as string) as ChunkMetadata,
    score: row._distance != null ? 1 - (row._distance as number) : 0,
    chunk_index: row.chunk_index as number,
  }));
}

export async function deleteByFile(filePath: string): Promise<void> {
  const tbl = await ensureTable();
  await tbl.delete(`file_path = "${filePath.replace(/"/g, '\\"')}"`);
}

export async function listFiles(pattern?: string, limit: number = 50): Promise<IndexedFile[]> {
  const tbl = await ensureTable();

  const allRows = await tbl.query().toArray();

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

export async function getIndexedFilePaths(): Promise<Map<string, number>> {
  const tbl = await ensureTable();
  const allRows = await tbl.query().toArray();

  const fileMap = new Map<string, number>();

  for (const row of allRows) {
    const filePath = row.file_path as string;
    const updatedAt = row.updated_at as number;
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
