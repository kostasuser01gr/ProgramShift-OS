/* ============================================================================
 *  os/root.jsx — OSRoot: provider + topbar + dock + workspace tabs + router.
 * ========================================================================== */
function recomputeAll(D, emps, dates) {
  // reuse the manager recompute (global) for identical results
  return window.recompute(D, emps, dates);
}

function OSRoot() {
  const D = window.APP_DATA; const OS = window.OS;
  const persisted = OS.Settings.get();
  const [session, setSession] = React.useState(OS.Auth.current());
  const [viewAs, setViewAs] = React.useState(null); // owner-only demo override
  const role = !session ? 'owner' : (session.role === 'owner' && viewAs ? viewAs : session.role);
  const [lang, setLangState] = React.useState(persisted.lang || 'el');
  const [theme, setThemeState] = React.useState(persisted.theme || 'light');
  const [months, setMonths] = React.useState(D.months.slice());
  const [activeKey, setActiveKey] = React.useState(D.months[0].key);
  const month = months.find(function (m) { return m.key === activeKey; }) || months[0];
  D.setActive(activeKey);

  // shared editable schedule state for the active month
  const [empsMap, setEmpsMap] = React.useState({});
  const emps = empsMap[activeKey] || month.employees.map(function (e) { return Object.assign({}, e, { shifts: e.shifts.slice(), cats: e.cats.slice() }); });
  const [requests, setRequestsState] = React.useState(D.requests.slice());

  // workspace tabs (restored from last session)
  const savedWs = OS.load('workspace', null);
  const [tabs, setTabs] = React.useState(savedWs && savedWs.tabs && savedWs.tabs.length ? savedWs.tabs : ['launcher']);
  const [openId, setOpenId] = React.useState(savedWs && savedWs.openId ? savedWs.openId : 'launcher');
  const [split, setSplit] = React.useState(null); // secondary module id or null
  const [dragTab, setDragTab] = React.useState(null);
  const [dragOverTab, setDragOverTab] = React.useState(null);

  // overlays
  const [palette, setPalette] = React.useState(false);
  const [aiOpen, setAIOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [monthMenu, setMonthMenu] = React.useState(false);
  const monthMenuRef = React.useRef(null);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [tourOpen, setTourOpen] = React.useState(!OS.load('onboarded', false));
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);

  const T = function (k) { return window.t(k, lang); };
  const registry = window.OS_REGISTRY;
  const derived = React.useMemo(function () { return recomputeAll(D, emps, month.dates); }, [emps, month]);

  // theme + lang side-effects
  React.useEffect(function () { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  function setTheme(t) { setThemeState(t); OS.Settings.set({ theme: t }); }
  function setLang(l) { setLangState(l); OS.Settings.set({ lang: l }); }

  // notifications live-refresh
  React.useEffect(function () {
    const off1 = OS.Bus.on('notification.created', function () { force(); });
    const off2 = OS.Bus.on('notification.read', function () { force(); });
    const off3 = OS.Bus.on('visibility.changed', function () { force(); });
    return function () { off1(); off2(); off3(); };
  }, []);

  // persist workspace (session restore)
  React.useEffect(function () { OS.save('workspace', { tabs: tabs, openId: openId }); }, [tabs, openId]);

  // month menu click-outside + escape close
  React.useEffect(function () {
    if (!monthMenu) return;
    function handle(e) { if (monthMenuRef.current && !monthMenuRef.current.contains(e.target)) setMonthMenu(false); }
    function handleKey(e) { if (e.key === 'Escape') setMonthMenu(false); }
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleKey);
    return function () { document.removeEventListener('mousedown', handle); document.removeEventListener('keydown', handleKey); };
  }, [monthMenu]);

  // command palette hotkey
  React.useEffect(function () {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); setPalette(function (p) { return !p; }); }
    }
    window.addEventListener('keydown', onKey); return function () { window.removeEventListener('keydown', onKey); };
  }, []);

  const [soon, setSoon] = React.useState(null);
  function open(id) {
    const m = registry.find(function (x) { return x.id === id; });
    if (id === 'ai') { setAIOpen(true); return; }
    if (m && m.status === 'soon') { setSoon(m); }
    OS.Favorites.touch(id);
    setTabs(function (t) { return t.indexOf(id) >= 0 ? t : t.concat([id]); });
    setOpenId(id); setSplit(null);
    OS.Bus.emit('module.opened', { id: id }); OS.Memory.add({ kind: 'navigate', text: (lang === 'en' ? 'Opened ' : 'Άνοιξε ') + (m ? (lang === 'en' ? m.name.en : m.name.el) : id) });
  }
  function reorderTabs(from, to) {
    if (!from || from === to) return;
    setTabs(function (t) {
      const arr = t.slice(); const fi = arr.indexOf(from); const tiIdx = arr.indexOf(to);
      if (fi < 0 || tiIdx < 0) return t;
      arr.splice(fi, 1); arr.splice(arr.indexOf(to) + (fi < tiIdx ? 1 : 0), 0, from);
      return arr;
    });
  }
  function moveTab(id, dir) {
    setTabs(function (t) {
      const arr = t.slice(); const i = arr.indexOf(id); const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return t;
      arr[i] = arr[j]; arr[j] = id; return arr;
    });
  }
  function closeTab(e, id) {
    e.stopPropagation();
    setTabs(function (t) { const nt = t.filter(function (x) { return x !== id; }); if (nt.length === 0) nt.push('launcher'); if (openId === id) setOpenId(nt[nt.length - 1]); return nt; });
  }

  function setCell(ei, j, value) {
    setEmpsMap(function (prev) {
      const cur = (prev[activeKey] || month.employees.map(function (e) { return Object.assign({}, e, { shifts: e.shifts.slice(), cats: e.cats.slice() }); })).slice();
      const e = Object.assign({}, cur[ei], { shifts: cur[ei].shifts.slice(), cats: cur[ei].cats.slice() });
      const before = e.shifts[j];
      e.shifts[j] = value; e.cats[j] = D.category(value); cur[ei] = e;
      OS.Audit.add({ action: 'schedule.edit', target: e.name + ' · ' + month.dates[j].day + '/' + month.month, before: before, after: value, role: role, module: 'schedule' });
      OS.Bus.emit('record.updated', { type: 'shift', emp: e.ame, day: month.dates[j].day });
      OS.Memory.add({ kind: 'edit', text: (lang === 'en' ? 'Shift change · ' : 'Αλλαγή βάρδιας · ') + e.name + ' ' + month.dates[j].day + '/' + month.month + ' → ' + value });
      return Object.assign({}, prev, { [activeKey]: cur });
    });
  }
  function setRequests(rs) {
    const prevPending = requests.filter(function (r) { return r.status === 'pending'; }).length;
    setRequestsState(rs);
    const now = rs.filter(function (r) { return r.status === 'pending'; }).length;
    if (now < prevPending) { OS.Audit.add({ action: 'requests.decision', role: role, module: 'requests' }); OS.Bus.emit('request.decided', {}); }
  }

  function pickMonth(key) { D.setActive(key); setActiveKey(key); setMonthMenu(false); }
  function addMonth() { const mo = D.addMonth(); setMonths(D.months.slice()); pickMonth(mo.key); OS.Notify.add({ type: 'system', title: lang === 'en' ? 'New month created' : 'Δημιουργήθηκε νέος μήνας', desc: lang === 'en' ? mo.label.en : mo.label.el, module: 'schedule' }); }
  function importMonth(parsed, fileName) { const mo = D.monthFromImport(parsed, fileName); setMonths(D.months.slice()); pickMonth(mo.key);
    let roleNote = '';
    if (parsed && parsed.hasRoles && parsed.employees) { const n = OS.Members.importRoster(parsed.employees); roleNote = lang === 'en' ? (' · ' + n + ' roles set') : (' · ' + n + ' ρόλοι'); OS.Audit.add({ action: 'members.import_roles', target: fileName, role: role, module: 'import' }); }
    OS.Notify.add({ type: 'system', title: lang === 'en' ? 'Schedule imported' : 'Εισαγωγή προγράμματος', desc: (fileName || '') + ' → ' + (lang === 'en' ? mo.label.en : mo.label.el) + roleNote, module: 'import', priority: 'high' }); OS.Audit.add({ action: 'import.month', target: fileName, role: role, module: 'import' }); return mo; }
  window.__importMonth = importMonth; window.__addMonth = addMonth;

  const ctxValue = {
    D: D, T: T, lang: lang, setLang: setLang, role: role, setRole: setViewAs, theme: theme, setTheme: setTheme,
    month: month, months: months, activeKey: activeKey, pickMonth: pickMonth, addMonth: addMonth, importMonth: importMonth,
    emps: emps, setCell: setCell, derived: derived, requests: requests, setRequests: setRequests,
    registry: registry, open: open, openId: openId, openAI: function () { setAIOpen(true); }
  };

  const mod = registry.find(function (m) { return m.id === openId; }) || registry[0];
  function renderModule(id) {
    const m = registry.find(function (x) { return x.id === id; }) || registry[0];
    if (!OS.Perms.can(role, m.perm || 'app.view')) return React.createElement(window.DeniedModule, { perm: m.perm });
    if (m.status === 'soon') return React.createElement(window.ComingSoonModule, { mod: m });
    const C = window.OS_COMP[m.comp];
    return C ? React.createElement(C) : React.createElement(window.ComingSoonModule, { mod: m });
  }

  const roleOpts = [{ v: 'employee', l: T('role_employee') }, { v: 'manager', l: T('role_manager') }, { v: 'owner', l: T('role_owner') }];
  const dockMods = registry.filter(function (m) { return OS.Perms.can(role, m.perm || 'app.view') && OS.Settings.get().disabledModules.indexOf(m.id) < 0; });

  function logout() { OS.Auth.logout(); setSession(OS.Auth.current()); setViewAs(null); setTabs(['launcher']); setOpenId('launcher'); }

  return (
    <window.OSContext.Provider value={ctxValue}>
      <div className="os os-root">
        {/* ---- TOP BAR ---- */}
        <div className="os-top">
          <div className="os-brand"><span className="dot">Σ</span><div>Program Shift<small>OS · {lang === 'en' ? 'operating platform' : 'πλατφόρμα'}</small></div></div>

          <div className="os-cmd" role="button" tabIndex={0} aria-label={lang === 'en' ? 'Search or run a command' : 'Αναζήτηση ή εντολή'} onClick={function () { setPalette(true); }} onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPalette(true); } }}>
            <Icon name="search" size={15} /><span>{lang === 'en' ? 'Search or run a command' : 'Αναζήτηση ή εντολή'}</span><kbd>⌘K</kbd>
          </div>

          <div className="os-topactions">
            {/* month switcher */}
            <div ref={monthMenuRef} style={{ position: 'relative' }}>
              <button className="os-btn sm" aria-haspopup="listbox" aria-expanded={monthMenu} aria-label={(lang === 'en' ? 'Switch month, current: ' : 'Αλλαγή μήνα, τρέχον: ') + (lang === 'en' ? month.label.en : month.label.el)} onClick={function () { setMonthMenu(!monthMenu); }}><Icon name="calendar" size={14} color="var(--accent)" />{lang === 'en' ? month.label.en : month.label.el}<Icon name="chevron" size={11} style={{ transform: 'rotate(90deg)' }} /></button>
              {monthMenu && <div style={{ position: 'absolute', right: 0, top: '120%', zIndex: 120, background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 11, padding: 6, minWidth: 200, boxShadow: 'var(--os-elev)' }}>
                {months.map(function (m) { return <div key={m.key} onClick={function () { pickMonth(m.key); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: m.key === activeKey ? 700 : 500, background: m.key === activeKey ? 'var(--paper)' : 'transparent' }}>{lang === 'en' ? m.label.en : m.label.el}{m.key === activeKey && <Icon name="check" size={14} color="var(--green)" style={{ marginLeft: 'auto' }} />}</div>; })}
                <div onClick={addMonth} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--accent)', borderTop: '1px solid var(--line)', marginTop: 4 }}><Icon name="plus" size={14} />{T('new_month_cta')}</div>
              </div>}
            </div>

            <button className="os-iconbtn" onClick={function () { setHelpOpen(true); }} title={lang === 'en' ? 'Help & tips' : 'Βοήθεια & συμβουλές'} aria-label={lang === 'en' ? 'Help' : 'Βοήθεια'}><Icon name="lifebuoy" size={19} /></button>
            <button className="os-iconbtn" onClick={function () { setAIOpen(true); }} title={lang === 'en' ? 'AI Assistant' : 'Βοηθός AI'} aria-label={lang === 'en' ? 'AI Assistant' : 'Βοηθός AI'}><Icon name="sparkle" size={19} /></button>
            <button className="os-iconbtn" onClick={function () { setNotifOpen(true); }} title={lang === 'en' ? 'Notifications' : 'Ειδοποιήσεις'} aria-label={lang === 'en' ? ('Notifications' + (OS.Notify.unread() > 0 ? ', ' + OS.Notify.unread() + ' unread' : '')) : ('Ειδοποιήσεις' + (OS.Notify.unread() > 0 ? ', ' + OS.Notify.unread() + ' αναγνωσμένες' : ''))}><Icon name="bell" size={19} />{OS.Notify.unread() > 0 && <span className="badge" aria-hidden="true">{OS.Notify.unread()}</span>}</button>

            <UserMenu session={session} role={role} lang={lang} onLogout={logout} onViewAs={setViewAs} />
            <div className="langtoggle" role="group" aria-label={lang === 'en' ? 'Language' : 'Γλώσσα'}><button className={lang === 'el' ? 'on' : ''} aria-pressed={lang === 'el'} aria-label="Ελληνικά" onClick={function () { setLang('el'); }}>ΕΛ</button><button className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} aria-label="English" onClick={function () { setLang('en'); }}>EN</button></div>
          </div>
        </div>

        {/* ---- BODY ---- */}
        <div className="os-body">
          {/* dock */}
          <div className="os-dock">
            {dockMods.map(function (m, i) { return (
              <React.Fragment key={m.id}>
                {(m.category === 'Insight' && i > 0 && dockMods[i - 1].category !== 'Insight') && <div className="sep"></div>}
                {(m.category === 'Admin' && i > 0 && dockMods[i - 1].category !== 'Admin') && <div className="sep"></div>}
                <div className={'os-dockitem' + (openId === m.id ? ' on' : '')} role="button" tabIndex={0}
                  aria-label={lang === 'en' ? m.name.en : m.name.el} aria-current={openId === m.id ? 'page' : undefined}
                  onClick={function () { open(m.id); }} onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(m.id); } }}
                  style={{ color: openId === m.id ? m.tint : undefined }}>
                  <Icon name={m.icon} size={21} /><span className="tip">{lang === 'en' ? m.name.en : m.name.el}</span>
                </div>
              </React.Fragment>); })}
          </div>

          {/* main */}
          <div className="os-main">
            <div className="os-tabs">
              {tabs.map(function (id, ti) { const m = registry.find(function (x) { return x.id === id; }) || registry[0]; return (
                <div key={id} className={'os-tab' + (openId === id ? ' on' : '') + (dragOverTab === id ? ' dragover' : '')} role="tab" tabIndex={0} aria-selected={openId === id}
                  draggable={true}
                  onDragStart={function (e) { setDragTab(id); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', id); } catch (x) {} }}
                  onDragOver={function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverTab !== id) setDragOverTab(id); }}
                  onDragLeave={function () { if (dragOverTab === id) setDragOverTab(null); }}
                  onDrop={function (e) { e.preventDefault(); var src = dragTab; try { src = e.dataTransfer.getData('text/plain') || dragTab; } catch (x) {} reorderTabs(src, id); setDragTab(null); setDragOverTab(null); }}
                  onDragEnd={function () { setDragTab(null); setDragOverTab(null); }}
                  onClick={function () { setOpenId(id); }} onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenId(id); } if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.altKey) { e.preventDefault(); moveTab(id, e.key === 'ArrowLeft' ? -1 : 1); } }}>
                  <Icon name={m.icon} size={14} />{lang === 'en' ? m.name.en : m.name.el}
                  {id !== 'launcher' && <span className="x" role="button" tabIndex={0} aria-label={lang === 'en' ? 'Close tab' : 'Κλείσιμο'} onClick={function (e) { closeTab(e, id); }} onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeTab(e, id); } }}><Icon name="x" size={12} /></span>}
                </div>); })}
              <button className="os-iconbtn" style={{ width: 30, height: 30, marginLeft: 4 }} title={lang === 'en' ? 'Split view' : 'Διαίρεση'} onClick={function () { setSplit(split ? null : (openId === 'coverage' ? 'warnings' : 'coverage')); }}><Icon name="grid" size={15} /></button>
            </div>
            <div className="os-content">
              <window.OSErrorBoundary key={openId + (split || '')}>
                {split ? <div className="os-split"><div>{renderModule(openId)}</div><div>{renderModule(split)}</div></div> : renderModule(openId)}
              </window.OSErrorBoundary>
            </div>
          </div>
        </div>

        {/* ---- overlays ---- */}
        {palette && <CommandPalette onClose={function () { setPalette(false); }} />}
        {helpOpen && <ContextualHelp onClose={function () { setHelpOpen(false); }} />}
        {tourOpen && <OnboardingTour lang={lang} onClose={function () { setTourOpen(false); OS.save('onboarded', true); }} />}
        {aiOpen && <AIDrawer onClose={function () { setAIOpen(false); }} />}
        {notifOpen && <NotificationCenter onClose={function () { setNotifOpen(false); }} />}
      </div>
    </window.OSContext.Provider>
  );
}

window.OSRoot = OSRoot;
