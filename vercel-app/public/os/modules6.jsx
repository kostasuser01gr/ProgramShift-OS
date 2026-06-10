/* ============================================================================
 *  os/modules6.jsx — Department dashboards + protected Admin control center.
 *  Department view adapts to the signed-in supervisor's role/department, pulling
 *  live data from coverage, warnings, reservations and members.
 * ========================================================================== */

/* dept metadata keyed by supervisor role */
var DEPT_BY_ROLE = {
  owner:           { dept: 'all',        el: 'Επιθεώρηση & Διοίκηση', en: 'Inspection & Management', icon: 'badge', tint: '#b5482b' },
  inspector:       { dept: 'inspection', el: 'Επιθεώρηση Προγράμματος', en: 'Program Inspection', icon: 'badge', tint: '#b5482b' },
  coordinator:     { dept: 'station',    el: 'Συντονισμός Σταθμού', en: 'Station Coordination', icon: 'pulse', tint: '#3f6b41' },
  cs_supervisor:   { dept: 'customer',   el: 'Εξυπηρέτηση Πελατών', en: 'Customer Service', icon: 'message', tint: '#2f5d77' },
  fleet_supervisor:{ dept: 'fleet',      el: 'Διαχείριση Στόλου', en: 'Fleet Management', icon: 'idcard', tint: '#9a6b16' },
  manager:         { dept: 'all',        el: 'Διαχείριση', en: 'Management', icon: 'users', tint: '#2f5d77' }
};

