import {reviewWarnings,shiftInterval,CODE_TO_SHIFT} from './shifts.mjs';
import {reviewWeeklyRest} from './weekly-rest.mjs';

export class ReleaseRejected extends Error {
  constructor(code, message){super(message);this.name='ReleaseRejected';this.status=422;this.code=code;}
}
const day = s => new Date(s+'T00:00:00Z');
const addDays=(date,offset)=>new Date(day(date).getTime()+86400000*offset).toISOString().slice(0,10);
export const daysOfMonth=month=>{
  const n=new Date(Number(month.slice(0,4)), Number(month.slice(5)),0).getDate();
  return Array.from({length:n},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`);
};
/** Complete authoritative context, no unknown day is treated as off duty. */
export function validateRelease(roster,env=process.env){
  if(env.CODEBOOK_APPROVED!=='true') throw new ReleaseRejected('CODEBOOK_NOT_APPROVED','Codebook reconciliation is not approved');
  if(!/^\d+$/.test(String(env.MIN_STAFF_PER_DAY??''))) throw new ReleaseRejected('COVERAGE_NOT_CONFIGURED','Minimum daily staffing is missing');
  const min=Number(env.MIN_STAFF_PER_DAY);
  if(!Number.isSafeInteger(min)||min<1||min>100) throw new ReleaseRejected('COVERAGE_NOT_CONFIGURED','Minimum daily staffing invalid');
  const dates=daysOfMonth(roster.month),emp=roster.employees;
  if(!emp.length)throw new ReleaseRejected('NO_STAFF','No active employees');
  const keys=new Set(emp.map(x=>x.key));
  if(keys.size!==emp.length)throw new ReleaseRejected('DUPLICATE_STAFF','Employee keys are not unique');
  const map=new Map();
  for(const s of roster.context){
    if(!keys.has(s.employeeKey))continue;
    const k=s.employeeKey+'|'+s.date;
    if(map.has(k))throw new ReleaseRejected('DUPLICATE_SHIFTS','Duplicate shift for an employee/date');
    map.set(k,s.code);
  }
  for(const d of dates){
    let coverage=0;
    for(const e of emp){
      const key=e.key+'|'+d,code=map.get(key);
      if(code===undefined||code==='')throw new ReleaseRejected('MISSING_SHIFTS',`Missing required day ${d}`);
      if(!Object.hasOwn(CODE_TO_SHIFT,code))throw new ReleaseRejected('UNMAPPED_SHIFT','Unrecognized shift code');
      if(shiftInterval(code,d))coverage++;
    }
    if(coverage<min)throw new ReleaseRejected('UNDERSTAFFED',`Insufficient staffed shifts for ${d}`);
  }
  const before=addDays(dates[0],-1),after=addDays(dates.at(-1),1);
  for(const e of emp){
    for(const d of [before,after]){
      const code=map.get(e.key+'|'+d);
      if(code===undefined||code===''||!Object.hasOwn(CODE_TO_SHIFT,code)) throw new ReleaseRejected('UNKNOWN_REST_CONTEXT','Adjacent-month rest context is incomplete');
    }
  }
  const alerts=[...reviewWarnings(roster.context,emp),...reviewWeeklyRest(roster.context,emp)];
  if(alerts.some(x=>x.date>=dates[0]&&x.date<=dates.at(-1)))throw new ReleaseRejected('REST_VIOLATION','Rest or unknown-code warning in publishing window');
  return {ready:true,days:dates.length,employees:emp.length,minDailyStaff:min};
}
