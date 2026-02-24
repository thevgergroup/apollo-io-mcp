#!/usr/bin/env node
import 'dotenv/config';
import { ApolloClient } from './apollo.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');
const VERSION = packageJson.version;

const COMMANDS = {
  'search-people': 'Search for people',
  'search-companies': 'Search for companies',
  'enrich-person': 'Enrich person data by email/LinkedIn',
  'enrich-company': 'Enrich company data by domain',
  'bulk-enrich-people': 'Bulk enrich multiple people',
  'bulk-enrich-companies': 'Bulk enrich multiple companies',
  'org-jobs': 'Get job postings for an organization',
  'org-info': 'Get complete organization information',
  'search-news': 'Search for news articles'
} as const;

type CommandName = keyof typeof COMMANDS;

function printUsage() {
  console.log(`
Apollo.io CLI Tool v${VERSION}

Usage: apollo-io-cli <command> [options]

Commands:
  search-people           Search for people
  search-companies        Search for companies
  enrich-person           Enrich person data by email/LinkedIn
  enrich-company          Enrich company data by domain
  bulk-enrich-people      Bulk enrich multiple people
  bulk-enrich-companies   Bulk enrich multiple companies
  org-jobs                Get job postings for an organization
  org-info                Get complete organization information
  search-news             Search for news articles

Environment Variables:
  APOLLO_API_KEY          Your Apollo.io API key (required)

Examples:
  # Search for people
  apollo-io-cli search-people --q "Software Engineer" --person_titles "CEO" --page 1

  # Enrich person by email
  apollo-io-cli enrich-person --email "tim@apollo.io"

  # Search companies
  apollo-io-cli search-companies --q "technology" --organization_num_employees_ranges "11,20"

  # Get organization jobs
  apollo-io-cli org-jobs --id "5f5e2b4b4f3f3d0001234567"

Options are passed as --key value or --key=value
For arrays, use comma-separated values: --titles "CEO,CTO,VP"
For JSON input, use --json '{"key": "value"}'

For command-specific help: apollo-io-cli <command> --help
`);
}

