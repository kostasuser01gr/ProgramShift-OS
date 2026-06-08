/* ============================================================================
 *  os/modules2.jsx — Chat, Audit, Activity, Members, Settings, Import/Export,
 *  Employee mobile host, Denied + ComingSoon. (Continuation of modules.jsx)
 * ========================================================================== */

/* ---------- denied + coming soon ---------- */
function DeniedModule({ perm }) {
  const { lang } = useOS();
  return (
    <div className="os-denied">
      <div className="lock"><Icon name="shield" size={28} /></div>
      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>{lang === 'en' ? 'No access' : 'Χωρίς πρόσβαση'}</div>
      <div style={{ maxWidth: 320 }}>{lang === 'en' ? 'Your role does not permit this module. Ask an owner to grant ' : 'Ο ρόλος σου δεν επιτρέπει αυτό το module. Ζήτησε από ιδιοκτήτη το δικαίωμα '}<code style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{perm}</code>.</div>
    </div>
  );
}
function ComingSoonModule({ mod }) {
  const { lang } = useOS();
  return (
    <div className="os-denied">
      <div className="lock" style={{ color: 'var(--accent)' }}><Icon name={(mod && mod.icon) || 'sparkle'} size={28} /></div>
      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>{mod ? (lang === 'en' ? mod.name.en : mod.name.el) : ''} · {lang === 'en' ? 'Coming soon' : 'Σύντομα'}</div>
      <div style={{ maxWidth: 360 }}>{mod ? (lang === 'en' ? mod.desc.en : mod.desc.el) : ''}</div>
      <div style={{ maxWidth: 360, fontSize: 12, color: 'var(--faint)' }}>{lang === 'en' ? 'This module needs server-side storage — it is part of the production roadmap (Vercel scaffold), not the front-end prototype.' : 'Αυτό το module χρειάζεται αποθήκευση στον server — είναι μέρος του production roadmap (Vercel scaffold), όχι του front-end πρωτοτύπου.'}</div>
    </div>
  );
}

/* ============================================================================
 *  INTERNAL CHAT  (channels + chatops + AI summary)
 * ========================================================================== */
