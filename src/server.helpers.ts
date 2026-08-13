/**
 * Selects the companies array from an Apollo search response.
 * Apollo returns results in `organizations` for q_organization_name queries
 * but in `accounts` for generic keyword queries.
 */
export function selectCompaniesArray(result: any): any[] {
  return result.organizations?.length ? result.organizations : (result.accounts ?? []);
}

/**
 * Simplifies a raw Apollo company object to essential fields.
 */
export function simplifyCompany(company: any): Record<string, any> {
  return {
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
  };
}

type PeopleSearchFilters = Record<string, unknown>;

const PEOPLE_SEARCH_FILTER_MAP: Record<string, string> = {
  locations: 'person_locations',
  seniority: 'person_seniorities',
  titles: 'person_titles',
  departments: 'person_departments',
  company_domains: 'q_organization_domains_list',
  company_names: 'organization_names',
  industries: 'organization_industries',
  technologies: 'currently_using_any_of_technology_uids',
  years_of_experience: 'person_years_of_experience_ranges',
  education_degrees: 'person_education_degrees',
  education_schools: 'person_education_schools',
};

/**
 * Converts the MCP-friendly people search schema into Apollo API parameter names.
 */
export function buildPeopleSearchBody(parsed: {
  query?: string;
  filters?: PeopleSearchFilters;
  page?: number;
  per_page?: number;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (parsed.query) body.q_keywords = parsed.query;

  if (parsed.filters) {
    for (const [key, value] of Object.entries(parsed.filters)) {
      if (value === undefined) continue;
      body[PEOPLE_SEARCH_FILTER_MAP[key] ?? key] = value;
    }
  }

  if (parsed.page) body.page = parsed.page;
  if (parsed.per_page) body.per_page = parsed.per_page;

  return body;
}

/**
 * Splits a full name string and optional company into Apollo API fields.
 * Apollo expects first_name/last_name/organization_name, not name/company.
 */
export function buildPersonMatchBody(fields: { name?: string; company?: string }, rest: Record<string, any>): Record<string, any> {
  const body: Record<string, any> = { ...rest };
  if (fields.name) {
    const parts = fields.name.trim().split(/\s+/);
    body.first_name = parts[0];
    body.last_name = parts.slice(1).join(' ');
  }
  if (fields.company) {
    body.organization_name = fields.company;
  }
  return body;
}
