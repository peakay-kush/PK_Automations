import { NextResponse } from 'next/server';

async function readServicesFile() {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'services.json');
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.services || [];
  } catch (err) {
    return [];
  }
}

export async function GET() {
  try {
    const services = await readServicesFile();
    return NextResponse.json(services);
  } catch (err) {
    console.error('[api/services] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
