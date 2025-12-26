// archived - mpesa worker removed
console.log('mpesa queue worker archived');
process.exit(0);


async function sendOrderEmail(to, subject, html) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL?.replace(/"/g, '')?.trim(), pass: process.env.PASSWORD?.replace(/"/g, '')?.trim() }
  });
  await transporter.sendMail({ from: process.env.EMAIL?.replace(/"/g, '')?.trim(), to, subject, html });
}

async function processJob(job) {
  const db = await getDB();
  const { id, orderId, payload, attempts } = job;
  let parsed = null;
  try { parsed = typeof payload === 'string' ? JSON.parse(payload) : payload; } catch (e) { parsed = { body: payload }; }

  // fetch order
  const stmt = db.prepare('SELECT paid, email, reference, items, total, shipping, shippingAddress, shippingLocation, mpesa, statusHistory FROM orders WHERE id = ?');
  stmt.bind([orderId]);
  let row = null;
  if (stmt.step()) row = stmt.get();
  try { stmt.free(); } catch (e) {}

  if (!row) {
    // no order: mark job as failed permanently
    const msg = `order not found ${orderId}`;
    const upd = db.prepare('UPDATE mpesa_queue SET attempts = attempts + 1, lastError = ?, nextAttempt = ? WHERE id = ?');
    upd.run([msg, new Date(Date.now() + backoffMs(attempts+1)).toISOString(), id]);
    try { upd.free(); } catch (e) {}
    await saveDB();
    console.warn(msg, id);
    return;
  }

  const [paid, email, reference, itemsRaw, total, shipping, shippingAddressRaw, shippingLocationRaw, mpesaRaw, statusHistoryRaw] = row;
  if (paid === 1 || (statusHistoryRaw && typeof statusHistoryRaw === 'string' && statusHistoryRaw.includes('paid'))) {
    // already paid: remove job
    const del = db.prepare('DELETE FROM mpesa_queue WHERE id = ?');
    del.run([id]);
    try { del.free(); } catch (e) {}
    await saveDB();
    console.log('Job removed: order already paid', id, orderId);
    return;
  }

  // Try to mark paid
  try {
    const mp = mpesaRaw && typeof mpesaRaw === 'string' ? JSON.parse(mpesaRaw) : (mpesaRaw || {});
    const tx = parsed?.body?.Body?.stkCallback?.CallbackMetadata?.Item || parsed?.body?.CallbackMetadata?.Item || null;
    const txObj = {};
    if (Array.isArray(tx)) {
      for (const it of tx) { if (it && it.Name && typeof it.Value !== 'undefined') txObj[it.Name] = it.Value; }
    }
    const updatedMpesa = { ...mp, recovered: true, payload: parsed, transaction: txObj };

    const hist = statusHistoryRaw ? (typeof statusHistoryRaw === 'string' ? JSON.parse(statusHistoryRaw) : statusHistoryRaw) : [];
    hist.push({ status: 'paid', changedAt: new Date().toISOString(), by: 'mpesa-queue-worker' });

    const stmt2 = db.prepare('UPDATE orders SET paid = ?, status = ?, mpesa = ?, statusHistory = ? WHERE id = ?');
    stmt2.run([1, 'paid', JSON.stringify(updatedMpesa), JSON.stringify(hist), orderId]);
    try { stmt2.free(); } catch (e) {}
    await saveDB();

    // verify
    const verifyStmt = db.prepare('SELECT paid, status FROM orders WHERE id = ?');
    verifyStmt.bind([orderId]);
    let vrow = null;
    if (verifyStmt.step()) vrow = verifyStmt.get();
    try { verifyStmt.free(); } catch (e) {}
    const persistedPaid = vrow ? vrow[0] : null;
    const persistedStatus = vrow ? vrow[1] : null;

    if (persistedPaid === 1 || persistedStatus === 'paid') {
      // remove job
      const del = db.prepare('DELETE FROM mpesa_queue WHERE id = ?');
      del.run([id]);
      try { del.free(); } catch (e) {}
      await saveDB();

      // send emails
      const items = itemsRaw ? JSON.parse(itemsRaw) : [];
      const shippingAddr = shippingAddressRaw ? JSON.parse(shippingAddressRaw) : null;
      const shippingLoc = shippingLocationRaw ? JSON.parse(shippingLocationRaw) : null;
      const invoiceHtml = `<div>Payment recovered for ${reference}</div>`; // keep short — you can expand
      try { if (email) await sendOrderEmail(email, `Payment received for Order ${reference}`, invoiceHtml); await sendOrderEmail(process.env.EMAIL?.replace(/"/g, '')?.trim(), `Payment recovered ${reference}`, invoiceHtml); } catch(e){ console.warn('worker email failed', e); }

      console.log('Job processed and removed', id, orderId);
      return;
    } else {
      throw new Error('verification after update failed');
    }
  } catch (e) {
    console.error('Job processing failed', id, e);
    const attemptsNew = (attempts || 0) + 1;
    const next = new Date(Date.now() + backoffMs(attemptsNew)).toISOString();
    try {
      const upd = db.prepare('UPDATE mpesa_queue SET attempts = ?, lastError = ?, nextAttempt = ? WHERE id = ?');
      upd.run([attemptsNew, String(e && e.message ? e.message : e), next, id]);
      try { upd.free(); } catch (ee) {}
      await saveDB();
    } catch (ee) { console.warn('failed to persist queue retry update', ee); }

    // escalate after N attempts
    const MAX = Number(process.env.MPESA_QUEUE_MAX_ATTEMPTS || 5);
    if (attemptsNew >= MAX) {
      try {
        const payloadStr = payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)) : 'n/a';
        const html = `<div><p>Mpesa queue job failed ${attemptsNew} times</p><pre>${payloadStr}</pre><p>last error: ${String(e)}</p></div>`;
        await sendOrderEmail(process.env.EMAIL?.replace(/"/g, '')?.trim(), `Mpesa queue job failed for order ${orderId}`, html);
      } catch (ee) { console.warn('failed to alert admin after repeated attempts', ee); }
    }
  }
}

async function fetchJobs(db, nowIso) {
  const stmt = db.prepare('SELECT id, orderId, payload, reason, attempts, nextAttempt FROM mpesa_queue WHERE nextAttempt <= ? ORDER BY attempts ASC LIMIT 10');
  stmt.bind([nowIso]);
  const jobs = [];
  while (stmt.step()) {
    const r = stmt.get();
    jobs.push({ id: r[0], orderId: r[1], payload: r[2], reason: r[3], attempts: r[4], nextAttempt: r[5] });
  }
  try { stmt.free(); } catch (e) {}
  return jobs;
}

(async () => {
  console.log('Mpesa queue worker starting');
  const POLL_MS = Number(process.env.MPESA_QUEUE_POLL_MS || 5000);
  while (true) {
    try {
      const db = await getDB();
      const now = new Date().toISOString();
      const jobs = await fetchJobs(db, now);
      for (const j of jobs) {
        try { await processJob(j); } catch (e) { console.error('processing job error', j.id, e); }
      }
    } catch (e) { console.error('worker loop error', e); }
    await sleep(POLL_MS);
  }
})();
