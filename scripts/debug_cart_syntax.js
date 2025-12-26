const fs = require('fs');
const p = 'src/app/cart/page.js';
const s = fs.readFileSync(p, 'utf8');
const lines = s.split(/\r?\n/);
console.log('Total lines', lines.length);
// print lines around earlier error area
const start = Math.max(1, 520);
const end = Math.min(lines.length, 600);
for (let i = start; i <= end; i++) {
  console.log(i + ': ' + lines[i - 1]);
}

// count token totals
[['{','}'],['(',')'],['[',']']].forEach(([a,b])=>{
  const ca = s.split(a).length - 1;
  const cb = s.split(b).length - 1;
  console.log(a, ca, b, cb);
});

// find lines that end with a single slash or contain an unescaped regex-ish pattern
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (/\\\//.test(l)) {
    // line has slash; show some context
    if (/\\\/[a-zA-Z0-9_\\\\\[\\(]/.test(l)) {
      console.log('Line', i+1, 'contains slash pattern:', l.trim());
    }
  }
}

// find odd quote counts across file (naive)
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const dq = (l.split('"').length - 1);
  const sq = (l.split("'").length - 1);
  if (dq % 2 === 1 || sq % 2 === 1) {
    console.log('Line', i+1, 'odd quote counts dq', dq, 'sq', sq, ':', l.trim());
  }
}
console.log('done');