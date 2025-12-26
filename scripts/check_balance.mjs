import fs from 'fs';
const s = fs.readFileSync('src/app/api/mpesa/callback/route.js', 'utf8');
const counts = {
  '(': (s.match(/\(/g)||[]).length,
  ')': (s.match(/\)/g)||[]).length,
  '{': (s.match(/\{/g)||[]).length,
  '}': (s.match(/\}/g)||[]).length,
  '[': (s.match(/\[/g)||[]).length,
  ']': (s.match(/\]/g)||[]).length,
  '`': (s.match(/`/g)||[]).length,
};
console.log(counts);
