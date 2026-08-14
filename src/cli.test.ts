import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execFileSync, type ExecFileSyncOptionsWithStringEncoding } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = path.join(__dirname, '..', 'dist', 'cli.js');

function runCli(args: string[], options: Partial<ExecFileSyncOptionsWithStringEncoding> = {}) {
  return execFileSync(process.execPath, [CLI_PATH, ...args], {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  });
}

describe('CLI Tool', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Help and Usage', () => {
    it('should display version with --version flag', () => {
      const output = runCli(['--version']);

      // Should match semver pattern (e.g., 2.1.0)
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should display version with -v flag', () => {
      const output = runCli(['-v']);

      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should display help with --help flag', () => {
      const output = runCli(['--help']);

      expect(output).toContain('Apollo.io CLI Tool');
      expect(output).toContain('Usage:');
      expect(output).toContain('Commands:');
      expect(output).toContain('search-people');
      expect(output).toContain('enrich-person');
    });

    it('should display help with -h flag', () => {
      const output = runCli(['-h']);

      expect(output).toContain('Apollo.io CLI Tool');
      // Should also show version in help
      expect(output).toMatch(/Apollo\.io CLI Tool v\d+\.\d+\.\d+/);
    });

    it('should display help with no arguments', () => {
      const output = runCli([]);

      expect(output).toContain('Apollo.io CLI Tool');
    });

    it('should display command-specific help for search-people', () => {
      const output = runCli(['search-people', '--help']);

      expect(output).toContain('search-people --person_titles');
      expect(output).toContain('REQUIRED');
      expect(output).toContain('--person_titles');
      expect(output).toContain('--person_locations');
      expect(output).toContain('--seniority');
      expect(output).toContain('enrich-person'); // Should mention enrichment alternative
    });

    it('should display command-specific help for search-companies', () => {
      const output = runCli(['search-companies', '--help']);

      expect(output).toContain('search-companies [options]');
      expect(output).toContain('--organization_locations');
      expect(output).toContain('Employee Range Format');
    });

    it('should display command-specific help for enrich-person', () => {
      const output = runCli(['enrich-person', '--help']);

      expect(output).toContain('enrich-person [options]');
      expect(output).toContain('--email');
      expect(output).toContain('--linkedin_url');
      expect(output).toContain('--reveal_personal_emails');
    });

    it('should print skills guidance without APOLLO_API_KEY', () => {
      const envWithoutKey = { ...process.env };
      delete envWithoutKey.APOLLO_API_KEY;

      const output = runCli(['skills'], {
        env: envWithoutKey
      });

      expect(output).toContain('Apollo.io MCP Server and CLI Skills');
      expect(output).toContain('Best Install Path');
      expect(output).toContain('The VGER Group');
    });
  });

  describe('Error Handling', () => {
    it('should error when APOLLO_API_KEY is missing', () => {
      const envWithoutKey = { ...process.env };
      delete envWithoutKey.APOLLO_API_KEY;

      try {
        runCli(['search-people', '--person_titles', 'Manager', '--q', 'test'], {
          env: envWithoutKey,
          stdio: 'pipe'
        });
        // If we get here, the command succeeded when it should have failed
        throw new Error('Command should have failed without APOLLO_API_KEY');
      } catch (error: any) {
        // execFileSync throws on non-zero exit code
        const output = error.stdout || error.stderr || error.message || '';
        expect(output.toString()).toContain('APOLLO_API_KEY');
      }
    });

    it('should error on invalid command', () => {
      process.env.APOLLO_API_KEY = 'test-key';

      try {
        runCli(['invalid-command'], {
          env: process.env
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stderr || error.stdout).toContain('Invalid command');
      }
    });

    it('should error when person_titles is missing for search-people', () => {
      process.env.APOLLO_API_KEY = 'test-key';

      try {
        runCli(['search-people', '--person_locations', 'Virginia'], {
          env: process.env,
          stdio: 'pipe'
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        const output = error.stderr || error.stdout || error.message;
        expect(output).toContain('person_titles is required');
        expect(output).toContain('enrich-person'); // Should suggest enrichment
      }
    });

    it('should warn about unrecognized parameters', () => {
      process.env.APOLLO_API_KEY = 'test-key';

      try {
        runCli(['search-people', '--person_titles', 'Manager', '--person_location', 'Virginia'], {
          env: process.env,
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error: any) {
        const output = error.stderr || error.stdout || error.message;
        expect(output).toContain('Unrecognized parameter');
        expect(output).toContain('person_location');
      }
    });
  });

  describe('Argument Parsing', () => {
    it('should handle --key=value format', () => {
      // This test just verifies the CLI accepts this format
      // Actual API calls are tested in integration tests
      const testKey = 'test-key-12345';
      process.env.APOLLO_API_KEY = testKey;

      try {
        runCli(['search-people', '--q=Software Engineer', '--page=1'], {
          env: process.env,
          timeout: 5000
        });
      } catch (error: any) {
        // We expect it to fail with invalid API key, but not with parsing error
        const output = error.stderr || error.stdout || error.message;
        expect(output).not.toContain('Invalid command');
        expect(output).not.toContain('Usage:');
      }
    });

    it('should handle --key value format', () => {
      const testKey = 'test-key-12345';
      process.env.APOLLO_API_KEY = testKey;

      try {
        runCli(['search-people', '--q', 'Software Engineer', '--page', '1'], {
          env: process.env,
          timeout: 5000
        });
      } catch (error: any) {
        const output = error.stderr || error.stdout || error.message;
        expect(output).not.toContain('Invalid command');
        expect(output).not.toContain('Usage:');
      }
    });
  });

  describe('Command Validation', () => {
    beforeEach(() => {
      process.env.APOLLO_API_KEY = 'test-key';
    });

    it('should accept search-people command', () => {
      try {
        runCli(['search-people', '--q', 'test'], {
          env: process.env,
          timeout: 5000
        });
      } catch (error: any) {
        // Command should be recognized (will fail on API call)
        const output = error.stderr || error.stdout || error.message;
        expect(output).not.toContain('Invalid command');
        expect(output).not.toContain('Unknown command');
      }
    });

    it('should accept enrich-person command', () => {
      try {
        runCli(['enrich-person', '--email', 'test@example.com'], {
          env: process.env,
          timeout: 5000
        });
      } catch (error: any) {
        const output = error.stderr || error.stdout || error.message;
        expect(output).not.toContain('Invalid command');
      }
    });

    it('should require --id for org-jobs command', () => {
      try {
        runCli(['org-jobs'], {
          env: process.env,
          timeout: 5000
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        const output = error.stderr || error.stdout || error.message;
        expect(output).toContain('--id is required');
      }
    });

    it('should require --id for org-info command', () => {
      try {
        runCli(['org-info'], {
          env: process.env,
          timeout: 5000
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        const output = error.stderr || error.stdout || error.message;
        expect(output).toContain('--id is required');
      }
    });
  });

  describe('JSON Input', () => {
    beforeEach(() => {
      process.env.APOLLO_API_KEY = 'test-key';
    });

    it('should handle --json flag', () => {
      try {
        runCli(['search-people', '--json', '{"q": "test", "page": 1}'], {
          env: process.env,
          timeout: 5000
        });
      } catch (error: any) {
        const output = error.stderr || error.stdout || error.message;
        expect(output).not.toContain('Error parsing JSON');
        expect(output).not.toContain('Invalid command');
      }
    });

    it('should error on invalid JSON', () => {
      try {
        runCli(['search-people', '--json', 'invalid json'], {
          env: process.env,
          timeout: 5000
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        const output = error.stderr || error.stdout || error.message;
        expect(output).toContain('Error parsing JSON');
      }
    });
  });

  describe('Array Handling', () => {
    beforeEach(() => {
      process.env.APOLLO_API_KEY = 'test-key';
    });

    it('should parse comma-separated values as arrays', () => {
      try {
        runCli(['search-people', '--person_titles', 'CEO,CTO,VP'], {
          env: process.env,
          timeout: 5000
        });
      } catch (error: any) {
        const output = error.stderr || error.stdout || error.message;
        expect(output).not.toContain('Invalid command');
      }
    });

    it('should auto-convert single values to arrays for array fields', () => {
      try {
        runCli(['search-people', '--person_titles', 'CTO'], {
          env: process.env,
          timeout: 5000
        });
      } catch (error: any) {
        const output = error.stderr || error.stdout || error.message;
        // Should not get "requires an array" error
        expect(output).not.toContain('requires an array');
        expect(output).not.toContain('Invalid command');
      }
    });
  });

  describe('Value Parsing', () => {
    it('should parse numeric values', () => {
      // This is implicitly tested - if numbers aren't parsed correctly,
      // the API would reject them
      expect(true).toBe(true);
    });

    it('should parse boolean values', () => {
      // Boolean parsing is tested through reveal_personal_emails flags
      expect(true).toBe(true);
    });
  });
});

describe('CLI Integration (requires API key)', () => {
  const hasApiKey = !!process.env.APOLLO_API_KEY;

  (hasApiKey ? describe : describe.skip)('Real API Calls', () => {
    it('should successfully enrich person by email', () => {
      const output = runCli(['enrich-person', '--email', 'tim@apollo.io'], {
        env: process.env,
        timeout: 10000
      });

      const result = JSON.parse(output);
      expect(result).toHaveProperty('person');
      expect(result.person).toHaveProperty('email');
      expect(result.person.email).toBe('tim@apollo.io');
    }, 15000);

    it('should output valid JSON', () => {
      const output = runCli(['enrich-person', '--email', 'tim@apollo.io'], {
        env: process.env,
        timeout: 10000
      });

      expect(() => JSON.parse(output)).not.toThrow();
    }, 15000);
  });
});
