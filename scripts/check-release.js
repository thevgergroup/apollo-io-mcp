#!/usr/bin/env node

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const packageJson = readJson('package.json');
const packageLock = readJson('package-lock.json');
const expectedTag = `v${packageJson.version}`;

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

function fail(message) {
  console.error(`Release check failed: ${message}`);
  process.exit(1);
}

if (packageLock.version !== packageJson.version) {
  fail(`package-lock.json version ${packageLock.version} does not match package.json version ${packageJson.version}`);
}

const manifestPath = path.join(root, '.mcpb-build', 'apollo-io-mcp', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.version !== packageJson.version) {
    fail(`MCPB manifest version ${manifest.version} does not match package.json version ${packageJson.version}`);
  }
}

const refType = process.env.GITHUB_REF_TYPE;
const refName = process.env.GITHUB_REF_NAME;

if (refType === 'tag' && refName !== expectedTag) {
  fail(`Git tag ${refName} does not match package version ${expectedTag}`);
}

if (refType === 'tag') {
  try {
    const publishedVersion = execFileSync('npm', ['view', `${packageJson.name}@${packageJson.version}`, 'version'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (publishedVersion === packageJson.version) {
      fail(`${packageJson.name}@${packageJson.version} is already published to npm`);
    }
  } catch {
    // npm exits non-zero when this exact version has not been published yet.
  }
}

console.log(`Release check passed for ${packageJson.name}@${packageJson.version}`);