function printCommandHelp(command: CommandName) {
  switch (command) {
    case 'search-people':
      console.log(`
apollo-io-cli search-people [options]

Search for people in Apollo's database with advanced filtering.

IMPORTANT: The --q parameter must be used with at least one filter for accurate results.

Common Filter Options:
  --person_titles <titles>         Job titles (e.g., "CTO" or "CEO,CTO,VP Engineering")
  --person_locations <locations>   Locations (e.g., "San Francisco,CA" or "New York")
  --seniority <levels>            Seniority levels (e.g., "C-Level,VP,Director")
  --departments <depts>           Departments (e.g., "Engineering,Sales,Marketing")
  --industries <industries>       Industries (e.g., "Software,SaaS,Healthcare")
  --technologies <tech>           Technologies (e.g., "python,react,salesforce")
  --company_domains <domains>     Company domains (e.g., "google.com,microsoft.com")
  --q <query>                     Search query (combine with filters above)

Pagination:
  --page <number>                 Page number (default: 1)
  --per_page <number>             Results per page (default: 25, max: 100)

Examples:
  # Search for CTOs in engineering
  apollo-io-cli search-people --person_titles "CTO" --q "engineering"

  # Search for executives in San Francisco
  apollo-io-cli search-people --seniority "C-Level,VP" --person_locations "San Francisco,CA"

  # Search for people at specific companies
  apollo-io-cli search-people --company_domains "google.com,apple.com" --departments "Engineering"

All filter values are automatically converted to arrays (commas optional for single values).
`);
      break;

    case 'search-companies':
      console.log(`
apollo-io-cli search-companies [options]

Search for companies/organizations in Apollo's database.

Common Filter Options:
  --organization_locations <loc>           Company locations (e.g., "California,New York")
  --organization_not_locations <loc>       Exclude locations
  --q_organization_keyword_tags <tags>     Industry keywords (e.g., "edtech,saas,fintech")
  --organization_num_employees_ranges <r>  Employee ranges (e.g., "11,20" or "51,200,201,500")
  --currently_using_any_of_technology_uids Technologies used
  --q <query>                              Search query

Pagination:
  --page <number>                          Page number (default: 1)
  --per_page <number>                      Results per page (default: 25)

Employee Range Format:
  Use comma-separated min,max pairs: "11,20" means 11-20 employees
  Multiple ranges: "11,20,21,50,51,100" searches three ranges

Examples:
  # Search for tech companies in California
  apollo-io-cli search-companies --q_organization_keyword_tags "technology,saas" \\
    --organization_locations "California"

  # Search by employee count
  apollo-io-cli search-companies --organization_num_employees_ranges "51,200" \\
    --organization_locations "San Francisco,CA"

  # Search with keyword
  apollo-io-cli search-companies --q "education technology" \\
    --q_organization_keyword_tags "edtech"
`);
      break;

    case 'enrich-person':
      console.log(`
apollo-io-cli enrich-person [options]

Enrich person data by email, LinkedIn URL, or name/company.

Required (one of):
  --email <email>              Person's email address
  --linkedin_url <url>         LinkedIn profile URL
  --first_name <name>          First name (requires --last_name and --organization_name)
  --last_name <name>           Last name (requires --first_name)
  --organization_name <name>   Company name (for name-based matching)

Optional:
  --reveal_personal_emails <bool>  Reveal personal emails (uses credits)
  --reveal_phone_number <bool>     Reveal phone number (uses credits)

Examples:
  # Enrich by email
  apollo-io-cli enrich-person --email "tim@apollo.io"

  # Enrich by LinkedIn
  apollo-io-cli enrich-person --linkedin_url "https://www.linkedin.com/in/tim-zheng"

  # Enrich by name and company
  apollo-io-cli enrich-person --first_name "Tim" --last_name "Zheng" \\
    --organization_name "Apollo"

  # With personal contact reveal (uses credits)
  apollo-io-cli enrich-person --email "tim@apollo.io" \\
    --reveal_personal_emails true --reveal_phone_number true
`);
      break;

    case 'enrich-company':
      console.log(`
apollo-io-cli enrich-company [options]

Enrich company data by domain or name.

Required (one of):
  --domain <domain>    Company domain (e.g., "apollo.io")
  --name <name>        Company name (e.g., "Apollo.io")

Examples:
  # Enrich by domain
  apollo-io-cli enrich-company --domain "apollo.io"

  # Enrich by name
  apollo-io-cli enrich-company --name "Apollo.io"
`);
      break;

    case 'org-jobs':
      console.log(`
apollo-io-cli org-jobs --id <organization_id> [options]

Get job postings for a specific organization.

Required:
  --id <id>           Apollo organization ID

Optional:
  --page <number>     Page number (default: 1)
  --per_page <number> Results per page (default: 10)

Example:
  apollo-io-cli org-jobs --id "5e66b6381e05b4008c8331b8" --per_page 20
`);
      break;

    case 'org-info':
      console.log(`
apollo-io-cli org-info --id <organization_id>

Get complete information for a specific organization.

Required:
  --id <id>    Apollo organization ID

Example:
  apollo-io-cli org-info --id "5e66b6381e05b4008c8331b8"
`);
      break;

    case 'bulk-enrich-people':
      console.log(`
apollo-io-cli bulk-enrich-people --json <json_data>

Bulk enrich multiple people at once.

Required:
  --json <json>    JSON object with "details" array

JSON Format:
  {
    "details": [
      {"email": "person1@example.com"},
      {"first_name": "John", "last_name": "Doe", "organization_name": "Company"}
    ]
  }

Example:
  apollo-io-cli bulk-enrich-people --json '{
    "details": [
      {"email": "tim@apollo.io"},
      {"first_name": "Roy", "last_name": "Chung", "organization_name": "Apollo"}
    ]
  }'
`);
      break;

    case 'bulk-enrich-companies':
      console.log(`
apollo-io-cli bulk-enrich-companies --json <json_data>

Bulk enrich multiple companies at once.

Required:
  --json <json>    JSON object with "domains" array

JSON Format:
  {
    "domains": ["company1.com", "company2.com", "company3.com"]
  }

Example:
  apollo-io-cli bulk-enrich-companies --json '{
    "domains": ["apollo.io", "salesforce.com", "hubspot.com"]
  }'
`);
      break;

    case 'search-news':
      console.log(`
apollo-io-cli search-news [options]

Search for news articles.

Options:
  --q <query>                  Search query
  --news_event_types <types>   Event types (e.g., "funding,acquisition")
  --organization_ids <ids>     Organization IDs
  --page <number>              Page number (default: 1)
  --per_page <number>          Results per page (default: 10)

Example:
  apollo-io-cli search-news --q "Series A" --news_event_types "funding"
`);
      break;

    default:
      printUsage();
  }
}

// Fields that must always be arrays per Apollo API requirements
const ARRAY_FIELDS = new Set([
  // People search array fields
  'person_titles', 'seniority', 'departments', 'industries',
  'technologies', 'company_domains', 'person_locations',
  'contact_email_status', 'years_of_experience',
  'education_degrees', 'education_schools',

  // Company search array fields
  'organization_locations', 'organization_not_locations',
  'q_organization_keyword_tags', 'organization_num_employees_ranges',
  'currently_using_any_of_technology_uids', 'organization_ids',
  'q_organization_job_titles',

  // Common array fields
  'locations'
]);

