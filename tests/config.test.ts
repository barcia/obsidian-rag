import { describe, test, expect, vi, beforeEach } from 'vitest';

describe('validateConfig', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  test('throws on missing API key', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    vi.stubEnv('OBSIDIAN_VAULT_PATH', '/tmp');
    const { validateConfig } = await import('../src/config.js');
    expect(() => validateConfig()).toThrow('Missing environment variable: OPENROUTER_API_KEY');
  });

  test('throws on missing vault path', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubEnv('OBSIDIAN_VAULT_PATH', '');
    const { validateConfig } = await import('../src/config.js');
    expect(() => validateConfig()).toThrow('Missing environment variable: OBSIDIAN_VAULT_PATH');
  });

  test('throws on non-existent vault path', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubEnv('OBSIDIAN_VAULT_PATH', '/tmp/non-existent-vault-path-12345');
    const { validateConfig } = await import('../src/config.js');
    expect(() => validateConfig()).toThrow('Vault path does not exist');
  });

  test('throws when chunkOverlap >= chunkSize', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubEnv('OBSIDIAN_VAULT_PATH', '/tmp');
    const { validateConfig, config } = await import('../src/config.js');
    const originalOverlap = config.chunkOverlap;
    config.chunkOverlap = config.chunkSize + 1;
    try {
      expect(() => validateConfig()).toThrow('chunkOverlap');
    } finally {
      config.chunkOverlap = originalOverlap;
    }
  });
});
