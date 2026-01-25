import { describe, test, expect } from 'vitest';
import { parseMarkdown } from '../src/services/markdown.js';

describe('parseMarkdown', () => {
  test('extracts headers correctly', () => {
    const content = '# Title\nSome content here';
    const chunks = parseMarkdown(content);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].metadata.headers).toContain('Title');
  });

  test('handles multiple header levels', () => {
    const content = '# H1\n## H2\nContent under H2\n### H3\nContent under H3';
    const chunks = parseMarkdown(content);
    expect(chunks.length).toBeGreaterThan(0);
  });

  test('extracts tags from content', () => {
    const content = 'Some content with #tag1 and #tag2';
    const chunks = parseMarkdown(content);
    expect(chunks[0].metadata.tags).toContain('tag1');
    expect(chunks[0].metadata.tags).toContain('tag2');
  });

  test('ignores numeric-only tags', () => {
    const content = 'Reference #123 should not be a tag';
    const chunks = parseMarkdown(content);
    expect(chunks[0].metadata.tags).not.toContain('123');
  });

  test('handles frontmatter', () => {
    const content = `---
title: Test Note
tags: [test]
---
# Content
Some body text`;
    const chunks = parseMarkdown(content);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].metadata.frontmatter).toBeDefined();
  });

  test('skips very short chunks', () => {
    const content = '# Title\nHi';
    const chunks = parseMarkdown(content);
    // "Hi" is less than 10 chars, should be skipped
    expect(chunks.every(c => c.content.trim().length >= 10)).toBe(true);
  });

  test('handles empty content', () => {
    const content = '';
    const chunks = parseMarkdown(content);
    expect(chunks.length).toBe(0);
  });
});
