// lib/compute.ts — coverage / warnings / fairness, derived from a Schedule.
// Same rules as the bound Apps Script validator and the prototype.
import { STAFF, RULES } from './config';
import { parseShift, isLeave } from './shifts';
import type { Schedule } from './sheets';

export type Coverage = {
  day: number; dow: number; weekend: boolean;
  working: number; repo: number; leave: number; night: number; total: number;
  status: 'low' | 'ok' | 'high';
};
export type Warning = {
  sev: 'hard' | 'soft'; empName: string; ame: string; day: number; dateLabel: string;
  type: string; message: string;
};
export type StatRow = { idx: number; name: string; ame: string; days: number; hours: number; nights: number; wknd: number; repo: number };

export function coverage(s: Schedule): Coverage[] {
  return s.dates.map((dd, j) => {
    let working = 0, repo = 0, leave = 0, night = 0, total = 0;
    for (const e of s.employees) {
      const c = e.cats[j];
      if (c === 'empty') continue;
      total++;
      if (c === 'repo') repo++;
      else if (c === 'leave') leave++;
      else { working++; if (c === 'night') night++; }
    }
    const status = working < STAFF.min ? 'low' : working > STAFF.max ? 'high' : 'ok';
    return { day: dd.day, dow: dd.dow, weekend: dd.weekend, working, repo, leave, night, total, status };
  });
}

export function warnings(s: Schedule): Warning[] {
  const out: Warning[] = [];
  const D = s.dates;
  for (const e of s.employees) {
    let nightRun = 0, workRun = 0;
    for (let j = 0; j < e.shifts.length; j++) {
      const t = parseShift(e.shifts[j]);
      const push = (sev: Warning['sev'], type: string, message: string, j2?: number) =>
        out.push({ sev, empName: e.name, ame: e.ame, day: D[j].day, type, message, dateLabel: `${D[j].day}/6${j2 != null ? `→${D[j2].day}/6` : ''}` });

      if (t && (t.startHour === 22 || t.startHour === 23)) {
        if (++nightRun === RULES.maxNights + 1) push('hard', 'nights', `More than ${RULES.maxNights} consecutive nights`);
      } else nightRun = 0;

      if (t) {
        if (++workRun === RULES.maxWork + 1) push('hard', 'streak', `More than ${RULES.maxWork} workdays without a day off`);
      } else workRun = 0;

      if (t && j + 1 < e.shifts.length) {
        const nx = parseShift(e.shifts[j + 1]);
        if (nx) {
          const rest = 1440 + nx.start - t.end;
          if (rest >= 0 && rest < RULES.minRest * 60) push('hard', 'rest', `${(rest / 60).toFixed(1)}h rest (<${RULES.minRest}h) before next shift`, j + 1);
        }
      }
      if (t && j > 0 && j + 1 < e.shifts.length && isLeave(e.shifts[j - 1]) && isLeave(e.shifts[j + 1]))
        push('soft', 'sandwich', 'Shift between two leave days — likely a typo');
    }
  }
  out.sort((a, b) => (a.empName < b.empName ? -1 : a.empName > b.empName ? 1 : a.day - b.day));
  return out;
}

export function stats(s: Schedule): { rows: StatRow[]; avg: Record<string, number> } {
  const rows: StatRow[] = s.employees.map((e) => {
    let days = 0, hours = 0, nights = 0, wknd = 0, repo = 0;
    for (let j = 0; j < e.shifts.length; j++) {
      const c = e.cats[j];
      if (c === 'repo') { repo++; continue; }
      if (c === 'leave' || c === 'empty') continue;
      const t = parseShift(e.shifts[j]);
      if (!t) continue;
      days++; hours += t.hours; if (c === 'night') nights++; if (s.dates[j].weekend) wknd++;
    }
    return { idx: e.idx, name: e.name, ame: e.ame, days, hours: Math.round(hours * 10) / 10, nights, wknd, repo };
  });
  const avg: Record<string, number> = {};
  for (const k of ['days', 'hours', 'nights', 'wknd', 'repo'] as const)
    avg[k] = Math.round((rows.reduce((a, r) => a + (r as any)[k], 0) / rows.length) * 10) / 10;
  return { rows, avg };
}
