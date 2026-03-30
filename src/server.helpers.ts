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
