(async ()=>{
  try {
    const fs = await import('fs');
    const payload = JSON.parse(await fs.promises.readFile(new URL('mpesa_sim_payload.json', import.meta.url)));
    const res = await fetch('https://unfearing-billi-unmummified.ngrok-free.dev/api/mpesa/callback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const text = await res.text();
    await fs.promises.writeFile(new URL('mpesa_callback_response.json', import.meta.url), text);
    console.log('Status', res.status);
    console.log(text);
  } catch (e) {
    console.error('callback send failed', e);
    process.exit(1);
  }
})();
