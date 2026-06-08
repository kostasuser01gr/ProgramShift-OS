// Manager home — renders the live schedule from Google Sheets (server-side),
// plus coverage + warning summaries. This is a thin demo of the data path; the
// full interactive UI is the prototype in the design package.
import { getCachedSchedule } from '@/lib/cache';
import { coverage, warnings } from '@/lib/compute';
import { CAT_COLOR, category } from '@/lib/shifts';
import { currentRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ManagerPage() {
  const { role } = await currentRole();
  if (role === 'employee') redirect('/employee');

  const s = await getCachedSchedule();
  const cov = coverage(s);
  const warn = warnings(s);
  const low = cov.filter((c) => c.status === 'low').length;
  const nights = cov.reduce((a, c) => a + c.night, 0);

  return (
    <div className="wrap">
      <div className="head">
        <div>
          <h1>Schedule — June 2026</h1>
          <div className="muted">{s.employees.length} employees · {s.dates.length} days · live from Google Sheets</div>
        </div>
        <div className="muted">Role: {role}</div>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="v">{s.employees.length}</div><div className="k">Employees</div></div>
        <div className="kpi"><div className="v" style={{ color: low ? 'var(--accent)' : undefined }}>{low}</div><div className="k">Understaffed days</div></div>
        <div className="kpi"><div className="v">{nights}</div><div className="k">Night shifts</div></div>
        <div className="kpi"><div className="v">{warn.length}</div><div className="k">Warnings</div></div>
      </div>

      <div className="gridwrap">
        <table>
          <thead>
            <tr>
              <th className="nm">Employee</th>
              {s.dates.map((d) => <th key={d.day} style={d.weekend ? { background: '#e7dfcc' } : undefined}>{d.day}</th>)}
            </tr>
          </thead>
          <tbody>
            {s.employees.map((e) => (
              <tr key={e.ame}>
                <td className="nm">{e.surname} <span style={{ color: 'var(--faint)', fontWeight: 400 }}>{e.first}</span></td>
                {e.shifts.map((sh, j) => {
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
        Editing writes one cell via <code>POST /api/cell</code> (managers/owners only) → the bound Apps Script
        mirrors it into <code>CODED</code> and fires the webhook → the cache is invalidated. The full grid UI,
        coverage chart, warnings inbox, requests and fairness views live in the design prototype.
      </div>
    </div>
  );
}
