'use client';
import {useMemo,useState} from 'react';
import {decisionInbox} from '../../lib/decision-inbox.mjs';
import {executeGateway,toolCatalog} from '../../lib/gateway/core.mjs';
import {rosterInsights} from '../../lib/insights.mjs';

const TASK_GROUPS=[
 {id:'attention',label:'Χρειάζεται ενέργεια',description:'Σημεία που απαιτούν έλεγχο'},
 {id:'review',label:'Στο στάδιο ελέγχου',description:'Ανθρώπινη απόφαση'},
 {id:'guide',label:'Πληροφορίες',description:'Συστάσεις και επόμενα βήματα'},
];
const ICONS={'roster.read':'▦','coverage.analyze':'▥','coverage.simulate':'◷','shift.propose':'↗','approval.request':'✓','manual.search':'⌕','audit.history':'≡'};
function goRoute(route){return route==='schedule'?'grid':route;}
function Summary({result}){
 if(!result)return <p className="ghEmpty">Επίλεξε εργαλείο και πάτησε «Ανάλυση» για να εμφανιστεί αποτέλεσμα.</p>;
 const d=result.data;
 if(!result.ok)return <p role="alert" className="ghError">{result.error||'Δεν ήταν δυνατή η ανάλυση.'}</p>;
 if(result.tool==='roster.read')return <div className="ghSummaryGrid">{[['Εργαζόμενοι',d.employees],['Βάρδιες',d.assigned],['Κενά',d.missing],['CHECK κωδικών',d.invalid]].map(([name,value])=><div key={name}><small>{name}</small><strong>{value}</strong></div>)}</div>;
 if(result.tool==='coverage.analyze')return <><p className="ghResultLead">{d.days.length} ημέρες · {d.missing} κενά · {d.warnings} προειδοποιήσεις</p><div className="ghMiniDays">{d.days.slice(0,31).map(day=><span key={day.date} title={`${day.date}: ${day.total} βάρδιες`}>{day.date.slice(-2)}<strong>{day.total}</strong></span>)}</div></>;
 if(result.tool==='coverage.simulate')return <><p className="ghResultLead">Ενδεικτικό σενάριο — {d.attentionWindows} ζώνες προσοχής</p>{d.windows.map(w=><div className="ghLine" key={w.id}><span>{w.label}</span><strong>{w.gapMinutes} λεπτά πιθανού κενού</strong></div>)}</>;
 if(result.tool==='shift.propose')return <><p className="ghResultLead">{d.proposed?'Πρόταση έτοιμη για ανθρώπινο έλεγχο':'Δεν δημιουργήθηκε πρόταση'}</p>{d.proposed&&<div className="ghLine"><span>{d.currentCode||'Κενό'} → {d.proposedCode||'Κενό'}</span><strong>CHECK {d.warningCountBefore} → {d.warningCountAfter}</strong></div>}<p>Δεν αποθηκεύτηκε κάποια αλλαγή.</p></>;
 if(result.tool==='approval.request')return <><p className="ghResultLead">{d.issues.length} στοιχεία προς εξέταση</p>{d.issues.map(x=><div className="ghLine" key={x.id}><span>{x.title}</span><small>{x.description}</small></div>)}<p>Δεν στάλθηκε αίτημα έγκρισης.</p></>;
 if(result.tool==='manual.search')return d.available?<>{d.results.length===0?<p>Δεν βρέθηκε αντίστοιχη εκπαιδευτική οδηγία.</p>:d.results.map(x=><div className="ghManual" key={x.id}><strong>{x.title}</strong><p>{x.body}</p><small>{x.source}</small></div>)}</>:<p>Δεν υπάρχει εγκεκριμένο εταιρικό Operations Manual σε αυτή τη σύνδεση.</p>;
 if(result.tool==='audit.history')return d.available?<>{d.events.length?d.events.map((x,i)=><div className="ghLine" key={i}><span>{x.time}</span><small>{x.text}</small></div>):<p>Δεν καταγράφηκαν προσωρινές ενέργειες στη συνεδρία.</p>}</>:<p>Το πραγματικό ιστορικό απαιτεί εγκεκριμένη εταιρική αποθήκη audit.</p>;
 return <p>Το αποτέλεσμα δεν έχει διαθέσιμη συνοπτική προβολή.</p>;
}

/** Enterprise-mode actions call the protected read-only HTTP gateway.
 * Demo-mode actions execute the same deterministic kernel against synthetic state.
 */
