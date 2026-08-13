import { describe, expect, it, vi, afterEach } from 'vitest';
import { buildSkillsPayload, isSkillsCommand, runSkillsCommand } from './skills.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('skills command', () => {
  it('recognizes only the skills command', () => {
    expect(isSkillsCommand('skills')).toBe(true);
    expect(isSkillsCommand('doctor')).toBe(false);
    expect(isSkillsCommand(undefined)).toBe(false);
  });

  it('builds a user-focused skills payload', () => {
    const payload = buildSkillsPayload();

    expect(payload.publisher).toBe('The VGER Group');
    expect(payload.bestInstallPath).toContain('.mcpb');
    expect(payload.tools.map((tool) => tool.name)).toContain('apollo_search_people');
    expect(payload.guidance.join(' ')).toContain('person enrichment');
  });

  it('prints markdown by default', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runSkillsCommand(['skills']);

    expect(log).toHaveBeenCalledOnce();
    expect(String(log.mock.calls[0][0])).toContain('# Apollo.io MCP Server and CLI Skills');
    expect(String(log.mock.calls[0][0])).toContain('## Best Install Path');
  });

  it('prints json when requested', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runSkillsCommand(['skills', '--format=json']);

    const payload = JSON.parse(String(log.mock.calls[0][0]));
    expect(payload.packageName).toBe('@thevgergroup/apollo-io-mcp');
    expect(payload.updateChecks).toEqual(expect.arrayContaining([
      expect.stringContaining('doctor')
    ]));
  });
});
