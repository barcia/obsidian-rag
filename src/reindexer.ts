import { validateConfig } from './config.js';
import { initDB, dropDatabase } from './services/lancedb.js';
import { log, logError } from './services/logger.js';
import { runIndexer } from './indexer.js';

async function main() {
  try {
    validateConfig();
    log('Dropping existing database...');
    await initDB();
    await dropDatabase();
    log('Database dropped. Starting fresh index...');
    await runIndexer();
  } catch (error) {
    logError('Reindexing failed', error);
    process.exit(1);
  }
}

main();
