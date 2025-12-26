export function ksh(n) {
  return `KSh ${Number(n || 0).toLocaleString()}`;
}

function itemsTableHtml(items) {
  const rows = (items || []).map(it => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${it.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${it.quantity || 1}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${ksh(it.price || 0)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${ksh((Number(it.price || 0)) * (Number(it.quantity || 1)))}</td>
    </tr>
  `).join('\n');

  return `
    <table style="width:100%;border-collapse:collapse;margin-top:12px">
      <thead>
        <tr style="background:#f7fafc;color:#333;text-align:left"><th style="padding:8px">Product</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Unit</th><th style="padding:8px;text-align:right">Total</th></tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

export function buildOrderCreatedEmail(order) {
  const subtotal = Number(order.total || 0) - Number(order.shipping || 0);
  const shipping = Number(order.shipping || 0);
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:680px;margin:0 auto">
    <h2 style="color:#0B63FF;margin-bottom:6px">PK Automations — Order Received</h2>
    <p style="margin:6px 0">Thank you <strong>${order.name}</strong>, your order <strong>${order.reference}</strong> has been received.</p>
    <div style="border:1px solid #e6edf3;padding:12px;border-radius:6px;background:#fbfdff">
      <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:8px"><div><strong>Payment</strong><div style="font-size:0.95rem">${order.paymentMethod}</div></div><div style="text-align:right"><strong>${ ksh(order.total)}</strong></div></div>
      <div style="font-size:0.95rem;color:#444">Placed: ${new Date(order.createdAt).toLocaleString()}</div>
    </div>

    <h3 style="margin-top:14px">Items</h3>
    ${itemsTableHtml(order.items || [])}

    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:12px;font-size:0.95rem">
      <div>Subtotal: <strong>${ksh(subtotal)}</strong></div>

      <div>Shipping: <strong>${ksh(shipping)}</strong></div>
    </div>

    <div style="margin-top:12px;padding:10px;border-radius:6px;background:#f4f8fb">Total Amount: <strong style="font-size:1.1rem">${ksh(order.total)}</strong></div>

    <h4 style="margin-top:14px">Delivery</h4>
    <p style="font-size:0.95rem;color:#444">${order.shippingAddress ? `${order.shippingAddress.line || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.county || ''}` : 'Pickup / N/A'}</p>

    <h4 style="margin-top:10px">Contact</h4>
    <p style="font-size:0.95rem;color:#444">${order.email || ''}<br/>${order.phone || ''}</p>

    <p style="margin-top:16px;color:#666;font-size:0.9rem">If you have any questions, reply to this email.</p>
  </div>
  `;
}

export function buildPaymentReceivedEmail(order, tx) {
  // Backwards compatible generic template (kept for legacy usage) — calls the user-friendly template
  return buildPaymentReceivedUserEmail(order, tx);
}

export function buildOrderCreatedUserEmail(order) {
  const subtotal = Number(order.total || 0) - Number(order.shipping || 0);
  const shipping = Number(order.shipping || 0);
  return `
  <div style="font-family:Inter,Arial,Helvetica,sans-serif;color:#222;max-width:680px;margin:0 auto">
    <h2 style="color:#0B63FF;margin-bottom:6px">Thank you — we received your order</h2>
    <p style="margin:6px 0">Hi <strong>${order.name}</strong>, thank you for your order <strong>${order.reference}</strong>. We have received it and will process it shortly.</p>

    <div style="border:1px solid #eef6ff;padding:12px;border-radius:8px;background:#fbfdff;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;gap:12px"><div>
        <div style="font-size:0.95rem">Payment method: <strong>${order.paymentMethod}</strong></div>
      </div><div style="text-align:right"><strong style="font-size:1.05rem">${ksh(order.total)}</strong></div></div>
      <div style="font-size:0.9rem;color:#444">Placed: ${new Date(order.createdAt).toLocaleString()}</div>
    </div>

    <h3 style="margin-top:12px">Order summary</h3>
    ${itemsTableHtml(order.items || [])}

    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:12px;font-size:0.95rem">
      <div>Subtotal: <strong>${ksh(subtotal)}</strong></div>
      <div>Shipping: <strong>${ksh(shipping)}</strong></div>
    </div>

    <div style="margin-top:12px;padding:12px;border-radius:8px;background:#f4f8fb">Total: <strong style="font-size:1.1rem">${ksh(order.total)}</strong></div>

    <h4 style="margin-top:14px">Delivery</h4>
    <p style="font-size:0.95rem;color:#444">${order.shippingAddress ? `${order.shippingAddress.line || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.county || ''}` : 'Pickup / N/A'}</p>

    <h4 style="margin-top:10px">Contact</h4>
    <p style="font-size:0.95rem;color:#444">${order.email || ''}<br/>${order.phone || ''}</p>

    <p style="margin-top:16px;color:#666;font-size:0.95rem">If you have any questions, simply reply to this email — we'll get back to you shortly.</p>
  </div>
  `;
}

export function buildOrderCreatedAdminEmail(order) {
  const subtotal = Number(order.total || 0) - Number(order.shipping || 0);
  const shipping = Number(order.shipping || 0);
  return `
  <div style="font-family:Inter,Arial,Helvetica,sans-serif;color:#222;max-width:720px;margin:0 auto">
    <h2 style="color:#0B63FF;margin-bottom:6px">New order received</h2>
    <p style="margin:6px 0">Order <strong>${order.reference}</strong> was placed by <strong>${order.name}</strong> (${order.email || 'no email'} / ${order.phone || 'no phone'}).</p>

    <div style="border:1px solid #eef6ff;padding:12px;border-radius:8px;background:#fbfdff;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;gap:12px"><div>
        <div style="font-size:0.95rem">Payment method: <strong>${order.paymentMethod}</strong></div>
      </div><div style="text-align:right"><strong style="font-size:1.05rem">${ksh(order.total)}</strong></div></div>
      <div style="font-size:0.9rem;color:#444">Placed: ${new Date(order.createdAt).toLocaleString()}</div>
    </div>

    <h3 style="margin-top:12px">Order details</h3>
    ${itemsTableHtml(order.items || [])}

    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:12px;font-size:0.95rem">
      <div>Subtotal: <strong>${ksh(subtotal)}</strong></div>
      <div>Shipping: <strong>${ksh(shipping)}</strong></div>
    </div>

    <div style="margin-top:12px;padding:12px;border-radius:8px;background:#fff6f0">Customer: <strong>${order.name}</strong> — ${order.email || ''} — ${order.phone || ''}</div>

    <p style="margin-top:16px;color:#666;font-size:0.95rem">This message is for the admin team. If you need to take any action, visit the admin dashboard.</p>
  </div>
  `;
}

export function buildPaymentReceivedUserEmail(order, tx) {
  const subtotal = Number(order.total || 0) - Number(order.shipping || 0);
  const shipping = Number(order.shipping || 0);
  return `
  <div style="font-family:Inter,Arial,Helvetica,sans-serif;color:#222;max-width:680px;margin:0 auto">
    <h2 style="color:#00A650;margin-bottom:6px">Payment received — thank you</h2>
    <p style="margin:6px 0">Hi <strong>${order.name}</strong>, we received your payment for order <strong>${order.reference}</strong>. Below is a summary of your payment.</p>

    <div style="border:1px solid #e6f4ea;padding:12px;border-radius:8px;background:#f6fffb;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;gap:12px"><div>
        <div style="font-size:0.95rem">Payment method: <strong>${order.paymentMethod}</strong></div>
        <div style="font-size:0.95rem">Amount: <strong>${ksh(tx?.Amount || order.total)}</strong></div>
        ${tx?.MpesaReceiptNumber ? `<div style="font-size:0.95rem">Receipt: <strong>${tx.MpesaReceiptNumber}</strong></div>` : ''}
        ${tx?.TransactionDate ? `<div style="font-size:0.95rem">Date: <strong>${tx.TransactionDate}</strong></div>` : ''}
      </div><div style="text-align:right"><strong style="font-size:1.05rem">${ksh(tx?.Amount || order.total)}</strong></div></div>
    </div>

    <h3 style="margin-top:8px">Order summary</h3>
    ${itemsTableHtml(order.items || [])}

    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:12px;font-size:0.95rem">
      <div>Subtotal: <strong>${ksh(subtotal)}</strong></div>
      <div>Shipping: <strong>${ksh(shipping)}</strong></div>
    </div>

    <div style="margin-top:12px;padding:12px;border-radius:8px;background:#f4f8fb">Total Paid: <strong style="font-size:1.1rem">${ksh(tx?.Amount || order.total)}</strong></div>

    <h4 style="margin-top:14px">Contact</h4>
    <p style="font-size:0.95rem;color:#444">${order.email || ''}<br/>${order.phone || ''}</p>

    <p style="margin-top:16px;color:#666;font-size:0.95rem">If you have any questions, reply to this email.</p>
  </div>
  `;
}

export function buildPaymentReceivedAdminEmail(order, tx) {
  const subtotal = Number(order.total || 0) - Number(order.shipping || 0);
  const shipping = Number(order.shipping || 0);
  return `
  <div style="font-family:Inter,Arial,Helvetica,sans-serif;color:#222;max-width:720px;margin:0 auto">
    <h2 style="color:#00A650;margin-bottom:6px">Payment received</h2>
    <p style="margin:6px 0">Payment for order <strong>${order.reference}</strong> has been received. Customer: <strong>${order.name}</strong> (${order.email || 'no email'} / ${order.phone || 'no phone'}).</p>

    <div style="border:1px solid #e6f4ea;padding:12px;border-radius:8px;background:#f6fffb;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;gap:12px"><div>
        <div style="font-size:0.95rem">Payment method: <strong>${order.paymentMethod}</strong></div>
        <div style="font-size:0.95rem">Amount: <strong>${ksh(tx?.Amount || order.total)}</strong></div>
        ${tx?.MpesaReceiptNumber ? `<div style="font-size:0.95rem">Receipt: <strong>${tx.MpesaReceiptNumber}</strong></div>` : ''}
      </div><div style="text-align:right"><strong style="font-size:1.05rem">${ksh(tx?.Amount || order.total)}</strong></div></div>
    </div>

    <h3 style="margin-top:8px">Order summary</h3>
    ${itemsTableHtml(order.items || [])}

    <div style="margin-top:12px;padding:12px;border-radius:8px;background:#fff6f0">Customer: <strong>${order.name}</strong> — ${order.email || ''} — ${order.phone || ''}</div>

    <p style="margin-top:16px;color:#666;font-size:0.95rem">This message is for the admin team.</p>
  </div>
  `;
}

export function buildStatusChangeUserEmail(order, status, entry) {
  return `
  <div style="font-family:Inter,Arial,Helvetica,sans-serif;color:#222;max-width:680px;margin:0 auto">
    <h2 style="color:#0B63FF;margin-bottom:6px">Order update</h2>
    <p style="margin:6px 0">Hi <strong>${order.name}</strong>, the status of your order <strong>${order.reference}</strong> has been updated to <strong>${status}</strong>.</p>
    <p style="font-size:0.95rem;color:#444">Changed by: ${entry.by} — ${entry.changedAt}</p>
    <p style="margin-top:12px;color:#666;font-size:0.95rem">If you have questions, reply to this email.</p>
  </div>
  `;
}

export function buildStatusChangeAdminEmail(order, status, entry) {
  return `
  <div style="font-family:Inter,Arial,Helvetica,sans-serif;color:#222;max-width:720px;margin:0 auto">
    <h2 style="color:#0B63FF;margin-bottom:6px">Order status updated</h2>
    <p style="margin:6px 0">Order <strong>${order.reference}</strong> status changed to <strong>${status}</strong> by <strong>${entry.by}</strong>.</p>
    <p style="font-size:0.95rem;color:#444">Customer: ${order.name || ''} — ${order.email || ''} — ${order.phone || ''}</p>
  </div>
  `;
}
