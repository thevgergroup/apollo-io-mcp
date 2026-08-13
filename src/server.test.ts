import { beforeEach, describe, expect, it, vi } from 'vitest';

type ToolHandler = (args: unknown) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

const mocks = vi.hoisted(() => ({
  registeredTools: new Map<string, ToolHandler>(),
  mockApolloClient: {
    searchPeople: vi.fn(),
    searchCompanies: vi.fn(),
    matchPerson: vi.fn(),
    matchCompany: vi.fn(),
    bulkEnrichPeople: vi.fn(),
    bulkEnrichOrganizations: vi.fn(),
    getOrganizationJobPostings: vi.fn(),
    getCompleteOrganizationInfo: vi.fn(),
    searchNewsArticles: vi.fn(),
  },
  connect: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('dotenv/config', () => ({}));

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn(function() {
    return {
      registerTool: vi.fn((name: string, _definition: unknown, handler: ToolHandler) => {
        mocks.registeredTools.set(name, handler);
      }),
      connect: mocks.connect,
    };
  }),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(function() {
    return {};
  }),
}));

vi.mock('./apollo.js', () => ({
  ApolloClient: vi.fn(function() {
    return mocks.mockApolloClient;
  }),
}));

async function loadServer() {
  process.env.APOLLO_API_KEY = 'test-api-key';
  mocks.registeredTools.clear();
  vi.clearAllMocks();
  vi.resetModules();
  await import('./server.js');
}

function parseTextResult(result: Awaited<ReturnType<ToolHandler>>) {
  return JSON.parse(result.content[0].text);
}

