const acorn = require('acorn');
const fs = require('fs');
const s = fs.readFileSync('src/app/api/mpesa/callback/route.js', 'utf8');
for (let n = 5; n <= 30; n++) {
  const chunk = s.split(/\n/).slice(0, n).join('\n');
  try {
    acorn.parse(chunk, { ecmaVersion: 2020, sourceType: 'module' });
    console.log(`lines 1..${n}: OK`);
  } catch (e) {
    console.log(`lines 1..${n}: ERROR at ${e.loc ? e.loc.line + ':' + e.loc.column : '?:?'} - ${e.message}`);
  }
}
