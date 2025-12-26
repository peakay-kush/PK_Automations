(async () => {
  try {
    const fs = require('fs');
    const payload = {
      name: 'Test User',
      phone: '254700000000',
      email: 'test@example.com',
      paymentMethod: 'mpesa',
      items: [{ id: 9999, name: 'Test Product', price: 200, quantity: 1 }],
      subtotal: 200,
      total: 200,
      shipping: 0
    };

    const res = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    fs.writeFileSync('scripts/last_checkout_response.json', text);
    console.log(text);
  } catch (e) {
    console.error('Error creating test order', e);
    process.exit(1);
  }
})();
