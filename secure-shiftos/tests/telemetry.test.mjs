import test from 'node:test';
import assert from 'node:assert/strict';
import {operationsTelemetry,operationsRecentActivity,matchesTaskStatus} from '../lib/operations/telemetry.mjs';
import {syntheticTasks,advanceTask} from '../lib/operations/domain.mjs';
import {UI_MOTION,motionProps} from '../lib/ui-motion-policy.mjs';
const day='2026-11-24';
test('telemetry derives exact counts and has no invented trends',()=>{
 const tasks=syntheticTasks();const m=operationsTelemetry(tasks,'HER',day);
 assert.equal(m.total,6);assert.equal(m.open,6);assert.equal(m.closed,0);assert.equal(m.verified,0);assert.equal(m.overdue,0);assert.equal(m.dueToday,4);assert.equal(m.urgentOpen,2);
 assert.equal(m.teams['front-desk'].total,2);assert.equal(m.slots.early.total,2);
 assert.equal(m.completionPercent,0);assert.equal(Object.hasOwn(m,'revenue'),false);assert.equal(Object.hasOwn(m,'trend'),false);
});
test('transitions recalculate status and close urgent task',()=>{
 const rows=syntheticTasks(), r=rows[0];const active=advanceTask(r,'IN_PROGRESS',{role:'editor',oid:'DEMO-E'},1,'2026-11-24T12:00:00Z');
 const updated=rows.map((x,i)=>i===0?active:x);
 const m=operationsTelemetry(updated,'HER','2026-11-25');
 assert.equal(m.counts.IN_PROGRESS,1);assert.equal(m.overdue,4);assert.equal(m.urgentOpen,2);
 const recent=operationsRecentActivity(updated,'HER');assert.equal(recent[0].to,'IN_PROGRESS');assert.equal(recent[0].from,'NEW');
 assert.equal(recent[0].actorOid,undefined);
});
test('completion percentage only when denominator is valid',()=>{
 const x=syntheticTasks()[0];const done={...x,status:'DONE',revision:2};
 const m=operationsTelemetry([done],'HER','2026-11-27');assert.equal(m.closed,1);assert.equal(m.overdue,0);assert.equal(m.completionPercent,100);
 const none=operationsTelemetry([],'HER',day);assert.equal(none.completionPercent,null);assert.equal(none.total,0);
});
test('isolates station data and discards invalid records',()=>{
 const a=syntheticTasks(),b={...a[0],station:'CHQ'};
 assert.equal(operationsTelemetry([...a,b],'HER',day).total,a.length);
 assert.equal(operationsRecentActivity([...a,b],'HER',100).length,a.length);
});
test('validates date and event limits to fail closed',()=>{
 assert.throws(()=>operationsTelemetry([], 'HER','2026-02-30'),/Invalid/);
 assert.throws(()=>operationsTelemetry([], 'HER',null),/Invalid/);
 assert.throws(()=>operationsRecentActivity([], 'HER',999),/Invalid/);
 assert.throws(()=>operationsTelemetry(null,'HER',day),/Invalid/);
});
test('motion policy favors short transitions and instant reduced-motion state',()=>{
 assert.equal(UI_MOTION.panel<=0.3,true);assert.equal(UI_MOTION.fast<=0.15,true);
 assert.equal(motionProps('panel',true).transition.duration,0);
 assert.equal(motionProps('panel',true).initial,false);
 assert.deepEqual(motionProps('notice',false).animate,{opacity:1,y:0});
});
test('telemetry does not misstate staff capacity',()=>{
 const m=operationsTelemetry(syntheticTasks(),'HER',day);
 assert.equal('staffing' in m,false);
 assert.equal('capacity' in m,false);
 assert.ok(m.teams.manager.total>=1);
});

test('OPEN filter includes all unfinished states, not only NEW',()=>{
 assert.equal(matchesTaskStatus({status:'NEW'},'OPEN'),true);
 assert.equal(matchesTaskStatus({status:'IN_PROGRESS'},'OPEN'),true);
 assert.equal(matchesTaskStatus({status:'BLOCKED'},'OPEN'),true);
 assert.equal(matchesTaskStatus({status:'DONE'},'OPEN'),false);
 assert.equal(matchesTaskStatus({status:'VERIFIED'},'OPEN'),false);
 assert.equal(matchesTaskStatus({status:'NEW'},'IN_PROGRESS'),false);
});
