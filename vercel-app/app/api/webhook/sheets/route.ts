// POST /api/webhook/sheets — called by the bound Apps Script when ΩΡΑΡΙΑ changes
// (someone edited the sheet directly). We just bust the cache; the next read is
// fresh. Authenticated with a shared secret in the X-Secret header.
import { NextResponse } from 'next/server';
import { invalidateSchedule } from '@/lib/cache';
import { timingSafeEqual } from 'node:crypto';

function validSecret(provided: string | null): boolean {
  const expected = process.env.WEBHOOK_SECRET;
  if (!provided || !expected || expected.length < 24) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!validSecret(req.headers.get('x-secret')))
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Body (optional): { a1, oldV, newV, editor } — useful for audit/SSE later.
  try { await req.json(); } catch { /* body is optional */ }

  try {
    await invalidateSchedule();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to invalidate schedule cache', error);
    return NextResponse.json({ error: 'cache invalidation failed' }, { status: 503 });
  }
}
