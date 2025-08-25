#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPath = path.join(__dirname, '..', 'dist', 'server.js');

// Read the current content
const content = fs.readFileSync(serverPath, 'utf8');

// Add shebang if it doesn't exist
if (!content.startsWith('#!/usr/bin/env node')) {
  const newContent = `#!/usr/bin/env node

${content}`;
  fs.writeFileSync(serverPath, newContent);
  console.log('Added shebang to dist/server.js');
}

// Make the file executable
try {
  fs.chmodSync(serverPath, 0o755);
  console.log('Made dist/server.js executable');
} catch (error) {
  console.error('Failed to make file executable:', error);
}
