'use client';
import {useMemo,useState} from 'react';
const labels=['Υποθετικός Α','Υποθετικός Β','Υποθετικός Γ','Υποθετικός Δ','Υποθετικός Ε','Υποθετικός ΣΤ'];
const shifts=['203','301','217','R','402','213'];
const fmt=d=>d.toISOString().slice(0,10);
const now=new Date(Date.UTC(2026,10,1));
const initial=labels.map((_,i)=>Array.from({length:30},(_,d)=>shifts[(i+d)%shifts.length]));
export default function SyntheticDemo(){
  const [draft,setDraft]=useState(initial),[view,setView]=useState('schedule');
  const [editing,setEditing]=useState(null),[state,setState]=useState('DRAFT');
  const [message,setMessage]=useState('');
  const days=Array.from({length:30},(_,i)=>fmt(new Date(now.getTime()+i*86400000)));
  const sum=useMemo(()=>draft.flat().reduce((o,c)=>({...o,[c]:(o[c]||0)+1}),{}),[draft]);
  const locked=state==='PUBLISHED'||state==='LOCKED';
  const next={DRAFT:'REVIEW',REVIEW:'PUBLISHED',PUBLISHED:'LOCKED',LOCKED:'DRAFT'}[state];
  return <div className="appShell">
    <aside className="sidePanel">
      <div className="brand"><div className="brandIcon">E</div><div><strong>ShiftOS</strong><small>SYNTHETIC PILOT</small></div></div>
      <p className="navLabel">DEMONSTRATION</p>
      {[['schedule','▦','Πρόγραμμα'],['checks','⚑','Έλεγχοι'],['publish','◉','Εγκρίσεις'],['backup','⬡','Backups']].map(([id,icon,title])=><button key={id} className={'navButton '+(view===id?'active':'')} onClick={()=>setView(id)}><span>{icon}</span>{title}</button>)}
      <div className="sideBottom"><div className="userAvatar">D</div><div className="userText"><strong>Demo supervisor</strong><small>Χωρίς εταιρικά δεδομένα</small></div></div>
    </aside>
    <main className="workspace">
      <header className="topbar"><div><span className="eyebrow">PRIVATE OPERATIONS · UI TEST</span><h1>{view==='schedule'?'Πρόγραμμα Βαρδιών':view==='checks'?'Έλεγχοι CHECK':view==='publish'?'Έγκριση προγράμματος':'Κρυπτογραφημένα Backups'}</h1></div><span className="privateBadge">● SYNTHETIC ONLY</span></header>
      <div className="toolbar"><span className="monthLabel">Νοέμβριος 2026</span><span className="helpText">Αλλαγές μόνο στη μνήμη του browser</span><div className="spacer"/><strong>{state}</strong></div>
      {message&&<div className="alert" role="status">{message}<button onClick={()=>setMessage('')}>×</button></div>}
      <section className="metrics"><div className="metric"><small>ΥΠΟΘΕΤΙΚΟΙ ΕΡΓΑΖΟΜΕΝΟΙ</small><strong>{labels.length}</strong></div><div className="metric"><small>ΕΓΓΡΑΦΕΣ</small><strong>{draft.flat().length}</strong></div><div className="metric"><small>ΡΕΠΟ</small><strong>{sum.R||0}</strong></div><div className="metric"><small>ΚΑΤΑΣΤΑΣΗ</small><strong className="statusText">{state}</strong></div></section>
      {view==='schedule'&&<section className="gridSection"><div className="sectionTitle"><h2>Δοκιμαστική προεπισκόπηση</h2><span>Επίλεξε βάρδια για επεξεργασία · καμία αλλαγή δεν αποθηκεύεται</span></div>
        <div className="tableScroll"><table className="roster"><thead><tr><th className="stickyName">ΕΡΓΑΖΟΜΕΝΟΣ</th>{days.map((date,i)=><th key={date}>{i+1}<small>{new Date(date+'T12:00:00Z').toLocaleDateString('el-GR',{weekday:'short'})}</small></th>)}</tr></thead><tbody>{labels.map((label,i)=><tr key={label}><th className="stickyName">{label}<small>DEMO-{i+1}</small></th>{days.map((date,j)=><td key={date}><button disabled={locked} className={'shiftCell '+(draft[i][j]==='R'?'rest':draft[i][j]==='217'?'night':'assigned')} onClick={()=>setEditing({i,j,code:draft[i][j]})}>{draft[i][j]}</button></td>)}</tr>)}</tbody></table></div></section>}
      {view==='checks'&&<section className="sectionCard"><h2>Προεπισκόπηση CHECK</h2><p>Σε παραγωγή οι έλεγχοι 11ωρης και 35ωρης ανάπαυσης θα υπολογίζονται στο backend από τα εγκεκριμένα δεδομένα. Η παρούσα σελίδα περιέχει μόνο συνθετικές εγγραφές.</p></section>}
      {view==='publish'&&<section className="sectionCard"><h2>Κύκλος έγκρισης</h2><p>Προσομοίωση καταστάσεων. Δεν υπάρχουν πραγματικές εγκρίσεις ή δικαιώματα Microsoft 365.</p><div className="periodActions"><strong>{state}</strong><button className="primary" onClick={()=>{setState(next);setMessage(`Προσομοίωση αλλαγής σε ${next}. Καμία αλλαγή στο SharePoint.`)}}>Μετάβαση σε {next}</button></div></section>}
      {view==='backup'&&<section className="sectionCard"><h2>Excel backup</h2><p>Στην παραγωγή, οι προϊστάμενοι λαμβάνουν αρχείο XLSX κρυπτογραφημένο με AES-256-GCM. Στο demo δεν υπάρχει πρόσβαση σε εταιρικά δεδομένα ή δυνατότητα λήψης.</p></section>}
    </main>
    {editing&&<div className="overlay" role="dialog" aria-modal="true"><div className="modal"><h2>Επεξεργασία συνθετικής βάρδιας</h2><p>{labels[editing.i]} · {days[editing.j]}</p><select value={editing.code} onChange={e=>setEditing({...editing,code:e.target.value})}>{shifts.map(s=><option key={s} value={s}>{s}</option>)}</select><div className="modalActions"><button className="softButton" onClick={()=>setEditing(null)}>Άκυρο</button><button className="primary" onClick={()=>{setDraft(prev=>prev.map((row,i)=>i===editing.i?row.map((code,j)=>j===editing.j?editing.code:code):row));setEditing(null);}}>Αποθήκευση demo</button></div></div></div>}
  </div>;
}
