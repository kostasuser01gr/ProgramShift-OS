/* ============================================================================
 *  os/shell.jsx — Program Shift OS shell: registry, context, topbar, dock,
 *  workspace tabs, command palette, AI drawer, notification center, search.
 * ========================================================================== */
function useOS() { return React.useContext(window.OSContext); }
window.OSContext = React.createContext({});

/* ---------- module registry ---------- */
const REGISTRY = [
  { id: 'launcher',   icon: 'grid',     tint: '#b5482b', category: 'Core',     perm: 'app.view',          status: 'live', comp: 'LauncherModule',       name: { el: 'Εφαρμογές', en: 'Apps' },         desc: { el: 'Πίνακας εκκίνησης όλων των εργαλείων.', en: 'Launcher for every tool.' } },
  { id: 'schedule',   icon: 'calendar', tint: '#2f5d77', category: 'Schedule', perm: 'schedule.view',     status: 'live', comp: 'ScheduleGridModule',   name: { el: 'Πρόγραμμα', en: 'Schedule' },     desc: { el: 'Το πλέγμα βαρδιών — επεξεργασία ζωντανά.', en: 'The shift grid — edit live.' } },
  { id: 'coverage',   icon: 'chart',    tint: '#3f6b41', category: 'Schedule', perm: 'schedule.view',     status: 'live', comp: 'CoverageModule',       name: { el: 'Κάλυψη', en: 'Coverage' },        desc: { el: 'Στελέχωση ανά ημέρα.', en: 'Staffing per day.' } },
  { id: 'warnings',   icon: 'warning',  tint: '#9a6b16', category: 'Schedule', perm: 'schedule.view',     status: 'live', comp: 'WarningsModule',       name: { el: 'Προειδοποιήσεις', en: 'Warnings' }, desc: { el: 'Συγκρούσεις & κανόνες εργασίας.', en: 'Conflicts & labour rules.' } },
  { id: 'requests',   icon: 'swap',     tint: '#7a4ea0', category: 'Schedule', perm: 'requests.approve',  status: 'live', comp: 'RequestsModule',       name: { el: 'Αιτήματα', en: 'Requests' },      desc: { el: 'Αλλαγές & άδειες προς έγκριση.', en: 'Swaps & leave to approve.' } },
  { id: 'reservations', icon: 'tag',    tint: '#2f5d77', category: 'Operate', perm: 'reservations.view', status: 'live', comp: 'ReservationsModule', name: { el: 'Κρατήσεις', en: 'Reservations' }, desc: { el: 'Μεταφόρτωση & busy-day ανάλυση.', en: 'Upload & busy-day intelligence.' } },
  { id: 'fairness',   icon: 'users',    tint: '#2f5d77', category: 'Schedule', perm: 'schedule.view',     status: 'live', comp: 'FairnessModule',       name: { el: 'Ισορροπία', en: 'Fairness' },     desc: { el: 'Ισοκατανομή φόρτου & νυχτών.', en: 'Workload & night balance.' } },
  { id: 'briefing',   icon: 'sunrise',  tint: '#b5482b', category: 'Insight',  perm: 'app.view',          status: 'live', comp: 'DailyBriefingModule',   name: { el: 'Ημερήσια Σύνοψη', en: 'Daily Briefing' }, desc: { el: 'Τι προέχει σήμερα.', en: 'What matters today.' } },
  { id: 'analytics',  icon: 'trending', tint: '#b5482b', category: 'Insight',  perm: 'schedule.view',     status: 'live', comp: 'AnalyticsModule',      name: { el: 'Αναλυτικά', en: 'Analytics' },    desc: { el: 'KPIs, τάσεις & εξαγωγές.', en: 'KPIs, trends & exports.' } },
  { id: 'dataquality',icon: 'badge',    tint: '#3f6b41', category: 'Insight',  perm: 'schedule.view',     status: 'live', comp: 'DataQualityModule',    name: { el: 'Ποιότητα Δεδομένων', en: 'Data Quality' }, desc: { el: 'Έλεγχος για κενά, λάθη, διπλά.', en: 'Scan for gaps, errors, duplicates.' } },
  { id: 'automations',icon: 'zap',      tint: '#3f6b41', category: 'Operate',  perm: 'automation.manage', status: 'live', comp: 'AutomationsModule',    name: { el: 'Αυτοματισμοί', en: 'Automations' }, desc: { el: 'Κανόνες που δρουν αυτόματα.', en: 'Rules that act automatically.' } },
  { id: 'ai',         icon: 'sparkle',  tint: '#b5482b', category: 'Core',     perm: 'ai.actions',        status: 'live', comp: '__ai',                 name: { el: 'Βοηθός AI', en: 'AI Assistant' },  desc: { el: 'Ρώτησε για το πρόγραμμα, πάρε ενέργειες.', en: 'Ask about the schedule, take actions.' } },
  { id: 'chat',       icon: 'message',  tint: '#2f5d77', category: 'Operate',  perm: 'chat.post',         status: 'live', comp: 'ChatModule',          name: { el: 'Συνομιλίες', en: 'Chat' },        desc: { el: 'Κανάλια ομάδας + ChatOps.', en: 'Team channels + ChatOps.' } },
  { id: 'tasks',      icon: 'checklist',tint: '#9a6b16', category: 'Operate',  perm: 'tasks.manage',      status: 'live', comp: 'TasksModule',         name: { el: 'Εργασίες', en: 'Tasks' },         desc: { el: 'Λίστα εκκρεμοτήτων.', en: 'Things to do.' } },
  { id: 'notes',      icon: 'note',     tint: '#7a4ea0', category: 'Operate',  perm: 'notes.manage',      status: 'live', comp: 'NotesModule',         name: { el: 'Σημειώσεις', en: 'Notes' },       desc: { el: 'Οδηγίες & υπενθυμίσεις.', en: 'Notes & SOPs.' } },
  { id: 'activity',   icon: 'clock',    tint: '#2f5d77', category: 'Insight',  perm: 'app.view',          status: 'live', comp: 'ActivityModule',      name: { el: 'Δραστηριότητα', en: 'Activity' },  desc: { el: 'Χρονολόγιο γεγονότων.', en: 'Event timeline.' } },
  { id: 'audit',      icon: 'shield',   tint: '#6c655a', category: 'Insight',  perm: 'audit.view',        status: 'live', comp: 'AuditModule',         name: { el: 'Έλεγχος', en: 'Audit' },          desc: { el: 'Ποιος έκανε τι & πότε.', en: 'Who did what & when.' } },
  { id: 'import',     icon: 'upload',   tint: '#b5482b', category: 'Operate',  perm: 'import',            status: 'live', comp: 'ImportExportModule',   name: { el: 'Εισαγωγή/Εξαγωγή', en: 'Import/Export' }, desc: { el: 'Δημιούργησε μήνα από αρχείο.', en: 'Build a month from a file.' } },
  { id: 'health',     icon: 'pulse',    tint: '#2f5d77', category: 'Admin',    perm: 'audit.view',        status: 'live', comp: 'SystemHealthModule',   name: { el: 'Υγεία Συστήματος', en: 'System Health' }, desc: { el: 'Διαγνωστικά, αποθήκευση, logs.', en: 'Diagnostics, storage, logs.' } },
  { id: 'department', icon: 'building',  tint: '#3f6b41', category: 'Insight',  perm: 'schedule.view',     status: 'live', comp: 'DepartmentModule',      name: { el: 'Τμήμα μου', en: 'My Department' }, desc: { el: 'Πίνακας ανά προϊστάμενο.', en: 'Per-supervisor dashboard.' } },
  { id: 'admin',      icon: 'lock',      tint: '#b5482b', category: 'Admin',    perm: 'settings.manage',   status: 'live', comp: 'AdminModule',          name: { el: 'Διαχείριση', en: 'Admin Center' }, desc: { el: 'Χρήστες, πρόσβαση, ιστορικό.', en: 'Users, access, history.' } },
  { id: 'help',       icon: 'lifebuoy',  tint: '#2f5d77', category: 'Core',     perm: 'app.view',          status: 'live', comp: 'HelpModule',           name: { el: 'Βοήθεια', en: 'Help & Guide' }, desc: { el: 'Οδηγός & συμβουλές για όλα.', en: 'Guide & tips for everything.' } },
  { id: 'members',    icon: 'idcard',   tint: '#b5482b', category: 'Admin',    perm: 'members.view',      status: 'live', comp: 'MembersModule',        name: { el: 'Μέλη & Ρόλοι', en: 'Members & Roles' }, desc: { el: 'Όλα τα μέλη — αλλαγή ρόλων & αφαίρεση.', en: 'All members — change roles & remove.' } },
  { id: 'settings',   icon: 'settings', tint: '#6c655a', category: 'Admin',    perm: 'settings.personal', status: 'live', comp: 'SettingsModule',       name: { el: 'Ρυθμίσεις', en: 'Settings' },     desc: { el: 'Θέμα, γλώσσα, modules, δεδομένα.', en: 'Theme, language, modules, data.' } },
  { id: 'files',      icon: 'folder',   tint: '#7a4ea0', category: 'Operate',  perm: 'files.manage',      status: 'live', comp: 'FilesModule',         name: { el: 'Αρχεία', en: 'Files' },           desc: { el: 'Μεταφόρτωση, ετικέτες & λήψη αρχείων.', en: 'Upload, tag & download files.' } },
  { id: 'forms',      icon: 'clipboard',tint: '#9a6b16', category: 'Operate',  perm: 'forms.fill',        status: 'live', comp: 'FormBuilderModule',    name: { el: 'Φόρμες', en: 'Form Builder' },    desc: { el: 'Φτιάξε, συμπλήρωσε & δες φόρμες.', en: 'Build, fill & review forms.' } }
];
const LOCAL_ONLY_MODULES = ['requests', 'reservations', 'automations', 'ai', 'chat', 'tasks', 'notes', 'activity', 'audit', 'import', 'health', 'department', 'admin', 'members', 'settings', 'files', 'forms'];
REGISTRY.forEach(function (module) { module.localOnly = LOCAL_ONLY_MODULES.indexOf(module.id) >= 0; });

