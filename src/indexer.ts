import { glob } from 'glob';
import { stat } from 'fs/promises';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import { config, validateConfig } from './config.js';
import { parseMarkdownFile } from './services/markdown.js';
import { generateEmbeddings } from './services/embeddings.js';
import { initDB, upsertChunks, deleteByFile, getIndexedFilePaths } from './services/lancedb.js';
import { log, logError } from './services/logger.js';
import type { DocumentChunk, IndexStats } from './types.js';

async function indexVault(): Promise<IndexStats> {
  log(`Indexing vault: ${config.obsidianVaultPath}`);
  log(`LanceDB path: ${config.lancedbPath}`);

  await initDB();

  const mdFilesRaw = await glob('**/*.md', {
    cwd: config.obsidianVaultPath,
    ignore: ['**/node_modules/**', '**/.obsidian/**', '**/.trash/**'],
    follow: true,
  });
  
  // Normalize paths to NFC to handle macOS NFD filesystem paths consistently
  const mdFiles = mdFilesRaw.map(f => f.normalize('NFC'));

  log(`Found ${mdFiles.length} markdown files`);

  const indexedFiles = await getIndexedFilePaths();
  log(`Already indexed: ${indexedFiles.size} files`);

  const stats: IndexStats = {
    added: 0,
    updated: 0,
    deleted: 0,
    unchanged: 0,
    total_chunks: 0,
  };

  const currentFiles = new Set<string>();

  for (const file of mdFiles) {
    currentFiles.add(file);
    const fullPath = join(config.obsidianVaultPath, file);

    try {
      const fileStat = await stat(fullPath);
      const fileModTime = fileStat.mtimeMs;
      const indexedModTime = indexedFiles.get(file);

      if (indexedModTime && indexedModTime >= fileModTime) {
        stats.unchanged++;
        continue;
      }

      log(`Processing: ${file}`);

      const chunks = await parseMarkdownFile(fullPath);

      if (chunks.length === 0) {
        log(`  Skipped (no chunks): ${file}`);
        continue;
      }

      const contents = chunks.map(c => c.content);
      const embeddings = await generateEmbeddings(contents);

      if (embeddings.length !== chunks.length) {
        throw new Error(`Embeddings count (${embeddings.length}) does not match chunks count (${chunks.length}) for ${file}`);
      }

      const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        id: createHash('sha256').update(`${file}:${index}:${chunk.content}`).digest('hex'),
        file_path: file,
        file_name: basename(file, '.md'),
        chunk_index: index,
        content: chunk.content,
        vector: embeddings[index],
        metadata: JSON.stringify(chunk.metadata),
        updated_at: fileModTime,
      }));

      await upsertChunks(documentChunks);
      stats.total_chunks += documentChunks.length;

      if (indexedModTime) {
        stats.updated++;
        log(`  Updated: ${file} (${documentChunks.length} chunks)`);
      } else {
        stats.added++;
        log(`  Added: ${file} (${documentChunks.length} chunks)`);
      }
    } catch (error) {
      logError(`Error processing ${file}`, error);
    }
  }

  for (const [indexedFile] of indexedFiles) {
    if (!currentFiles.has(indexedFile)) {
      log(`Deleting: ${indexedFile}`);
      await deleteByFile(indexedFile);
      stats.deleted++;
    }
  }

  return stats;
}

async function main() {
  try {
    validateConfig();
    const stats = await indexVault();
    log(`Done: added=${stats.added} updated=${stats.updated} deleted=${stats.deleted} unchanged=${stats.unchanged} chunks=${stats.total_chunks}`);
  } catch (error) {
    logError('Indexing failed', error);
    process.exit(1);
  }
}

export { main as runIndexer };

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
