'use client';
import {useMemo} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {operationsTelemetry,operationsRecentActivity} from '../../lib/operations/telemetry.mjs';
import {OPS_TEAMS, OPS_STATES, OPS_TYPES, OPS_SLOTS} from '../../lib/operations/domain.mjs';
import {UI_MOTION} from '../../lib/ui-motion-policy.mjs';
const percent=(part,total)=>total>0?Math.max(0,Math.min(100,part*100/total)):0;
const asDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function Ring({done,total,reduce}){
 const radius=29,circ=2*Math.PI*radius,progress=percent(done,total);
 return <svg className="opsPulseRing" viewBox="0 0 80 80" role="img" aria-label={total?`${done} από ${total} ολοκληρωμένες ή επαληθευμένες εργασίες`:'Δεν υπάρχουν εγγραφές'}>
  <circle cx="40" cy="40" r={radius} strokeWidth="8" fill="none" stroke="var(--ops-track)"/>
  <motion.circle cx="40" cy="40" r={radius} strokeWidth="8" fill="none" stroke="var(--ops-positive)" strokeLinecap="round" strokeDasharray={circ} transform="rotate(-90 40 40)" initial={false} animate={{strokeDashoffset:circ*(1-progress/100)}} transition={reduce?{duration:0}:{duration:UI_MOTION.panel,ease:UI_MOTION.ease}}/>
  <text x="40" y="44" textAnchor="middle" className="opsPulseRingValue">{total?`${Math.round(progress)}%`:'—'}</text>
 </svg>;
}
export default function OperationsPulse({tasks=[],station='HER',onTeamSelect,onStatusSelect}){
 const reduced=useReducedMotion();const day=useMemo(asDate,[]);
 const metric=useMemo(()=>operationsTelemetry(tasks,station,day),[tasks,station,day]);
 const recent=useMemo(()=>operationsRecentActivity(tasks,station,4),[tasks,station]);
 const signals=[{label:'Εκκρεμούν',count:metric.open,state:'OPEN',hint:'Δεν έχουν ολοκληρωθεί',level:'neutral'}, {label:'Σε αναμονή',count:metric.blocked,state:'BLOCKED',hint:'Απαιτούν παρέμβαση',level:'warning'}, {label:'Ληξιπρόθεσμες',count:metric.overdue,state:null,hint:'Η προθεσμία ημερομηνίας έχει παρέλθει',level:'warning'}, {label:'Επείγουσες',count:metric.urgentOpen,state:null,hint:'Ανοιχτές με επείγουσα προτεραιότητα',level:'attention'}];
 const maxTeam=Math.max(1,...Object.values(metric.teams).map(x=>x.total));
 return <section className="opsPulse" aria-labelledby="ops-pulse-title">
  <header className="opsPulseTop"><div><span className="opsPulseEyebrow">OPERATIONS INSTRUMENTS · CURRENT SNAPSHOT</span><h3 id="ops-pulse-title">Παλμός σταθμού</h3><p>Πραγματικοί αριθμοί από τις διαθέσιμες εργασίες · χωρίς τεχνητές τάσεις ή εικονικό live feed.</p></div><span className="opsPulseSource" title="Υπολογισμός με τα δεδομένα της συγκεκριμένης λίστας">Στιγμιότυπο · {day.split('-').reverse().join('/')}</span></header>
  <div className="opsPulseGrid"><div className="opsPulseLead"><Ring done={metric.closed} total={metric.total} reduce={reduced}/><div><strong>{metric.total?`${metric.closed}/${metric.total}`:'Δεν υπάρχουν δεδομένα'}</strong><small>Ολοκληρωμένες + επαληθευμένες</small></div></div>
   {signals.map(x=><button type="button" key={x.label} className={`opsPulseStat ${x.level}`} title={x.hint} onClick={()=>x.state&&onStatusSelect?.(x.state)} disabled={!x.state||!onStatusSelect} aria-label={`${x.label}: ${x.count}. ${x.hint}`}><span>{x.label}</span><strong>{x.count}</strong><small>{x.hint}</small></button>)}
  </div>
  <div className="opsPulseLower"><div className="opsPulseTeams"><div className="opsPulseSubhead"><strong>Εργασίες ανά ομάδα</strong><span>Πλήθος, όχι στελέχωση</span></div><div className="opsPulseTeamRows">{Object.entries(metric.teams).map(([key,x])=><button type="button" key={key} className="opsPulseTeam" onClick={()=>onTeamSelect?.(key)} aria-label={`${OPS_TEAMS[key]}: ${x.total} εργασίες, ${x.open} ανοιχτές`}><span>{OPS_TEAMS[key]}</span><span className="opsPulseBarTrack"><motion.span initial={false} animate={{width:`${percent(x.total,maxTeam)}%`}} transition={reduced?{duration:0}:{duration:UI_MOTION.normal,ease:UI_MOTION.ease}}/></span><b>{x.total}</b></button>)}</div></div>
   <div className="opsPulseHistory"><div className="opsPulseSubhead"><strong>Πρόσφατες μεταβολές</strong><span>Από το καταγεγραμμένο ιστορικό</span></div>{recent.length?<ol>{recent.map(x=><li key={x.key}><span className="opsPulseEventDot" aria-hidden="true"/><div><strong>{OPS_TYPES[x.type]?.title||'Εργασία'}</strong><small>{x.from?`${OPS_STATES[x.from]} → ${OPS_STATES[x.to]}`:'Δημιουργία'} · {x.at.slice(0,16).replace('T',' ')}</small></div></li>)}</ol>:<p className="opsPulseEmpty">Δεν υπάρχουν διαθέσιμες καταγεγραμμένες μεταβολές.</p>}</div></div>
  <footer className="opsPulseFoot"><span>Τα διαγράμματα βασίζονται στο τρέχον σύνολο εργασιών. Δεν μετρούν στόλους, κρατήσεις ή προσωπικό.</span><span>Πρωί {metric.slots.early.total} · Μεσημέρι {metric.slots.mid.total} · Απόγευμα {metric.slots.late.total}</span></footer>
 </section>;
}
