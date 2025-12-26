(async ()=>{
  try {
    const { getDB } = await import('../src/utils/db.js');
    const db = await getDB();
    const res = db.exec("SELECT id, reference, paid, status, mpesa, lastMpesaUpdateError FROM orders WHERE reference = 'PKTEST' LIMIT 1");
    const rows = (res && res[0] && res[0].values) ? res[0].values : [];
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('failed to query', e);
    process.exit(1);
  }
})();
