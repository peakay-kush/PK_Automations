export async function GET() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dataPath = path.join(process.cwd(), 'src', 'data', 'shipping.json');
    if (!fs.existsSync(dataPath)) return new Response(JSON.stringify({ locations: [] }), { status: 200 });
    const raw = fs.readFileSync(dataPath, 'utf8');
    const json = JSON.parse(raw);
    return new Response(JSON.stringify({ locations: json.locations || [] }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
}