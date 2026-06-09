import assert from 'node:assert/strict';
import test from 'node:test';
import { roleFor } from '../lib/config';
import { stats } from '../lib/compute';
import { parseShift, normalizeShiftValue } from '../lib/shifts';
import { validateCellMutation } from '../lib/validation';
import { weekWindow } from '../lib/calendar';
import type { Schedule } from '../lib/sheets';

test('roleFor uses normalized environment allowlists', () => {
  const previousOwners = process.env.OWNER_EMAILS;
  const previousManagers = process.env.MANAGER_EMAILS;
  process.env.OWNER_EMAILS = ' owner@example.com ';
  process.env.MANAGER_EMAILS = 'manager@example.com,second@example.com';
  try {
    assert.equal(roleFor('OWNER@example.com'), 'owner');
    assert.equal(roleFor('second@example.com'), 'manager');
    assert.equal(roleFor('employee@example.com'), 'employee');
  } finally {
    process.env.OWNER_EMAILS = previousOwners;
    process.env.MANAGER_EMAILS = previousManagers;
  }
});

test('cell mutation validation rejects writes outside the schedule grid', () => {
  assert.equal(validateCellMutation({ ame: '6044', dayIndex: -1, value: 'ΡΕΠΟ' }).ok, false);
  assert.equal(validateCellMutation({ ame: '6044', dayIndex: 30, value: 'ΡΕΠΟ' }).ok, false);
  assert.equal(validateCellMutation({ ame: 'not-an-id', dayIndex: 0, value: 'ΡΕΠΟ' }).ok, false);
  assert.equal(validateCellMutation({ ame: '6044', dayIndex: 0, value: '=IMPORTXML()' }).ok, false);

  const valid = validateCellMutation({ ame: ' 6044 ', dayIndex: 0, value: ' r ' });
  assert.deepEqual(valid, { ok: true, data: { ame: '6044', dayIndex: 0, value: 'ΡΕΠΟ' } });
});

test('shift parsing rejects invalid clock values', () => {
  assert.equal(parseShift('25:00-07:00'), null);
  assert.equal(parseShift('22:61-07:00'), null);
  assert.equal(parseShift('22:00-06:00')?.hours, 8);
  assert.equal(normalizeShiftValue(' 07:00-15:00 '), '07:00-15:00');
});

test('empty schedules produce finite zero averages', () => {
  const result = stats({ dates: [], employees: [] });
  assert.deepEqual(result.avg, { days: 0, hours: 0, nights: 0, wknd: 0, repo: 0 });
});

test('weekWindow selects the current Monday-to-Sunday range', () => {
  const dates: Schedule['dates'] = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 5, index + 1));
    return {
      day: index + 1,
      dow: date.getUTCDay(),
      weekend: date.getUTCDay() === 0 || date.getUTCDay() === 6,
      iso: date.toISOString().slice(0, 10),
    };
  });
  assert.deepEqual(
    weekWindow(dates, new Date(2026, 5, 9)).map((date) => date.day),
    [8, 9, 10, 11, 12, 13, 14],
  );
});
