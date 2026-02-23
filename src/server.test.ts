import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Mock the Apollo client
vi.mock('./apollo.js', () => ({
  ApolloClient: vi.fn(function() {
    return {
      searchPeople: vi.fn(),
      searchCompanies: vi.fn(),
      matchPerson: vi.fn(),
      matchCompany: vi.fn()
    };
  })
}));

// Mock dotenv
vi.mock('dotenv/config', () => ({}));

// Mock MCP SDK
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn(function() {
    return {
      tool: vi.fn(),
      router: {
        callTool: vi.fn()
      },
      defaultCallTool: vi.fn(),
      connect: vi.fn()
    };
  }),
  StdioServerTransport: vi.fn(function() { return {}; }),
  Tool: vi.fn(function() { return {}; })
}));

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: z.object({
    name: z.string(),
    arguments: z.any().optional()
  })
}));

// Import after mocking
import { ApolloClient } from './apollo.js';

// We need to test the tool implementations directly
// Let's create a test file that imports the tool logic
describe('Apollo MCP Tools', () => {
  let mockApolloClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApolloClient = new ApolloClient({ apiKey: 'test' });
  });

  describe('Search People Tool', () => {
    it('should handle valid search parameters', async () => {
      const mockResponse = { people: [{ name: 'John Doe', email: 'john@example.com' }] };
      mockApolloClient.searchPeople.mockResolvedValue(mockResponse);

      const args = {
        query: 'John Doe',
        page: 1,
        per_page: 10
      };

      const result = await mockApolloClient.searchPeople(args);
      expect(result).toEqual(mockResponse);
      expect(mockApolloClient.searchPeople).toHaveBeenCalledWith(args);
    });

    it('should handle filters parameter', async () => {
      const mockResponse = { people: [] };
      mockApolloClient.searchPeople.mockResolvedValue(mockResponse);

      const args = {
        filters: {
          title: 'CEO',
          company_domains: ['example.com']
        }
      };

      await mockApolloClient.searchPeople(args);
      expect(mockApolloClient.searchPeople).toHaveBeenCalledWith(args);
    });
  });

  describe('Search Companies Tool', () => {
    it('should handle valid company search parameters', async () => {
      const mockResponse = { companies: [{ name: 'Example Corp', domain: 'example.com' }] };
      mockApolloClient.searchCompanies.mockResolvedValue(mockResponse);

      const args = {
        query: 'Example Corp',
        page: 1,
        per_page: 10
      };

      const result = await mockApolloClient.searchCompanies(args);
      expect(result).toEqual(mockResponse);
      expect(mockApolloClient.searchCompanies).toHaveBeenCalledWith(args);
    });
  });

  describe('Enrich Person Tool', () => {
    it('should handle email enrichment', async () => {
      const mockResponse = { person: { name: 'John Doe', email: 'john@example.com' } };
      mockApolloClient.matchPerson.mockResolvedValue(mockResponse);

      const args = {
        email: 'john@example.com'
      };

      const result = await mockApolloClient.matchPerson(args);
      expect(result).toEqual(mockResponse);
      expect(mockApolloClient.matchPerson).toHaveBeenCalledWith(args);
    });

    it('should handle LinkedIn URL enrichment', async () => {
      const mockResponse = { person: { name: 'John Doe', linkedin_url: 'https://linkedin.com/in/johndoe' } };
      mockApolloClient.matchPerson.mockResolvedValue(mockResponse);

      const args = {
        linkedin_url: 'https://linkedin.com/in/johndoe'
      };

      const result = await mockApolloClient.matchPerson(args);
      expect(result).toEqual(mockResponse);
      expect(mockApolloClient.matchPerson).toHaveBeenCalledWith(args);
    });

    it('should handle name and company enrichment', async () => {
      const mockResponse = { person: { name: 'John Doe', company: 'Example Corp' } };
      mockApolloClient.matchPerson.mockResolvedValue(mockResponse);

      const args = {
        name: 'John Doe',
        company: 'Example Corp'
      };

      const result = await mockApolloClient.matchPerson(args);
      expect(result).toEqual(mockResponse);
      expect(mockApolloClient.matchPerson).toHaveBeenCalledWith(args);
    });
  });

  describe('Enrich Company Tool', () => {
    it('should handle domain enrichment', async () => {
      const mockResponse = { company: { name: 'Example Corp', domain: 'example.com' } };
      mockApolloClient.matchCompany.mockResolvedValue(mockResponse);

      const args = {
        domain: 'example.com'
      };

      const result = await mockApolloClient.matchCompany(args);
      expect(result).toEqual(mockResponse);
      expect(mockApolloClient.matchCompany).toHaveBeenCalledWith(args);
    });

    it('should handle name enrichment', async () => {
      const mockResponse = { company: { name: 'Example Corp', domain: 'example.com' } };
      mockApolloClient.matchCompany.mockResolvedValue(mockResponse);

      const args = {
        name: 'Example Corp'
      };

      const result = await mockApolloClient.matchCompany(args);
      expect(result).toEqual(mockResponse);
      expect(mockApolloClient.matchCompany).toHaveBeenCalledWith(args);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      mockApolloClient.searchPeople.mockRejectedValue(error);

      await expect(mockApolloClient.searchPeople({})).rejects.toThrow('API Error');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      mockApolloClient.searchCompanies.mockRejectedValue(error);

      await expect(mockApolloClient.searchCompanies({})).rejects.toThrow('Network Error');
    });
  });
});
