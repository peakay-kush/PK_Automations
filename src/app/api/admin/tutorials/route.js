import patchUrlParse from '@/utils/patchUrlParse';
patchUrlParse();
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/utils/serverAuth';

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
function writeTutorialsFile(tutorials) {
  const json = { tutorials };
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
}

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const tutorials = readTutorialsFile();
    return NextResponse.json(tutorials);
  } catch (err) {
    console.error('[api/admin/tutorials] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;

  try {
    const body = await req.json();
    if (!body || !body.title || !body.slug) return NextResponse.json({ error: 'Invalid payload: title and slug required' }, { status: 422 });
    const tutorials = readTutorialsFile();
    const id = Date.now();
    if (body.images && !Array.isArray(body.images)) body.images = [body.images];
    const newTut = Object.assign({ id }, body);
    if (!newTut.image && newTut.images && newTut.images.length > 0) newTut.image = newTut.images[0];
    if (!newTut.thumbnail && newTut.images && newTut.images.length > 0) newTut.thumbnail = newTut.images[0];
    tutorials.push(newTut);
    writeTutorialsFile(tutorials);
    return NextResponse.json({ ok: true, tutorial: newTut }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/tutorials POST] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
