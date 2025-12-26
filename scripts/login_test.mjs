(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pk.automations.ke@gmail.com', password: 'A@12345678' })
    });
    console.log('STATUS', res.status);
    const json = await res.json();
    console.log('BODY', { ok: json.ok, user: json.user });
    if (json.token) console.log('Token received (hidden)');
  } catch (e) {
    console.error('ERROR', e);
  }
})();