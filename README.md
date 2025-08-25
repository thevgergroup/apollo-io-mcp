# Apollo.io MCP Server

A Model Context Protocol (MCP) server for Apollo.io that provides comprehensive tools for searching people, companies, and enriching contact data.

## ✅ Status: Production Ready

This MCP server has been tested and is working correctly with Claude Desktop. All tests pass and the MCP protocol is fully implemented. Now includes **9 powerful tools** covering all major Apollo.io API endpoints.

## Features

- **People Search & Enrichment**: Search and enrich people with advanced filters
- **Company/Organization Search & Enrichment**: Search and enrich companies with industry filters
- **Bulk Operations**: Bulk enrich multiple people and organizations
- **Organization Details**: Get complete organization info and job postings
- **News Articles**: Search for news articles related to companies
- **Error Handling**: Comprehensive error handling with rate limiting support
- **Type Safety**: Full TypeScript support with Zod validation
- **MCP Protocol**: Full JSON-RPC 2.0 implementation over stdio

## Installation

### Prerequisites

- Node.js 18+ 
- Apollo.io API key

### Setup

1. Clone this repository:
```bash
git clone <repository-url>
cd apollo-io-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment example and add your API key:
```bash
cp env.example .env
```

4. Edit `.env` and add your Apollo.io API key:
```bash
APOLLO_API_KEY=your-actual-api-key-here
APOLLO_BASE_URL=https://api.apollo.io/v1
```

## Usage

### Development

Run in development mode with hot reload:
```bash
npm run dev
```

### Production

Build and run:
```bash
npm run build
npm start
```

### Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Test MCP protocol:
```bash
node test-mcp.js
```

## Claude Desktop Configuration

Add this to your Claude Desktop config (usually `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "apollo": {
      "command": "node",
      "args": ["/Users/patrick/Projects/thevgergroup/apollo-io-mcp/dist/server.js"],
      "env": {
        "APOLLO_API_KEY": "YOUR_REAL_KEY"
      },
      "transport": { "type": "stdio" }
    }
  }
}
```

### Alternative: Using npm start

```json
{
  "mcpServers": {
    "apollo": {
      "command": "npm",
      "args": ["start", "--prefix", "/Users/patrick/Projects/thevgergroup/apollo-io-mcp"],
      "env": { "APOLLO_API_KEY": "YOUR_REAL_KEY" },
      "transport": { "type": "stdio" }
    }
  }
}
```

## Available Tools

### 🔍 Search Tools

#### 1. apollo.searchPeople

Search for people in Apollo with various filters.

**Parameters:**
- `query` (string, optional): Generic search query
- `filters` (object, optional): Apollo filters (title, seniority, location, company_domains, etc.)
- `page` (number, optional): Page number (default: 1)
- `per_page` (number, optional): Results per page (1-200, default: 25)

**Example:**
```json
{
  "query": "CEO",
  "filters": {
    "company_domains": ["example.com"],
    "seniority": ["C-Level"]
  },
  "page": 1,
  "per_page": 10
}
```

#### 2. apollo.searchCompanies

Search for companies/organizations in Apollo.

**Parameters:**
- `query` (string, optional): Generic search query
- `filters` (object, optional): Apollo filters (industry, employee_count, founded_year, funding, etc.)
- `page` (number, optional): Page number
- `per_page` (number, optional): Results per page

**Example:**
```json
{
  "query": "SaaS",
  "filters": {
    "industry": ["Software"],
    "employee_count": ["11-50", "51-200"]
  }
}
```

#### 3. apollo.searchNewsArticles

Search for news articles related to companies in Apollo.

**Parameters:**
- `query` (string, optional): Generic search query
- `filters` (object, optional): Apollo filters for news articles
- `page` (number, optional): Page number
- `per_page` (number, optional): Results per page

**Example:**
```json
{
  "query": "funding round",
  "filters": {
    "company_domains": ["example.com"]
  }
}
```

### 🎯 Enrichment Tools

#### 4. apollo.enrichPerson

Enrich person data using various identifiers.

**Parameters:**
- `email` (string, optional): Person's email address
- `linkedin_url` (string, optional): LinkedIn profile URL
- `name` (string, optional): Person's name
- `company` (string, optional): Company name (use with name)

**Example:**
```json
{
  "email": "john.doe@example.com"
}
```

#### 5. apollo.enrichCompany

Enrich company/organization data using domain or name.

**Parameters:**
- `domain` (string, optional): Company domain
- `name` (string, optional): Company name

**Example:**
```json
{
  "domain": "example.com"
}
```

### 📦 Bulk Operations

#### 6. apollo.bulkEnrichPeople

Bulk enrich multiple people using Apollo match.

**Parameters:**
- `people` (array): Array of people objects with email, linkedin_url, name, or company

**Example:**
```json
{
  "people": [
    { "email": "john@example.com" },
    { "name": "Jane Doe", "company": "Example Corp" },
    { "linkedin_url": "https://linkedin.com/in/johndoe" }
  ]
}
```

#### 7. apollo.bulkEnrichOrganizations

Bulk enrich multiple organizations using Apollo match.

**Parameters:**
- `organizations` (array): Array of organization objects with domain or name

**Example:**
```json
{
  "organizations": [
    { "domain": "example.com" },
    { "name": "Example Corp" }
  ]
}
```

### 🏢 Organization Details

#### 8. apollo.getOrganizationJobPostings

Get job postings for a specific organization by organization ID.

**Parameters:**
- `organization_id` (string, required): The Apollo organization ID

**Example:**
```json
{
  "organization_id": "org_123456"
}
```

#### 9. apollo.getCompleteOrganizationInfo

Get complete information for a specific organization by organization ID.

**Parameters:**
- `organization_id` (string, required): The Apollo organization ID

**Example:**
```json
{
  "organization_id": "org_123456"
}
```

## Error Handling

The server handles various error scenarios:

- **401 Unauthorized**: Invalid or missing API key
- **429 Rate Limited**: Rate limiting with retry-after information
- **4xx/5xx Errors**: Generic error handling with status codes
- **Network Errors**: Connection and timeout handling
- **Input Validation**: Zod validation for all parameters

## MCP Protocol Support

This server implements the full MCP protocol:

- ✅ `initialize` - Server initialization
- ✅ `tools/list` - List available tools (9 tools)
- ✅ `tools/call` - Execute tool calls
- ✅ `resources/list` - List resources (empty)
- ✅ `prompts/list` - List prompts (empty)
- ✅ `notifications/initialized` - Handle initialization notification

## API Reference

For detailed Apollo.io API documentation, visit: 
- [Apollo.io API Documentation](https://docs.apollo.io/reference/how-to-test-api-endpoints)
- [News Articles Search](https://docs.apollo.io/reference/news-articles-search)

## Development

### Project Structure

```
apollo-io-mcp/
├── src/
│   ├── apollo.ts      # Apollo API client with all endpoints
│   ├── server.ts      # MCP server implementation
│   ├── apollo.test.ts # Apollo client tests
│   └── server.test.ts # Server tests
├── docs/
│   └── requirements.md # Project requirements
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── env.example
├── setup.sh           # Setup script
├── test-project.js    # Project verification
└── test-mcp.js        # MCP protocol test
```

### Building

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Testing

The project includes comprehensive tests:

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test API interactions with mocked responses
- **Error Handling Tests**: Test various error scenarios
- **MCP Protocol Tests**: Test the MCP protocol implementation

Run tests with coverage:
```bash
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the [Apollo.io API documentation](https://docs.apollo.io/reference/how-to-test-api-endpoints)
2. Review the test files for usage examples
3. Open an issue in this repository
