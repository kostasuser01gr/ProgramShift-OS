/** Exact, snapshot-only open-work matrix for rental operations. No invented demand/capacity. */
import {OPS_TEAMS,OPS_SLOTS,OPS_STATES} from './domain.mjs';
const OPEN=new Set(['NEW','IN_PROGRESS','BLOCKED']);
export function operationsMatrix(tasks,station){
 if(!Array.isArray(tasks)||typeof station!=='string'||!station)throw new TypeError('Invalid matrix input');
 const teams=Object.keys(OPS_TEAMS), slots=Object.keys(OPS_SLOTS);
 const matrix=Object.fromEntries(teams.map(team=>[team,Object.fromEntries(slots.map(slot=>[slot,{open:0,blocked:0,urgent:0}]))]));
 let totalOpen=0, excluded=0;
 for(const task of tasks){
  if(task?.station!==station)continue;
  if(!Object.hasOwn(OPS_TEAMS,task.team)||!Object.hasOwn(OPS_SLOTS,task.slot)||!Object.hasOwn(OPS_STATES,task.status)){
   excluded++;continue;
  }
  if(!OPEN.has(task.status))continue;
  const cell=matrix[task.team][task.slot];
  cell.open++;totalOpen++;
  if(task.status==='BLOCKED')cell.blocked++;
  if(task.priority==='urgent')cell.urgent++;
 }
 const maxOpen=Math.max(0,...teams.flatMap(team=>slots.map(slot=>matrix[team][slot].open)));
 return {source:'operations-task-snapshot',matrix,teams,slots,totalOpen,maxOpen,excluded};
}
/** Pure state label helper; never calls an unconfigured endpoint "live". */
export function operationsConnectionStatus({demo=false,loading=false,error='',lastLoadedAt=null}={}){
 if(demo)return {kind:'synthetic',label:'Συνθετικό demo · Μόνο στη μνήμη',description:'Δεν χρησιμοποιούνται εταιρικά δεδομένα.'};
 if(error)return {kind:lastLoadedAt?'stale':'unavailable',label:lastLoadedAt?'Μη ενημερωμένα δεδομένα':'Δεν υπάρχει σύνδεση',description:lastLoadedAt?'Εμφανίζεται το τελευταίο επιτυχώς ανακτημένο στιγμιότυπο. Οι αλλαγές έχουν ανασταλεί.':'Δεν έχει επιβεβαιωθεί η σύνδεση με το ιδιωτικό SharePoint.'};
 if(loading&&lastLoadedAt)return {kind:'refreshing',label:'Ανανέωση στιγμιότυπου',description:'Οι αλλαγές έχουν ανασταλεί κατά την ανανέωση.'};
 if(loading)return {kind:'loading',label:'Έλεγχος πρόσβασης',description:'Ανάκτηση εργασιών από το εγκεκριμένο περιβάλλον.'};
 if(lastLoadedAt)return {kind:'snapshot',label:'Διαθέσιμο στιγμιότυπο',description:'Τελευταία επιτυχής ανάκτηση · όχι real-time ροή.'};
 return {kind:'unavailable',label:'Μη επαληθευμένη σύνδεση',description:'Δεν έχουν ανακτηθεί εργασίες από εταιρική πηγή.'};
}

/** Relative visualization level (0..4), never an arbitrary staffing threshold. */
export function matrixHeatLevel(open,maxOpen){
 if(!Number.isInteger(open)||open<0||!Number.isInteger(maxOpen)||maxOpen<0||open>maxOpen)throw new TypeError('Invalid heat values');
 return open===0?0:Math.max(1,Math.ceil(open*4/maxOpen));
}
