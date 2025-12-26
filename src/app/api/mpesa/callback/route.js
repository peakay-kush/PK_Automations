import nodemailer from 'nodemailer';
import { getDB, saveDB } from '../../../../utils/db.js';

async function sendOrderEmail(to, subject, html) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL?.replace(/\"/g, '')?.trim(), pass: process.env.PASSWORD?.replace(/\"/g, '')?.trim() }
    });
    await transporter.sendMail({ from: process.env.EMAIL?.replace(/\"/g, '')?.trim(), to, subject, html });
  } catch (e) {
    console.warn('sendOrderEmail failed', e);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback || body?.stkCallback || body;
    const merchantRequestId = callback?.MerchantRequestID || callback?.merchantRequestId || null;
    const checkoutRequestId = callback?.CheckoutRequestID || callback?.checkoutRequestId || null;
    const resultCode = (callback?.ResultCode ?? (body?.Body?.stkCallback?.ResultCode) ?? null);

    // extract transaction metadata
    let tx = null;
    try {
      const items = callback?.CallbackMetadata?.Item || callback?.CallbackMetadata || null;
      if (Array.isArray(items)) {
        tx = {};
        for (const it of items) {
          if (it && it.Name && typeof it.Value !== 'undefined') tx[it.Name] = it.Value;
        }
      }
    } catch (e) { tx = null; }

    const db = await getDB();

    // try to find matching order
    let row = null;
    try {
      const stmt = db.prepare('SELECT id, email, reference, paid, status, statusHistory FROM orders WHERE mpesaMerchantRequestId = ? OR mpesaCheckoutRequestId = ? LIMIT 1');
      stmt.bind([merchantRequestId || '', checkoutRequestId || '']);
      if (stmt.step()) row = stmt.get();
      try { stmt.free(); } catch (e) {}
    } catch (e) { console.warn('mpesa callback lookup failed', e); }

    if (!row) {
      // fallback: try matching by reference / phone in case earlier mapping didn't exist
      try {
        const res = db.exec('SELECT id, email, reference, paid, status, statusHistory FROM orders');
        const vals = res?.[0]?.values || [];
        for (const v of vals) {
          const id = v[0];
          const ref = v[1];
          const hist = v[5];
          if (ref && String(ref) === String(callback?.AccountReference || callback?.AccountReference) ) { row = v; break; }
        }
      } catch (e) { console.warn('mpesa callback fallback scan failed', e); }
    }

    if (!row) {
      console.warn('Order not found for Mpesa callback', merchantRequestId, checkoutRequestId);
      // do not return error to Mpesa, just acknowledge
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const orderId = row[0];
    const email = row[1];
    const reference = row[2];

    if (resultCode === 0 || resultCode === '0') {
      // mark order paid
      try {
        const fetchHist = db.prepare('SELECT statusHistory FROM orders WHERE id = ?');
        fetchHist.bind([orderId]);
        let histRaw = null;
        if (fetchHist.step()) histRaw = fetchHist.get()[0];
        try { fetchHist.free(); } catch (e) {}
        const hist = histRaw ? (typeof histRaw === 'string' ? JSON.parse(histRaw) : histRaw) : [];
        hist.push({ status: 'paid', changedAt: new Date().toISOString(), by: 'mpesa-callback' });

        const mpObj = { receivedAt: new Date().toISOString(), merchantRequestId, checkoutRequestId, tx };
        const stmt2 = db.prepare('UPDATE orders SET paid = ?, status = ?, mpesa = ?, statusHistory = ?, lastMpesaUpdateError = NULL WHERE id = ?');
        stmt2.run([1, 'paid', JSON.stringify(mpObj), JSON.stringify(hist), orderId]);
        try { stmt2.free(); } catch (e) {}
        await saveDB();

        // send emails
        try {
          const invoiceHtml = `<div>Payment received for ${reference}. Transaction: ${tx?.MpesaReceiptNumber || tx?.MpesaReceiptNumber || ''} — Amount: KSh ${Number(tx?.Amount || 0).toLocaleString()}</div>`;
          if (email) await sendOrderEmail(email, `Payment received for Order ${reference}`, invoiceHtml);
          await sendOrderEmail(process.env.EMAIL?.replace(/\"/g, '')?.trim(), `Payment received ${reference}`, invoiceHtml);
        } catch (e) { console.warn('mpesa callback email failed', e); }

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      } catch (e) {
        console.error('mpesa callback db update failed', e);
        try {
          const stmtErr = db.prepare('UPDATE orders SET lastMpesaUpdateError = ? WHERE id = ?');
          stmtErr.run([String(e && e.message ? e.message : e), orderId]);
          try { stmtErr.free(); } catch (ee) {}
          await saveDB();
        } catch (ee) { console.warn('failed to persist mpesa callback error', ee); }
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
    } else {
      // failed callback – record status and reason
      try {
        const mpObj = { receivedAt: new Date().toISOString(), merchantRequestId, checkoutRequestId, tx, resultCode };
        const fetchHist = db.prepare('SELECT statusHistory FROM orders WHERE id = ?');
        fetchHist.bind([orderId]);
        let histRaw = null;
        if (fetchHist.step()) histRaw = fetchHist.get()[0];
        try { fetchHist.free(); } catch (e) {}
        const hist = histRaw ? (typeof histRaw === 'string' ? JSON.parse(histRaw) : histRaw) : [];
        hist.push({ status: 'failed', changedAt: new Date().toISOString(), by: 'mpesa-callback' });

        const stmt2 = db.prepare('UPDATE orders SET status = ?, mpesa = ?, statusHistory = ?, lastMpesaUpdateError = ? WHERE id = ?');
        stmt2.run(['failed', JSON.stringify(mpObj), JSON.stringify(hist), `mpesa result ${resultCode}`, orderId]);
        try { stmt2.free(); } catch (e) {}
        await saveDB();
      } catch (e) { console.warn('failed to persist failed mpesa callback', e); }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
  } catch (e) {
    console.error('mpesa callback handler error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
}


/* archived handler - removed */
/*
    // Mpesa sends a Body.stkCallback — normalize to a handy object
    const callback = body?.Body?.stkCallback || body?.stkCallback || body;

    // Try to pick top-level ids — will be augmented from CallbackMetadata items if present
    let merchantRequestId = callback?.MerchantRequestID || null;
    let checkoutRequestId = callback?.CheckoutRequestID || null;
    const resultCode = (callback?.ResultCode ?? (body?.Body?.stkCallback?.ResultCode) ?? null);

    // extract AccountReference / PhoneNumber / CheckoutRequestID/MerchantRequestID from CallbackMetadata Item array when provided
    let accountRef = callback?.AccountReference || null;
    let phoneNumber = null;
    let callbackAmount = null;
    try {
      const items = callback?.CallbackMetadata?.Item || callback?.CallbackMetadata || [];
      if (Array.isArray(items)) {
        for (const it of items) {
          if (!it) continue;
          if (it.Name === 'AccountReference' && typeof it.Value !== 'undefined') accountRef = String(it.Value);
          if (it.Name === 'PhoneNumber' && typeof it.Value !== 'undefined') phoneNumber = String(it.Value);
          if ((it.Name === 'Amount' || it.Name === 'MpesaAmount') && typeof it.Value !== 'undefined') callbackAmount = Number(it.Value);
          if (it.Name === 'CheckoutRequestID' && typeof it.Value !== 'undefined') checkoutRequestId = checkoutRequestId || String(it.Value);
          if (it.Name === 'MerchantRequestID' && typeof it.Value !== 'undefined') merchantRequestId = merchantRequestId || String(it.Value);
        }
      }
    } catch (e) {}
    const db = await getDB();

    // log full incoming callback (trimmed) for debugging
    try {
      const payloadPreview = typeof body === 'object' ? JSON.stringify(body) : String(body);
      console.log('Mpesa callback received at', new Date().toISOString(), payloadPreview.slice(0, 5000));
    } catch (e) { console.warn('Failed to stringify mpesa callback', e); }

    // find order by matching mpesa ids, reference, or phone (best-effort). Track how we matched for debugging
    let row = null;
    let matchedBy = null;
    try {
      const stmt = db.prepare('SELECT id, mpesa FROM orders WHERE json_extract(mpesa, "$.MerchantRequestID") = ? OR json_extract(mpesa, "$.CheckoutRequestID") = ? OR mpesaMerchantRequestId = ? OR mpesaCheckoutRequestId = ? OR reference = ? OR phone = ?');
      stmt.bind([merchantRequestId || '', checkoutRequestId || '', merchantRequestId || '', checkoutRequestId || '', accountRef || '', phoneNumber || '']);
      if (stmt.step()) {
        row = stmt.get();
        matchedBy = 'direct-query';
      }
      try { stmt.free(); } catch (e) {}
    } catch (e) {
      // fallback to scanning all mpesa orders for matching ids
      const res = db.exec('SELECT id, mpesa FROM orders');
      const vals = res?.[0]?.values || [];
      for (const v of vals) {
        const id = v[0];
        const mp = v[1] && typeof v[1] === 'string' ? JSON.parse(v[1]) : v[1];
        if (mp && (mp.MerchantRequestID === merchantRequestId || mp.CheckoutRequestID === checkoutRequestId)) {
          row = [id, JSON.stringify(mp)];
          matchedBy = 'fallback-mpesa-json';
          break;
        }
      }
    }

    // additional heuristics when direct lookup did not yield a result: try matching by AccountReference, phone suffix or by scanning mpesa JSON blobs
    if (!row) {
      try {
        const resAll = db.exec('SELECT id, reference, phone, mpesa, createdAt FROM orders WHERE paymentMethod = "mpesa"');
        const vals = resAll?.[0]?.values || [];
        for (const v of vals) {
          const id = v[0];
          const ref = v[1];
          const ph = v[2];
          const mpRaw = v[3];
          const mp = mpRaw && typeof mpRaw === 'string' ? JSON.parse(mpRaw) : mpRaw;
          if (accountRef && String(ref) === String(accountRef)) { row = [id, JSON.stringify(mp)]; matchedBy = 'reference'; break; }
          if (mp && (mp.MerchantRequestID === merchantRequestId || mp.CheckoutRequestID === checkoutRequestId)) { row = [id, JSON.stringify(mp)]; matchedBy = 'mpesa-json'; break; }
          if (phoneNumber && ph && String(ph).slice(-6) === String(phoneNumber).slice(-6)) { row = [id, JSON.stringify(mp)]; matchedBy = 'phone-suffix'; break; }
        }
      } catch (e) { console.warn('mpesa order scan failed', e); }

      if (!row) {
        console.warn('Order not found for mpesa callback', merchantRequestId, checkoutRequestId, accountRef, phoneNumber);
        // send admin alert with the full payload for debugging
        try {
          const payloadStr = JSON.stringify(body, null, 2).replace(/</g, '&lt;');
          const html = `<div><p>Unmatched Mpesa callback received at ${new Date().toISOString()}</p><pre style="white-space:pre-wrap">${payloadStr}</pre></div>`;
          await sendOrderEmail(process.env.EMAIL?.replace(/\"/g, '')?.trim(), `Unmatched Mpesa callback`, html);
          console.log('Sent unmatched-callback alert email to admin');
        } catch (e) { console.warn('Failed to send unmatched-callback email', e); }

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      } else {
        console.log('Mpesa callback matched order by', matchedBy, 'id', row[0]);
      }
    }

    if (!row) {
      console.warn('Order not found for mpesa callback', merchantRequestId, checkoutRequestId, accountRef);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const orderId = row[0];
    let orderMpesaRaw = row[1];
    let orderMpesa = null;
    try { orderMpesa = orderMpesaRaw ? (typeof orderMpesaRaw === 'string' ? JSON.parse(orderMpesaRaw) : orderMpesaRaw) : {}; } catch (e) { orderMpesa = orderMpesaRaw; }

    if (resultCode === 0 || resultCode === '0') {
      // success
      // extract transaction details if CallbackMetadata exists
      let tx = null;
      try {
        const cb = callback?.Body?.stkCallback || callback;
        const items = cb?.CallbackMetadata?.Item || cb?.CallbackMetadata || null;
        if (Array.isArray(items)) {
          tx = {};
          for (const it of items) {
            if (it && it.Name && typeof it.Value !== 'undefined') tx[it.Name] = it.Value;
          }
        }
      } catch (e) { tx = null; }

      const updatedMpesa = { ...orderMpesa, callback, transaction: tx };
      let dbUpdateOk = false;
      try {
        // append statusHistory
        const fetchHist = db.prepare('SELECT statusHistory FROM orders WHERE id = ?');
        fetchHist.bind([orderId]);
        let histRaw = null;
        if (fetchHist.step()) histRaw = fetchHist.get()[0];
        try { fetchHist.free(); } catch (e) {}
        const hist = histRaw ? (typeof histRaw === 'string' ? JSON.parse(histRaw) : histRaw) : [];
        hist.push({ status: 'paid', changedAt: new Date().toISOString(), by: 'mpesa-callback' });

        const stmt2 = db.prepare('UPDATE orders SET paid = ?, status = ?, mpesa = ?, statusHistory = ? WHERE id = ?');
        stmt2.run([1, 'paid', JSON.stringify(updatedMpesa), JSON.stringify(hist), orderId]);
        try { stmt2.free(); } catch (e) {}
        await saveDB();

        // verify persistence immediately (read back the row)
        try {
          const verifyStmt = db.prepare('SELECT paid, status FROM orders WHERE id = ?');
          verifyStmt.bind([orderId]);
          let vrow = null;
          if (verifyStmt.step()) vrow = verifyStmt.get();
          try { verifyStmt.free(); } catch (ee) {}
          const persistedPaid = vrow ? vrow[0] : null;
          const persistedStatus = vrow ? vrow[1] : null;
          console.log('Mpesa callback: verify persisted', { orderId, persistedPaid, persistedStatus });
          if (persistedPaid === 1 || persistedStatus === 'paid') dbUpdateOk = true;
        } catch (ee) {
          console.warn('Mpesa callback: verification failed', ee);
        }

        console.log('Mpesa callback: order', orderId, 'marked as paid', { merchantRequestId, checkoutRequestId, accountRef, phoneNumber });
      } catch (e) {
        console.error('db update paid failed', e);
        try {
          const stmtErr = db.prepare('UPDATE orders SET lastMpesaUpdateError = ? WHERE id = ?');
          stmtErr.run([String(e && e.message ? e.message : e), orderId]);
          try { stmtErr.free(); } catch (ee) {}
          await saveDB();
        } catch (ee) { console.warn('failed to persist mpesa update error', ee); }

        // Enqueue recovery job when update throws
        try {
          const jobId = `mq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
          const jobPayload = JSON.stringify({ body, merchantRequestId, checkoutRequestId, error: String(e) });
          const insertQ = db.prepare('INSERT OR IGNORE INTO mpesa_queue (id, orderId, payload, reason, attempts, nextAttempt, createdAt, lastError) VALUES (?,?,?,?,?,?,?,?)');
          insertQ.run([jobId, orderId, jobPayload, String(e && e.message ? e.message : e), 0, new Date().toISOString(), new Date().toISOString(), String(e && e.message ? e.message : e)]);
          try { insertQ.free(); } catch (ee) {}
          await saveDB();
          console.log('Enqueued mpesa recovery job after exception', jobId, 'for order', orderId);
        } catch (ee) { console.warn('failed to enqueue mpesa recovery job after exception', ee); }
      }

      // send confirmation email to customer + admin with invoice
      try {
        // fetch full order
        const fetchStmt = db.prepare('SELECT id, name, email, phone, reference, items, total, shipping, shippingAddress, shippingLocation, paymentMethod, createdAt FROM orders WHERE id = ?');
        fetchStmt.bind([orderId]);
        let orderRow = null;
        if (fetchStmt.step()) orderRow = fetchStmt.get();
        try { fetchStmt.free(); } catch (e) {}
        if (orderRow) {
          const orderObj = {
            id: orderRow[0],
            name: orderRow[1],
            email: orderRow[2],
            phone: orderRow[3],
            reference: orderRow[4],
            items: orderRow[5] ? JSON.parse(orderRow[5]) : [],
            total: Number(orderRow[6] || 0),
            shipping: Number(orderRow[7] || 0),
            shippingAddress: orderRow[8] ? JSON.parse(orderRow[8]) : null,
            shippingLocation: orderRow[9] ? JSON.parse(orderRow[9]) : null,
            paymentMethod: orderRow[10] || 'mpesa',
            createdAt: orderRow[11] || new Date().toISOString(),
          };

          const { buildPaymentReceivedUserEmail, buildPaymentReceivedAdminEmail } = await import('@/utils/email');
          const userHtml = buildPaymentReceivedUserEmail(orderObj, updatedMpesa.transaction || null);
          const adminHtml = buildPaymentReceivedAdminEmail(orderObj, updatedMpesa.transaction || null);

          try {
            if (!dbUpdateOk) {
              const msg = 'Payment callback matched but DB update verification failed (order not marked paid after update)';
              console.error(msg, { orderId, merchantRequestId, checkoutRequestId });
              try {
                const stmtErr = db.prepare('UPDATE orders SET lastMpesaUpdateError = ? WHERE id = ?');
                stmtErr.run([msg, orderId]);
                try { stmtErr.free(); } catch (ee) {}
                await saveDB();
              } catch (ee) { console.warn('failed to persist mpesa update verification error', ee); }

              // Alert admin with full payload for manual reconciliation
              try {
                const payloadStr = JSON.stringify(body, null, 2).replace(/</g, '&lt;');
                const html = `<div><p>Payment received but DB update did not persist for order ${orderId} (check lastMpesaUpdateError)</p><pre style="white-space:pre-wrap">${payloadStr}</pre></div>`;
                await sendOrderEmail(process.env.EMAIL?.replace(/\"/g, '')?.trim(), `Payment received but DB update failed for ${orderObj.reference}`, html);
                console.log('Admin alerted about mpesa db update issue for order', orderId);
              } catch (e) { console.warn('failed to alert admin about mpesa db update issue', e); }

              // Enqueue recovery job for automatic retry
              try {
                const jobId = `mq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
                const jobPayload = JSON.stringify({ body, merchantRequestId, checkoutRequestId });
                const insertQ = db.prepare('INSERT OR IGNORE INTO mpesa_queue (id, orderId, payload, reason, attempts, nextAttempt, createdAt, lastError) VALUES (?,?,?,?,?,?,?,?)');
                insertQ.run([jobId, orderId, jobPayload, msg, 0, new Date().toISOString(), new Date().toISOString(), null]);
                try { insertQ.free(); } catch (e) {}
                await saveDB();
                console.log('Enqueued mpesa recovery job', jobId, 'for order', orderId);
              } catch (e) { console.warn('failed to enqueue mpesa recovery job', e); }

            } else {
              // Only send customer email when DB update actually persisted
              if (orderObj.email) await sendOrderEmail(orderObj.email, `Payment received — thank you (Order ${orderObj.reference})`, userHtml);
              await sendOrderEmail(process.env.EMAIL?.replace(/\"/g, '')?.trim(), `Payment received ${orderObj.reference}`, adminHtml);
            }
          } catch (e) {
            console.error('email send failed', e);
            try {
              const stmtErr = db.prepare('UPDATE orders SET lastMpesaUpdateError = ? WHERE id = ?');
              stmtErr.run([String(e && e.message ? e.message : e), orderId]);
              try { stmtErr.free(); } catch (ee) {}
              await saveDB();
            } catch (ee) { console.warn('failed to persist mpesa email error', ee); }
          }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } else {
      // failed
      const updatedMpesa = { ...orderMpesa, callback };
      try {
        // append to statusHistory
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
    }
  } catch (e) {
    console.error('mpesa callback error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
}
*/

