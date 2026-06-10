type Entry = { count: number; resetAt: number };

const registrations = new Map<string, Entry>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function allowRegistration(key: string, now = Date.now()): boolean {
  if (registrations.size > 5000) {
    for (const [storedKey, entry] of registrations) {
      if (entry.resetAt <= now) registrations.delete(storedKey);
    }
  }

  const entry = registrations.get(key);
  if (!entry || entry.resetAt <= now) {
    registrations.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count += 1;
  return true;
}