const COMP = {
  LauncherModule, ScheduleGridModule, CoverageModule, WarningsModule, RequestsModule, FairnessModule,
  AnalyticsModule, AutomationsModule, ChatModule, TasksModule, NotesModule, ActivityModule, AuditModule,
  ImportExportModule, MembersModule, SettingsModule,
  DailyBriefingModule, DataQualityModule, SystemHealthModule, FilesModule, FormBuilderModule, ReservationsModule, DepartmentModule, AdminModule, HelpModule
};

/* ============================================================================
 *  AI ASSISTANT  (context-aware; real via OS.AI, else computed)
 * ========================================================================== */
function buildAIContext(ctx) {
  const { role, month, derived, openId } = ctx;
  const low = derived.coverage.filter(function (c) { return c.status === 'low'; });
  const hard = derived.warnings.filter(function (w) { return w.sev === 'hard'; });
  return { month: month.label.en, role: role, openApp: openId, employees: month.employees.length,
    understaffedDays: low.map(function (c) { return c.day; }), warnings: derived.warnings.length, criticalWarnings: hard.length };
}
function aiLocalAnswer(q, ctx) {
  const { derived, lang, month } = ctx; const en = lang === 'en'; const s = q.toLowerCase();
  const low = derived.coverage.filter(function (c) { return c.status === 'low'; });
  const hard = derived.warnings.filter(function (w) { return w.sev === 'hard'; });
  const st = derived.stats;
  if (/cover|κάλυψ|staff|στελέχ/.test(s))
    return en ? ('Across ' + month.label.en + ', average ' + Math.round(derived.coverage.reduce(function (a, c) { return a + c.working; }, 0) / derived.coverage.length) + ' people work per day. ' + (low.length ? low.length + ' day(s) fall below the minimum: ' + low.map(function (c) { return c.day; }).join(', ') + '. Consider moving a day-off or adding a shift there.' : 'Every day meets the staffing target.'))
              : ('Στον ' + month.label.el + ', εργάζονται κατά μέσο όρο ' + Math.round(derived.coverage.reduce(function (a, c) { return a + c.working; }, 0) / derived.coverage.length) + ' άτομα/ημέρα. ' + (low.length ? low.length + ' ημέρες κάτω από το ελάχιστο: ' + low.map(function (c) { return c.day; }).join(', ') + '. Σκέψου να μετακινήσεις ένα ρεπό ή να προσθέσεις βάρδια.' : 'Όλες οι ημέρες καλύπτουν τον στόχο.'));
  if (/warn|προειδ|problem|πρόβλημα|conflict|σύγκρου/.test(s))
    return en ? (derived.warnings.length + ' warnings, ' + hard.length + ' critical. ' + (hard[0] ? 'Most urgent: ' + hard[0].empName + ' — ' + hard[0].en + ' (' + hard[0].dateLabel + ').' : 'No critical issues.'))
              : (derived.warnings.length + ' προειδοποιήσεις, ' + hard.length + ' σοβαρές. ' + (hard[0] ? 'Πιο επείγον: ' + hard[0].empName + ' — ' + hard[0].el + ' (' + hard[0].dateLabel + ').' : 'Καμία σοβαρή.'));
  if (/night|νύχτ/.test(s)) { const top = st.rows.slice().sort(function (a, b) { return b.nights - a.nights; })[0]; return en ? ('Total ' + derived.coverage.reduce(function (a, c) { return a + c.night; }, 0) + ' night shifts. ' + top.name + ' has the most (' + top.nights + ').') : ('Σύνολο ' + derived.coverage.reduce(function (a, c) { return a + c.night; }, 0) + ' νύχτες. Περισσότερες: ' + top.name + ' (' + top.nights + ').'); }
  if (/fair|ισορ|balance|φόρτ/.test(s))
    return en ? ('Average ' + st.avg.hours + 'h, ' + st.avg.nights + ' nights, ' + st.avg.wknd + ' weekend days per person. Open Fairness to see who is above the line.') : ('Μ.Ο. ' + st.avg.hours + 'ω, ' + st.avg.nights + ' νύχτες, ' + st.avg.wknd + ' Σ/Κ ανά άτομο. Δες Ισορροπία για ποιος είναι πάνω.');
  if (/summar|σύνοψ|report|αναφορ/.test(s))
    return en ? (month.label.en + ': ' + month.employees.length + ' staff, avg coverage OK on ' + (derived.coverage.length - low.length) + '/' + derived.coverage.length + ' days, ' + derived.warnings.length + ' warnings.') : (month.label.el + ': ' + month.employees.length + ' άτομα, επαρκής κάλυψη ' + (derived.coverage.length - low.length) + '/' + derived.coverage.length + ' ημέρες, ' + derived.warnings.length + ' προειδοποιήσεις.');
  return en ? 'I can summarize coverage, surface warnings, analyze nights and fairness, or draft a message. Try a suggestion below — or open the gem for deeper help.'
            : 'Μπορώ να συνοψίσω κάλυψη, να εντοπίσω προειδοποιήσεις, να αναλύσω νύχτες & ισορροπία, ή να συντάξω μήνυμα. Δοκίμασε μια πρόταση — ή άνοιξε το gem.';
}

