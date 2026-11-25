import test from 'node:test';
import assert from 'node:assert/strict';
import {instrumentalSnapshot,instrumentState,INSTRUMENT_REGISTRY} from '../lib/operations/instruments.mjs';
import {syntheticTasks,advanceTask,OPS_TEAMS,OPS_SLOTS} from '../lib/operations/domain.mjs';

const today='2026-11-24';
test('every display instrument is traceable to source, unit, chart and decision',()=>{
 assert.equal(Object.keys(INSTRUMENT_REGISTRY).length,6);
 for(const x of Object.values(INSTRUMENT_REGISTRY))for(const prop of ['source','unit','aggregation','refresh','chart','decision'])assert.ok(x[prop]);
});
test('station scope is enforced across all instrument series',()=>{
 const rows=syntheticTasks(),foreign={...rows[0],station:'CHQ'};
 const m=instrumentalSnapshot([...rows,foreign],'HER',today);
 assert.equal(m.total,6);
 assert.equal(m.matrix.reduce((s,x)=>s+x.cells.reduce((a,b)=>a+b.count,0),0),6);
 assert.equal(m.slotDistribution.reduce((s,x)=>s+x.count,0),6);
 assert.equal(m.statusDistribution.reduce((s,x)=>s+x.count,0),6);
 assert.equal(m.matrix.length,Object.keys(OPS_TEAMS).length);
 assert.equal(m.slotDistribution.length,Object.keys(OPS_SLOTS).length);
});
test('missing history is not rendered as fabricated time series',()=>{
 const m=instrumentalSnapshot([],'HER',today);
 assert.equal(m.hasHistory,false);assert.equal(m.total,0);
 assert.equal(m.completionPercent,null);assert.equal(m.verificationPercent,null);
 assert.equal(m.history.length,7);assert.equal(m.eventCount,0);
});
test('history uses actual event dates and no future extrapolation',()=>{
 const rows=syntheticTasks();
 const changed=advanceTask(rows[0],'IN_PROGRESS',{oid:'synthetic-editor',role:'editor'},1,'2026-11-24T10:30:00Z');
 const m=instrumentalSnapshot([changed],'HER',today);
 assert.equal(m.hasHistory,true);assert.equal(m.history.at(-1).count,2);
 assert.equal(m.eventCount,2);
 assert.equal(m.history.filter(x=>x.count>0).length,1);
});
test('verified fraction is undefined before completion, then bounded',()=>{
 const row=syntheticTasks()[0];const a=instrumentalSnapshot([row],'HER',today);
 assert.equal(a.verificationPercent,null);
 const b=instrumentalSnapshot([{...row,status:'DONE'}],'HER',today);
 assert.equal(b.verificationPercent,0);assert.equal(b.completionPercent,100);
 const c=instrumentalSnapshot([{...row,status:'VERIFIED'}],'HER',today);
 assert.equal(c.verificationPercent,100);assert.equal(c.completionPercent,100);
});
test('failed and missing source states are explicit, never live',()=>{
 assert.equal(instrumentState({loading:true,taskCount:0}),'loading');
 assert.equal(instrumentState({error:'offline',taskCount:0}),'failed');
 assert.equal(instrumentState({configured:false}),'disconnected');
 assert.equal(instrumentState({taskCount:0}),'empty');
 assert.equal(instrumentState({taskCount:2}),'available');
 assert.equal(instrumentState({taskCount:2,stale:true}),'stale');
 assert.equal(instrumentState({taskCount:-3}),'invalid');
});
test('invalid date is rejected rather than converted to inaccurate values',()=>{
 assert.throws(()=>instrumentalSnapshot(syntheticTasks(),'HER','2026-02-30'),/Invalid telemetry input/);
});
