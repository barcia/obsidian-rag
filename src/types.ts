export interface DocumentChunk {
  id: string;
  file_path: string;
  file_name: string;
  chunk_index: number;
  content: string;
  vector: number[];
  metadata: string;
  updated_at: number;
}

export interface ChunkMetadata {
  headers: string[];
  tags: string[];
  frontmatter: Record<string, unknown>;
}

export interface ParsedChunk {
  content: string;
  metadata: ChunkMetadata;
}

export interface SearchResult {
  file_path: string;
  file_name: string;
  content: string;
  metadata: ChunkMetadata;
  score: number;
  chunk_index: number;
}

export interface IndexedFile {
  file_path: string;
  file_name: string;
  chunk_count: number;
  updated_at: number;
}

export interface IndexStats {
  added: number;
  updated: number;
  deleted: number;
  unchanged: number;
  total_chunks: number;
}
