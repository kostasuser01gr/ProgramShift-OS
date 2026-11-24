/** Snapshot-only operational metrics. All values derive from provided task records.
 * Never manufacture history, staffing requirements, vehicle counts or live activity.
 */
import {OPS_TEAMS, OPS_STATES, OPS_SLOTS} from './domain.mjs';
const CLOSED = new Set(['DONE','VERIFIED']);
const isDate = value => typeof value === 'string' && /^20\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0,10) === value;
export function operationsTelemetry(tasks, station, asOf) {
  if (!Array.isArray(tasks) || typeof station !== 'string' || !isDate(asOf)) throw new TypeError('Invalid telemetry input');
  const rows = tasks.filter(t => t && t.station === station && Object.hasOwn(OPS_STATES,t.status) && Object.hasOwn(OPS_TEAMS,t.team));
  const counts = Object.fromEntries(Object.keys(OPS_STATES).map(x => [x,0]));
  const teams = Object.fromEntries(Object.keys(OPS_TEAMS).map(team => [team,{total:0,open:0,blocked:0,verified:0}]));
  const slots = Object.fromEntries(Object.keys(OPS_SLOTS).map(slot => [slot,{total:0,open:0,blocked:0}]));
  let overdue=0, dueToday=0, urgentOpen=0;
  for (const task of rows) {
    const open=!CLOSED.has(task.status);
    counts[task.status]++;
    teams[task.team].total++;
    if(open)teams[task.team].open++;
    if(task.status==='BLOCKED')teams[task.team].blocked++;
    if(task.status==='VERIFIED')teams[task.team].verified++;
    if(Object.hasOwn(slots,task.slot)){
      slots[task.slot].total++;
      if(open)slots[task.slot].open++;
      if(task.status==='BLOCKED')slots[task.slot].blocked++;
    }
    if(open && isDate(task.dueDate)){
      if(task.dueDate<asOf)overdue++;
      if(task.dueDate===asOf)dueToday++;
    }
    if(open&&task.priority==='urgent')urgentOpen++;
  }
  const total=rows.length, closed=counts.DONE+counts.VERIFIED, open=total-closed;
  return {source:'roster-operations-tasks',asOf,total,open,closed,blocked:counts.BLOCKED,verified:counts.VERIFIED,urgentOpen,overdue,dueToday,completionPercent:total>0?Math.round(closed*100/total):null,counts,teams,slots};
}
export function operationsRecentActivity(tasks,station,limit=6) {
  if(!Array.isArray(tasks)||!Number.isInteger(limit)||limit<0||limit>100)throw new TypeError('Invalid activity input');
  return tasks.filter(t=>t?.station===station&&Array.isArray(t.history)).flatMap(t=>t.history.filter(h=>h&&typeof h.at==='string'&&/^20\d\d-/.test(h.at)).map(h=>({key:`${t.key||t.id}:${h.revision}`,at:h.at,from:h.from,to:h.to,type:t.type,reference:t.reference||'',action:h.action}))).sort((a,b)=>b.at.localeCompare(a.at)||a.key.localeCompare(b.key)).slice(0,limit);
}

/** Matches one visible board filter; OPEN is a union, not the NEW lane. */
export function matchesTaskStatus(task,filter='all'){
  if(filter==='all')return true;
  if(filter==='OPEN')return ['NEW','IN_PROGRESS','BLOCKED'].includes(task?.status);
  return Object.hasOwn(OPS_STATES,filter)&&task?.status===filter;
}
