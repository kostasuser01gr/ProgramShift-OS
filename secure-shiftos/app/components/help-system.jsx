'use client';
import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {CONNECTIONS,GUIDE_STEPS,HELP_TOPICS,nextStep,searchHelp,sectionForTopic} from '../../lib/help-content.mjs';

export function HelpTip({topic,compact=false}) {
  const [pinned,setPinned]=useState(false);
  const id=useId();
  const entry=HELP_TOPICS[topic];
  const container=useRef(null);
  useEffect(()=>{
    if(!pinned)return;
    function outside(e){if(!container.current?.contains(e.target))setPinned(false);}
    function escape(e){if(e.key==='Escape')setPinned(false);}
    document.addEventListener('pointerdown',outside);
    document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[pinned]);
  if(!entry)return null;
  return <span ref={container} className={'helpAnchor '+(pinned?'helpPinned ':'')+(compact?'compact':'')}>
    <button className="helpDot" type="button" aria-label={`Βοήθεια: ${entry.title}`} aria-controls={id} aria-expanded={pinned} onClick={()=>setPinned(x=>!x)}>?</button>
    <span id={id} className="helpBubble" role="tooltip"><strong>{entry.title}</strong><span>{entry.short}</span><small>{entry.detail}</small>{entry.connects?.length>0&&<em>Συνδέεται με: {entry.connects.map(k=>HELP_TOPICS[k]?.title||k).join(' · ')}</em>}</span>
  </span>;
}

export function HelpHub({open,onClose,onNavigate,demo=false}) {
  const [panel,setPanel]=useState('guide');
  const [step,setStep]=useState(0);
  const [search,setSearch]=useState('');
  const [checked,setChecked]=useState({});
  const closeRef=useRef(null);
  const dialogRef=useRef(null);
  const results=useMemo(()=>searchHelp(search),[search]);
  useEffect(()=>{
    if(!open)return;
    const before=document.activeElement;
    const old=document.body.style.overflow;
    document.body.style.overflow='hidden';
    closeRef.current?.focus();
    function onKey(e){
      if(e.key==='Escape'){e.preventDefault();onClose();}
      if(e.key==='Tab'){
        const nodes=[...dialogRef.current?.querySelectorAll('button:not([disabled]),input:not([disabled])')||[]].filter(el=>el.offsetParent!==null);
        if(!nodes.length)return;
        const first=nodes[0],last=nodes.at(-1);
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    }
    document.addEventListener('keydown',onKey);
    return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow=old;before?.focus?.();};
  },[open,onClose]);
  if(!open)return null;
  const current=GUIDE_STEPS[step];
  const topic=HELP_TOPICS[current.topic];
  function navigate(section){onNavigate?.(section);onClose();}
  return <div className="helpBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section className="helpDialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="help-dialog-title">
      <header className="helpDialogHeader"><span className="helpLogo">?</span><div><span className="eyebrow">SHIFTOS · ΕΛΛΗΝΙΚΗ ΒΟΗΘΕΙΑ</span><h2 id="help-dialog-title">Οδηγός λειτουργίας</h2><p>Επεξήγηση κάθε εργαλείου και των συνδέσεων μεταξύ τους.</p></div><button ref={closeRef} className="helpClose" type="button" onClick={onClose} aria-label="Κλείσιμο οδηγού">×</button></header>
      <nav className="helpTabs" aria-label="Περιεχόμενα οδηγού">
        {[['guide','Ξενάγηση'],['glossary','Όροι A–Ω'],['connections','Πώς συνδέονται'],['shortcuts','Συντομεύσεις']].map(([key,label])=><button key={key} type="button" className={panel===key?'selected':''} aria-current={panel===key?'page':undefined} onClick={()=>setPanel(key)}>{label}</button>)}
      </nav>
      <div className="helpDialogBody">
      {panel==='guide'&&<div className="tourBody">
        <div className="tourTop"><span>Βήμα {step+1} από {GUIDE_STEPS.length}</span><span>{Math.round((step+1)/GUIDE_STEPS.length*100)}% του οδηγού</span></div>
        <div className="tourProgress" role="progressbar" aria-label="Πρόοδος tutorial" aria-valuemin="1" aria-valuemax={GUIDE_STEPS.length} aria-valuenow={step+1}><span style={{width:`${(step+1)/GUIDE_STEPS.length*100}%`}}/></div>
        <div className="tourContent"><div className="tourStepBadge">{String(step+1).padStart(2,'0')}</div><div><span className="eyebrow">{topic.title}</span><h3>{current.title}</h3><p>{current.text}</p><div className="tourTask">✓ {current.task}</div><button className="tourAction" onClick={()=>navigate(current.section)}>Άνοιγμα σχετικής ενότητας ↗</button></div></div>
        <div className="tourBottom"><button type="button" className="softButton" disabled={step===0} onClick={()=>setStep(x=>nextStep(x,-1))}>← Προηγούμενο</button><div className="tourDots" aria-label="Βήματα του οδηγού">{GUIDE_STEPS.map((x,i)=><button key={x.id} type="button" aria-label={`Βήμα ${i+1}: ${x.title}`} aria-current={i===step?'step':undefined} className={i===step?'active':''} onClick={()=>setStep(i)}/>)}</div><button type="button" className="primary" onClick={()=>setStep(x=>x===GUIDE_STEPS.length-1?0:nextStep(x,1))}>{step===GUIDE_STEPS.length-1?'Από την αρχή ↺':'Επόμενο →'}</button></div>
      </div>}
      {panel==='glossary'&&<div className="glossaryBody"><label className="helpSearch">⌕ <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Αναζήτηση όρων, κωδικών, CHECK..." aria-label="Αναζήτηση στην ελληνική βοήθεια"/></label><div className="helpResults" aria-live="polite">{results.length===0?<p>Δεν βρέθηκαν όροι. Δοκίμασε διαφορετική λέξη.</p>:results.map(([key,t])=><article key={key} className="glossaryCard"><div><h3>{t.title}</h3><p>{t.detail}</p><small>Σύνδεση: {t.connects.map(k=>HELP_TOPICS[k]?.title||k).join(' → ')||'—'}</small></div><button type="button" className="helpJump" onClick={()=>navigate(sectionForTopic(key))}>Άνοιγμα ↗</button></article>)}</div></div>}
      {panel==='connections'&&<div className="connectBody"><div className="connectionsIntro"><h3>Από μία βάρδια έως το κρυπτογραφημένο Excel</h3><p>Οι ίδιες εγγραφές τροφοδοτούν το πρόγραμμα, την κάλυψη και τους ελέγχους. Η δημοσίευση είναι ξεχωριστή ενέργεια και η πρόσβαση καθορίζεται από τη σύνδεση χρήστη.</p></div><div className="connectionNodes">{CONNECTIONS.map((node,i)=><div className="connectionFlowItem" key={node.id}><button onClick={()=>navigate(node.id)}><b>{String(i+1).padStart(2,'0')}</b><span><strong>{node.label}</strong><small>{node.desc}</small></span><span>↗</span></button>{i<CONNECTIONS.length-1&&<div className="connectionArrow" aria-hidden="true">↓</div>}</div>)}</div><div className="connectionGuard">🔒 <span><strong>Ανεξάρτητο επίπεδο πρόσβασης:</strong> Microsoft Entra ID + δικαιώματα SharePoint. Το PUBLISHED δεν σημαίνει δημόσια προβολή.{demo?' Στο demo όλες οι ενέργειες είναι προσωρινές.':''}</span></div></div>}
      {panel==='shortcuts'&&<div className="shortcutBody"><h3>Μικρές κινήσεις, ταχύτερη διαχείριση</h3><div className="shortcutGrid">{[['?','Άνοιγμα αυτού του οδηγού'],['⌘K / Ctrl+K','Γρήγορες εντολές στο demo · αναζήτηση στο διαχειριστικό'],['/','Μετάβαση στην αναζήτηση βαρδιών'],['ESC','Κλείσιμο διαλόγου ή βοήθειας'],['Tab / Shift+Tab','Πλοήγηση χωρίς ποντίκι'],['Enter','Ενεργοποίηση επιλεγμένου κουμπιού']].map(([k,v])=><div className="shortcutItem" key={k}><kbd>{k}</kbd><span>{v}</span></div>)}</div><div className="helpChecklist"><h4>Checklist εκμάθησης (προσωρινό)</h4>{[['period','Βρήκα τον μήνα'],['edit','Ξέρω πώς επιλέγω κωδικό'],['checks','Εντόπισα τις προειδοποιήσεις'],['release','Κατάλαβα την έγκριση'],['backup','Κατάλαβα το ασφαλές backup']].map(([key,label])=><label key={key}><input type="checkbox" checked={!!checked[key]} onChange={e=>setChecked(x=>({...x,[key]:e.target.checked}))}/>{label}</label>)}<p>Η λίστα δεν αποθηκεύεται στον server και δεν αλλάζει δικαιώματα.</p></div></div>}
      </div>
      <footer className="helpDialogFooter"><span>ⓘ Τα μικρά «?» ανοίγουν εξήγηση με hover, κλικ ή πληκτρολόγιο.</span><button className="softButton" onClick={onClose}>Ολοκλήρωση</button></footer>
    </section>
  </div>;
}
