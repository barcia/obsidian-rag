import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('vault-analysis', () => {
  let testVaultPath: string;

  beforeAll(async () => {
    // Create a temporary vault for testing
    testVaultPath = await mkdtemp(join(tmpdir(), 'obsidian-test-vault-'));

    // Create test files
    await writeFile(
      join(testVaultPath, 'note1.md'),
      `---
tags:
  - project
  - important
---
# Note 1

This is a test note with #inline-tag and [[Note 2]] link.
`
    );

    await writeFile(
      join(testVaultPath, 'note2.md'),
      `---
title: Note 2
---
# Note 2

This note links to [[Note 1]] and has #another-tag.
Also references [[Note 1]] again.
`
    );

    await mkdir(join(testVaultPath, 'subfolder'));
    await writeFile(
      join(testVaultPath, 'subfolder', 'note3.md'),
      `# Note 3

A note in a subfolder with #nested-tag.
Links to [[Note 1]] too.
`
    );
  });

  afterAll(async () => {
    // Clean up
    await rm(testVaultPath, { recursive: true, force: true });
  });

  describe('wikilink extraction', () => {
    it('extracts simple wikilinks', () => {
      const content = 'This links to [[Note A]] and [[Note B]].';
      const wikiLinkRegex = /\[\[([^\]|#]+)(?:[|#][^\]]+)?\]\]/g;
      const links: string[] = [];
      let match;
      while ((match = wikiLinkRegex.exec(content)) !== null) {
        links.push(match[1].trim());
      }
      expect(links).toEqual(['Note A', 'Note B']);
    });

    it('extracts wikilinks with aliases', () => {
      const content = 'See [[Note A|my alias]] for details.';
      const wikiLinkRegex = /\[\[([^\]|#]+)(?:[|#][^\]]+)?\]\]/g;
      const links: string[] = [];
      let match;
      while ((match = wikiLinkRegex.exec(content)) !== null) {
        links.push(match[1].trim());
      }
      expect(links).toEqual(['Note A']);
    });

    it('extracts wikilinks with heading references', () => {
      const content = 'See [[Note A#Section]] for details.';
      const wikiLinkRegex = /\[\[([^\]|#]+)(?:[|#][^\]]+)?\]\]/g;
      const links: string[] = [];
      let match;
      while ((match = wikiLinkRegex.exec(content)) !== null) {
        links.push(match[1].trim());
      }
      expect(links).toEqual(['Note A']);
    });
  });

  describe('tag extraction', () => {
    it('extracts inline tags', () => {
      const content = 'This has #tag1 and #tag2 and #nested/tag.';
      const tagRegex = /#([a-zA-Z0-9_/-]+)/g;
      const tags: string[] = [];
      let match;
      while ((match = tagRegex.exec(content)) !== null) {
        if (!match[1].match(/^[0-9]+$/)) {
          tags.push(match[1]);
        }
      }
      expect(tags).toEqual(['tag1', 'tag2', 'nested/tag']);
    });

    it('ignores numeric-only tags', () => {
      const content = 'Issue #123 and #456 are not tags, but #valid-tag is.';
      const tagRegex = /#([a-zA-Z0-9_/-]+)/g;
      const tags: string[] = [];
      let match;
      while ((match = tagRegex.exec(content)) !== null) {
        if (!match[1].match(/^[0-9]+$/)) {
          tags.push(match[1]);
        }
      }
      expect(tags).toEqual(['valid-tag']);
    });
  });
});
