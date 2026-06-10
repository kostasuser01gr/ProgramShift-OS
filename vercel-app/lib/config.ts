// lib/config.ts — single source of truth for geometry, thresholds and roles.

export const SHEET_ID = process.env.SCHEDULE_SHEET_ID!;

export const TABS = { oraria: 'ΩΡΑΡΙΑ', coded: 'CODED', users: 'USERS' } as const;

// Grid geometry — identical to the Apps Script CONFIG.GRID.
export const GRID = {
  headerRow: 1,            // row 1 = dates
  firstRow: 2,             // employees from row 2
  lastRow: 200,            // generous: new employees auto-appear
  firstCol: 4,             // D = day 1
  lastCol: 33,             // AG = day 30
  colAme: 1, colSurname: 2, colName: 3,
  days: 30,
};

// A1 of the whole input grid (header + employees), used for one-shot reads.
export const A1_GRID = `${TABS.oraria}!A1:AG200`;

export const STAFF = { min: 12, max: 24 };
export const RULES = { minRest: 11, maxNights: 4, maxWork: 6 };

export const MONTH = { year: 2026, month: 6, label: 'June 2026' };

export const CACHE_KEY = 'schedule:2026-06';
export const CACHE_TTL = 60; // seconds

// ── role mapping ───────────────────────────────────────────────────────────
// Comma-separated environment variables keep authorization out of source code.
// Everyone not explicitly listed remains a view-only employee.
export type Role = 'owner' | 'manager' | 'employee';

function emailSet(value?: string): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function roleFor(email?: string | null): Role {
  if (!email) return 'employee';
  const normalized = email.trim().toLowerCase();
  if (emailSet(process.env.OWNER_EMAILS).has(normalized)) return 'owner';
  if (emailSet(process.env.MANAGER_EMAILS).has(normalized)) return 'manager';
  return 'employee';
}
