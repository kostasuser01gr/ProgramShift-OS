/* ============================================================================
 *  os/help.jsx — Self-service help, onboarding tour, contextual tips, and a
 *  global RESILIENCE layer so the app teaches itself and recovers from errors
 *  with NO developer present.
 * ========================================================================== */

/* ---- help content: one entry per module, bilingual, pattern-focused ------- */
var HELP = {
  _general: {
    el: { title: 'Πώς λειτουργεί', tips: [
      'Αριστερά είναι η μπάρα εφαρμογών (dock). Κάνε κλικ σε ένα εικονίδιο για να ανοίξεις ένα εργαλείο.',
      'Πάνω, οι καρτέλες δείχνουν ό,τι έχεις ανοιχτό. Σύρε τις για αναδιάταξη, ή πάτησε × για κλείσιμο.',
      'Πάτησε ⌘K (ή Ctrl+K) για γρήγορη αναζήτηση εφαρμογών, ατόμων και ενεργειών.',
      'Το εικονίδιο ✦ πάνω δεξιά ανοίγει τον Βοηθό AI — ρώτησέ τον ή ζήτησέ του να κάνει αλλαγές.',
      'Το ? πάνω δεξιά ανοίγει βοήθεια για την εφαρμογή που βλέπεις τώρα.',
      'Όλα αποθηκεύονται αυτόματα σε αυτή τη συσκευή. Δεν χρειάζεται κουμπί «αποθήκευση».'
    ] },
    en: { title: 'How it works', tips: [
      'The left bar (dock) holds your apps. Click an icon to open a tool.',
      'Tabs at the top show what is open. Drag to reorder, or press × to close.',
      'Press ⌘K (or Ctrl+K) to quickly search apps, people and actions.',
      'The ✦ icon (top-right) opens the AI assistant — ask it, or tell it to make changes.',
      'The ? icon (top-right) opens help for whatever app you are viewing.',
      'Everything saves automatically on this device — there is no “save” button.'
    ] }
  },
  schedule: { el: { title: 'Πρόγραμμα', tips: ['Κάνε κλικ σε ένα κελί για να αλλάξεις τη βάρδια ενός ατόμου.', 'Τα χρώματα δείχνουν τον τύπο βάρδιας (πρωί/μεσημέρι/νύχτα/ρεπό/άδεια).', 'Πάτησε «Δημοσίευση» για να επιλέξεις τι βλέπει το προσωπικό — όλο τον μήνα, μια εβδομάδα, ή συγκεκριμένες ημέρες.'] },
    en: { title: 'Schedule', tips: ['Click a cell to change a person’s shift.', 'Colors show the shift type (morning/midday/night/day-off/leave).', 'Use “Publish” to choose what staff can see — whole month, one week, or specific days.'] } },
  reservations: { el: { title: 'Κρατήσεις', tips: ['Ανέβασε κρατήσεις χειροκίνητα ή με επικόλληση πίνακα (ημέρα, τύπος, πελάτης, όχημα).', 'Το σύστημα επισημαίνει αυτόματα διπλότυπα και συγκρούσεις πριν τα προσθέσεις.', 'Ο «χάρτης φόρτου» δείχνει ποιες ημέρες είναι πολυάσχολες, ώστε να προσθέσεις προσωπικό.'] },
    en: { title: 'Reservations', tips: ['Add reservations manually or paste a table (day, type, customer, vehicle).', 'The system flags duplicates and conflicts before you add them.', 'The busy-day map shows which days are under pressure so you can add staff.'] } },
  ai: { el: { title: 'Βοηθός AI', tips: ['Γράψε μια ερώτηση («Ποιος έχει πιο πολλές νύχτες;») ή μια εντολή («Δημοσίευσε εβδομάδα 1»).', 'Οι ενέργειες εμφανίζονται ως κάρτες — πάτησε «Εφαρμογή» για να γίνουν, ή «Αναίρεση» για να τις πάρεις πίσω.', 'Δεν χάνεται τίποτα: κάθε ενέργεια καταγράφεται και αναιρείται.'] },
    en: { title: 'AI Assistant', tips: ['Type a question (“Who has the most nights?”) or a command (“Publish week 1”).', 'Actions appear as cards — press “Apply” to do them, or “Undo” to revert.', 'Nothing is lost: every action is logged and reversible.'] } },
  requests: { el: { title: 'Αιτήματα', tips: ['Εδώ εγκρίνεις ή απορρίπτεις αλλαγές βάρδιας και άδειες.', 'Οι υπάλληλοι υποβάλλουν αιτήματα από την εφαρμογή τους — δεν αλλάζουν μόνοι τους το πρόγραμμα.'] },
    en: { title: 'Requests', tips: ['Approve or decline shift swaps and leave here.', 'Employees submit requests from their app — they cannot change the schedule directly.'] } },
  members: { el: { title: 'Μέλη & Ρόλοι', tips: ['Πάτησε τον ρόλο ενός μέλους για να τον αλλάξεις από το μενού.', 'Το × αφαιρεί ένα μέλος (επιβεβαιώνεται πρώτα).', 'Μόνο 4 προϊστάμενοι υπάρχουν εξ ορισμού· οποιονδήποτε άλλον μπορείς να τον ορίσεις χειροκίνητα.'] },
    en: { title: 'Members & Roles', tips: ['Click a member’s role to change it from the menu.', 'The × removes a member (with confirmation).', 'There are 4 supervisors by default; you can assign any other role manually.'] } },
  reservations_login: {},
  login: { el: { title: 'Σύνδεση', tips: ['Επίλεξε έναν τοπικό λογαριασμό demo. Δεν ζητείται ή αποθηκεύεται κωδικός.', 'Οι απομνημονευμένοι λογαριασμοί εμφανίζονται με ⚡ — ένα κλικ και μπήκες.'] },
    en: { title: 'Login', tips: ['Choose a local demo account. No password is requested or stored.', 'Remembered accounts show a ⚡ — one click signs you in.'] } }
};
function helpFor(id, lang) { var h = HELP[id] || HELP._general; return (h[lang] || h.el || HELP._general[lang] || HELP._general.el); }

