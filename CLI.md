# Apollo.io CLI Tool

A command-line interface for the Apollo.io API, allowing you to search for people, enrich contacts, find companies, and more directly from your terminal.

## Installation

### Global Installation (Recommended)

```bash
npm install -g @thevgergroup/apollo-io-mcp
```

After installation, the CLI will be available as `apollo-io-cli`:

```bash
apollo-io-cli --help
```

### Using with npx (No Installation)

```bash
npx @thevgergroup/apollo-io-mcp search-people --q "Software Engineer"
```

### Local Development

```bash
npm install
npm run build
node dist/cli.js --help
```

## Configuration

Set your Apollo.io API key as an environment variable:

```bash
export APOLLO_API_KEY=your_api_key_here
```

Or create a `.env` file:

```env
APOLLO_API_KEY=your_api_key_here
```

## Commands

### search-people

Search for people based on various criteria.

**Important:** The `--q` parameter must be used with at least one filter parameter (like `--person_titles`, `--person_locations`, etc.) for accurate results. Using `--q` alone will return default results from the database.

```bash
# Search with filters (RECOMMENDED)
apollo-io-cli search-people \
  --q "engineering" \
  --person_titles "CTO,VP Engineering"

# Search with multiple filters
apollo-io-cli search-people \
  --person_titles "CEO,CTO" \
  --person_locations "San Francisco,CA,USA" \
  --seniority "C-Level"

# Single values work too (automatically converted to arrays)
apollo-io-cli search-people --person_titles "CTO" --per_page 10

# Using JSON input
apollo-io-cli search-people --json '{
  "q": "Product Manager",
  "person_titles": ["VP Product", "Head of Product"],
  "page": 1,
  "per_page": 10
}'
```

**Available filter parameters:**
- `--person_titles` - Job titles (e.g., "CEO", "CTO,VP Engineering")
- `--person_locations` - Locations (e.g., "San Francisco,CA", "New York")
- `--seniority` - Seniority levels (e.g., "C-Level,VP")
- `--departments` - Departments (e.g., "Engineering,Sales")
- `--industries` - Industries (e.g., "Software,SaaS")
- `--technologies` - Technologies (e.g., "python,react")
- `--q_organization_domains` - Company domains (e.g., "google.com,microsoft.com")

### search-companies

Search for companies and organizations.

```bash
# Basic search
apollo-io-cli search-companies --q "technology startups"

# Search with employee count filter
apollo-io-cli search-companies \
  --organization_num_employees_ranges "51,200" \
  --organization_locations "San Francisco,CA,USA"

# Search by industry
apollo-io-cli search-companies \
  --q "fintech" \
  --organization_industry_tag_ids "5567cd4c7369644ec7060000"
```

### enrich-person

Enrich person data by email, LinkedIn URL, or name/company.

```bash
# Enrich by email
apollo-io-cli enrich-person --email "tim@apollo.io"

# Enrich by LinkedIn URL
apollo-io-cli enrich-person --linkedin_url "https://www.linkedin.com/in/tim-zheng"

# Enrich by name and company
apollo-io-cli enrich-person \
  --first_name "Tim" \
  --last_name "Zheng" \
  --organization_name "Apollo"

# Reveal personal emails and phone numbers (uses credits)
apollo-io-cli enrich-person \
  --email "tim@apollo.io" \
  --reveal_personal_emails true \
  --reveal_phone_number true
```

### enrich-company

Enrich company data by domain or name.

```bash
# Enrich by domain
apollo-io-cli enrich-company --domain "apollo.io"

# Enrich by company name
apollo-io-cli enrich-company --name "Apollo.io"
```

### bulk-enrich-people

Bulk enrich multiple people at once.

```bash
apollo-io-cli bulk-enrich-people --json '{
  "details": [
    {"email": "tim@apollo.io"},
    {"first_name": "Roy", "last_name": "Chung", "organization_name": "Apollo"}
  ]
}'
```

### bulk-enrich-companies

Bulk enrich multiple companies at once.

