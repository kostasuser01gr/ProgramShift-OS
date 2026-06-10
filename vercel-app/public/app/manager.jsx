/* app/manager.jsx — manager/owner desktop dashboard (inside browser frame) */
const { useState: useStateM, useMemo } = React;

/* editable shift palette (the real set) */
const SHIFT_OPTIONS = [
  '04:00-12:00','05:00-13:00','06:00-14:00','07:00-15:00','07:30-15:30','08:00-16:00',
  '09:00-17:00','10:00-18:00','10:30-18:30','11:00-19:00','12:00-20:00','12:30-20:30',
  '13:00-21:00','13:30-21:30','14:00-22:00','14:30-22:30','15:00-23:00','15:30-23:30',
  '16:00-00:00','17:00-01:00','18:00-02:00','22:00-06:00','23:00-07:00',
  'ΡΕΠΟ','ΑΔΕΙΑ 5ΗΜΕΡΟΥ','ΑΝΑΡΡΩΤΙΚΗ 5ΗΜΕΡΟΥ'
];

function ManagerApp({ lang, role, month }) {
  const D = window.APP_DATA;
  const T = (k) => window.t(k, lang);
  const mlabel = lang === 'en' ? month.label.en : month.label.el;
  const [view, setView] = useStateM('grid');
  const [emps, setEmps] = useStateM(() => month.employees.map(e => ({ ...e, shifts: e.shifts.slice(), cats: e.cats.slice() })));
  const [edit, setEdit] = useStateM(null);          // {ei,j}
  const [requests, setRequests] = useStateM(D.requests.slice());
  const [published, setPublished] = useStateM(false);
  const [importOpen, setImportOpen] = useStateM(false);

  const derived = useMemo(() => recompute(D, emps, month.dates), [emps, month]);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  function setCell(ei, j, value) {
    setEmps(prev => {
      const n = prev.slice();
      const e = { ...n[ei], shifts: n[ei].shifts.slice(), cats: n[ei].cats.slice() };
      e.shifts[j] = value; e.cats[j] = D.category(value);
      n[ei] = e; month.employees = n; return n;
    });
    setEdit(null);
  }

  const NAV = [
    ['grid', 'grid', 'nav_grid', 0],
    ['coverage', 'chart', 'nav_coverage', 0],
    ['warnings', 'warning', 'nav_warnings', derived.warnings.length],
    ['requests', 'swap', 'nav_requests', pendingCount],
    ['fairness', 'users', 'nav_fairness', 0]
  ];
  if (role === 'owner') NAV.push(['settings', 'settings', 'nav_settings', 0]);

  const titleMap = { grid: 'nav_grid', coverage: 'nav_coverage', warnings: 'nav_warnings', requests: 'nav_requests', fairness: 'nav_fairness', settings: 'nav_settings' };
  const subMap = {
    grid: month.employees.length + (lang === 'en' ? ' employees · ' : ' υπάλληλοι · ') + month.days + (lang === 'en' ? ' days' : ' ημέρες'),
    coverage: lang === 'en' ? 'Staffing per day' : 'Στελέχωση ανά ημέρα',
    warnings: derived.warnings.length + (lang === 'en' ? ' issues found' : ' ευρήματα'),
    requests: pendingCount + (lang === 'en' ? ' pending' : ' σε εκκρεμότητα'),
    fairness: lang === 'en' ? 'Workload balance across the team' : 'Ισορροπία φόρτου στην ομάδα',
    settings: lang === 'en' ? 'Thresholds, members & automation' : 'Όρια, μέλη & αυτοματισμοί'
  };

  return (
    <div className="mgr">
      <aside className="side">
        <div className="logo"><div className="dot serif">Σ</div><div><b>{T('appname')}</b><small>{mlabel}</small></div></div>
        {NAV.map(([id, ic, label, badge]) => (
          <div key={id} className={'navitem' + (view === id ? ' on' : '')} onClick={() => setView(id)}>
            <Icon name={ic} size={18} />{T(label)}{badge > 0 && <span className="badge">{badge}</span>}
          </div>
        ))}
        <div className="me"><div className="avatar">{role === 'owner' ? 'ΣΦ' : 'ΔΧ'}</div>
          <div style={{ fontSize: 12 }}><div style={{ fontWeight: 600 }}>{role === 'owner' ? 'Σοφία' : (lang === 'en' ? 'Manager' : 'Διαχειριστής')}</div>
            <div style={{ color: 'var(--faint)' }}>{role === 'owner' ? T('role_owner') : T('role_manager')}</div></div></div>
      </aside>

      <div className="main">
        <div className="mhead">
          <div><h2>{T(titleMap[view])}</h2><div className="sub">{subMap[view]}</div></div>
          <div className="mactions">
            {view === 'grid' && <React.Fragment>
              <button className="mbtn" onClick={() => setImportOpen(true)}><Icon name="upload" size={15} />{T('imp_btn')}</button>
              <button className="mbtn"><Icon name="search" size={15} />{T('search')}</button>
              <button className="mbtn"><Icon name="check" size={15} />{T('validate')}</button>
              <button className="mbtn"><Icon name="pdf" size={15} />{T('export_pdf')}</button>
              <button className={'mbtn solid'} onClick={() => setPublished(true)}><Icon name="publish" size={15} />{published ? T('published') : T('publish')}</button>
            </React.Fragment>}
          </div>
        </div>
        <div className="mbody">
          {view === 'grid' && <GridView {...{ D, T, lang, month, emps, setEdit }} />}
          {view === 'coverage' && <CoverageView {...{ D, T, lang, derived }} />}
          {view === 'warnings' && <WarningsView {...{ D, T, lang, derived }} />}
          {view === 'requests' && <RequestsView {...{ D, T, lang, requests, setRequests }} />}
          {view === 'fairness' && <FairnessView {...{ D, T, lang, derived }} />}
          {view === 'settings' && <OwnerSettings {...{ D, T, lang }} />}
        </div>
      </div>

      {edit && <EditModal {...{ D, T, lang, month, emps, edit, setEdit, setCell }} />}
      {importOpen && <ImportModal {...{ D, T, lang, close: () => setImportOpen(false) }} />}
    </div>
  );
}

