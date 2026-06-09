/* ============================================================================
 *  os/auth.jsx — login / sign-up screen, user menu, PWA install button.
 *  Auth is front-end: the Members directory IS the user directory. Roles come
 *  from each member's record (pre-issued or set by supervisors).
 * ========================================================================== */

var ROLE_TINT = { owner: 'var(--accent)', manager: 'var(--blue)', employee: 'var(--line2)', viewer: 'var(--line2)', inspector: 'var(--accent)', coordinator: 'var(--blue)', cs_supervisor: 'var(--blue)', fleet_supervisor: 'var(--blue)' };
var ROLE_TINT_TEXT = function (role) { return (role === 'employee' || role === 'viewer') ? 'var(--soft)' : '#fff'; };

function InstallButton({ lang, block }) {
  const en = lang === 'en';
  const [state, setState] = React.useState(window.__pwaState || 'idle'); // idle | ready | done | unsupported
  React.useEffect(function () {
    function onReady() { setState('ready'); }
    function onDone() { setState('done'); }
    window.addEventListener('pwa-installable', onReady);
    window.addEventListener('pwa-installed', onDone);
    if (window.__pwaState) setState(window.__pwaState);
    return function () { window.removeEventListener('pwa-installable', onReady); window.removeEventListener('pwa-installed', onDone); };
  }, []);
  function click() {
    if (window.deferredPrompt) { window.deferredPrompt.prompt(); window.deferredPrompt.userChoice.then(function () { window.deferredPrompt = null; setState('done'); }); }
    else { alert(en ? 'To install: open the browser menu → “Install app” / “Add to Home Screen”.' : 'Για εγκατάσταση: μενού browser → «Εγκατάσταση εφαρμογής» / «Προσθήκη στην οθόνη».'); }
  }
  const label = state === 'done' ? (en ? 'Installed' : 'Εγκαταστάθηκε') : (en ? 'Install app' : 'Εγκατάσταση');
  return (
    <button className={'os-btn' + (block ? ' solid' : '')} style={block ? { width: '100%', justifyContent: 'center' } : {}} onClick={click} disabled={state === 'done'}>
      <Icon name="upload" size={14} />{label}
    </button>
  );
}

