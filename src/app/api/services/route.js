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

export async function GET() {
  try {
    const services = readServicesFile();
    return NextResponse.json(services);
  } catch (err) {
    console.error('[api/services] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
