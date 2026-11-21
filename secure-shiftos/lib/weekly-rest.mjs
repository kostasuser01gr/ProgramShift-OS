import {shiftInterval} from './shifts.mjs';
import {isDate} from './access.mjs';

/** Informational check, not legal compliance certification.
 *  We only flag an insufficient 35h weekly break when the 7-day period has explicit
 *  shift codes for every date and both adjacent dates are provided. Otherwise UNKNOWN.
 *  This avoids treating missing data as days off. Leave codes are non-working.
 */
export function reviewWeeklyRest(shifts,employees,minHours=35){
  const byEmployee=new Map();
  for(const x of shifts){
    if(!x.employeeKey||!isDate(x.date))continue;
    if(!byEmployee.has(x.employeeKey))byEmployee.set(x.employeeKey,new Map());
    byEmployee.get(x.employeeKey).set(x.date,x.code);
  }
  const out=[];
  for(const [key,schedule] of byEmployee){
    const dates=Array.from(schedule.keys()).sort(), name=employees.find(e=>e.key===key)?.name||key;
    if(dates.length<9)continue;
    for(let i=1;i<=dates.length-8;i++){
      const start=new Date(dates[i]+'T00:00:00Z');
      let codes=[], complete=true;
      for(let j=-1;j<=7;j++){
        const day=new Date(start.getTime()+j*86400000).toISOString().slice(0,10);
        const code=schedule.get(day);
        if(code===undefined||code===''){complete=false;break;}
        codes.push({date:day,code});
      }
      if(!complete)continue;
      const periodStart=start.getTime(),periodEnd=periodStart+7*86400000;
      const intervals=codes.map(x=>shiftInterval(x.code,x.date)).filter(Boolean).sort((a,b)=>a.begin-b.begin);
      if(!intervals.length)continue;
      let cursor=periodStart, longest=0;
      for(const interval of intervals){
        if(interval.finish<=periodStart)continue;
        if(interval.begin>=periodEnd)break;
        if(interval.begin>cursor)longest=Math.max(longest,interval.begin-cursor);
        cursor=Math.max(cursor,interval.finish);
      }
      longest=Math.max(longest,Math.max(0,periodEnd-cursor));
      const h=longest/3600000;
      if(h<minHours)out.push({employeeKey:key,employee:name,date:dates[i],type:'rest35',message:`Έλεγχος συνεχούς εβδομαδιαίας ανάπαυσης: ${h.toFixed(1)} ώρες (<${minHours})`,advisory:true});
    }
  }
  return out;
}
