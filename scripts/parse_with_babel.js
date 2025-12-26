const fs = require('fs');
const parser = require('@babel/parser');
const files = ['src/app/cart/page.js','src/app/api/checkout/route.js','src/app/api/orders/[id]/route.js','src/app/order/[id]/page.js'];
for (const f of files) {
  const s = fs.readFileSync(f,'utf8');
  try{
    parser.parse(s, { sourceType: 'module', plugins: ['jsx'] });
    console.log(f + ': Parsed OK');
  } catch(e){
    console.error(f + ': Parse error:', e.message);
    if (e.loc) {
      console.error('Location:', e.loc);
      const lines = s.split(/\r?\n/);
      const from = Math.max(1, e.loc.line - 6);
      const to = Math.min(lines.length, e.loc.line + 6);
      for (let i = from; i <= to; i++) console.error((i)+': '+lines[i-1]);
    }
    console.error(e.codeFrame || 'no frame');
    process.exit(1);
  }
}
