#!/usr/bin/env node

/**
 * Fix all top-level fs/path imports in API routes to use dynamic await import()
 * This prevents module loading errors on Vercel's edge runtime.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to process
const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

function getFiles(dir) {
  return glob.sync(path.join(dir, '**', 'route.js'));
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Check if file has top-level fs or path imports
  const hasFsImport = /^import\s+fs\s+from\s+['"]fs['"];/m.test(content);
  const hasPathImport = /^import\s+path\s+from\s+['"]path['"];/m.test(content);

  if (!hasFsImport && !hasPathImport) {
    return false; // No changes needed
  }

  // Remove top-level fs/path imports
  content = content.replace(/^import\s+fs\s+from\s+['"]fs['"];\n/m, '');
  content = content.replace(/^import\s+path\s+from\s+['"]path['"];\n/m, '');

  // Remove any `const dataPath = path.join(...)` declarations
  content = content.replace(/const\s+dataPath\s+=\s+path\.join\([^)]*\);\n/g, '');

  // Convert synchronous read/write functions to async with dynamic imports
  
  // Pattern 1: readTutorialsFile / readServicesFile / readProductsFile / readPagesFile
  const readFilePatterns = [
    { name: 'readTutorialsFile', file: 'tutorials' },
    { name: 'readServicesFile', file: 'services' },
    { name: 'readProductsFile', file: 'products' },
    { name: 'readPagesFile', file: 'pages' }
  ];

  for (const pattern of readFilePatterns) {
    const funcRegex = new RegExp(`function\\s+${pattern.name}\\(\\)\\s*\\{[^}]*\\}`, 's');
    if (funcRegex.test(content)) {
      content = content.replace(
        funcRegex,
        `async function ${pattern.name}() {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', '${pattern.file}.json');
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.${pattern.file === 'products' ? 'products' : pattern.file} || [];
  } catch (err) {
    return [];
  }
}`
      );

      // Update calls to this function to await
      content = content.replace(new RegExp(`(const\\s+\\w+\\s*=\\s*)${pattern.name}\\(\\)`, 'g'), `$1await ${pattern.name}()`);
    }
  }

  // Pattern 2: writeTutorialsFile / writeServicesFile / etc.
  const writeFilePatterns = [
    { name: 'writeTutorialsFile', file: 'tutorials' },
    { name: 'writeServicesFile', file: 'services' },
    { name: 'writePagesFile', file: 'pages' }
  ];

  for (const pattern of writeFilePatterns) {
    const funcRegex = new RegExp(`function\\s+${pattern.name}\\([^)]*\\)\\s*\\{[^}]*\\}`, 's');
    if (funcRegex.test(content)) {
      content = content.replace(
        funcRegex,
        `async function ${pattern.name}(data) {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', '${pattern.file}.json');
  const json = { ${pattern.file}: data };
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
}`
      );

      // Update calls to this function to await
      content = content.replace(new RegExp(`${pattern.name}\\(`, 'g'), `await ${pattern.name}(`);
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Main
const files = getFiles(apiDir);
let fixed = 0;

for (const filePath of files) {
  if (fixFile(filePath)) {
    console.log(`✓ Fixed: ${path.relative(process.cwd(), filePath)}`);
    fixed++;
  }
}

console.log(`\nFixed ${fixed} files.`);