function mdLite(text) {
  // minimal markdown → React: **bold**, # headings stripped, - bullets, line breaks
  var lines = String(text).split('\n');
  return lines.map(function (ln, i) {
    var heading = /^#{1,6}\s+/.test(ln);
    ln = ln.replace(/^#{1,6}\s+/, '').replace(/^\s*[-*]\s+/, '• ');
    var parts = ln.split(/(\*\*[^*]+\*\*)/g).map(function (p, j) {
      if (/^\*\*[^*]+\*\*$/.test(p)) return React.createElement('strong', { key: j }, p.slice(2, -2));
      return p;
    });
    return React.createElement('div', { key: i, style: { fontWeight: heading ? 700 : 400, marginTop: heading && i ? 6 : 0 } }, parts);
  });
}
window.mdLite = mdLite;

function AIDrawer({ onClose }) {
  const ctx = useOS(); const { lang } = ctx; const OS = window.OS; const en = lang === 'en';
  const GEM = 'https://gemini.google.com/gem/1E2sO0quvhHhyTPUYeN_KWs-kUSiA8veO?usp=sharing';
  const [msgs, setMsgs] = React.useState([{ who: 'bot', text: en ? 'Hi — I can answer questions AND make changes for you: edit shifts, fix warnings, publish, change roles, create tasks. Try “Fix all warnings” or “Publish week 1”.' : 'Γεια — απαντώ ερωτήσεις ΚΑΙ κάνω αλλαγές: βάρδιες, διόρθωση προειδοποιήσεων, δημοσίευση, ρόλοι, εργασίες. Δοκίμασε «Διόρθωσε όλες τις προειδοποιήσεις» ή «Δημοσίευσε εβδομάδα 1».' }]);
  const [q, setQ] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const bodyRef = React.useRef(null);
  const suggestions = en ? ['Fix all warnings', 'Publish week 1', 'Give a day off…', 'Summarize coverage'] : ['Διόρθωσε όλες τις προειδοποιήσεις', 'Δημοσίευσε εβδομάδα 1', 'Σύνοψη κάλυψης', 'Ποιος έχει πιο πολλές νύχτες;'];

  function scrollDown() { setTimeout(function () { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, 30); }

  async function ask(text) {
    const v = (text || q).trim(); if (!v || busy) return;
    setMsgs(function (m) { return m.concat([{ who: 'user', text: v }]); }); setQ(''); setBusy(true);
    OS.Audit.add({ action: 'ai.query', target: v.slice(0, 40), role: ctx.role, module: ctx.openId });

    // 1) Try to plan ACTIONS (agentic) — live model first, then local parser.
    let plan = null;
    try { plan = await window.OSAgent.planWithModel(v, ctx); } catch (e) { plan = null; }
    if (!plan || !plan.actions || plan.actions.length === 0) {
      const local = window.OSAgent.parseIntent(v, ctx);
      if (local) plan = local;
    }
    if (plan && plan.actions && plan.actions.length > 0) {
      setMsgs(function (m) { return m.concat([{ who: 'bot', text: plan.reply || (en ? 'Here is what I can do:' : 'Να τι μπορώ να κάνω:'), actions: plan.actions.map(function (a) { return Object.assign({}, a, { applied: false }); }) }]); });
      setBusy(false); scrollDown(); return;
    }

    // 2) Otherwise answer as Q&A (live model, then computed fallback).
    let answer = (plan && plan.reply) || null;
    if (!answer && OS.AI.available()) {
      const prompt = 'You are the scheduling assistant inside a staff shift platform. Context (JSON): ' + JSON.stringify(buildAIContext(ctx)) + '. Answer in ' + (en ? 'English' : 'Greek') + ', concise, operational. Question: ' + v;
      answer = await OS.AI.complete(prompt);
    }
    if (!answer) answer = aiLocalAnswer(v, ctx);
    setMsgs(function (m) { return m.concat([{ who: 'bot', text: answer }]); }); setBusy(false); scrollDown();
  }

  function applyAction(a, mi, ai) {
    const res = window.OSAgent.run(a.tool, a.args, ctx);
    setMsgs(function (msgsArr) { return msgsArr.map(function (m, i) {
      if (i !== mi) return m;
      const acts = m.actions.slice();
      acts[ai] = Object.assign({}, acts[ai], { applied: !res.error, result: res });
      return Object.assign({}, m, { actions: acts });
    }); });
    if (!res.error) OS.Memory.add({ kind: 'ai-action', text: res.summary });
    scrollDown();
  }
  function applyAll(mi) {
    const msg = msgs[mi]; if (!msg) return;
    msg.actions.forEach(function (a, ai) { if (!a.applied && !(a.result && a.result.error)) applyAction(a, mi, ai); });
  }
  function undoAction(mi, ai) {
    setMsgs(function (msgsArr) { return msgsArr.map(function (m, i) {
      if (i !== mi) return m;
      const acts = m.actions.slice();
      const r = acts[ai].result;
      if (r && r.undo) { try { r.undo(); } catch (e) { } }
      acts[ai] = Object.assign({}, acts[ai], { applied: false, result: null });
      return Object.assign({}, m, { actions: acts });
    }); });
    scrollDown();
  }

  return (
    <React.Fragment>
      <div className="dr-scrim" onClick={onClose}></div>
      <div className="drawer">
        <div className="dr-head">
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,var(--accent),var(--accent-ink))', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="sparkle" size={19} /></div>
          <div style={{ flex: 1 }}><div className="t">{en ? 'AI Copilot' : 'Βοηθός AI'}</div><div className="s">{en ? 'Asks · acts · undo · ' : 'Ρωτά · δρα · αναιρεί · '}{OS.AI.available() ? (en ? 'live' : 'live') : (en ? 'local' : 'τοπικό')} · {en ? ctx.month.label.en : ctx.month.label.el}</div></div>
          <button className="os-iconbtn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="dr-body" ref={bodyRef}>
          {msgs.map(function (m, i) { return (
            <div key={i} className={'ai-msg ' + (m.who === 'user' ? 'user' : 'bot')}>
              {m.who === 'bot' && <div className="who">AI</div>}
              <div className="bub">{m.who === 'bot' ? mdLite(m.text) : m.text}</div>
              {m.actions && m.actions.length > 0 && (
                <div className="ai-actions">
                  {m.actions.length > 1 && m.actions.some(function (a) { return !a.applied && !(a.result && a.result.error); }) &&
                    <button className="ai-applyall" onClick={function () { applyAll(i); }}><Icon name="zap" size={13} />{en ? 'Apply all (' + m.actions.length + ')' : 'Εφαρμογή όλων (' + m.actions.length + ')'}</button>}
                  {m.actions.map(function (a, ai) { return (
                    <div key={ai} className={'ai-act' + (a.applied ? ' done' : '') + (a.result && a.result.error ? ' err' : '')}>
                      <Icon name={a.applied ? 'check' : (a.result && a.result.error ? 'warning' : 'zap')} size={14} color={a.applied ? 'var(--green)' : (a.result && a.result.error ? 'var(--red)' : 'var(--accent)')} />
                      <span className="lbl">{a.applied && a.result ? a.result.summary : (a.result && a.result.error ? ((en ? 'Could not: ' : 'Αδύνατο: ') + a.label) : a.label)}</span>
                      {!a.applied && !(a.result && a.result.error) && <button className="ai-go" onClick={function () { applyAction(a, i, ai); }}>{en ? 'Apply' : 'Εφαρμ.'}</button>}
                      {a.applied && a.result && a.result.undo && <button className="ai-undo" onClick={function () { undoAction(i, ai); }}>{en ? 'Undo' : 'Αναίρ.'}</button>}
                    </div>); })}
                </div>
              )}
            </div>); })}
          {busy && <div className="ai-msg bot"><div className="who">AI</div><div className="bub">…</div></div>}
          <div className="ai-chips">{suggestions.map(function (sug) { return <span key={sug} className="ai-chip" onClick={function () { ask(sug); }}>{sug}</span>; })}</div>
        </div>
        <div className="dr-foot">
          <div className="ai-input">
            <input value={q} onChange={function (e) { setQ(e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter') ask(); }} placeholder={en ? 'Ask, or tell me to change something…' : 'Ρώτησε, ή πες μου να αλλάξω κάτι…'} />
            <button className="ai-send" onClick={function () { ask(); }}><Icon name="arrow" size={16} /></button>
          </div>
          <a href={GEM} target="_blank" rel="noopener" style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 10, fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>{en ? 'Open the Gemini gem' : 'Άνοιγμα στο Gemini'} <Icon name="arrow" size={13} /></a>
        </div>
      </div>
    </React.Fragment>
  );
}

/* ============================================================================
 *  NOTIFICATION CENTER
 * ========================================================================== */
function NotificationCenter({ onClose }) {
  const { lang } = useOS(); const OS = window.OS; const en = lang === 'en';
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
  const items = OS.Notify.all();
  const icon = { warning: 'warning', publish: 'publish', insight: 'sparkle', task: 'check', system: 'bell', approved: 'check' };
  const tint = { warning: 'var(--amber)', publish: 'var(--green)', insight: 'var(--accent)', task: 'var(--blue)', system: 'var(--soft)', approved: 'var(--green)' };
  return (
    <React.Fragment>
      <div className="dr-scrim" onClick={onClose}></div>
      <div className="drawer">
        <div className="dr-head">
          <Icon name="bell" size={20} color="var(--accent)" />
          <div style={{ flex: 1 }}><div className="t">{en ? 'Notifications' : 'Ειδοποιήσεις'}</div><div className="s">{OS.Notify.unread()} {en ? 'unread' : 'μη αναγνωσμένες'}</div></div>
          <button className="os-btn sm" onClick={function () { OS.Notify.markRead(); force(); }}>{en ? 'Mark all read' : 'Όλα αναγνωσμένα'}</button>
          <button className="os-iconbtn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="dr-body">
          {items.length === 0 && <div className="os-empty">{en ? 'Nothing yet. Actions and automations will show up here.' : 'Τίποτα ακόμη. Ενέργειες & αυτοματισμοί θα εμφανίζονται εδώ.'}</div>}
          {items.map(function (n) { return (
            <div key={n.id} className={'nt-row' + (n.unread ? ' unread' : '')} onClick={function () { OS.Notify.markRead(n.id); force(); }}>
              <div className="ic" style={{ background: 'var(--paper)', color: tint[n.type] || 'var(--soft)' }}><Icon name={icon[n.type] || 'bell'} size={16} /></div>
              <div style={{ flex: 1 }}><div className="tt">{n.title}</div><div className="dd">{n.desc}</div><div className="ww">{n.module} · {fmtAgo(n.at, lang)}</div></div>
              {n.priority === 'high' && <span className="os-tag high" style={{ alignSelf: 'flex-start' }}>!</span>}
            </div>); })}
        </div>
      </div>
    </React.Fragment>
  );
}

/* ============================================================================
 *  COMMAND PALETTE  (apps · actions · people · navigate)
 * ========================================================================== */
function CommandPalette({ onClose }) {
  const ctx = useOS(); const { lang, role, registry, open, month, setTheme, theme, openAI } = ctx; const OS = window.OS;
  const en = lang === 'en';
  const [q, setQ] = React.useState(''); const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);
  React.useEffect(function () { if (inputRef.current) inputRef.current.focus(); }, []);

  const apps = registry.filter(function (m) { return m.id !== 'launcher' && OS.Perms.can(role, m.perm || 'app.view'); })
    .map(function (m) { return { group: en ? 'Apps' : 'Εφαρμογές', icon: m.icon, label: en ? m.name.en : m.name.el, run: function () { open(m.id); } }; });
  const actions = [
    { group: en ? 'Actions' : 'Ενέργειες', icon: 'sparkle', label: en ? 'Ask AI' : 'Ρώτησε το AI', run: function () { openAI(); } },
    { group: en ? 'Actions' : 'Ενέργειες', icon: 'pdf', label: en ? 'Export ' + month.label.en + ' (CSV)' : 'Εξαγωγή ' + month.label.el + ' (CSV)', run: function () { exportMonthCSV(month); }, perm: 'export' },
    { group: en ? 'Actions' : 'Ενέργειες', icon: 'settings', label: en ? 'Toggle theme' : 'Εναλλαγή θέματος', run: function () { setTheme(theme === 'dark' ? 'light' : 'dark'); } },
    { group: en ? 'Actions' : 'Ενέργειες', icon: 'plus', label: en ? 'New task' : 'Νέα εργασία', run: function () { open('tasks'); } }
  ].filter(function (a) { return !a.perm || OS.Perms.can(role, a.perm); });
  const people = month.employees.slice(0, 40).map(function (e) { return { group: en ? 'People' : 'Άτομα', icon: 'user', label: e.name, meta: e.ame, run: function () { open('fairness'); } }; });

  const pool = apps.concat(actions).concat(people);
  const filtered = !q ? apps.concat(actions) : pool.filter(function (x) { return window.OS.norm(x.label).indexOf(window.OS.norm(q)) >= 0; });
  const groups = {}; filtered.forEach(function (x) { (groups[x.group] = groups[x.group] || []).push(x); });
  const flat = []; Object.keys(groups).forEach(function (g) { groups[g].forEach(function (x) { flat.push(x); }); });

  function exec(i) { const it = flat[i]; if (it) { it.run(); onClose(); } }
  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(function (s) { return Math.min(s + 1, flat.length - 1); }); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(function (s) { return Math.max(s - 1, 0); }); }
    else if (e.key === 'Enter') { e.preventDefault(); exec(sel); }
    else if (e.key === 'Escape') onClose();
  }

  let idx = -1;
  return (
    <div className="cmd-scrim" onClick={onClose}>
      <div className="cmd-box" onClick={function (e) { e.stopPropagation(); }}>
        <div className="cmd-input">
          <Icon name="search" size={18} color="var(--faint)" />
          <input ref={inputRef} value={q} onChange={function (e) { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} placeholder={en ? 'Search apps, actions, people…' : 'Αναζήτηση εφαρμογών, ενεργειών, ατόμων…'} />
          <kbd style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--faint)' }}>ESC</kbd>
        </div>
        <div className="cmd-list">
          {flat.length === 0 && <div className="cmd-empty">{en ? 'No matches' : 'Κανένα αποτέλεσμα'}</div>}
          {Object.keys(groups).map(function (g) { return (
            <div key={g}>
              <div className="cmd-group">{g}</div>
              {groups[g].map(function (x) { idx++; const my = idx; return (
                <div key={my} className={'cmd-item' + (sel === my ? ' sel' : '')} onMouseEnter={function () { setSel(my); }} onClick={function () { exec(my); }}>
                  <div className="ic"><Icon name={x.icon} size={15} /></div>
                  <span>{x.label}</span>
                  {x.meta && <span className="meta mono">{x.meta}</span>}
                </div>); })}
            </div>); })}
        </div>
      </div>
    </div>
  );
}

window.OS_REGISTRY = REGISTRY; window.OS_COMP = COMP;
Object.assign(window, { useOS, AIDrawer, NotificationCenter, CommandPalette, aiLocalAnswer });
