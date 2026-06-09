// lib/shifts.ts — shift parsing, categories and the code↔text map.
// Ported 1:1 from the prototype / Apps Script so the app and the sheet agree.

export type Category =
  | 'empty' | 'repo' | 'leave' | 'night' | 'late' | 'midday' | 'morning' | 'invalid';

export const CODE_TO_SHIFT: Record<string, string> = {
  '422': '04:00-12:00', '201': '05:00-13:00', '202': '06:00-14:00', '203': '07:00-15:00',
  '403': '07:30-15:30', '301': '08:00-16:00', '206': '09:00-17:00', '208': '10:00-18:00',
  '209': '10:30-18:30', '210': '11:00-19:00', '211': '12:00-20:00', '404': '12:30-20:30',
  '212': '13:00-21:00', '405': '13:30-21:30', '213': '14:00-22:00', '406': '14:30-22:30',
  '214': '15:00-23:00', '402': '15:30-23:30', '215': '16:00-00:00', '333': '17:00-01:00',
  '218': '18:00-02:00', '216': '22:00-06:00', '217': '23:00-07:00',
  '243': '07:00-13:40', '232': '08:00-14:40', '233': '09:00-15:40', '234': '10:00-16:40',
  '235': '11:00-17:40', '236': '12:00-18:40', '237': '13:00-19:40', '238': '14:00-20:40',
  '239': '15:00-21:40', '240': '16:00-22:40', '241': '16:30-23:10', '242': '17:00-23:40',
  'R': 'ΡΕΠΟ',
};

export const TEXT_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CODE_TO_SHIFT).map(([code, text]) => [text, code]),
);

export const LEAVE_VALUES = [
  'ΑΔΕΙΑ 5ΗΜΕΡΟΥ',
  'ΑΔΕΙΑ 6ΗΜΕΡΟΥ',
  'ΑΝΑΡΡΩΤΙΚΗ 5ΗΜΕΡΟΥ',
  'ΑΝΑΡΡΩΤΙΚΗ 6ΗΜΕΡΟΥ',
] as const;

export const SHIFT_VALUES = [
  '',
  ...Object.values(CODE_TO_SHIFT),
  ...LEAVE_VALUES,
] as const;

// Colours (same palette as the sheet's conditional formatting).
export const CAT_COLOR: Record<Category, { bg: string; fg: string; bd: string }> = {
  empty: { bg: '#FFFFFF', fg: '#9a9286', bd: '#E3DDD0' },
  repo: { bg: '#EFEFEF', fg: '#6c655a', bd: '#dcdcdc' },
  leave: { bg: '#F4CCCC', fg: '#8a3b3b', bd: '#e6b3b3' },
  night: { bg: '#B4A7D6', fg: '#3a2d63', bd: '#9a8bc4' },
  late: { bg: '#FCE5CD', fg: '#8a5a1e', bd: '#f0cfa8' },
  midday: { bg: '#CFE2F3', fg: '#28567e', bd: '#aecbe8' },
  morning: { bg: '#D9EAD3', fg: '#3f6b41', bd: '#bcd9b2' },
  invalid: { bg: '#CC0000', fg: '#ffffff', bd: '#a30000' },
};

export function parseShift(s: string): { start: number; end: number; hours: number; startHour: number } | null {
  const m = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/.exec((s || '').trim());
  if (!m) return null;
  const startHour = +m[1];
  const startMinute = +m[2];
  const endHour = +m[3];
  const endMinute = +m[4];
  if (startHour > 23 || endHour > 23 || startMinute > 59 || endMinute > 59) return null;
  const start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;
  if (end <= start) end += 1440; // crosses midnight
  return { start, end, hours: (end - start) / 60, startHour };
}

export const isRepo = (s: string) => s?.trim() === 'ΡΕΠΟ' || s?.trim() === 'R';
export const isLeave = (s: string) => /ΑΔΕΙΑ|ΑΝΑΡΡΩΤΙΚΗ/.test(s || '');

export function category(s: string): Category {
  if (!s) return 'empty';
  if (isRepo(s)) return 'repo';
  if (isLeave(s)) return 'leave';
  const t = parseShift(s);
  if (!t) return 'invalid';
  const h = t.startHour;
  if (h === 22 || h === 23) return 'night';
  if (h >= 15 && h <= 18) return 'late';
  if (h >= 12 && h <= 14) return 'midday';
  if (h >= 4 && h <= 11) return 'morning';
  return 'invalid';
}

// Map a human shift to its CODED equivalent (leave/unknown pass through).
export function toCode(text: string): string {
  const t = (text || '').trim();
  if (!t) return '';
  if (isRepo(t)) return 'R';
  return TEXT_TO_CODE[t] ?? t;
}

export function normalizeShiftValue(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'R') return 'ΡΕΠΟ';
  return SHIFT_VALUES.includes(normalized as (typeof SHIFT_VALUES)[number]) ? normalized : null;
}
