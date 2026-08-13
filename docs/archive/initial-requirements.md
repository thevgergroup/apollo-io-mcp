**Claude-Desktop-friendly MCP server** for Apollo.io from scratch. Below is a minimal but production-ready Node/TypeScript implementation that runs over **stdio**, exposes the core tools (search people/companies, enrich person/company), and reads your **APOLLO\_API\_KEY** from env.

---

# 1) Project scaffold

```
apollo-mcp/
├─ src/
│  ├─ apollo.ts
│  └─ server.ts
├─ package.json
├─ tsconfig.json
├─ .gitignore
├─ .env.example
```

## package.json

```json
{
  "name": "apollo-mcp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "apollo-mcp": "dist/server.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "prepare": "npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.2.0",
    "zod": "^3.23.8",
    "undici": "^6.19.8",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "tsx": "^4.19.1",
    "typescript": "^5.5.4"
  }
}
```

> Notes
>
> * `bin` makes it runnable via `npx github:you/apollo-mcp` later.
> * `prepare` builds automatically when installed from GitHub.

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

## .gitignore

```
node_modules
dist
.env
```

## .env.example

```
APOLLO_API_KEY=put-your-key-here
APOLLO_BASE_URL=https://api.apollo.io/v1
```

---

# 2) Apollo client (src/apollo.ts)

```ts
import { request } from "undici";

export type ApolloOptions = {
  apiKey: string;
  baseUrl?: string; // default https://api.apollo.io/v1
};

export class ApolloClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(opts: ApolloOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? "https://api.apollo.io/v1";
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (res.statusCode === 401) {
      throw new Error("Unauthorized: invalid or missing APOLLO_API_KEY");
    }
    if (res.statusCode === 429) {
      const retryAfter = res.headers["retry-after"];
      throw new Error(
        `Rate limited by Apollo (429).${retryAfter ? ` Retry after ${retryAfter}s.` : ""}`
      );
    }
    if (res.statusCode >= 400) {
      const text = await res.body.text();
      throw new Error(`Apollo error ${res.statusCode}: ${text}`);
    }

    return (await res.body.json()) as T;
  }

  // People search
  searchPeople(params: Record<string, unknown>) {
    return this.post("/people/search", params);
  }

  // Company search
  searchCompanies(params: Record<string, unknown>) {
    return this.post("/companies/search", params);
  }

  // Enrich person (match)
  matchPerson(params: Record<string, unknown>) {
    // Apollo supports various match inputs (email/linkedin/name+company, etc.)
    return this.post("/people/match", params);
  }

  // Enrich company (domain or name)
  matchCompany(params: Record<string, unknown>) {
    return this.post("/companies/match", params);
  }
}
```

---

# 3) MCP server (src/server.ts)

