/**
 * Read-only staffing scenario calculator. Never a legal compliance decision or
 * an inferred booking forecast. Inputs are manual, assumptions are visible.
 */
import {shiftInterval} from './shifts.mjs';

export const WINDOWS=Object.freeze([
  Object.freeze({id:'morning',label:'Πρωινή ζώνη',start:7*60,end:11*60}),
  Object.freeze({id:'midday',label:'Μεσημβρινή ζώνη',start:11*60,end:17*60}),
  Object.freeze({id:'evening',label:'Απογευματινή ζώνη',start:17*60,end:23*60+30}),
]);

export const SCENARIOS=Object.freeze({
  balanced:Object.freeze({label:'Ισορροπημένη',pickups:[.34,.43,.23],returns:[.24,.38,.38]}),
  arrivals:Object.freeze({label:'Πρωινή αιχμή',pickups:[.62,.27,.11],returns:[.22,.43,.35]}),
  late:Object.freeze({label:'Απογευματινή αιχμή',pickups:[.12,.37,.51],returns:[.14,.28,.58]}),
});

function numberIn(value,min,max,fallback){
  const n=Number(value);
  return value===null||value===undefined||value===''||!Number.isFinite(n)?fallback:Math.min(max,Math.max(min,n));
}
export function normalizeScenario(input={}) {
  return {
    pickups:Math.round(numberIn(input.pickups,0,2000,50)),
    returns:Math.round(numberIn(input.returns,0,2000,35)),
    pickupMinutes:numberIn(input.pickupMinutes,1,90,13),
    returnMinutes:numberIn(input.returnMinutes,1,90,10),
    eligiblePercent:numberIn(input.eligiblePercent,5,100,55),
    productivePercent:numberIn(input.productivePercent,10,100,65),
    profile:SCENARIOS[input.profile]?input.profile:'balanced',
  };
}

// Largest-remainder allocation ensures totals are preserved, including small totals.
export function allocateWhole(total,shares) {
  if(!Number.isSafeInteger(total)||total<0||total>2000)throw new RangeError('Total outside simulation range');
  if(!Array.isArray(shares)||shares.length===0||shares.some(x=>!Number.isFinite(x)||x<0))throw new TypeError('Invalid window shares');
  const sum=shares.reduce((a,b)=>a+b,0);
  if(sum<=0)throw new RangeError('At least one positive share required');
  const raw=shares.map(w=>total*w/sum);
  const result=raw.map(x=>Math.floor(x));
  let remaining=total-result.reduce((a,b)=>a+b,0);
  const order=raw.map((n,i)=>({i,frac:n-Math.floor(n)})).sort((a,b)=>b.frac-a.frac||a.i-b.i);
  for(let k=0;k<remaining;k++)result[order[k].i]++;
  return result;
}

function isoDate(value){return typeof value==='string'&&/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
function overlap(aStart,aEnd,bStart,bEnd){return Math.max(0,Math.min(aEnd,bEnd)-Math.max(aStart,bStart));}

/** Only aggregates of employee shifts are returned, never identities or names. */
export function simulateOperationsDay({date,employees=[],shifts=[],scenario={}}={}) {
  if(!isoDate(date))throw new RangeError('Invalid scenario date');
  const inputs=normalizeScenario(scenario),pattern=SCENARIOS[inputs.profile];
  const pickupParts=allocateWhole(inputs.pickups,pattern.pickups);
  const returnParts=allocateWhole(inputs.returns,pattern.returns);
  const people=new Set((Array.isArray(employees)?employees:[]).map(p=>p?.key).filter(x=>typeof x==='string'));
  const byEmployee=new Map();
  const beginDay=Date.parse(date+'T00:00:00Z');
  const previousDate=new Date(beginDay-86400000).toISOString().slice(0,10);
  for(const shift of Array.isArray(shifts)?shifts:[]) {
    if(!shift||!people.has(shift.employeeKey)||![date,previousDate].includes(shift.date))continue;
    const interval=shiftInterval(shift.code,shift.date);
    if(!interval)continue;
    const key=shift.employeeKey+'|'+shift.date;
    // A duplicate exact-day assignment cannot create additional artificial capacity.
    if(!byEmployee.has(key))byEmployee.set(key,interval);
  }
  const intervals=[...byEmployee.values()];
  const windows=WINDOWS.map((window,i)=>{
    const start=beginDay+window.start*60000,end=beginDay+window.end*60000,duration=window.end-window.start;
    const rawEmployeeMinutes=intervals.reduce((n,v)=>n+overlap(v.begin,v.finish,start,end)/60000,0);
    const staffAverage=rawEmployeeMinutes/duration;
    const capacityMinutes=rawEmployeeMinutes*inputs.eligiblePercent/100*inputs.productivePercent/100;
    const demandMinutes=pickupParts[i]*inputs.pickupMinutes+returnParts[i]*inputs.returnMinutes;
    const gapMinutes=Math.max(0,demandMinutes-capacityMinutes);
    const utilization=capacityMinutes===0?(demandMinutes>0?null:0):Math.round(demandMinutes/capacityMinutes*100);
    const extraStaff=gapMinutes===0?0:Math.ceil(gapMinutes/(duration*inputs.productivePercent/100));
    return {id:window.id,label:window.label,hours:`${String(Math.floor(window.start/60)).padStart(2,'0')}:${String(window.start%60).padStart(2,'0')}–${String(Math.floor(window.end/60)).padStart(2,'0')}:${String(window.end%60).padStart(2,'0')}`,
      pickups:pickupParts[i],returns:returnParts[i],staffAverage:Math.round(staffAverage*10)/10,
      demandMinutes:Math.round(demandMinutes),capacityMinutes:Math.round(capacityMinutes),
      gapMinutes:Math.ceil(gapMinutes),extraStaff,utilization,
      status:gapMinutes>0?'attention':capacityMinutes===0?'unknown':utilization>=80?'watch':'within-assumptions'};
  });
  return {date,inputs,windows,staffedHours:Math.round(intervals.reduce((n,v)=>n+overlap(v.begin,v.finish,beginDay+7*3600000,beginDay+(23*60+30)*60000)/3600000,0)*10)/10,
    attentionWindows:windows.filter(w=>w.status==='attention').length,
    totalGapMinutes:windows.reduce((n,w)=>n+w.gapMinutes,0),
    note:'Ενδεικτικό σενάριο από χειροκίνητες παραδοχές. Δεν είναι πρόβλεψη κρατήσεων, ακριβής υπολογισμός φόρτου ή έγκριση στελέχωσης.'};
}
