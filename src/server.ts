import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ApolloClient } from "./apollo.js";

// ----- Config -----
const apiKey = process.env.APOLLO_API_KEY;
if (!apiKey) {
  console.error("APOLLO_API_KEY is required (env).");
  process.exit(1);
}

const apollo = new ApolloClient({
  apiKey,
  baseUrl: process.env.APOLLO_BASE_URL
});

// Create MCP server
const server = new McpServer({
  name: "apollo-mcp",
  version: "0.1.0"
});

// ----- Tool Schemas -----
const PaginationSchema = z.object({
  page: z.number().int().min(1).optional(),
  per_page: z.number().int().min(1).max(200).optional(),
});

const SearchPeopleInput = z
  .object({
    query: z.string().optional(),
    filters: z.object({
      locations: z.array(z.string()).optional(),
      seniority: z.array(z.string()).optional(),
      titles: z.array(z.string()).optional(),
      departments: z.array(z.string()).optional(),
      company_domains: z.array(z.string()).optional(),
      company_names: z.array(z.string()).optional(),
      industries: z.array(z.string()).optional(),
      technologies: z.array(z.string()).optional(),
      years_of_experience: z.array(z.string()).optional(),
      education_degrees: z.array(z.string()).optional(),
      education_schools: z.array(z.string()).optional(),
    }).optional(),
  })
  .merge(PaginationSchema);

const SearchCompaniesInput = z
  .object({
    query: z.string().optional(),
    filters: z.object({
      organization_num_employees_ranges: z.array(z.string()).optional(),
      organization_locations: z.array(z.string()).optional(),
      organization_not_locations: z.array(z.string()).optional(),
      q_organization_keyword_tags: z.array(z.string()).optional(),
      q_organization_name: z.string().optional(),
      currently_using_any_of_technology_uids: z.array(z.string()).optional(),
      revenue_range: z.object({
        min: z.number().optional(),
        max: z.number().optional()
      }).optional(),
      latest_funding_amount_range: z.object({
        min: z.number().optional(),
        max: z.number().optional()
      }).optional(),
      total_funding_range: z.object({
        min: z.number().optional(),
        max: z.number().optional()
      }).optional(),
      q_organization_job_titles: z.array(z.string()).optional(),
      organization_job_locations: z.array(z.string()).optional(),
      organization_num_jobs_range: z.object({
        min: z.number().optional(),
        max: z.number().optional()
      }).optional(),
    }).optional()
  })
  .merge(PaginationSchema);

const EnrichPersonInput = z.object({
  email: z.string().email().optional(),
  linkedin_url: z.string().url().optional(),
  name: z.string().optional(),
  company: z.string().optional(),
  reveal_personal_emails: z.boolean().optional(),
  reveal_phone_number: z.boolean().optional()
});

const EnrichCompanyInput = z.object({
  domain: z.string().optional(),
  name: z.string().optional()
});

const BulkEnrichPeopleInput = z.object({
  people: z.array(z.object({
    email: z.string().email().optional(),
    linkedin_url: z.string().url().optional(),
    name: z.string().optional(),
    company: z.string().optional()
  })),
  reveal_personal_emails: z.boolean().optional(),
  reveal_phone_number: z.boolean().optional()
});

const BulkEnrichOrganizationsInput = z.object({
  organizations: z.array(z.object({
    domain: z.string().optional(),
    name: z.string().optional()
  }))
});

const NewsArticlesSearchInput = z
  .object({
    query: z.string().optional(),
    filters: z.record(z.string(), z.any()).optional(),
  })
  .merge(PaginationSchema);

// ----- Register Tools -----