```ts
import "dotenv/config";
import { ApolloClient } from "./apollo.js";
import { z } from "zod";
import {
  Server,
  StdioServerTransport,
  Tool
} from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

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

// ----- Tool schemas -----
const PaginationSchema = z.object({
  page: z.number().int().min(1).optional(),
  per_page: z.number().int().min(1).max(200).optional(),
  // Apollo also uses 'page' & 'per_page'; some endpoints use 'offset'/'limit'
});

const SearchPeopleInput = z
  .object({
    query: z.string().optional(),      // generic query
    filters: z.record(z.any()).optional(), // pass-through Apollo filters
  })
  .merge(PaginationSchema);

const SearchCompaniesInput = z
  .object({
    query: z.string().optional(),
    filters: z.record(z.any()).optional()
  })
  .merge(PaginationSchema);

const EnrichPersonInput = z.object({
  email: z.string().email().optional(),
  linkedin_url: z.string().url().optional(),
  name: z.string().optional(),
  company: z.string().optional()
});

const EnrichCompanyInput = z.object({
  domain: z.string().optional(),
  name: z.string().optional()
});

// ----- Tools -----
const searchPeople: Tool = {
  name: "apollo.searchPeople",
  description:
    "Search for people in Apollo. Supports 'query', 'filters', pagination.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      filters: { type: "object", additionalProperties: true },
      page: { type: "number" },
      per_page: { type: "number" }
    }
  },
  async invoke({ arguments: args }) {
    const parsed = SearchPeopleInput.parse(args || {});
    const body: Record<string, unknown> = {};
    if (parsed.query) body.q = parsed.query;
    if (parsed.filters) Object.assign(body, parsed.filters);
    if (parsed.page) body.page = parsed.page;
    if (parsed.per_page) body.per_page = parsed.per_page;

    const json = await apollo.searchPeople(body);
    return {
      content: [{ type: "json", json }],
      isError: false
    };
  }
};

const searchCompanies: Tool = {
  name: "apollo.searchCompanies",
  description:
    "Search for companies in Apollo. Supports 'query', 'filters', pagination.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      filters: { type: "object", additionalProperties: true },
      page: { type: "number" },
      per_page: { type: "number" }
    }
  },
  async invoke({ arguments: args }) {
    const parsed = SearchCompaniesInput.parse(args || {});
    const body: Record<string, unknown> = {};
    if (parsed.query) body.q = parsed.query;
    if (parsed.filters) Object.assign(body, parsed.filters);
    if (parsed.page) body.page = parsed.page;
    if (parsed.per_page) body.per_page = parsed.per_page;

    const json = await apollo.searchCompanies(body);
    return {
      content: [{ type: "json", json }],
      isError: false
    };
  }
};

const enrichPerson: Tool = {
  name: "apollo.enrichPerson",
  description:
    "Enrich a person by email, linkedin_url, or name+company using Apollo match.",
  inputSchema: {
    type: "object",
    properties: {
      email: { type: "string" },
      linkedin_url: { type: "string" },
      name: { type: "string" },
      company: { type: "string" }
    }
  },
  async invoke({ arguments: args }) {
    const parsed = EnrichPersonInput.parse(args || {});
    const body: Record<string, unknown> = { ...parsed };
    const json = await apollo.matchPerson(body);
    return { content: [{ type: "json", json }], isError: false };
  }
};

const enrichCompany: Tool = {
  name: "apollo.enrichCompany",
  description:
    "Enrich a company by domain or name using Apollo match.",
  inputSchema: {
    type: "object",
    properties: {
      domain: { type: "string" },
      name: { type: "string" }
    }
  },
  async invoke({ arguments: args }) {
    const parsed = EnrichCompanyInput.parse(args || {});
    const body: Record<string, unknown> = { ...parsed };
    const json = await apollo.matchCompany(body);
    return { content: [{ type: "json", json }], isError: false };
  }
};

// ----- Server setup -----
const server = new Server(
  {
    name: "apollo-mcp",
    version: "0.1.0"
  },
  {
    capabilities: {
      // No resources/prompts; just tools
      tools: {}
    }
  }
);

// Register tools
server.tool(searchPeople);
server.tool(searchCompanies);
server.tool(enrichPerson);
server.tool(enrichCompany);

// Defensive parse on call_tool
server.router.callTool = async (req, ctx) => {
  CallToolRequestSchema.parse(req); // validate shape
  return server.defaultCallTool(req, ctx);
};

const transport = new StdioServerTransport();
await server.connect(transport);
```

---

# 4) Install & run locally

```bash
mkdir apollo-mcp && cd apollo-mcp
# paste the files above
npm i
cp .env.example .env
# set APOLLO_API_KEY in .env
npm run dev   # hot reload
# or
npm run build && npm start
```

If it starts clean, it will wait on stdio (no HTTP port), which is what Claude wants.

---

# 5) Claude Desktop MCP config

Add to your Claude Desktop config (usually `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "apollo": {
      "command": "node",
      "args": ["/absolute/path/to/apollo-mcp/dist/server.js"],
      "env": {
        "APOLLO_API_KEY": "YOUR_REAL_KEY"
      },
      "transport": { "type": "stdio" }
    }
  }
}
```

> Tip: you can also run via `npm start`:

```json
{
  "mcpServers": {
    "apollo": {
      "command": "npm",
      "args": ["start", "--prefix", "/absolute/path/to/apollo-mcp"],
      "env": { "APOLLO_API_KEY": "YOUR_REAL_KEY" },
      "transport": { "type": "stdio" }
    }
  }
}
```

---

# 6) (Optional) Make it npx-able from GitHub

When you push this repo to GitHub, the `bin` + `prepare` already allow:

```bash
npx -y github:yourname/apollo-mcp --stdio
```

And your Claude config simplifies to:

```json
{
  "mcpServers": {
    "apollo": {
      "command": "npx",
      "args": ["-y", "github:yourname/apollo-mcp", "--", "--stdio"],
      "env": { "APOLLO_API_KEY": "YOUR_REAL_KEY" }
    }
  }
}
```

---

# 7) Practical Apollo usage patterns

* **People search**: pass a `query` and/or structured `filters` (Apollo supports rich filters like `title`, `seniority`, `location`, `company_domains`, etc.).
* **Companies search**: `query` + filters like `industry`, `employee_count`, `founded_year`, `funding`.
* **Enrichment**:

  * Person: prefer `email` or `linkedin_url` for highest match confidence; fall back to `name` + `company`.
  * Company: prefer `domain`; fall back to `name`.
* **Pagination**: supply `page` and `per_page` to tools; pipe successive calls from Claude when you ask for “next page”.

---

# 8) Hardening ideas (easy to add later)

* **Zod-validated output shaping** for consistent Claude rendering (map Apollo’s fields to a compact schema with only what you need).
* **Credit safety**: basic in-memory cache (keyed by request hash) to prevent duplicate enrich calls in the same session.
* **Backoff** on 429 with `Retry-After`.
* **Allow-list** of filters, to avoid unexpected large queries.

---

