/* ============================================================================
 *  os/modules3.jsx — operator modules: System Health, Data Quality, Daily
 *  Briefing + a crash-safe ErrorBoundary. All read real platform/schedule data.
 * ========================================================================== */

/* ---------- crash-safe boundary ---------- */
class OSErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err: err }; }
  componentDidCatch(err) { try { window.OS.Audit.add({ action: 'system.error', target: String(err && err.message || err), severity: 'error', module: 'system' }); } catch (e) { } }
  render() {
    if (this.state.err) {
      return (
        <div className="os-denied">
          <div className="lock" style={{ color: 'var(--red)' }}><Icon name="warning" size={28} /></div>
          <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>Module crashed</div>
          <div style={{ maxWidth: 340, fontFamily: 'var(--mono)', fontSize: 12 }}>{String(this.state.err.message || this.state.err)}</div>
          <button className="os-btn" onClick={() => this.setState({ err: null })}><Icon name="arrow" size={14} />Reload module</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============================================================================
 *  SYSTEM HEALTH
 * ========================================================================== */
function SystemHealthModule() {
  const { lang, role } = useOS(); const OS = window.OS; const en = lang === 'en';
  if (!OS.Perms.can(role, 'audit.view')) return <DeniedModule perm="audit.view" />;
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);

  // measure local storage footprint
  let bytes = 0, keys = 0;
  try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('psos.') === 0) { keys++; bytes += (localStorage.getItem(k) || '').length; } }); } catch (e) { }
  const kb = (bytes / 1024).toFixed(1);
  const autos = OS.Automations.all();
  const failed = 0; // automations don't fail in-proto; surface honestly as 0
  const checks = [
    { k: en ? 'AI model' : 'Μοντέλο AI', ok: OS.AI.available(), v: OS.AI.available() ? (en ? 'connected' : 'συνδεδεμένο') : (en ? 'local fallback' : 'τοπικό') },
    { k: en ? 'Local storage' : 'Τοπική αποθήκευση', ok: bytes < 4500000, v: kb + ' KB · ' + keys + (en ? ' keys' : ' κλειδιά') },
    { k: en ? 'Event bus' : 'Δίαυλος γεγονότων', ok: true, v: OS.Bus.log().length + (en ? ' recent events' : ' πρόσφατα') },
    { k: en ? 'Audit log' : 'Αρχείο ελέγχου', ok: true, v: OS.Audit.all().length + (en ? ' entries' : ' εγγραφές') },
    { k: en ? 'Automations' : 'Αυτοματισμοί', ok: failed === 0, v: autos.filter(function (a) { return a.enabled; }).length + '/' + autos.length + (en ? ' enabled' : ' ενεργά') },
    { k: en ? 'Notifications' : 'Ειδοποιήσεις', ok: true, v: OS.Notify.all().length + ' · ' + OS.Notify.unread() + (en ? ' unread' : ' νέες') }
  ];
  const healthy = checks.filter(function (c) { return c.ok; }).length;

  function diagnostics() { OS.Notify.add({ type: 'system', title: en ? 'Diagnostics complete' : 'Διαγνωστικά ολοκληρώθηκαν', desc: healthy + '/' + checks.length + (en ? ' systems healthy' : ' συστήματα υγιή'), module: 'health' }); OS.Audit.add({ action: 'system.diagnostics', role: role, module: 'health' }); force(); }
  function exportLogs() {
    const data = { generatedAt: new Date().toISOString(), audit: OS.Audit.all(), events: OS.Bus.log(), notifications: OS.Notify.all() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'program-shift-logs.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    OS.Audit.add({ action: 'logs.export', role: role, module: 'health' });
  }
  function clearCache() { if (confirm(en ? 'Clear local platform cache (keeps your data file)?' : 'Καθαρισμός τοπικής cache;')) { try { ['notifs', 'memory'].forEach(function (k) { localStorage.removeItem('psos.' + k); }); } catch (e) { } force(); } }

  return (
    <div className="os-page" style={{ maxWidth: 820 }}>
      <h2 className="pg">{en ? 'System Health' : 'Υγεία Συστήματος'}</h2>
      <div className="pgsub">{healthy}/{checks.length} {en ? 'systems healthy' : 'συστήματα υγιή'} · v0.4 · {en ? 'front-end prototype' : 'front-end πρωτότυπο'}</div>
      <div className="os-kpis">
        <div className="os-kpi"><div className="k">{en ? 'Status' : 'Κατάσταση'}</div><div className="v" style={{ color: healthy === checks.length ? 'var(--green)' : 'var(--amber)' }}>{healthy === checks.length ? (en ? 'Healthy' : 'Υγιές') : (en ? 'Notice' : 'Προσοχή')}</div></div>
        <div className="os-kpi"><div className="k">{en ? 'Storage' : 'Αποθήκευση'}</div><div className="v">{kb}<span style={{ fontSize: 14 }}> KB</span></div></div>
        <div className="os-kpi"><div className="k">{en ? 'Events' : 'Γεγονότα'}</div><div className="v">{OS.Bus.log().length}</div></div>
        <div className="os-kpi"><div className="k">{en ? 'Failed jobs' : 'Αποτυχίες'}</div><div className="v" style={{ color: failed ? 'var(--red)' : 'var(--green)' }}>{failed}</div></div>
      </div>
      <div className="os-panel">
        <h3>{en ? 'Checks' : 'Έλεγχοι'}</h3>
        {checks.map(function (c, i) { return (
          <div key={i} className="os-row">
            <div style={{ width: 26, height: 26, borderRadius: 8, background: c.ok ? 'var(--green-soft)' : 'var(--amber-soft)', color: c.ok ? 'var(--green)' : 'var(--amber)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={c.ok ? 'check' : 'warning'} size={14} /></div>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{c.k}</div>
            <div style={{ fontSize: 12.5, color: 'var(--soft)' }}>{c.v}</div>
          </div>); })}
      </div>
      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
        <button className="os-btn solid" onClick={diagnostics}><Icon name="check" size={14} />{en ? 'Run diagnostics' : 'Διαγνωστικά'}</button>
        <button className="os-btn" onClick={exportLogs}><Icon name="pdf" size={14} />{en ? 'Export logs (JSON)' : 'Εξαγωγή logs'}</button>
        <button className="os-btn" onClick={clearCache}><Icon name="x" size={14} />{en ? 'Clear cache' : 'Καθαρισμός cache'}</button>
      </div>
    </div>
  );
}

/* ============================================================================
 *  DATA QUALITY
 * ========================================================================== */
function DataQualityModule() {
  const { D, T, lang, month, emps, derived, role, open } = useOS(); const en = lang === 'en';
  if (!window.OS.Perms.can(role, 'schedule.view')) return <DeniedModule perm="schedule.view" />;

  const issues = [];
  const seenAme = {};
  emps.forEach(function (e) {
    if (seenAme[e.ame]) issues.push({ sev: 'hard', who: e.name, t: en ? 'Duplicate ΑΜΕ ' + e.ame : 'Διπλό ΑΜΕ ' + e.ame });
    seenAme[e.ame] = true;
    let empty = 0, invalid = 0;
    e.cats.forEach(function (c, j) { if (c === 'empty') empty++; if (c === 'invalid') invalid++; });
    if (invalid) issues.push({ sev: 'hard', who: e.name, t: (en ? invalid + ' invalid shift value(s)' : invalid + ' άκυρες τιμές βάρδιας') });
    if (empty) issues.push({ sev: 'soft', who: e.name, t: (en ? empty + ' empty day(s)' : empty + ' κενές ημέρες') });
  });
  derived.coverage.forEach(function (c) { if (c.status === 'low') issues.push({ sev: 'soft', who: en ? 'Day ' + c.day : 'Ημέρα ' + c.day, t: en ? 'Understaffed (' + c.working + ' working)' : 'Υποστελέχωση (' + c.working + ')' }); });

  const hard = issues.filter(function (i) { return i.sev === 'hard'; }).length;
  const totalCells = emps.length * month.days;
  const penalty = Math.min(100, hard * 6 + (issues.length - hard) * 1.2);
  const score = Math.max(0, Math.round(100 - penalty));
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D';

  return (
    <div className="os-page" style={{ maxWidth: 820 }}>
      <h2 className="pg">{en ? 'Data Quality' : 'Ποιότητα Δεδομένων'}</h2>
      <div className="pgsub">{en ? month.label.en : month.label.el} · {totalCells} {en ? 'cells scanned' : 'κελιά'}</div>
      <div className="os-kpis">
        <div className="os-kpi"><div className="k">{en ? 'Quality score' : 'Βαθμός'}</div><div className="v" style={{ color: score >= 75 ? 'var(--green)' : score >= 60 ? 'var(--amber)' : 'var(--red)' }}>{score}<span style={{ fontSize: 16 }}> · {grade}</span></div></div>
        <div className="os-kpi"><div className="k">{en ? 'Critical' : 'Σοβαρά'}</div><div className="v" style={{ color: hard ? 'var(--red)' : 'var(--green)' }}>{hard}</div></div>
        <div className="os-kpi"><div className="k">{en ? 'Total issues' : 'Σύνολο'}</div><div className="v">{issues.length}</div></div>
      </div>
      <div className="os-panel">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{en ? 'Issues' : 'Ευρήματα'}</h3>
          <button className="os-btn sm" style={{ marginLeft: 'auto' }} onClick={function () { open('schedule'); }}><Icon name="arrow" size={13} />{en ? 'Open schedule' : 'Άνοιγμα προγράμματος'}</button>
        </div>
        {issues.length === 0 && <div className="os-empty"><Icon name="check" size={28} color="var(--green)" /><div style={{ marginTop: 8 }}>{en ? 'No data issues — clean.' : 'Καθαρά δεδομένα.'}</div></div>}
        {issues.slice(0, 40).map(function (it, i) { return (
          <div key={i} className="os-row">
            <div style={{ width: 26, height: 26, borderRadius: 8, background: it.sev === 'hard' ? 'var(--red-soft)' : 'var(--amber-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{it.sev === 'hard' ? '🛑' : '⚠️'}</div>
            <div style={{ flex: 1, fontSize: 13.5 }}>{it.t}</div>
            <div style={{ fontSize: 12, color: 'var(--faint)' }}>{it.who}</div>
          </div>); })}
      </div>
    </div>
  );
}

/* ============================================================================
 *  DAILY BRIEFING
 * ========================================================================== */
function DailyBriefingModule() {
  const { D, T, lang, month, derived, requests, role } = useOS(); const OS = window.OS; const en = lang === 'en';
  const todayIdx = Math.max(0, Math.min(month.today - 1, month.days - 1));
  const cov = derived.coverage[todayIdx] || {};
  const pending = requests.filter(function (r) { return r.status === 'pending'; }).length;
  const tasksDue = OS.Tasks.all().filter(function (t) { return !t.done; }).length;
  const hard = derived.warnings.filter(function (w) { return w.sev === 'hard'; }).length;
  const [aiText, setAiText] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function aiBrief() {
    setBusy(true); OS.Audit.add({ action: 'ai.briefing', role: role, module: 'briefing' });
    let txt = null;
    if (OS.AI.available()) {
      const ctx = { month: month.label.en, today: month.dates[todayIdx].day, working: cov.working, understaffed: derived.coverage.filter(function (c) { return c.status === 'low'; }).length, warnings: derived.warnings.length, pendingRequests: pending };
      txt = await OS.AI.complete('You are an operations assistant. Write a 3-sentence morning briefing for a shift manager in ' + (en ? 'English' : 'Greek') + ' from this JSON: ' + JSON.stringify(ctx));
    }
    if (!txt) txt = en ? ('Today ' + cov.working + ' staff are working. ' + (hard ? hard + ' critical warnings need attention.' : 'No critical warnings.') + ' ' + (pending ? pending + ' requests await approval.' : 'No pending requests.')) : ('Σήμερα εργάζονται ' + cov.working + ' άτομα. ' + (hard ? hard + ' σοβαρές προειδοποιήσεις.' : 'Καμία σοβαρή προειδοποίηση.') + ' ' + (pending ? pending + ' αιτήματα προς έγκριση.' : 'Κανένα εκκρεμές αίτημα.'));
    setAiText(txt); setBusy(false);
  }

  const greet = (function () { const h = new Date().getHours(); return h < 12 ? (en ? 'Good morning' : 'Καλημέρα') : h < 18 ? (en ? 'Good afternoon' : 'Καλό απόγευμα') : (en ? 'Good evening' : 'Καλησπέρα'); })();
  const stat = [
    { k: en ? 'Working today' : 'Σε εργασία σήμερα', v: cov.working || 0, c: cov.status === 'low' ? 'var(--red)' : 'var(--green)' },
    { k: en ? 'Critical warnings' : 'Σοβαρές προειδ.', v: hard, c: hard ? 'var(--red)' : 'var(--green)' },
    { k: en ? 'Pending requests' : 'Εκκρεμή αιτήματα', v: pending, c: pending ? 'var(--amber)' : 'var(--green)' },
    { k: en ? 'Tasks open' : 'Ανοιχτές εργασίες', v: tasksDue, c: 'var(--ink)' }
  ];

  return (
    <div className="os-page" style={{ maxWidth: 820 }}>
      <h2 className="pg">{greet}</h2>
      <div className="pgsub">{en ? 'Daily briefing' : 'Ημερήσια ενημέρωση'} · {month.dates[todayIdx].day} {en ? month.label.en : month.label.el}</div>
      <div className="os-kpis">{stat.map(function (s, i) { return <div key={i} className="os-kpi"><div className="k">{s.k}</div><div className="v" style={{ color: s.c }}>{s.v}</div></div>; })}</div>
      <div className="os-panel">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}><Icon name="sparkle" size={16} color="var(--accent)" style={{ verticalAlign: -2, marginRight: 6 }} />{en ? 'Briefing' : 'Σύνοψη'}</h3>
          <button className="os-btn sm" style={{ marginLeft: 'auto' }} onClick={aiBrief} disabled={busy}><Icon name="sparkle" size={13} />{busy ? '…' : (en ? 'Generate' : 'Δημιουργία')}</button>
        </div>
        {aiText ? <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{aiText}</div>
          : <div className="os-empty">{en ? 'Tap Generate for an AI / computed briefing.' : 'Πάτησε Δημιουργία για σύνοψη.'}</div>}
      </div>
      <div className="os-panel" style={{ marginBottom: 0 }}>
        <h3>{en ? 'Recent activity' : 'Πρόσφατη δραστηριότητα'}</h3>
        {OS.Memory.all().slice(0, 6).map(function (m, i) { return <div key={i} className="os-row"><div style={{ flex: 1, fontSize: 13.5 }}>{m.text}</div><span style={{ fontSize: 11, color: 'var(--faint)' }}>{OS.timeAgo(m.at, lang)}</span></div>; })}
        {OS.Memory.all().length === 0 && <div className="os-empty">{en ? 'No activity yet today.' : 'Καμία δραστηριότητα.'}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { OSErrorBoundary, SystemHealthModule, DataQualityModule, DailyBriefingModule });