function ChatModule() {
  const ctx = useOS(); const { lang, role, derived } = ctx; const OS = window.OS;
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
  const [ch, setCh] = React.useState('general');
  const [text, setText] = React.useState('');
  const me = role === 'owner' ? 'Σοφία' : role === 'manager' ? 'Χριστίνα' : 'Εγώ';
  const msgs = OS.Chat.get(ch);
  const channels = OS.Chat.channels();

  function chatops(cmd) {
    const en = lang === 'en';
    if (/coverage|κάλυψη/i.test(cmd)) { const low = derived.coverage.filter(function (c) { return c.status === 'low'; }); return en ? ('Coverage: ' + (low.length ? low.length + ' understaffed days (' + low.map(function (c) { return c.day; }).join(',') + ')' : 'all days OK')) : ('Κάλυψη: ' + (low.length ? low.length + ' ημέρες υποστελέχωσης (' + low.map(function (c) { return c.day; }).join(',') + ')' : 'όλες ΟΚ')); }
    if (/warning|προειδοπ/i.test(cmd)) { const h = derived.warnings.filter(function (w) { return w.sev === 'hard'; }).length; return en ? (derived.warnings.length + ' warnings (' + h + ' critical)') : (derived.warnings.length + ' προειδοποιήσεις (' + h + ' σοβαρές)'); }
    return en ? 'Commands: /coverage, /warnings' : 'Εντολές: /coverage, /warnings';
  }
  function send() {
    const v = text.trim(); if (!v) return;
    OS.Chat.post(ch, { who: me, role: role, text: v });
    if (v[0] === '/') OS.Chat.post(ch, { who: 'ChatOps', role: 'bot', text: chatops(v) });
    setText(''); force();
  }
  function aiSummary() {
    const en = lang === 'en';
    const last = msgs.slice(-6).map(function (m) { return m.who + ': ' + m.text; }).join('\n');
    OS.Chat.post(ch, { who: 'AI', role: 'bot', text: (en ? 'Summary: ' : 'Σύνοψη: ') + (last ? (en ? 'team discussed coverage and warnings for the channel.' : 'η ομάδα συζήτησε κάλυψη και προειδοποιήσεις.') : (en ? 'no messages yet.' : 'καμία συζήτηση ακόμη.')) });
    force();
  }

  return (
    <div className="os-page" style={{ display: 'flex', gap: 16, height: '100%', padding: 0 }}>
      <div style={{ width: 190, borderRight: '1px solid var(--line)', padding: '18px 12px', flexShrink: 0 }}>
        <div className="ln-sectitle" style={{ margin: '0 4px 10px' }}>{lang === 'en' ? 'Channels' : 'Κανάλια'}</div>
        {channels.map(function (c) { return (
          <div key={c} onClick={function () { setCh(c); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: ch === c ? 700 : 500, background: ch === c ? 'var(--card)' : 'transparent', color: ch === c ? 'var(--ink)' : 'var(--soft)' }}>
            <span style={{ color: 'var(--faint)' }}>#</span>{c}
          </div>); })}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 22px 16px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <h2 className="pg" style={{ fontSize: 21 }}>#{ch}</h2>
          <button className="os-btn sm" style={{ marginLeft: 'auto' }} onClick={aiSummary}><Icon name="sparkle" size={13} />{lang === 'en' ? 'AI summary' : 'Σύνοψη AI'}</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 11, paddingRight: 4 }}>
          {msgs.length === 0 && <div className="os-empty">{lang === 'en' ? 'No messages. Try /coverage' : 'Καμία συζήτηση. Δοκίμασε /coverage'}</div>}
          {msgs.map(function (m) { const bot = m.role === 'bot'; return (
            <div key={m.id} style={{ display: 'flex', gap: 10 }}>
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 12, flexShrink: 0, background: bot ? 'var(--accent)' : m.role === 'owner' ? 'var(--accent)' : m.role === 'manager' ? 'var(--blue)' : 'var(--line2)', color: bot || m.role !== 'employee' ? '#fff' : 'var(--soft)' }}>{bot ? '✦' : m.who[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, color: 'var(--faint)' }}><strong style={{ color: 'var(--ink)' }}>{m.who}</strong> · {fmtAgo(m.at, lang)}</div>
                <div style={{ fontSize: 13.5, marginTop: 2, color: bot ? 'var(--accent-ink, var(--accent))' : 'var(--ink)', background: bot ? 'var(--accent-soft)' : 'transparent', borderRadius: 9, padding: bot ? '7px 11px' : 0, display: 'inline-block' }}>{m.text}</div>
              </div>
            </div>); })}
        </div>
        {OS.Perms.can(role, 'chat.post') && <div className="ai-input" style={{ marginTop: 12 }}>
          <input value={text} onChange={function (e) { setText(e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter') send(); }} placeholder={lang === 'en' ? 'Message #' + ch + '  ·  /coverage' : 'Μήνυμα #' + ch + '  ·  /coverage'} />
          <button className="ai-send" onClick={send}><Icon name="arrow" size={16} /></button>
        </div>}
      </div>
    </div>
  );
}

/* ============================================================================
 *  AUDIT LOG
 * ========================================================================== */
function AuditModule() {
  const { lang, role } = useOS(); const OS = window.OS;
  if (!OS.Perms.can(role, 'audit.view')) return <DeniedModule perm="audit.view" />;
  const [f, setF] = React.useState('all');
  const all = OS.Audit.all();
  const actions = ['all'].concat(all.map(function (a) { return a.action; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 6));
  const list = all.filter(function (a) { return f === 'all' || a.action === f; });
  return (
    <div className="os-page">
      <h2 className="pg">{lang === 'en' ? 'Audit Log' : 'Αρχείο Ελέγχου'}</h2>
      <div className="pgsub">{all.length} {lang === 'en' ? 'recorded actions' : 'καταγεγραμμένες ενέργειες'}</div>
      <div className="filterbar">{actions.map(function (a) { return <button key={a} className={'os-btn sm' + (f === a ? ' solid' : '')} onClick={function () { setF(a); }}>{a}</button>; })}</div>
      {list.length === 0 && <div className="os-empty">{lang === 'en' ? 'No actions logged yet — interact with the platform.' : 'Καμία ενέργεια ακόμη — αλληλεπίδρασε με την πλατφόρμα.'}</div>}
      {list.map(function (a) { return (
        <div key={a.id} className="os-row">
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--paper)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--accent)', flexShrink: 0 }}><Icon name="check" size={14} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}><span className="mono">{a.action}</span> {a.target ? '· ' + a.target : ''}</div>
            <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{a.role || 'system'} · {a.module || '—'}</div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--faint)', fontFamily: 'var(--mono)' }}>{fmtAgo(a.at, lang)}</span>
        </div>); })}
    </div>
  );
}

