import { getDB } from '../src/utils/db.js';

async function run(){
  const db = await getDB();
  const res = db.exec("SELECT id, paid, status FROM orders WHERE id LIKE 'testA_%' OR id LIKE 'testB_%'");
  const vals = res?.[0]?.values || [];
  console.log('found', vals.length, 'test orders');
  for(const v of vals) console.log(v);
}

run().catch(e=>{ console.error(e); process.exit(1); });
