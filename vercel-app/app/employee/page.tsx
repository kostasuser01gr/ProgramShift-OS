// Employee home — the team week (read-only) from live Sheets data. A stub of the
// employee mobile experience; the full PWA UI is in the design prototype.
import { getCachedSchedule } from '@/lib/cache';
import { CAT_COLOR, category } from '@/lib/shifts';
import { currentRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function EmployeePage() {
  const { email } = await currentRole();
  const s = await getCachedSchedule();

  // First 7 days as "this week" for the demo.
  const days = s.dates.slice(0, 7);

  return (
    <div className="wrap">
      <div className="head">
        <div>
          <h1>This week</h1>
          <div className="muted">June 2026 · signed in as {email ?? 'guest'}</div>
        </div>
      </div>

      <div className="gridwrap">
        <table>
          <thead>
            <tr>
              <th className="nm">Employee</th>
              {days.map((d) => <th key={d.day} style={d.weekend ? { background: '#e7dfcc' } : undefined}>{d.day}</th>)}
            </tr>
          </thead>
          <tbody>
            {s.employees.map((e) => (
              <tr key={e.ame}>
                <td className="nm">{e.surname}</td>
                {days.map((_, j) => {
                  const sh = e.shifts[j];
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
        Employees see their own month and the team week, and submit swap / leave <strong>requests</strong> a
        manager approves — they never write the grid directly. The full mobile PWA (calendar, requests, prefs,
        notifications) is in the design prototype.
      </div>
    </div>
  );
}