/* ============================================================================
 *  ACTIVITY TIMELINE  (memory + event bus)
 * ========================================================================== */
function ActivityModule() {
  const { lang } = useOS(); const OS = window.OS;
  const [scope, setScope] = React.useState('all');
  const mem = OS.Memory.all().map(function (m) { return { at: m.at, text: m.text, kind: m.kind || 'note' }; });
  const evts = OS.Bus.log().map(function (e) { return { at: e.at, text: e.ev, kind: 'event' }; });
  let merged = mem.concat(evts).sort(function (a, b) { return b.at - a.at; });
  if (scope === 'today') { const d = new Date(); d.setHours(0, 0, 0, 0); merged = merged.filter(function (x) { return x.at >= d.getTime(); }); }
  return (
    <div className="os-page" style={{ maxWidth: 720 }}>
      <h2 className="pg">{lang === 'en' ? 'Activity' : 'Δραστηριότητα'}</h2>
      <div className="pgsub">{lang === 'en' ? 'What happened across the platform' : 'Τι συνέβη στην πλατφόρμα'}</div>
      <div className="seg small" style={{ marginBottom: 16 }}>
        <button className={scope === 'all' ? 'on' : ''} onClick={function () { setScope('all'); }}>{lang === 'en' ? 'All' : 'Όλα'}</button>
        <button className={scope === 'today' ? 'on' : ''} onClick={function () { setScope('today'); }}>{lang === 'en' ? 'Today' : 'Σήμερα'}</button>
      </div>
      {merged.length === 0 && <div className="os-empty">{lang === 'en' ? 'No activity yet.' : 'Καμία δραστηριότητα.'}</div>}
      <div style={{ position: 'relative', paddingLeft: 22 }}>
        <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 2, background: 'var(--line)' }}></div>
        {merged.slice(0, 60).map(function (x, i) { return (
          <div key={i} style={{ position: 'relative', paddingBottom: 16 }}>
            <div style={{ position: 'absolute', left: -22, top: 3, width: 12, height: 12, borderRadius: '50%', background: x.kind === 'event' ? 'var(--blue)' : x.kind === 'automation' ? 'var(--accent)' : 'var(--green)', border: '2px solid var(--paper)' }}></div>
            <div style={{ fontSize: 13.5, color: 'var(--ink)' }}>{x.text}</div>
            <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 1 }}>{x.kind} · {fmtAgo(x.at, lang)}</div>
          </div>); })}
      </div>
    </div>
  );
}

/* ============================================================================
 *  MEMBERS & ROLES  (all program members; supervisors edit roles + remove)
 * ========================================================================== */
