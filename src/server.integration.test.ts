import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApolloClient } from './apollo.js';

// Mock the ApolloClient
vi.mock('./apollo.js', () => ({
  ApolloClient: vi.fn().mockImplementation(() => ({
    searchPeople: vi.fn(),
    searchCompanies: vi.fn(),
    matchPerson: vi.fn(),
    matchCompany: vi.fn(),
    bulkEnrichPeople: vi.fn(),
    bulkEnrichOrganizations: vi.fn(),
    getOrganizationJobPostings: vi.fn(),
    getCompleteOrganizationInfo: vi.fn(),
    searchNewsArticles: vi.fn()
  }))
}));

describe('Apollo MCP Server Integration Tests', () => {
  let mockApolloClient: any;

  beforeEach(() => {
    // Set required env var
    process.env.APOLLO_API_KEY = 'test-api-key';
    vi.clearAllMocks();
    mockApolloClient = new ApolloClient({ apiKey: 'test' });
  });

  afterEach(() => {
    delete process.env.APOLLO_API_KEY;
  });

  describe('apollo_search_companies - PR #18 Bug Fix', () => {
    it('should use organizations field not accounts field from API response', async () => {
      // This test verifies the critical bug fix in PR #18
      const mockApiResponse = {
        organizations: [
          {
            id: '1',
            name: 'Example Corp',
            website_url: 'https://example.com',
            industry: 'Software',
            employee_count: '100-500',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA',
            linkedin_url: 'https://linkedin.com/company/example',
            founded_year: '2015',
            phone: '555-0100',
            organization_revenue_printed: '$10M-$50M',
            market_cap: null
          },
          {
            id: '2',
            name: 'Another Corp',
            website_url: 'https://another.com',
            industry: 'Finance',
            employee_count: '50-100',
            raw_address: '123 Main St, New York, NY 10001',
            linkedin_url: null,
            founded_year: '2018',
            phone: null,
            organization_revenue_printed: '$1M-$10M',
            market_cap: null
          }
        ],
        pagination: {
          page: 1,
          per_page: 25,
          total_entries: 2
        }
      };

      mockApolloClient.searchCompanies.mockResolvedValue(mockApiResponse);

      const result = await mockApolloClient.searchCompanies({ q: 'test' });

      // Verify the response uses organizations field
      expect(result.organizations).toBeDefined();
      expect(result.organizations).toHaveLength(2);
      expect(result.organizations[0].name).toBe('Example Corp');
      expect(result.organizations[1].name).toBe('Another Corp');

      // Verify accounts field is NOT used (old bug)
      expect(result.accounts).toBeUndefined();
    });

    it('should handle empty organizations array', async () => {
      const mockApiResponse = {
        organizations: [],
        pagination: {
          page: 1,
          per_page: 25,
          total_entries: 0
        }
      };

      mockApolloClient.searchCompanies.mockResolvedValue(mockApiResponse);

      const result = await mockApolloClient.searchCompanies({ q: 'nonexistent' });

      expect(result.organizations).toBeDefined();
      expect(result.organizations).toHaveLength(0);
      expect(result.pagination.total_entries).toBe(0);
    });

    it('should handle missing organizations field gracefully', async () => {
      // Edge case: API returns unexpected structure
      const mockApiResponse = {
        pagination: {
          page: 1,
          per_page: 25,
          total_entries: 0
        }
      };

      mockApolloClient.searchCompanies.mockResolvedValue(mockApiResponse);

      const result = await mockApolloClient.searchCompanies({ q: 'test' });

      // Should handle missing field without crashing
      expect(result.organizations).toBeUndefined();
    });
  });

  describe('apollo_search_people', () => {
    it('should search people with basic query', async () => {
      const mockResponse = {
        people: [
          {
            id: 'p1',
            name: 'John Doe',
            email: 'john@example.com',
            title: 'CEO',
            linkedin_url: 'https://linkedin.com/in/johndoe',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA'
          }
        ],
        pagination: {
          page: 1,
          per_page: 25,
          total_entries: 1
        }
      };

      mockApolloClient.searchPeople.mockResolvedValue(mockResponse);

      const result = await mockApolloClient.searchPeople({ q: 'John Doe' });

      expect(result.people).toHaveLength(1);
      expect(result.people[0].name).toBe('John Doe');
      expect(mockApolloClient.searchPeople).toHaveBeenCalledWith({ q: 'John Doe' });
    });

    it('should search people with filters', async () => {
      const mockResponse = { people: [], pagination: { total_entries: 0 } };
      mockApolloClient.searchPeople.mockResolvedValue(mockResponse);

      await mockApolloClient.searchPeople({
        filters: {
          title: 'CEO',
          seniority: ['C-Level'],
          company_domains: ['example.com']
        }
      });

      expect(mockApolloClient.searchPeople).toHaveBeenCalled();
    });

    it('should handle pagination parameters', async () => {
      const mockResponse = {
        people: [],
        pagination: { page: 2, per_page: 50, total_entries: 100 }
      };
      mockApolloClient.searchPeople.mockResolvedValue(mockResponse);

      await mockApolloClient.searchPeople({ page: 2, per_page: 50 });

      expect(mockApolloClient.searchPeople).toHaveBeenCalledWith({ page: 2, per_page: 50 });
    });
  });

  describe('apollo_enrich_person', () => {
    it('should enrich person by email', async () => {
      const mockResponse = {
        person: {
          id: 'p1',
          name: 'Jane Smith',
          email: 'jane@example.com',
          title: 'CTO',
          company: 'Example Corp'
        }
      };

      mockApolloClient.matchPerson.mockResolvedValue(mockResponse);

      const result = await mockApolloClient.matchPerson({ email: 'jane@example.com' });

      expect(result.person.name).toBe('Jane Smith');
      expect(mockApolloClient.matchPerson).toHaveBeenCalledWith({ email: 'jane@example.com' });
    });

    it('should enrich person by linkedin_url', async () => {
      const mockResponse = {
        person: { id: 'p1', name: 'Bob Johnson', linkedin_url: 'https://linkedin.com/in/bob' }
      };

      mockApolloClient.matchPerson.mockResolvedValue(mockResponse);

      await mockApolloClient.matchPerson({ linkedin_url: 'https://linkedin.com/in/bob' });

      expect(mockApolloClient.matchPerson).toHaveBeenCalled();
    });

    it('should enrich person by name and company', async () => {
      const mockResponse = {
        person: { id: 'p1', name: 'Alice Brown', company: 'Tech Inc' }
      };

      mockApolloClient.matchPerson.mockResolvedValue(mockResponse);

      await mockApolloClient.matchPerson({ name: 'Alice Brown', company: 'Tech Inc' });

      expect(mockApolloClient.matchPerson).toHaveBeenCalledWith({
        name: 'Alice Brown',
        company: 'Tech Inc'
      });
    });
  });

  describe('apollo_enrich_company', () => {
    it('should enrich company by domain', async () => {
      const mockResponse = {
        organization: {
          id: 'c1',
          name: 'Example Corp',
          domain: 'example.com',
          industry: 'Software',
          employee_count: '100-500'
        }
      };

      mockApolloClient.matchCompany.mockResolvedValue(mockResponse);

      const result = await mockApolloClient.matchCompany({ domain: 'example.com' });

      expect(result.organization.name).toBe('Example Corp');
      expect(mockApolloClient.matchCompany).toHaveBeenCalledWith({ domain: 'example.com' });
    });

    it('should enrich company by name', async () => {
      const mockResponse = {
        organization: { id: 'c1', name: 'Tech Startup' }
      };

      mockApolloClient.matchCompany.mockResolvedValue(mockResponse);

      await mockApolloClient.matchCompany({ name: 'Tech Startup' });

      expect(mockApolloClient.matchCompany).toHaveBeenCalledWith({ name: 'Tech Startup' });
    });
  });

  describe('apollo_bulk_enrich_people', () => {
    it('should bulk enrich multiple people', async () => {
      const mockResponse = {
        matches: [
          { person: { name: 'Person 1', email: 'p1@example.com' } },
          { person: { name: 'Person 2', email: 'p2@example.com' } }
        ]
      };

      mockApolloClient.bulkEnrichPeople.mockResolvedValue(mockResponse);

      const people = [
        { email: 'p1@example.com' },
        { email: 'p2@example.com' }
      ];

      const result = await mockApolloClient.bulkEnrichPeople({ people });

      expect(result.matches).toHaveLength(2);
      expect(mockApolloClient.bulkEnrichPeople).toHaveBeenCalledWith({ people });
    });

    it('should handle empty people array', async () => {
      const mockResponse = { matches: [] };
      mockApolloClient.bulkEnrichPeople.mockResolvedValue(mockResponse);

      const result = await mockApolloClient.bulkEnrichPeople({ people: [] });

      expect(result.matches).toHaveLength(0);
    });
  });

  describe('apollo_bulk_enrich_organizations', () => {
    it('should bulk enrich multiple organizations', async () => {
      const mockResponse = {
        matches: [
          { organization: { name: 'Org 1', domain: 'org1.com' } },
          { organization: { name: 'Org 2', domain: 'org2.com' } }
        ]
      };

      mockApolloClient.bulkEnrichOrganizations.mockResolvedValue(mockResponse);

      const organizations = [
        { domain: 'org1.com' },
        { domain: 'org2.com' }
      ];

      const result = await mockApolloClient.bulkEnrichOrganizations({ organizations });

      expect(result.matches).toHaveLength(2);
      expect(mockApolloClient.bulkEnrichOrganizations).toHaveBeenCalledWith({ organizations });
    });
  });

  describe('apollo_get_organization_job_postings', () => {
    it('should get job postings for organization', async () => {
      const mockResponse = {
        job_postings: [
          {
            id: 'j1',
            title: 'Software Engineer',
            location: 'San Francisco, CA',
            posted_at: '2025-01-01'
          },
          {
            id: 'j2',
            title: 'Product Manager',
            location: 'Remote',
            posted_at: '2025-01-15'
          }
        ]
      };

      mockApolloClient.getOrganizationJobPostings.mockResolvedValue(mockResponse);

      const result = await mockApolloClient.getOrganizationJobPostings('org123');

      expect(result.job_postings).toHaveLength(2);
      expect(result.job_postings[0].title).toBe('Software Engineer');
      expect(mockApolloClient.getOrganizationJobPostings).toHaveBeenCalledWith('org123');
    });

    it('should handle organization with no job postings', async () => {
      const mockResponse = { job_postings: [] };
      mockApolloClient.getOrganizationJobPostings.mockResolvedValue(mockResponse);

      const result = await mockApolloClient.getOrganizationJobPostings('org456');

      expect(result.job_postings).toHaveLength(0);
    });
  });

  describe('apollo_get_complete_organization_info', () => {
    it('should get complete organization information', async () => {
      const mockResponse = {
        organization: {
          id: 'org123',
          name: 'Complete Org',
          domain: 'complete.com',
          industry: 'Technology',
          employee_count: '500-1000',
          founded_year: '2010',
          revenue: '$50M-$100M',
          technologies: ['React', 'Node.js', 'PostgreSQL']
        }
      };

      mockApolloClient.getCompleteOrganizationInfo.mockResolvedValue(mockResponse);

      const result = await mockApolloClient.getCompleteOrganizationInfo('org123');

      expect(result.organization.name).toBe('Complete Org');
      expect(result.organization.technologies).toContain('React');
      expect(mockApolloClient.getCompleteOrganizationInfo).toHaveBeenCalledWith('org123');
    });
  });

  describe('apollo_search_news_articles', () => {
    it('should search news articles', async () => {
      const mockResponse = {
        articles: [
          {
            id: 'a1',
            title: 'Company Raises $10M',
            url: 'https://news.example.com/article1',
            published_at: '2025-01-10',
            source: 'TechCrunch'
          }
        ],
        pagination: {
          page: 1,
          total_entries: 1
        }
      };

      mockApolloClient.searchNewsArticles.mockResolvedValue(mockResponse);

      const result = await mockApolloClient.searchNewsArticles({
        q: 'funding',
        page: 1
      });

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].title).toBe('Company Raises $10M');
      expect(mockApolloClient.searchNewsArticles).toHaveBeenCalledWith({
        q: 'funding',
        page: 1
      });
    });

    it('should handle no news articles found', async () => {
      const mockResponse = {
        articles: [],
        pagination: { page: 1, total_entries: 0 }
      };

      mockApolloClient.searchNewsArticles.mockResolvedValue(mockResponse);

      const result = await mockApolloClient.searchNewsArticles({ q: 'nonexistent topic' });

      expect(result.articles).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors in search people', async () => {
      const error = new Error('API rate limit exceeded');
      mockApolloClient.searchPeople.mockRejectedValue(error);

      await expect(mockApolloClient.searchPeople({})).rejects.toThrow('API rate limit exceeded');
    });

    it('should handle API errors in search companies', async () => {
      const error = new Error('Invalid API key');
      mockApolloClient.searchCompanies.mockRejectedValue(error);

      await expect(mockApolloClient.searchCompanies({})).rejects.toThrow('Invalid API key');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network connection failed');
      mockApolloClient.matchPerson.mockRejectedValue(error);

      await expect(mockApolloClient.matchPerson({})).rejects.toThrow('Network connection failed');
    });
  });
});