function LoginScreen({ lang, setLang, onDone }) {
  const OS = window.OS; const en = lang === 'en';
  const [mode, setMode] = React.useState('login');
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [err, setErr] = React.useState('');
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);

  const all = OS.Members.list();
  const savedLogins = OS.Auth.savedLogins();
  const owner = all.filter(function (m) { return m.role === 'owner'; })[0];
  const mgr = all.filter(function (m) { return OS.isSupervisor(m.role) && m.role !== 'owner'; })[0];
  const emp = all.filter(function (m) { return m.role === 'employee'; })[0];
  const quick = [owner, mgr, emp].filter(Boolean);

  function submit() {
    setErr('');
    if (mode === 'login') {
      const s = OS.Auth.login(email.trim(), pw, remember);
      if (s && s.error === 'no_account') { setErr(en ? 'No account with that email. Try a saved/quick login below, or sign up.' : 'Δεν βρέθηκε λογαριασμός. Δοκίμασε αποθηκευμένη/γρήγορη σύνδεση ή εγγραφή.'); return; }
      if (s && s.error === 'bad_password') { setErr(en ? 'Wrong password.' : 'Λάθος κωδικός.'); return; }
      onDone(s);
    } else {
      if (!name.trim() || !email.trim()) { setErr(en ? 'Name and email required.' : 'Απαιτείται όνομα και email.'); return; }
      onDone(OS.Auth.signup(name.trim(), email.trim(), pw, remember));
    }
  }

  return (
    <div className="os" style={{ minHeight: '100vh', background: 'radial-gradient(1200px 600px at 50% -10%, #efe9dc 0%, var(--paper) 60%)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ position: 'fixed', top: 16, right: 18 }}>
        <div className="langtoggle"><button className={lang === 'el' ? 'on' : ''} onClick={function () { setLang('el'); }}>ΕΛ</button><button className={lang === 'en' ? 'on' : ''} onClick={function () { setLang('en'); }}>EN</button></div>
      </div>
      <div style={{ width: 420, maxWidth: '94vw' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--serif)', fontSize: 30, margin: '0 auto 14px' }}>Σ</div>
          <div className="serif" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-.01em' }}>Program Shift</div>
          <div style={{ color: 'var(--soft)', fontSize: 13.5, marginTop: 2 }}>{en ? 'Sign in to your operating platform' : 'Συνδέσου στην πλατφόρμα σου'}</div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 18, padding: 22, boxShadow: '0 18px 48px rgba(0,0,0,.1)' }}>
          <div className="seg small" style={{ width: '100%', marginBottom: 16, display: 'flex' }}>
            <button className={mode === 'login' ? 'on' : ''} style={{ flex: 1 }} onClick={function () { setMode('login'); setErr(''); }}>{en ? 'Log in' : 'Σύνδεση'}</button>
            <button className={mode === 'signup' ? 'on' : ''} style={{ flex: 1 }} onClick={function () { setMode('signup'); setErr(''); }}>{en ? 'Sign up' : 'Εγγραφή'}</button>
          </div>

          {mode === 'signup' && <input className="os-input" style={{ marginBottom: 9 }} placeholder={en ? 'Full name' : 'Ονοματεπώνυμο'} value={name} onChange={function (e) { setName(e.target.value); }} />}
          <input className="os-input" style={{ marginBottom: 9 }} placeholder="email" autoComplete="username" value={email} onChange={function (e) { setEmail(e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter') submit(); }} />
          <input className="os-input" type="password" placeholder={en ? 'Password' : 'Κωδικός'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={pw} onChange={function (e) { setPw(e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter') submit(); }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12.5, color: 'var(--soft)', cursor: 'pointer' }}>
            <input type="checkbox" checked={remember} onChange={function (e) { setRemember(e.target.checked); }} />{en ? 'Save password for instant login' : 'Αποθήκευση κωδικού για άμεση σύνδεση'}
          </label>
          {err && <div style={{ color: 'var(--red)', fontSize: 12.5, marginTop: 8 }}>{err}</div>}
          <button className="os-btn solid" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={submit}>
            <Icon name="arrow" size={15} />{mode === 'login' ? (en ? 'Continue' : 'Συνέχεια') : (en ? 'Create account' : 'Δημιουργία')}</button>

          {mode === 'signup' && <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 9, textAlign: 'center' }}>{en ? 'New accounts start as Employee. A supervisor sets your role.' : 'Οι νέοι λογαριασμοί ξεκινούν ως Υπάλληλος. Ο ρόλος ορίζεται από προϊστάμενο.'}</div>}
        </div>

        {savedLogins.length > 0 && <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--faint)', margin: '0 4px 8px' }}>{en ? 'Saved accounts · instant login' : 'Αποθηκευμένοι · άμεση σύνδεση'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {savedLogins.map(function (s) { return (
              <div key={s.email} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11, background: 'var(--card)', border: '1px solid var(--accent-soft)', cursor: 'pointer', textAlign: 'left' }} onClick={function () { onDone(OS.Auth.instant(s.email)); }}>
                <span className="avatar" style={{ width: 30, height: 30, fontSize: 12, background: ROLE_TINT[s.role] || 'var(--line2)', color: ROLE_TINT_TEXT(s.role) }}>{(s.name || '?')[0]}</span>
                <span style={{ flex: 1 }}><span style={{ fontWeight: 600, fontSize: 13.5, display: 'block', color: 'var(--ink)' }}>{s.name}</span><span style={{ fontSize: 11.5, color: 'var(--faint)' }}>{s.email}</span></span>
                <span title={en ? 'Instant login' : 'Άμεση σύνδεση'} style={{ color: 'var(--accent)', display: 'flex' }}><Icon name="zap" size={16} /></span>
                <span title={en ? 'Forget' : 'Διαγραφή'} onClick={function (e) { e.stopPropagation(); OS.Auth.forget(s.email); force(); }} style={{ color: 'var(--faint)', display: 'flex', padding: 2 }}><Icon name="x" size={14} /></span>
              </div>); })}
          </div>
        </div>}

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--faint)', margin: '0 4px 8px' }}>{en ? 'Quick login (demo)' : 'Γρήγορη σύνδεση (demo)'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {quick.map(function (m) { return (
              <button key={m.id} onClick={function () { onDone(OS.Auth.loginAs(m)); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11, background: 'var(--card)', border: '1px solid var(--line)', cursor: 'pointer', textAlign: 'left' }}>
                <span className="avatar" style={{ width: 30, height: 30, fontSize: 12, background: ROLE_TINT[m.role] || 'var(--line2)', color: ROLE_TINT_TEXT(m.role) }}>{(m.first || m.name)[0]}</span>
                <span style={{ flex: 1 }}><span style={{ fontWeight: 600, fontSize: 13.5, display: 'block', color: 'var(--ink)' }}>{m.name}</span><span style={{ fontSize: 11.5, color: 'var(--faint)' }}>{m.email}</span></span>
                <span className={'rolechip ' + m.role} style={{ marginLeft: 0 }}>{window.t('role_' + m.role, lang)}</span>
              </button>); })}
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}><InstallButton lang={lang} /></div>
      </div>
    </div>
  );
}

