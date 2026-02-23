import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApolloClient } from './apollo.js';

// Mock undici
vi.mock('undici', () => ({
  request: vi.fn()
}));

const mockRequest = vi.mocked(await import('undici')).request;

describe('ApolloClient', () => {
  let client: ApolloClient;

  beforeEach(() => {
    client = new ApolloClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://api.apollo.io/api/v1'
    });
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with default base URL', () => {
      const client = new ApolloClient({ apiKey: 'test-key' });
      expect(client).toBeInstanceOf(ApolloClient);
    });

    it('should create client with custom base URL', () => {
      const client = new ApolloClient({ 
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com/api/v1'
      });
      expect(client).toBeInstanceOf(ApolloClient);
    });
  });

  describe('searchPeople', () => {
    it('should make POST request to /mixed_people/api_search', async () => {
      const mockResponse = {
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue({ people: [] })
        }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      const params = { q: 'test query', page: 1 };
      await client.searchPeople(params);

      expect(mockRequest).toHaveBeenCalledWith(
        'https://api.apollo.io/api/v1/mixed_people/api_search',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key'
          },
          body: JSON.stringify(params)
        }
      );
    });

    it('should throw error on 401 status', async () => {
      const mockResponse = {
        statusCode: 401,
        body: { text: vi.fn().mockResolvedValue('Unauthorized') }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      await expect(client.searchPeople({})).rejects.toThrow(
        'Unauthorized: invalid or missing APOLLO_API_KEY'
      );
    });

    it('should throw error on 429 status with retry-after', async () => {
      const mockResponse = {
        statusCode: 429,
        headers: { 'retry-after': '60' },
        body: { text: vi.fn().mockResolvedValue('Rate limited') }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      await expect(client.searchPeople({})).rejects.toThrow(
        'Rate limited by Apollo (429). Retry after 60s.'
      );
    });

    it('should throw error on 429 status without retry-after', async () => {
      const mockResponse = {
        statusCode: 429,
        headers: {},
        body: { text: vi.fn().mockResolvedValue('Rate limited') }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      await expect(client.searchPeople({})).rejects.toThrow(
        'Rate limited by Apollo (429).'
      );
    });

    it('should throw error on other 4xx/5xx status', async () => {
      const mockResponse = {
        statusCode: 500,
        body: { text: vi.fn().mockResolvedValue('Internal Server Error') }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      await expect(client.searchPeople({})).rejects.toThrow(
        'Apollo error 500: Internal Server Error'
      );
    });
  });

  describe('searchCompanies', () => {
    it('should make POST request to /mixed_companies/search', async () => {
      const mockResponse = {
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue({ companies: [] })
        }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      const params = { q: 'test company', page: 1 };
      await client.searchCompanies(params);

      expect(mockRequest).toHaveBeenCalledWith(
        'https://api.apollo.io/api/v1/mixed_companies/search',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key'
          },
          body: JSON.stringify(params)
        }
      );
    });
  });

  describe('matchPerson', () => {
    it('should make POST request to /people/match with default query params', async () => {
      const mockResponse = {
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue({ person: {} })
        }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      const params = { email: 'test@example.com' };
      await client.matchPerson(params);

      expect(mockRequest).toHaveBeenCalledWith(
        'https://api.apollo.io/api/v1/people/match?reveal_personal_emails=false&reveal_phone_number=false',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key'
          },
          body: JSON.stringify(params)
        }
      );
    });

    it('should support reveal parameters', async () => {
      const mockResponse = {
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue({ person: {} })
        }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      const params = { email: 'test@example.com' };
      await client.matchPerson(params, true, true);

      expect(mockRequest).toHaveBeenCalledWith(
        'https://api.apollo.io/api/v1/people/match?reveal_personal_emails=true&reveal_phone_number=true',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key'
          },
          body: JSON.stringify(params)
        }
      );
    });
  });

  describe('matchCompany', () => {
    it('should make POST request to /organizations/enrich', async () => {
      const mockResponse = {
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue({ company: {} })
        }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      const params = { domain: 'example.com' };
      await client.matchCompany(params);

      expect(mockRequest).toHaveBeenCalledWith(
        'https://api.apollo.io/api/v1/organizations/enrich',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key'
          },
          body: JSON.stringify(params)
        }
      );
    });
  });

  describe('bulkEnrichPeople', () => {
    it('should make POST request to /people/bulk_match with query params', async () => {
      const mockResponse = {
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue({ people: [] })
        }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      const params = { people: [{ email: 'test@example.com' }] };
      await client.bulkEnrichPeople(params);

      expect(mockRequest).toHaveBeenCalledWith(
        'https://api.apollo.io/api/v1/people/bulk_match?reveal_personal_emails=false&reveal_phone_number=false',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key'
          },
          body: JSON.stringify(params)
        }
      );
    });
  });

  describe('bulkEnrichOrganizations', () => {
    it('should make POST request to /organizations/bulk_enrich', async () => {
      const mockResponse = {
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue({ organizations: [] })
        }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      const params = { organizations: [{ domain: 'example.com' }] };
      await client.bulkEnrichOrganizations(params);

      expect(mockRequest).toHaveBeenCalledWith(
        'https://api.apollo.io/api/v1/organizations/bulk_enrich',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key'
          },
          body: JSON.stringify(params)
        }
      );
    });
  });

  describe('getOrganizationJobPostings', () => {
    it('should make GET request to /organizations/{id}/job_postings', async () => {
      const mockResponse = {
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue({ job_postings: [] })
        }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      await client.getOrganizationJobPostings('org123');

      expect(mockRequest).toHaveBeenCalledWith(
        'https://api.apollo.io/api/v1/organizations/org123/job_postings',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key'
          }
        }
      );
    });
  });

  describe('getCompleteOrganizationInfo', () => {
    it('should make GET request to /organizations/{id}', async () => {
      const mockResponse = {
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue({ organization: {} })
        }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      await client.getCompleteOrganizationInfo('org123');

      expect(mockRequest).toHaveBeenCalledWith(
        'https://api.apollo.io/api/v1/organizations/org123',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key'
          }
        }
      );
    });
  });

  describe('searchNewsArticles', () => {
    it('should make POST request to /news_articles/search', async () => {
      const mockResponse = {
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue({ articles: [] })
        }
      };
      mockRequest.mockResolvedValue(mockResponse as any);

      const params = { q: 'test news', page: 1 };
      await client.searchNewsArticles(params);

      expect(mockRequest).toHaveBeenCalledWith(
        'https://api.apollo.io/api/v1/news_articles/search',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key'
          },
          body: JSON.stringify(params)
        }
      );
    });
  });
});
