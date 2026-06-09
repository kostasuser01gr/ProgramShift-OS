/* ============================================================================
 *  os/modules5.jsx — Reservations + Busy-Day Intelligence.
 *  Manual & paste upload with duplicate/conflict detection, history, audit,
 *  and automatic busy-day recalculation tied to staff coverage.
 * ========================================================================== */

/* busy-day classification from reservation load vs. working staff */
function classifyBusy(load, working) {
  // load = reservations+returns+deliveries+inspections that day; working = staff on duty
  if (load === 0) return { key: 'quiet', score: 0 };
  var ratio = working > 0 ? load / working : load;
  if (load >= 18 || ratio >= 2.2) return { key: 'overloaded', score: 4 };
  if (load >= 11 || ratio >= 1.4) return { key: 'verybusy', score: 3 };
  if (load >= 5 || ratio >= 0.8) return { key: 'busy', score: 2 };
  return { key: 'normal', score: 1 };
}
var BUSY_META = {
  quiet:      { el: 'Ήσυχη', en: 'Quiet', color: 'var(--line2)', fg: 'var(--soft)' },
  normal:     { el: 'Κανονική', en: 'Normal', color: 'var(--green-soft)', fg: 'var(--green)' },
  busy:       { el: 'Πολυάσχολη', en: 'Busy', color: 'var(--blue-soft)', fg: 'var(--blue)' },
  verybusy:   { el: 'Πολύ πολυάσχολη', en: 'Very busy', color: 'var(--amber-soft)', fg: 'var(--amber)' },
  overloaded: { el: 'Υπερφορτωμένη', en: 'Overloaded', color: 'var(--red-soft)', fg: 'var(--red)' }
};

function computeBusyDays(ctx) {
  var OS = window.OS, byDay = OS.Reservations.byDay();
  return ctx.month.dates.map(function (d, j) {
    var rs = byDay[d.day] || [];
    var counts = { delivery: 0, return: 0, inspection: 0, service: 0 };
    rs.forEach(function (r) { counts[r.type] = (counts[r.type] || 0) + 1; });
    var working = ctx.derived.coverage[j] ? ctx.derived.coverage[j].working : 0;
    var load = rs.length;
    var cls = classifyBusy(load, working);
    var needMore = cls.score >= 3 && working < (ctx.D.STAFF.min + 4);
    return { day: d.day, dow: d.dow, weekend: d.weekend, load: load, working: working, counts: counts, cls: cls.key, score: cls.score, needMore: needMore, list: rs };
  });
}

/* ============================================================================
 *  RESERVATIONS MODULE
 * ========================================================================== */