function DepartmentModule() {
  const ctx = useOS(); const { lang, role, derived, month } = ctx; const OS = window.OS; const en = lang === 'en';
  if (!OS.isSupervisor(role)) return <DeniedModule perm="schedule.view" />;
  const meta = DEPT_BY_ROLE[role] || DEPT_BY_ROLE.manager;
  const busy = window.computeBusyDays(ctx);
  const res = OS.Reservations.all();
  const today = month.today || 1;
  const todayCov = derived.coverage[today - 1] || { working: 0 };
  const hardWarn = derived.warnings.filter(function (w) { return w.sev === 'hard'; }).length;

  // department-specific reservation slice
  const deptRes = meta.dept === 'all' ? res : res.filter(function (r) {
    if (meta.dept === 'fleet') return r.type === 'return' || r.type === 'inspection' || r.type === 'service';
    if (meta.dept === 'customer') return r.type === 'delivery';
    return true;
  });
  const upcoming = deptRes.filter(function (r) { return r.day >= today; }).sort(function (a, b) { return a.day - b.day; }).slice(0, 8);
  const overloaded = busy.filter(function (b) { return b.cls === 'overloaded' || b.cls === 'verybusy'; });

  // staff in this supervisor's scope (by dept for the seeded supervisors)
  const team = OS.Members.list().filter(function (m) { return !m.removed && m.role === 'employee'; });

  function Card(title, value, sub, color) {
    return <div className="os-kpi"><div className="k">{title}</div><div className="v" style={color ? { color: color } : {}}>{value}</div>{sub && <div className="d">{sub}</div>}</div>;
  }

  return (
    <div className="os-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 6 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: meta.tint + '22', color: meta.tint, display: 'grid', placeItems: 'center' }}><Icon name={meta.icon} size={22} /></div>
        <div><h2 className="pg" style={{ margin: 0 }}>{en ? meta.en : meta.el}</h2><div className="pgsub" style={{ margin: 0 }}>{window.t('role_' + role, lang)} · {en ? month.label.en : month.label.el}</div></div>
      </div>

      <div className="os-kpis" style={{ marginTop: 16 }}>
        {Card(en ? 'Working today' : 'Σε εργασία σήμερα', todayCov.working, en ? 'day ' + today : 'ημέρα ' + today)}
        {meta.dept === 'fleet' && Card(en ? 'Returns/inspections' : 'Επιστροφές/έλεγχοι', deptRes.length, en ? 'this month' : 'τον μήνα')}
        {meta.dept === 'customer' && Card(en ? 'Deliveries' : 'Παραδόσεις', deptRes.length, en ? 'this month' : 'τον μήνα')}
        {(meta.dept === 'all' || meta.dept === 'station' || meta.dept === 'inspection') && Card(en ? 'Reservations' : 'Κρατήσεις', res.length, en ? 'this month' : 'τον μήνα')}
        {Card(en ? 'High-pressure days' : 'Ημέρες πίεσης', overloaded.length, '', overloaded.length ? 'var(--amber)' : 'var(--green)')}
        {(meta.dept === 'all' || meta.dept === 'inspection') && Card(en ? 'Critical warnings' : 'Σοβαρές προειδ.', hardWarn, '', hardWarn ? 'var(--red)' : 'var(--green)')}
        {meta.dept !== 'all' && meta.dept !== 'inspection' && Card(en ? 'Team size' : 'Μέγεθος ομάδας', team.length, '')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="os-panel" style={{ margin: 0 }}>
          <h3>{en ? 'Upcoming' : 'Επερχόμενα'} · {en ? meta.en : meta.el}</h3>
          {upcoming.length === 0 && <div className="os-empty">{en ? 'Nothing scheduled.' : 'Τίποτα προγραμματισμένο.'}</div>}
          {upcoming.map(function (r) { return (
            <div key={r.id} className="os-row">
              <span style={{ fontWeight: 700, minWidth: 34 }}>{r.day}/{month.month}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{r.customer || '—'} <span className="mono" style={{ color: 'var(--faint)', fontSize: 11 }}>{r.vehicle || ''}</span></span>
              <span className="os-tag normal">{r.type}</span>
            </div>); })}
          <button className="os-btn sm" style={{ marginTop: 10 }} onClick={function () { ctx.open('reservations'); }}><Icon name="arrow" size={13} />{en ? 'Open Reservations' : 'Άνοιγμα Κρατήσεων'}</button>
        </div>

        <div className="os-panel" style={{ margin: 0 }}>
          <h3>{en ? 'Pressure points' : 'Σημεία πίεσης'}</h3>
          {overloaded.length === 0 && <div className="os-empty">{en ? 'Load is balanced.' : 'Ισορροπημένος φόρτος.'}</div>}
          {overloaded.slice(0, 6).map(function (b) { return (
            <div key={b.day} className="os-row">
              <span style={{ fontWeight: 700, minWidth: 34 }}>{b.day}/{month.month}</span>
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--soft)' }}>{b.load} {en ? 'reservations' : 'κρατήσεις'} · {b.working} {en ? 'staff' : 'άτομα'}</span>
              {b.needMore && <span className="os-tag high">{en ? 'add staff' : 'προσθήκη'}</span>}
            </div>); })}
          <button className="os-btn sm" style={{ marginTop: 10 }} onClick={function () { ctx.open('coverage'); }}><Icon name="arrow" size={13} />{en ? 'Open Coverage' : 'Άνοιγμα Κάλυψης'}</button>
        </div>
      </div>

      {(meta.dept === 'all' || meta.dept === 'inspection') && <div className="os-panel" style={{ marginTop: 16 }}>
        <h3>{en ? 'Inspection checklist' : 'Λίστα επιθεώρησης'}</h3>
        {[
          [en ? 'Schedule published to staff' : 'Πρόγραμμα δημοσιευμένο', OS.Visibility.get(month.key).published],
          [en ? 'No critical warnings' : 'Καμία σοβαρή προειδοποίηση', hardWarn === 0],
          [en ? 'All days adequately staffed' : 'Επαρκής στελέχωση', derived.coverage.filter(function (c) { return c.status === 'low'; }).length === 0],
          [en ? 'No overloaded days' : 'Καμία υπερφόρτωση', busy.filter(function (b) { return b.cls === 'overloaded'; }).length === 0]
        ].map(function (row, i) { return (
          <div key={i} className="os-row">
            <Icon name={row[1] ? 'check' : 'warning'} size={16} color={row[1] ? 'var(--green)' : 'var(--amber)'} />
            <span style={{ flex: 1, fontSize: 13.5 }}>{row[0]}</span>
            <span className="os-tag" style={{ background: row[1] ? 'var(--green-soft)' : 'var(--amber-soft)', color: row[1] ? 'var(--green)' : 'var(--amber)' }}>{row[1] ? (en ? 'OK' : 'ΟΚ') : (en ? 'Review' : 'Έλεγχος')}</span>
          </div>); })}
      </div>}
    </div>
  );
}

/* ============================================================================
 *  ADMIN CONTROL CENTER  (owner-only)
 * ========================================================================== */
