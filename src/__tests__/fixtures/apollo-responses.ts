/**
 * Test fixtures for Apollo.io API responses
 * These represent realistic API response structures
 */

export const mockPersonSearchResponse = {
  breadcrumbs: [],
  partial_results_only: false,
  disable_eu_prospecting: false,
  partial_results_limit: 10000,
  pagination: {
    page: 1,
    per_page: 10,
    total_entries: 145,
    total_pages: 15
  },
  people: [
    {
      id: "5f7b1234567890abcdef1234",
      first_name: "John",
      last_name: "Doe",
      name: "John Doe",
      title: "Software Engineer",
      email: "john.doe@example.com",
      email_status: "verified",
      photo_url: "https://example.com/photo.jpg",
      linkedin_url: "https://linkedin.com/in/johndoe",
      twitter_url: null,
      github_url: null,
      facebook_url: null,
      city: "San Francisco",
      state: "California",
      country: "United States",
      organization_id: "5f7b9876543210fedcba9876",
      organization: {
        id: "5f7b9876543210fedcba9876",
        name: "Example Corp",
        website_url: "https://example.com",
        blog_url: null,
        angellist_url: null,
        linkedin_url: "https://linkedin.com/company/example-corp",
        twitter_url: "https://twitter.com/examplecorp",
        facebook_url: null,
        primary_phone: {
          number: "+1 415-555-0100",
          source: "Account"
        },
        founded_year: 2010,
        industry: "Computer Software",
        keywords: ["saas", "b2b", "enterprise"],
        estimated_num_employees: 250,
        short_description: "Example Corp provides software solutions"
      }
    }
  ]
};

export const mockCompanySearchResponse = {
  breadcrumbs: [],
  partial_results_only: false,
  disable_eu_prospecting: false,
  partial_results_limit: 10000,
  pagination: {
    page: 1,
    per_page: 10,
    total_entries: 52,
    total_pages: 6
  },
  organizations: [
    {
      id: "5f7b9876543210fedcba9876",
      name: "Example Corp",
      website_url: "https://example.com",
      blog_url: null,
      angellist_url: null,
      linkedin_url: "https://linkedin.com/company/example-corp",
      twitter_url: "https://twitter.com/examplecorp",
      facebook_url: null,
      primary_phone: {
        number: "+1 415-555-0100",
        source: "Account"
      },
      founded_year: 2010,
      industry: "Computer Software",
      keywords: ["saas", "b2b", "enterprise"],
      estimated_num_employees: 250,
      short_description: "Example Corp provides software solutions",
      retail_location_count: 0,
      raw_address: "123 Main St, San Francisco, CA 94105",
      city: "San Francisco",
      state: "California",
      country: "United States",
      owned_by_organization_id: null,
      suborganizations: [],
      num_suborganizations: 0,
      seo_description: "Example Corp - Software Solutions",
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url: "https://example.com/logo.png",
      crunchbase_url: null,
      primary_domain: "example.com",
      personas: ["engineering", "saas"],
      sanitized_phone: "+14155550100"
    }
  ]
};

export const mockPersonEnrichResponse = {
  person: {
    id: "5f7b1234567890abcdef1234",
    first_name: "John",
    last_name: "Doe",
    name: "John Doe",
    title: "Software Engineer",
    email: "john.doe@example.com",
    email_status: "verified",
    photo_url: "https://example.com/photo.jpg",
    linkedin_url: "https://linkedin.com/in/johndoe",
    employment_history: [
      {
        id: "emp1",
        created_at: "2022-01-01T00:00:00.000Z",
        current: true,
        degree: null,
        description: null,
        emails: null,
        end_date: null,
        grade_level: null,
        kind: null,
        major: null,
        organization_id: "5f7b9876543210fedcba9876",
        organization_name: "Example Corp",
        raw_address: null,
        start_date: "2020-01-01",
        title: "Software Engineer",
        updated_at: "2023-01-01T00:00:00.000Z",
        key: "emp_key_1"
      }
    ],
    state: "California",
    city: "San Francisco",
    country: "United States",
    organization_id: "5f7b9876543210fedcba9876",
    organization: {
      id: "5f7b9876543210fedcba9876",
      name: "Example Corp",
      website_url: "https://example.com",
      primary_domain: "example.com"
    }
  }
};