function parseArgs(args: string[]): { command?: CommandName; params: Record<string, any> } {
  // Handle --version or -v
  if (args.length > 0 && (args[0] === '--version' || args[0] === '-v')) {
    console.log(VERSION);
    process.exit(0);
  }

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  const command = args[0] as CommandName;

  // Check for command-specific help
  if ((args.length > 1 && (args[1] === '--help' || args[1] === '-h')) ||
      (args.length === 1 && command in COMMANDS)) {
    if (args[1] === '--help' || args[1] === '-h') {
      printCommandHelp(command);
      process.exit(0);
    }
  }

  const params: Record<string, any> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    // Handle --json flag for JSON input
    if (arg === '--json' && i + 1 < args.length) {
      try {
        Object.assign(params, JSON.parse(args[i + 1]));
        i++;
        continue;
      } catch (e) {
        console.error('Error parsing JSON:', e);
        process.exit(1);
      }
    }

    // Handle --key=value format
    if (arg.startsWith('--') && arg.includes('=')) {
      const [key, ...valueParts] = arg.slice(2).split('=');
      const value = valueParts.join('=');
      params[key] = parseValue(value);
      continue;
    }

    // Handle --key value format
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        params[key] = parseValue(args[i + 1]);
        i++;
      } else {
        params[key] = true;
      }
    }
  }

  // Convert known array fields to arrays if they're not already
  for (const key of Object.keys(params)) {
    if (ARRAY_FIELDS.has(key) && !Array.isArray(params[key])) {
      params[key] = [params[key]];
    }
  }

  return { command, params };
}

function parseValue(value: string): any {
  // Try to parse as number
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  // Try to parse as boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Check if it's a comma-separated list
  if (value.includes(',')) {
    return value.split(',').map(v => v.trim());
  }

  return value;
}

async function runCommand(client: ApolloClient, command: CommandName, params: Record<string, any>) {
  try {
    let result: any;

    switch (command) {
      case 'search-people':
        // Warn if using --q without any filter parameters
        const hasFilter = Object.keys(params).some(key =>
          ARRAY_FIELDS.has(key) || ['q_organization_domains', 'contact_email_status'].includes(key)
        );
        if (params.q && !hasFilter) {
          console.error('Warning: The --q parameter alone will return default results.');
          console.error('For better results, combine --q with filters like:');
          console.error('  --person_titles, --person_locations, --seniority, --departments, etc.');
          console.error('');
          console.error('Example: apollo-io-cli search-people --q "engineering" --person_titles "CTO"');
          console.error('');
        }
        result = await client.searchPeople(params);
        break;

      case 'search-companies':
        result = await client.searchCompanies(params);
        break;

      case 'enrich-person':
        const revealEmails = params.reveal_personal_emails === true || params.reveal_personal_emails === 'true';
        const revealPhone = params.reveal_phone_number === true || params.reveal_phone_number === 'true';
        delete params.reveal_personal_emails;
        delete params.reveal_phone_number;
        result = await client.matchPerson(params, revealEmails, revealPhone);
        break;

      case 'enrich-company':
        result = await client.matchCompany(params);
        break;

      case 'bulk-enrich-people':
        const bulkRevealEmails = params.reveal_personal_emails === true || params.reveal_personal_emails === 'true';
        const bulkRevealPhone = params.reveal_phone_number === true || params.reveal_phone_number === 'true';
        delete params.reveal_personal_emails;
        delete params.reveal_phone_number;
        result = await client.bulkEnrichPeople(params, bulkRevealEmails, bulkRevealPhone);
        break;

      case 'bulk-enrich-companies':
        result = await client.bulkEnrichOrganizations(params);
        break;

      case 'org-jobs':
        if (!params.id) {
          console.error('Error: --id is required for org-jobs command');
          process.exit(1);
        }
        const orgId = params.id;
        delete params.id;
        result = await client.getOrganizationJobPostings(orgId, params);
        break;

      case 'org-info':
        if (!params.id) {
          console.error('Error: --id is required for org-info command');
          process.exit(1);
        }
        result = await client.getCompleteOrganizationInfo(params.id);
        break;

      case 'search-news':
        result = await client.searchNewsArticles(params);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }

    // Pretty print the result
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

async function main() {
  // Parse args first to handle --help before API key check
  const { command, params } = parseArgs(process.argv.slice(2));

  if (!command || !(command in COMMANDS)) {
    console.error(`Error: Invalid command "${command}"`);
    printUsage();
    process.exit(1);
  }

  // Check for API key after parsing args (help exits before this)
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    console.error('Error: APOLLO_API_KEY environment variable is required');
    console.error('Set it in a .env file or export APOLLO_API_KEY=your_key_here');
    process.exit(1);
  }

  const client = new ApolloClient({ apiKey });
  await runCommand(client, command, params);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
