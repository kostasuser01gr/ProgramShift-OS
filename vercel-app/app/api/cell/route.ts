// POST /api/cell — write one shift cell. Managers/owners only.
// Body: { ame: string, dayIndex: number, value: string }
import { NextResponse } from 'next/server';
import { setCell } from '@/lib/sheets';
import { invalidateSchedule } from '@/lib/cache';
import { currentRole } from '@/lib/auth';

export async function POST(req: Request) {
  const { role } = await currentRole();
  if (role !== 'manager' && role !== 'owner')
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }); }
  const { ame, dayIndex, value } = body || {};
  if (typeof ame !== 'string' || typeof dayIndex !== 'number' || typeof value !== 'string')
    return NextResponse.json({ error: 'expected { ame, dayIndex, value }' }, { status: 400 });

  try {
    const a1 = await setCell(ame, dayIndex, value);
    await invalidateSchedule();   // next read reflects the write immediately
    return NextResponse.json({ ok: true, a1 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
