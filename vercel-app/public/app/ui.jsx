/* app/ui.jsx — shared primitives + icon set */

/* ---- icon set (stroke, 1.7) ---- */
function Icon({ name, size = 18, color = 'currentColor', style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  const G = {
    home:    <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>,
    calendar:<g><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v3M16 3v3"/></g>,
    users:   <g><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6a3 3 0 0 1 0 6M16.5 20a5.5 5.5 0 0 0-2-4"/></g>,
    swap:    <path d="M7 7h11l-3-3M17 17H6l3 3"/>,
    bell:    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M9.5 19a2.5 2.5 0 0 0 5 0"/>,
    user:    <g><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></g>,
    grid:    <g><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></g>,
    chart:   <path d="M4 20V4M4 20h16M8 20v-6M12 20v-10M16 20v-4"/>,
    warning: <g><path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17.5v.2"/></g>,
    check:   <path d="M4 12.5 9 17.5 20 6.5"/>,
    settings:<g><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/></g>,
    plus:    <path d="M12 5v14M5 12h14"/>,
    search:  <g><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></g>,
    chevron: <path d="M9 6l6 6-6 6"/>,
    arrow:   <path d="M5 12h14M13 6l6 6-6 6"/>,
    pdf:     <g><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></g>,
    clock:   <g><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></g>,
    moon:    <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>,
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>,
    cal2:    <g><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18"/></g>,
    publish: <path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>,
    upload:  <path d="M12 15V4M8 8l4-4 4 4M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/>,
    x:       <path d="M6 6l12 12M18 6 6 18"/>,
    logout:  <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 12h9M16 8l3 4-3 4"/>,
    shield:  <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>,
    trending:<g><path d="M3 16l5-5 4 4 9-9"/><path d="M15 6h6v6"/></g>,
    badge:   <g><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></g>,
    zap:     <path d="M13 2 4 14h6l-1 8 9-12h-6z"/>,
    message: <path d="M21 11.5a7.5 7.5 0 0 1-10.5 6.86L4 20l1.64-4.9A7.5 7.5 0 1 1 21 11.5z"/>,
    checklist:<g><path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 10M4 18l1.5 1.5L8 16"/><path d="M12 6h8M12 12h8M12 18h6"/></g>,
    note:    <g><path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4M8 13h8M8 17h5"/></g>,
    pulse:   <path d="M3 12h4l2-6 4 12 2-6h6"/>,
    folder:  <path d="M3 7a1 1 0 0 1 1-1h4.5l2 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>,
    clipboard:<g><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 12h6M9 16h4"/></g>,
    idcard:  <g><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5.5 16a2.7 2.7 0 0 1 5 0M14 10h4M14 13.5h3"/></g>,
    lifebuoy:<g><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9"/></g>,
    sunrise: <g><path d="M3 18h18M12 4v3M5.5 10 4 8.5M18.5 10 20 8.5"/><path d="M7.5 18a4.5 4.5 0 0 1 9 0"/></g>,
    building:<g><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/></g>,
    lock:    <g><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></g>,
    tag:     <g><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.4"/></g>,
  };
  return <svg {...p}>{G[name] || null}</svg>;
}

/* ---- shift chip ---- */
function ShiftChip({ value, size, block, mini, className = '' }) {
  const D = window.APP_DATA;
  const c = D.catOf(value);
  const cls = mini ? 'minichip' : ('chip' + (size === 'lg' ? ' lg' : '') + (block ? ' block' : ''));
  const short = value === 'ΡΕΠΟ' ? 'ΡΕΠΟ' : value;
  return <span className={cls + ' ' + className}
    style={{ background: c.bg, borderColor: c.bd, color: c.fg }}>{short}</span>;
}

/* ---- segmented control ---- */
function Segmented({ options, value, onChange, small }) {
  return (
    <div className={'seg' + (small ? ' small' : '')}>
      {options.map(o => (
        <button key={o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

/* ---- toggle ---- */
function Toggle({ on, onClick }) {
  return <button className={'toggle' + (on ? ' on' : '')} onClick={onClick} aria-pressed={on}></button>;
}

Object.assign(window, { Icon, ShiftChip, Segmented, Toggle });