describe('Apollo MCP search tools', () => {
  beforeEach(async () => {
    await loadServer();
  });

  it('maps apollo_search_people MCP inputs to Apollo people search parameters', async () => {
    mocks.mockApolloClient.searchPeople.mockResolvedValue({
      people: [
        {
          id: 'person-1',
          name: 'Jane Founder',
          title: 'EOS Implementer',
          organization: { name: 'Example Co' },
          formatted_address: 'New York, NY',
          linkedin_url: 'https://linkedin.com/in/jane',
          email: 'jane@example.com',
          seniority: 'owner',
        },
      ],
      pagination: { total_entries: 1, page: 2, per_page: 5 },
    });

    const handler = mocks.registeredTools.get('apollo_search_people');
    expect(handler).toBeDefined();

    const result = await handler!({
      query: 'EOS Implementer',
      filters: {
        locations: ['United States'],
        seniority: ['owner'],
        titles: ['EOS Implementer'],
        departments: ['consulting'],
        company_domains: ['example.com'],
        company_names: ['Example Co'],
        industries: ['management consulting'],
        technologies: ['salesforce'],
        years_of_experience: ['10,20'],
        education_degrees: ['MBA'],
        education_schools: ['University of Example'],
      },
      page: 2,
      per_page: 5,
    });

    expect(mocks.mockApolloClient.searchPeople).toHaveBeenCalledWith({
      q_keywords: 'EOS Implementer',
      person_locations: ['United States'],
      person_seniorities: ['owner'],
      person_titles: ['EOS Implementer'],
      person_departments: ['consulting'],
      q_organization_domains_list: ['example.com'],
      organization_names: ['Example Co'],
      organization_industries: ['management consulting'],
      currently_using_any_of_technology_uids: ['salesforce'],
      person_years_of_experience_ranges: ['10,20'],
      person_education_degrees: ['MBA'],
      person_education_schools: ['University of Example'],
      page: 2,
      per_page: 5,
    });

    expect(parseTextResult(result)).toEqual({
      total_results: 1,
      page: 2,
      per_page: 5,
      people: [
        {
          id: 'person-1',
          name: 'Jane Founder',
          title: 'EOS Implementer',
          company: 'Example Co',
          location: 'New York, NY',
          linkedin_url: 'https://linkedin.com/in/jane',
          email: 'jane@example.com',
          seniority: 'owner',
        },
      ],
    });
  });

  it('maps apollo_search_companies MCP inputs to Apollo company search parameters', async () => {
    mocks.mockApolloClient.searchCompanies.mockResolvedValue({
      organizations: [
        {
          id: 'org-1',
          name: 'Example Co',
          website_url: 'https://example.com',
          industry: 'Software',
          employee_count: 42,
          raw_address: '123 Main St',
          linkedin_url: 'https://linkedin.com/company/example',
          founded_year: 2020,
          phone: '555-0100',
          organization_revenue_printed: '$1M-$10M',
          market_cap: null,
        },
      ],
      pagination: { total_entries: 1, page: 3, per_page: 10 },
    });

    const handler = mocks.registeredTools.get('apollo_search_companies');
    expect(handler).toBeDefined();

    const result = await handler!({
      query: 'SaaS',
      filters: {
        organization_num_employees_ranges: ['11-20', '21,50'],
        organization_locations: ['California'],
        organization_not_locations: ['Texas'],
        q_organization_keyword_tags: ['saas'],
        q_organization_name: 'Example Co',
        currently_using_any_of_technology_uids: ['salesforce'],
        revenue_range: { min: 1000000, max: 10000000 },
        latest_funding_amount_range: { min: 500000, max: 2000000 },
        total_funding_range: { min: 1000000, max: 5000000 },
        q_organization_job_titles: ['Account Executive'],
        organization_job_locations: ['Remote'],
        organization_num_jobs_range: { min: 1, max: 20 },
      },
      page: 3,
      per_page: 10,
    });

    expect(mocks.mockApolloClient.searchCompanies).toHaveBeenCalledWith({
      q: 'SaaS',
      page: 3,
      per_page: 10,
      organization_num_employees_ranges: ['11,20', '21,50'],
      organization_locations: ['California'],
      organization_not_locations: ['Texas'],
      revenue_range: { min: 1000000, max: 10000000 },
      currently_using_any_of_technology_uids: ['salesforce'],
      q_organization_keyword_tags: ['saas'],
      q_organization_name: 'Example Co',
      latest_funding_amount_range: { min: 500000, max: 2000000 },
      total_funding_range: { min: 1000000, max: 5000000 },
      q_organization_job_titles: ['Account Executive'],
      organization_job_locations: ['Remote'],
      organization_num_jobs_range: { min: 1, max: 20 },
    });

    expect(parseTextResult(result)).toEqual({
      total_results: 1,
      page: 3,
      per_page: 10,
      companies: [
        {
          id: 'org-1',
          name: 'Example Co',
          website: 'https://example.com',
          industry: 'Software',
          employee_count: 42,
          location: '123 Main St',
          linkedin_url: 'https://linkedin.com/company/example',
          founded_year: 2020,
          phone: '555-0100',
          revenue: '$1M-$10M',
          market_cap: null,
        },
      ],
    });
  });

  it('maps apollo_search_news_articles MCP inputs to Apollo news search parameters', async () => {
    mocks.mockApolloClient.searchNewsArticles.mockResolvedValue({
      news_articles: [{ id: 'article-1', title: 'Example raises funding' }],
      pagination: { total_entries: 1, page: 4, per_page: 15 },
    });

    const handler = mocks.registeredTools.get('apollo_search_news_articles');
    expect(handler).toBeDefined();

    const result = await handler!({
      query: 'funding',
      filters: {
        news_event_types: ['funding'],
        organization_ids: ['org-1'],
      },
      page: 4,
      per_page: 15,
    });

    expect(mocks.mockApolloClient.searchNewsArticles).toHaveBeenCalledWith({
      q: 'funding',
      news_event_types: ['funding'],
      organization_ids: ['org-1'],
      page: 4,
      per_page: 15,
    });

    expect(parseTextResult(result)).toEqual({
      news_articles: [{ id: 'article-1', title: 'Example raises funding' }],
      pagination: { total_entries: 1, page: 4, per_page: 15 },
    });
  });

  it('returns MCP error responses when a search call fails', async () => {
    mocks.mockApolloClient.searchPeople.mockRejectedValue(new Error('Apollo error 429'));

    const handler = mocks.registeredTools.get('apollo_search_people');
    expect(handler).toBeDefined();

    const result = await handler!({ query: 'test' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error searching people: Apollo error 429');
  });
});
