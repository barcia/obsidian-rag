import { describe, it, expect } from 'vitest';

describe('obsidian-uri', () => {
  describe('getObsidianUri', () => {
    it('generates correct URI format', async () => {
      const { getObsidianUri } = await import('../src/tools/obsidian-uri.js');

      const uri = getObsidianUri('notes/test.md');

      // Should start with obsidian://open
      expect(uri).toMatch(/^obsidian:\/\/open\?/);
      // Should contain vault parameter
      expect(uri).toContain('vault=');
      // Should contain file parameter with encoded path (without .md extension)
      expect(uri).toContain('file=notes%2Ftest');
    });

    it('removes .md extension from file path', async () => {
      const { getObsidianUri } = await import('../src/tools/obsidian-uri.js');

      const uri = getObsidianUri('my-note.md');

      expect(uri).toContain('file=my-note');
      expect(uri).not.toContain('.md');
    });
  });

  describe('getDailyUri', () => {
    it('generates daily note URI', async () => {
      const { getDailyUri } = await import('../src/tools/obsidian-uri.js');

      const uri = getDailyUri();

      expect(uri).toMatch(/^obsidian:\/\/daily\?vault=/);
    });
  });

  describe('URI encoding', () => {
    it('encodes special characters correctly', () => {
      const encoded = encodeURIComponent('My Vault/Test Note');
      expect(encoded).toBe('My%20Vault%2FTest%20Note');
    });

    it('encodes spaces as %20', () => {
      const encoded = encodeURIComponent('note with spaces');
      expect(encoded).toBe('note%20with%20spaces');
    });
  });
});
