import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json') as { name: string; version: string };

type InstallerCommand = 'setup' | 'remove' | 'doctor';

type ParsedArgs = {
  command: InstallerCommand;
  apiKey?: string;
  baseUrl?: string;
  name: string;
  config?: string;
  yes: boolean;
};

const INSTALLER_COMMANDS = new Set(['setup', 'remove', 'doctor']);
const DEFAULT_SERVER_NAME = 'apollo';
const DEFAULT_BASE_URL = 'https://api.apollo.io/api/v1';

export function isInstallerCommand(command?: string): command is InstallerCommand {
  return !!command && INSTALLER_COMMANDS.has(command);
}

export async function runInstallCommand(argv: string[]): Promise<void> {
  const parsed = parseInstallerArgs(argv);

  switch (parsed.command) {
    case 'setup':
      await setupClaudeDesktop(parsed);
      return;
    case 'remove':
      removeClaudeDesktopConfig(parsed);
      return;
    case 'doctor':
      await doctor(parsed);
      return;
  }
}

function parseInstallerArgs(argv: string[]): ParsedArgs {
  const [command] = argv;
  if (!isInstallerCommand(command)) {
    throw new Error(`Unknown installer command: ${command ?? '(none)'}`);
  }

  const parsed: ParsedArgs = {
    command,
    name: DEFAULT_SERVER_NAME,
    yes: false,
  };

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--yes' || arg === '-y') {
      parsed.yes = true;
      continue;
    }

    const inlineSeparatorIndex = arg.indexOf('=');
    const hasInlineValue = arg.startsWith('--') && inlineSeparatorIndex !== -1;
    const key = hasInlineValue
      ? arg.slice(2, inlineSeparatorIndex)
      : (arg.startsWith('--') ? arg.slice(2) : '');
    const value = hasInlineValue ? arg.slice(inlineSeparatorIndex + 1) : argv[i + 1];

    if (!key) continue;

    if (!hasInlineValue) i++;

    switch (key) {
      case 'api-key':
        parsed.apiKey = value;
        break;
      case 'base-url':
        parsed.baseUrl = value;
        break;
      case 'name':
        parsed.name = value;
        break;
      case 'config':
        parsed.config = value;
        break;
      default:
        throw new Error(`Unknown option: --${key}`);
    }
  }

  return parsed;
}

async function setupClaudeDesktop(args: ParsedArgs): Promise<void> {
  const configPath = resolveClaudeConfigPath(args.config);
  const apiKey = args.apiKey ?? process.env.APOLLO_API_KEY ?? await promptSecret('Apollo API key');
  if (!apiKey) {
    throw new Error('APOLLO_API_KEY is required. Pass --api-key or set APOLLO_API_KEY.');
  }

  const config = readClaudeConfig(configPath);
  config.mcpServers ??= {};
  config.mcpServers[args.name] = {
    command: 'npx',
    args: ['-y', `${packageJson.name}@latest`],
    env: {
      APOLLO_API_KEY: apiKey,
      ...(args.baseUrl ? { APOLLO_BASE_URL: args.baseUrl } : {}),
    },
  };

  writeClaudeConfig(configPath, config);

  console.log(`Installed ${args.name} MCP server for Claude Desktop.`);
  console.log(`Config: ${configPath}`);
  console.log('Restart Claude Desktop, then ask Claude to use Apollo.');
}

function removeClaudeDesktopConfig(args: ParsedArgs): void {
  const configPath = resolveClaudeConfigPath(args.config);
  const config = readClaudeConfig(configPath);

  if (!config.mcpServers?.[args.name]) {
    console.log(`No ${args.name} MCP server entry found in ${configPath}.`);
    return;
  }

  delete config.mcpServers[args.name];
  writeClaudeConfig(configPath, config);
  console.log(`Removed ${args.name} MCP server from Claude Desktop config.`);
  console.log('Restart Claude Desktop to finish removal.');
}

async function doctor(args: ParsedArgs): Promise<void> {
  const configPath = resolveClaudeConfigPath(args.config);
  const config = fs.existsSync(configPath) ? readClaudeConfig(configPath) : undefined;
  const server = config?.mcpServers?.[args.name];

  console.log(`Package: ${packageJson.name}@${packageJson.version}`);
  console.log(`Claude config: ${configPath}`);
  console.log(`Config exists: ${fs.existsSync(configPath) ? 'yes' : 'no'}`);
  console.log(`Server entry "${args.name}": ${server ? 'found' : 'missing'}`);
  console.log(`Node.js: ${process.version}`);
  console.log(`npm: ${getCommandVersion('npm', ['--version']) ?? 'not found'}`);

  const latest = await getLatestPublishedVersion();
  if (latest) {
    console.log(`Latest npm version: ${latest}`);
    console.log(`Update status: ${latest === packageJson.version ? 'current' : 'update available'}`);
  }

  if (server) {
    console.log(`Command: ${server.command}`);
    console.log(`Args: ${Array.isArray(server.args) ? server.args.join(' ') : '(none)'}`);
    console.log(`Has APOLLO_API_KEY: ${server.env?.APOLLO_API_KEY ? 'yes' : 'no'}`);
  }
}

function resolveClaudeConfigPath(configPath?: string): string {
  if (configPath) return path.resolve(configPath);

  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'Claude', 'claude_desktop_config.json');
  }

  return path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
}

function readClaudeConfig(configPath: string): any {
  if (!fs.existsSync(configPath)) return { mcpServers: {} };

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to parse ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function writeClaudeConfig(configPath: string, config: unknown): void {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

async function promptSecret(label: string): Promise<string> {
  if (!process.stdin.isTTY) return '';

  const rl = readline.createInterface({ input, output });
  try {
    return (await rl.question(`${label}: `)).trim();
  } finally {
    rl.close();
  }
}

function getCommandVersion(command: string, args: string[]): string | undefined {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return undefined;
  }
}

async function getLatestPublishedVersion(): Promise<string | undefined> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageJson.name)}/latest`);
    if (!response.ok) return undefined;
    const body = await response.json() as { version?: string };
    return body.version;
  } catch {
    return undefined;
  }
}
