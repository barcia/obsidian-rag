import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';
import { config } from '../config.js';

const execAsync = promisify(exec);

function encodeUriComponent(value: string): string {
  return encodeURIComponent(value);
}

function buildObsidianUri(
  action: 'open' | 'daily' | 'search' | 'new',
  params: Record<string, string>
): string {
  const queryParams = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeUriComponent(value)}`)
    .join('&');

  return `obsidian://${action}?${queryParams}`;
}

function getVaultParam(): Record<string, string> {
  if (!config.vaultName) {
    throw new Error(
      'Could not determine vault name. Ensure "obsidianVaultPath" is configured in config.json.'
    );
  }
  return { vault: config.vaultName };
}

export function getObsidianUri(filePath: string): string {
  const params = {
    ...getVaultParam(),
    file: filePath.replace(/\.md$/, ''),
  };
  return buildObsidianUri('open', params);
}

export function getDailyUri(): string {
  return buildObsidianUri('daily', getVaultParam());
}

async function openUri(uri: string): Promise<void> {
  const currentPlatform = platform();

  let command: string;
  switch (currentPlatform) {
    case 'darwin':
      command = `open "${uri}"`;
      break;
    case 'win32':
      command = `start "" "${uri}"`;
      break;
    default:
      command = `xdg-open "${uri}"`;
  }

  await execAsync(command);
}

export async function openNote(filePath: string): Promise<string> {
  const uri = getObsidianUri(filePath);
  await openUri(uri);
  return uri;
}

export async function openDaily(): Promise<string> {
  const uri = getDailyUri();
  await openUri(uri);
  return uri;
}