/* ============================================================================
 *  HELP MODULE  (searchable, covers every pattern)
 * ========================================================================== */
function HelpModule() {
  const ctx = useOS(); const { lang, registry, open } = ctx; const en = lang === 'en';
  const [q, setQ] = React.useState('');
  const topics = [{ id: '_general' }].concat(registry.filter(function (m) { return HELP[m.id]; }).map(function (m) { return { id: m.id, mod: m }; }));
  const nq = window.OS.norm(q);
  const filtered = topics.filter(function (t) { const h = helpFor(t.id, lang); return !q || window.OS.norm(h.title).indexOf(nq) >= 0 || h.tips.some(function (tip) { return window.OS.norm(tip).indexOf(nq) >= 0; }); });
  return (
    <div className="os-page" style={{ maxWidth: 820 }}>
      <h2 className="pg">{en ? 'Help & Guide' : 'Βοήθεια & Οδηγός'}</h2>
      <div className="pgsub">{en ? 'Everything you need to use the platform — no training required.' : 'Ό,τι χρειάζεσαι για να χρησιμοποιήσεις την πλατφόρμα — χωρίς εκπαίδευση.'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 11, padding: '9px 13px', marginBottom: 16 }}>
        <Icon name="search" size={16} color="var(--faint)" /><input value={q} onChange={function (e) { setQ(e.target.value); }} placeholder={en ? 'Search help…' : 'Αναζήτηση βοήθειας…'} style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)' }} />
      </div>
      {filtered.map(function (t) { const h = helpFor(t.id, lang); return (
        <div key={t.id} className="os-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {t.mod && <div style={{ width: 32, height: 32, borderRadius: 9, background: t.mod.tint + '22', color: t.mod.tint, display: 'grid', placeItems: 'center' }}><Icon name={t.mod.icon} size={16} /></div>}
            <h3 style={{ margin: 0 }}>{h.title}</h3>
            {t.mod && <button className="os-btn sm" style={{ marginLeft: 'auto' }} onClick={function () { open(t.mod.id); }}><Icon name="arrow" size={12} />{en ? 'Open' : 'Άνοιγμα'}</button>}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {h.tips.map(function (tip, i) { return <li key={i} style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--soft)' }}>{tip}</li>; })}
          </ul>
        </div>); })}
      {filtered.length === 0 && <div className="os-empty">{en ? 'No help topics match.' : 'Κανένα θέμα βοήθειας.'}</div>}
    </div>
  );
}

