import { getDB } from '../src/utils/db.js';
const id = process.argv[2];
(async () => {
  if (!id) return console.error('Usage: node scripts/query_order_by_id.mjs <orderId>');
  const db = await getDB();
  try {
    const res = db.exec("SELECT id,reference,status,paid,email,createdAt FROM orders WHERE id = '" + id.replace(/'/g, "''") + "'");
    console.log(JSON.stringify(res[0] || null, null, 2));
  } catch (e) {
    console.error('Query failed', e);
  }
})();