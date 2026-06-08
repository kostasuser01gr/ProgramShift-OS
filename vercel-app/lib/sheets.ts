// lib/sheets.ts — the SheetsRepository. The ONLY place that touches Google.
// Swap this file for a PostgresRepository in phase 3; nothing upstream changes.
import { sheetsClient, colA1 } from './google';
import { SHEET_ID, TABS, GRID, A1_GRID } from './config';
import { category, type Category } from './shifts';

export type Employee = {
  idx: number; ame: string; surname: string; first: string; name: string;
  shifts: string[]; cats: Category[];
};
export type DayMeta = { day: number; dow: number; weekend: boolean; iso: string };
export type Schedule = { dates: DayMeta[]; employees: Employee[] };

function toDate(v: any): Date | null {
  if (v instanceof Date) return v;
  // Sheets returns serial numbers when valueRenderOption=UNFORMATTED.
  if (typeof v === 'number') return new Date(Date.UTC(1899, 11, 30) + v * 86400000);
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(String(v).trim());
  if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return new Date(y, +m[2] - 1, +m[1]); }
  return null;
}

/** Read the whole grid in one call and shape it into a Schedule. */
export async function getSchedule(): Promise<Schedule> {
  const api = sheetsClient();
  const res = await api.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: A1_GRID, valueRenderOption: 'FORMATTED_VALUE',
  });
  const rows = res.data.values || [];
  const header = rows[0] || [];

  const nCols = GRID.lastCol - GRID.firstCol + 1;
  const dates: DayMeta[] = [];
  for (let c = 0; c < nCols; c++) {
    const d = toDate(header[GRID.firstCol - 1 + c]) ?? new Date(2026, 5, c + 1);
    dates.push({ day: d.getDate(), dow: d.getDay(), weekend: d.getDay() === 0 || d.getDay() === 6, iso: d.toISOString().slice(0, 10) });
  }

  const employees: Employee[] = [];
  for (let r = GRID.firstRow - 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const ame = String(row[GRID.colAme - 1] ?? '').trim();
    if (!ame || ame === '0') continue; // skip filler 0,0,0 rows
    const shifts: string[] = [];
    for (let c = 0; c < nCols; c++) shifts.push(String(row[GRID.firstCol - 1 + c] ?? '').trim());
    employees.push({
      idx: employees.length, ame,
      surname: String(row[GRID.colSurname - 1] ?? '').trim(),
      first: String(row[GRID.colName - 1] ?? '').trim(),
      name: `${row[GRID.colSurname - 1] ?? ''} ${row[GRID.colName - 1] ?? ''}`.trim(),
      shifts, cats: shifts.map(category),
    });
  }
  return { dates, employees };
}

/**
 * Write a single shift cell, addressed by employee ΑΜΕ + day index (0-based).
 * Returns the A1 it wrote. The bound Apps Script then mirrors it into CODED and
 * fires the webhook — so we only ever write the human-readable ΩΡΑΡΙΑ sheet.
 */
export async function setCell(ame: string, dayIndex: number, value: string): Promise<string> {
  const api = sheetsClient();
  // find the row of this employee
  const idRes = await api.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TABS.oraria}!${colA1(GRID.colAme)}${GRID.firstRow}:${colA1(GRID.colAme)}${GRID.lastRow}`,
  });
  const ids = (idRes.data.values || []).map((r) => String(r[0] ?? '').trim());
  const offset = ids.indexOf(ame);
  if (offset < 0) throw new Error(`Unknown ΑΜΕ ${ame}`);

  const row = GRID.firstRow + offset;
  const col = colA1(GRID.firstCol + dayIndex);
  const a1 = `${TABS.oraria}!${col}${row}`;
  await api.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range: a1, valueInputOption: 'RAW',
    requestBody: { values: [[value]] },
  });
  return a1;
}
