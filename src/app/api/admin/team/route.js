import patchUrlParse from '@/utils/patchUrlParse';
patchUrlParse();
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

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
async function await writeTeamFile(data) {
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', 'team.json');
  const json = { team: data };
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
}

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const team = await readTeamFile();
    return NextResponse.json(team);
  } catch (err) {
    console.error('[api/admin/team] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const body = await req.json();
    if (!body || !body.name) return NextResponse.json({ error: 'Invalid payload: name required' }, { status: 422 });
    const team = await readTeamFile();
    const id = Date.now();
    const newMember = Object.assign({ id }, body);
    team.push(newMember);
    await writeTeamFile(team);
    return NextResponse.json({ ok: true, member: newMember }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/team POST] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}