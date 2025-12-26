const fs = require('fs');
const s = fs.readFileSync('src/app/api/mpesa/callback/route.js','utf8');
let stack = [];
let line = 1;
let col = 0;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  col++;
  if (ch === '\n') { line++; col = 0; }
  if (ch === '{') stack.push({ ch, line, col });
  if (ch === '}') {
    if (stack.length === 0) {
      console.log('Unmatched closing brace at', line, col);
    } else {
      stack.pop();
    }
  }
}
if (stack.length === 0) console.log('All braces matched');
else {
  console.log('Unmatched opening braces count', stack.length);
  for (const v of stack) console.log('Unmatched { at line', v.line, 'col', v.col);
}
