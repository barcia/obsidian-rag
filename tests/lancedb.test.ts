import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import * as lancedb from '@lancedb/lancedb';
import { rmSync } from 'fs';

describe('LanceDB integration', () => {
  const testDbPath = '/tmp/obsidian-rag-test-db';
  let db: lancedb.Connection;

  beforeAll(async () => {
    db = await lancedb.connect(testDbPath);
  });

  afterAll(() => {
    try {
      rmSync(testDbPath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  test('can connect to database', () => {
    expect(db).toBeDefined();
  });

  test('can create table with vector data', async () => {
    const data = [
      { id: '1', text: 'hello world', vector: [0.1, 0.2, 0.3, 0.4, 0.5] },
      { id: '2', text: 'goodbye world', vector: [0.5, 0.4, 0.3, 0.2, 0.1] },
    ];
    const table = await db.createTable('test_create', data, { mode: 'overwrite' });
    expect(table).toBeDefined();
  });

  test('can search by vector similarity', async () => {
    const data = [
      { id: '1', text: 'apple', vector: [1.0, 0.0, 0.0] },
      { id: '2', text: 'banana', vector: [0.0, 1.0, 0.0] },
      { id: '3', text: 'cherry', vector: [0.0, 0.0, 1.0] },
    ];
    const table = await db.createTable('test_search', data, { mode: 'overwrite' });
    
    // Search for vector similar to apple
    const results = await table.search([0.9, 0.1, 0.0]).limit(1).toArray();
    expect(results.length).toBe(1);
    expect(results[0].text).toBe('apple');
  });

  test('can delete records', async () => {
    const data = [
      { id: '1', text: 'keep', vector: [0.1, 0.2, 0.3] },
      { id: '2', text: 'delete', vector: [0.4, 0.5, 0.6] },
    ];
    const table = await db.createTable('test_delete', data, { mode: 'overwrite' });
    
    await table.delete('id = "2"');
    const results = await table.query().toArray();
    expect(results.length).toBe(1);
    expect(results[0].text).toBe('keep');
  });

  test('can add records to existing table', async () => {
    const initialData = [
      { id: '1', text: 'first', vector: [0.1, 0.2, 0.3] },
    ];
    const table = await db.createTable('test_add', initialData, { mode: 'overwrite' });
    
    await table.add([
      { id: '2', text: 'second', vector: [0.4, 0.5, 0.6] },
    ]);
    
    const results = await table.query().toArray();
    expect(results.length).toBe(2);
  });
});