```bash
apollo-io-cli bulk-enrich-companies --json '{
  "domains": ["apollo.io", "salesforce.com", "hubspot.com"]
}'
```

### org-jobs

Get job postings for an organization.

```bash
# Get jobs by organization ID
apollo-io-cli org-jobs --id "5e66b6381e05b4008c8331b8"

# With pagination
apollo-io-cli org-jobs --id "5e66b6381e05b4008c8331b8" --page 1 --per_page 10
```

### org-info

Get complete organization information.

```bash
apollo-io-cli org-info --id "5e66b6381e05b4008c8331b8"
```

### search-news

Search for news articles.

```bash
# Search by keyword
apollo-io-cli search-news --q "funding" --page 1

# Search with filters
apollo-io-cli search-news \
  --q "Series A" \
  --news_event_types "funding" \
  --organization_ids "5e66b6381e05b4008c8331b8"
```

## Output

All commands output JSON to stdout. You can pipe the output to tools like `jq` for processing:

```bash
# Extract just the names
apollo-io-cli search-people --q "CEO" | jq '.people[].name'

# Count results
apollo-io-cli search-companies --q "tech" | jq '.pagination.total_entries'

# Format nicely
apollo-io-cli enrich-person --email "tim@apollo.io" | jq '.'
```

## Common Options

- `--page <number>` - Page number for pagination (default: 1)
- `--per_page <number>` - Results per page (default: varies by endpoint)
- `--json '<json>'` - Pass parameters as JSON object

## Examples

### Find CTOs at Series A startups

```bash
apollo-io-cli search-people \
  --person_titles "CTO,Chief Technology Officer" \
  --q "Series A"
```

### Export company list to CSV

```bash
apollo-io-cli search-companies --q "SaaS" | \
  jq -r '.organizations[] | [.name, .primary_domain, .estimated_num_employees] | @csv' > companies.csv
```

### Chain commands with jq

```bash
# Search for companies, then enrich the first one
DOMAIN=$(apollo-io-cli search-companies --q "Apollo" | jq -r '.organizations[0].primary_domain')
apollo-io-cli enrich-company --domain "$DOMAIN"
```

## Error Handling

The CLI will exit with code 1 on errors and print error messages to stderr:

```bash
apollo-io-cli enrich-person --email "invalid"
# Error: Apollo error 404: Person not found
```

## Rate Limiting

Apollo.io enforces rate limits. If you hit a rate limit, the CLI will display:

```
Error: Rate limited by Apollo (429). Retry after 60s.
```

## Troubleshooting

### "person_titles requires an array" Error

If you see this error, it means you're passing a single value where an array is expected. As of v2.0.1+, this is handled automatically:

```bash
# This now works automatically
apollo-io-cli search-people --person_titles "CTO"

# Comma-separated values also work
apollo-io-cli search-people --person_titles "CTO,VP Engineering"
```

### Search Returns Same Results Every Time

If you're using `--q` alone without any filter parameters, the Apollo API will ignore it and return default results. Always combine `--q` with at least one filter:

```bash
# ❌ Bad - returns default results
apollo-io-cli search-people --q "CEO"

# ✅ Good - returns filtered results
apollo-io-cli search-people --q "CEO" --person_titles "CEO"
apollo-io-cli search-people --person_titles "CEO" --person_locations "California"
```

### Array Fields Reference

The following fields are automatically converted to arrays (even for single values):

**People search:**
- `person_titles`, `seniority`, `departments`, `industries`
- `technologies`, `company_domains`, `person_locations`
- `contact_email_status`, `years_of_experience`
- `education_degrees`, `education_schools`

**Company search:**
- `organization_locations`, `organization_not_locations`
- `q_organization_keyword_tags`, `organization_num_employees_ranges`
- `currently_using_any_of_technology_uids`, `organization_ids`
- `q_organization_job_titles`

## Support

For issues and feature requests, please visit:
https://github.com/thevgergroup/apollo-io-mcp/issues

## License

MIT