export const mockCompanyEnrichResponse = {
  organization: {
    id: "5f7b9876543210fedcba9876",
    name: "Example Corp",
    website_url: "https://example.com",
    blog_url: null,
    angellist_url: null,
    linkedin_url: "https://linkedin.com/company/example-corp",
    twitter_url: "https://twitter.com/examplecorp",
    facebook_url: null,
    primary_phone: {
      number: "+1 415-555-0100",
      source: "Account"
    },
    founded_year: 2010,
    industry: "Computer Software",
    keywords: ["saas", "b2b", "enterprise"],
    estimated_num_employees: 250,
    short_description: "Example Corp provides software solutions",
    annual_revenue_printed: "$10M",
    annual_revenue: 10000000,
    total_funding: 5000000,
    total_funding_printed: "$5M",
    latest_funding_round_date: "2022-06-01",
    latest_funding_stage: "Series A",
    funding_events: [
      {
        id: "funding1",
        date: "2022-06-01",
        funding_round: "Series A",
        investors: "Acme Ventures",
        amount: "$5M"
      }
    ],
    technology_names: ["React", "Node.js", "AWS"],
    current_technologies: [
      {
        uid: "react",
        name: "React",
        category: "Frontend"
      }
    ],
    phone: "+14155550100",
    phone_status: "no_status",
    sanitized_phone: "+14155550100"
  }
};

export const mockBulkEnrichPeopleResponse = {
  matches: [
    {
      id: "5f7b1234567890abcdef1234",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      title: "Software Engineer",
      organization_name: "Example Corp"
    },
    {
      id: "5f7b1234567890abcdef5678",
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@example.com",
      title: "Product Manager",
      organization_name: "Example Corp"
    }
  ]
};

export const mockBulkEnrichOrganizationsResponse = {
  organizations: [
    {
      id: "5f7b9876543210fedcba9876",
      name: "Example Corp",
      website_url: "https://example.com",
      primary_domain: "example.com",
      industry: "Computer Software",
      estimated_num_employees: 250
    },
    {
      id: "5f7b9876543210fedcba5432",
      name: "Another Company",
      website_url: "https://another.com",
      primary_domain: "another.com",
      industry: "Internet",
      estimated_num_employees: 50
    }
  ]
};

export const mockJobPostingsResponse = {
  job_postings: [
    {
      id: "job1",
      title: "Senior Software Engineer",
      url: "https://example.com/jobs/senior-engineer",
      posted_at: "2024-01-15T00:00:00.000Z",
      location: "San Francisco, CA",
      description: "We are looking for a senior software engineer..."
    },
    {
      id: "job2",
      title: "Product Manager",
      url: "https://example.com/jobs/product-manager",
      posted_at: "2024-01-20T00:00:00.000Z",
      location: "Remote",
      description: "Join our product team..."
    }
  ]
};

export const mockNewsArticlesResponse = {
  news_articles: [
    {
      id: "news1",
      title: "Example Corp Raises $5M in Series A",
      url: "https://techcrunch.com/example-corp-funding",
      published_date: "2024-01-10",
      snippet: "Example Corp announced today that it has raised $5M...",
      source: "TechCrunch"
    },
    {
      id: "news2",
      title: "Example Corp Launches New Product",
      url: "https://venturebeat.com/example-corp-product",
      published_date: "2024-02-01",
      snippet: "Example Corp today unveiled its latest product...",
      source: "VentureBeat"
    }
  ],
  pagination: {
    page: 1,
    per_page: 10,
    total_entries: 25,
    total_pages: 3
  }
};

export const mockErrorResponses = {
  unauthorized: {
    statusCode: 401,
    body: "Unauthorized: invalid or missing API key"
  },
  rateLimited: {
    statusCode: 429,
    headers: { 'retry-after': '60' },
    body: "Rate limit exceeded"
  },
  badRequest: {
    statusCode: 400,
    body: "Bad request: missing required parameters"
  },
  notFound: {
    statusCode: 404,
    body: "Resource not found"
  },
  serverError: {
    statusCode: 500,
    body: "Internal server error"
  }
};
