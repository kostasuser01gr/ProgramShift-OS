// POST /api/cell — write one shift cell. Managers/owners only.
// Body: { ame: string, dayIndex: number, value: string }
import { NextResponse } from 'next/server';
import { setCell } from '@/lib/sheets';
import { invalidateSchedule } from '@/lib/cache';
import { currentRole } from '@/lib/auth';
import { validateCellMutation } from '@/lib/validation';

export async function POST(req: Request) {
  const { role } = await currentRole();
  if (role !== 'manager' && role !== 'owner')
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }); }
  const parsed = validateCellMutation(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const a1 = await setCell(parsed.data.ame, parsed.data.dayIndex, parsed.data.value);
    await invalidateSchedule();   // next read reflects the write immediately
    return NextResponse.json({ ok: true, a1 });
  } catch (error) {
    console.error('Failed to update schedule cell', error);
    return NextResponse.json({ error: 'schedule update failed' }, { status: 503 });
  }
}
