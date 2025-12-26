import { NextResponse } from 'next/server';

// PDF proxy disabled — site no longer supports inline PDF viewing or proxying
export async function GET() {
  return NextResponse.json({ error: 'PDF support removed' }, { status: 410 });
} 
