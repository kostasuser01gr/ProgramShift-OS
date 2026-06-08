/* app/owner.jsx — owner settings (rendered inside the manager shell) */
const { useState: useStateO } = React;

function OwnerSettings({ D, T, lang }) {
  const [rest, setRest] = useStateO(D.RULES.minRest);
  const [nights, setNights] = useStateO(D.RULES.maxNights);
  const [work, setWork] = useStateO(D.RULES.maxWork);
  const [min, setMin] = useStateO(D.STAFF.min);
  const [max, setMax] = useStateO(D.STAFF.max);
  const [backup, setBackup] = useStateO(true);
  const [reshare, setReshare] = useStateO(false);

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="settwo">
        <div className="panelc">
          <h3>{T('set_thresholds')}</h3>
          <Slide label={T('set_rest')} v={rest} set={setRest} min={8} max={16} suffix="h" />
          <Slide label={T('set_nights')} v={nights} set={setNights} min={2} max={7} />
          <Slide label={T('set_work')} v={work} set={setWork} min={4} max={10} />
        </div>
        <div className="panelc">
          <h3>{T('set_staff')}</h3>
          <Slide label={T('set_min')} v={min} set={setMin} min={6} max={20} />
          <Slide label={T('set_max')} v={max} set={setMax} min={16} max={32} />
          <div style={{ background: 'var(--green-soft)', border: '1px solid #bcd3b6', borderRadius: 11, padding: '12px 14px', marginTop: 14, fontSize: 13, color: 'var(--green)' }}>
            <Icon name="check" size={15} style={{ verticalAlign: -2, marginRight: 7 }} />
            {lang === 'en' ? 'Coverage flags days outside ' : 'Η κάλυψη επισημαίνει ημέρες εκτός '}{min}–{max}.
          </div>
        </div>
      </div>

      <div className="settwo" style={{ marginTop: 16 }}>
        <div className="panelc">
          <h3>{T('set_sharing')}</h3>
          <div className="setrow" style={{ marginBottom: 0 }}><div><div className="t">{T('set_link')}</div><div className="s">{lang === 'en' ? 'Everyone else = view only' : 'Όλοι οι άλλοι = μόνο προβολή'}</div></div><div className="right"><span className="rolechip employee">{T('approved')}</span></div></div>
          <div className="setrow" style={{ marginBottom: 0, marginTop: 8 }}><div><div className="t">{lang === 'en' ? 'Editors can re-share' : 'Επανα-κοινοποίηση από editors'}</div><div className="s">{lang === 'en' ? 'Advanced Drive service' : 'Advanced Drive service'}</div></div><div className="right"><Toggle on={reshare} onClick={() => setReshare(!reshare)} /></div></div>
        </div>
        <div className="panelc">
          <h3>{T('set_automation')}</h3>
          <div className="setrow" style={{ marginBottom: 8 }}><div><div className="t">{T('set_backup')}</div><div className="s">{lang === 'en' ? 'Daily 02:00 · keep 30 days' : 'Καθημερινά 02:00 · 30 ημέρες'}</div></div><div className="right"><Toggle on={backup} onClick={() => setBackup(!backup)} /></div></div>
          <button className="mbtn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.__addMonth && window.__addMonth()}><Icon name="calendar" size={15} />{T('duplicate_mo')}</button>
        </div>
      </div>
    </div>
  );
}

function Slide({ label, v, set, min, max, suffix }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 7 }}><span>{label}</span></div>
      <div className="slider">
        <input type="range" min={min} max={max} value={v} onChange={e => set(+e.target.value)} />
        <span className="val">{v}{suffix || ''}</span>
      </div>
    </div>
  );
}

Object.assign(window, { OwnerSettings });
