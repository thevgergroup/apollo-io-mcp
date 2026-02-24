#!/usr/bin/env node
import 'dotenv/config';
import { ApolloClient } from './apollo.js';

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
Apollo.io CLI Tool

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
`);
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
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  const command = args[0] as CommandName;
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
