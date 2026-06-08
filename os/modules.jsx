/* ============================================================================
 *  os/modules.jsx — Program Shift OS module components.
 *  All read shared platform state via useOS() and services via window.OS.
 * ========================================================================== */

/* ---------- helpers ---------- */
function fmtAgo(ts, lang) { return window.OS.timeAgo(ts, lang); }

function exportMonthCSV(month) {
  var head = ['AME', 'Surname', 'First'].concat(month.dates.map(function (d) { return d.day; }));
  var rows = [head];
  month.employees.forEach(function (e) { rows.push([e.ame, e.surname, e.first].concat(e.shifts)); });
  var csv = rows.map(function (r) { return r.map(function (c) { return /[",]/.test(c) ? '"' + String(c).replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
  var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  var url = URL.createObjectURL(blob); var a = document.createElement('a');
  a.href = url; a.download = (month.label.en.replace(' ', '-')) + '.csv'; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ============================================================================
 *  LAUNCHER
 * ========================================================================== */
function LauncherModule() {
  const ctx = useOS(); const { T, lang, role, registry, open } = ctx;
  const OS = window.OS;
  const [q, setQ] = React.useState('');
  const [favs, setFavs] = React.useState(OS.Favorites.list());
  const [cat, setCat] = React.useState('all');

  const visible = registry.filter(function (m) {
    return m.id !== 'launcher' && OS.Perms.can(role, m.perm || 'app.view') && OS.Settings.get().disabledModules.indexOf(m.id) < 0;
  });
  const cats = ['all'].concat(visible.map(function (m) { return m.category; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
  const filtered = visible.filter(function (m) {
    const name = window.OS.norm(lang === 'en' ? m.name.en : m.name.el);
    return (cat === 'all' || m.category === cat) && (!q || name.indexOf(window.OS.norm(q)) >= 0);
  });
  const favList = visible.filter(function (m) { return favs.indexOf(m.id) >= 0; });

  function toggleFav(e, id) { e.stopPropagation(); setFavs(OS.Favorites.toggle(id)); }
  const greet = (function () { const h = new Date().getHours(); if (h < 12) return lang === 'en' ? 'Good morning' : 'Καλημέρα'; if (h < 18) return lang === 'en' ? 'Good afternoon' : 'Καλό απόγευμα'; return lang === 'en' ? 'Good evening' : 'Καλησπέρα'; })();

  function Card(m) {
    const nm = lang === 'en' ? m.name.en : m.name.el;
    const ds = lang === 'en' ? m.desc.en : m.desc.el;
    return (
      <div key={m.id} className="ln-card" onClick={function () { open(m.id); }}>
        <div className="ic" style={{ background: m.tint + '22', color: m.tint }}><Icon name={m.icon} size={21} /></div>
        <div className="nm">{nm}</div>
        <div className="ds">{ds}</div>
        <span className={'ln-chip ' + (m.status === 'soon' ? 'soon' : 'live')}>{m.status === 'soon' ? (lang === 'en' ? 'Coming soon' : 'Σύντομα') : (lang === 'en' ? 'Live' : 'Ενεργό')}</span>
        <span className={'star' + (favs.indexOf(m.id) >= 0 ? ' on' : '')} onClick={function (e) { toggleFav(e, m.id); }}><Icon name="sparkle" size={15} /></span>
      </div>
    );
  }

  return (
    <div className="ln-wrap">
      <div className="ln-hello">{greet} 👋</div>
      <div className="ln-sub">{visible.length} {lang === 'en' ? 'apps available · click an icon or press' : 'εφαρμογές διαθέσιμες · πάτησε εικονίδιο ή'} <kbd style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 5, padding: '1px 6px' }}>⌘K</kbd></div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 11, padding: '8px 12px' }}>
          <Icon name="search" size={16} color="var(--faint)" />
          <input value={q} onChange={function (e) { setQ(e.target.value); }} placeholder={lang === 'en' ? 'Search apps…' : 'Αναζήτηση εφαρμογών…'}
            style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)' }} />
        </div>
        <div className="seg small">
          {cats.slice(0, 6).map(function (c) { return <button key={c} className={cat === c ? 'on' : ''} onClick={function () { setCat(c); }}>{c === 'all' ? (lang === 'en' ? 'All' : 'Όλα') : c}</button>; })}
        </div>
      </div>

      {favList.length > 0 && !q && cat === 'all' && (
        <div><div className="ln-sectitle">{lang === 'en' ? 'Favorites' : 'Αγαπημένα'}</div>
          <div className="ln-grid">{favList.map(Card)}</div></div>
      )}
      <div className="ln-sectitle">{q || cat !== 'all' ? (lang === 'en' ? 'Results' : 'Αποτελέσματα') : (lang === 'en' ? 'All apps' : 'Όλες οι εφαρμογές')}</div>
      <div className="ln-grid">{filtered.map(Card)}</div>
      {filtered.length === 0 && <div className="os-empty">{lang === 'en' ? 'No apps match.' : 'Καμία εφαρμογή.'}</div>}
    </div>
  );
}

/* ============================================================================
 *  SCHEDULE MODULES (reuse manager views with shared state)
 * ========================================================================== */
function ScheduleGridModule() {
  const ctx = useOS(); const { D, T, lang, month, emps, setCell, role } = ctx; const OS = window.OS;
  const [edit, setEdit] = React.useState(null);
  const [pub, setPub] = React.useState(false);
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
  const can = OS.Perms.can(role, 'schedule.edit');
  const vis = OS.Visibility.get(month.key);
  const visSummary = !vis.published ? T('pub_nothing')
    : vis.mode === 'all' ? T('pub_all').toLowerCase()
    : vis.mode === 'window' ? (vis.from + 1) + '–' + (vis.to + 1)
    : (vis.days.length + ' ' + T('imp_days'));
  return (
    <div className="os-page">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div><h2 className="pg">{T('nav_grid')}</h2><div className="pgsub">{month.employees.length} {lang === 'en' ? 'employees' : 'υπάλληλοι'} · {month.days} {lang === 'en' ? 'days' : 'ημέρες'} · {lang === 'en' ? month.label.en : month.label.el} · <Icon name={vis.published ? 'check' : 'shield'} size={12} color={vis.published ? 'var(--green)' : 'var(--amber)'} style={{ verticalAlign: -1 }} /> {T('pub_summary')}: {visSummary}</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {OS.Perms.can(role, 'export') && <button className="os-btn" onClick={function () { exportMonthCSV(month); OS.Audit.add({ action: 'export.csv', target: month.label.en, role: role, module: 'schedule' }); }}><Icon name="pdf" size={14} />CSV</button>}
          {OS.Perms.can(role, 'schedule.publish') && <button className="os-btn solid" onClick={function () { setPub(true); }}><Icon name="publish" size={14} />{T('pub_btn')}</button>}
        </div>
      </div>
      <GridView D={D} T={T} lang={lang} month={month} emps={emps} setEdit={can ? setEdit : function () { }} />
      {edit && can && <EditModal D={D} T={T} lang={lang} month={month} emps={emps} edit={edit} setEdit={setEdit} setCell={function (ei, j, v) { setCell(ei, j, v); setEdit(null); }} />}
      {pub && <PublishModal ctx={ctx} close={function () { setPub(false); force(); }} />}
    </div>
  );
}

/* ---------- PUBLISH / VISIBILITY MODAL ---------- */
function PublishModal({ ctx, close }) {
  const { T, lang, month, role } = ctx; const OS = window.OS; const en = lang === 'en';
  const cur = OS.Visibility.get(month.key);
  const [published, setPublished] = React.useState(cur.published);
  const [mode, setMode] = React.useState(cur.mode || 'all');
  const [from, setFrom] = React.useState(cur.from || 0);
  const [to, setTo] = React.useState(cur.to != null ? cur.to : month.days - 1);
  const [days, setDays] = React.useState((cur.days || []).slice());
  const weeks = Math.ceil(month.days / 7);

  function setWeek(w) { setMode('window'); setFrom(w * 7); setTo(Math.min(w * 7 + 6, month.days - 1)); }
  function toggleDay(j) { setDays(function (d) { return d.indexOf(j) >= 0 ? d.filter(function (x) { return x !== j; }) : d.concat([j]).sort(function (a, b) { return a - b; }); }); }
  function save() {
    OS.Visibility.set(month.key, { published: published, mode: mode, from: from, to: to, days: days });
    OS.Audit.add({ action: 'schedule.visibility', target: month.label.en + ' · ' + (published ? mode : 'draft'), role: role, module: 'schedule' });
    OS.Notify.add({ type: 'publish', title: published ? (en ? 'Schedule released' : 'Το πρόγραμμα δημοσιεύτηκε') : (en ? 'Schedule hidden' : 'Το πρόγραμμα αποκρύφτηκε'),
      desc: (en ? month.label.en : month.label.el) + ' · ' + (published ? (mode === 'all' ? T('pub_all') : mode === 'window' ? (T('pub_from') + ' ' + (from + 1) + ' ' + T('pub_to') + ' ' + (to + 1)) : days.length + ' ' + T('imp_days')) : T('pub_draft')),
      module: 'schedule', priority: 'high' });
    OS.Memory.add({ kind: 'publish', text: (en ? 'Visibility · ' : 'Ορατότητα · ') + (en ? month.label.en : month.label.el) + ' → ' + (published ? mode : 'draft') });
    close();
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(35,32,27,.42)', zIndex: 70, display: 'grid', placeItems: 'center' }} onClick={close}>
      <div style={{ background: 'var(--paper)', borderRadius: 16, padding: 22, width: 520, maxWidth: '92%', maxHeight: '88%', overflowY: 'auto', boxShadow: '0 30px 70px rgba(0,0,0,.32)' }} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}><Icon name="publish" size={19} /></div>
          <div><div className="serif" style={{ fontSize: 20, lineHeight: 1.1 }}>{T('pub_title')}</div><div style={{ fontSize: 12.5, color: 'var(--soft)' }}>{T('pub_sub')} · {en ? month.label.en : month.label.el}</div></div>
        </div>

        <div className="os-row" style={{ marginTop: 10 }}>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{T('pub_state')}</div><div style={{ fontSize: 12, color: 'var(--soft)' }}>{published ? T('pub_published') : T('pub_draft')}</div></div>
          <button className={'os-toggle' + (published ? ' on' : '')} onClick={function () { setPublished(!published); }}></button>
        </div>

        {published && <div style={{ marginTop: 14, opacity: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--soft)', marginBottom: 8 }}>{T('pub_scope')}</div>
          <div className="seg small" style={{ marginBottom: 12 }}>
            {[['all', T('pub_all')], ['window', T('pub_window')], ['days', T('pub_days')]].map(function (o) { return <button key={o[0]} className={mode === o[0] ? 'on' : ''} onClick={function () { setMode(o[0]); }}>{o[1]}</button>; })}
          </div>

          {mode === 'window' && <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {Array.from({ length: weeks }).map(function (_, w) { const on = from === w * 7; return <button key={w} className={'os-btn sm' + (on ? ' solid' : '')} onClick={function () { setWeek(w); }}>{T('pub_week')} {w + 1}</button>; })}
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ fontSize: 12.5, color: 'var(--soft)' }}>{T('pub_from')}</label>
              <select className="os-select" style={{ width: 80 }} value={from} onChange={function (e) { setFrom(+e.target.value); }}>{month.dates.map(function (d, j) { return <option key={j} value={j}>{d.day}</option>; })}</select>
              <label style={{ fontSize: 12.5, color: 'var(--soft)' }}>{T('pub_to')}</label>
              <select className="os-select" style={{ width: 80 }} value={to} onChange={function (e) { setTo(+e.target.value); }}>{month.dates.map(function (d, j) { return <option key={j} value={j}>{d.day}</option>; })}</select>
            </div>
          </div>}

          {mode === 'days' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
            {month.dates.map(function (d, j) { const on = days.indexOf(j) >= 0; return (
              <div key={j} onClick={function () { toggleDay(j); }} style={{ aspectRatio: '1', borderRadius: 8, border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line2)'), background: on ? 'var(--accent)' : 'var(--card)', color: on ? '#fff' : 'var(--ink)', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>{d.day}</div>); })}
          </div>}
        </div>}

        <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
          <button className="os-btn" onClick={close}>{T('cancel')}</button>
          <button className="os-btn solid" style={{ marginLeft: 'auto' }} onClick={save}><Icon name="check" size={14} />{T('pub_save')}</button>
        </div>
      </div>
    </div>
  );
}
function CoverageModule() { const { D, T, lang, derived } = useOS(); return <div className="os-page"><h2 className="pg">{T('nav_coverage')}</h2><div className="pgsub">{lang === 'en' ? 'Staffing per day' : 'Στελέχωση ανά ημέρα'}</div><CoverageView D={D} T={T} lang={lang} derived={derived} /></div>; }
function WarningsModule() { const { D, T, lang, derived } = useOS(); return <div className="os-page"><h2 className="pg">{T('nav_warnings')}</h2><div className="pgsub">{derived.warnings.length} {lang === 'en' ? 'issues' : 'ευρήματα'}</div><WarningsView D={D} T={T} lang={lang} derived={derived} /></div>; }
function FairnessModule() { const { D, T, lang, derived } = useOS(); return <div className="os-page"><h2 className="pg">{T('nav_fairness')}</h2><div className="pgsub">{lang === 'en' ? 'Workload balance' : 'Ισορροπία φόρτου'}</div><FairnessView D={D} T={T} lang={lang} derived={derived} /></div>; }
function RequestsModule() {
  const ctx = useOS(); const { D, T, lang, requests, setRequests, role } = ctx;
  if (!window.OS.Perms.can(role, 'requests.approve')) return <DeniedModule perm="requests.approve" />;
  function wrap(rs) {
    setRequests(rs);
  }
  return <div className="os-page"><h2 className="pg">{T('nav_requests')}</h2><div className="pgsub">{requests.filter(function (r) { return r.status === 'pending'; }).length} {lang === 'en' ? 'pending' : 'σε εκκρεμότητα'}</div>
    <RequestsView D={D} T={T} lang={lang} requests={requests} setRequests={wrap} /></div>;
}

/* ============================================================================
 *  ANALYTICS
 * ========================================================================== */
function AnalyticsModule() {
  const { D, T, lang, derived, month, role } = useOS();
  const cov = derived.coverage, st = derived.stats;
  const avgW = Math.round(cov.reduce(function (a, c) { return a + c.working; }, 0) / cov.length);
  const low = cov.filter(function (c) { return c.status === 'low'; }).length;
  const nights = cov.reduce(function (a, c) { return a + c.night; }, 0);
  const totalHours = st.rows.reduce(function (a, r) { return a + r.hours; }, 0);
  const maxW = Math.max.apply(null, cov.map(function (c) { return c.working; }));
  const topNights = st.rows.slice().sort(function (a, b) { return b.nights - a.nights; }).slice(0, 5);
  return (
    <div className="os-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div><h2 className="pg">{lang === 'en' ? 'Analytics' : 'Αναλυτικά'}</h2><div className="pgsub" style={{ margin: 0 }}>{lang === 'en' ? month.label.en : month.label.el}</div></div>
        {window.OS.Perms.can(role, 'export') && <button className="os-btn" onClick={function () { exportMonthCSV(month); }}><Icon name="pdf" size={14} />CSV</button>}
      </div>
      <div className="os-kpis">
        <div className="os-kpi"><div className="k">{lang === 'en' ? 'Avg working/day' : 'Μ.Ο. εργασίας/ημέρα'}</div><div className="v">{avgW}</div><div className="d">{lang === 'en' ? 'target' : 'στόχος'} {D.STAFF.min}–{D.STAFF.max}</div></div>
        <div className="os-kpi"><div className="k">{lang === 'en' ? 'Total hours' : 'Σύνολο ωρών'}</div><div className="v">{Math.round(totalHours)}</div><div className="d">{month.employees.length} {lang === 'en' ? 'staff' : 'άτομα'}</div></div>
        <div className="os-kpi"><div className="k">{lang === 'en' ? 'Night shifts' : 'Νυχτερινές'}</div><div className="v">{nights}</div></div>
        <div className="os-kpi"><div className="k">{lang === 'en' ? 'Understaffed days' : 'Ημέρες υποστελέχωσης'}</div><div className="v" style={{ color: low ? 'var(--red)' : 'var(--green)' }}>{low}</div></div>
        <div className="os-kpi"><div className="k">{lang === 'en' ? 'Warnings' : 'Προειδοποιήσεις'}</div><div className="v">{derived.warnings.length}</div></div>
      </div>
      <div className="os-panel">
        <h3>{lang === 'en' ? 'Coverage trend' : 'Τάση κάλυψης'}</h3>
        <div className="covchart">
          {cov.map(function (c) { return (
            <div key={c.day} className={'covcol' + (c.weekend ? ' wknd' : '')}>
              <span className="cv" style={{ color: c.status === 'low' ? 'var(--red)' : c.status === 'high' ? 'var(--amber)' : 'var(--green)' }}>{c.working}</span>
              <div className={'covbar ' + c.status} style={{ height: (c.working / maxW * 100) + '%' }}></div>
              <span className="cd">{c.day}</span>
            </div>); })}
        </div>
      </div>
      <div className="os-panel">
        <h3>{lang === 'en' ? 'Most night shifts' : 'Περισσότερες νύχτες'}</h3>
        {topNights.map(function (r) { return (
          <div key={r.ame} className="os-row">
            <span style={{ fontWeight: 600, fontSize: 13.5, minWidth: 180 }}>{r.name}</span>
            <div className="bar" style={{ flex: 1 }}><i style={{ width: (r.nights / (topNights[0].nights || 1) * 100) + '%', background: 'var(--night,#B4A7D6)' }}></i></div>
            <span className="mono" style={{ fontSize: 12, minWidth: 24, textAlign: 'right' }}>{r.nights}</span>
          </div>); })}
      </div>
    </div>
  );
}

/* ============================================================================
 *  AUTOMATIONS STUDIO
 * ========================================================================== */
function runAutomation(au, ctx) {
  const { derived, lang, month } = ctx; const OS = window.OS; const en = lang === 'en';
  let summary = '', count = 0;
  if (au.trigger === 'understaffed') {
    const low = derived.coverage.filter(function (c) { return c.status === 'low'; });
    count = low.length;
    summary = count ? (en ? count + ' understaffed day(s): ' + low.map(function (c) { return c.day; }).join(', ') : count + ' ημέρες υποστελέχωσης: ' + low.map(function (c) { return c.day; }).join(', ')) : (en ? 'All days adequately staffed.' : 'Όλες οι ημέρες επαρκώς στελεχωμένες.');
    if (count && au.action === 'notify') OS.Notify.add({ type: 'warning', title: en ? 'Understaffing detected' : 'Εντοπίστηκε υποστελέχωση', desc: summary, module: 'automation', priority: 'high' });
  } else if (au.trigger === 'nights') {
    const w = derived.warnings.filter(function (x) { return x.type === 'nights'; });
    count = w.length;
    summary = count ? (en ? count + ' staff over the night limit' : count + ' άτομα πάνω από το όριο νυχτών') : (en ? 'No night-limit breaches.' : 'Καμία υπέρβαση ορίου νυχτών.');
    if (count && au.action === 'notify') OS.Notify.add({ type: 'warning', title: en ? 'Night-limit breach' : 'Υπέρβαση ορίου νυχτών', desc: summary, module: 'automation', priority: 'high' });
  } else if (au.trigger === 'daily') {
    const avg = Math.round(derived.coverage.reduce(function (a, c) { return a + c.working; }, 0) / derived.coverage.length);
    summary = (en ? 'Daily summary: avg ' + avg + ' working/day, ' + derived.warnings.length + ' warnings.' : 'Ημερήσια σύνοψη: Μ.Ο. ' + avg + ' σε εργασία/ημέρα, ' + derived.warnings.length + ' προειδοποιήσεις.');
    OS.Notify.add({ type: 'insight', title: en ? 'Daily coverage report' : 'Ημερήσια αναφορά κάλυψης', desc: summary, module: 'automation' });
  }
  OS.Automations.update(au.id, { runs: (au.runs || 0) + 1, last: Date.now(), lastResult: summary });
  OS.Audit.add({ action: 'automation.run', target: au.name, role: ctx.role, module: 'automation' });
  OS.Memory.add({ kind: 'automation', text: au.name + ' → ' + summary });
  OS.Bus.emit('automation.triggered', { id: au.id, summary: summary });
  return summary;
}

function AutomationsModule() {
  const ctx = useOS(); const { lang, role } = ctx; const OS = window.OS;
  if (!OS.Perms.can(role, 'automation.manage')) return <DeniedModule perm="automation.manage" />;
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
  const list = OS.Automations.all();
  return (
    <div className="os-page">
      <h2 className="pg">{lang === 'en' ? 'Automation Studio' : 'Στούντιο Αυτοματισμών'}</h2>
      <div className="pgsub">{lang === 'en' ? 'Rules that watch the schedule and act — run them manually or on triggers.' : 'Κανόνες που παρακολουθούν το πρόγραμμα και δρουν — χειροκίνητα ή με triggers.'}</div>
      {list.map(function (au) { return (
        <div key={au.id} className="os-panel" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="settings" size={19} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{au.name}</span>
                <span className="os-tag normal" style={{ textTransform: 'uppercase' }}>{au.trigger}</span>
                <button className={'os-toggle' + (au.enabled ? ' on' : '')} style={{ marginLeft: 'auto' }} onClick={function () { OS.Automations.update(au.id, { enabled: !au.enabled }); force(); }}></button>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--soft)', marginTop: 5 }}>{au.desc}</div>
              {au.lastResult && <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 8, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 9, padding: '8px 11px' }}><Icon name="check" size={13} color="var(--green)" style={{ verticalAlign: -2, marginRight: 6 }} />{au.lastResult}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <button className="os-btn sm solid" onClick={function () { runAutomation(au, ctx); force(); }}><Icon name="arrow" size={13} />{lang === 'en' ? 'Run now' : 'Εκτέλεση'}</button>
                <span style={{ fontSize: 11.5, color: 'var(--faint)' }}>{lang === 'en' ? 'Runs' : 'Εκτελέσεις'}: {au.runs || 0}{au.last ? ' · ' + fmtAgo(au.last, lang) : ''}</span>
              </div>
            </div>
          </div>
        </div>); })}
    </div>
  );
}

/* ============================================================================
 *  TASKS
 * ========================================================================== */
function TasksModule() {
  const { lang, role } = useOS(); const OS = window.OS;
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
  const [title, setTitle] = React.useState('');
  const [filter, setFilter] = React.useState('open');
  const all = OS.Tasks.all();
  const list = all.filter(function (t) { return filter === 'all' || (filter === 'open' ? !t.done : t.done); });
  function add() { if (!title.trim()) return; OS.Tasks.add({ title: title.trim(), done: false, priority: 'normal', assignee: lang === 'en' ? 'Me' : 'Εγώ', module: 'tasks' }); OS.Bus.emit('task.assigned', { title: title }); setTitle(''); force(); }
  return (
    <div className="os-page" style={{ maxWidth: 760 }}>
      <h2 className="pg">{lang === 'en' ? 'Tasks' : 'Εργασίες'}</h2>
      <div className="pgsub">{all.filter(function (t) { return !t.done; }).length} {lang === 'en' ? 'open' : 'ανοιχτές'}</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input className="os-input" value={title} onChange={function (e) { setTitle(e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter') add(); }} placeholder={lang === 'en' ? 'Add a task…' : 'Νέα εργασία…'} />
        <button className="os-btn solid" onClick={add}><Icon name="plus" size={15} /></button>
      </div>
      <div className="seg small" style={{ marginBottom: 14 }}>
        {['open', 'done', 'all'].map(function (f) { return <button key={f} className={filter === f ? 'on' : ''} onClick={function () { setFilter(f); }}>{f === 'open' ? (lang === 'en' ? 'Open' : 'Ανοιχτές') : f === 'done' ? (lang === 'en' ? 'Done' : 'Ολοκληρωμένες') : (lang === 'en' ? 'All' : 'Όλες')}</button>; })}
      </div>
      {list.length === 0 && <div className="os-empty">{lang === 'en' ? 'Nothing here.' : 'Τίποτα εδώ.'}</div>}
      {list.map(function (t) { return (
        <div key={t.id} className="os-row" style={{ borderBottom: '1px solid var(--line)' }}>
          <button className="os-toggle" style={{ width: 26, height: 26, borderRadius: 8, background: t.done ? 'var(--green)' : 'var(--line2)' }} onClick={function () { OS.Tasks.update(t.id, { done: !t.done }); force(); }}>
            {t.done && <Icon name="check" size={15} color="#fff" />}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? .55 : 1 }}>{t.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{t.assignee}{t.due ? ' · ' + t.due : ''}</div>
          </div>
          <span className={'os-tag ' + (t.priority || 'normal')}>{t.priority || 'normal'}</span>
          <button className="os-iconbtn" style={{ width: 30, height: 30 }} onClick={function () { OS.Tasks.remove(t.id); force(); }}><Icon name="x" size={14} /></button>
        </div>); })}
    </div>
  );
}

/* ============================================================================
 *  NOTES
 * ========================================================================== */
function NotesModule() {
  const { lang } = useOS(); const OS = window.OS;
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState({ title: '', body: '' });
  const list = OS.Notes.all().sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.at - a.at; });
  function save() { if (!draft.title.trim()) return; OS.Notes.add({ title: draft.title.trim(), body: draft.body.trim(), at: Date.now(), pinned: false }); setDraft({ title: '', body: '' }); setOpen(false); force(); }
  return (
    <div className="os-page" style={{ maxWidth: 820 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div><h2 className="pg">{lang === 'en' ? 'Notes' : 'Σημειώσεις'}</h2><div className="pgsub" style={{ margin: 0 }}>{list.length} {lang === 'en' ? 'notes' : 'σημειώσεις'}</div></div>
        <button className="os-btn solid" onClick={function () { setOpen(!open); }}><Icon name="plus" size={15} />{lang === 'en' ? 'New' : 'Νέα'}</button>
      </div>
      {open && <div className="os-panel">
        <input className="os-input" placeholder={lang === 'en' ? 'Title' : 'Τίτλος'} value={draft.title} onChange={function (e) { setDraft(Object.assign({}, draft, { title: e.target.value })); }} style={{ marginBottom: 9 }} />
        <textarea className="os-textarea" placeholder={lang === 'en' ? 'Write…' : 'Γράψε…'} value={draft.body} onChange={function (e) { setDraft(Object.assign({}, draft, { body: e.target.value })); }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}><button className="os-btn solid" onClick={save}>{lang === 'en' ? 'Save' : 'Αποθήκευση'}</button><button className="os-btn" onClick={function () { setOpen(false); }}>{lang === 'en' ? 'Cancel' : 'Άκυρο'}</button></div>
      </div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 13 }}>
        {list.map(function (n) { return (
          <div key={n.id} className="os-panel" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14.5, flex: 1 }}>{n.title}</span>
              <button className="os-iconbtn" style={{ width: 28, height: 28 }} onClick={function () { OS.Notes.update(n.id, { pinned: !n.pinned }); force(); }}><Icon name="sparkle" size={14} color={n.pinned ? 'var(--amber)' : 'var(--faint)'} /></button>
              <button className="os-iconbtn" style={{ width: 28, height: 28 }} onClick={function () { OS.Notes.remove(n.id); force(); }}><Icon name="x" size={14} /></button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--soft)', marginTop: 7, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.body}</div>
            <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 9 }}>{fmtAgo(n.at, lang)}</div>
          </div>); })}
      </div>
    </div>
  );
}

Object.assign(window, {
  LauncherModule, ScheduleGridModule, PublishModule: PublishModal, PublishModal, CoverageModule, WarningsModule, FairnessModule, RequestsModule,
  AnalyticsModule, AutomationsModule, TasksModule, NotesModule, runAutomation, exportMonthCSV
});
