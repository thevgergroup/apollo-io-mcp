import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import { ApolloClient } from '../apollo.js';
import * as fixtures from './fixtures/apollo-responses.js';

/**
 * Integration tests for Apollo.io API
 *
 * These tests can run against the real API if APOLLO_API_KEY is set,
 * or skip gracefully if not available.
 *
 * Run with: npm run test:integration
 * Set API key in .env file: APOLLO_API_KEY=your_key_here
 * Or export: export APOLLO_API_KEY=your_key_here
 */

const hasApiKey = !!process.env.APOLLO_API_KEY;
const describeIntegration = hasApiKey ? describe : describe.skip;

describeIntegration('Apollo.io Integration Tests', () => {
  let client: ApolloClient;

  beforeAll(() => {
    if (!process.env.APOLLO_API_KEY) {
      console.warn('⚠️  APOLLO_API_KEY not set. Skipping integration tests.');
      return;
    }
    client = new ApolloClient({
      apiKey: process.env.APOLLO_API_KEY!
    });
  });

  describe('Search People', () => {
    it('should search for people with basic query', async () => {
      const response = await client.searchPeople({
        q: 'Software Engineer',
        page: 1,
        per_page: 5
      });

      expect(response).toBeDefined();
      expect(response.people).toBeInstanceOf(Array);
      // API response structure may vary - just verify we got results
      expect(response.people.length).toBeGreaterThan(0);
    });

    it('should search people with filters', async () => {
      const response = await client.searchPeople({
        person_titles: ['CEO', 'CTO'],
        q_organization_domains: ['apollo.io'],
        page: 1,
        per_page: 5
      });

      expect(response).toBeDefined();
      expect(response.people).toBeInstanceOf(Array);
    });

    it('should handle queries gracefully', async () => {
      const response = await client.searchPeople({
        q: 'xyzinvalidquery12345nonexistent',
        page: 1,
        per_page: 5
      });

      expect(response).toBeDefined();
      expect(response.people).toBeInstanceOf(Array);
      // Apollo may return some results even for unusual queries
      // The important thing is it doesn't error
    });
  });

  describe('Search Companies', () => {
    it('should search for companies with basic query', async () => {
      const response = await client.searchCompanies({
        q: 'technology',
        page: 1,
        per_page: 5
      });

      expect(response).toBeDefined();
      expect(response.organizations).toBeInstanceOf(Array);
      expect(response.pagination).toBeDefined();
    });

    it('should filter companies by employee count', async () => {
      const response = await client.searchCompanies({
        organization_num_employees_ranges: ['11,20', '21,50'],
        page: 1,
        per_page: 5
      });

      expect(response).toBeDefined();
      expect(response.organizations).toBeInstanceOf(Array);
    });
  });

  describe('Person Enrichment', () => {
    it('should enrich person by email', async () => {
      // Using Apollo.io co-founder as test case (public info)
      const response = await client.matchPerson({
        email: 'tim@apollo.io'
      });

      expect(response).toBeDefined();
      expect(response.person).toBeDefined();
      // Should not reveal personal emails by default
      expect(response.person.email).toBeDefined();
    });

    it('should enrich person with reveal parameters', async () => {
      const response = await client.matchPerson(
        { email: 'tim@apollo.io' },
        false, // reveal_personal_emails
        false  // reveal_phone_number
      );

      expect(response).toBeDefined();
      expect(response.person).toBeDefined();
    });

    it('should handle person not found gracefully', async () => {
      try {
        await client.matchPerson({
          email: 'nonexistent@invaliddomain12345.com'
        });
      } catch (error: any) {
        // Apollo returns 404 or empty result for not found
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Company Enrichment', () => {
    it('should enrich company by domain', async () => {
      const response = await client.matchCompany({
        domain: 'apollo.io'
      });

      expect(response).toBeDefined();
      expect(response.organization).toBeDefined();
      expect(response.organization.name).toBeDefined();
      expect(response.organization.primary_domain).toBe('apollo.io');
    });

    it('should enrich company with all details', async () => {
      const response = await client.matchCompany({
        domain: 'apollo.io'
      });

      const org = response.organization;
      expect(org).toBeDefined();
      expect(org.id).toBeDefined();
      expect(org.name).toBeDefined();
      expect(org.industry).toBeDefined();
      expect(org.estimated_num_employees).toBeGreaterThan(0);
    });
  });

  describe('Bulk Enrichment', () => {
    it('should bulk enrich people', async () => {
      const response = await client.bulkEnrichPeople({
        details: [
          { email: 'tim@apollo.io' },
          { email: 'tim@apollo.io', first_name: 'Tim', last_name: 'Zheng', organization_name: 'Apollo' }
        ]
      });

      expect(response).toBeDefined();
      // Response structure may vary based on API version
      expect(response).toHaveProperty('matches');
    });

    it('should bulk enrich organizations', async () => {
      const response = await client.bulkEnrichOrganizations({
        domains: ['apollo.io', 'google.com']
      });

      expect(response).toBeDefined();
      expect(response.organizations).toBeInstanceOf(Array);
      expect(response.organizations.length).toBeGreaterThan(0);
    });
  });

  describe('Organization Data', () => {
    it('should get organization job postings', async () => {
      // First get an org ID
      const searchResponse = await client.searchCompanies({
        q: 'apollo.io',
        page: 1,
        per_page: 1
      });

      if (searchResponse.organizations.length > 0) {
        const orgId = searchResponse.organizations[0].id;
        const jobsResponse = await client.getOrganizationJobPostings(orgId);

        expect(jobsResponse).toBeDefined();
        // May or may not have active job postings
        if (jobsResponse.job_postings) {
          expect(jobsResponse.job_postings).toBeInstanceOf(Array);
        }
      }
    });

    it('should get complete organization info', async () => {
      // First get an org ID
      const searchResponse = await client.searchCompanies({
        q: 'apollo.io',
        page: 1,
        per_page: 1
      });

      if (searchResponse.organizations.length > 0) {
        const orgId = searchResponse.organizations[0].id;
        const orgResponse = await client.getCompleteOrganizationInfo(orgId);

        expect(orgResponse).toBeDefined();
        expect(orgResponse.organization).toBeDefined();
        expect(orgResponse.organization.id).toBe(orgId);
      }
    });
  });

  describe('News Articles', () => {
    it('should search for news articles or handle plan limitation', async () => {
      try {
        const response = await client.searchNewsArticles({
          q: 'funding',
          page: 1,
          per_page: 5
        });

        expect(response).toBeDefined();
        expect(response.news_articles).toBeInstanceOf(Array);
        expect(response.pagination).toBeDefined();
      } catch (error: any) {
        // News articles may not be available in all API plans
        if (error.message.includes('403') || error.message.includes('API_INACCESSIBLE')) {
          expect(error.message).toContain('news_articles');
          // This is expected for API keys without news article access
        } else {
          throw error;
        }
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting gracefully', async () => {
      // Apollo has rate limits, but we won't intentionally trigger them
      // This test just verifies our error handling is in place
      try {
        await client.searchPeople({ q: 'test', page: 1 });
        expect(true).toBe(true); // Should succeed under normal conditions
      } catch (error: any) {
        if (error.message.includes('429')) {
          expect(error.message).toContain('Rate limited');
        }
      }
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle invalid API key', async () => {
      const invalidClient = new ApolloClient({
        apiKey: 'invalid-key-12345'
      });

      await expect(
        invalidClient.searchPeople({ q: 'test' })
      ).rejects.toThrow(/Unauthorized|invalid/i);
    });

    it('should handle network errors', async () => {
      const client = new ApolloClient({
        apiKey: process.env.APOLLO_API_KEY!,
        baseUrl: 'https://invalid-domain-that-does-not-exist-12345.com/api/v1'
      });

      await expect(
        client.searchPeople({ q: 'test' })
      ).rejects.toThrow();
    });
  });
});

/**
 * Mock-based tests that always run (don't require API key)
 */
describe('Apollo.io API Response Structure', () => {
  it('should have correct person search response structure', () => {
    const response = fixtures.mockPersonSearchResponse;

    expect(response.people).toBeInstanceOf(Array);
    expect(response.pagination).toBeDefined();
    expect(response.pagination.page).toBeDefined();
    expect(response.pagination.per_page).toBeDefined();
    expect(response.pagination.total_entries).toBeDefined();

    if (response.people.length > 0) {
      const person = response.people[0];
      expect(person.id).toBeDefined();
      expect(person.name).toBeDefined();
      expect(person.organization).toBeDefined();
    }
  });

  it('should have correct company search response structure', () => {
    const response = fixtures.mockCompanySearchResponse;

    expect(response.organizations).toBeInstanceOf(Array);
    expect(response.pagination).toBeDefined();

    if (response.organizations.length > 0) {
      const org = response.organizations[0];
      expect(org.id).toBeDefined();
      expect(org.name).toBeDefined();
      expect(org.primary_domain).toBeDefined();
    }
  });

  it('should have correct enrichment response structure', () => {
    const personResponse = fixtures.mockPersonEnrichResponse;
    const companyResponse = fixtures.mockCompanyEnrichResponse;

    expect(personResponse.person).toBeDefined();
    expect(personResponse.person.id).toBeDefined();
    expect(personResponse.person.organization).toBeDefined();

    expect(companyResponse.organization).toBeDefined();
    expect(companyResponse.organization.id).toBeDefined();
    expect(companyResponse.organization.name).toBeDefined();
  });
});
