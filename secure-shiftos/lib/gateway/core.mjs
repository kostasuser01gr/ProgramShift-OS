/** ShiftOS gateway: one deterministic domain kernel, multiple controlled interfaces.
 * No network IO, identity persistence, MCP session grants or writes occur here.
 * Upstream adapters must authenticate and supply explicitly scoped roster data.
 */
import {rosterInsights,dateKeys} from '../insights.mjs';
import {simulateOperationsDay} from '../operations-simulator.mjs';
import {decisionInbox} from '../decision-inbox.mjs';
import {CODE_TO_SHIFT} from '../shifts.mjs';

export const TOOL_SCHEMAS=Object.freeze([
  {name:'roster.read',title:'Σύνοψη προγράμματος',description:'Επιστρέφει μόνο συγκεντρωτικά στοιχεία, χωρίς ονόματα προσωπικού.',properties:{month:{type:'string'}},required:['month']},
  {name:'coverage.analyze',title:'Έλεγχος κάλυψης',description:'Αριθμοί καταχωρισμένων βαρδιών ανά ημέρα και εκκρεμότητες.',properties:{month:{type:'string'},date:{type:'string'}},required:['month']},
  {name:'coverage.simulate',title:'Προσομοίωση φόρτου',description:'What-if φόρτος από ρητές παραδοχές. Δεν προβλέπει πραγματικές κρατήσεις.',properties:{month:{type:'string'},date:{type:'string'},scenario:{type:'object'}},required:['month','date']},
  {name:'shift.propose',title:'Πρόταση βάρδιας',description:'Αξιολογεί υποθετική αλλαγή. Δεν τροποποιεί ούτε αποθηκεύει το πρόγραμμα.',properties:{month:{type:'string'},date:{type:'string'},employeeKey:{type:'string'},code:{type:'string'}},required:['month','date','employeeKey','code']},
  {name:'approval.request',title:'Προεπισκόπηση έγκρισης',description:'Εξηγεί τις προϋποθέσεις έγκρισης. ΔΕΝ υποβάλλει αίτημα.',properties:{month:{type:'string'}},required:['month']},
  {name:'manual.search',title:'Αναζήτηση οδηγιών',description:'Συνθετική εκπαιδευτική γνώση μόνο στο demo· παραγωγή απενεργοποιημένη.',properties:{month:{type:'string'},query:{type:'string'}},required:['month','query']},
  {name:'audit.history',title:'Ιστορικό ενεργειών',description:'Στο demo επιστρέφει προσωρινές ενέργειες· στη λειτουργία παραγωγής απαιτείται ανεξάρτητο audit store.',properties:{month:{type:'string'}},required:['month']},
]);
export const TOOL_NAMES=Object.freeze(TOOL_SCHEMAS.map(t=>t.name));
export function toolCatalog(){return TOOL_SCHEMAS.map(t=>({name:t.name,title:t.title,description:t.description,readOnly:true,inputSchema:{type:'object',properties:t.properties,required:t.required,additionalProperties:false}}));}
export class GatewayError extends Error{constructor(code,message,status=400){super(message);this.name='GatewayError';this.code=code;this.status=status;}}
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const validMonth=x=>typeof x==='string'&&/^20\d{2}-(0[1-9]|1[0-2])$/.test(x);
const validDate=x=>typeof x==='string'&&/^20\d{2}-(0[1-9]|1[0-2])-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
function checkArgs(tool,args){
 if(!isObject(args))throw new GatewayError('BAD_INPUT','Τα στοιχεία της εντολής πρέπει να είναι αντικείμενο.');
 const t=TOOL_SCHEMAS.find(x=>x.name===tool);if(!t)throw new GatewayError('UNKNOWN_TOOL','Αυτή η λειτουργία δεν είναι διαθέσιμη.',404);
 if(Object.keys(args).some(k=>!(k in t.properties)))throw new GatewayError('UNKNOWN_FIELD','Άγνωστο πεδίο εισόδου.');
 if(t.required.some(k=>!(k in args)))throw new GatewayError('REQUIRED_FIELD','Λείπει υποχρεωτικό πεδίο.');
 if(!validMonth(args.month))throw new GatewayError('BAD_MONTH','Μη έγκυρος μήνας.');
 if(args.date!==undefined&&(!validDate(args.date)||!args.date.startsWith(args.month+'-')))throw new GatewayError('BAD_DATE','Η ημερομηνία πρέπει να ανήκει στον επιλεγμένο μήνα.');
 if(args.employeeKey!==undefined&&(typeof args.employeeKey!=='string'||args.employeeKey.length>100||!args.employeeKey.trim()))throw new GatewayError('BAD_EMPLOYEE','Μη έγκυρο αναγνωριστικό εργαζομένου.');
 if(args.code!==undefined&&(typeof args.code!=='string'||args.code.length>12))throw new GatewayError('BAD_CODE','Μη έγκυρος κωδικός βάρδιας.');
 if(args.query!==undefined&&(typeof args.query!=='string'||args.query.length>180||!args.query.trim()))throw new GatewayError('BAD_QUERY','Γράψτε λέξη ή φράση έως 180 χαρακτήρες.');
 if(args.scenario!==undefined){if(!isObject(args.scenario))throw new GatewayError('BAD_SCENARIO','Μη έγκυρο σενάριο.');const allowed=['pickups','returns','pickupMinutes','returnMinutes','eligiblePercent','productivePercent','profile'];if(Object.keys(args.scenario).some(k=>!allowed.includes(k)))throw new GatewayError('BAD_SCENARIO','Άγνωστη παράμετρος σεναρίου.');for(const [k,v] of Object.entries(args.scenario)){if(k==='profile'){if(!['balanced','arrivals','late'].includes(v))throw new GatewayError('BAD_SCENARIO','Άγνωστο μοτίβο ζήτησης.');}else if(typeof v!=='number'||!Number.isFinite(v))throw new GatewayError('BAD_SCENARIO','Οι αριθμητικές παραδοχές πρέπει να είναι αριθμοί.');}}
}
function snapshot(context,month){
 if(!context||!Array.isArray(context.employees)||!Array.isArray(context.shifts))throw new GatewayError('DATA_UNAVAILABLE','Το πρόγραμμα δεν είναι διαθέσιμο.',503);
 if(context.month!==month)throw new GatewayError('MONTH_MISMATCH','Ασυμφωνία περιόδου.',409);
 return rosterInsights(month,context.employees,context.shifts);
}
const isDemo=context=>context.mode==='synthetic';
const output=(tool,month,data,context,notice)=>({ok:true,tool,month,mode:isDemo(context)?'SYNTHETIC_DEMO':'CORPORATE_READ_ONLY',asOf:new Date().toISOString(),data,notice});

