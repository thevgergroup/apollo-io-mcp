#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = ['server.js', 'cli.js'];

for (const file of files) {
  const filePath = path.join(__dirname, '..', 'dist', file);

  // Skip if file doesn't exist
  if (!fs.existsSync(filePath)) {
    continue;
  }

  // Read the current content
  const content = fs.readFileSync(filePath, 'utf8');

  // Add shebang if it doesn't exist
  if (!content.startsWith('#!/usr/bin/env node')) {
    const newContent = `#!/usr/bin/env node

${content}`;
    fs.writeFileSync(filePath, newContent);
    console.log(`Added shebang to dist/${file}`);
  }

  // Make the file executable
  try {
    fs.chmodSync(filePath, 0o755);
    console.log(`Made dist/${file} executable`);
  } catch (error) {
    console.error(`Failed to make ${file} executable:`, error);
  }
}
