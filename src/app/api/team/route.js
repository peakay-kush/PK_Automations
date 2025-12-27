import { NextResponse } from 'next/server';

async function readTeamFile() {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'team.json');
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.team || [];
  } catch (err) {
    return [];
  }
}

export async function GET() {
  try {
    const team = await readTeamFile();
    return NextResponse.json(team);
  } catch (err) {
    console.error('[api/team] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}