import {CODE_TO_SHIFT,reviewWarnings,shiftInterval} from './shifts.mjs';
import {reviewWeeklyRest} from './weekly-rest.mjs';

export const DAYS_EL=['Κυρ','Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ'];
export const MONTH_NAMES_EL=['Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος','Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος'];

export function dateKeys(month){
  if(!/^20\d\d-(0[1-9]|1[0-2])$/.test(month))throw new Error('Invalid month');
  const [year,part]=month.split('-').map(Number);
  const length=new Date(Date.UTC(year,part,0)).getUTCDate();
  return Array.from({length},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`);
}
export function adjacentMonth(month,delta){
  const [y,m]=month.split('-').map(Number);
  const d=new Date(Date.UTC(y,m-1+delta,1));
  return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0');
}
export function dayLabel(iso){return DAYS_EL[new Date(iso+'T12:00:00Z').getUTCDay()];}
export function monthLabel(month){const [y,m]=month.split('-').map(Number);return `${MONTH_NAMES_EL[m-1]} ${y}`;}
export function shiftKind(code){
  if(code==='R')return 'rest';
  if(code==='L'||code==='S')return 'leave';
  if(!code)return 'empty';
  const text=CODE_TO_SHIFT[code];
  if(!text||!text.includes('-'))return 'invalid';
  const hour=Number(text.slice(0,2));
  if(hour>=22)return 'night';
  if(hour>=15)return 'late';
  if(hour>=11)return 'mid';
  return 'early';
}
function normalizeShifts(shifts){return Array.isArray(shifts)?shifts.filter(s=>s&&typeof s.employeeKey==='string'&&typeof s.date==='string'):[];}
export function rosterInsights(month,employees,allShifts,{coverageTarget=0}={}){
  const days=dateKeys(month),people=Array.isArray(employees)?employees:[];
  const shifts=normalizeShifts(allShifts),byKey=new Map();
  for(const s of shifts){if(s.date.startsWith(month))byKey.set(s.employeeKey+'|'+s.date,s);}
  const coverage=days.map(date=>{
    const count={date,total:0,early:0,mid:0,late:0,night:0,rest:0,leave:0,empty:0,invalid:0};
    for(const e of people){const code=byKey.get(e.key+'|'+date)?.code||'';const kind=shiftKind(code);count[kind]++;if(['early','mid','late','night'].includes(kind))count.total++;}
    return {...count,underTarget:coverageTarget>0&&count.total<coverageTarget};
  });
  const relevant=shifts.filter(x=>x.date.startsWith(month));
  const warnings=[...reviewWarnings(shifts,people),...reviewWeeklyRest(shifts,people)].filter(x=>x.date.startsWith(month));
  const types={};for(const w of warnings)types[w.type]=(types[w.type]||0)+1;
  return {days,coverage,warnings,types,employeeCount:people.length,
    assigned:coverage.reduce((n,d)=>n+d.total,0),
    off:coverage.reduce((n,d)=>n+d.rest,0),
    missing:coverage.reduce((n,d)=>n+d.empty,0),
    invalid:coverage.reduce((n,d)=>n+d.invalid,0),
    averageCoverage:coverage.length?coverage.reduce((n,d)=>n+d.total,0)/coverage.length:0,
    minimumCoverage:coverage.length?Math.min(...coverage.map(x=>x.total)):0,
    maximumCoverage:coverage.length?Math.max(...coverage.map(x=>x.total)):0,
    underTargetDays:coverage.filter(x=>x.underTarget).length,
    changedShifts:relevant.length,
    allCodes:CODE_TO_SHIFT};
}
export function quickSearch(employees,query){
  const text=String(query||'').trim().toLocaleLowerCase('el');
  return !text?employees:employees.filter(p=>`${p.name} ${p.key}`.toLocaleLowerCase('el').includes(text));
}
export function isWeekday(date){const d=new Date(date+'T12:00:00Z').getUTCDay();return d!==0&&d!==6;}
export function shiftDuration(code){const interval=shiftInterval(code,'2026-11-01');return interval?(interval.finish-interval.begin)/3600000:0;}
