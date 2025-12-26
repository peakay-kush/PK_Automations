import patchUrlParse from '@/utils/patchUrlParse';
patchUrlParse();
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/utils/serverAuth';

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

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const team = readTeamFile();
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
    const team = readTeamFile();
    const id = Date.now();
    const newMember = Object.assign({ id }, body);
    team.push(newMember);
    writeTeamFile(team);
    return NextResponse.json({ ok: true, member: newMember }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/team POST] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}