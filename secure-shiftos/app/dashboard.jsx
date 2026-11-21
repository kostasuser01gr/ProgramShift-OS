'use client';
import {useEffect,useMemo,useState} from 'react';
import {signOut} from 'next-auth/react';
const localMonth=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');};
const dateList=m=>Array.from({length:new Date(+m.slice(0,4),+m.slice(5),0).getDate()},(_,i)=>m+'-'+String(i+1).padStart(2,'0'));
function previous(m,offset){const d=new Date(+m.slice(0,4),+m.slice(5)-1+offset,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
export default function Dashboard({displayName,role}){
  const [month,setMonth]=useState(localMonth);
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[err,setErr]=useState('');
  const [tab,setTab]=useState('grid'),[busy,setBusy]=useState(''),[editing,setEditing]=useState(null);
  const [password,setPassword]=useState('');
  const period=data?.period;
  const editable=period?.status==='DRAFT'||period?.status==='REVIEW';
  const days=useMemo(()=>dateList(month),[month]);
  async function reload(quiet=false){
    if(!quiet){setLoading(true);setData(null);}
    try{const r=await fetch('/api/roster?month='+encodeURIComponent(month),{cache:'no-store'});
      if(r.status===401){setErr('Η περίοδος σύνδεσης έληξε. Συνδέσου ξανά.');setData(null);return;}
      if(!r.ok)throw new Error('Δεν ήταν δυνατή η ανάκτηση του ιδιωτικού προγράμματος.');
      setData(await r.json());setErr('');
    }catch(e){setErr(e.message);if(!quiet)setData(null);}finally{setLoading(false);}
  }
  useEffect(()=>{reload();const id=setInterval(()=>reload(true),20000);return()=>clearInterval(id);},[month]);
  const shifts=useMemo(()=>new Map((data?.shifts||[]).map(s=>[s.employeeKey+'|'+s.date,s])),[data]);
  async function save(){
    if(!editing)return;
    setBusy('save');
    try{const r=await fetch('/api/roster',{method:editing.id?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(editing.id?{id:editing.id,etag:editing.etag,code:editing.code}:{employeeKey:editing.employeeKey,date:editing.date,code:editing.code})});
      if(r.status===409){setEditing(null);await reload();throw new Error('Σύγκρουση αλλαγών: κάποιος συνάδελφος πρόλαβε να αποθηκεύσει. Έγινε ανανέωση.');}
      if(!r.ok)throw new Error('Η αλλαγή δεν αποθηκεύτηκε.');
      setEditing(null);await reload();
    }catch(e){setErr(e.message);}finally{setBusy('');}
  }
  async function setPeriodStatus(next){
    if(!period?.etag||role!=='manager')return;
    if(next==='PUBLISHED'&&!window.confirm('Επιβεβαιώνεις ότι έχεις ελέγξει το πρόγραμμα και τις εκκρεμότητες;'))return;
    setBusy('period');
    try{const r=await fetch('/api/period',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({month,next,etag:period.etag,reviewed:next==='PUBLISHED'})});
      if(!r.ok)throw new Error('Η αλλαγή κατάστασης δεν επιτράπηκε. Έλεγξε τις εκκρεμότητες.');
      await reload();
    }catch(e){setErr(e.message);}finally{setBusy('');}
  }
  async function backup(){
    if(password.length<16){setErr('Ο κωδικός backup πρέπει να έχει τουλάχιστον 16 χαρακτήρες.');return;}
    setBusy('backup');
    try{const r=await fetch('/api/backup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({month,password})});
      if(!r.ok)throw new Error('Η δημιουργία backup απέτυχε.');
      const blob=await r.blob(),url=URL.createObjectURL(blob);const a=document.createElement('a');
      a.href=url;a.download=`EUROPCAR_${month}.xlsx.enc`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      setPassword('');setErr('');
    }catch(e){setErr(e.message);}finally{setBusy('');}
  }
  return <div className="appShell">
    <aside className="sidePanel"><div className="brand"><div className="brandIcon">E</div><div><strong>ShiftOS</strong><small>EUROPCAR · PRIVATE</small></div></div>
      <p className="navLabel">WORKSPACE</p>
      {[["grid","▦","Πρόγραμμα"],["checks","⚑","Έλεγχοι CHECK"],["backup","⬡","Αντίγραφα Excel"]].map(([key,ico,label])=><button key={key} className={'navButton '+(tab===key?'active':'')} onClick={()=>setTab(key)}><span>{ico}</span>{label}</button>)}
      <div className="sideBottom"><div className="userAvatar">{displayName.slice(0,1).toUpperCase()}</div><div className="userText"><strong>{displayName}</strong><small>{role==='manager'?'Manager':'Editor'}</small></div><button className="logout" onClick={()=>signOut({callbackUrl:'/login'})} title="Αποσύνδεση">↗</button></div>
    </aside>
    <main className="workspace">
      <header className="topbar"><div><span className="eyebrow">OPERATIONS CONTROL CENTER</span><h1>{tab==='grid'?'Πρόγραμμα Βαρδιών':tab==='checks'?'Έλεγχοι Βαρδιών':'Κρυπτογραφημένα Backups'}</h1></div><span className="privateBadge">● PRIVATE · ENTRA ID</span></header>
      <div className="toolbar"><button className="iconButton" onClick={()=>setMonth(previous(month,-1))}>‹</button><span className="monthLabel">{new Date(month+'-01T12:00:00').toLocaleDateString('el-GR',{month:'long',year:'numeric'})}</span><button className="iconButton" onClick={()=>setMonth(previous(month,1))}>›</button><button className="softButton" onClick={()=>reload()}>↻ Ανανέωση</button><div className="spacer"/><span className="helpText">Αυτόματος συγχρονισμός ανά 20″</span></div>
      {err&&<div className="alert" role="alert">{err}<button onClick={()=>setErr('')}>×</button></div>}
      {loading&&<p className="loader">Ανάκτηση από ιδιωτικό SharePoint…</p>}
      {!loading&&data&&<>
        <section className="metrics"><div className="metric"><small>ΕΡΓΑΖΟΜΕΝΟΙ</small><strong>{data.employees.length}</strong></div><div className="metric"><small>ΚΑΤΑΧΩΡΙΣΜΕΝΕΣ ΒΑΡΔΙΕΣ</small><strong>{data.shifts.filter(x=>x.code).length}</strong></div><div className="metric"><small>ΕΚΚΡΕΜΟΤΗΤΕΣ CHECK</small><strong>{data.warnings.length}</strong></div><div className="metric"><small>ΚΑΤΑΣΤΑΣΗ</small><strong className="statusText">{period?.status||'UNCONFIGURED'}</strong></div></section>
        {tab==='grid'&&<section className="gridSection"><div className="sectionTitle"><h2>Μηνιαίο πρόγραμμα</h2><span>Επίλεξε υπάρχουσα βάρδια για επεξεργασία · Οι αλλαγές ελέγχονται για συγκρούσεις</span></div>
          {role==='manager'&&period?.etag&&<div className="periodActions">
            <strong>Διαχείριση έκδοσης:</strong> <span>{period.status}</span>
            {({DRAFT:'REVIEW',REVIEW:'PUBLISHED',PUBLISHED:'LOCKED',LOCKED:'DRAFT'})[period.status]&&<button className="softButton" disabled={!!busy} onClick={()=>setPeriodStatus(({DRAFT:'REVIEW',REVIEW:'PUBLISHED',PUBLISHED:'LOCKED',LOCKED:'DRAFT'})[period.status])}>Αλλαγή κατάστασης</button>}
          </div>}
          {period?.status==='UNCONFIGURED'&&<p className="alert">Δεν έχει δημιουργηθεί εγκεκριμένη περίοδος στο SharePoint. Η επεξεργασία παραμένει απενεργοποιημένη.</p>}
          <div className="tableScroll"><table className="roster"><thead><tr><th className="stickyName">ΕΡΓΑΖΟΜΕΝΟΣ</th>{days.map(d=><th key={d} className={[0,6].includes(new Date(d+'T12:00:00').getDay())?'weekend':''}>{Number(d.slice(-2))}<small>{new Date(d+'T12:00:00').toLocaleDateString('el-GR',{weekday:'short'})}</small></th>)}</tr></thead><tbody>
            {data.employees.map(employee=><tr key={employee.key}><th className="stickyName"><div>{employee.name}</div><small>{employee.key}</small></th>{days.map(day=>{const s=shifts.get(employee.key+'|'+day),code=s?.code||'';return <td key={day}><button className={'shiftCell '+(code==='R'?'rest':code==='217'?'night':code?'assigned':'empty')} disabled={!editable} title={s?'Επεξεργασία '+employee.name:'Νέα βάρδια'} onClick={()=>setEditing(s?{...s,name:employee.name,code}:{employeeKey:employee.key,date:day,name:employee.name,code:''})}>{code||'·'}</button></td>})}</tr>)}
          </tbody></table></div>
          {!data.employees.length&&<p className="emptyState">Δεν υπάρχουν εγκεκριμένα δεδομένα σε αυτή την περίοδο. Η εισαγωγή πραγματικών δεδομένων γίνεται μόνο μετά την ασφαλή παραμετροποίηση της εταιρικής βιβλιοθήκης.</p>}
        </section>}
        {tab==='checks'&&<section className="sectionCard"><div className="sectionTitle"><h2>Προειδοποιήσεις βαρδιών</h2><span>Ανασκόπηση, όχι αυτόματη νομική πιστοποίηση</span></div>{data.warnings.length?data.warnings.map((w,i)=><div className="warningRow" key={i}><span>!</span><strong>{w.employee}</strong><span>{w.date}</span><p>{w.message}</p></div>):<p className="emptyState">Δεν εντοπίστηκαν προειδοποιήσεις στο διαθέσιμο πρόγραμμα.</p>}</section>}
        {tab==='backup'&&<section className="sectionCard backupCard"><h2>Ασφαλές αντίγραφο Excel</h2><p>Εξαγωγή σε <code>.xlsx.enc</code> με AES-256-GCM. Ο κωδικός δεν αποθηκεύεται στην εφαρμογή και απαιτείται για την επαναφορά.</p><label htmlFor="backup-pass">Κωδικός επιλογής προϊσταμένων (τουλάχιστον 16 χαρακτήρες)</label><input id="backup-pass" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} maxLength={256}/><button className="primary" onClick={backup} disabled={busy==='backup'||role!=='manager'}>{busy==='backup'?'Δημιουργία…':'Λήψη κρυπτογραφημένου Excel'}</button><p className="fine">Η εξαγωγή δεν αποτελεί αυτόματο backup: η διατήρηση σε ιδιωτικό εταιρικό SharePoint θα πρέπει να ρυθμιστεί από το IT.</p><p className="fine">Μην αποθηκεύετε κωδικούς στον κοινόχρηστο υπολογιστή. Η αποκρυπτογράφηση γίνεται εκτός browser με το συνοδευτικό εργαλείο επαναφοράς.</p></section>}
      </>}
    </main>
    {editing&&<div className="overlay" role="dialog" aria-modal="true"><div className="modal"><h2>Αλλαγή βάρδιας</h2><p>{editing.name} · {editing.date}</p><label>Κωδικός βάρδιας</label><select value={editing.code} onChange={e=>setEditing(x=>({...x,code:e.target.value}))}><option value="">Κενό</option>{Object.entries(data?.codes||{}).map(([c,h])=><option key={c} value={c}>{c} — {h}</option>)}</select><div className="modalActions"><button className="softButton" onClick={()=>setEditing(null)}>Άκυρο</button><button className="primary" disabled={Boolean(busy)} onClick={save}>{busy?'Αποθήκευση…':'Αποθήκευση'}</button></div></div></div>}
  </div>;
}
