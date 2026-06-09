import { GRID } from './config';
import { normalizeShiftValue } from './shifts';

export type CellMutation = {
  ame: string;
  dayIndex: number;
  value: string;
};

export type ValidationResult =
  | { ok: true; data: CellMutation }
  | { ok: false; error: string };

export function validateCellMutation(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Expected a JSON object.' };
  }

  const body = input as Record<string, unknown>;
  const ame = typeof body.ame === 'string' ? body.ame.trim() : '';
  if (!/^\d{1,12}$/.test(ame)) {
    return { ok: false, error: 'Employee ID must contain 1-12 digits.' };
  }

  const dayIndex = body.dayIndex;
  if (!Number.isInteger(dayIndex) || (dayIndex as number) < 0 || (dayIndex as number) >= GRID.days) {
    return { ok: false, error: `dayIndex must be an integer from 0 to ${GRID.days - 1}.` };
  }

  if (typeof body.value !== 'string') {
    return { ok: false, error: 'Shift value must be a string.' };
  }
  const value = normalizeShiftValue(body.value);
  if (value === null) {
    return { ok: false, error: 'Shift value is not in the approved schedule list.' };
  }

  return { ok: true, data: { ame, dayIndex: dayIndex as number, value } };
}
