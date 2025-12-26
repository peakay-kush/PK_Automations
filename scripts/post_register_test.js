(async () => {
  const bases = [process.env.TEST_SERVER, 'http://localhost:3000', 'http://localhost:3001'].filter(Boolean);
  const payload = { name: 'Test', email: `test+${Date.now()}@example.com`, password: 'pass123' };

  for (const base of bases) {
    const url = `${base.replace(/\/$/, '')}/api/auth/register/`;
    console.log('Trying', url);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('STATUS', res.status, 'URL', url);
      const text = await res.text();
      console.log('BODY', text);
      break;
    } catch (e) {
      console.error('ERROR POST', url, e.message || e);
    }
  }
})();
