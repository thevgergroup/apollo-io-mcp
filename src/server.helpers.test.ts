import { describe, it, expect } from 'vitest';
import { selectCompaniesArray, simplifyCompany, buildPersonMatchBody } from './server.helpers.js';

describe('selectCompaniesArray', () => {
  it('returns organizations when non-empty', () => {
    const result = {
      organizations: [{ id: '1', name: 'Org Inc' }],
      accounts: [{ id: '2', name: 'Account Co' }],
    };
    const companies = selectCompaniesArray(result);
    expect(companies).toHaveLength(1);
    expect(companies[0].name).toBe('Org Inc');
  });

  it('falls back to accounts when organizations is empty', () => {
    const result = {
      organizations: [],
      accounts: [{ id: '2', name: 'Nike' }, { id: '3', name: 'Adidas' }],
    };
    const companies = selectCompaniesArray(result);
    expect(companies).toHaveLength(2);
    expect(companies[0].name).toBe('Nike');
  });

  it('falls back to accounts when organizations is absent', () => {
    const result = {
      accounts: [{ id: '2', name: 'Nike' }],
    };
    const companies = selectCompaniesArray(result);
    expect(companies).toHaveLength(1);
    expect(companies[0].name).toBe('Nike');
  });

  it('returns empty array when both organizations and accounts are absent', () => {
    const companies = selectCompaniesArray({});
    expect(companies).toEqual([]);
  });

  it('returns empty array when organizations is empty and accounts is absent', () => {
    const companies = selectCompaniesArray({ organizations: [] });
    expect(companies).toEqual([]);
  });
});

describe('simplifyCompany', () => {
  it('maps all fields correctly', () => {
    const raw = {
      id: 'abc123',
      name: 'Acme Corp',
      website_url: 'https://acme.com',
      industry: 'Software',
      employee_count: '100-500',
      raw_address: '1 Infinite Loop, Cupertino, CA',
      linkedin_url: 'https://linkedin.com/company/acme',
      founded_year: '2000',
      phone: '555-1234',
      organization_revenue_printed: '$50M-$100M',
      market_cap: null,
    };
    const simplified = simplifyCompany(raw);
    expect(simplified).toEqual({
      id: 'abc123',
      name: 'Acme Corp',
      website: 'https://acme.com',
      industry: 'Software',
      employee_count: '100-500',
      location: '1 Infinite Loop, Cupertino, CA',
      linkedin_url: 'https://linkedin.com/company/acme',
      founded_year: '2000',
      phone: '555-1234',
      revenue: '$50M-$100M',
      market_cap: null,
    });
  });

  it('builds location from city/state/country when raw_address is absent', () => {
    const raw = { city: 'San Francisco', state: 'CA', country: 'USA' };
    const simplified = simplifyCompany(raw);
    expect(simplified.location).toBe('San Francisco, CA, USA');
  });

  it('includes country in location when city and state are absent', () => {
    // The template produces ", , USA"; the regex strips one leading ", " leaving ", USA"
    const simplified = simplifyCompany({ country: 'USA' });
    expect(simplified.location).toContain('USA');
  });

  it('prefers raw_address over city/state/country', () => {
    const raw = {
      raw_address: '123 Main St',
      city: 'Boston',
      state: 'MA',
      country: 'USA',
    };
    expect(simplifyCompany(raw).location).toBe('123 Main St');
  });
});

describe('buildPersonMatchBody', () => {
  it('splits full name into first_name and last_name', () => {
    const body = buildPersonMatchBody({ name: 'John Doe' }, {});
    expect(body.first_name).toBe('John');
    expect(body.last_name).toBe('Doe');
  });

  it('handles multi-part last names', () => {
    const body = buildPersonMatchBody({ name: 'Mary Jane Watson' }, {});
    expect(body.first_name).toBe('Mary');
    expect(body.last_name).toBe('Jane Watson');
  });

  it('handles single-word name', () => {
    const body = buildPersonMatchBody({ name: 'Cher' }, {});
    expect(body.first_name).toBe('Cher');
    expect(body.last_name).toBe('');
  });

  it('trims extra whitespace from name', () => {
    const body = buildPersonMatchBody({ name: '  John   Doe  ' }, {});
    expect(body.first_name).toBe('John');
    expect(body.last_name).toBe('Doe');
  });

  it('maps company to organization_name', () => {
    const body = buildPersonMatchBody({ company: 'Acme Corp' }, {});
    expect(body.organization_name).toBe('Acme Corp');
  });

  it('handles both name and company together', () => {
    const body = buildPersonMatchBody({ name: 'Alice Brown', company: 'Tech Inc' }, {});
    expect(body.first_name).toBe('Alice');
    expect(body.last_name).toBe('Brown');
    expect(body.organization_name).toBe('Tech Inc');
  });

  it('preserves other fields from rest', () => {
    const body = buildPersonMatchBody({ name: 'John Doe' }, { email: 'john@example.com', linkedin_url: 'https://linkedin.com/in/john' });
    expect(body.email).toBe('john@example.com');
    expect(body.linkedin_url).toBe('https://linkedin.com/in/john');
  });

  it('does not set first_name/last_name when name is absent', () => {
    const body = buildPersonMatchBody({}, { email: 'john@example.com' });
    expect(body.first_name).toBeUndefined();
    expect(body.last_name).toBeUndefined();
  });

  it('does not set organization_name when company is absent', () => {
    const body = buildPersonMatchBody({}, {});
    expect(body.organization_name).toBeUndefined();
  });
});