/* ---------- IMPORT MODAL ---------- */
function ImportModal({ D, T, lang, close }) {
  const [file, setFile] = useStateM(null);     // { name }
  const [parsed, setParsed] = useStateM(null);  // { days, employees } | 'pending'
  const inputRef = React.useRef(null);

  function handleFile(f) {
    if (!f) return;
    setFile({ name: f.name });
    if (/\.csv$|\.tsv$|\.txt$/i.test(f.name)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const p = D.parseScheduleCSV(String(e.target.result || ''));
        setParsed(p || { days: D.active().days, employees: demoEmps(D), fallback: true });
      };
      reader.readAsText(f);
    } else {
      // .xlsx/.xls can't be parsed client-side without a library → demo preview
      setParsed({ days: D.active().days, employees: demoEmps(D), fallback: true });
    }
  }
  function demoEmps(D) {
    return D.active().employees.map((e) => ({ ame: e.ame, surname: e.surname, first: e.first, name: e.name, shifts: e.shifts.slice() }));
  }
  function onDrop(e) { e.preventDefault(); handleFile(e.dataTransfer.files && e.dataTransfer.files[0]); }
  function create() {
    const mo = window.__importMonth ? window.__importMonth(parsed, file && file.name) : null;
    close();
  }

  const previewRows = parsed && parsed.employees ? parsed.employees.slice(0, 5) : [];

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(35,32,27,.42)', zIndex: 70, display: 'grid', placeItems: 'center' }} onClick={close}>
      <div style={{ background: 'var(--paper)', borderRadius: 18, padding: 24, width: 560, maxWidth: '92%', boxShadow: '0 30px 70px rgba(0,0,0,.32)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}><Icon name="upload" size={19} /></div>
          <div>
            <div className="serif" style={{ fontSize: 21, lineHeight: 1.1 }}>{T('imp_title')}</div>
            <div style={{ fontSize: 12.5, color: 'var(--soft)' }}>{T('imp_sub')}</div>
          </div>
        </div>

        {!parsed && (
          <div onClick={() => inputRef.current && inputRef.current.click()} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
            style={{ marginTop: 16, border: '2px dashed var(--line2)', borderRadius: 14, padding: '34px 20px', textAlign: 'center', cursor: 'pointer', background: 'var(--card)' }}>
            <Icon name="upload" size={30} color="var(--accent)" />
            <div style={{ fontWeight: 600, fontSize: 15, marginTop: 10 }}>{T('imp_drop')}</div>
            <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 6, fontFamily: 'var(--mono)' }}>{T('imp_formats')}</div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files && e.target.files[0])} />
          </div>
        )}

        {parsed && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--green-soft)', border: '1px solid #bcd3b6', borderRadius: 11, padding: '11px 14px', color: 'var(--green)' }}>
              <Icon name="check" size={17} />
              <div style={{ fontSize: 13.5 }}>
                <strong>{file && file.name}</strong> · {T('imp_detected')} {parsed.employees.length} {T('imp_emps')} · {parsed.days} {T('imp_days')}
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--soft)', margin: '16px 2px 8px' }}>{T('imp_preview')}</div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'var(--card)' }}>
              {previewRows.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: i ? '1px solid var(--line)' : 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, minWidth: 150 }}>{e.surname} {e.first}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)', minWidth: 44 }}>{e.ame}</span>
                  <div style={{ display: 'flex', gap: 3, overflow: 'hidden' }}>
                    {e.shifts.slice(0, 8).map((s, j) => { const c = D.catOf(s); return <span key={j} style={{ fontFamily: 'var(--mono)', fontSize: 8.5, fontWeight: 600, padding: '2px 4px', borderRadius: 4, background: c.bg, color: c.fg, border: '1px solid ' + c.bd, whiteSpace: 'nowrap' }}>{s === 'ΡΕΠΟ' ? 'Ρ' : s.split('-')[0]}</span>; })}
                    <span style={{ fontSize: 9, color: 'var(--faint)', alignSelf: 'center' }}>…</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 10 }}>{T('imp_note')}</div>
            <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
              <button className="mbtn" onClick={() => { setParsed(null); setFile(null); }}>{T('imp_another')}</button>
              <button className="mbtn solid" style={{ marginLeft: 'auto' }} onClick={create}><Icon name="calendar" size={15} />{T('imp_create')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- recompute coverage / warnings / stats from current grid ---------- */
function recompute(D, emps, dates) {
  const DAYS = dates.length;
  // coverage
  const coverage = dates.map((dd, j) => {
    let working = 0, repo = 0, leave = 0, night = 0, total = 0;
    emps.forEach(e => {
      const c = e.cats[j];
      if (c === 'empty') return; total++;
      if (c === 'repo') repo++; else if (c === 'leave') leave++;
      else { working++; if (c === 'night') night++; }
    });
    const status = working < D.STAFF.min ? 'low' : (working > D.STAFF.max ? 'high' : 'ok');
    return { day: dd.day, dow: dd.dow, weekend: dd.weekend, working, repo, leave, night, total, status };
  });
  // warnings
  const warnings = [];
  emps.forEach(e => {
    let nightRun = 0, workRun = 0;
    for (let j = 0; j < DAYS; j++) {
      const t = D.parseShift(e.shifts[j]);
      if (t && (t.startHour === 22 || t.startHour === 23)) { nightRun++; if (nightRun === D.RULES.maxNights + 1) warnings.push(mw('hard', e, j, dates, lang_('nights', e, D), null, 'nights')); } else nightRun = 0;
      if (t) { workRun++; if (workRun === D.RULES.maxWork + 1) warnings.push(mw('hard', e, j, dates, { el: 'Πάνω από ' + D.RULES.maxWork + ' ημέρες χωρίς ρεπό', en: 'More than ' + D.RULES.maxWork + ' workdays without a day off' }, null, 'streak')); } else workRun = 0;
      if (t && j + 1 < DAYS) { const nx = D.parseShift(e.shifts[j + 1]); if (nx) { const rest = (1440 + nx.start) - t.end; if (rest >= 0 && rest < D.RULES.minRest * 60) warnings.push(mw('hard', e, j, dates, { el: 'Ανάπαυση ' + (rest / 60).toFixed(1) + 'ω πριν την επόμενη βάρδια', en: (rest / 60).toFixed(1) + 'h rest before next shift' }, j + 1, 'rest')); } }
      if (t && j > 0 && j + 1 < DAYS && D.isLeave(e.shifts[j - 1]) && D.isLeave(e.shifts[j + 1])) warnings.push(mw('soft', e, j, dates, { el: 'Βάρδια ανάμεσα σε δύο άδειες', en: 'Shift between two leave days' }, null, 'sandwich'));
    }
  });
  warnings.sort((a, b) => a.empName < b.empName ? -1 : (a.empName > b.empName ? 1 : a.day - b.day));
  // stats
  const rows = emps.map(e => {
    let days = 0, hours = 0, nights = 0, wknd = 0, repo = 0;
    for (let j = 0; j < DAYS; j++) {
      const c = e.cats[j];
      if (c === 'repo') { repo++; continue; }
      if (c === 'leave' || c === 'empty') continue;
      const t = D.parseShift(e.shifts[j]); if (!t) continue;
      days++; hours += t.hours; if (c === 'night') nights++; if (dates[j].weekend) wknd++;
    }
    return { idx: e.idx, name: e.name, ame: e.ame, days, hours: Math.round(hours * 10) / 10, nights, wknd, repo };
  });
  const avg = {}; ['days', 'hours', 'nights', 'wknd', 'repo'].forEach(k => avg[k] = Math.round(rows.reduce((a, r) => a + r[k], 0) / rows.length * 10) / 10);
  return { coverage, warnings, stats: { rows, avg } };
}
function lang_(type, e, D) { return { el: 'Πάνω από ' + D.RULES.maxNights + ' συνεχόμενες νύχτες', en: 'More than ' + D.RULES.maxNights + ' consecutive nights' }; }
function mw(sev, e, j, dates, msg, j2, type) { const mo = dates[j].date.getMonth() + 1; let dl = dates[j].day + '/' + mo; if (j2 != null) dl += '→' + dates[j2].day + '/' + (dates[j2].date.getMonth() + 1); return { sev, type: type || 'other', empName: e.name, ame: e.ame, day: dates[j].day, dateLabel: dl, el: msg.el, en: msg.en }; }

/* ---------- GRID ---------- */
function GridView({ D, T, lang, month, emps, setEdit }) {
  const dows = lang === 'en' ? D.DOW_EN : D.DOW_EL;
  return (
    <div className="gridwrap">
      <table className="schedule">
        <thead><tr>
          <th className="empcol" style={{ textAlign: 'left' }}>{T('employees_l')}</th>
          {month.dates.map(d => <th key={d.day} className={d.weekend ? 'wknd' : ''}>{d.day}<div style={{ fontWeight: 400, opacity: .7 }}>{dows[d.dow]}</div></th>)}
        </tr></thead>
        <tbody>
          {emps.map((e, ei) => (
            <tr key={e.ame}>
              <td className="empcol">{e.surname} <span style={{ color: 'var(--soft)', fontWeight: 400 }}>{e.first.split(' ')[0]}</span><span className="amecol">{e.ame}</span></td>
              {e.shifts.map((s, j) => {
                const c = D.CAT[e.cats[j]];
                const short = e.cats[j] === 'repo' ? 'Ρ' : e.cats[j] === 'leave' ? 'Α' : s.split('-')[0];
                return <td key={j} className="cell" title={e.name + ' · ' + month.dates[j].day + '/' + month.month + ' · ' + s} onClick={() => setEdit({ ei, j })}>
                  <div className="gchip" style={{ background: c.bg, borderColor: c.bd, color: c.fg }}>{short}</div>
                </td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- COVERAGE ---------- */
function CoverageView({ D, T, lang, derived }) {
  const cov = derived.coverage;
  const maxW = Math.max.apply(null, cov.map(c => c.working));
  const avgW = Math.round(cov.reduce((a, c) => a + c.working, 0) / cov.length);
  const lowDays = cov.filter(c => c.status === 'low').length;
  const totalNights = cov.reduce((a, c) => a + c.night, 0);
  const dows = lang === 'en' ? D.DOW_EN : D.DOW_EL;
  return (
    <div>
      <div className="cards k4" style={{ marginBottom: 16 }}>
        <div className="kpi"><div className="k">{T('working_now')} · {T('team_avg')}</div><div className="v">{avgW}</div><div className="d">{T('per_day')}</div></div>
        <div className="kpi"><div className="k">{T('low')}</div><div className="v" style={{ color: lowDays ? 'var(--red)' : 'var(--green)' }}>{lowDays}</div><div className="d">{lang === 'en' ? 'days under target' : 'ημέρες κάτω από όριο'}</div></div>
        <div className="kpi"><div className="k">{T('nights')}</div><div className="v">{totalNights}</div><div className="d">{lang === 'en' ? 'night shifts in month' : 'νυχτερινές τον μήνα'}</div></div>
        <div className="kpi"><div className="k">{T('set_staff')}</div><div className="v" style={{ fontSize: 24 }}>{D.STAFF.min}–{D.STAFF.max}</div><div className="d">{T('per_day')}</div></div>
      </div>
      <div className="panelc">
        <h3>{T('working_now')} · {T('per_day')}</h3>
        <div className="covchart">
          {cov.map(c => (
            <div key={c.day} className={'covcol' + (c.weekend ? ' wknd' : '')}>
              <span className="cv" style={{ color: c.status === 'low' ? 'var(--red)' : c.status === 'high' ? 'var(--amber)' : 'var(--green)' }}>{c.working}</span>
              <div className={'covbar ' + c.status} style={{ height: (c.working / maxW * 100) + '%' }} title={c.working + ' working'}></div>
              <span className="cd">{c.day}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 12, color: 'var(--soft)' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--green)', marginRight: 6 }}></span>{T('ok')}</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--red)', marginRight: 6 }}></span>{T('low')}</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--amber)', marginRight: 6 }}></span>{T('high')}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- WARNINGS ---------- */
function WarningsView({ D, T, lang, derived }) {
  const [f, setF] = useStateM('all');
  const list = derived.warnings.filter(w => f === 'all' || w.sev === f);
  const hard = derived.warnings.filter(w => w.sev === 'hard').length;
  return (
    <div>
      <div className="filterbar">
        <Segmented value={f} onChange={setF} options={[{ v: 'all', l: T('all_warnings') + ' · ' + derived.warnings.length }, { v: 'hard', l: '🛑 ' + T('hard') + ' · ' + hard }, { v: 'soft', l: '⚠️ ' + T('soft') + ' · ' + (derived.warnings.length - hard) }]} />
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--faint)' }}>{T('last_checked')}: {T('just_now')}</span>
      </div>
      {list.length === 0 && <div className="empty-hint"><Icon name="check" size={30} color="var(--green)" /><div style={{ marginTop: 8 }}>{T('no_warnings')}</div></div>}
      {list.map((w, i) => (
        <div key={i} className="warn">
          <div className={'sev ' + w.sev}>{w.sev === 'hard' ? '🛑' : '⚠️'}</div>
          <div><div className="wn">{w.empName} <span style={{ color: 'var(--faint)', fontWeight: 400 }} className="mono">{w.ame}</span></div><div className="wd">{lang === 'en' ? w.en : w.el}</div></div>
          <div className="wdate">{w.dateLabel}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- REQUESTS ---------- */
function RequestsView({ D, T, lang, requests, setRequests }) {
  function act(id, status) { setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r)); }
  return (
    <div style={{ maxWidth: 720 }}>
      {requests.map(r => {
        const e = D.employees[r.empIdx];
        return (
          <div key={r.id} className="reqcard">
            <div className="rt">
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="ic" style={{ background: r.type === 'swap' ? 'var(--blue-soft)' : 'var(--accent-soft)', color: r.type === 'swap' ? 'var(--blue)' : 'var(--accent)' }}><Icon name={r.type === 'swap' ? 'swap' : 'cal2'} size={18} /></div>
                <div><div className="desc">{lang === 'en' ? r.en : r.el}</div><div className="sub">{T('requested_by')} {e.name} · <span className="mono">{e.ame}</span></div></div>
              </div>
              {r.status === 'pending'
                ? <div style={{ display: 'flex', gap: 8 }}>
                    <button className="mbtn" onClick={() => act(r.id, 'declined')}><Icon name="x" size={14} />{T('decline')}</button>
                    <button className="mbtn solid" onClick={() => act(r.id, 'approved')}><Icon name="check" size={14} />{T('approve')}</button>
                  </div>
                : <span className={'pill ' + r.status}>{T(r.status)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- FAIRNESS ---------- */
function FairnessView({ D, T, lang, derived }) {
  const { rows, avg } = derived.stats;
  const maxH = Math.max.apply(null, rows.map(r => r.hours));
  return (
    <div className="panelc" style={{ padding: '8px 20px 14px' }}>
      <table className="data">
        <thead><tr>
          <th>{T('employees_l')}</th><th className="num">{T('fair_days')}</th>
          <th>{T('fair_hours')}</th><th className="num">{T('fair_nights')}</th>
          <th className="num">{T('fair_wknd')}</th><th className="num">{T('fair_repo')}</th>
        </tr></thead>
        <tbody>
          {rows.map(r => {
            const hi = r.nights > avg.nights + 2;
            return (
              <tr key={r.ame}>
                <td>{r.name} <span className="mono" style={{ color: 'var(--faint)', fontSize: 11 }}>{r.ame}</span></td>
                <td className="num">{r.days}</td>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><div className="bar"><i style={{ width: (r.hours / maxH * 100) + '%', background: 'var(--blue)' }}></i></div><span className="mono" style={{ fontSize: 11 }}>{r.hours}</span></div></td>
                <td className="num">{r.nights}{hi && <span className="flagdot" style={{ background: 'var(--red)' }} title={T('high_nights')}></span>}</td>
                <td className="num">{r.wknd}</td>
                <td className="num">{r.repo}</td>
              </tr>
            );
          })}
          <tr className="avg"><td>{T('team_avg')}</td><td className="num">{avg.days}</td><td>{avg.hours}</td><td className="num">{avg.nights}</td><td className="num">{avg.wknd}</td><td className="num">{avg.repo}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

/* ---------- edit modal ---------- */
function EditModal({ D, T, lang, month, emps, edit, setEdit, setCell }) {
  const e = emps[edit.ei];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(35,32,27,.4)', zIndex: 60, display: 'grid', placeItems: 'center' }} onClick={() => setEdit(null)}>
      <div style={{ background: 'var(--paper)', borderRadius: 16, padding: 22, width: 460, maxWidth: '90%', boxShadow: '0 30px 70px rgba(0,0,0,.3)' }} onClick={ev => ev.stopPropagation()}>
        <div style={{ fontSize: 12, color: 'var(--soft)', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase' }}>{T('change_shift')}</div>
        <div className="serif" style={{ fontSize: 21, margin: '4px 0 2px' }}>{e.name}</div>
        <div style={{ color: 'var(--soft)', fontSize: 13, marginBottom: 16 }}>{T('on_day')} {month.dates[edit.j].day} {lang === 'en' ? month.label.en : month.label.el} · {lang === 'en' ? 'currently' : 'τώρα'}: <strong>{e.shifts[edit.j]}</strong></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, maxHeight: 280, overflowY: 'auto' }}>
          {SHIFT_OPTIONS.map(opt => {
            const c = D.catOf(opt); const sel = e.shifts[edit.j] === opt;
            return <button key={opt} onClick={() => setCell(edit.ei, edit.j, opt)}
              style={{ appearance: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, padding: '7px 10px', borderRadius: 8,
                background: c.bg, color: c.fg, border: sel ? '2px solid var(--ink)' : ('1px solid ' + c.bd) }}>{opt}</button>;
          })}
        </div>
        <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => setEdit(null)}>{T('cancel')}</button>
      </div>
    </div>
  );
}

Object.assign(window, { ManagerApp });
