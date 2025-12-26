(async ()=>{
  try {
    const { getDB, saveDB } = await import('../src/utils/db.js');
    const cbModule = await import('../src/app/api/mpesa/callback/route.js');
    const db = await getDB();

    // create test order
    const id = 'test_' + Date.now().toString(36);
    const reference = 'PKTEST';
    const createdAt = new Date().toISOString();
    const items = JSON.stringify([{ id: 9999, name: 'Test Product', price: 200, quantity: 1 }]);
    const stmt = db.prepare('INSERT INTO orders (id, reference, userId, name, email, normalizedEmail, phone, items, total, shipping, shippingAddress, shippingLocation, paid, paymentMethod, status, statusHistory, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    const initHistory = JSON.stringify([{ status: 'created', changedAt: createdAt, by: 'test' }]);
    stmt.run([id, reference, null, 'Test User', 'test@example.com', 'test@example.com', '254700000000', items, 200, 0, null, null, 0, 'mpesa', 'created', initHistory, createdAt]);
    try{ stmt.free(); }catch(e){}
    await saveDB();
    console.log('Inserted test order', id, reference);

    // build simulated callback payload referencing the test order
    const payload = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'mreq-local-test-12345',
          CheckoutRequestID: 'ws_CO_local_test_12345',
          ResultCode: 0,
          ResultDesc: 'Success. Request accepted for processing',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 200 },
              { Name: 'MpesaReceiptNumber', Value: 'TST12345' },
              { Name: 'TransactionDate', Value: 20251227120000 },
              { Name: 'PhoneNumber', Value: 254700000000 },
              { Name: 'AccountReference', Value: reference }
            ]
          },
          AccountReference: reference
        }
      }
    };

    const fakeReq = { json: async () => payload };
    const res = await cbModule.POST(fakeReq);
    const text = await res.text();
    console.log('Handler returned', res.status, text);

    // read back order
    const stmt2 = db.prepare('SELECT id, reference, paid, status, mpesa, lastMpesaUpdateError FROM orders WHERE id = ?');
    stmt2.bind([id]);
    let row = null;
    if (stmt2.step()) row = stmt2.get();
    try{ stmt2.free(); }catch(e){}
    console.log('Order row after callback:', row);

    process.exit(0);
  } catch (e) {
    console.error('test flow failed', e);
    process.exit(1);
  }
})();
