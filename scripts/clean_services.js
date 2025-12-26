const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'src', 'data', 'services.json');
if (!fs.existsSync(dataPath)) {
  console.error('services.json not found');
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

function sanitize(obj) {
  const seen = new WeakSet();
  function _clone(v) {
    if (v && typeof v === 'object') {
      if (seen.has(v)) return undefined;
      if (typeof v.nodeType === 'number' || v._reactInternals || v._reactRootContainer) return undefined;
      seen.add(v);
      if (Array.isArray(v)) return v.map(_clone).filter(x => x !== undefined);
      const out = {};
      for (const k of Object.keys(v)) {
        if (k && k.startsWith('_')) continue;
        const c = _clone(v[k]);
        if (c !== undefined) out[k] = c;
      }
      return out;
    }
    if (typeof v === 'function') return undefined;
    return v;
  }
  return _clone(obj);
}

const services = Array.isArray(json.services) ? json.services : [];
const cleaned = services.map(s => {
  const c = sanitize(s) || {};
  if (c.images && !Array.isArray(c.images)) c.images = [c.images];
  if (c.attachments && Array.isArray(c.attachments)) c.attachments = c.attachments.map(a => ({ url: a && a.url ? a.url : a, mime: a && a.mime ? a.mime : null, name: a && a.name ? a.name : null }));
  return c;
});

fs.writeFileSync(dataPath, JSON.stringify({ services: cleaned }, null, 2));
console.log('services.json cleaned.');