function ReservationsModule() {
  const ctx = useOS(); const { lang, role } = ctx; const OS = window.OS; const en = lang === 'en';
  if (!OS.Perms.can(role, 'reservations.view')) return <DeniedModule perm="reservations.view" />;
  const canUpload = OS.Perms.can(role, 'reservations.upload');
  const canManage = OS.Perms.can(role, 'reservations.manage');
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
  const [tab, setTab] = React.useState('busy');     // busy | list | upload
  const busy = computeBusyDays(ctx);
  const all = OS.Reservations.all().slice().sort(function (a, b) { return a.day - b.day || b.at - a.at; });

  const TYPE = { delivery: { el: 'Παράδοση', en: 'Delivery' }, return: { el: 'Επιστροφή', en: 'Return' }, inspection: { el: 'Έλεγχος', en: 'Inspection' }, service: { el: 'Σέρβις', en: 'Service' } };
  const overloaded = busy.filter(function (b) { return b.cls === 'overloaded'; }).length;
  const verybusy = busy.filter(function (b) { return b.cls === 'verybusy'; }).length;
  const totalRes = all.length;

  return (
    <div className="os-page">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div><h2 className="pg">{en ? 'Reservations' : 'Κρατήσεις'}</h2><div className="pgsub" style={{ margin: 0 }}>{totalRes} {en ? 'reservations · busy-days recalc live' : 'κρατήσεις · busy-days ζωντανά'}</div></div>
        <div className="seg small">
          <button className={tab === 'busy' ? 'on' : ''} onClick={function () { setTab('busy'); }}>{en ? 'Busy days' : 'Πολυάσχολες'}</button>
          <button className={tab === 'list' ? 'on' : ''} onClick={function () { setTab('list'); }}>{en ? 'List' : 'Λίστα'}</button>
          {canUpload && <button className={tab === 'upload' ? 'on' : ''} onClick={function () { setTab('upload'); }}>{en ? 'Upload' : 'Μεταφόρτωση'}</button>}
        </div>
      </div>

      {tab === 'busy' && <div>
        <div className="os-kpis">
          <div className="os-kpi"><div className="k">{en ? 'Reservations' : 'Κρατήσεις'}</div><div className="v">{totalRes}</div></div>
          <div className="os-kpi"><div className="k">{en ? 'Overloaded days' : 'Υπερφορτωμένες'}</div><div className="v" style={{ color: overloaded ? 'var(--red)' : 'var(--green)' }}>{overloaded}</div></div>
          <div className="os-kpi"><div className="k">{en ? 'Very busy' : 'Πολύ πολυάσχολες'}</div><div className="v" style={{ color: verybusy ? 'var(--amber)' : 'var(--ink)' }}>{verybusy}</div></div>
          <div className="os-kpi"><div className="k">{en ? 'Need more staff' : 'Χρειάζονται προσωπικό'}</div><div className="v">{busy.filter(function (b) { return b.needMore; }).length}</div></div>
        </div>
        <div className="os-panel">
          <h3>{en ? 'Busy-day map' : 'Χάρτης φόρτου'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(118px,1fr))', gap: 8 }}>
            {busy.map(function (b) { const meta = BUSY_META[b.cls]; return (
              <div key={b.day} title={(en ? meta.en : meta.el) + ' · ' + b.load + (en ? ' reservations' : ' κρατήσεις')} style={{ border: '1px solid var(--line)', borderLeft: '4px solid ' + meta.fg, borderRadius: 10, padding: '9px 11px', background: meta.color }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{b.day}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: meta.fg, textTransform: 'uppercase', letterSpacing: '.03em' }}>{en ? meta.en : meta.el}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--soft)', marginTop: 4 }}>{b.load} {en ? 'res' : 'κρατ'} · {b.working} {en ? 'staff' : 'άτ'}</div>
                {b.needMore && <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600, marginTop: 3 }}>⚠ {en ? 'add staff' : 'προσθήκη'}</div>}
              </div>); })}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--soft)' }}>
            {['normal', 'busy', 'verybusy', 'overloaded'].map(function (k) { return <span key={k}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: BUSY_META[k].fg, marginRight: 5, verticalAlign: -1 }}></span>{en ? BUSY_META[k].en : BUSY_META[k].el}</span>; })}
          </div>
        </div>
        <div className="os-panel">
          <h3>{en ? 'Why these days are busy' : 'Γιατί είναι πολυάσχολες'}</h3>
          {busy.filter(function (b) { return b.score >= 3; }).length === 0 && <div className="os-empty">{en ? 'No high-pressure days.' : 'Καμία ημέρα υψηλής πίεσης.'}</div>}
          {busy.filter(function (b) { return b.score >= 3; }).map(function (b) { return (
            <div key={b.day} className="os-row">
              <span style={{ fontWeight: 700, minWidth: 30 }}>{b.day}/{ctx.month.month}</span>
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--soft)' }}>{b.counts.delivery} {en ? 'deliveries' : 'παραδόσεις'} · {b.counts.return} {en ? 'returns' : 'επιστροφές'} · {b.counts.inspection} {en ? 'inspections' : 'έλεγχοι'} · {b.working} {en ? 'staff working' : 'άτομα'}</span>
              <span className="os-tag" style={{ background: BUSY_META[b.cls].color, color: BUSY_META[b.cls].fg }}>{en ? BUSY_META[b.cls].en : BUSY_META[b.cls].el}</span>
            </div>); })}
        </div>
      </div>}

      {tab === 'list' && <div className="os-panel" style={{ padding: '8px 18px 14px' }}>
        {all.length === 0 && <div className="os-empty">{en ? 'No reservations yet.' : 'Καμία κράτηση.'}</div>}
        {all.length > 0 && <table className="data" style={{ width: '100%' }}>
          <thead><tr><th style={{ textAlign: 'left' }}>{en ? 'Day' : 'Ημέρα'}</th><th>{en ? 'Type' : 'Τύπος'}</th><th>{en ? 'Customer' : 'Πελάτης'}</th><th>{en ? 'Vehicle' : 'Όχημα'}</th><th>{en ? 'Status' : 'Κατάσταση'}</th>{canManage && <th></th>}</tr></thead>
          <tbody>
            {all.map(function (r) { return (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.day}/{ctx.month.month}</td>
                <td>{en ? (TYPE[r.type] || {}).en : (TYPE[r.type] || {}).el || r.type}</td>
                <td>{r.customer || '—'}</td>
                <td className="mono" style={{ fontSize: 12 }}>{r.vehicle || '—'}</td>
                <td><span className="os-tag" style={{ background: r.status === 'pending' ? 'var(--amber-soft)' : 'var(--green-soft)', color: r.status === 'pending' ? 'var(--amber)' : 'var(--green)' }}>{r.status}</span></td>
                {canManage && <td style={{ textAlign: 'right' }}><button className="os-iconbtn" style={{ width: 28, height: 28 }} title={en ? 'Delete' : 'Διαγραφή'} onClick={function () { if (confirm(en ? 'Delete reservation?' : 'Διαγραφή κράτησης;')) { OS.Reservations.remove(r.id); OS.Audit.add({ action: 'reservation.delete', target: r.vehicle || r.customer, role: role, module: 'reservations' }); force(); } }}><Icon name="x" size={14} /></button></td>}
              </tr>); })}
          </tbody>
        </table>}
      </div>}

      {tab === 'upload' && canUpload && <ReservationUpload ctx={ctx} TYPE={TYPE} onDone={function () { setTab('list'); force(); }} />}
    </div>
  );
}