const GUIDANCE=Object.freeze([
 {id:'demo-01',title:'Πώς διαβάζω το πρόγραμμα;',body:'Άνοιξε την ενότητα Πρόγραμμα και επίλεξε μήνα. Τα CHECK είναι ενδείξεις που χρειάζονται ανθρώπινο έλεγχο.',source:'ShiftOS tutorial · DEMO',tags:'προγραμμα βαρδιες οδηγος'},
 {id:'demo-02',title:'Πότε δημοσιεύεται ο μήνας;',body:'Πρώτα ελέγχονται οι ελλείψεις, οι κωδικοί και οι κανόνες ανάπαυσης. Η πραγματική δημοσίευση γίνεται μόνο από εξουσιοδοτημένο manager.',source:'ShiftOS tutorial · DEMO',tags:'δημοσιευση εγκριση manager'},
 {id:'demo-03',title:'Τι σημαίνει προσομοίωση;',body:'Η προσομοίωση είναι μαθηματική εκτίμηση με χειροκίνητες παραδοχές και δεν αλλάζει βάρδιες ή κρατήσεις.',source:'ShiftOS tutorial · DEMO',tags:'προσομοιωση φορτος καλυψη'},
 {id:'demo-04',title:'Πώς προστατεύονται τα δεδομένα;',body:'Το synthetic preview δεν περιέχει πραγματικούς εργαζομένους. Για παραγωγή απαιτούνται εταιρικά δικαιώματα Entra/SharePoint.',source:'ShiftOS tutorial · DEMO',tags:'ασφαλεια ελεγχος προσβαση'},
]);
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

