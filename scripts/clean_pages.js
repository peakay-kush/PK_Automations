const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'src', 'data', 'pages.json');
if (!fs.existsSync(dataPath)) {
  console.error('pages.json not found');
  process.exit(1);
}

const raw = fs.readFileSync(dataPath, 'utf8');
let json;
try {
  json = JSON.parse(raw);
} catch (e) {
  console.error('invalid json', e);
  process.exit(1);
}

function sanitizePage(p) {
  const page = Object.assign({}, p || {});
  if (page.studentHubBullets && Array.isArray(page.studentHubBullets)) {
    page.studentHubBullets = page.studentHubBullets.map((b) => {
      if (b == null) return b;
      if (typeof b === 'object' && !Array.isArray(b)) {
        const keys = Object.keys(b);
        const numericKeys = keys.filter(k => /^[0-9]+$/.test(k)).map(k => parseInt(k, 10)).sort((a,b) => a-b);
        if (numericKeys.length > 0) {
          const str = numericKeys.map(i => String(b[i] || '')).join('');
          if (b.name || b.desc) {
            return { name: (b.name || str), desc: (b.desc || '') };
          }
          return str;
        }
        if (b.name || b.desc) return { name: b.name || '', desc: b.desc || '' };
      }
      return b;
    });
  }
  return page;
}

const pages = Array.isArray(json.pages) ? json.pages : [];
const cleaned = pages.map(sanitizePage);
fs.writeFileSync(dataPath, JSON.stringify({ pages: cleaned }, null, 2));
console.log('pages.json cleaned.');