function UserMenu({ session, role, lang, onLogout, onViewAs }) {
  const en = lang === 'en'; const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const isOwner = session.role === 'owner';
  React.useEffect(function () {
    if (!open) return;
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    function handleKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleKey);
    return function () { document.removeEventListener('mousedown', handle); document.removeEventListener('keydown', handleKey); };
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="os-btn sm" style={{ paddingLeft: 5 }} aria-haspopup="menu" aria-expanded={open} aria-label={session.name + ' — ' + (en ? 'account menu' : 'μενού λογαριασμού')} onClick={function () { setOpen(!open); }}>
        <span className="avatar" style={{ width: 24, height: 24, fontSize: 11, background: ROLE_TINT[role] || 'var(--line2)', color: ROLE_TINT_TEXT(role) }}>{session.name[0]}</span>
        {session.name.split(' ')[0]}<Icon name="chevron" size={11} style={{ transform: 'rotate(90deg)' }} />
      </button>
      {open && <div style={{ position: 'absolute', right: 0, top: '118%', zIndex: 140, background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 12, padding: 6, minWidth: 210, boxShadow: 'var(--os-elev)' }}>
        <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{session.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{session.email}</div>
          <span className={'rolechip ' + session.role} style={{ marginLeft: 0, marginTop: 6, display: 'inline-block' }}>{window.t('role_' + session.role, lang)}</span>
        </div>
        {isOwner && <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--faint)', padding: '6px 10px 3px' }}>{en ? 'View as (demo)' : 'Προβολή ως (demo)'}</div>
          {['owner', 'manager', 'employee'].map(function (r) { return <div key={r} onClick={function () { onViewAs(r === 'owner' ? null : r); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13, background: role === r ? 'var(--paper)' : 'transparent' }}><span className={'rolechip ' + r} style={{ margin: 0 }}>{window.t('role_' + r, lang)}</span>{role === r && <Icon name="check" size={13} color="var(--green)" style={{ marginLeft: 'auto' }} />}</div>; })}
          <div style={{ borderTop: '1px solid var(--line)', margin: '5px 0' }}></div>
        </div>}
        <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--red)' }}><Icon name="logout" size={15} />{en ? 'Sign out' : 'Αποσύνδεση'}</div>
      </div>}
    </div>
  );
}

Object.assign(window, { LoginScreen, UserMenu, InstallButton });
