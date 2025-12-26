import fs from 'fs';
const s = fs.readFileSync('src/app/api/mpesa/callback/route.js', 'utf8');
console.log('backticks:', (s.match(/`/g) || []).length);
console.log("single quotes:", (s.match(/'/g) || []).length);
console.log('double quotes:', (s.match(/"/g) || []).length);
