// POST /api/webhook/sheets — called by the bound Apps Script when ΩΡΑΡΙΑ changes
// (someone edited the sheet directly). We just bust the cache; the next read is
// fresh. Authenticated with a shared secret in the X-Secret header.
import { NextResponse } from 'next/server';
import { invalidateSchedule } from '@/lib/cache';

export async function POST(req: Request) {
  if (req.headers.get('x-secret') !== process.env.WEBHOOK_SECRET)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Body (optional): { a1, oldV, newV, editor } — useful for audit/SSE later.
  try { await req.json(); } catch { /* body is optional */ }

  await invalidateSchedule();
  return NextResponse.json({ ok: true });
}
