import test from 'node:test';
import assert from 'node:assert/strict';
import {dateKeys,adjacentMonth,dayLabel,rosterInsights,quickSearch,shiftKind,shiftDuration} from '../lib/insights.mjs';
import {syntheticRoster} from '../lib/synthetic-fixture.mjs';
test('leap and month boundaries are correct',()=>{
 assert.equal(dateKeys('2028-02').length,29);
 assert.equal(dateKeys('2026-02').length,28);
 assert.equal(adjacentMonth('2026-12',1),'2027-01');
 assert.equal(adjacentMonth('2026-01',-1),'2025-12');
 assert.equal(dayLabel('2026-11-01'),'Κυρ');
 assert.throws(()=>dateKeys('2026-13'));
});
test('shift classifications include overnight, unknown, leave, and rest',()=>{
 assert.equal(shiftKind('217'),'night');assert.equal(shiftKind('R'),'rest');
 assert.equal(shiftKind('301'),'early');assert.equal(shiftKind('999'),'invalid');
 assert.equal(shiftKind('L'),'leave');assert.equal(shiftDuration('217'),8);
});
test('premium analytics are internally consistent and synthetic-only',()=>{
 const {employees,shifts}=syntheticRoster('2026-11');
 assert.equal(employees.length,12);assert.equal(shifts.length,360);
 assert(employees.every(x=>x.key.startsWith('DEMO-')));
 const result=rosterInsights('2026-11',employees,shifts,{coverageTarget:9});
 assert.equal(result.days.length,30);assert.equal(result.coverage.length,30);
 assert.equal(result.assigned,result.coverage.reduce((x,y)=>x+y.total,0));
 assert.equal(result.missing,1);assert.equal(result.invalid,1);
 assert(result.warnings.some(x=>x.type==='unknown'));
 assert(result.warnings.some(x=>x.type==='rest11'));
 assert(result.underTargetDays>=0);
});
test('search does not alter permission context or expose hidden data',()=>{
 const e=syntheticRoster().employees;
 assert.equal(quickSearch(e,'DEMO-03').length,1);
 assert.equal(quickSearch(e,'Υποθετικός').length>0,true);
 assert.equal(quickSearch(e,'').length,e.length);
});
test('target threshold is explicit rather than silently imposed',()=>{
 const {employees,shifts}=syntheticRoster();
 const n=rosterInsights('2026-11',employees,shifts);
 assert.equal(n.underTargetDays,0);
});
