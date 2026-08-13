#!/usr/bin/env node

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const buildDir = path.join(root, '.mcpb-build');
const bundleDir = path.join(buildDir, 'apollo-io-mcp');
const outDir = path.join(root, 'release');
const outFile = path.join(outDir, `apollo-io-mcp-v${packageJson.version}.mcpb`);

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  });
}

function copy(from, to) {
  fs.cpSync(path.join(root, from), path.join(bundleDir, to), { recursive: true });
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

fs.rmSync(buildDir, { recursive: true, force: true });
fs.rmSync(outFile, { force: true });
fs.mkdirSync(bundleDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

copy('dist', 'dist');
copy('README.md', 'README.md');
copy('LICENSE', 'LICENSE');
copy('package-lock.json', 'package-lock.json');

writeJson(path.join(bundleDir, 'package.json'), {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  license: packageJson.license,
  type: packageJson.type,
  main: packageJson.main,
  dependencies: packageJson.dependencies,
  engines: packageJson.engines,
});

writeJson(path.join(bundleDir, 'manifest.json'), {
  manifest_version: '0.3',
  name: 'apollo-io-mcp',
  display_name: 'Apollo.io MCP',
  version: packageJson.version,
  description: packageJson.description,
  long_description: 'Search and enrich Apollo.io people, companies, job postings, organization details, and news from Claude Desktop and other MCP clients.',
  author: {
    name: packageJson.author,
  },
  repository: {
    type: 'git',
    url: 'https://github.com/thevgergroup/apollo-io-mcp',
  },
  homepage: 'https://github.com/thevgergroup/apollo-io-mcp#readme',
  documentation: 'https://github.com/thevgergroup/apollo-io-mcp#readme',
  support: 'https://github.com/thevgergroup/apollo-io-mcp/issues',
  server: {
    type: 'node',
    entry_point: 'dist/server.js',
    mcp_config: {
      command: 'node',
      args: ['${__dirname}/dist/server.js'],
      env: {
        APOLLO_API_KEY: '${user_config.apollo_api_key}',
      },
    },
  },
  tools: [
    { name: 'apollo_search_people', description: 'Search Apollo people by role, location, seniority, company, industry, and technology.' },
    { name: 'apollo_search_companies', description: 'Search Apollo companies by location, size, industry keywords, technology, revenue, funding, and jobs.' },
    { name: 'apollo_enrich_person', description: 'Enrich a person by email, LinkedIn URL, or name plus company.' },
    { name: 'apollo_enrich_company', description: 'Enrich a company by domain or name.' },
    { name: 'apollo_bulk_enrich_people', description: 'Bulk enrich multiple people.' },
    { name: 'apollo_bulk_enrich_organizations', description: 'Bulk enrich multiple organizations.' },
    { name: 'apollo_get_organization_job_postings', description: 'Get job postings for an Apollo organization.' },
    { name: 'apollo_get_complete_organization_info', description: 'Get complete organization information by Apollo organization ID.' },
    { name: 'apollo_search_news_articles', description: 'Search Apollo news articles related to companies.' },
  ],
  keywords: packageJson.keywords,
  license: packageJson.license,
  compatibility: {
    platforms: ['darwin', 'win32'],
    runtimes: {
      node: '>=20.0.0',
    },
  },
  user_config: {
    apollo_api_key: {
      type: 'string',
      title: 'Apollo API Key',
      description: 'Your Apollo.io API key. Create one in Apollo under Settings > Integrations > API.',
      required: true,
      sensitive: true,
    },
  },
});

run('npm', ['ci', '--omit=dev'], { cwd: bundleDir });
run('npx', ['mcpb', 'validate', path.join(bundleDir, 'manifest.json')]);
run('npx', ['mcpb', 'pack', bundleDir, outFile]);

console.log(`Created ${path.relative(root, outFile)}`);
