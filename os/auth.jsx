/* ============================================================================
 *  os/auth.jsx — user menu, PWA install button.
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
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--faint)', padding: '6px 10px 3px' }}>{en ? 'View as' : 'Προβολή ως'}</div>
          {['owner', 'manager', 'employee'].map(function (r) { return <div key={r} onClick={function () { onViewAs(r === 'owner' ? null : r); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13, background: role === r ? 'var(--paper)' : 'transparent' }}><span className={'rolechip ' + r} style={{ margin: 0 }}>{window.t('role_' + r, lang)}</span>{role === r && <Icon name="check" size={13} color="var(--green)" style={{ marginLeft: 'auto' }} />}</div>; })}
          <div style={{ borderTop: '1px solid var(--line)', margin: '5px 0' }}></div>
        </div>}
        <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--red)' }}><Icon name="logout" size={15} />{en ? 'Sign out' : 'Αποσύνδεση'}</div>
      </div>}
    </div>
  );
}

Object.assign(window, { UserMenu, InstallButton });
