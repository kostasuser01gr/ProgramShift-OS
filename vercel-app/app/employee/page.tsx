// Employee home — the current team week, read-only from live Sheets data.
import { getCachedSchedule } from '@/lib/cache';
import { CAT_COLOR, category } from '@/lib/shifts';
import { currentRole } from '@/lib/auth';
import { AppHeader } from '@/components/app-header';
import { MONTH } from '@/lib/config';
import { weekWindow } from '@/lib/calendar';

export const dynamic = 'force-dynamic';

export default async function EmployeePage() {
  const { email, role } = await currentRole();
  const s = await getCachedSchedule();

  const days = weekWindow(s.dates);
  const firstDayIndex = s.dates.findIndex((date) => date.iso === days[0]?.iso);

  return (
    <>
      <AppHeader role={role} email={email} />
      <main className="wrap">
      <div className="head">
        <div>
          <h1>This week</h1>
          <div className="muted">{MONTH.label} · team view</div>
        </div>
      </div>

      <div className="gridwrap">
        <table>
          <caption className="sr-only">Team shifts for the selected week</caption>
          <thead>
            <tr>
              <th className="nm" scope="col">Employee</th>
              {days.map((d) => <th key={d.iso} scope="col" className={d.weekend ? 'weekend' : undefined}>{d.day}</th>)}
            </tr>
          </thead>
          <tbody>
            {s.employees.map((e) => (
              <tr key={e.ame}>
                <th className="nm" scope="row">{e.surname}</th>
                {days.map((_, j) => {
                  const sh = e.shifts[firstDayIndex + j] ?? '';
                  const c = CAT_COLOR[category(sh)];
                  const short = category(sh) === 'repo' ? 'Ρ' : category(sh) === 'leave' ? 'Α' : (sh.split('-')[0] || '');
                  return <td key={j}><span className="chip" style={{ background: c.bg, color: c.fg, borderColor: c.bd }} title={sh}>{short}</span></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="note">
        This production view is read-only. Swap and leave requests remain available only in the local design prototype
        until their server-side workflow is implemented.
      </div>
      </main>
    </>
  );
}
