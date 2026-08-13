import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isInstallerCommand, runInstallCommand } from './install.js';

const tempDirs: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function tempConfigPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-mcp-test-'));
  tempDirs.push(dir);
  return path.join(dir, 'claude_desktop_config.json');
}

describe('installer commands', () => {
  it('recognizes setup, remove, and doctor commands', () => {
    expect(isInstallerCommand('setup')).toBe(true);
    expect(isInstallerCommand('remove')).toBe(true);
    expect(isInstallerCommand('doctor')).toBe(true);
    expect(isInstallerCommand('search-people')).toBe(false);
  });

  it('installs the Apollo MCP server in a Claude Desktop config file', async () => {
    const configPath = tempConfigPath();
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await runInstallCommand([
      'setup',
      '--api-key',
      'test-apollo-key',
      '--base-url',
      'https://api.example.com/api/v1',
      '--config',
      configPath,
    ]);

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(config.mcpServers.apollo).toEqual({
      command: 'npx',
      args: ['-y', '@thevgergroup/apollo-io-mcp@latest'],
      env: {
        APOLLO_API_KEY: 'test-apollo-key',
        APOLLO_BASE_URL: 'https://api.example.com/api/v1',
      },
    });
  });

  it('preserves other MCP servers when installing and removing Apollo', async () => {
    const configPath = tempConfigPath();
    fs.writeFileSync(configPath, JSON.stringify({
      mcpServers: {
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem'],
        },
      },
    }, null, 2));
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await runInstallCommand(['setup', '--api-key=test-apollo-key', '--config', configPath]);
    await runInstallCommand(['remove', '--config', configPath]);

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(config.mcpServers).toEqual({
      filesystem: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
      },
    });
  });
});
