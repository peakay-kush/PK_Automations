export async function POST(req) {
  try {
    const body = await req.json();
    const { county, city, postcode } = body || {};

    // TODO: Replace this local zone logic with a real G4S API integration.
    // When you liaise with G4S, use process.env.G4S_API_URL and process.env.G4S_API_KEY to call their rates API.

    // Use admin-managed shipping.json when available
    try {
      const fs = await import('fs');
      const path = await import('path');
      const dataPath = path.join(process.cwd(), 'src', 'data', 'shipping.json');
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf8');
        const json = JSON.parse(raw);
        const list = json.locations || [];
        const q = (county || city || postcode || '').toLowerCase();
        // find best match
        for (const loc of list) {
          if (Array.isArray(loc.matches) && loc.matches.some(m => q.includes(m))) {
            return new Response(JSON.stringify({ ok: true, shipping: Number(loc.charge || 0), note: loc.note || loc.name }), { status: 200 });
          }
          if (loc.name && q.includes((loc.name || '').toLowerCase())) {
            return new Response(JSON.stringify({ ok: true, shipping: Number(loc.charge || 0), note: loc.note || loc.name }), { status: 200 });
          }
        }
        // fallback to first entry if nothing matched
        if (list.length > 0) return new Response(JSON.stringify({ ok: true, shipping: Number(list[list.length-1].charge || 0), note: list[list.length-1].note || list[list.length-1].name }), { status: 200 });
      }
    } catch (e) {
      console.warn('shipping lookup error', e);
    }

    // Default fallback if shipping.json not available
    // Basic zone mapping fallback (developer-friendly defaults):
    // - Nairobi County (metropolitan) => KSh 300
    // - Kiambu / Machakos / Kajiado (near Nairobi) => KSh 600
    // - Elsewhere => KSh 1500
    const c = (county || city || '').toLowerCase();
    let shipping = 1500;
    let note = 'Standard courier rates (placeholder)';
    if (c.includes('nairobi')) {
      shipping = 300;
      note = 'Nairobi metro rate (placeholder)';
    } else if (c.includes('kiambu') || c.includes('machakos') || c.includes('kajiado') || c.includes('thika') || c.includes('ngong')) {
      shipping = 600;
      note = 'Nearby counties rate (placeholder)';
    }

    return new Response(JSON.stringify({ ok: true, shipping, note }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
}