/** External callers must supply validated Entra actor through server API, or explicit offline demo. */
export function executeGateway(tool,args,context){
 checkArgs(tool,args);
 if(!isObject(context)||!['manager','editor'].includes(context.role)||!['synthetic','corporate'].includes(context.mode))throw new GatewayError('DENIED','Δεν υπάρχει εξουσιοδοτημένη συνεδρία.',403);
 if(context.mode==='synthetic'&&context.syntheticConfirmed!==true)throw new GatewayError('DENIED','Η χρήση demo πρέπει να δηλωθεί ρητά.',403);
 const i=snapshot(context,args.month);
 if(tool==='roster.read')return output(tool,args.month,{employees:i.employeeCount,assigned:i.assigned,rest:i.off,missing:i.missing,invalid:i.invalid,status:context.status||'UNCONFIGURED',dailyAverage:Number(i.averageCoverage.toFixed(1))},context,'Συγκεντρωτικά στοιχεία, όχι ταυτοποίηση ή νομική βεβαίωση.');
 if(tool==='coverage.analyze')return output(tool,args.month,{days:(args.date?i.coverage.filter(x=>x.date===args.date):i.coverage).map(x=>({date:x.date,total:x.total,early:x.early,mid:x.mid,late:x.late,night:x.night,rest:x.rest,leave:x.leave,missing:x.empty,invalid:x.invalid})),missing:i.missing,invalid:i.invalid,warnings:i.warnings.length},context,'Τα μεγέθη είναι καταχωρισμένες βάρδιες, όχι πραγματικός φόρτος εργασίας.');
 if(tool==='coverage.simulate')return output(tool,args.month,simulateOperationsDay({date:args.date,employees:context.employees,shifts:context.shifts,scenario:args.scenario||{}}),context,'What-if με ρητές παραδοχές, όχι πρόβλεψη κρατήσεων.');
 if(tool==='shift.propose'){
  if(!['DRAFT','REVIEW'].includes(context.status))return output(tool,args.month,{proposed:false,persisted:false,reason:'Η περίοδος δεν είναι επεξεργάσιμη.'},context,'Δεν έγινε καμία αλλαγή.');
  if(!context.employees.some(x=>x.key===args.employeeKey))throw new GatewayError('NOT_FOUND','Ο εργαζόμενος δεν υπάρχει στον επιλεγμένο μήνα.',404);
  if(!Object.prototype.hasOwnProperty.call(CODE_TO_SHIFT,args.code)&&args.code!=='')throw new GatewayError('BAD_CODE','Ο κωδικός δεν ανήκει στον γνωστό πίνακα.',400);
  const match=context.shifts.filter(s=>s.employeeKey===args.employeeKey&&s.date===args.date);
  if(match.length>1)throw new GatewayError('AMBIGUOUS_SHIFT','Διπλή εγγραφή βάρδιας: απαιτείται χειροκίνητος έλεγχος.',409);
  const next=context.shifts.filter(s=>!(s.employeeKey===args.employeeKey&&s.date===args.date));next.push({employeeKey:args.employeeKey,date:args.date,code:args.code});
  const after=rosterInsights(args.month,context.employees,next);
  return output(tool,args.month,{proposed:true,persisted:false,date:args.date,currentCode:match[0]?.code??'',proposedCode:args.code,warningCountBefore:i.warnings.length,warningCountAfter:after.warnings.length,missingBefore:i.missing,missingAfter:after.missing,requiresManagerReview:true},context,'Πρόταση μόνο. Δεν αποτελεί έγκριση, νομικό CHECK ή εγγραφή SharePoint.');
 }
 if(tool==='approval.request'){
  const items=decisionInbox({missing:i.missing,invalid:i.invalid,warnings:i.warnings.length,status:context.status||'UNCONFIGURED'});
  return output(tool,args.month,{submitted:false,persisted:false,status:context.status||'UNCONFIGURED',issues:items.map(x=>({id:x.id,title:x.title,description:x.description})),nextStep:'Άνοιξε την εταιρική ροή δημοσίευσης για πραγματική έγκριση.'},context,'Δεν στάλθηκε αίτημα ούτε ειδοποίηση.');
 }
 if(tool==='manual.search'){
  if(!isDemo(context))return output(tool,args.month,{available:false,results:[],reason:'Δεν έχει συνδεθεί εγκεκριμένο Operations Manual.'},context,'Η εταιρική γνώση δεν συμπληρώνεται με συνθετικές οδηγίες.');
  const terms=norm(args.query).split(/\s+/).filter(Boolean);
  const results=GUIDANCE.filter(g=>terms.some(t=>norm(`${g.title} ${g.body} ${g.tags}`).includes(t))).slice(0,6).map(({id,title,body,source})=>({id,title,body,source}));
  return output(tool,args.month,{available:true,approvedCorporate:false,results},context,'Μόνο εκπαιδευτική γνώση demo. Όχι επίσημο εταιρικό εγχειρίδιο.');
 }
 if(tool==='audit.history'){
  if(!isDemo(context))return output(tool,args.month,{available:false,events:[],reason:'Δεν υπάρχει επαληθευμένο durable audit store.'},context,'Μην εκλαμβάνεις το τοπικό UI log ως εταιρικό audit.');
  return output(tool,args.month,{available:true,durable:false,events:(Array.isArray(context.events)?context.events:[]).slice(0,15).map(x=>({time:String(x.time||'').slice(0,12),text:String(x.text||'').slice(0,140)}))},context,'Προσωρινό ιστορικό συνθετικής συνεδρίας, όχι audit trail.');
 }
 throw new GatewayError('UNKNOWN_TOOL','Μη διαθέσιμη λειτουργία.',404);
}
