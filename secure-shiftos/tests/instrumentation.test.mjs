import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticTasks,advanceTask,OPS_TEAMS,OPS_SLOTS} from '../lib/operations/domain.mjs';
import {operationsMatrix,operationsConnectionStatus,matrixHeatLevel} from '../lib/operations/instrumentation.mjs';

test('matrix counts ONLY open tasks grouped by real station, team and slot',()=>{
 const tasks=syntheticTasks('HER');const m=operationsMatrix(tasks,'HER');
 assert.equal(m.source,'operations-task-snapshot');assert.equal(m.totalOpen,6);assert.equal(m.matrix['front-desk'].early.open,1);
 assert.equal(m.matrix['front-desk'].mid.open,1);assert.equal(m.matrix['wash'].late.open,1);
 assert.equal(Object.keys(m.matrix).length,Object.keys(OPS_TEAMS).length);
 assert.equal(Object.keys(m.matrix['wash']).length,Object.keys(OPS_SLOTS).length);
 assert.ok(!('staffing' in m));assert.ok(!('trend' in m));assert.ok(!('demand' in m));
});
test('completed and verified tasks cannot inflate open queue matrix',()=>{
 const tasks=syntheticTasks();let t=tasks[0];t=advanceTask(t,'IN_PROGRESS',{role:'editor',oid:'SIM-EDITOR'},t.revision);
 t=advanceTask(t,'DONE',{role:'editor',oid:'SIM-EDITOR'},t.revision);
 tasks[0]=t;const m=operationsMatrix(tasks,'HER');assert.equal(m.totalOpen,5);assert.equal(m.matrix['front-desk'].early.open,0);
});
test('blocked and urgent counts stay tied to the same open task',()=>{
 const tasks=syntheticTasks();let t=tasks[0];t=advanceTask(t,'IN_PROGRESS',{role:'editor',oid:'SIM-EDITOR'},t.revision);const next=advanceTask(t,'BLOCKED',{role:'editor',oid:'SIM-EDITOR'},t.revision);
 tasks[0]=next;const m=operationsMatrix(tasks,'HER');
 assert.deepEqual(m.matrix['front-desk'].early,{open:1,blocked:1,urgent:1});
});
test('invalid slot and statuses excluded, no phantom team inferred',()=>{
 const tasks=syntheticTasks();const corrupt={...tasks[0],slot:'unknown',id:'99'};
 const m=operationsMatrix([...tasks,corrupt,{...tasks[1],station:'CHQ'}],'HER');
 assert.equal(m.totalOpen,6);assert.equal(m.excluded,1);
});
test('empty or corrupt inputs fail closed',()=>{
 assert.throws(()=>operationsMatrix(null,'HER'),TypeError);
 assert.throws(()=>operationsMatrix([],''),TypeError);
 const m=operationsMatrix([],'HER');assert.equal(m.maxOpen,0);assert.equal(m.totalOpen,0);
});
test('connection status never claims real time, and stale results are identified',()=>{
 const demo=operationsConnectionStatus({demo:true});assert.equal(demo.kind,'synthetic');
 const loading=operationsConnectionStatus({loading:true});assert.equal(loading.kind,'loading');
 const ok=operationsConnectionStatus({lastLoadedAt:'2026-11-25T10:00:00.000Z'});assert.equal(ok.kind,'snapshot');
 assert.ok(!ok.description.toLocaleLowerCase('el').includes('live feed'));
 assert.equal(operationsConnectionStatus({error:'offline',lastLoadedAt:'2026-11-25T10:00:00.000Z'}).kind,'stale');
 assert.equal(operationsConnectionStatus({error:'denied'}).kind,'unavailable');
});

test('matrix levels reflect relative maximum only',()=>{
 assert.equal(matrixHeatLevel(0,0),0);
 assert.equal(matrixHeatLevel(1,20),1);
 assert.equal(matrixHeatLevel(10,20),2);
 assert.equal(matrixHeatLevel(20,20),4);
 assert.throws(()=>matrixHeatLevel(3,2),TypeError);
});
