# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for Apollo.io API integration. It provides Claude Desktop with access to Apollo's B2B database for people and company search, enrichment, and insights.

**Key Technology Stack:**
- TypeScript with ES2022 modules
- MCP SDK (`@modelcontextprotocol/sdk`)
- Zod for schema validation
- Undici for HTTP requests
- Vitest for testing

## Common Commands

### Development
```bash
npm run dev              # Watch mode with tsx
npm run build            # Compile TypeScript (also runs post-build.js)
npm start                # Run compiled server
```

### Testing
```bash
npm test                 # Run all tests with vitest
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### MCP Inspector (Testing Tools)
```bash
npm run inspector        # Launch MCP Inspector web UI
npm run inspector:cli    # Use MCP Inspector in CLI mode
```

### Release Management
```bash
npm run release:patch    # Bump patch version
npm run release:minor    # Bump minor version
npm run release:major    # Bump major version
```

## Architecture

### Core Structure

**Two main files:**
- `src/apollo.ts` - ApolloClient class that wraps Apollo.io API
- `src/server.ts` - MCP server setup with tool registrations

**ApolloClient Design:**
- Constructor takes `apiKey` and optional `baseUrl`
- Private `post()` and `get()` methods handle all HTTP communication
- Error handling for 401 (unauthorized), 429 (rate limit), and other HTTP errors
- All API methods return typed promises using generics

**MCP Server Design:**
- Uses `McpServer` from SDK with stdio transport
- Nine registered tools covering Apollo.io API endpoints:
  - `apollo_search_people` - People search with advanced filters
  - `apollo_search_companies` - Company/org search with advanced filters
  - `apollo_enrich_person` - Single person enrichment
  - `apollo_enrich_company` - Single company enrichment
  - `apollo_bulk_enrich_people` - Bulk people enrichment
  - `apollo_bulk_enrich_organizations` - Bulk org enrichment
  - `apollo_get_organization_job_postings` - Job postings by org ID
  - `apollo_get_complete_organization_info` - Full org info by ID
  - `apollo_search_news_articles` - News article search

### Input Validation Pattern

All tools use Zod schemas defined at the top of `server.ts`:
- `SearchPeopleInput` - Merged with `PaginationSchema`
- `SearchCompaniesInput` - Merged with `PaginationSchema`
- `EnrichPersonInput`
- `EnrichCompanyInput`
- `BulkEnrichPeopleInput`
- `BulkEnrichOrganizationsInput`
- `NewsArticlesSearchInput`

Each tool handler:
1. Parses input with Zod schema
2. Transforms to Apollo API format
3. Calls ApolloClient method
4. Returns MCP response format with content array
5. Catches errors and returns error response

### Response Simplification

Search tools (`apollo_search_people`, `apollo_search_companies`) simplify API responses:
- Extract only essential fields from full API response
- Reduce response size by up to 94% for Claude Desktop compatibility
- Return summary object with pagination info and simplified results array

### Filter Handling

Company search has complex filter mapping (lines 263-348):
- Employee ranges: converts dash format "11-20" to comma format "11,20"
- Location filters: `organization_locations`, `organization_not_locations`
- Revenue/funding ranges: nested `min`/`max` objects
- Technologies, keywords, job filters: arrays or strings as appropriate

## Environment Configuration

Required environment variables:
- `APOLLO_API_KEY` - Apollo.io API key (required, exits if missing)
- `APOLLO_BASE_URL` - Optional, defaults to `https://api.apollo.io/api/v1`

Load from `.env` file via `dotenv/config` import (line 1 of server.ts).

## Testing Approach

Tests are in `*.test.ts` files using Vitest:
- `src/apollo.test.ts` - Tests for ApolloClient
- `src/server.test.ts` - Tests for MCP server

Coverage configured in `vitest.config.ts`:
- Provider: v8
- Excludes: node_modules, dist, coverage, .d.ts files, test files

## Build Process

1. TypeScript compiles `src/` to `dist/`
2. `scripts/post-build.js` runs after compilation
3. Output: ES modules in `dist/` directory
4. Entry point: `dist/server.js` (defined in package.json bin)

## Important Patterns

**Error Handling:**
- Always wrap tool handlers in try/catch
- Return `isError: true` in MCP response on failure
- Include descriptive error messages from caught errors

**API Method Naming:**
- Search methods: `search{Entity}`
- Enrichment: `match{Entity}` for single, `bulkEnrich{Entity}` for bulk
- Get methods: `get{Resource}`

**Query Parameter Handling:**
- Person enrichment includes `reveal_personal_emails=false` and `reveal_phone_number=false`
- Bulk enrichment uses same query params via URLSearchParams

**MCP Tool Registration:**
- Use descriptive titles and descriptions
- Define inputSchema with Zod schemas
- Include descriptions for all filter fields to guide Claude
