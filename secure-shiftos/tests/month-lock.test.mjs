import test from 'node:test';
import assert from 'node:assert/strict';
import {withMonthLock,MonthLocked} from '../lib/month-lock.mjs';
function store(){
  let etag=1, lock='', status='REVIEW';
  return {
    read:async()=>({id:'1',etag:`"p${etag}"`,status,mutationLock:lock}),
    patch:async(id,tag,fields)=>{
      if(tag!==`"p${etag}"`){const e=new Error('etag conflict');e.status=412;throw e;}
      if('MutationLock'in fields)lock=fields.MutationLock;
      if('Status'in fields)status=fields.Status;
      etag++;
    },
    state:()=>({etag,lock,status})
  };
}
test('concurrent change cannot pass same lock and completed edit unlocks',async()=>{
  const x=store();let entered;const started=new Promise(r=>entered=r);let resume;const hold=new Promise(r=>resume=r);
  const edit=withMonthLock(x,'2026-11',async()=>{entered();await hold;return 'edited';});
  await started;
  await assert.rejects(()=>withMonthLock(x,'2026-11',async()=>{throw Error('must never run')}),MonthLocked);
  assert.notEqual(x.state().lock,'');
  resume();assert.equal(await edit,'edited');assert.equal(x.state().lock,'');
});
test('errors release lock, broken release keeps operations blocked',async()=>{
  const x=store();await assert.rejects(()=>withMonthLock(x,'2026-11',async()=>{throw Error('application write failed')}),/application write failed/);
  assert.equal(x.state().lock,'');
  let attempt=0;const y=store();const faulty={read:y.read,patch:async(...a)=>{if(++attempt===2)throw Error('Graph down');return y.patch(...a)}};
  await assert.rejects(()=>withMonthLock(faulty,'2026-11',async()=>1),MonthLocked);
  assert.notEqual(y.state().lock,'');
  await assert.rejects(()=>withMonthLock(y,'2026-11',async()=>1),MonthLocked);
});
