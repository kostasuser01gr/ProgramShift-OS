import test from 'node:test';
import assert from 'node:assert/strict';
import {allocateWhole,normalizeScenario,simulateOperationsDay,WINDOWS} from '../lib/operations-simulator.mjs';
const date='2026-11-22',e=[{key:'A'},{key:'B'}];
const shifts=[{employeeKey:'A',date,code:'203'},{employeeKey:'B',date,code:'402'}];
test('allocation preserves counts and deterministic ties',()=>{
 for(const total of [0,1,2,7,31,50,2000])assert.equal(allocateWhole(total,[.34,.43,.23]).reduce((a,b)=>a+b,0),total);
 assert.deepEqual(allocateWhole(2,[1,1,1]),[1,1,0]);
});
test('invalid share arrays are rejected',()=>{
 assert.throws(()=>allocateWhole(-1,[1]),RangeError);assert.throws(()=>allocateWhole(2001,[1]),RangeError);
 assert.throws(()=>allocateWhole(1,[0,0]),RangeError);assert.throws(()=>allocateWhole(1,[.5,-.5]),TypeError);
});
test('scenario parameters clamp safely and invalid mode resets',()=>{
 const s=normalizeScenario({pickups:'99999',returns:'-4',pickupMinutes:'NaN',eligiblePercent:0,profile:'__x'});
 assert.deepEqual([s.pickups,s.returns,s.pickupMinutes,s.eligiblePercent,s.profile],[2000,0,13,5,'balanced']);
});
test('all windows preserve volume and avoid unlisted staff',()=>{
 const r=simulateOperationsDay({date,employees:e,shifts:[...shifts,{employeeKey:'UNKNOWN',date,code:'203'}],scenario:{pickups:47,returns:23}});
 assert.equal(r.windows.length,3);assert.equal(r.windows.reduce((n,w)=>n+w.pickups,0),47);assert.equal(r.windows.reduce((n,w)=>n+w.returns,0),23);
 assert.equal(r.windows[0].staffAverage,1);assert.equal(r.windows[2].staffAverage,1);
 assert.equal(r.windows[1].staffAverage,0.9); // 4h morning + 1.5h evening / 6h
 assert(!JSON.stringify(r).includes('UNKNOWN'));
});
test('midnight rollover shift from previous date contributes only visible minutes',()=>{
 const prev='2026-11-21';const r=simulateOperationsDay({date,employees:e,shifts:[{employeeKey:'A',date:prev,code:'217'}],scenario:{pickups:0,returns:0}});
 assert.equal(r.staffedHours,0);assert.equal(r.windows[0].staffAverage,0);
});
test('duplicates do not inflate capacity and no role inference',()=>{
 const s=[{employeeKey:'A',date,code:'203'}];const a=simulateOperationsDay({date,employees:e,shifts:s,scenario:{pickups:20,returns:0}});
 const b=simulateOperationsDay({date,employees:e,shifts:[...s,...s],scenario:{pickups:20,returns:0}});
 assert.deepEqual(b.windows,a.windows);assert(!Object.hasOwn(a,'employeeNames'));
});
test('missing staff yields explicit attention when demand exists',()=>{
 const r=simulateOperationsDay({date,employees:e,shifts:[],scenario:{pickups:50,returns:10}});
 assert(r.windows.every(w=>w.status==='attention'));assert(r.totalGapMinutes>0);
});
test('zero demand and zero staff does not falsely show verified coverage',()=>{
 const r=simulateOperationsDay({date,scenario:{pickups:0,returns:0}});
 assert(r.windows.every(w=>w.status==='unknown'));
});
test('invalid dates rejected including nonexistent days',()=>{
 for(const x of ['2026-02-30','2026-13-01','bad','2026-11-1'])assert.throws(()=>simulateOperationsDay({date:x}),RangeError);
});
test('profile shifts arrival concentration without changing totals',()=>{
 const a=simulateOperationsDay({date,employees:e,shifts,scenario:{pickups:100,returns:10,profile:'arrivals'}});
 const b=simulateOperationsDay({date,employees:e,shifts,scenario:{pickups:100,returns:10,profile:'late'}});
 assert(a.windows[0].pickups>b.windows[0].pickups);
 assert.equal(a.windows.reduce((n,w)=>n+w.pickups,0),b.windows.reduce((n,w)=>n+w.pickups,0));
});
test('window ordering is explicit and fixed',()=>assert.deepEqual(WINDOWS.map(x=>x.id),['morning','midday','evening']));
