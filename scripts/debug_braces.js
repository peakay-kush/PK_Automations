const fs = require('fs');
const s = fs.readFileSync('src/app/api/mpesa/callback/route.js','utf8');
let stack = [];
let pops = [];
let line = 1, col = 0;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  col++;
  if (ch === '\n') { line++; col = 0; }
  if (ch === '{') {
    stack.push({ ch, line, col, idx: i });
    // console.log('PUSH { at', line, col);
  }
  if (ch === '}') {
    if (stack.length === 0) {
      console.log('UNMATCHED closing } at', line, col);
    } else {
      const top = stack[stack.length - 1];
      pops.push({ openLine: top.line, openCol: top.col, closeLine: line, closeCol: col });
      stack.pop();
    }
  }
}
console.log('Unmatched openings:', stack.map(x => ({line: x.line, col: x.col, idx: x.idx})).slice(0,20));
console.log('Total opens', (s.match(/{/g)||[]).length, 'Total closes', (s.match(/}/g)||[]).length);
