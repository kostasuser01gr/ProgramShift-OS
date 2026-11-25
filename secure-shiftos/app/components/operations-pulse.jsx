'use client';
import {useMemo,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {instrumentalSnapshot,instrumentState,INSTRUMENT_REGISTRY} from '../../lib/operations/instruments.mjs';
import {operationsRecentActivity} from '../../lib/operations/telemetry.mjs';
import {OPS_TEAMS,OPS_STATES,OPS_TYPES} from '../../lib/operations/domain.mjs';
import {UI_MOTION} from '../../lib/ui-motion-policy.mjs';

const asDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const percent=(part,total)=>total>0?Math.max(0,Math.min(100,part*100/total)):0;
const number=new Intl.NumberFormat('el-GR');
const fmt=x=>x===null||x===undefined?'—':number.format(x);
const transitions=(reduce)=>reduce?{duration:0}:{duration:UI_MOTION.normal,ease:UI_MOTION.ease};
function InstrumentInfo({metric}){
 const d=INSTRUMENT_REGISTRY[metric];
 const [open,setOpen]=useState(false);
 return <div className={`instInfo ${open?'is-open':''}`} onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);event.stopPropagation();}}}><button className="instInfoTrigger" type="button" onClick={()=>setOpen(value=>!value)} aria-expanded={open} aria-controls={`inst-info-${metric}`} aria-label={`Εξήγηση: ${d.label}`} title="Τι σημαίνει αυτή η μέτρηση;">?</button><div className="instInfoPop" id={`inst-info-${metric}`} role="tooltip"><strong>{d.label}</strong><p>{d.aggregation}</p><small>Πηγή: εργασίες σταθμού · Μονάδα: {d.unit}</small><span>Ανανέωση μόνο μετά από επιτυχημένη ανάκτηση δεδομένων.</span></div></div>;
}
function Header({name,metric,caption}){return <div className="instCardHeader"><div><span>{name}</span>{caption&&<small>{caption}</small>}</div><InstrumentInfo metric={metric}/></div>;}
function NoReadings({children='Δεν υπάρχουν αρκετές καταγραφές.'}){return <div className="instNoReadings" role="note">{children}</div>;}
function EventSeries({values,reduce}){
 const max=Math.max(1,...values.map(x=>x.count));
 const pts=values.map((x,i)=>`${12+(i/(values.length-1))*256},${96-x.count/max*75}`).join(' ');
 return <svg viewBox="0 0 280 112" className="instTrend" role="img" aria-label={`Πραγματικές μεταβολές τελευταίων 7 ημερών: ${values.map(x=>`${x.date}: ${x.count}`).join(', ')}`}>
  {[26,54,82].map(y=><line key={y} x1="10" x2="270" y1={y} y2={y} className="instGridline"/>)}
  <motion.polyline fill="none" points={pts} stroke="var(--ins-ink)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" initial={false} animate={{opacity:1}} transition={transitions(reduce)}/>
  {values.map((x,i)=><circle key={x.date} cx={12+(i/6)*256} cy={96-x.count/max*75} r={i===6?4.5:2} fill={i===6?'var(--ins-accent)':'var(--ins-ink)'}><title>{`${x.date}: ${x.count} μεταβολές`}</title></circle>)}
  <text x="12" y="110" className="instTinyLabel">{values[0]?.date.slice(5)}</text><text x="268" y="110" textAnchor="end" className="instTinyLabel">{values.at(-1)?.date.slice(5)}</text>
 </svg>;
}
function SlotHistogram({values,reduce}){
 const max=Math.max(1,...values.map(x=>x.count));
 return <div className="instHistogram" role="img" aria-label={`Εργασίες ανά ζώνη: ${values.map(x=>x.label+': '+x.count).join(', ')}`}>
  {values.map((x,i)=><div key={x.key} className="instHistColumn"><div className="instHistTrack"><motion.div className={i===values.length-1?'highlight':''} initial={false} animate={{height:`${percent(x.count,max)}%`}} transition={transitions(reduce)} title={`${x.label}: ${x.count}`}/></div><small>{x.label}</small><b>{fmt(x.count)}</b></div>)}
 </div>;
}
function Needle({value,reduce}){
 if(value===null)return <NoReadings>Δεν υπάρχει σύνολο εργασιών για υπολογισμό ποσοστού.</NoReadings>;
 const angle=Math.PI-(value/100)*Math.PI;
 const x=100+67*Math.cos(angle),y=105-67*Math.sin(angle);
 return <svg viewBox="0 0 200 130" className="instNeedle" role="img" aria-label={`Ολοκλήρωση ${value}%, κλίμακα από 0 έως 100%`}>
  <path d="M 19 105 A 81 81 0 0 1 181 105" className="instNeedleTrack"/>
  <path d="M 19 105 A 81 81 0 0 1 181 105" className="instNeedleOutline"/>
  {Array.from({length:21},(_,i)=>{const a=Math.PI-(i/20)*Math.PI;return <line key={i} x1={100+73*Math.cos(a)} y1={105-73*Math.sin(a)} x2={100+(i%5===0?87:81)*Math.cos(a)} y2={105-(i%5===0?87:81)*Math.sin(a)} stroke={i>=17?'var(--ins-accent)':'var(--ins-muted)'} strokeWidth={i%5===0?2.2:1.2}/>})}
  <motion.line x1="100" y1="105" initial={false} animate={{x2:x,y2:y}} stroke="var(--ins-ink)" strokeWidth="3.5" strokeLinecap="round" transition={transitions(reduce)}/>
  <circle cx="100" cy="105" r="7" fill="var(--ins-ink)"/>
  <text x="17" y="125" className="instTinyLabel">0</text><text x="183" y="125" textAnchor="end" className="instTinyLabel">100</text>
 </svg>;
}
function CompletionRing({value,reduce}){
 if(value===null)return <NoReadings>Δεν υπάρχουν ολοκληρωμένες εργασίες προς επαλήθευση.</NoReadings>;
 const radius=48,circ=2*Math.PI*radius;
 return <svg viewBox="0 0 150 150" className="instCompletionRing" role="img" aria-label={`Επαληθευμένες ${value}% των ολοκληρωμένων εργασιών`}>
  <circle cx="75" cy="75" r={radius} fill="none" stroke="var(--ins-track)" strokeWidth="10"/>
  <motion.circle cx="75" cy="75" r={radius} fill="none" stroke="var(--ins-accent)" strokeWidth="10" transform="rotate(-90 75 75)" strokeLinecap="butt" strokeDasharray={circ} initial={false} animate={{strokeDashoffset:circ*(1-value/100)}} transition={transitions(reduce)}/>
  <text x="75" y="80" textAnchor="middle" className="instRingValue">{value}%</text>
 </svg>;
}
function Distribution({rows,all,onStatusSelect}){
 return <div className="instDistribution">
  {all>0?<div className="instSegBar" role="img" aria-label={rows.map(x=>`${x.label}: ${x.count}`).join(', ')}>{rows.filter(x=>x.count>0).map((x,i)=><div key={x.key} className={`instSegment instState-${x.key}`} style={{width:`${percent(x.count,all)}%`}} title={`${x.label}: ${x.count}`}/>)}</div>:<NoReadings>Δεν έχουν καταχωριστεί εργασίες.</NoReadings>}
  <div className="instLegend">{rows.map(x=><button type="button" key={x.key} onClick={()=>onStatusSelect?.(x.key)} disabled={!onStatusSelect} aria-label={`Φίλτρο ${x.label}: ${x.count} εργασίες`}><i className={`instState-${x.key}`}/><span>{x.label}</span><b>{fmt(x.count)}</b></button>)}</div>
 </div>;
}
function Matrix({matrix,onTeamSelect}){
 const max=Math.max(0,...matrix.flatMap(x=>x.cells.map(y=>y.count)));
 return <div className="instMatrix" role="table" aria-label="Πλήθος εργασιών ανά ομάδα και χρονική ζώνη"><div role="row" className="instMatrixRow"><span role="columnheader">Ομάδα</span><span role="columnheader">Πρωί</span><span role="columnheader">Μεσημ.</span><span role="columnheader">Απόγ.</span></div>
  {matrix.map(row=><div className="instMatrixRow" role="row" key={row.team}><button type="button" role="rowheader" disabled={!onTeamSelect} onClick={()=>onTeamSelect?.(row.team)} title={`Φιλτράρισμα: ${row.label}`}>{row.label}</button>{row.cells.map(c=><span role="cell" key={c.slot} className="instMatrixCell" style={{'--inst-heat':max>0?`${Math.round(c.count/max*75)}%`:'0%'}} title={`${row.label} · ${c.label}: ${c.count} εργασίες`} aria-label={`${row.label}, ${c.label}: ${c.count}`}><span>{c.count||'·'}</span></span>)}</div>)}
 </div>;
}
export default function OperationsPulse({tasks=[],station='HER',onTeamSelect,onStatusSelect,loading=false,error='',configured=true,stale=false,demo=false}){
 const reduce=useReducedMotion();const today=useMemo(asDate,[]);
 const result=useMemo(()=>instrumentalSnapshot(tasks,station,today),[tasks,station,today]);
 const [showDetails,setShowDetails]=useState(false);
 const state=instrumentState({loading,error,configured,stale,taskCount:result.total});
 const history=useMemo(()=>operationsRecentActivity(tasks,station,5),[tasks,station]);
 const signal=(label,count,status,description)=> <div className="instSignal" key={label}><span>{label}</span><strong>{fmt(count)}</strong>{status?<button type="button" onClick={()=>onStatusSelect?.(status)} disabled={!onStatusSelect}>{description} ↗</button>:<small>{description}</small>}</div>;
 return <section className="opsPulse opsPulseInstrumental" aria-labelledby="instrumental-title" aria-busy={state==='loading'}>
  <header className="instHeader"><div className="instIdentity"><span className="instEmblem" aria-hidden="true">⌁</span><div><span className="instEyebrow">RENTAL OPERATIONS · INSTRUMENTAL VIEW</span><h3 id="instrumental-title">Κέντρο επιχειρησιακού ελέγχου</h3><p>Μετρήσεις από καταχωρισμένες εργασίες · όχι διακοσμητικά στατιστικά.</p></div></div><div className="instSnapshot"><span className={`instIndicator ${state}`} aria-hidden="true"/><div><strong>{demo?'ΣΥΝΘΕΤΙΚΟ DEMO':state==='available'?'ΣΤΙΓΜΙΟΤΥΠΟ':state==='stale'?'ΠΑΛΙΩΜΕΝΑ ΔΕΔΟΜΕΝΑ':state==='empty'?'ΧΩΡΙΣ ΕΓΓΡΑΦΕΣ':state==='loading'?'ΑΝΑΚΤΗΣΗ':'ΧΩΡΙΣ ΣΥΝΔΕΣΗ'}</strong><small>{today.split('-').reverse().join('/')} · Όχι ζωντανή ροή</small></div></div></header>
  {['failed','loading','disconnected','invalid'].includes(state)?<div className="instUnavailable" role={state==='failed'?'alert':'status'}><strong>{state==='loading'?'Γίνεται ανάκτηση δεδομένων…':state==='failed'?'Τα δεδομένα δεν είναι διαθέσιμα':state==='disconnected'?'Απαιτείται εταιρική σύνδεση':'Μη έγκυρη πηγή'}</strong><p>{error||'Δεν εμφανίζονται αριθμοί έως ότου επιβεβαιωθεί η πρόσβαση στην πηγή.'}</p></div>:<>
  {state==='stale'&&<div className="instStale" role="status">Τα δεδομένα έχουν παλιώσει. Χρησιμοποίησε «Ανανέωση» πριν λάβεις απόφαση ή αποθηκεύσεις αλλαγή.</div>}
  <div className="instGrid">
   <article className="instCard"><Header metric="tasks" name="Καταχωρισμένες εργασίες" caption="Σύνολο στον σταθμό"/><strong className="instValue">{fmt(result.total)}</strong><div className="instChart">{result.hasHistory?<EventSeries values={result.history} reduce={reduce}/>:<NoReadings>Δεν υπάρχει καταγεγραμμένο ιστορικό 7 ημερών.</NoReadings>}</div><footer><span>{result.hasHistory?`${result.eventCount} καταγεγραμμένες μεταβολές`:'Χωρίς τεχνητή τάση'}</span><button onClick={()=>onStatusSelect?.('all')} disabled={!onStatusSelect}>Όλες ↗</button></footer></article>
   <article className="instCard"><Header metric="slots" name="Φόρτος ανά ζώνη" caption="Πλήθος εργασιών · όχι στελέχωση"/><strong className="instValue">{fmt(result.total)} <small>εργασίες</small></strong><div className="instChart"><SlotHistogram values={result.slotDistribution} reduce={reduce}/></div><footer><span>Πρωί · Μεσημέρι · Απόγευμα</span></footer></article>
   <article className="instCard"><Header metric="completion" name="Ολοκλήρωση" caption="DONE + VERIFIED / Σύνολο"/><strong className="instValue">{result.completionPercent===null?'—':`${result.completionPercent}%`}</strong><div className="instChart"><Needle value={result.completionPercent} reduce={reduce}/></div><footer><span>{fmt(result.closed)} ολοκληρωμένες από {fmt(result.total)}</span><button onClick={()=>onStatusSelect?.('OPEN')} disabled={!onStatusSelect}>Ανοιχτές ↗</button></footer></article>
   <article className="instCard"><Header metric="verification" name="Επαλήθευση manager" caption="Επαληθευμένες / Ολοκληρωμένες"/><strong className="instValue">{result.verificationPercent===null?'—':`${result.verificationPercent}%`}</strong><div className="instChart instCentered"><CompletionRing value={result.verificationPercent} reduce={reduce}/></div><footer><span>{fmt(result.unfinishedApprovals)} σε αναμονή επαλήθευσης</span><button onClick={()=>onStatusSelect?.('DONE')} disabled={!onStatusSelect}>Έλεγχος ↗</button></footer></article>
   <article className="instCard instCardMatrix"><Header metric="matrix" name="Ομάδες × ζώνες" caption="Πραγματικές καταχωρίσεις"/><div className="instChart instMatrixContainer"><Matrix matrix={result.matrix} onTeamSelect={onTeamSelect}/></div><footer><span>Επιλογή ομάδας για φιλτράρισμα</span></footer></article>
   <article className="instCard"><Header metric="status" name="Κατανομή κατάστασης" caption="Διασπορά εργασιών"/><strong className="instValue">{fmt(result.open)} <small>ανοιχτές</small></strong><div className="instChart"><Distribution rows={result.statusDistribution} all={result.total} onStatusSelect={onStatusSelect}/></div><footer><span>Σύνολο {fmt(result.total)} εργασιών</span></footer></article>
  </div>
  <div className="instPriorityStrip" aria-label="Σημεία προσοχής">{signal('Σε αναμονή',result.blocked,'BLOCKED','Προβολή')}{signal('Ληξιπρόθεσμες',result.overdue,null,'Ανοιχτές μετά την προθεσμία')}{signal('Επείγουσες',result.urgentOpen,null,'Ανοιχτές υψηλής προτεραιότητας')}{signal('Σήμερα',result.dueToday,null,'Εργασίες με σημερινή προθεσμία')}</div>
  <button className="instDetailsToggle" type="button" aria-expanded={showDetails} onClick={()=>setShowDetails(x=>!x)}>{showDetails?'− Απόκρυψη αναλυτικών':'＋ Αναλυτικές πληροφορίες και ιστορικό'}</button>
  {showDetails&&<div className="opsPulseLower"><div className="opsPulseTeams"><div className="opsPulseSubhead"><strong>Εργασίες ανά ομάδα</strong><span>Πλήθος εργασιών, όχι ανθρώπινη δυναμικότητα</span></div><div className="opsPulseTeamRows">{Object.entries(result.teams).map(([key,x])=><button type="button" key={key} className="opsPulseTeam" onClick={()=>onTeamSelect?.(key)}><span>{OPS_TEAMS[key]}</span><span className="opsPulseBarTrack"><span style={{width:`${percent(x.total,Math.max(1,...Object.values(result.teams).map(x=>x.total)))}%`}}/></span><b>{x.total}</b></button>)}</div></div><div className="opsPulseHistory"><div className="opsPulseSubhead"><strong>Πρόσφατες μεταβολές</strong><span>Μόνο καταγεγραμμένα γεγονότα</span></div>{history.length?<ol>{history.map(x=><li key={x.key}><span className="opsPulseEventDot"/><div><strong>{OPS_TYPES[x.type]?.title||'Εργασία'}</strong><small>{x.from?`${OPS_STATES[x.from]} → ${OPS_STATES[x.to]}`:'Δημιουργία'} · {x.at.slice(0,16).replace('T',' ')}</small></div></li>)}</ol>:<p className="opsPulseEmpty">Δεν υπάρχουν καταγεγραμμένες μεταβολές.</p>}</div></div>}
  <footer className="instFoot"><span>Πηγή: εργασίες {demo?'συνθετικού demo':'Microsoft 365 (όταν είναι συνδεδεμένο)'} · στιγμιότυπο μετά από επιτυχημένη ανάκτηση.</span><span>Χωρίς μετρικές κρατήσεων ή οχημάτων εφόσον δεν υπάρχει σύνδεση.</span></footer>
  </>}
 </section>;
}
