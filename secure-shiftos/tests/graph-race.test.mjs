import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore,EditConflict} from '../lib/graph.mjs';
import {daysOfMonth} from '../lib/release-gates.mjs';
import {MonthLocked} from '../lib/month-lock.mjs';

function harness(){
  const month='2026-11';
  const employees=['a','b','c'].map((key,i)=>({id:String(i+1),fields:{EmployeeKey:key,DisplayName:'Demo '+key,Active:true}}));
  const dates=['2026-10-31',...daysOfMonth(month),'2026-12-01'];
  let counter=0,periodVersion=1,lock='',status='REVIEW',codebookApproved=true;
  const shifts=dates.flatMap((date,i)=>employees.map((e,j)=>({id:String(++counter),eTag:'"s1"',fields:{EmployeeKey:e.fields.EmployeeKey,ShiftDate:date,ShiftKey:e.fields.EmployeeKey+'|'+date,ShiftCode:(i+j*2)%7>=4?'R':'203'}})));
  let editEntered, releaseEdit;
  const entered=new Promise(resolve=>editEntered=resolve);
  const hold=new Promise(resolve=>releaseEdit=resolve);
  let stall=false;
  const obj=(body,s=200)=>new Response(JSON.stringify(body),{status:s,headers:{'Content-Type':'application/json'}});
  const fetchImpl=async (path,opt={})=>{
    const url=new URL(path),method=opt.method||'GET',p=url.pathname;
    if(p.includes('/lists/periods/items')){
      if(method==='PATCH'){
        if(opt.headers['If-Match']!==`"p${periodVersion}"`)return obj({error:'stale'},412);
        const fields=JSON.parse(opt.body);
        if('MutationLock'in fields)lock=fields.MutationLock;
        if('Status'in fields)status=fields.Status;
        periodVersion++;return obj({});
      }
      return obj({value:[{id:'1',eTag:`"p${periodVersion}"`,fields:{PeriodKey:month,Status:status,MutationLock:lock}}]});
    }
    if(p.includes('/lists/employees/items'))return obj({value:employees});
    if(p.includes('/lists/shifts/items')){
      const field=/\/lists\/shifts\/items\/(\d+)(\/fields)?$/.exec(p);
      if(method==='PATCH'){
        const shift=shifts.find(s=>s.id===field?.[1]);
        if(!shift)return obj({},404);
        if(opt.headers['If-Match']!==shift.eTag)return obj({},412);
        if(stall){editEntered();await hold;stall=false;}
        const update=JSON.parse(opt.body);
        Object.assign(shift.fields,update);shift.eTag='"s'+(Number(shift.eTag.replace(/\D/g,''))+1)+'"';return obj({});
      }
      if(method==='GET'&&field){const shift=shifts.find(s=>s.id===field[1]);return shift?obj(shift):obj({},404);}
      if(method==='GET')return obj({value:shifts});
    }
    return obj({error:'unknown mock route'},404);
  };
  const env={SHAREPOINT_SITE_ID:'corp.example,aaa,bbb',SHAREPOINT_EMPLOYEES_LIST_ID:'employees',SHAREPOINT_SHIFTS_LIST_ID:'shifts',SHAREPOINT_PERIODS_LIST_ID:'periods',CODEBOOK_APPROVED:'true',MIN_STAFF_PER_DAY:'1'};
  return {month,store:createStore('x'.repeat(50),env,fetchImpl),period:()=>({status,lock,etag:`"p${periodVersion}"`}),shifts,entered,releaseEdit:()=>releaseEdit(),stall:()=>stall=true,employees};
}
test('graph race: publication cannot overtake a pending shift write',async()=>{
  const h=harness();const target=h.shifts.find(x=>x.fields.EmployeeKey==='a'&&x.fields.ShiftDate==='2026-11-16');
  assert.equal(target.fields.ShiftCode,'203');
  h.stall();
  const edit=h.store.edit({id:target.id,etag:target.eTag,code:'301'},{oid:'manager-a'});
  await h.entered;
  await assert.rejects(()=>h.store.changePeriod({month:h.month,etag:h.period().etag,next:'PUBLISHED',reviewed:true},{oid:'manager-b'}),MonthLocked);
  assert.equal(h.period().status,'REVIEW');
  h.releaseEdit();await edit;
  const published=await h.store.changePeriod({month:h.month,etag:h.period().etag,next:'PUBLISHED',reviewed:true},{oid:'manager-b'});
  assert.equal(published.status,'PUBLISHED');
  assert.equal(h.period().status,'PUBLISHED');assert.equal(h.period().lock,'');
  await assert.rejects(()=>h.store.edit({id:target.id,etag:target.eTag,code:'R'},{oid:'manager-a'}),e=>e.status===423);
  assert.equal(target.fields.ShiftCode,'301');
});
