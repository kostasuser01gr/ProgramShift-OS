'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SHIFT_VALUES } from '@/lib/shifts';

type EmployeeOption = { ame: string; name: string };
type DayOption = { day: number; iso: string };

export function ManagerEditor({
  employees,
  days,
}: {
  employees: EmployeeOption[];
  days: DayOption[];
}) {
  const router = useRouter();
  const [ame, setAme] = useState(employees[0]?.ame ?? '');
  const [dayIndex, setDayIndex] = useState('0');
  const [value, setValue] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('saving');
    setMessage('');

    try {
      const response = await fetch('/api/cell', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ame, dayIndex: Number(dayIndex), value }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'The schedule could not be updated.');
      setState('success');
      setMessage('Shift saved. The schedule has been refreshed.');
      router.refresh();
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'The schedule could not be updated.');
    }
  }

  if (employees.length === 0 || days.length === 0) {
    return <section className="panel"><h2>Edit shift</h2><p className="muted">No schedule rows are available to edit.</p></section>;
  }

  return (
    <section className="panel" aria-labelledby="edit-title">
      <div>
        <h2 id="edit-title">Edit one shift</h2>
        <p className="muted">Changes are written to ΩΡΑΡΙΑ and validated against the approved shift list.</p>
      </div>
      <form className="editform" onSubmit={submit}>
        <label>
          Employee
          <select value={ame} onChange={(event) => setAme(event.target.value)}>
            {employees.map((employee) => <option key={employee.ame} value={employee.ame}>{employee.name} · {employee.ame}</option>)}
          </select>
        </label>
        <label>
          Day
          <select value={dayIndex} onChange={(event) => setDayIndex(event.target.value)}>
            {days.map((day, index) => <option key={day.iso} value={index}>{day.iso} · day {day.day}</option>)}
          </select>
        </label>
        <label>
          Shift
          <select value={value} onChange={(event) => setValue(event.target.value)}>
            {SHIFT_VALUES.map((shift) => <option key={shift || 'empty'} value={shift}>{shift || 'Clear cell'}</option>)}
          </select>
        </label>
        <button className="button primary" type="submit" disabled={state === 'saving'}>
          {state === 'saving' ? 'Saving…' : 'Save shift'}
        </button>
      </form>
      <p className={`formstatus ${state}`} aria-live="polite">{message}</p>
    </section>
  );
}
