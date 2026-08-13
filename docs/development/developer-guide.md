# Developer Guide

This guide keeps the implementation details out of the main README. Start here when you want to run from source, inspect the MCP server, add tools, or prepare a release.

## Source Setup

```bash
git clone https://github.com/thevgergroup/apollo-io-mcp
cd apollo-io-mcp
npm install
cp env.example .env
```

Set your Apollo credentials:

```env
APOLLO_API_KEY=your-actual-api-key-here
APOLLO_BASE_URL=https://api.apollo.io/api/v1
```

Build and run:

```bash
npm run build
npm start
```

## Manual Claude Desktop Config

Use this only for source development. Most users should install the `.mcpb` bundle or run `npx @thevgergroup/apollo-io-mcp@latest setup`.

```json
{
  "mcpServers": {
    "apollo": {
      "command": "node",
      "args": ["/path/to/apollo-io-mcp/dist/server.js"],
      "env": {
        "APOLLO_API_KEY": "your-actual-api-key-here",
        "APOLLO_BASE_URL": "https://api.apollo.io/api/v1"
      }
    }
  }
}
```

## Available MCP Tools

### `apollo_search_people`

Search for net-new prospects in Apollo's people database. Use this for prospecting by job title, seniority, location, company, industry, and technology.

The MCP tool accepts friendly filter names and translates them to Apollo People API fields. For example, `query` becomes `q_keywords`, `titles` becomes `person_titles`, and `locations` becomes `person_locations`.

```json
{
  "query": "revenue operations",
  "filters": {
    "titles": ["VP Revenue Operations", "Head of Revenue Operations"],
    "locations": ["United States"],
    "company_domains": ["apollo.io"],
    "technologies": ["salesforce"]
  },
  "per_page": 10
}
```

Prompt example:

> Find 10 VP Revenue Operations leaders in the United States at companies using Salesforce.

### `apollo_search_companies`

Search for companies and organizations with filters for geography, industry, employee count, technology, revenue, funding, and job postings.

```json
{
  "query": "education technology",
  "filters": {
    "organization_locations": ["Virginia", "Maryland", "Washington DC"],
    "q_organization_keyword_tags": ["edtech", "online learning", "education technology"],
    "organization_num_employees_ranges": ["11,20", "21,50", "51,100"]
  },
  "per_page": 25
}
```

### Enrichment and Additional Tools

- `apollo_enrich_person`: enrich a specific person using email, LinkedIn URL, or name plus company.
- `apollo_enrich_company`: enrich a company using domain or name.
- `apollo_bulk_enrich_people`: enrich multiple people profiles.
- `apollo_bulk_enrich_organizations`: enrich multiple organization profiles.
- `apollo_get_organization_job_postings`: get job postings for a specific organization.
- `apollo_get_complete_organization_info`: get complete information for a specific organization.
- `apollo_search_news_articles`: search news related to companies.

## Filter Reference

### People Search Filters

| Filter | Type | Description | Example |
| --- | --- | --- | --- |
| `locations` | array | Person locations | `["California", "New York"]` |
| `seniority` | array | Seniority levels | `["vp", "director"]` |
| `titles` | array | Job titles | `["CEO", "CTO"]` |
| `departments` | array | Departments | `["Engineering", "Sales"]` |
| `company_domains` | array | Current or previous employer domains | `["apollo.io"]` |
| `company_names` | array | Company names | `["Apollo.io"]` |
| `industries` | array | Organization industries | `["Software"]` |
| `technologies` | array | Technologies used by employer | `["salesforce"]` |
| `years_of_experience` | array | Experience ranges | `["10,20"]` |
| `education_degrees` | array | Education degrees | `["MBA"]` |
| `education_schools` | array | Education institutions | `["Stanford University"]` |

### Company Search Filters

| Filter | Type | Description | Example |
| --- | --- | --- | --- |
| `organization_num_employees_ranges` | array | Employee count ranges | `["11,20", "21,50"]` |
| `organization_locations` | array | Company locations | `["Virginia", "Maryland"]` |
| `organization_not_locations` | array | Exclude locations | `["California"]` |
| `q_organization_keyword_tags` | array | Industry keywords | `["edtech", "saas"]` |
| `q_organization_name` | string | Company name filter | `"Google"` |
| `currently_using_any_of_technology_uids` | array | Technologies used | `["salesforce", "aws"]` |
| `revenue_range` | object | Revenue range | `{"min": 1000000, "max": 10000000}` |
| `latest_funding_amount_range` | object | Latest funding range | `{"min": 5000000, "max": 50000000}` |
| `total_funding_range` | object | Total funding range | `{"min": 10000000, "max": 100000000}` |

## Filter Best Practices

- Start with location filters because they are usually the most effective way to narrow results.
- Use specific keywords instead of broad terms.
- Add filters incrementally when debugging empty results.
- Use comma-separated employee ranges like `"11,20"`, not `"11-20"`.
- Treat employee count as restrictive; remove it first when company searches return zero results.
- Use people search for prospect lists and enrichment for specific known contacts.

## Response Format

Search responses are intentionally simplified for MCP clients. People and company searches return the fields users usually need first, such as name, title, company, location, LinkedIn URL, website, industry, employee count, and pagination metadata.

Enrichment and additional tools return Apollo response data as formatted JSON.

## Testing

Run the standard suite:

```bash
npm test
```

Run live Apollo integration tests:

```bash
APOLLO_API_KEY="your-actual-api-key-here" npm run test:integration
```

Run coverage:

```bash
npm run test:coverage
```

For more detail, see [testing.md](testing.md).

## MCP Inspector

Set up the inspector:

```bash
npm install
npm run setup:inspector
```

Run UI mode:

```bash
npm run inspector
```

Run CLI mode:

```bash
npm run inspector:cli -- --method tools/list

npm run inspector:cli -- --method tools/call \
  --tool-name apollo_search_companies \
  --tool-arg query='education technology' \
  --tool-arg per_page=5
```

## Local Installer Harness

Test setup, doctor, and remove without touching your real Claude Desktop config:

```bash
npm run build
tmpdir=$(mktemp -d)
node dist/cli.js setup --api-key test-key --config "$tmpdir/claude_desktop_config.json"
node dist/cli.js doctor --config "$tmpdir/claude_desktop_config.json"
node dist/cli.js remove --config "$tmpdir/claude_desktop_config.json"
cat "$tmpdir/claude_desktop_config.json"
```

Installer tests also run in `npm test`.

## Skills Output

The `skills` command prints a compact, user-focused guide that agents can read before recommending install paths or tools:

```bash
npx @thevgergroup/apollo-io-mcp@latest skills
npx @thevgergroup/apollo-io-mcp@latest skills --format json
```

Keep this output aligned with README onboarding and `llms.txt`.

## Release Checks

Before release:

```bash
npm test
npm run build:mcpb
npm run check:release
npm audit --omit=dev --audit-level=moderate
```

`npm run check:release` verifies package metadata and generated MCPB metadata. On tagged GitHub releases, it also verifies that the Git tag matches the package version and that the npm version has not already been published.

`npm run build:mcpb` compiles the server, creates `.mcpb-build/apollo-io-mcp/manifest.json`, validates it with `@anthropic-ai/mcpb`, and writes `release/apollo-io-mcp-v<version>.mcpb`.

See [../../RELEASING.md](../../RELEASING.md) for full release instructions.
