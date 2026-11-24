/** Rental station operations domain. Pure, deterministic business rules.
 * No customer, reservation, registration plate, email, phone, or address fields.
 */
export const OPS_TYPES=Object.freeze({
  PICKUP_READY:{title:'Προετοιμασία παράδοσης',team:'front-desk',icon:'key-round'},
  RETURN_CHECK:{title:'Έλεγχος επιστροφής',team:'returns',icon:'clipboard-check'},
  WASH_PREP:{title:'Πλύσιμο / προετοιμασία',team:'wash',icon:'droplets'},
  SHUTTLE_RUN:{title:'Μεταφορά shuttle',team:'shuttle',icon:'bus-front'},
  KIOSK_HELP:{title:'Υποστήριξη kiosk',team:'front-desk',icon:'monitor'},
  FLEET_HANDOFF:{title:'Παράδοση στόλου',team:'fleet',icon:'car-front'},
  INCIDENT_REVIEW:{title:'Έλεγχος περιστατικού',team:'manager',icon:'shield-alert'},
});
export const OPS_TEAMS=Object.freeze({
  'front-desk':'Front Desk',returns:'Returns',wash:'Πλύσιμο',shuttle:'Shuttle',fleet:'Fleet',manager:'Supervisor'
});
export const OPS_STATES=Object.freeze({
  NEW:'Νέα',IN_PROGRESS:'Σε εξέλιξη',BLOCKED:'Σε αναμονή',DONE:'Ολοκληρώθηκε',VERIFIED:'Επαληθεύτηκε'
});
export const OPS_SLOTS=Object.freeze({early:'Πρωί',mid:'Μεσημέρι',late:'Απόγευμα'});
export const OPS_PRIORITY=Object.freeze({normal:'Κανονική',urgent:'Επείγουσα'});
const transitions=Object.freeze({
  NEW:['IN_PROGRESS'],IN_PROGRESS:['BLOCKED','DONE'],BLOCKED:['IN_PROGRESS'],DONE:['VERIFIED','IN_PROGRESS'],VERIFIED:[]
});
export class OperationsError extends Error{constructor(code,message,status=400){super(message);this.name='OperationsError';this.code=code;this.status=status;}}
const exactKeys=(obj,allowed)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&Object.keys(obj).every(k=>allowed.includes(k));
const isoDate=s=>typeof s==='string'&&/^20\d\d-(0[1-9]|1[0-2])-\d\d$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function validateCreate(input){
  if(!exactKeys(input,['type','dueDate','slot','priority','team','reference']))throw new OperationsError('INVALID_FIELDS','Άγνωστα στοιχεία εργασίας.');
  const {type,dueDate,slot,priority='normal',team=OPS_TYPES[input.type]?.team,reference=''}=input;
  if(!Object.hasOwn(OPS_TYPES,type))throw new OperationsError('INVALID_TYPE','Επέλεξε μία από τις διαθέσιμες εργασίες.');
  if(!isoDate(dueDate))throw new OperationsError('INVALID_DATE','Μη έγκυρη ημερομηνία.');
  if(!Object.hasOwn(OPS_SLOTS,slot)||!Object.hasOwn(OPS_PRIORITY,priority)||!Object.hasOwn(OPS_TEAMS,team))throw new OperationsError('INVALID_SELECTION','Επέλεξε έγκυρη ζώνη, προτεραιότητα και ομάδα.');
  // A non-identifying operational token only. A vehicle plate, booking reference or personal data must never go here.
  if(typeof reference!=='string'||reference.length>24||reference!==''&&!/^SIM-[A-Z0-9-]{1,20}$/.test(reference))throw new OperationsError('INVALID_REFERENCE','Μόνο ανώνυμος κωδικός SIM-... (όχι πινακίδες, κρατήσεις ή στοιχεία πελατών).');
  return {type,dueDate,slot,priority,team,reference};
}
export function validateTransition(input){
  if(!exactKeys(input,['id','etag','next']))throw new OperationsError('INVALID_FIELDS','Άγνωστα στοιχεία αλλαγής.');
  if(typeof input.id!=='string'||!/^\d{1,19}$/.test(input.id))throw new OperationsError('INVALID_ID','Μη έγκυρη εργασία.');
  if(typeof input.etag!=='string'||input.etag.length<3||input.etag.length>250||input.etag==='*')throw new OperationsError('REVISION_REQUIRED','Απαιτείται ακριβής έκδοση της εργασίας.',428);
  if(!Object.hasOwn(OPS_STATES,input.next))throw new OperationsError('INVALID_STATE','Άγνωστη νέα κατάσταση.');
  return input;
}
export function ensureTransition(task,next,role){
  if(!['manager','editor'].includes(role))throw new OperationsError('DENIED','Απαιτείται προσωπική εταιρική πρόσβαση.',403);
  if(!Object.hasOwn(OPS_STATES,task?.status))throw new OperationsError('BAD_STATE','Η τρέχουσα κατάσταση δεν είναι έγκυρη.',409);
  if(!transitions[task.status].includes(next))throw new OperationsError('TRANSITION_DENIED','Αυτή η αλλαγή δεν επιτρέπεται από την τρέχουσα κατάσταση.',409);
  if((next==='VERIFIED'||task.status==='DONE')&&role!=='manager')throw new OperationsError('MANAGER_REQUIRED','Η τελική επαλήθευση και επαναφορά ολοκληρωμένων εργασιών γίνεται από προϊστάμενο.',403);
  return true;
}
export function allowedTransitions(task,role){return (transitions[task.status]||[]).filter(s=>{try{ensureTransition(task,s,role);return true;}catch{return false;}});}
export function makeTask(id,input,station,actor,now=new Date().toISOString()){
  const fields=validateCreate(input);
  if(typeof id!=='string'||!id||typeof station!=='string'||!/^[A-Z0-9_-]{2,24}$/.test(station)||!actor?.oid)throw new OperationsError('INVALID_ACTOR','Η καταχώριση απαιτεί έγκυρη εξουσιοδότηση.',403);
  return {key:id,station,...fields,status:'NEW',revision:1,createdAt:now,updatedAt:now,
    history:[{revision:1,at:now,action:'CREATED',from:null,to:'NEW',actorOid:actor.oid}]};
}
export function advanceTask(task,next,actor,expectedRevision,now=new Date().toISOString()){
  if(!actor?.oid)throw new OperationsError('INVALID_ACTOR','Δεν υπάρχει εξουσιοδοτημένος χειριστής.',403);
  if(!Number.isInteger(expectedRevision)||task.revision!==expectedRevision)throw new OperationsError('EDIT_CONFLICT','Η εργασία έχει ήδη αλλάξει. Κάνε ανανέωση.',409);
  ensureTransition(task,next,actor.role);
  if(!Array.isArray(task.history)||task.history.length>=120)throw new OperationsError('HISTORY_FULL','Απαιτείται αρχειοθέτηση ιστορικού πριν από νέα αλλαγή.',423);
  return {...task,status:next,revision:task.revision+1,updatedAt:now,history:[...task.history,{revision:task.revision+1,at:now,action:'STATUS_CHANGED',from:task.status,to:next,actorOid:actor.oid}]};
}
export function summarizeTasks(tasks,station){const visible=tasks.filter(x=>x.station===station);const counts=Object.fromEntries(Object.keys(OPS_STATES).map(x=>[x,visible.filter(t=>t.status===x).length]));return {total:visible.length,counts,open:counts.NEW+counts.IN_PROGRESS+counts.BLOCKED,urgent:visible.filter(t=>t.priority==='urgent'&&!['VERIFIED','DONE'].includes(t.status)).length};}
export function syntheticTasks(station='HER'){const base=[
 {type:'PICKUP_READY',dueDate:'2026-11-24',slot:'early',priority:'urgent',team:'front-desk',reference:'SIM-001'},
 {type:'RETURN_CHECK',dueDate:'2026-11-24',slot:'mid',priority:'normal',team:'returns',reference:'SIM-002'},
 {type:'WASH_PREP',dueDate:'2026-11-24',slot:'late',priority:'normal',team:'wash',reference:'SIM-003'},
 {type:'SHUTTLE_RUN',dueDate:'2026-11-24',slot:'early',priority:'normal',team:'shuttle',reference:'SIM-004'},
 {type:'KIOSK_HELP',dueDate:'2026-11-25',slot:'mid',priority:'normal',team:'front-desk',reference:'SIM-005'},
 {type:'INCIDENT_REVIEW',dueDate:'2026-11-25',slot:'late',priority:'urgent',team:'manager',reference:'SIM-006'}
 ];return base.map((x,i)=>({...makeTask('SIMTASK-'+String(i+1).padStart(3,'0'),x,station,{oid:'DEMO-MANAGER'},'2026-11-24T10:00:00.000Z'),id:String(i+1),etag:`SIM-${i+1}-1`}));}
