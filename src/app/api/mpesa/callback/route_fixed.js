// Archived: mpesa callback implementation removed
export default {};
export default {};

async function enqueueRecovery(db, orderId, payloadObj, reason) {
  try {
    const jobId = `mq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
    const insertQ = db.prepare('INSERT OR IGNORE INTO mpesa_queue (id, orderId, payload, reason, attempts, nextAttempt, createdAt, lastError) VALUES (?,?,?,?,?,?,?,?)');
    insertQ.run([jobId, orderId, JSON.stringify(payloadObj), reason || null, 0, new Date().toISOString(), new Date().toISOString(), null]);
    try { insertQ.free(); } catch (e) {}
    await saveDB();
    console.log('Enqueued mpesa recovery job', jobId, 'for order', orderId);
    return jobId;
  } catch (e) {
    console.warn('Failed to enqueue recovery job', e);
    return null;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback || body?.stkCallback || body || {};

    let merchantRequestId = callback?.MerchantRequestID || null;
    let checkoutRequestId = callback?.CheckoutRequestID || null;
    const resultCode = callback?.ResultCode ?? null;

    let accountRef = callback?.AccountReference || null;
    let phoneNumber = null;
    try {
      const items = callback?.CallbackMetadata?.Item || callback?.CallbackMetadata || [];
      if (Array.isArray(items)) {
        for (const it of items) {
          if (!it) continue;
          if (it.Name === 'AccountReference' && typeof it.Value !== 'undefined') accountRef = String(it.Value);
          if (it.Name === 'PhoneNumber' && typeof it.Value !== 'undefined') phoneNumber = String(it.Value);
          if (it.Name === 'CheckoutRequestID' && typeof it.Value !== 'undefined') checkoutRequestId = checkoutRequestId || String(it.Value);
          if (it.Name === 'MerchantRequestID' && typeof it.Value !== 'undefined') merchantRequestId = merchantRequestId || String(it.Value);
        }
      }
    } catch (e) { /* ignore */ }

    const db = await getDB();

    // Find order
    let orderRow = null;
    try {
      const stmt = db.prepare('SELECT id, mpesa FROM orders WHERE json_extract(mpesa, "$.MerchantRequestID") = ? OR json_extract(mpesa, "$.CheckoutRequestID") = ? OR mpesaMerchantRequestId = ? OR mpesaCheckoutRequestId = ? OR reference = ? OR phone = ?');
      stmt.bind([merchantRequestId || '', checkoutRequestId || '', merchantRequestId || '', checkoutRequestId || '', accountRef || '', phoneNumber || '']);
      if (stmt.step()) orderRow = stmt.get();
      try { stmt.free(); } catch (e) {}
    } catch (e) {
      // fallback scan
      const res = db.exec('SELECT id, reference, phone, mpesa FROM orders WHERE paymentMethod = "mpesa"');
      const vals = res?.[0]?.values || [];
      for (const v of vals) {
        const id = v[0];
        const ref = v[1];
        const ph = v[2];
        const mpRaw = v[3];
        const mp = mpRaw && typeof mpRaw === 'string' ? JSON.parse(mpRaw) : mpRaw;
        if (accountRef && String(ref) === String(accountRef)) { orderRow = [id, JSON.stringify(mp)]; break; }
        if (mp && (mp.MerchantRequestID === merchantRequestId || mp.CheckoutRequestID === checkoutRequestId)) { orderRow = [id, JSON.stringify(mp)]; break; }
        if (phoneNumber && ph && String(ph).slice(-6) === String(phoneNumber).slice(-6)) { orderRow = [id, JSON.stringify(mp)]; break; }
      }
    }

    if (!orderRow) {
      // alert admin with payload
      try {
        const payloadStr = JSON.stringify(body, null, 2).replace(/</g, '&lt;');
        const html = `<div><p>Unmatched Mpesa callback received at ${new Date().toISOString()}</p><pre style="white-space:pre-wrap">${payloadStr}</pre></div>`;
        await sendOrderEmail(process.env.EMAIL?.replace(/"/g, '')?.trim(), `Unmatched Mpesa callback`, html);
      } catch (e) { console.warn('failed to notify admin of unmatched callback', e); }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const orderId = orderRow[0];
    let orderMpesa = null;
    try { orderMpesa = orderRow[1] ? (typeof orderRow[1] === 'string' ? JSON.parse(orderRow[1]) : orderRow[1]) : {}; } catch (e) { orderMpesa = orderRow[1]; }

    if (resultCode === 0 || resultCode === '0') {
      // mark paid
      const updatedMpesa = { ...orderMpesa, callback };
      let dbUpdateOk = false;

      try {
        const fetchHist = db.prepare('SELECT statusHistory FROM orders WHERE id = ?');
        fetchHist.bind([orderId]);
        let histRaw = null;
        if (fetchHist.step()) histRaw = fetchHist.get()[0];
        try { fetchHist.free(); } catch (e) {}
        const hist = histRaw ? (typeof histRaw === 'string' ? JSON.parse(histRaw) : histRaw) : [];
        hist.push({ status: 'paid', changedAt: new Date().toISOString(), by: 'mpesa-callback' });

        const upd = db.prepare('UPDATE orders SET paid = ?, status = ?, mpesa = ?, statusHistory = ? WHERE id = ?');
        upd.run([1, 'paid', JSON.stringify(updatedMpesa), JSON.stringify(hist), orderId]);
        try { upd.free(); } catch (e) {}
        await saveDB();

        // verify
        const verify = db.prepare('SELECT paid, status FROM orders WHERE id = ?');
        verify.bind([orderId]);
        let vrow = null;
        if (verify.step()) vrow = verify.get();
        try { verify.free(); } catch (e) {}
        const persistedPaid = vrow ? vrow[0] : null;
        const persistedStatus = vrow ? vrow[1] : null;
        if (persistedPaid === 1 || persistedStatus === 'paid') dbUpdateOk = true;
      } catch (e) {
        console.error('db update paid failed', e);
        try {
          const stmtErr = db.prepare('UPDATE orders SET lastMpesaUpdateError = ? WHERE id = ?');
          stmtErr.run([String(e && e.message ? e.message : e), orderId]);
          try { stmtErr.free(); } catch (ee) {}
          await saveDB();
        } catch (ee) { console.warn('failed to persist mpesa update error', ee); }

        await enqueueRecovery(db, orderId, { body, merchantRequestId, checkoutRequestId, error: String(e) }, String(e && e.message ? e.message : e));
      }

      // email handling
      try {
        const fetch = db.prepare('SELECT email, reference, items, total, shipping FROM orders WHERE id = ?');
        fetch.bind([orderId]);
        let r = null;
        if (fetch.step()) r = fetch.get();
        try { fetch.free(); } catch (e) {}
        const email = r ? r[0] : null;
        const reference = r ? r[1] : null;
        const items = r && r[2] ? JSON.parse(r[2]) : [];
        const total = r ? Number(r[3] || 0) : 0;
        const shippingAmt = r ? Number(r[4] || 0) : 0;

        const invoiceHtml = `<div><p>Payment received for ${reference}</p><p>Total: KSh ${Number(total).toLocaleString()}</p></div>`;

        if (dbUpdateOk) {
          if (email) await sendOrderEmail(email, `Payment received for Order ${reference}`, invoiceHtml);
          await sendOrderEmail(process.env.EMAIL?.replace(/"/g, '')?.trim(), `Payment received ${reference}`, invoiceHtml);
        } else {
          const msg = 'Payment callback matched but DB update verification failed (order not marked paid after update)';
          try {
            const stmtErr = db.prepare('UPDATE orders SET lastMpesaUpdateError = ? WHERE id = ?');
            stmtErr.run([msg, orderId]);
            try { stmtErr.free(); } catch (ee) {}
            await saveDB();
          } catch (ee) { console.warn('failed to persist mpesa update verification error', ee); }
          try {
            const payloadStr = JSON.stringify(body, null, 2).replace(/</g, '&lt;');
            const html = `<div><p>Payment received but DB update did not persist for order ${orderId} (check lastMpesaUpdateError)</p><pre style="white-space:pre-wrap">${payloadStr}</pre></div>`;
            await sendOrderEmail(process.env.EMAIL?.replace(/"/g, '')?.trim(), `Payment received but DB update failed for ${reference}`, html);
          } catch (e) { console.warn('failed to alert admin about mpesa db update issue', e); }
        }
      } catch (e) { console.warn('email flow failed', e); }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // non-success result
    try {
      const updatedMpesa = { ...orderMpesa, callback };
      const fetchHistF = db.prepare('SELECT statusHistory FROM orders WHERE id = ?');
      fetchHistF.bind([orderId]);
      let histRawF = null;
      if (fetchHistF.step()) histRawF = fetchHistF.get()[0];
      try { fetchHistF.free(); } catch (e) {}
      const histF = histRawF ? (typeof histRawF === 'string' ? JSON.parse(histRawF) : histRawF) : [];
      histF.push({ status: 'failed', changedAt: new Date().toISOString(), by: 'mpesa-callback' });

      const stmt2 = db.prepare('UPDATE orders SET status = ?, mpesa = ?, statusHistory = ? WHERE id = ?');
      stmt2.run(['failed', JSON.stringify(updatedMpesa), JSON.stringify(histF), orderId]);
      try { stmt2.free(); } catch (e) {}
      await saveDB();
    } catch (e) { console.error('db update failed', e); }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error('mpesa callback error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
}
