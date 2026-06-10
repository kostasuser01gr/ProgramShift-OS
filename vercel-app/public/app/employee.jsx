/* app/employee.jsx — employee mobile experience (inside iOS frame) */
const { useState: useStateE } = React;

const ME_IDX = 5;       // logged-in employee: ΔΕΣΔΕΝΑΚΗ ΧΡΙΣΤΙΝΑ

function EmployeeApp({ lang, month }) {
  const D = window.APP_DATA;
  const T = (k) => window.t(k, lang);
  const TODAY = month.today;
  const mlabel = lang === 'en' ? month.label.en : month.label.el;
  const me = month.employees[ME_IDX];
  const [tab, setTab] = useStateE('home');
  const [sheet, setSheet] = useStateE(null);          // null | 'swap' | 'leave' | 'avail'
  const [reqs, setReqs] = useStateE(D.requests.filter(r => r.empIdx === ME_IDX));
  const [prefs, setPrefs] = useStateE({ morning: true, noNights: false });
  const [toast, setToast] = useStateE(null);

  const firstName = me.first.split(' ')[0];
  const greet = lang === 'en' ? 'Good morning' : 'Καλημέρα';

  // derived
  const nextIdx = (() => {
    for (let j = TODAY - 1; j < month.days; j++) {
      const c = me.cats[j];
      if (c !== 'repo' && c !== 'leave' && c !== 'empty') return j;
    }
    return null;
  })();
  const stats = D.computeStats(month).rows[ME_IDX];

  function submitReq() {
    const day = sheet === 'avail' ? null : (window.__pickDay || null);
    const nr = {
      id: 'new' + Date.now(), type: sheet === 'avail' ? 'leave' : sheet, status: 'pending',
      day: day || 0, el: sheet === 'swap' ? ('Αλλαγή βάρδιας ' + (day || '?') + '/' + month.month)
        : sheet === 'leave' ? ('Αίτηση άδειας ' + (day || '?') + '/' + month.month) : 'Δήλωση διαθεσιμότητας',
      en: sheet === 'swap' ? ('Swap shift on ' + (day || '?') + ' Jun')
        : sheet === 'leave' ? ('Leave request ' + (day || '?') + ' Jun') : 'Availability update'
    };
    setReqs([nr, ...reqs]);
    setSheet(null); window.__pickDay = null;
    setToast(T('request_sent'));
    setTimeout(() => setToast(null), 1900);
  }

  return (
    <div className="emp">
      <div className="emp-topsafe"></div>
      <div className="emp-scroll">
        {tab === 'home'     && <EmpHome {...{ D, T, lang, month, mlabel, TODAY, me, firstName, greet, nextIdx, stats, setTab }} />}
        {tab === 'month'    && <EmpMonth {...{ D, T, lang, month, me }} />}
        {tab === 'team'     && <EmpTeam {...{ D, T, lang, month, mlabel, TODAY }} />}
        {tab === 'requests' && <EmpRequests {...{ D, T, lang, mlabel, reqs, setSheet }} />}
        {tab === 'me'       && <EmpMe {...{ D, T, lang, me, prefs, setPrefs }} />}
      </div>

      <EmpTabBar tab={tab} setTab={setTab} T={T} pending={reqs.filter(r => r.status === 'pending').length} />

      {toast && (
        <div style={{ position: 'absolute', bottom: 96, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 90 }}>
          <div style={{ background: '#23201b', color: '#f6f3ec', padding: '11px 20px', borderRadius: 30, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,.25)' }}>
            <Icon name="check" size={15} style={{ marginRight: 7, verticalAlign: -2 }} />{toast}
          </div>
        </div>
      )}

      {sheet && <EmpSheet {...{ D, T, lang, month, sheet, setSheet, submitReq, me }} />}
    </div>
  );
}

/* ---------- visibility helpers (employee sees only released days) ---------- */
function empCanSee(month, j) { return !window.OS || !window.OS.Visibility ? true : window.OS.Visibility.canSee(month.key, j, 'employee'); }
function empPublished(month) { return !window.OS || !window.OS.Visibility ? true : window.OS.Visibility.get(month.key).published; }
function NotReleased({ T }) {
  return (
    <div style={{ padding: '24px 18px' }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, padding: '36px 22px', textAlign: 'center' }}>
        <div style={{ width: 62, height: 62, borderRadius: 18, background: 'var(--amber-soft, #f6ecd6)', color: 'var(--amber, #9a6b16)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}><Icon name="shield" size={28} /></div>
        <div style={{ fontWeight: 600, fontSize: 17 }}>{T('not_released')}</div>
        <div style={{ fontSize: 13.5, color: 'var(--soft)', marginTop: 7, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>{T('not_released_sub')}</div>
      </div>
    </div>
  );
}

/* ---------- HOME ---------- */
function EmpHome({ D, T, lang, month, mlabel, TODAY, me, firstName, greet, nextIdx, stats, setTab }) {
  const weekStart = (() => { let s = TODAY - 1; while (month.dates[s] && month.dates[s].dow !== 1 && s > 0) s--; return s; })();
  const week = [];
  for (let k = 0; k < 7 && weekStart + k < month.days; k++) week.push(weekStart + k);
  const published = empPublished(month);
  const canSee = (j) => empCanSee(month, j);
  const vnext = (() => { for (let j = TODAY - 1; j < month.days; j++) { if (!canSee(j)) continue; const c = me.cats[j]; if (c !== 'repo' && c !== 'leave' && c !== 'empty') return j; } return null; })();

  return (
    <div>
      <div className="emp-head">
        <div className="eyebrow">{mlabel}</div>
        <h1>{greet},<br />{firstName}</h1>
        <div className="who">{me.name} · {T('role_employee')} · <span className="mono">{me.ame}</span></div>
      </div>
      {!published ? <NotReleased T={T} /> : (
      <div className="emp-body">
        {vnext != null && (
          <div className="nextcard">
            <div className="lab">{T('next_shift')}</div>
            <div className="big">{me.shifts[vnext]}</div>
            <div className="meta">{(lang === 'en' ? D.DOW_EN : D.DOW_EL)[month.dates[vnext].dow]} {month.dates[vnext].day} {mlabel}
              {vnext === TODAY - 1 ? ' · ' + T('today') : ''}</div>
            <div className="tagchip"><ShiftChip value={me.shifts[vnext]} /></div>
          </div>
        )}

        <div className="statrow">
          <div className="stat"><div className="v">{stats.hours}<span style={{ fontSize: 14 }}>{T('hours_short')}</span></div><div className="k">{T('hours_month')}</div></div>
          <div className="stat"><div className="v">{stats.nights}</div><div className="k">{T('nights')}</div></div>
          <div className="stat"><div className="v">{stats.repo}</div><div className="k">{T('days_off')}</div></div>
        </div>

        <div className="sectitle">{T('this_week')}<a onClick={() => setTab('month')}>{T('view_month')} →</a></div>
        <div className="weekstrip">
          {week.map(j => {
            const cat = D.CAT[me.cats[j]];
            const locked = !canSee(j);
            return (
              <div key={j} className={'dayrow' + (j === TODAY - 1 ? ' todayrow' : '')}>
                <div className="dnum"><div className="n">{month.dates[j].day}</div><div className="w">{(lang === 'en' ? D.DOW_EN : D.DOW_EL)[month.dates[j].dow]}</div></div>
                {locked ? (
                  <div className="info"><div className="t" style={{ filter: 'blur(5px)', userSelect: 'none', opacity: .7 }}>{me.shifts[j] || '—'}</div><div className="s">🔒 {T('locked_day')}</div></div>
                ) : (
                  <div className="info">
                    <div className="t">{me.cats[j] === 'repo' ? T('days_off') : me.cats[j] === 'leave' ? (lang === 'en' ? 'Leave' : 'Άδεια') : me.shifts[j]}</div>
                    <div className="s">{lang === 'en' ? cat.en : cat.el}</div>
                  </div>
                )}
                {locked ? <Icon name="shield" size={16} color="var(--faint)" /> : <ShiftChip value={me.shifts[j]} />}
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}

/* ---------- MONTH ---------- */
function EmpMonth({ D, T, lang, month, me }) {
  const lead = month.dates[0].dow === 0 ? 6 : month.dates[0].dow - 1; // Monday-first
  const dows = lang === 'en' ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] : ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'];
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let j = 0; j < month.days; j++) cells.push(j);
  return (
    <div>
      <div className="emp-head"><div className="eyebrow">{me.name}</div><h1>{T('my_month')}</h1></div>
      <div className="emp-body">
        <div className="cal">
          <div className="cal-grid">{dows.map(d => <div key={d} className="cal-dow">{d}</div>)}</div>
          <div className="cal-grid" style={{ marginTop: 4 }}>
            {cells.map((j, i) => {
              if (j == null) return <div key={i} className="cal-cell empty"></div>;
              if (!empCanSee(month, j)) return (
                <div key={i} className="cal-cell" style={{ background: 'var(--line)', borderColor: 'var(--line2)', color: 'var(--faint)' }}>
                  <div className="cn">{month.dates[j].day}</div>
                  <div className="cs" style={{ filter: 'blur(3px)', userSelect: 'none' }}>🔒</div>
                </div>
              );
              const c = D.CAT[me.cats[j]];
              const short = me.cats[j] === 'repo' ? 'Ρ' : me.cats[j] === 'leave' ? 'Α' : me.shifts[j].split('-')[0];
              return (
                <div key={i} className="cal-cell" style={{ background: c.bg, borderColor: c.bd, color: c.fg }}>
                  <div className="cn">{month.dates[j].day}</div>
                  <div className="cs">{short}</div>
                </div>
              );
            })}
          </div>
        </div>
        <Legend D={D} lang={lang} T={T} cats={['morning', 'midday', 'late', 'night', 'repo', 'leave']} />
      </div>
    </div>
  );
}

function Legend({ D, lang, T, cats }) {
  return (
    <div>
      <div className="sectitle" style={{ marginBottom: 6 }}>{T('legend')}</div>
      <div className="legend">
        {cats.map(c => (
          <div key={c} className="legitem">
            <span className="sw" style={{ background: D.CAT[c].bg, borderColor: D.CAT[c].bd }}></span>
            {lang === 'en' ? D.CAT[c].en : D.CAT[c].el}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- TEAM WEEK ---------- */
function EmpTeam({ D, T, lang, month, mlabel, TODAY }) {
  const weekStart = (() => { let s = TODAY - 1; while (month.dates[s] && month.dates[s].dow !== 1 && s > 0) s--; return s; })();
  const days = []; for (let k = 0; k < 7 && weekStart + k < month.days; k++) days.push(weekStart + k);
  const dows = lang === 'en' ? D.DOW_EN : D.DOW_EL;
  return (
    <div>
      <div className="emp-head"><div className="eyebrow">{mlabel}</div><h1>{T('team_week')}</h1></div>
      {!empPublished(month) ? <NotReleased T={T} /> : (
      <div className="emp-body">
        <div className="teamtable">
          <div className="teamrow head">
            <div className="nm">{T('employees_l')}</div>
            {days.map(j => <div key={j} className="cl"><span>{dows[month.dates[j].dow]}</span><span style={{ fontWeight: 700, color: 'var(--ink)' }}>{month.dates[j].day}</span></div>)}
          </div>
          {month.employees.map(e => (
            <div key={e.idx} className="teamrow" style={e.idx === ME_IDX ? { background: '#fbf6ea' } : null}>
              <div className="nm">{e.surname}</div>
              {days.map(j => <div key={j} className="cl">{empCanSee(month, j) ? <ShiftChip value={e.shifts[j]} mini /> : <span className="minichip" style={{ filter: 'blur(3px)', background: 'var(--line)', borderColor: 'var(--line2)', color: 'var(--faint)' }}>🔒</span>}</div>)}
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}

/* ---------- REQUESTS ---------- */
function EmpRequests({ D, T, lang, mlabel, reqs, setSheet }) {
  return (
    <div>
      <div className="emp-head"><div className="eyebrow">{mlabel}</div><h1>{T('tab_requests')}</h1></div>
      <div className="emp-body">
        <button className="bigbtn" onClick={() => setSheet('swap')}>
          <span className="ic"><Icon name="swap" size={20} /></span>
          <span><span className="t" style={{ display: 'block' }}>{T('req_swap')}</span><span className="s">{lang === 'en' ? 'Trade a shift with a colleague' : 'Άλλαξε βάρδια με συνάδελφο'}</span></span>
          <span className="arr"><Icon name="chevron" size={18} /></span>
        </button>
        <button className="bigbtn" onClick={() => setSheet('leave')}>
          <span className="ic"><Icon name="cal2" size={20} /></span>
          <span><span className="t" style={{ display: 'block' }}>{T('req_leave')}</span><span className="s">{lang === 'en' ? 'ΑΔΕΙΑ — submit for approval' : 'ΑΔΕΙΑ — υποβολή για έγκριση'}</span></span>
          <span className="arr"><Icon name="chevron" size={18} /></span>
        </button>
        <button className="bigbtn" onClick={() => setSheet('avail')}>
          <span className="ic"><Icon name="check" size={20} /></span>
          <span><span className="t" style={{ display: 'block' }}>{T('mark_avail')}</span><span className="s">{lang === 'en' ? 'Tell the manager your preferences' : 'Ενημέρωσε για τη διαθεσιμότητά σου'}</span></span>
          <span className="arr"><Icon name="chevron" size={18} /></span>
        </button>

        <div className="sectitle" style={{ marginTop: 22 }}>{lang === 'en' ? 'My requests' : 'Τα αιτήματά μου'}</div>
        {reqs.map(r => (
          <div key={r.id} className="reqcard">
            <div className="rt">
              <div style={{ display: 'flex', gap: 11 }}>
                <div className="ic" style={{ background: r.type === 'swap' ? 'var(--blue-soft)' : 'var(--accent-soft)', color: r.type === 'swap' ? 'var(--blue)' : 'var(--accent)' }}>
                  <Icon name={r.type === 'swap' ? 'swap' : 'cal2'} size={17} />
                </div>
                <div><div className="desc">{lang === 'en' ? r.en : r.el}</div><div className="sub">{T('new_request')}</div></div>
              </div>
              <span className={'pill ' + r.status}>{T(r.status)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- ME ---------- */
function EmpMe({ D, T, lang, me, prefs, setPrefs }) {
  return (
    <div>
      <div className="emp-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="avatar" style={{ width: 54, height: 54, fontSize: 20, background: 'var(--accent)' }}>{me.first[0]}{me.surname[0]}</div>
          <div><h1 style={{ fontSize: 24, margin: 0 }}>{me.name}</h1><div className="who">{T('role_employee')} · <span className="mono">{me.ame}</span></div></div>
        </div>
      </div>
      <div className="emp-body">
        <div className="sectitle">{T('notifications')}</div>
        {D.notifications.map(n => (
          <div key={n.id} className={'notif' + (n.unread ? '' : ' read')}>
            <span className="dot"></span>
            <div><div className="nt">{lang === 'en' ? n.en : n.el}</div><div className="nw">{lang === 'en' ? n.whenEn : n.when}</div></div>
          </div>
        ))}

        <div className="sectitle" style={{ marginTop: 20 }}>{T('preferences')}</div>
        <div className="setrow"><div><div className="t">{T('pref_morning')}</div><div className="s">{lang === 'en' ? 'Bias my roster earlier' : 'Προτίμηση σε πρωινές βάρδιες'}</div></div>
          <div className="right"><Toggle on={prefs.morning} onClick={() => setPrefs({ ...prefs, morning: !prefs.morning })} /></div></div>
        <div className="setrow"><div><div className="t">{T('pref_no_nights')}</div><div className="s">{lang === 'en' ? 'Avoid 22:/23: starts' : 'Αποφυγή νυχτερινών 22:/23:'}</div></div>
          <div className="right"><Toggle on={prefs.noNights} onClick={() => setPrefs({ ...prefs, noNights: !prefs.noNights })} /></div></div>
      </div>
    </div>
  );
}

/* ---------- bottom tab bar ---------- */
function EmpTabBar({ tab, setTab, T, pending }) {
  const items = [['home', 'home', 'tab_home'], ['month', 'calendar', 'tab_month'], ['team', 'users', 'tab_team'], ['requests', 'swap', 'tab_requests'], ['me', 'user', 'tab_me']];
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 6px 26px',
      background: 'rgba(252,250,245,.92)', backdropFilter: 'blur(14px)', borderTop: '1px solid var(--line)', position: 'relative', zIndex: 30 }}>
      {items.map(([id, ic, label]) => {
        const on = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)} style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 10px', position: 'relative',
            color: on ? 'var(--accent)' : 'var(--faint)' }}>
            <Icon name={ic} size={22} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{T(label)}</span>
            {id === 'requests' && pending > 0 && <span style={{ position: 'absolute', top: 0, right: 4, background: 'var(--accent)', color: '#fff', fontSize: 9, fontWeight: 700, minWidth: 15, height: 15, borderRadius: 8, display: 'grid', placeItems: 'center' }}>{pending}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- bottom sheet for new request ---------- */
function EmpSheet({ D, T, lang, month, sheet, setSheet, submitReq, me }) {
  const [day, setDay] = useStateE(null);
  window.__pickDay = day;
  const title = sheet === 'swap' ? T('req_swap') : sheet === 'leave' ? T('req_leave') : T('mark_avail');
  return (
    <div className="scrim" onClick={() => setSheet(null)}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="grabber"></div>
        <h3>{title}</h3>
        {sheet !== 'avail' && (
          <div>
            <div className="sectitle" style={{ margin: '0 4px 8px' }}>{T('pick_day')}</div>
            <div className="optgrid">
              {month.dates.map(d => (
                <div key={d.day} className={'optday' + (day === d.day ? ' sel' : '')} onClick={() => setDay(d.day)}>
                  {d.day}<span className="od">{(lang === 'en' ? D.DOW_EN : D.DOW_EL)[d.dow]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {sheet === 'avail' && (
          <div style={{ marginBottom: 4 }}>
            <div className="setrow"><div className="t">{T('preferred')}: {lang === 'en' ? 'mornings' : 'πρωινά'}</div><div className="right"><Toggle on={true} onClick={() => { }} /></div></div>
            <div className="setrow"><div className="t">{T('unavailable')}: {lang === 'en' ? 'nights' : 'νύχτες'}</div><div className="right"><Toggle on={true} onClick={() => { }} /></div></div>
          </div>
        )}
        <textarea className="field" rows="2" placeholder={T('reason')} style={{ marginTop: 12, resize: 'none' }}></textarea>
        <button className="btn primary" onClick={submitReq}>{T('submit')}</button>
        <button className="btn ghost" onClick={() => setSheet(null)}>{T('cancel')}</button>
      </div>
    </div>
  );
}

Object.assign(window, { EmployeeApp });
