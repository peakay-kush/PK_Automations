import { NextResponse } from 'next/server';

async function readTutorialsFile() {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'tutorials.json');
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.tutorials || [];
  } catch (err) {
    return [];
  }
}

export async function GET() {
  try {
    const tutorials = await readTutorialsFile();
    return NextResponse.json(tutorials);
  } catch (err) {
    console.error('[api/tutorials] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
