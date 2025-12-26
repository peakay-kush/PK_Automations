#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'users.db');
const backupsDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

if (!fs.existsSync(dbPath)) {
  console.error('No DB file found at', dbPath);
  process.exit(1);
}

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const dest = path.join(backupsDir, `users.db.${ts}`);
fs.copyFileSync(dbPath, dest);
console.log('DB backed up to', dest);
