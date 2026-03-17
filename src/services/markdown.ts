import { readFile } from 'fs/promises';
import matter from 'gray-matter';
import type { ParsedChunk, ChunkMetadata } from '../types.js';
import { config } from '../config.js';

export async function parseMarkdownFile(filePath: string): Promise<ParsedChunk[]> {
  const content = await readFile(filePath, 'utf-8');
  return parseMarkdown(content);
}

export function parseMarkdown(content: string): ParsedChunk[] {
  const { data: frontmatter, content: body } = matter(content);

  const tags = extractTags(body);
  const sections = splitByHeaders(body);
  const chunks: ParsedChunk[] = [];

  for (const section of sections) {
    const sectionChunks = chunkText(section.content, config.chunkSize, config.chunkOverlap);

    for (const chunkContent of sectionChunks) {
      if (chunkContent.trim().length < 10) continue;

      chunks.push({
        content: chunkContent,
        metadata: {
          headers: section.headers,
          tags,
          frontmatter,
        },
      });
    }
  }

  return chunks;
}

interface Section {
  headers: string[];
  content: string;
}

function splitByHeaders(content: string): Section[] {
  const lines = content.split('\n');
  const sections: Section[] = [];
  let currentHeaders: string[] = [];
  let currentContent: string[] = [];

  const headerRegex = /^(#{1,6})\s+(.+)$/;

  for (const line of lines) {
    const match = line.match(headerRegex);

    if (match) {
      if (currentContent.length > 0) {
        sections.push({
          headers: [...currentHeaders],
          content: currentContent.join('\n'),
        });
        currentContent = [];
      }

      const level = match[1].length;
      const headerText = match[2].trim();

      currentHeaders = currentHeaders.slice(0, level - 1);
      currentHeaders[level - 1] = headerText;
      currentHeaders = currentHeaders.slice(0, level);
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections.push({
      headers: [...currentHeaders],
      content: currentContent.join('\n'),
    });
  }

  if (sections.length === 0) {
    sections.push({
      headers: [],
      content: content,
    });
  }

  return sections;
}

function chunkText(text: string, maxSize: number, overlap: number): string[] {
  if (overlap >= maxSize) {
    overlap = Math.floor(maxSize / 2);
  }
  const words = text.split(/\s+/);

  if (words.length <= maxSize) {
    return [text.trim()];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + maxSize, words.length);
    const chunk = words.slice(start, end).join(' ');
    chunks.push(chunk.trim());

    if (end >= words.length) break;
    start = end - overlap;
  }

  return chunks;
}

function extractTags(content: string): string[] {
  const tagRegex = /#([a-zA-Z0-9_/-]+)/g;
  const tags = new Set<string>();
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    if (!match[1].match(/^[0-9]+$/)) {
      tags.add(match[1]);
    }
  }

  return Array.from(tags);
}

export async function readMarkdownFile(filePath: string): Promise<string> {
  return readFile(filePath, 'utf-8');
}
