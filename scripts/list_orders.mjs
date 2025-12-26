(async ()=>{
  try {
    const { getDB } = await import('../src/utils/db.js');
    const db = await getDB();
    const res = db.exec('SELECT id, reference, paid, status, mpesaMerchantRequestId, mpesaCheckoutRequestId, createdAt FROM orders ORDER BY createdAt DESC LIMIT 20');
    const rows = (res && res[0] && res[0].values) ? res[0].values : [];
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('failed to list orders', e);
    process.exit(1);
  }
})();