/* ---------- upload: manual entry + paste-table, with dup/conflict preview ---------- */
function ReservationUpload({ ctx, TYPE, onDone }) {
  const { lang, role } = ctx; const OS = window.OS; const en = lang === 'en';
  const [mode, setMode] = React.useState('manual');
  const [form, setForm] = React.useState({ day: ctx.month.today || 1, type: 'delivery', dept: 'customer', customer: '', vehicle: '', note: '' });
  const [paste, setPaste] = React.useState('');
  const [preview, setPreview] = React.useState(null);  // {rows, analysis}
  const [msg, setMsg] = React.useState('');

  function addManual() {
    if (!form.customer.trim() && !form.vehicle.trim()) { setMsg(en ? 'Enter a customer or vehicle.' : 'Δώσε πελάτη ή όχημα.'); return; }
    const a = OS.Reservations.analyze([form]);
    if (a.dupes.length && !confirm(en ? 'Possible duplicate — add anyway?' : 'Πιθανό διπλότυπο — προσθήκη;')) return;
    OS.Reservations.add(Object.assign({ by: (OS.Auth.current() || {}).name || role }, form));
    OS.Audit.add({ action: 'reservation.create', target: form.vehicle || form.customer, role: role, module: 'reservations' });
    setMsg(en ? 'Added.' : 'Προστέθηκε.'); setForm(Object.assign({}, form, { customer: '', vehicle: '', note: '' }));
    setTimeout(function () { setMsg(''); }, 1500);
  }

  function parsePaste() {
    // lines: day, type, customer, vehicle  (tab/comma/semicolon separated)
    const rows = paste.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      const c = l.split(/[\t,;]/).map(function (x) { return x.trim(); });
      const day = parseInt(c[0], 10) || ctx.month.today || 1;
      const t = (c[1] || 'delivery').toLowerCase();
      const type = /return|επιστρ/.test(t) ? 'return' : /insp|ελεγχ/.test(t) ? 'inspection' : /serv|σερβ/.test(t) ? 'service' : 'delivery';
      return { day: Math.min(Math.max(day, 1), ctx.month.days), type: type, dept: 'customer', customer: c[2] || '', vehicle: c[3] || '', note: '' };
    }).filter(function (r) { return r.customer || r.vehicle; });
    if (!rows.length) { setMsg(en ? 'Nothing parseable. Format: day, type, customer, vehicle' : 'Τίποτα. Μορφή: ημέρα, τύπος, πελάτης, όχημα'); return; }
    const analysis = OS.Reservations.analyze(rows);
    setPreview({ rows: rows, analysis: analysis }); setMsg('');
  }
  function confirmImport() {
    const clean = preview.rows.filter(function (_, i) { return preview.analysis.dupes.indexOf(i) < 0; });
    const n = OS.Reservations.importMany(clean, (OS.Auth.current() || {}).name || role);
    OS.Audit.add({ action: 'reservation.import', target: n + ' rows', role: role, module: 'reservations' });
    OS.Notify.add({ type: 'system', title: en ? 'Reservations imported' : 'Εισαγωγή κρατήσεων', desc: n + (en ? ' added · busy-days recalculated' : ' προστέθηκαν · busy-days ενημερώθηκαν'), module: 'reservations', priority: 'normal' });
    setPreview(null); setPaste(''); onDone();
  }

  return (
    <div className="os-panel" style={{ maxWidth: 720 }}>
      <div className="seg small" style={{ marginBottom: 14 }}>
        <button className={mode === 'manual' ? 'on' : ''} onClick={function () { setMode('manual'); }}>{en ? 'Manual entry' : 'Χειροκίνητα'}</button>
        <button className={mode === 'paste' ? 'on' : ''} onClick={function () { setMode('paste'); }}>{en ? 'Paste table' : 'Επικόλληση'}</button>
      </div>

      {mode === 'manual' && <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>{en ? 'Day' : 'Ημέρα'}<select className="os-select" style={{ marginTop: 4 }} value={form.day} onChange={function (e) { setForm(Object.assign({}, form, { day: +e.target.value })); }}>{ctx.month.dates.map(function (d) { return <option key={d.day} value={d.day}>{d.day}</option>; })}</select></label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>{en ? 'Type' : 'Τύπος'}<select className="os-select" style={{ marginTop: 4 }} value={form.type} onChange={function (e) { setForm(Object.assign({}, form, { type: e.target.value })); }}>{Object.keys(TYPE).map(function (t) { return <option key={t} value={t}>{en ? TYPE[t].en : TYPE[t].el}</option>; })}</select></label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>{en ? 'Customer' : 'Πελάτης'}<input className="os-input" style={{ marginTop: 4 }} value={form.customer} onChange={function (e) { setForm(Object.assign({}, form, { customer: e.target.value })); }} /></label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>{en ? 'Vehicle' : 'Όχημα'}<input className="os-input" style={{ marginTop: 4 }} value={form.vehicle} onChange={function (e) { setForm(Object.assign({}, form, { vehicle: e.target.value })); }} /></label>
        </div>
        <input className="os-input" style={{ marginTop: 10 }} placeholder={en ? 'Note (optional)' : 'Σημείωση (προαιρετικό)'} value={form.note} onChange={function (e) { setForm(Object.assign({}, form, { note: e.target.value })); }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button className="os-btn solid" onClick={addManual}><Icon name="plus" size={14} />{en ? 'Add reservation' : 'Προσθήκη'}</button>
          {msg && <span style={{ fontSize: 12.5, color: 'var(--green)' }}>{msg}</span>}
        </div>
      </div>}

      {mode === 'paste' && <div>
        <div style={{ fontSize: 12.5, color: 'var(--soft)', marginBottom: 8 }}>{en ? 'One per line: day, type, customer, vehicle' : 'Μία ανά γραμμή: ημέρα, τύπος, πελάτης, όχημα'}</div>
        <textarea className="os-textarea" style={{ minHeight: 120, fontFamily: 'var(--mono)', fontSize: 12.5 }} placeholder={'13, delivery, A. Nikolaou, ABC-1234\n14, return, M. Papa, XYZ-5678'} value={paste} onChange={function (e) { setPaste(e.target.value); }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="os-btn" onClick={parsePaste}><Icon name="search" size={14} />{en ? 'Preview' : 'Προεπισκόπηση'}</button>
        </div>
        {msg && <div style={{ fontSize: 12.5, color: 'var(--amber)', marginTop: 8 }}>{msg}</div>}
        {preview && <div style={{ marginTop: 14, border: '1px solid var(--line2)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12.5, marginBottom: 10 }}>
            <strong>{preview.rows.length}</strong> {en ? 'rows' : 'γραμμές'}
            {preview.analysis.dupes.length > 0 && <span style={{ color: 'var(--red)', marginLeft: 10 }}>⚠ {preview.analysis.dupes.length} {en ? 'duplicates (will skip)' : 'διπλότυπα (παράλειψη)'}</span>}
            {preview.analysis.conflicts.length > 0 && <span style={{ color: 'var(--amber)', marginLeft: 10 }}>⚠ {preview.analysis.conflicts.length} {en ? 'conflicts' : 'συγκρούσεις'}</span>}
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {preview.rows.map(function (r, i) { const dup = preview.analysis.dupes.indexOf(i) >= 0; const conf = preview.analysis.conflicts.indexOf(i) >= 0; return (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 8px', borderRadius: 7, fontSize: 12.5, background: dup ? 'var(--red-soft)' : conf ? 'var(--amber-soft)' : 'transparent' }}>
                <span style={{ fontWeight: 600, minWidth: 26 }}>{r.day}</span><span style={{ minWidth: 70 }}>{en ? (TYPE[r.type] || {}).en : (TYPE[r.type] || {}).el}</span><span style={{ flex: 1 }}>{r.customer}</span><span className="mono">{r.vehicle}</span>
                {dup && <span style={{ color: 'var(--red)', fontWeight: 600 }}>{en ? 'dup' : 'διπλό'}</span>}{conf && !dup && <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{en ? 'conflict' : 'σύγκρουση'}</span>}
              </div>); })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="os-btn solid" onClick={confirmImport}><Icon name="check" size={14} />{en ? 'Import ' + (preview.rows.length - preview.analysis.dupes.length) + ' rows' : 'Εισαγωγή ' + (preview.rows.length - preview.analysis.dupes.length)}</button>
            <button className="os-btn" onClick={function () { setPreview(null); }}>{en ? 'Cancel' : 'Άκυρο'}</button>
          </div>
        </div>}
      </div>}
    </div>
  );
}

Object.assign(window, { ReservationsModule, computeBusyDays, classifyBusy });
