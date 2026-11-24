'use client';
import {useState} from 'react';

const STAGES=[
 {id:'draft',label:'Σχεδιασμός',sub:'Καταχώρισε βάρδιες',desc:'Επίλεξε τον μήνα και συμπλήρωσε βάρδιες. Τα προσωρινά σενάρια δεν είναι δημοσιευμένες αποφάσεις.',route:'schedule',action:'Άνοιγμα προγράμματος'},
 {id:'check',label:'Έλεγχος',sub:'Επίλυσε εκκρεμότητες',desc:'Δες ελλείψεις, άγνωστους κωδικούς και προειδοποιήσεις ανάπαυσης. Ο τελικός έλεγχος γίνεται από προϊστάμενο.',route:'checks',action:'Προβολή CHECK'},
 {id:'approve',label:'Έγκριση',sub:'Επιβεβαίωσε την έκδοση',desc:'Πριν από τη δημοσίευση χρειάζεται εγκεκριμένος προϊστάμενος και server-side επανέλεγχος. Η προεπισκόπηση δεν αποτελεί έγκριση.',route:'release',action:'Άνοιγμα εγκρίσεων'},
 {id:'backup',label:'Διατήρηση',sub:'Ασφαλές αντίγραφο',desc:'Το Excel backup πρέπει να κρυπτογραφείται και να αποθηκεύεται σε εγκεκριμένο ιδιωτικό χώρο. Κράτησε ιστορικό αποκατάστασης.',route:'backup',action:'Προβολή backups'},
];

export default function WorkflowCenter({status='UNCONFIGURED',warnings=0,missing=0,invalid=0,demo=false,onNavigate}){
 const [active,setActive]=useState(0);
 const stage=STAGES[active];
 const blocking=warnings+missing+invalid;
 const note=blocking?`${blocking} εκκρεμότητες προς έλεγχο. Δεν μπορεί να συναχθεί ετοιμότητα δημοσίευσης.`:'Δεν υπάρχουν ενδείξεις στα διαθέσιμα δεδομένα. Απαιτούνται επιπλέον εταιρικοί έλεγχοι.';
 return <section className="flowCenter" aria-labelledby="flow-title">
  <header className="flowHero"><div><span className="eyebrow">SUPERVISOR WORKFLOW</span><h2 id="flow-title">Από την ιδέα στο εγκεκριμένο πρόγραμμα</h2><p>Τέσσερα κατανοητά βήματα, χωρίς τεχνική ορολογία. Επίλεξε μία φάση για να δεις τι χρειάζεται.</p></div><span className="flowMode">{demo?'Προσομοίωση διαδικασίας':'Οδηγός διαδικασίας'} · {status}</span></header>
  <ol className="flowSteps">{STAGES.map((item,i)=><li key={item.id}><button type="button" className={'flowStep '+(active===i?'chosen':'')} aria-current={active===i?'step':undefined} onClick={()=>setActive(i)}><span className="flowOrdinal">{String(i+1).padStart(2,'0')}</span><strong>{item.label}</strong><small>{item.sub}</small></button></li>)}</ol>
  <div className="flowDetail"><div><span className="eyebrow">ΒΗΜΑ {active+1} ΑΠΟ 4</span><h3>{stage.label}</h3><p>{stage.desc}</p><div className="flowGuard" role="status"><span>{blocking?'!':'✓'}</span><span>{note}</span></div></div><div className="flowDetailActions"><button type="button" className="primary" onClick={()=>onNavigate?.(stage.route)}>{stage.action} ↗</button><button type="button" className="softButton" onClick={()=>setActive(x=>(x+1)%STAGES.length)}>Επόμενο βήμα →</button></div></div>
  <div className="flowSafety"><strong>Κανόνας ασφαλείας</strong><p>Το κέντρο ροής δεν εκτελεί αυτόματα αλλαγές, δεν στέλνει email και δεν δημοσιεύει πρόγραμμα. Οι πραγματικές ενέργειες περνούν από τα υπάρχοντα δικαιώματα και τους ελέγχους του server.</p></div>
 </section>;
}
