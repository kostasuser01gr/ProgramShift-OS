// GET /api/schedule — cached schedule + derived coverage/warnings/stats.
import { NextResponse } from 'next/server';
import { getCachedSchedule } from '@/lib/cache';
import { coverage, warnings, stats } from '@/lib/compute';
import { currentRole } from '@/lib/auth';
import { MONTH } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { authenticated } = await currentRole();
  if (!authenticated) {
    return NextResponse.json({ error: 'authentication required' }, { status: 401 });
  }

  try {
    const schedule = await getCachedSchedule();
    const response = NextResponse.json({
      month: MONTH.label,
      schedule,
      coverage: coverage(schedule),
      warnings: warnings(schedule),
      stats: stats(schedule),
    });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('Failed to load schedule', error);
    return NextResponse.json({ error: 'schedule unavailable' }, { status: 503 });
  }
}
