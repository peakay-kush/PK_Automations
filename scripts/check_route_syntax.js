const fs = require('fs');
const p = 'src/app/api/mpesa/callback/route.js';
const s = fs.readFileSync(p, 'utf8');
const backticks = (s.match(/`/g) || []).length;
const opens = (s.match(/{/g) || []).length;
const closes = (s.match(/}/g) || []).length;
const opens2 = (s.match(/\(/g) || []).length;
const closes2 = (s.match(/\)/g) || []).length;
console.log('file', p);
console.log('backticks', backticks);
console.log('{', opens, '}', closes);
console.log('(', opens2, ')', closes2);
// find line counts and show lines near reported error line 276
const lines = s.split(/\r?\n/);
console.log('total lines', lines.length);
console.log('line 260:', lines[259] || '');
console.log('line 270:', lines[269] || '');
console.log('line 276:', lines[275] || '');
console.log('line 280:', lines[279] || '');
