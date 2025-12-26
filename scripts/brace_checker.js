const fs = require('fs');
const s = fs.readFileSync('src/app/cart/page.js','utf8');
let stack = [];
let line = 1, col = 0;
let i=0;
let inSingle=false,inDouble=false,inBack=false,inLineComment=false,inBlockComment=false;
let lastChar='';
for(i=0;i<s.length;i++){
  const c = s[i];
  col++;
  if (c==='\n') { line++; col=0; inLineComment=false; }
  if (inLineComment) { lastChar=c; continue; }
  if (inBlockComment) { if (lastChar==='*' && c==='/') inBlockComment=false; lastChar=c; continue; }
  if (!inSingle && !inDouble && !inBack) {
    if (lastChar==='/' && c==='/') { inLineComment=true; lastChar=''; continue; }
    if (lastChar==='/' && c==='*') { inBlockComment=true; lastChar=''; continue; }
  }
  if (!inLineComment && !inBlockComment) {
    if (!inSingle && !inDouble && !inBack) {
      if (c==="'") { inSingle=true; lastChar=''; continue; }
      if (c==='"') { inDouble=true; lastChar=''; continue; }
      if (c==='`') { inBack=true; lastChar=''; continue; }
    } else {
      // in string
      if (c==='\\' && (inSingle||inDouble||inBack)) { i++; col++; lastChar=''; continue; }
      if (inSingle && c==="'") { inSingle=false; lastChar=''; continue; }
      if (inDouble && c==='"') { inDouble=false; lastChar=''; continue; }
      if (inBack && c==='`') { inBack=false; lastChar=''; continue; }
      lastChar=c; continue;
    }
  }

  // now normal mode: handle braces
  if (c==='{'||c==='('||c==='[') { stack.push({c, line, col, idx:i}); }
  else if (c==='}'||c===')'||c===']') {
    const last = stack.length?stack[stack.length-1]:null;
    const match = (c==='}' && last && last.c==='{') || (c===')' && last && last.c==='(') || (c===']' && last && last.c==='[');
    if (!match) {
      console.log('Mismatch at line',line,'col',col,'found',c,'expected',last?('closing for '+last.c):'nothing');
      // print context
      const lines = s.split(/\r?\n/);
      const from = Math.max(1, line-6);
      const to = Math.min(lines.length, line+6);
      for(let ln=from; ln<=to; ln++) console.log(ln,':',lines[ln-1]);
      process.exit(1);
    } else {
      stack.pop();
    }
  }
  lastChar=c;
}
if (stack.length) {
  console.log('Unclosed tokens at EOF:', stack.slice(-5));
  process.exit(2);
}
console.log('All good: braces/paren/brackets matched.');