function MembersModule() {
  const { D, T, lang, role } = useOS(); const OS = window.OS; const en = lang === 'en';
  if (!OS.Perms.can(role, 'members.view')) return <DeniedModule perm="members.view" />;
  const canEdit = OS.Perms.can(role, 'members.edit');
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
  const [q, setQ] = React.useState('');
  const [roleOpen, setRoleOpen] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  const ROLES = ['owner', 'manager', 'employee', 'viewer'];
  const tint = { owner: 'var(--accent)', manager: 'var(--blue)', employee: 'var(--line2)', viewer: 'var(--line2)' };
  const all = OS.Members.list();
  const counts = OS.Members.counts();
  const norm = function (s) { return String(s).toLowerCase().replace(/ς/g, 'σ'); };
  const list = all.filter(function (m) { return !q || norm(m.name).indexOf(norm(q)) >= 0 || (m.ame + '').indexOf(q) >= 0; });

  function changeRole(m, r) {
    OS.Members.setRole(m.id, r); setRoleOpen(null);
    OS.Audit.add({ action: 'member.role_changed', target: m.name + ' → ' + r, role: role, module: 'members' });
    OS.Memory.add({ kind: 'members', text: (en ? 'Role changed · ' : 'Αλλαγή ρόλου · ') + m.name + ' → ' + T('role_' + r) });
    OS.Notify.add({ type: 'system', title: T('mem_role_done'), desc: m.name + ' · ' + T('role_' + r), module: 'members' });
    force();
  }
  function removeMember(m) {
    if (!confirm(T('mem_remove_q') + '\n\n' + m.name)) return;
    OS.Members.remove(m.id);
    OS.Audit.add({ action: 'member.removed', target: m.name, role: role, module: 'members' });
    OS.Memory.add({ kind: 'members', text: (en ? 'Removed member · ' : 'Αφαίρεση μέλους · ') + m.name });
    OS.Notify.add({ type: 'warning', title: T('mem_removed'), desc: m.name, module: 'members' });
    force();
  }
  function addMember() {
    const nm = newName.trim(); if (!nm) return;
    const mb = OS.Members.add({ name: nm, first: nm.split(' ')[0], email: OS.greeklish(nm.split(' ')[0]) + '@programshift.gr', role: 'employee' });
    OS.Audit.add({ action: 'member.added', target: nm, role: role, module: 'members' });
    setNewName(''); setAdding(false); force();
  }

  return (
    <div className="os-page" style={{ maxWidth: 880 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <h2 className="pg">{en ? 'Members & Roles' : 'Μέλη & Ρόλοι'}</h2>
          <div className="pgsub" style={{ margin: 0 }}>{all.length} {T('mem_count')} {T('mem_active')} · {counts.owner} {T('role_owner')} · {counts.manager} {T('role_manager')} · {counts.employee} {T('role_employee')} · <span className="os-tag normal" style={{ marginLeft: 4 }}><Icon name="check" size={11} style={{ verticalAlign: -1 }} /> {T('mem_synced')}</span></div>
        </div>
        {canEdit && <button className="os-btn solid" onClick={function () { setAdding(!adding); }}><Icon name="plus" size={15} />{T('invite')}</button>}
      </div>

      {adding && canEdit && <div className="os-panel" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="os-input" autoFocus value={newName} onChange={function (e) { setNewName(e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter') addMember(); }} placeholder={T('mem_invite_name')} />
          <button className="os-btn solid" onClick={addMember}>{T('submit')}</button>
          <button className="os-btn" onClick={function () { setAdding(false); }}>{T('cancel')}</button>
        </div>
      </div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 11, padding: '9px 13px', marginBottom: 14 }}>
        <Icon name="search" size={16} color="var(--faint)" />
        <input value={q} onChange={function (e) { setQ(e.target.value); }} placeholder={T('mem_search')} style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)' }} />
        {q && <span style={{ fontSize: 12, color: 'var(--faint)' }}>{list.length}</span>}
      </div>

      <div className="os-panel" style={{ padding: '6px 18px' }}>
        {list.length === 0 && <div className="os-empty">{en ? 'No members match.' : 'Κανένα μέλος.'}</div>}
        {list.map(function (m) {
          const meSelf = (role === 'owner' && m.core);
          return (
            <div key={m.id} className="os-row" style={{ borderBottom: '1px solid var(--line)' }}>
              <div className="avatar" style={{ background: tint[m.role], color: m.role === 'employee' || m.role === 'viewer' ? 'var(--soft)' : '#fff', flexShrink: 0 }}>{(m.first || m.name)[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}{m.core && <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 500 }}> · {T('mem_you')}</span>}</div>
                <div style={{ fontSize: 12, color: 'var(--faint)' }}>{m.email} {m.ame !== '—' && <span className="mono"> · {m.ame}</span>}</div>
              </div>

              <div style={{ position: 'relative' }}>
                {canEdit ? (
                  <button className={'rolechip ' + m.role} style={{ cursor: 'pointer', border: 0, marginLeft: 0, display: 'inline-flex', alignItems: 'center', gap: 3 }} onClick={function () { setRoleOpen(roleOpen === m.id ? null : m.id); }}>
                    {T('role_' + m.role)} <Icon name="chevron" size={11} style={{ transform: 'rotate(90deg)' }} />
                  </button>
                ) : <span className={'rolechip ' + m.role} style={{ marginLeft: 0 }}>{T('role_' + m.role)}</span>}
                {roleOpen === m.id && (
                  <div style={{ position: 'absolute', right: 0, top: '116%', zIndex: 30, background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 10, padding: 5, boxShadow: 'var(--os-elev)', minWidth: 160 }}>
                    {ROLES.map(function (rr) { return (
                      <div key={rr} onClick={function () { changeRole(m, rr); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 9px', borderRadius: 7, cursor: 'pointer', background: m.role === rr ? 'var(--paper)' : 'transparent' }}>
                        <span className={'rolechip ' + rr} style={{ margin: 0 }}>{T('role_' + rr)}</span>
                        {m.role === rr && <Icon name="check" size={14} color="var(--green)" style={{ marginLeft: 'auto' }} />}
                      </div>); })}
                  </div>
                )}
              </div>

              {canEdit && !meSelf && <button className="os-iconbtn" style={{ width: 32, height: 32 }} title={T('mem_remove')} onClick={function () { removeMember(m); }}><Icon name="x" size={15} /></button>}
              {meSelf && <div style={{ width: 32 }}></div>}
            </div>
          );
        })}
      </div>

      {role === 'owner' && <div style={{ marginTop: 18 }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 19, margin: '0 0 12px' }}>{en ? 'Owner controls' : 'Έλεγχος ιδιοκτήτη'}</h3>
        <OwnerSettings D={D} T={T} lang={lang} />
      </div>}
    </div>
  );
}

/* ============================================================================
 *  SETTINGS CENTER
 * ========================================================================== */
function SettingsModule() {
  const ctx = useOS(); const { lang, role, theme, setTheme, setLang, registry } = ctx; const OS = window.OS;
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
  const s = OS.Settings.get();
  function toggleModule(id) { const dm = s.disabledModules.indexOf(id) >= 0 ? s.disabledModules.filter(function (x) { return x !== id; }) : s.disabledModules.concat([id]); OS.Settings.set({ disabledModules: dm }); force(); }
  const en = lang === 'en';
  return (
    <div className="os-page" style={{ maxWidth: 760 }}>
      <h2 className="pg">{en ? 'Settings' : 'Ρυθμίσεις'}</h2>
      <div className="pgsub">{en ? 'Personalize the platform' : 'Προσαρμογή της πλατφόρμας'}</div>

      <div className="os-panel">
        <h3>{en ? 'Appearance' : 'Εμφάνιση'}</h3>
        <div className="os-row"><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{en ? 'Theme' : 'Θέμα'}</div><div style={{ fontSize: 12, color: 'var(--soft)' }}>{en ? 'Light or dark' : 'Φωτεινό ή σκούρο'}</div></div>
          <div className="seg small"><button className={theme === 'light' ? 'on' : ''} onClick={function () { setTheme('light'); }}>☀︎ {en ? 'Light' : 'Φωτεινό'}</button><button className={theme === 'dark' ? 'on' : ''} onClick={function () { setTheme('dark'); }}>☾ {en ? 'Dark' : 'Σκούρο'}</button></div>
        </div>
        <div className="os-row"><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{en ? 'Language' : 'Γλώσσα'}</div></div>
          <div className="seg small"><button className={lang === 'el' ? 'on' : ''} onClick={function () { setLang('el'); }}>ΕΛ</button><button className={lang === 'en' ? 'on' : ''} onClick={function () { setLang('en'); }}>EN</button></div>
        </div>
      </div>

      <div className="os-panel">
        <h3>{en ? 'Modules' : 'Modules'}</h3>
        <div style={{ fontSize: 12.5, color: 'var(--soft)', marginBottom: 8 }}>{en ? 'Enable or disable apps in the launcher and dock.' : 'Ενεργοποίησε ή απενεργοποίησε εφαρμογές.'}</div>
        {registry.filter(function (m) { return m.id !== 'launcher' && m.id !== 'settings'; }).map(function (m) { return (
          <div key={m.id} className="os-row">
            <div style={{ width: 30, height: 30, borderRadius: 8, background: m.tint + '22', color: m.tint, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={m.icon} size={15} /></div>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{en ? m.name.en : m.name.el}</div>
            <button className={'os-toggle' + (s.disabledModules.indexOf(m.id) < 0 ? ' on' : '')} onClick={function () { toggleModule(m.id); }}></button>
          </div>); })}
      </div>

      <div className="os-panel">
        <h3>{en ? 'AI assistant' : 'Βοηθός AI'}</h3>
        <div className="os-row"><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{en ? 'Connection' : 'Σύνδεση'}</div><div style={{ fontSize: 12, color: 'var(--soft)' }}>{OS.AI.available() ? (en ? 'Live model connected' : 'Συνδεδεμένο μοντέλο') : (en ? 'Local fallback (computed answers)' : 'Τοπικές απαντήσεις')}</div></div>
          <span className={'os-tag ' + (OS.AI.available() ? 'normal' : 'low')}>{OS.AI.available() ? 'live' : 'local'}</span>
        </div>
      </div>

      <div className="os-panel" style={{ marginBottom: 0 }}>
        <h3>{en ? 'Data' : 'Δεδομένα'}</h3>
        <div style={{ fontSize: 12.5, color: 'var(--soft)', marginBottom: 10 }}>{en ? 'Tasks, notes, chat, automations and settings persist in this browser.' : 'Εργασίες, σημειώσεις, chat, αυτοματισμοί και ρυθμίσεις αποθηκεύονται σε αυτόν τον browser.'}</div>
        <button className="os-btn" onClick={function () { if (confirm(en ? 'Reset all local platform data?' : 'Επαναφορά όλων των τοπικών δεδομένων;')) { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('psos.') === 0) localStorage.removeItem(k); }); location.reload(); } }}><Icon name="x" size={14} />{en ? 'Reset local data' : 'Επαναφορά δεδομένων'}</button>
      </div>
    </div>
  );
}

/* ============================================================================
 *  IMPORT / EXPORT CENTER
 * ========================================================================== */
function ImportExportModule() {
  const ctx = useOS(); const { D, T, lang, role, month, importMonth } = ctx; const OS = window.OS;
  if (!OS.Perms.can(role, 'import')) return <DeniedModule perm="import" />;
  const [open, setOpen] = React.useState(false);
  const en = lang === 'en';
  return (
    <div className="os-page" style={{ maxWidth: 760 }}>
      <h2 className="pg">{en ? 'Import / Export' : 'Εισαγωγή / Εξαγωγή'}</h2>
      <div className="pgsub">{en ? 'Bring a schedule file in, or take the current month out.' : 'Φέρε αρχείο προγράμματος, ή εξάγαγε τον τρέχοντα μήνα.'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="os-panel" style={{ margin: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', marginBottom: 11 }}><Icon name="upload" size={20} /></div>
          <h3 style={{ margin: '0 0 6px' }}>{T('imp_title')}</h3>
          <div style={{ fontSize: 12.5, color: 'var(--soft)', marginBottom: 14 }}>{T('imp_sub')}</div>
          <button className="os-btn solid" onClick={function () { setOpen(true); }}><Icon name="upload" size={14} />{T('imp_btn')}</button>
        </div>
        <div className="os-panel" style={{ margin: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--green-soft)', color: 'var(--green)', display: 'grid', placeItems: 'center', marginBottom: 11 }}><Icon name="pdf" size={20} /></div>
          <h3 style={{ margin: '0 0 6px' }}>{en ? 'Export current month' : 'Εξαγωγή τρέχοντος μήνα'}</h3>
          <div style={{ fontSize: 12.5, color: 'var(--soft)', marginBottom: 14 }}>{en ? 'Download ' + month.label.en + ' as CSV (re-importable).' : 'Κατέβασε ' + month.label.el + ' ως CSV.'}</div>
          <button className="os-btn" onClick={function () { exportMonthCSV(month); OS.Audit.add({ action: 'export.csv', target: month.label.en, role: role, module: 'import' }); }}><Icon name="pdf" size={14} />CSV</button>
        </div>
      </div>
      {open && <ImportModal D={D} T={T} lang={lang} close={function () { setOpen(false); }} />}
    </div>
  );
}

/* ============================================================================
 *  EMPLOYEE MOBILE  (iOS frame inside the OS)
 * ========================================================================== */
function EmployeeMobileModule() {
  const { lang, month } = useOS();
  return (
    <div className="os-mobile-host">
      <IOSDevice><EmployeeApp lang={lang} month={month} /></IOSDevice>
    </div>
  );
}

Object.assign(window, {
  DeniedModule, ComingSoonModule, ChatModule, AuditModule, ActivityModule,
  MembersModule, SettingsModule, ImportExportModule, EmployeeMobileModule
});
