'use client';
import {useMemo,useState} from 'react';
import {dateKeys,dayLabel,monthLabel} from '../../lib/insights.mjs';
import {SCENARIOS,simulateOperationsDay} from '../../lib/operations-simulator.mjs';

const DEFAULT=Object.freeze({pickups:50,returns:35,pickupMinutes:13,returnMinutes:10,eligiblePercent:55,productivePercent:65,profile:'balanced'});
const INFO={
  pickups:'Υποθετικός αριθμός παραδόσεων της επιλεγμένης ημέρας. Δεν συνδέεται με πραγματικές κρατήσεις.',
  returns:'Υποθετικός αριθμός επιστροφών της ημέρας. Δεν ανακτά στοιχεία από Wheelsys.',
  eligiblePercent:'Εκτιμώμενο ποσοστό προγραμματισμένου προσωπικού που μπορεί να εξυπηρετεί παραδόσεις και επιστροφές.',
  productivePercent:'Εκτιμώμενο μέρος του χρόνου εργασίας που απομένει για αυτές τις εργασίες, μετά από άλλες υποχρεώσεις.',
};
function NumericControl({id,label,value,min,max,step=1,onChange,hint}){
 return <div className="simControl"><div className="simControlTop"><label htmlFor={'range-'+id}>{label}</label><output htmlFor={'range-'+id}>{value}{id.endsWith('Percent')?'%':''}</output></div><input id={'range-'+id} type="range" value={value} min={min} max={max} step={step} onChange={e=>onChange(Number(e.target.value))}/><small>{hint}</small></div>;
}
function WindowCard({entry,index}){
 const tone=entry.status==='attention'?'warning':entry.status==='unknown'?'neutral':entry.status==='watch'?'watch':'healthy';
 const progress=entry.utilization===null?0:Math.min(entry.utilization,100);
 return <article className={'simWindow '+tone} aria-label={entry.label}>
   <div className="simWindowTop"><span className="simWindowCount">0{index+1}</span><span className={'simStatus '+tone}>{entry.status==='attention'?'Πιθανό έλλειμμα':entry.status==='unknown'?'Χωρίς κάλυψη':entry.status==='watch'?'Αυξημένος φόρτος':'Εντός παραδοχών'}</span></div>
   <h3>{entry.label}</h3><p className="simHours">{entry.hours}</p>
   <div className="simMiniStats"><span>Παραδόσεις <b>{entry.pickups}</b></span><span>Επιστροφές <b>{entry.returns}</b></span></div>
   <div className="simTrack" role="progressbar" aria-label={'Εκτιμώμενη χρήση δυναμικότητας: '+entry.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div style={{width:progress+'%'}}/></div>
   <div className="simDemand"><span>Απαιτούμενος χρόνος</span><strong>{entry.demandMinutes} λεπτά</strong></div>
   <div className="simDemand"><span>Διαθέσιμος χρόνος*</span><strong>{entry.capacityMinutes} λεπτά</strong></div>
   <div className="simWindowBottom">{entry.gapMinutes>0?<>Ενδεικτικό έλλειμμα <strong>{entry.gapMinutes} λεπτών</strong></>:entry.status==='unknown'?'Δεν υπάρχουν διαθέσιμες καταχωρίσεις':'Δεν προκύπτει έλλειμμα από το σενάριο'}</div>
 </article>;
}

export default function OperationsLab({month,date,employees=[],shifts=[],demo=false,onOpenSchedule}){
 const dates=useMemo(()=>dateKeys(month),[month]);
 const safeDate=dates.includes(date)?date:dates[0];
 const [inputs,setInputs]=useState(DEFAULT);
 const [selectedDate,setSelectedDate]=useState(safeDate);
 const workingDate=dates.includes(selectedDate)?selectedDate:safeDate;
 const result=useMemo(()=>simulateOperationsDay({date:workingDate,employees,shifts,scenario:inputs}),[workingDate,employees,shifts,inputs]);
 const set=(name,value)=>setInputs(p=>({...p,[name]:value}));
 return <section className="opsLab" aria-label="Προσομοιωτής στελέχωσης">
  <div className="opsIntro"><div><span className="eyebrow">WHAT-IF SIMULATION</span><h2>Πώς θα αντέξει ο σταθμός την ημέρα;</h2><p>Δοκίμασε υποθετικές παραδόσεις και επιστροφές. Το ShiftOS συγκρίνει τον φόρτο με τις προγραμματισμένες ώρες, χωρίς να αλλάζει καμία βάρδια.</p></div><span className="opsPrivacy">◇ Χωρίς αποθήκευση</span></div>
  <div className="simNotice" role="note"><strong>Προσομοίωση, όχι πρόβλεψη.</strong> Οι αριθμοί και η κατανομή φόρτου είναι χειροκίνητες παραδοχές. Δεν χρησιμοποιούνται κρατήσεις, στοιχεία πελατών ή αυτόματες αποφάσεις προσωπικού.{demo?' Εμφανίζονται μόνο φανταστικοί εργαζόμενοι.':''}</div>
  <div className="simSettings"><div className="simSettingsHeader"><div><span className="eyebrow">01 · INPUTS</span><h3>Διαμόρφωσε το σενάριό σου</h3></div><button className="softButton" type="button" onClick={()=>setInputs({...DEFAULT})}>↺ Επαναφορά</button></div>
   <div className="simFormGrid">
    <label className="simFormSelect">Ημέρα προγράμματος<select value={workingDate} onChange={e=>setSelectedDate(e.target.value)}>{dates.map(d=><option key={d} value={d}>{dayLabel(d)} {Number(d.slice(-2))} · {monthLabel(month)}</option>)}</select></label>
    <label className="simFormSelect">Κατανομή φόρτου<select value={inputs.profile} onChange={e=>set('profile',e.target.value)}>{Object.entries(SCENARIOS).map(([key,v])=><option key={key} value={key}>{v.label}</option>)}</select></label>
    <NumericControl id="pickups" label="Αναμενόμενες παραδόσεις" value={inputs.pickups} min={0} max={250} onChange={n=>set('pickups',n)} hint={INFO.pickups}/>
    <NumericControl id="returns" label="Αναμενόμενες επιστροφές" value={inputs.returns} min={0} max={250} onChange={n=>set('returns',n)} hint={INFO.returns}/>
    <NumericControl id="eligiblePercent" label="Ποσοστό προσωπικού εξυπηρέτησης" value={inputs.eligiblePercent} min={5} max={100} step={5} onChange={n=>set('eligiblePercent',n)} hint={INFO.eligiblePercent}/>
    <NumericControl id="productivePercent" label="Αξιοποιήσιμος χρόνος εργασίας" value={inputs.productivePercent} min={10} max={100} step={5} onChange={n=>set('productivePercent',n)} hint={INFO.productivePercent}/>
   </div><details className="simAdvanced"><summary>Προχωρημένες παραδοχές χρόνου</summary><div className="simFormGrid"><NumericControl id="pickupMinutes" label="Λεπτά ανά παράδοση" value={inputs.pickupMinutes} min={2} max={45} onChange={n=>set('pickupMinutes',n)} hint="Υποθετικός μέσος χρόνος ανά παράδοση"/><NumericControl id="returnMinutes" label="Λεπτά ανά επιστροφή" value={inputs.returnMinutes} min={2} max={45} onChange={n=>set('returnMinutes',n)} hint="Υποθετικός μέσος χρόνος ανά επιστροφή"/></div></details>
  </div>
  <div className="simResultHeader"><div><span className="eyebrow">02 · IMPACT ANALYSIS</span><h3>Αποτέλεσμα ανά χρονική ζώνη</h3><p>Σύγκριση διαθέσιμου χρόνου και ενδεικτικού φόρτου για {dayLabel(workingDate)} {Number(workingDate.slice(-2))}.</p></div><div className="simSummary"><strong>{result.attentionWindows}/3</strong><span>ζώνες με πιθανό έλλειμμα</span></div></div>
  <div className="simWindowGrid">{result.windows.map((w,i)=><WindowCard key={w.id} entry={w} index={i}/>)}</div>
  <div className="simFooter"><div><strong>*Πώς υπολογίζεται;</strong><p>Από την επικάλυψη των κωδικών βαρδιών με τις 3 χρονικές ζώνες και τα ποσοστά εξυπηρέτησης/αξιοποίησης που όρισες. Χωρίς λεπτομερή ρόλους, διαλείμματα, πραγματική ροή αφίξεων ή πιστοποιημένη στελέχωση.</p></div>{typeof onOpenSchedule==='function'&&<button className="primary" onClick={()=>onOpenSchedule(workingDate)}>Προβολή προγράμματος ↗</button>}</div>
 </section>;
}
