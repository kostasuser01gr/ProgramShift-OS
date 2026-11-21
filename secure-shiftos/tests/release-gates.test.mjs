import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRelease,ReleaseRejected,daysOfMonth} from '../lib/release-gates.mjs';
const month='2026-11';
function fixture(){
  const employees=['a','b','c'].map(key=>({key,name:'Synthetic '+key}));
  const days=[...daysOfMonth(month)];
  const dates=['2026-10-31',...days,'2026-12-01'];
  const context=dates.flatMap((date,i)=>employees.map((e,j)=>({employeeKey:e.key,date,code:(i+j*2)%7>=4?'R':'203'})));
  return {month,employees,context,shifts:context.filter(s=>s.date.startsWith(month))};
}
const env={CODEBOOK_APPROVED:'true',MIN_STAFF_PER_DAY:'1'};
test('valid supervised roster can pass when context and coverage are complete',()=>{
  const r=validateRelease(fixture(),env);assert.equal(r.ready,true);assert.equal(r.days,30);
});
test('all-rest program cannot publish',()=>{
  const r=fixture();r.context=r.context.map(x=>({...x,code:'R'}));
  assert.throws(()=>validateRelease(r,env),e=>e.code==='UNDERSTAFFED');
});
test('unknown code and conflicting duplicate rows reject publication',()=>{
  const r=fixture();r.context.find(x=>x.date==='2026-11-02').code='999';
  assert.throws(()=>validateRelease(r,env),e=>e.code==='UNMAPPED_SHIFT');
  const x=fixture();x.context.push({...x.context[4]});
  assert.throws(()=>validateRelease(x,env),e=>e.code==='DUPLICATE_SHIFTS');
});
test('unknown adjacent month state does not count as 35-hour rest',()=>{
  const r=fixture();r.context=r.context.filter(x=>x.date!=='2026-10-31');
  assert.throws(()=>validateRelease(r,env),e=>e.code==='UNKNOWN_REST_CONTEXT');
});
test('codebook and coverage are approval gates, not decoration',()=>{
  assert.throws(()=>validateRelease(fixture(),{...env,CODEBOOK_APPROVED:'false'}),e=>e.code==='CODEBOOK_NOT_APPROVED');
  assert.throws(()=>validateRelease(fixture(),{CODEBOOK_APPROVED:'true'}),e=>e.code==='COVERAGE_NOT_CONFIGURED');
  assert.throws(()=>validateRelease(fixture(),{...env,MIN_STAFF_PER_DAY:'100'}),e=>e.code==='UNDERSTAFFED');
});