function AdminModule() {
  const ctx = useOS(); const { lang, role } = ctx; const OS = window.OS; const en = lang === 'en';
  if (role !== 'owner') return <DeniedModule perm="settings.manage" />;
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
  const [tab, setTab] = React.useState('overview');

  const members = OS.Members.list().filter(function (m) { return !m.removed; });
  const audit = OS.Audit.all();
  const logins = audit.filter(function (a) { return /login|signup|logout|instant/.test(a.action); });
  const uploads = audit.filter(function (a) { return /import|upload|reservation\.(create|import)/.test(a.action); });
  const roleCounts = OS.Members.counts();

  return (
    <div className="os-page">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div><h2 className="pg">{en ? 'Admin Control Center' : 'Κέντρο Διαχείρισης'}</h2><div className="pgsub" style={{ margin: 0 }}>{en ? 'Owner-only · users, access & activity' : 'Μόνο ιδιοκτήτης · χρήστες, πρόσβαση & δραστηριότητα'}</div></div>
        <div className="seg small">
          {[['overview', en ? 'Overview' : 'Επισκόπηση'], ['access', en ? 'Access' : 'Πρόσβαση'], ['logins', en ? 'Logins' : 'Συνδέσεις'], ['uploads', en ? 'Uploads' : 'Μεταφορτώσεις']].map(function (t) { return <button key={t[0]} className={tab === t[0] ? 'on' : ''} onClick={function () { setTab(t[0]); }}>{t[1]}</button>; })}
        </div>
      </div>

      {tab === 'overview' && <div>
        <div className="os-kpis">
          <div className="os-kpi"><div className="k">{en ? 'Members' : 'Μέλη'}</div><div className="v">{members.length}</div></div>
          <div className="os-kpi"><div className="k">{en ? 'Supervisors' : 'Προϊστάμενοι'}</div><div className="v">{members.filter(function (m) { return OS.isSupervisor(m.role); }).length}</div></div>
          <div className="os-kpi"><div className="k">{en ? 'Login events' : 'Συνδέσεις'}</div><div className="v">{logins.length}</div></div>
          <div className="os-kpi"><div className="k">{en ? 'Audit entries' : 'Εγγραφές ελέγχου'}</div><div className="v">{audit.length}</div></div>
        </div>
        <div className="os-panel">
          <h3>{en ? 'Role distribution' : 'Κατανομή ρόλων'}</h3>
          {Object.keys(roleCounts).map(function (r) { return (
            <div key={r} className="os-row">
              <span className={'rolechip ' + r} style={{ margin: 0 }}>{window.t('role_' + r, lang)}</span>
              <div className="bar" style={{ flex: 1, marginLeft: 10 }}><i style={{ width: (roleCounts[r] / members.length * 100) + '%', background: 'var(--accent)' }}></i></div>
              <span className="mono" style={{ fontSize: 12 }}>{roleCounts[r]}</span>
            </div>); })}
        </div>
        <div className="os-panel" style={{ marginBottom: 0 }}>
          <h3>{en ? 'Maintenance' : 'Συντήρηση'}</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="os-btn" onClick={function () { ctx.open('members'); }}><Icon name="idcard" size={14} />{en ? 'Manage members' : 'Διαχείριση μελών'}</button>
            <button className="os-btn" onClick={function () { ctx.open('audit'); }}><Icon name="shield" size={14} />{en ? 'Full audit log' : 'Πλήρες αρχείο'}</button>
            <button className="os-btn" onClick={function () { ctx.open('health'); }}><Icon name="pulse" size={14} />{en ? 'System health' : 'Υγεία συστήματος'}</button>
            <button className="os-btn" style={{ color: 'var(--red)' }} onClick={function () { if (confirm(en ? 'Reset ALL local data? This signs everyone out and restores seed data.' : 'Επαναφορά ΟΛΩΝ των δεδομένων;')) { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('psos.') === 0) localStorage.removeItem(k); }); location.reload(); } }}><Icon name="x" size={14} />{en ? 'Factory reset' : 'Εργοστασιακή επαναφορά'}</button>
          </div>
        </div>
      </div>}

      {tab === 'access' && <div className="os-panel" style={{ padding: '8px 18px 14px' }}>
        <table className="data" style={{ width: '100%' }}>
          <thead><tr><th style={{ textAlign: 'left' }}>{en ? 'Member' : 'Μέλος'}</th><th>{en ? 'Email' : 'Email'}</th><th>{en ? 'Role' : 'Ρόλος'}</th><th>{en ? 'Saved login' : 'Αποθηκευμένο'}</th></tr></thead>
          <tbody>
            {members.map(function (m) { return (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                <td style={{ fontSize: 12, color: 'var(--soft)' }}>{m.email}</td>
                <td><span className={'rolechip ' + m.role} style={{ margin: 0 }}>{window.t('role_' + m.role, lang)}</span></td>
                <td>{OS.Auth.hasCred(m.email) ? <Icon name="check" size={15} color="var(--green)" /> : <span style={{ color: 'var(--faint)' }}>—</span>}</td>
              </tr>); })}
          </tbody>
        </table>
      </div>}

      {(tab === 'logins' || tab === 'uploads') && <div className="os-panel" style={{ padding: '8px 18px 14px' }}>
        {(tab === 'logins' ? logins : uploads).length === 0 && <div className="os-empty">{en ? 'No records yet.' : 'Καμία εγγραφή.'}</div>}
        {(tab === 'logins' ? logins : uploads).slice(0, 60).map(function (a) { return (
          <div key={a.id} className="os-row">
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--paper)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--accent)', flexShrink: 0 }}><Icon name={tab === 'logins' ? 'idcard' : 'upload'} size={13} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}><span className="mono">{a.action}</span> {a.target ? '· ' + a.target : ''}</div>
              <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{a.role || 'system'} · {a.module || '—'}</div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--faint)', fontFamily: 'var(--mono)' }}>{window.OS.timeAgo(a.at, lang)}</span>
          </div>); })}
      </div>}
    </div>
  );
}

Object.assign(window, { DepartmentModule, AdminModule, DEPT_BY_ROLE });
