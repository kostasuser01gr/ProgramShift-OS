// GET /api/schedule — cached schedule + derived coverage/warnings/stats.
import { NextResponse } from 'next/server';
import { getCachedSchedule } from '@/lib/cache';
import { coverage, warnings, stats } from '@/lib/compute';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const schedule = await getCachedSchedule();
    return NextResponse.json({
      month: 'June 2026',
      schedule,
      coverage: coverage(schedule),
      warnings: warnings(schedule),
      stats: stats(schedule),
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