// Search People Tool
server.registerTool(
  "apollo_search_people",
  {
    title: "Search People",
    description: "Search for people in Apollo with advanced filtering options. Use filters to target specific roles, locations, seniority levels, and companies.",
    inputSchema: {
      query: z.string().optional().describe("Search query for names, titles, or keywords"),
      filters: z.object({
        // Location filters
        locations: z.array(z.string()).optional().describe("Person locations (cities, states, countries)"),

        // Role and seniority filters
        seniority: z.array(z.string()).optional().describe("Seniority levels (e.g., ['C-Level', 'VP', 'Director'])"),
        titles: z.array(z.string()).optional().describe("Job titles (e.g., ['CEO', 'CTO', 'Sales Manager'])"),
        departments: z.array(z.string()).optional().describe("Departments (e.g., ['Engineering', 'Sales', 'Marketing'])"),

        // Company filters
        company_domains: z.array(z.string()).optional().describe("Company domains (e.g., ['google.com', 'microsoft.com'])"),
        company_names: z.array(z.string()).optional().describe("Company names"),

        // Industry filters
        industries: z.array(z.string()).optional().describe("Industries (e.g., ['Software', 'Healthcare', 'Finance'])"),

        // Technology filters
        technologies: z.array(z.string()).optional().describe("Technologies they use (e.g., ['python', 'react', 'salesforce'])"),

        // Experience filters
        years_of_experience: z.array(z.string()).optional().describe("Experience ranges (e.g., ['1-3', '4-6', '7-10'])"),

        // Education filters
        education_degrees: z.array(z.string()).optional().describe("Education degrees (e.g., ['MBA', 'PhD', 'Bachelor'])"),
        education_schools: z.array(z.string()).optional().describe("Education institutions")
      }).optional().describe("Advanced filtering options for targeting specific people"),
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().optional().describe("Results per page (1-200, default: 25)")
    }
  },
  async (args: any) => {
    try {
      const parsed = SearchPeopleInput.parse(args || {});
      const body: Record<string, unknown> = {};
      if (parsed.query) body.q = parsed.query;
      if (parsed.filters) Object.assign(body, parsed.filters);
      if (parsed.page) body.page = parsed.page;
      if (parsed.per_page) body.per_page = parsed.per_page;

      const result = await apollo.searchPeople(body) as any;

      // Simplify the response for Claude Desktop
      const simplifiedPeople = result.people?.map((person: any) => ({
        id: person.id,
        name: person.name,
        title: person.title,
        company: person.organization?.name,
        location: person.formatted_address,
        linkedin_url: person.linkedin_url,
        email: person.email,
        seniority: person.seniority
      })) || [];

      const summary = {
        total_results: result.pagination?.total_entries || 0,
        page: result.pagination?.page || 1,
        per_page: result.pagination?.per_page || 25,
        people: simplifiedPeople
      };

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error searching people: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true
      };
    }
  }
);