export default function IntegrationHub({month,employees=[],shifts=[],status='UNCONFIGURED',role='editor',demo=false,events=[],onNavigate}){
 const [pane,setPane]=useState('board');
 const [selected,setSelected]=useState('roster.read');
 const [day,setDay]=useState(month+'-01');
 const [employee,setEmployee]=useState(employees[0]?.key||'');
 const [code,setCode]=useState('203');
 const [query,setQuery]=useState('πρόγραμμα');
 const [pickups,setPickups]=useState(50),[returns,setReturns]=useState(35);
 const [busy,setBusy]=useState(false),[result,setResult]=useState(null);
 const insight=useMemo(()=>rosterInsights(month,employees,shifts),[month,employees,shifts]);
 const tasks=useMemo(()=>decisionInbox({missing:insight.missing,invalid:insight.invalid,warnings:insight.warnings.length,status}),[insight,status]);
 const tools=toolCatalog();
 const propsFor=()=>({month,...(['coverage.analyze','coverage.simulate','shift.propose'].includes(selected)?{date:day.startsWith(month+'-')?day:month+'-01'}:{}),...(selected==='coverage.simulate'?{scenario:{pickups,returns}}:{}),...(selected==='shift.propose'?{employeeKey:employees.some(x=>x.key===employee)?employee:employees[0]?.key||'',code}:{}),...(selected==='manual.search'?{query}:{} )});
 async function run(){
  setBusy(true);setResult(null);
  try{
   const args=propsFor();
   if(demo){setResult(executeGateway(selected,args,{mode:'synthetic',syntheticConfirmed:true,role,month,employees,shifts,status,events}));}
   else{
    const res=await fetch('/api/gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:selected,arguments:args}),cache:'no-store'});
    const json=await res.json();setResult(json);
   }
  }catch(e){setResult({ok:false,error:e.message||'Το εργαλείο δεν είναι διαθέσιμο.'});}finally{setBusy(false);}
 }
 const groupOf=task=>task.severity==='high'?'attention':(['review','approve','locked'].includes(task.id)?'review':'guide');
 return <section className="ghRoot" aria-label="Κέντρο ενσωματώσεων και διαδικασιών">
  <div className="ghHero"><div><span className="eyebrow">INTEGRATION HUB · V1.3</span><h2>Ένας χώρος. Όλες οι διαδικασίες.</h2><p>Έλεγχοι, προτάσεις και γνώση από κοινό πυρήνα. Οι αναλύσεις παραμένουν read-only. Η διαχείριση εργασιών οχημάτων διαθέτει ξεχωριστή προστατευμένη ροή εγγραφής.</p><button type="button" className="primary" onClick={()=>onNavigate?.('rental')}>▤ Άνοιγμα εργασιών οχημάτων ↗</button></div><span className="ghMode">{demo?'● ΣΥΝΘΕΤΙΚΟ DEMO':'● ΕΤΑΙΡΙΚΗ ΑΝΑΓΝΩΣΗ'}</span></div>
  <div className="ghPath" aria-label="Σύνδεση λειτουργιών"><span>Πρόγραμμα</span><b>→</b><span>Ανάλυση</span><b>→</b><span>Ανθρώπινος έλεγχος</span><b>→</b><span>Εγκεκριμένη ενέργεια</span></div>
  <div className="ghTabs" role="group" aria-label="Ενότητες Hub">{[['board','Εκκρεμότητες'],['tools','Εργαλεία'],['guide','Πώς λειτουργεί']].map(([id,label])=><button type="button" key={id} aria-pressed={pane===id} onClick={()=>setPane(id)} className={pane===id?'active':''}>{label}</button>)}</div>
  {pane==='board'&&<><div className="ghIntro"><h3>Πίνακας ενεργειών</h3><p>Οι κάρτες δημιουργούνται από τους υπάρχοντες ελέγχους. Δεν είναι ξεχωριστό σύστημα καταχώρισης εργασιών.</p></div><div className="ghBoard">{TASK_GROUPS.map(g=><section key={g.id} className="ghLane" aria-label={g.label}><header><h4>{g.label}</h4><small>{g.description}</small></header>{tasks.filter(x=>groupOf(x)===g.id).map(x=><article className="ghTask" key={x.id}><span className={x.severity==='high'?'ghTaskFlag high':'ghTaskFlag'}>{x.severity==='high'?'ΠΡΟΣΟΧΗ':'ΕΝΗΜΕΡΩΣΗ'}</span><strong>{x.title}</strong><p>{x.description}</p><button type="button" onClick={()=>onNavigate?.(goRoute(x.route))}>Άνοιγμα ενότητας ↗</button></article>)}{tasks.filter(x=>groupOf(x)===g.id).length===0&&<p className="ghEmpty">Καμία εκκρεμότητα σε αυτή την κατηγορία.</p>}</section>)}</div></>}
  {pane==='tools'&&<div className="ghWorkbench"><section className="ghToolList"><h3>Επέλεξε εργαλείο</h3><p>Κάθε εργαλείο διαβάζει ή υπολογίζει. Δεν εκτελεί εγγραφές.</p>{tools.map(t=><button key={t.name} type="button" className={selected===t.name?'selected':''} aria-pressed={selected===t.name} onClick={()=>{setSelected(t.name);setResult(null)}}><span aria-hidden="true">{ICONS[t.name]}</span><span><strong>{t.title}</strong><small>{t.description}</small></span></button>)}</section><section className="ghToolDetails"><h3>{tools.find(x=>x.name===selected)?.title}</h3><p>{tools.find(x=>x.name===selected)?.description}</p>
  {['coverage.analyze','coverage.simulate','shift.propose'].includes(selected)&&<label className="ghField">Ημερομηνία<input type="date" value={day.startsWith(month+'-')?day:month+'-01'} min={month+'-01'} max={month+'-'+String(insight.days.length).padStart(2,'0')} onChange={e=>setDay(e.target.value)}/></label>}
  {selected==='coverage.simulate'&&<div className="ghFields"><label className="ghField">Υποθετικές παραδόσεις<input type="number" min="0" max="2000" value={pickups} onChange={e=>setPickups(Math.max(0,Math.min(2000,Number(e.target.value))))}/></label><label className="ghField">Υποθετικές επιστροφές<input type="number" min="0" max="2000" value={returns} onChange={e=>setReturns(Math.max(0,Math.min(2000,Number(e.target.value))))}/></label></div>}
  {selected==='shift.propose'&&<div className="ghFields"><label className="ghField">Εργαζόμενος<select value={employees.some(x=>x.key===employee)?employee:employees[0]?.key||''} onChange={e=>setEmployee(e.target.value)}>{employees.map(x=><option value={x.key} key={x.key}>{x.name}</option>)}</select></label><label className="ghField">Προτεινόμενος κωδικός<select value={code} onChange={e=>setCode(e.target.value)}>{['','R','L','S','203','301','206','208','211','213','402','215','218','217'].map(x=><option key={x} value={x}>{x||'Κενό'}</option>)}</select></label></div>}
  {selected==='manual.search'&&<label className="ghField">Τι θέλεις να μάθεις;<input value={query} maxLength={180} onChange={e=>setQuery(e.target.value)} placeholder="π.χ. δημοσίευση, πρόγραμμα..."/></label>}
  <button type="button" className="primary ghRun" onClick={run} disabled={busy||selected==='shift.propose'&&!employees.length}>{busy?'Ανάλυση…':'Εκτέλεση ελέγχου ↗'}</button><p className="ghDisclaimer">Τα αποτελέσματα είναι μόνο αναγνώσιμα. Το «Αίτημα έγκρισης» είναι προεπισκόπηση και δεν αποστέλλει email.</p><div className="ghResult" aria-live="polite"><div className="ghResultHead"><strong>Αποτέλεσμα</strong><small>{result?.mode==='SYNTHETIC_DEMO'?'Demo · προσωρινό':result?.mode==='CORPORATE_READ_ONLY'?'Εταιρικά δεδομένα · read-only':'Δεν έχει εκτελεστεί έλεγχος'}</small></div><Summary result={result}/>{result?.notice&&<p className="ghNotice">ⓘ {result.notice}</p>}</div></section></div>}
  {pane==='guide'&&<div className="ghGuide"><div><b>1</b><h3>Διάβασε την κατάσταση</h3><p>Τα εργαλεία καλούν τον ίδιο κανόνα υπολογισμών με το πρόγραμμα. Η προέλευση κάθε αποτελέσματος εμφανίζεται ρητά.</p></div><div><b>2</b><h3>Δοκίμασε μία απόφαση</h3><p>Υποθετικές αλλαγές και προσομοιώσεις δεν μεταβάλλουν εγγραφές. Πρώτα εξετάζονται οι συνέπειες.</p></div><div><b>3</b><h3>Χρησιμοποίησε εγκεκριμένη ροή</h3><p>Για πραγματικές ενέργειες χρειάζεται εταιρική ταυτοποίηση, backend validation και manager approval.</p></div><div><b>4</b><h3>Ενσωμάτωσε μόνο ασφαλή εργαλεία</h3><p>Το CLI/MCP του παρόντος release λειτουργεί μόνο offline με συνθετικά δεδομένα. Το HTTP gateway είναι αυστηρά authenticated και read-only.</p></div></div>}
 </section>;
}
