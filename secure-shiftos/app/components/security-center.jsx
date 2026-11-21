'use client';
import {useEffect,useMemo,useState} from 'react';
import {assessPermissions,passwordGuidance,runbook} from '../../lib/security-audit.mjs';
import {HelpTip} from './help-system.jsx';

const DEMO_FILE=[{id:'demo-file-link',roles:['write'],link:{scope:'anonymous'}},{id:'demo-owner',roles:['owner'],grantedToV2:{user:{id:'fictitious-demo-id'}}}];
const DEMO_PARENT=[{id:'demo-folder-link',roles:['write'],link:{scope:'organization'}}];
const NOTES={
 NOT_PRIVATE:'Υπάρχει διαδρομή πρόσβασης που δεν ικανοποιεί την απαίτηση πλήρους απομόνωσης.',
 UNVERIFIED:'Δεν υπάρχει αξιόπιστη επιβεβαίωση των δικαιωμάτων. Το αρχείο δεν χαρακτηρίζεται κλειδωμένο.',
 REQUIRES_HUMAN_VERIFICATION:'Δεν βρέθηκαν αυτόματα γνωστές διαδρομές ευρείας πρόσβασης. Χρειάζεται ανεξάρτητη δοκιμή με άλλον λογαριασμό.'
};
export default function SecurityCenter({demo=false}){
 const [report,setReport]=useState(demo?assessPermissions(DEMO_FILE,DEMO_PARENT):null);
 const [checking,setChecking]=useState(false);
 const [error,setError]=useState('');
 const [pass,setPass]=useState('');
 const [done,setDone]=useState(()=>new Set());
 const tasks=useMemo(()=>runbook(),[]);
 const passwordState=passwordGuidance(pass);
 async function check(){
  if(demo){setReport(assessPermissions(DEMO_FILE,DEMO_PARENT));return;}
  setChecking(true);setError('');
  try{const response=await fetch('/api/security',{cache:'no-store'});const data=await response.json();
   if(!response.ok||data.state==='UNVERIFIED'){setReport(null);setError('Ο live έλεγχος Microsoft 365 δεν ήταν διαθέσιμος. Μην θεωρείς το Excel κλειδωμένο.');}
   else setReport(data);
  }catch{setReport(null);setError('Αδυναμία ανάγνωσης δικαιωμάτων Microsoft 365.');}finally{setChecking(false);}
 }
 useEffect(()=>{if(!demo)check();},[demo]);
 const state=report?.state||'UNVERIFIED';
 return <div className="securitySurface">
  <div className="securityHero"><div><span className="eyebrow">ZERO-TRUST SECURITY CENTER</span><h2>Έλεγχος πρόσβασης Excel <HelpTip topic="security"/></h2><p>Οι ήδη εγγεγραμμένοι χρήστες παραμένουν στη λίστα. Οι έλεγχοι σύνδεσης και η εμπιστευτικότητα του αρχείου αξιολογούνται ξεχωριστά.</p></div><span className={'securityVerdict '+(state==='NOT_PRIVATE'?'exposed':'unknown')}>{demo?'ΣΥΝΘΕΤΙΚΟ ΣΕΝΑΡΙΟ · ':''}{state==='NOT_PRIVATE'?'ΔΕΝ ΕΙΝΑΙ ΙΔΙΩΤΙΚΟ':state==='UNVERIFIED'?'ΜΗ ΕΠΑΛΗΘΕΥΜΕΝΟ':'ΧΡΕΙΑΖΕΤΑΙ ΔΟΚΙΜΗ'}</span></div>
  <div className="securityStats"><article><span>Έκθεση μέσω συνδέσμων / ταυτοτήτων</span><strong>{report?.riskCount??'—'}</strong><small>{demo?'Υποθετικά ευρήματα για εκπαίδευση':'Ανάγνωση δικαιωμάτων Microsoft Graph'}</small></article><article><span>Άμεσες ταυτότητες αρχείου</span><strong>{report?.directGrants??'—'}</strong><small>Καμία αλλαγή στους υπάρχοντες παραλήπτες</small></article><article><span>Κρυπτογράφηση αρχικού XLSX</span><strong>ΜΗ ΕΠΙΒΕΒΑΙΩΜΕΝΗ</strong><small>Το co-authoring δεν πρέπει να καταργηθεί</small></article></div>
  {error&&<p className="alert" role="alert">{error}</p>}
  <section className="securityCard"><div className="sectionTitle"><div><span className="eyebrow">ACCESS FINDINGS</span><h3>Πραγματικός έλεγχος, όχι εικονικό κλείδωμα</h3></div><button className="softButton" type="button" disabled={checking} onClick={check}>{checking?'Έλεγχος…':'↻ Επανέλεγχος'}</button></div><p>{NOTES[state]}</p>{(report?.risks||[]).map((risk,i)=><div className="securityRisk" key={`${risk.kind}-${risk.layer}-${i}`}><span>!</span><div><strong>{risk.label}</strong><small>{risk.kind==='SHARED_ACCOUNT'?'Προϋπόθεση: ξεχωριστή ταυτότητα για κάθε διαχειριστή':'Ο συγκεκριμένος σύνδεσμος πρέπει να ελεγχθεί από εξουσιοδοτημένο Owner.'}</small></div></div>)}{!report&&<p className="securityWarning">Δεν υπάρχουν επαληθευμένα στοιχεία. Το πρόγραμμα δεν χαρακτηρίζεται ασφαλές.</p>}</section>
  <div className="securityColumns"><section className="securityCard"><span className="eyebrow">7-STEP HARDENING</span><h3>Πρακτικό πρωτόκολλο υπευθύνων</h3><p>Σημείωσε εσωτερικά την πρόοδο. Τα κουτάκια δεν τροποποιούν δικαιώματα ούτε αποτελούν απόδειξη ολοκλήρωσης.</p><div className="securityChecklist">{tasks.map((t,i)=><label key={t.id}><input type="checkbox" checked={done.has(t.id)} onChange={e=>setDone(prev=>{const n=new Set(prev);e.target.checked?n.add(t.id):n.delete(t.id);return n;})}/><span><strong>{String(i+1).padStart(2,'0')} · {t.title}</strong><small>Υπεύθυνος: {t.owner}</small></span></label>)}</div><div className="securityCount">{done.size}/{tasks.length} σημειωμένα — όχι εφαρμοσμένα από την εφαρμογή</div></section>
  <section className="securityCard"><span className="eyebrow">BACKUP PASSWORD</span><h3>Κωδικός από τους προϊσταμένους</h3><p>Ο κωδικός αφορά αποκλειστικά το κρυπτογραφημένο backup <code>.xlsx.enc</code>. Δεν αλλάζει την πρόσβαση στο αρχικό Excel ούτε αποθηκεύεται εδώ.</p><label className="securityLabel" htmlFor="security-backup-password">Τοπική δοκιμή μήκους κωδικού</label><input id="security-backup-password" type="password" autoComplete="off" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Εισαγωγή μόνο για έλεγχο μήκους"/><p className={passwordState.valid?'securityGood':'securityWarning'}>{passwordState.message}</p><button className="softButton" type="button" onClick={()=>setPass('')}>Καθαρισμός πεδίου</button><hr/><h4>Επιλογές κλειδώματος</h4><div className="securityChoice"><strong>Κύριο Excel</strong><small>Εταιρικά δικαιώματα + Purview αν υποστηρίζεται. Διατηρεί co-authoring.</small></div><div className="securityChoice"><strong>Backup Excel</strong><small>Κρυπτογράφηση με κωδικό προϊσταμένων και ελεγχόμενη επαναφορά.</small></div><p className="securityWarning">Κωδικός στο ίδιο το πρωτότυπο XLSX μπορεί να απενεργοποιήσει το co-authoring.</p></section></div>
  <p className="securityFooter">{demo?'DEMO: κανένα στοιχείο δεν προέρχεται από το εταιρικό OneDrive.':'LIVE: read-only έλεγχος· η αφαίρεση ανώνυμων συνδέσμων εκτελείται μόνο από εξουσιοδοτημένο Owner στο Microsoft 365.'}</p>
 </div>;
}