// Search Companies Tool
server.registerTool(
  "apollo_search_companies",
  {
    title: "Search Companies",
    description: "Search for companies/organizations in Apollo with comprehensive filtering options. Use filters to target specific company types, locations, sizes, and industries.",
    inputSchema: {
      query: z.string().optional().describe("Search query for company names, industries, or keywords"),
      filters: z.object({
        // Employee size filters
        organization_num_employees_ranges: z.array(z.string()).optional().describe("Employee count ranges in comma format (e.g., ['11,20', '21,50']). Very restrictive - may return 0 results if too narrow."),

        // Location filters (most effective)
        organization_locations: z.array(z.string()).optional().describe("Company locations (cities, states, countries). Most effective filter for narrowing results."),
        organization_not_locations: z.array(z.string()).optional().describe("Exclude companies from specific locations"),

        // Industry/Keyword filters (crucial for targeting)
        q_organization_keyword_tags: z.array(z.string()).optional().describe("Industry keywords for filtering (e.g., ['edtech', 'saas', 'fintech']). Essential for industry targeting."),
        q_organization_name: z.string().optional().describe("Specific company name filter"),

        // Technology filters
        currently_using_any_of_technology_uids: z.array(z.string()).optional().describe("Technologies companies use (e.g., ['salesforce', 'aws', 'react'])"),

        // Revenue filters
        revenue_range: z.object({
          min: z.number().optional(),
          max: z.number().optional()
        }).optional().describe("Revenue range in dollars (no commas/symbols)"),

        // Funding filters
        latest_funding_amount_range: z.object({
          min: z.number().optional(),
          max: z.number().optional()
        }).optional().describe("Latest funding round amount range"),
        total_funding_range: z.object({
          min: z.number().optional(),
          max: z.number().optional()
        }).optional().describe("Total funding amount range"),

        // Job-related filters
        q_organization_job_titles: z.array(z.string()).optional().describe("Job titles in active postings"),
        organization_job_locations: z.array(z.string()).optional().describe("Job posting locations"),
        organization_num_jobs_range: z.object({
          min: z.number().optional(),
          max: z.number().optional()
        }).optional().describe("Number of active job postings range")
      }).optional().describe("Advanced filtering options. Start with location + keywords for best results."),
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().optional().describe("Results per page (1-200, default: 25)")
    }
  },
  async (args: any) => {
    try {
      const parsed = SearchCompaniesInput.parse(args || {});
      const body: Record<string, unknown> = {};

      if (parsed.query) body.q = parsed.query;
      if (parsed.page) body.page = parsed.page;
      if (parsed.per_page) body.per_page = parsed.per_page;

      // Map filters according to Apollo.io API documentation
      if (parsed.filters) {
        // Handle employee ranges - convert from "11-20" format to "11,20" format
        if (parsed.filters.organization_num_employees_ranges) {
          body.organization_num_employees_ranges = parsed.filters.organization_num_employees_ranges.map((range: string) => {
            if (range.includes('-')) {
              return range.replace('-', ',');
            }
            return range;
          });
        }

        // Handle locations
        if (parsed.filters.organization_locations) {
          body.organization_locations = parsed.filters.organization_locations;
        }

        // Handle excluded locations
        if (parsed.filters.organization_not_locations) {
          body.organization_not_locations = parsed.filters.organization_not_locations;
        }

                                        // Handle revenue ranges
                if (parsed.filters.revenue_range) {
                  (body as any).revenue_range = {};
                  if (parsed.filters.revenue_range.min) {
                    (body as any).revenue_range.min = parsed.filters.revenue_range.min;
                  }
                  if (parsed.filters.revenue_range.max) {
                    (body as any).revenue_range.max = parsed.filters.revenue_range.max;
                  }
                }

                // Handle technologies
                if (parsed.filters.currently_using_any_of_technology_uids) {
                  body.currently_using_any_of_technology_uids = parsed.filters.currently_using_any_of_technology_uids;
                }

                // Handle organization keywords
                if (parsed.filters.q_organization_keyword_tags) {
                  body.q_organization_keyword_tags = parsed.filters.q_organization_keyword_tags;
                }

                // Handle organization name
                if (parsed.filters.q_organization_name) {
                  body.q_organization_name = parsed.filters.q_organization_name;
                }

                // Handle funding ranges
                if (parsed.filters.latest_funding_amount_range) {
                  (body as any).latest_funding_amount_range = {};
                  if (parsed.filters.latest_funding_amount_range.min) {
                    (body as any).latest_funding_amount_range.min = parsed.filters.latest_funding_amount_range.min;
                  }
                  if (parsed.filters.latest_funding_amount_range.max) {
                    (body as any).latest_funding_amount_range.max = parsed.filters.latest_funding_amount_range.max;
                  }
                }

                if (parsed.filters.total_funding_range) {
                  (body as any).total_funding_range = {};
                  if (parsed.filters.total_funding_range.min) {
                    (body as any).total_funding_range.min = parsed.filters.total_funding_range.min;
                  }
                  if (parsed.filters.total_funding_range.max) {
                    (body as any).total_funding_range.max = parsed.filters.total_funding_range.max;
                  }
                }

                // Handle job-related filters
                if (parsed.filters.q_organization_job_titles) {
                  body.q_organization_job_titles = parsed.filters.q_organization_job_titles;
                }

                if (parsed.filters.organization_job_locations) {
                  body.organization_job_locations = parsed.filters.organization_job_locations;
                }

                if (parsed.filters.organization_num_jobs_range) {
                  (body as any).organization_num_jobs_range = {};
                  if (parsed.filters.organization_num_jobs_range.min) {
                    (body as any).organization_num_jobs_range.min = parsed.filters.organization_num_jobs_range.min;
                  }
                  if (parsed.filters.organization_num_jobs_range.max) {
                    (body as any).organization_num_jobs_range.max = parsed.filters.organization_num_jobs_range.max;
                  }
                }
      }

      const result = await apollo.searchCompanies(body) as any;

      // Simplify the response for Claude Desktop
      // 🐛 FIX: Changed from result.accounts to result.organizations
      const simplifiedCompanies = result.organizations?.map((company: any) => ({
        id: company.id,
        name: company.name,
        website: company.website_url,
        industry: company.industry,
        employee_count: company.employee_count,
        location: company.raw_address || `${company.city || ''}, ${company.state || ''}, ${company.country || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, ''),
        linkedin_url: company.linkedin_url,
        founded_year: company.founded_year,
        phone: company.phone,
        revenue: company.organization_revenue_printed,
        market_cap: company.market_cap
      })) || [];

      const summary = {
        total_results: result.pagination?.total_entries || 0,
        page: result.pagination?.page || 1,
        per_page: result.pagination?.per_page || 25,
        companies: simplifiedCompanies
      };

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error searching companies: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true
      };
    }
  }
);

// Enrich Person Tool
server.registerTool(
  "apollo_enrich_person",
  {
    title: "Enrich Person",
    description: "Enrich a person by email, linkedin_url, or name+company using Apollo match.",
    inputSchema: {
      email: z.string().email().optional(),
      linkedin_url: z.string().url().optional(),
      name: z.string().optional(),
      company: z.string().optional(),
      reveal_personal_emails: z.boolean().optional().describe("Reveal personal emails (default: false)"),
      reveal_phone_number: z.boolean().optional().describe("Reveal phone numbers (default: false)")
    }
  },
  async (args: any) => {
    try {
      const parsed = EnrichPersonInput.parse(args || {});
      const { reveal_personal_emails, reveal_phone_number, ...body } = parsed;
      const json = await apollo.matchPerson(
        body,
        reveal_personal_emails ?? false,
        reveal_phone_number ?? false
      );
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error enriching person: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true
      };
    }
  }
);

// Enrich Company Tool
server.registerTool(
  "apollo_enrich_company",
  {
    title: "Enrich Company",
    description: "Enrich a company/organization by domain or name using Apollo match.",
    inputSchema: {
      domain: z.string().optional(),
      name: z.string().optional()
    }
  },
  async (args: any) => {
    try {
      const parsed = EnrichCompanyInput.parse(args || {});
      const body: Record<string, unknown> = { ...parsed };
      const json = await apollo.matchCompany(body);
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error enriching company: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true
      };
    }
  }
);

// Bulk Enrich People Tool
server.registerTool(
  "apollo_bulk_enrich_people",
  {
    title: "Bulk Enrich People",
    description: "Bulk enrich multiple people using Apollo match. Provide an array of people with email, linkedin_url, name, or company.",
    inputSchema: {
      people: z.array(z.object({
        email: z.string().email().optional(),
        linkedin_url: z.string().url().optional(),
        name: z.string().optional(),
        company: z.string().optional()
      })),
      reveal_personal_emails: z.boolean().optional().describe("Reveal personal emails (default: false)"),
      reveal_phone_number: z.boolean().optional().describe("Reveal phone numbers (default: false)")
    }
  },
  async (args: any) => {
    try {
      const parsed = BulkEnrichPeopleInput.parse(args || {});
      const { reveal_personal_emails, reveal_phone_number, ...body } = parsed;
      const json = await apollo.bulkEnrichPeople(
        body,
        reveal_personal_emails ?? false,
        reveal_phone_number ?? false
      );
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error bulk enriching people: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true
      };
    }
  }
);

// Bulk Enrich Organizations Tool
server.registerTool(
  "apollo_bulk_enrich_organizations",
  {
    title: "Bulk Enrich Organizations",
    description: "Bulk enrich multiple organizations using Apollo match. Provide an array of organizations with domain or name.",
    inputSchema: {
      organizations: z.array(z.object({
        domain: z.string().optional(),
        name: z.string().optional()
      }))
    }
  },
  async (args: any) => {
    try {
      const parsed = BulkEnrichOrganizationsInput.parse(args || {});
      const json = await apollo.bulkEnrichOrganizations(parsed);
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error bulk enriching organizations: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true
      };
    }
  }
);

// Get Organization Job Postings Tool
server.registerTool(
  "apollo_get_organization_job_postings",
  {
    title: "Get Organization Job Postings",
    description: "Get job postings for a specific organization by organization ID.",
    inputSchema: {
      organization_id: z.string().describe("The Apollo organization ID")
    }
  },
  async (args: any) => {
    try {
      const json = await apollo.getOrganizationJobPostings(args.organization_id);
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error getting job postings: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true
      };
    }
  }
);

// Get Complete Organization Info Tool
server.registerTool(
  "apollo_get_complete_organization_info",
  {
    title: "Get Complete Organization Info",
    description: "Get complete information for a specific organization by organization ID.",
    inputSchema: {
      organization_id: z.string().describe("The Apollo organization ID")
    }
  },
  async (args: any) => {
    try {
      const json = await apollo.getCompleteOrganizationInfo(args.organization_id);
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error getting organization info: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true
      };
    }
  }
);

// Search News Articles Tool
server.registerTool(
  "apollo_search_news_articles",
  {
    title: "Search News Articles",
    description: "Search for news articles related to companies in Apollo. Supports 'query', 'filters', pagination.",
    inputSchema: {
      query: z.string().optional(),
      filters: z.record(z.string(), z.any()).optional(),
      page: z.number().optional(),
      per_page: z.number().optional()
    }
  },
  async (args: any) => {
    try {
      const parsed = NewsArticlesSearchInput.parse(args || {});
      const body: Record<string, unknown> = {};
      if (parsed.query) body.q = parsed.query;
      if (parsed.filters) Object.assign(body, parsed.filters);
      if (parsed.page) body.page = parsed.page;
      if (parsed.per_page) body.per_page = parsed.per_page;

      const json = await apollo.searchNewsArticles(body);
      return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error searching news articles: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true
      };
    }
  }
);

// ----- Start Server -----
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Apollo.io MCP Server started successfully");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
