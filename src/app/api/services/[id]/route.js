import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src', 'data', 'services.json');
function readServicesFile() {
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.services || [];
  } catch (err) {
    return [];
  }
}

export async function GET(req, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const services = readServicesFile();
    const s = services.find((x) => x.id === id);
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(s);
  } catch (err) {
    console.error('[api/services/[id] GET] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
