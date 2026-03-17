import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/services/markdown.js', () => ({
  readMarkdownFile: vi.fn().mockResolvedValue('# Test content'),
}));

describe('obsidianGetFile - path traversal', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('allows normal relative paths', async () => {
    vi.stubEnv('OBSIDIAN_VAULT_PATH', '/tmp/test-vault');
    const { obsidianGetFile } = await import('../src/tools/search.js');
    // Mock is active, so this should resolve without path traversal error
    const result = await obsidianGetFile('notes/test.md');
    expect(result).toBe('# Test content');
  });

  test('rejects paths with ../', async () => {
    vi.stubEnv('OBSIDIAN_VAULT_PATH', '/tmp/test-vault');
    const { obsidianGetFile } = await import('../src/tools/search.js');
    await expect(obsidianGetFile('../etc/passwd')).rejects.toThrow('Path traversal');
  });

  test('rejects deeply nested path traversal', async () => {
    vi.stubEnv('OBSIDIAN_VAULT_PATH', '/tmp/test-vault');
    const { obsidianGetFile } = await import('../src/tools/search.js');
    await expect(obsidianGetFile('notes/../../etc/passwd')).rejects.toThrow('Path traversal');
  });
});
