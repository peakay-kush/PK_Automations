import patchUrlParse from '@/utils/patchUrlParse';
patchUrlParse();
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

const dataPath = path.join(process.cwd(), 'src', 'data', 'team.json');
function readTeamFile() {
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {
    const json = JSON.parse(raw);
    return json.team || [];
  } catch (err) {
    return [];
  }
}
function writeTeamFile(team) {
  const json = { team };
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
}

export async function GET(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const id = parseInt(params.id, 10);
    const team = readTeamFile();
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
    const team = readTeamFile();
    const idx = team.findIndex((x) => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = Object.assign({}, team[idx], body);
    team[idx] = updated;
    writeTeamFile(team);
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
    let team = readTeamFile();
    const idx = team.findIndex((x) => x.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    team.splice(idx, 1);
    writeTeamFile(team);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/teams/[id] DELETE] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}