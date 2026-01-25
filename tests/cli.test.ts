import { describe, test, expect } from 'bun:test';
import { spawn } from 'bun';
import pkg from '../package.json';

const bunPath = process.execPath;

describe('CLI', () => {
  test('shows help without arguments', async () => {
    const proc = spawn([bunPath, 'run', 'src/cli.ts'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const stdout = await new Response(proc.stdout).text();
    await proc.exited;

    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('obsidian-rag mcp-server');
    expect(stdout).toContain('obsidian-rag index');
    expect(stdout).toContain('obsidian-rag reindex');
    expect(proc.exitCode).toBe(0);
  });

  test('shows version in help', async () => {
    const proc = spawn([bunPath, 'run', 'src/cli.ts'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const stdout = await new Response(proc.stdout).text();
    await proc.exited;

    expect(stdout).toContain(`v${pkg.version}`);
  });

  test('exits with error on unknown command', async () => {
    const proc = spawn([bunPath, 'run', 'src/cli.ts', 'unknown'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    await proc.exited;
    expect(proc.exitCode).toBe(1);
  });

  test('shows config path', async () => {
    const proc = spawn([bunPath, 'run', 'src/cli.ts'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const stdout = await new Response(proc.stdout).text();
    await proc.exited;

    expect(stdout).toContain('.config/obsidian-rag/config.json');
  });
});
