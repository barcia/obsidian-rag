import { readFile, readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import matter from 'gray-matter';
import { config } from '../config.js';

export interface BacklinkResult {
  source_file: string;
  source_name: string;
  context: string;
}

export interface TagCount {
  tag: string;
  count: number;
}

async function getAllMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.name.startsWith('.')) continue;

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

function extractWikilinks(content: string): string[] {
  const wikiLinkRegex = /\[\[([^\]|#]+)(?:[|#][^\]]+)?\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = wikiLinkRegex.exec(content)) !== null) {
    links.push(match[1].trim());
  }

  return links;
}

function extractContextAroundLink(
  content: string,
  linkTarget: string,
  contextChars: number = 100
): string {
  const escapedTarget = linkTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\[\\[${escapedTarget}(?:[|#][^\\]]+)?\\]\\]`, 'i');
  const match = content.match(regex);

  if (!match || match.index === undefined) {
    return '';
  }

  const start = Math.max(0, match.index - contextChars);
  const end = Math.min(content.length, match.index + match[0].length + contextChars);

  let context = content.slice(start, end);

  if (start > 0) context = '...' + context;
  if (end < content.length) context = context + '...';

  return context.replace(/\n+/g, ' ').trim();
}

export async function getBacklinks(targetFilePath: string): Promise<BacklinkResult[]> {
  const targetName = targetFilePath.replace(/\.md$/, '').split('/').pop() || '';
  const allFiles = await getAllMarkdownFiles(config.obsidianVaultPath);
  const backlinks: BacklinkResult[] = [];

  for (const filePath of allFiles) {
    const relativePath = relative(config.obsidianVaultPath, filePath);

    if (relativePath === targetFilePath) continue;

    const content = await readFile(filePath, 'utf-8');
    const links = extractWikilinks(content);

    const hasLink = links.some(
      (link) => link.toLowerCase() === targetName.toLowerCase()
    );

    if (hasLink) {
      const context = extractContextAroundLink(content, targetName);
      backlinks.push({
        source_file: relativePath,
        source_name: relativePath.replace(/\.md$/, '').split('/').pop() || '',
        context,
      });
    }
  }

  return backlinks;
}

function extractTags(content: string): string[] {
  const tagRegex = /#([a-zA-Z0-9_/-]+)/g;
  const tags: string[] = [];
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    if (!match[1].match(/^[0-9]+$/)) {
      tags.push(match[1]);
    }
  }

  return tags;
}

export async function getAllTags(): Promise<TagCount[]> {
  const allFiles = await getAllMarkdownFiles(config.obsidianVaultPath);
  const tagCounts = new Map<string, number>();

  for (const filePath of allFiles) {
    const content = await readFile(filePath, 'utf-8');

    const { data: frontmatter, content: body } = matter(content);

    const bodyTags = extractTags(body);
    for (const tag of bodyTags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }

    if (frontmatter.tags) {
      const fmTags = Array.isArray(frontmatter.tags)
        ? frontmatter.tags
        : [frontmatter.tags];

      for (const tag of fmTags) {
        if (typeof tag === 'string') {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }
    }
  }

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getMetadata(
  filePath: string
): Promise<Record<string, unknown>> {
  const fullPath = join(config.obsidianVaultPath, filePath);
  const content = await readFile(fullPath, 'utf-8');
  const { data: frontmatter } = matter(content);

  const stats = await stat(fullPath);

  return {
    ...frontmatter,
    _file: {
      path: filePath,
      name: filePath.split('/').pop()?.replace(/\.md$/, ''),
      modified: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString(),
    },
  };
}