/* ---- contextual help popover for the CURRENT module ---------------------- */
function ContextualHelp({ onClose }) {
  const ctx = useOS(); const { lang, openId, open } = ctx; const en = lang === 'en';
  const h = helpFor(openId, lang);
  return (
    <React.Fragment>
      <div className="dr-scrim" onClick={onClose}></div>
      <div className="drawer" style={{ width: 360 }}>
        <div className="dr-head">
          <Icon name="lifebuoy" size={20} color="var(--accent)" />
          <div style={{ flex: 1 }}><div className="t">{h.title}</div><div className="s">{en ? 'Tips for this screen' : 'Συμβουλές γι’ αυτή την οθόνη'}</div></div>
          <button className="os-iconbtn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="dr-body">
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {h.tips.map(function (tip, i) { return <li key={i} style={{ fontSize: 13.5, lineHeight: 1.55 }}>{tip}</li>; })}
          </ul>
          <button className="os-btn" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={function () { open('help'); onClose(); }}><Icon name="lifebuoy" size={14} />{en ? 'Open full guide' : 'Πλήρης οδηγός'}</button>
        </div>
      </div>
    </React.Fragment>
  );
}

/* ---- first-run onboarding tour ------------------------------------------- */
function OnboardingTour({ lang, onClose }) {
  const en = lang === 'en';
  const [step, setStep] = React.useState(0);
  const steps = en ? [
    { t: 'Welcome to Program Shift', b: 'Your whole operation in one place — schedule, reservations, team and tools. This 4-step tour takes 20 seconds.' },
    { t: 'Apps live in the dock', b: 'The icon bar on the left opens every tool. Hover an icon to see its name; click to open it in a tab.' },
    { t: 'Find anything fast', b: 'Press ⌘K (Ctrl+K on Windows) anytime to search apps, people and actions, or to run a command.' },
    { t: 'Stuck? Ask or tap ?', b: 'The ✦ button is an AI assistant that can answer and even make changes. The ? button shows tips for the screen you are on.' }
  ] : [
    { t: 'Καλώς ήρθες στο Program Shift', b: 'Όλη η λειτουργία σου σε ένα μέρος — πρόγραμμα, κρατήσεις, ομάδα και εργαλεία. Αυτή η περιήγηση 4 βημάτων παίρνει 20 δευτερόλεπτα.' },
    { t: 'Οι εφαρμογές είναι στη μπάρα', b: 'Η μπάρα εικονιδίων αριστερά ανοίγει κάθε εργαλείο. Πέρνα το ποντίκι για το όνομα· κλικ για άνοιγμα σε καρτέλα.' },
    { t: 'Βρες τα πάντα γρήγορα', b: 'Πάτησε ⌘K (Ctrl+K σε Windows) οποτεδήποτε για αναζήτηση εφαρμογών, ατόμων και ενεργειών.' },
    { t: 'Κόλλησες; Ρώτα ή πάτα ?', b: 'Το κουμπί ✦ είναι ένας βοηθός AI που απαντά και κάνει αλλαγές. Το ? δείχνει συμβουλές για την οθόνη που βλέπεις.' }
  ];
  const s = steps[step]; const last = step === steps.length - 1;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,17,12,.55)', zIndex: 400, display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ width: 440, maxWidth: '94vw', background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 18, padding: 26, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--serif)', fontSize: 24, marginBottom: 16 }}>Σ</div>
        <div className="serif" style={{ fontSize: 23, fontWeight: 500, marginBottom: 8 }}>{s.t}</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--soft)' }}>{s.b}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 22 }}>
          {steps.map(function (_, i) { return <span key={i} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 4, background: i === step ? 'var(--accent)' : 'var(--line2)', transition: '.2s' }}></span>; })}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="os-btn sm" onClick={onClose}>{en ? 'Skip' : 'Παράλειψη'}</button>
            <button className="os-btn sm solid" onClick={function () { if (last) onClose(); else setStep(step + 1); }}>{last ? (en ? 'Get started' : 'Ξεκίνα') : (en ? 'Next' : 'Επόμενο')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 *  GLOBAL RESILIENCE  — catch errors so the app NEVER dies silently and a
 *  non-technical user can always recover without a developer.
 * ========================================================================== */
function installResilience() {
  if (window.__resilienceInstalled) return; window.__resilienceInstalled = true;
  var lastShown = 0;
  function recoveryBanner(msg) {
    var now = Date.now(); if (now - lastShown < 8000) return; lastShown = now;   // throttle
    try { if (window.OS && OS.Audit) OS.Audit.add({ action: 'system.error', target: String(msg).slice(0, 120), severity: 'error', module: 'system' }); } catch (e) {}
    if (document.getElementById('os-recover')) return;
    var el = document.createElement('div'); el.id = 'os-recover';
    el.setAttribute('role', 'alert');
    el.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9999;background:#26211b;color:#f3efe6;border:1px solid #5a4434;border-radius:14px;padding:13px 16px;box-shadow:0 16px 48px rgba(0,0,0,.4);font-family:system-ui,sans-serif;font-size:13px;display:flex;gap:12px;align-items:center;max-width:92vw';
    var greek = (document.documentElement.lang || 'el') !== 'en';
    el.innerHTML = '<span>' + (greek ? '⚠ Κάτι πήγε στραβά, αλλά η εφαρμογή συνεχίζει. Αν κολλήσει κάτι:' : '⚠ Something went wrong, but the app is still running. If anything looks stuck:') + '</span>';
    var reload = document.createElement('button'); reload.textContent = greek ? 'Επαναφόρτωση' : 'Reload';
    reload.style.cssText = 'background:#b5482b;color:#fff;border:0;border-radius:8px;padding:7px 12px;font-weight:600;cursor:pointer;font-size:12px';
    reload.onclick = function () { location.reload(); };
    var dismiss = document.createElement('button'); dismiss.textContent = '✕';
    dismiss.style.cssText = 'background:transparent;color:#b7b0a2;border:0;cursor:pointer;font-size:14px';
    dismiss.onclick = function () { el.remove(); };
    el.appendChild(reload); el.appendChild(dismiss); document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 14000);
  }
  window.addEventListener('error', function (e) { recoveryBanner(e.message || 'error'); });
  window.addEventListener('unhandledrejection', function (e) { recoveryBanner((e.reason && e.reason.message) || 'promise rejection'); });
  // expose a safe self-repair other modules / health screen can call
  window.OSRecover = {
    repairStore: function (key) { try { localStorage.removeItem('psos.' + key); return true; } catch (e) { return false; } },
    safeReset: function () { try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('psos.') === 0 && k !== 'psos.members' && k !== 'psos.session') localStorage.removeItem(k); }); return true; } catch (e) { return false; } }
  };
}
installResilience();

Object.assign(window, { HelpModule, ContextualHelp, OnboardingTour, HELP, helpFor, installResilience });
