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

export async function GET(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    const team = await readTeamFile();
    const m = team.find((x) => x.id === id);
    if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(m);
  } catch (err) {
    console.error('[api/admin/teams/[id] GET] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    const body = await req.json();
    const team = await readTeamFile();
    const idx = team.findIndex((x) => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = Object.assign({}, team[idx], body);
    team[idx] = updated;
    await writeTeamFile(team);
    return NextResponse.json({ ok: true, member: updated });
  } catch (err) {
    console.error('[api/admin/teams/[id] PUT] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    let team = await readTeamFile();
    const idx = team.findIndex((x) => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    team.splice(idx, 1);
    await writeTeamFile(team);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/teams/[id] DELETE] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}