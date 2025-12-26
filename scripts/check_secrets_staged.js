#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    return out.split('\n').filter(Boolean);
  } catch (e) {
    console.error('Failed to get staged files', e.message);
    process.exit(0); // don't block commit on unexpected git errors
  }
}

// Only match key=value pairs where value is a literal (e.g. KEY="value") to avoid flagging code references like process.env.KEY
const secretKeyPattern = /(?:JWT_SECRET|NEXT_PUBLIC_JWT_SECRET|CLOUDINARY_API_SECRET|CLOUDINARY_API_KEY|CONSUMER_SECRET|CONSUMER_KEY|PASSKEY|PASSWORD|EMAIL_PASSWORD|APP_PASSWORD|SENDGRID_API_KEY|MPESA|API_KEY|SECRET)\s*=\s*(["']).+\1/i;
// keep a generic heuristic for very long tokens (but require an assignment or colon in the line)
const genericSecretPattern = /(?:[:=]\s*)([A-Za-z0-9_\-]{40,})/; // coarse heuristic

const staged = getStagedFiles();
let found = [];
const EXCLUDED_PATHS = ["scripts/check_secrets_staged.js", ".husky/", ".github/workflows/"];
for (const file of staged) {
  // skip our own helper files and workflow files
  if (EXCLUDED_PATHS.some(p => file.startsWith(p))) continue;
  if (!fs.existsSync(file)) continue; // submodule or deleted
  const content = fs.readFileSync(file, 'utf8');
  if (/^\.env($|\.)|\\.env\b/.test(file)) {
    found.push({ file, reason: '.env file staged' });
    continue;
  }
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (secretKeyPattern.test(line) && !/REPLACE_ME/i.test(line)) {
      found.push({ file, reason: `suspicious key on line ${i+1}: ${line.trim().slice(0,200)}` });
      break;
    }
    // extra heuristic: any very long base64-like token
    if (/=[A-Za-z0-9+/]{40,}=?$/.test(line) || (genericSecretPattern.test(line) && /[:=]/.test(line))) {
      found.push({ file, reason: `possible token on line ${i+1}: ${line.trim().slice(0,200)}` });
      break;
    }
  }
}

if (found.length) {
  console.error('\nERROR: Potential secrets detected in staged files:');
  for (const f of found) {
    console.error(` - ${f.file}: ${f.reason}`);
  }
  console.error('\nCommit aborted. Remove the secret(s) or move them to environment variables and try again.');
  process.exit(1);
}

process.exit(0);
