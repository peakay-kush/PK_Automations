import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src', 'data', 'tutorials.json');
function readTutorialsFile() {
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.tutorials || [];
  } catch (err) {
    return [];
  }
}

export async function GET(req, { params }) {
  try {
    const id = params.id;
    const tutorials = readTutorialsFile();
    if (!tutorials || tutorials.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Try numeric id, then slug, then title (case-insensitive)
    let t = tutorials.find(x => String(x.id) === String(id));
    if (!t) t = tutorials.find(x => x.slug === id);
    if (!t) t = tutorials.find(x => (x.title || '').toLowerCase() === (id || '').toLowerCase());
    if (!t) {
      try { const decoded = decodeURIComponent(id); t = tutorials.find(x => String(x.id) === String(decoded) || x.slug === decoded || (x.title || '').toLowerCase() === decoded.toLowerCase()); } catch (e) {}
    }

    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(t);
  } catch (err) {
    console.error('[api/tutorials/[id] GET] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}