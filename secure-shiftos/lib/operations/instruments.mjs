/** Instrumental dashboard contracts. All readings come from station-scoped task snapshots.
 * No synthetic chart values are generated in the enterprise path.
 */
import {OPS_STATES,OPS_TEAMS,OPS_SLOTS} from './domain.mjs';
import {operationsTelemetry} from './telemetry.mjs';

const statusKeys=Object.keys(OPS_STATES);
const teamKeys=Object.keys(OPS_TEAMS);
const slotKeys=Object.keys(OPS_SLOTS);
const dateValue=(iso)=>typeof iso==='string'&&/^20\d\d-\d\d-\d\d$/.test(iso)&&!Number.isNaN(Date.parse(`${iso}T12:00:00Z`))&&new Date(`${iso}T12:00:00Z`).toISOString().slice(0,10)===iso;
const clampedPercent=(n,d)=>d>0?Math.round(n/d*100):null;

/** Metric → source → unit → aggregation → update → threshold → chart → decision. */
export const INSTRUMENT_REGISTRY=Object.freeze({
 tasks:{label:'Εργασίες',source:'Εργασίες επιλεγμένου σταθμού',unit:'εργασίες',aggregation:'Πλήθος έγκυρων εργασιών. Η τάση εμφανίζεται μόνο όταν υπάρχουν πραγματικές καταγραφές επτά ημερών.',refresh:'Μετά από επιτυχημένη ανάκτηση',threshold:null,chart:'Επταήμερη χρονοσειρά, εφόσον υπάρχει ιστορικό',decision:'Προβολή εργασιών'},
 slots:{label:'Φόρτος βαρδιών',source:'Χρονική ζώνη εργασίας',unit:'εργασίες',aggregation:'Καταμέτρηση εργασιών ανά πρωινή, μεσημεριανή και απογευματινή ζώνη. Δεν μετρά εργαζομένους.',refresh:'Μετά από επιτυχημένη ανάκτηση',threshold:null,chart:'Ιστόγραμμα ανά κατηγορία',decision:'Έλεγχος κατανομής ζωνών'},
 completion:{label:'Ολοκλήρωση',source:'Κατάσταση εργασίας',unit:'%',aggregation:'Ποσοστό ολοκλήρωσης: (ολοκληρωμένες + επαληθευμένες) δια το σύνολο εργασιών.',refresh:'Μετά από επιτυχημένη ανάκτηση',threshold:null,chart:'Όργανο 0 έως 100%',decision:'Έλεγχος ανοιχτών εργασιών'},
 verification:{label:'Επαλήθευση',source:'Κατάσταση εργασίας',unit:'%',aggregation:'Ποσοστό επαλήθευσης: επαληθευμένες διά το σύνολο ολοκληρωμένων και επαληθευμένων. Χωρίς ολοκληρωμένες δεν υπάρχει ποσοστό.',refresh:'Μετά από επιτυχημένη ανάκτηση',threshold:null,chart:'Κυκλικό όργανο 0 έως 100%',decision:'Έλεγχος εγκρίσεων manager'},
 matrix:{label:'Ομάδες και ζώνες',source:'Ομάδα και χρονική ζώνη',unit:'εργασίες',aggregation:'Κατανομή του πραγματικού πλήθους εργασιών ανά ομάδα σταθμού και χρονική ζώνη.',refresh:'Μετά από επιτυχημένη ανάκτηση',threshold:null,chart:'Θερμικός χάρτης καταμετρήσεων',decision:'Φιλτράρισμα ανά ομάδα'},
 status:{label:'Κατανομή κατάστασης',source:'Κατάσταση εργασίας',unit:'εργασίες',aggregation:'Πόσες εργασίες υπάρχουν σε κάθε κατάσταση. Οι αναλογίες αθροίζουν στο σύνολο εργασιών.',refresh:'Μετά από επιτυχημένη ανάκτηση',threshold:null,chart:'Τμηματοποιημένη κατανομή',decision:'Φιλτράρισμα ανά κατάσταση'}
});

/** Returns only observed values. Missing denominator is null, never 0%. */
export function instrumentalSnapshot(tasks,station,asOf){
 const m=operationsTelemetry(tasks,station,asOf);
 const rows=tasks.filter(t=>t&&t.station===station&&Object.hasOwn(OPS_TEAMS,t.team)&&Object.hasOwn(OPS_STATES,t.status));
 const matrix=teamKeys.map(team=>({team,label:OPS_TEAMS[team],cells:slotKeys.map(slot=>({slot,label:OPS_SLOTS[slot],count:rows.filter(t=>t.team===team&&t.slot===slot).length}))}));
 const historyDates=Array.from({length:7},(_,i)=>{const d=new Date(`${asOf}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-6+i);return d.toISOString().slice(0,10)});
 const byDay=new Map(historyDates.map(date=>[date,0]));let events=0;
 for(const task of rows){if(!Array.isArray(task.history))continue;
  for(const h of task.history){const date=typeof h?.at==='string'?h.at.slice(0,10):null;if(dateValue(date)&&byDay.has(date)){byDay.set(date,byDay.get(date)+1);events++;}}
 }
 return {...m,asOf,source:'task-snapshot',hasHistory:events>0,history:historyDates.map(date=>({date,count:byDay.get(date)})),eventCount:events,
  matrix,teamOrder:teamKeys,slotOrder:slotKeys,
  slotDistribution:slotKeys.map(slot=>({key:slot,label:OPS_SLOTS[slot],count:m.slots[slot].total})),
  statusDistribution:statusKeys.map(status=>({key:status,label:OPS_STATES[status],count:m.counts[status]})),
  verificationPercent:clampedPercent(m.verified,m.closed),
  unfinishedApprovals:m.counts.DONE,
  isEmpty:m.total===0};
}

export function instrumentState({loading=false,error='',configured=true,stale=false,taskCount=0}={}){
 if(!configured)return 'disconnected';
 if(loading)return 'loading';
 if(error)return 'failed';
 if(!Number.isInteger(taskCount)||taskCount<0)return 'invalid';
 if(stale)return 'stale';
 return taskCount===0?'empty':'available';
}
