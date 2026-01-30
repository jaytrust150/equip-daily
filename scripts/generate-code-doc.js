#!/usr/bin/env node

/**
 * Auto-Documentation Generator
 *
 * Purpose: Generates/updates CODE_LINE_BY_LINE.md with an auto-generated
 * file index table containing SHA256 hashes, line counts, and byte sizes.
 *
 * Usage:
 *   node scripts/generate-code-doc.js          # Update documentation
 *   node scripts/generate-code-doc.js --check  # Verify docs are current (CI)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DOC_FILE = path.join(ROOT_DIR, 'CODE_LINE_BY_LINE.md');

// Files/folders to exclude from documentation
const EXCLUDED = [
  'node_modules',
  '.git',
  '.vscode',
  'dist',
  'build',
  '.vercel',
  'coverage',
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  '.env',
  '.env.local',
  'dev-dist',
  'CODE_LINE_BY_LINE.md'
];

/**
 * Recursively scan directory and collect file metadata
 */
function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip excluded files/folders
    if (EXCLUDED.some(ex => filePath.includes(ex))) {
      return;
    }

    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      // Calculate file metadata
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').length;
      const bytes = Buffer.byteLength(content, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
      const relativePath = path.relative(ROOT_DIR, filePath);

      fileList.push({
        path: relativePath,
        lines,
        bytes,
        hash
      });
    }
  });

  return fileList;
}

/**
 * Build the auto-generated markdown table
 */
function buildAutoSection(files) {
  let content = '## 📁 Auto-Generated File Index\n\n';
  content += '*This section is automatically generated. Do not edit manually.*\n\n';
  content += '| File | Lines | Bytes | SHA256 Hash |\n';
  content += '|------|-------|-------|-------------|\n';

  files
    .sort((a, b) => a.path.localeCompare(b.path))
    .forEach(file => {
      content += `| \`${file.path}\` | ${file.lines} | ${file.bytes} | \`${file.hash}\` |\n`;
    });

  content += '\n';
  return content;
}

/**
 * Update CODE_LINE_BY_LINE.md with auto-generated content
 */
function updateDoc(checkOnly = false) {
  console.log('🔍 Scanning codebase...');
  const files = walk(ROOT_DIR);
  console.log(`✅ Found ${files.length} files`);

  const newAutoSection = buildAutoSection(files);

  // Read existing doc
  let docContent = '';
  if (fs.existsSync(DOC_FILE)) {
    docContent = fs.readFileSync(DOC_FILE, 'utf-8');
  } else {
    // Create new doc with markers
    docContent = `# Code Documentation\n\n<!-- AUTO-GENERATED-START -->\n<!-- AUTO-GENERATED-END -->\n\n## Manual Documentation\n\nAdd your manual documentation here.\n`;
  }

  // Find markers
  const startMarker = '<!-- AUTO-GENERATED-START -->';
  const endMarker = '<!-- AUTO-GENERATED-END -->';
  const startIndex = docContent.indexOf(startMarker);
  const endIndex = docContent.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error('❌ ERROR: Could not find AUTO-GENERATED markers in CODE_LINE_BY_LINE.md');
    console.error('   Please add these markers to your documentation:');
    console.error('   <!-- AUTO-GENERATED-START -->');
    console.error('   <!-- AUTO-GENERATED-END -->');
    process.exit(1);
  }

  // Build new content
  const before = docContent.substring(0, startIndex + startMarker.length);
  const after = docContent.substring(endIndex);
  const updatedContent = before + '\n\n' + newAutoSection + after;

  // Check mode: verify docs are current
  if (checkOnly) {
    if (docContent === updatedContent) {
      console.log('✅ Documentation is up to date!');
      process.exit(0);
    } else {
      console.error('❌ ERROR: Documentation is out of date!');
      console.error('   Run: npm run docs:code');
      console.error('   Then commit the changes.');
      process.exit(1);
    }
  }

  // Update mode: write changes
  fs.writeFileSync(DOC_FILE, updatedContent, 'utf-8');
  console.log('✅ CODE_LINE_BY_LINE.md updated.');
}

// Run script
const checkMode = process.argv.includes('--check');
updateDoc(checkMode);
