// lib/cache.ts — in-memory cache per serverless instance.
// Vercel KV removed: zero cost, and the Google Sheets API quota (300 req/min)
// is far above what 29 employees will ever generate.
import { CACHE_TTL } from './config';
import { getSchedule, type Schedule } from './sheets';

let cached: { data: Schedule; ts: number } | null = null;
let pending: Promise<Schedule> | null = null;

export async function getCachedSchedule(): Promise<Schedule> {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL * 1000) return cached.data;
  if (pending) return pending;

  pending = getSchedule()
    .then((data) => {
      cached = { data, ts: Date.now() };
      return data;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

export async function invalidateSchedule(): Promise<void> {
  cached = null;
}
