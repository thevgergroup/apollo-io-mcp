#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const currentVersion = packageJson.version;

function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error running command: ${command}`);
    process.exit(1);
  }
}

function updateVersion(type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  let newVersion;
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    default:
      console.error('Invalid version type. Use: major, minor, or patch');
      process.exit(1);
  }
  
  return newVersion;
}

function main() {
  const versionType = process.argv[2];
  
  if (!versionType || !['major', 'minor', 'patch'].includes(versionType)) {
    console.log('Usage: node scripts/release.js <major|minor|patch>');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/release.js patch  # 1.0.0 -> 1.0.1');
    console.log('  node scripts/release.js minor  # 1.0.0 -> 1.1.0');
    console.log('  node scripts/release.js major  # 1.0.0 -> 2.0.0');
    process.exit(1);
  }
  
  const newVersion = updateVersion(versionType);
  
  console.log(`🚀 Releasing version ${newVersion} (from ${currentVersion})`);
  console.log('');
  
  // Check if working directory is clean
  try {
    execSync('git diff-index --quiet HEAD --', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Working directory is not clean. Please commit or stash your changes.');
    process.exit(1);
  }
  
  // Update package.json version
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

  // Keep package-lock.json in sync with package.json
  runCommand('npm install --package-lock-only --ignore-scripts');

  // Remove generated bundle metadata from previous local checks before validating
  // the new package version.
  fs.rmSync(path.join(__dirname, '..', '.mcpb-build'), { recursive: true, force: true });
  fs.rmSync(path.join(__dirname, '..', 'release'), { recursive: true, force: true });

  // Validate version metadata before tests and tagging
  console.log('🔎 Checking release metadata...');
  runCommand('npm run check:release');
  
  // Run tests
  console.log('🧪 Running tests...');
  runCommand('npm test');
  
  // Build package
  console.log('🔨 Building package...');
  runCommand('npm run build');

  // Build MCPB bundle for GitHub release assets
  console.log('📦 Building MCPB bundle...');
  runCommand('npm run build:mcpb');
  
  // Commit version change
  console.log('📝 Committing version change...');
  runCommand(`git add package.json package-lock.json`);
  runCommand(`git commit -m "chore: bump version to ${newVersion}"`);
  
  // Create and push tag
  console.log('🏷️  Creating and pushing tag...');
  runCommand(`git tag v${newVersion}`);
  runCommand('git push origin main');
  runCommand(`git push origin v${newVersion}`);
  
  console.log('');
  console.log(`✅ Successfully released version ${newVersion}!`);
  console.log('');
  console.log('The GitHub Action will automatically publish to npm.');
  console.log(`View the workflow: https://github.com/thevgergroup/apollo-io-mcp/actions`);
}

main();
