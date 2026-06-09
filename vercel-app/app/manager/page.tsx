// Manager home — live schedule, validated single-cell editing, and rule warnings.
import { getCachedSchedule } from '@/lib/cache';
import { coverage, warnings } from '@/lib/compute';
import { CAT_COLOR, category } from '@/lib/shifts';
import { currentRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { ManagerEditor } from '@/components/manager-editor';
import { MONTH } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function ManagerPage() {
  const { role, email } = await currentRole();
  if (role === 'employee') redirect('/employee');

  const s = await getCachedSchedule();
  const cov = coverage(s);
  const warn = warnings(s);
  const low = cov.filter((c) => c.status === 'low').length;
  const nights = cov.reduce((a, c) => a + c.night, 0);

  return (
    <>
      <AppHeader role={role} email={email} />
      <main className="wrap">
      <div className="head">
        <div>
          <h1>Schedule — {MONTH.label}</h1>
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
          <caption className="sr-only">Monthly employee shift schedule</caption>
          <thead>
            <tr>
              <th className="nm" scope="col">Employee</th>
              {s.dates.map((d) => <th key={d.iso} scope="col" className={d.weekend ? 'weekend' : undefined}>{d.day}</th>)}
            </tr>
          </thead>
          <tbody>
            {s.employees.map((e) => (
              <tr key={e.ame}>
                <th className="nm" scope="row">{e.surname} <span style={{ color: 'var(--faint)', fontWeight: 400 }}>{e.first}</span></th>
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

      <div className="twocol">
        <ManagerEditor
          employees={s.employees.map(({ ame, name }) => ({ ame, name }))}
          days={s.dates.map(({ day, iso }) => ({ day, iso }))}
        />
        <section className="panel" aria-labelledby="warnings-title">
          <h2 id="warnings-title">Priority warnings</h2>
          {warn.length === 0 ? (
            <p className="muted">No schedule rule warnings found.</p>
          ) : (
            <ul className="warninglist">
              {warn.slice(0, 6).map((item) => (
                <li key={`${item.ame}-${item.day}-${item.type}`}>
                  <strong>{item.empName}</strong>
                  <span>{item.dateLabel} · {item.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      </main>
    </>
  );
}
