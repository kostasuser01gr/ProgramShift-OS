import test from 'node:test';
import assert from 'node:assert/strict';
import {roleForIdentity,hasRight,isDate,isMonth} from '../lib/access.mjs';
import {shiftInterval,reviewWarnings,CODE_TO_SHIFT} from '../lib/shifts.mjs';
import {encryptXlsx,decryptXlsx} from '../lib/backup.mjs';
import {createStore,EditConflict} from '../lib/graph.mjs';
const oid='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', tid='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const env={AZURE_AD_TENANT_ID:tid,MANAGER_OIDS:oid,EDITOR_OIDS:'cccccccc-cccc-4ccc-cccc-cccccccccccc',BLOCKED_OIDS:'efc7e8a0-a76b-45e0-aaff-8e76d22c49ed',
 SHAREPOINT_SITE_ID:'contoso.sharepoint.com,aaa,bbb',SHAREPOINT_EMPLOYEES_LIST_ID:'1111-2222',SHAREPOINT_SHIFTS_LIST_ID:'3333-4444',SHAREPOINT_PERIODS_LIST_ID:'5555-6666'};
const principal={oid,tid,email:'manager@company.example'};
test('only tenant-matched immutable Entra ID works',()=>{
  assert.equal(roleForIdentity(principal,env),'manager');
  assert.equal(roleForIdentity({...principal,tid:'dddddddd-dddd-4ddd-dddd-dddddddddddd'},env),null);
  assert.equal(roleForIdentity({...principal,oid:'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee'},env),null);
  assert.equal(roleForIdentity({...principal,email:'heraklion.airport@europcargreece.com'},env),null);
  assert.equal(roleForIdentity({...principal,oid:'efc7e8a0-a76b-45e0-aaff-8e76d22c49ed'},env),null);
  assert.equal(roleForIdentity({...principal,oid:'cccccccc-cccc-4ccc-cccc-cccccccccccc'},env),'editor');
  assert.equal(roleForIdentity(principal,{...env,MANAGER_OIDS:''}),null);
});
test('production requires explicit release gates',()=>{
  const production={...env,NODE_ENV:'production'};
  assert.equal(roleForIdentity(principal,production),null);
  assert.equal(roleForIdentity(principal,{...production,IT_APPROVED:'true',HOSTING_APPROVED:'true',PRIVATE_ACL_REVIEWED:'true'}),'manager');
});
test('backup only for manager',()=>{assert.equal(hasRight('manager','backup'),true);assert.equal(hasRight('editor','backup'),false);assert.equal(hasRight(null,'read'),false)});
test('date validation rejects impossible and malformed dates',()=>{assert.equal(isMonth('2026-11'),true);assert.equal(isMonth('2026-00'),false);assert.equal(isDate('2026-02-30'),false);assert.equal(isDate('2026-11-21'),true)});
test('overnight shifts carry across midnight',()=>{const x=shiftInterval('217','2026-11-20');assert.equal((x.finish-x.begin)/3600000,8)});
test('detects inadequate rest and unknown codes',()=>{
  const shifts=[{employeeKey:'1',date:'2026-11-01',code:'217'},{employeeKey:'1',date:'2026-11-02',code:'203'},{employeeKey:'1',date:'2026-11-03',code:'999'}];
  const found=reviewWarnings(shifts,[{key:'1',name:'Synthetic Employee'}]);assert(found.some(w=>w.type==='rest11'));assert(found.some(w=>w.type==='unknown'));
});
test('backup round-trip, password and tamper protection',()=>{
  const bytes=Buffer.concat([Buffer.from('PK\x03\x04','binary'),Buffer.from('synthetic-Excel-fixture')]);
  const encrypted=encryptXlsx(bytes,'correct-horse-forest-2026');
  assert.deepEqual(decryptXlsx(encrypted,'correct-horse-forest-2026'),bytes);
  assert.throws(()=>decryptXlsx(encrypted,'incorrect-secret-key-2026'));
  const t=Buffer.from(encrypted);t[t.length-20]^=1;assert.throws(()=>decryptXlsx(t,'correct-horse-forest-2026'));
});
const listResp=(value,extra={})=>({ok:true,status:200,json:async()=>({value,...extra})});
test('Graph rejects missing corporate configuration and caller-controlled item IDs',async()=>{
  assert.throws(()=>createStore('a'.repeat(30),{}));
  const s=createStore('a'.repeat(30),env,async()=>{throw Error('no request should be sent')});
  await assert.rejects(()=>s.edit({id:'https://attacker',etag:'abcd',code:'203'},principal));
});
test('GET returns only private SharePoint rows; UPDATE uses If-Match',async()=>{
  let seenPatch=false, patchedBody=null;
  const fetchImpl=async(url,opts)=>{
    if(url.includes('5555-6666'))return listResp([{id:'17',eTag:'"period-1"',fields:{PeriodKey:'2026-11',Status:'DRAFT'}}]);
    if(url.includes('1111-2222'))return listResp([{id:'100',fields:{EmployeeKey:'E1',DisplayName:'Synthetic Employee',Active:true}}]);
    if(url.includes('3333-4444')&&url.includes('/items?'))return listResp([{id:'56',eTag:'"etag-1"',fields:{EmployeeKey:'E1',ShiftDate:'2026-11-20T00:00:00Z',ShiftCode:'217'}}]);
    if(url.endsWith('/items/56?$expand=fields'))return {ok:true,status:200,json:async()=>({id:'56',eTag:'"etag-1"',fields:{ShiftDate:'2026-11-20T00:00:00Z'}})};
    if(url.endsWith('/items/56/fields')){seenPatch=true;assert.equal(opts.headers['If-Match'],'"etag-1"');patchedBody=JSON.parse(opts.body);return {ok:true,status:200,json:async()=>({ShiftCode:'203'})};}
    throw Error('unexpected request '+url);
  };
  const store=createStore('a'.repeat(30),env,fetchImpl);
  const r=await store.roster('2026-11');assert.equal(r.employees.length,1);assert.equal(r.shifts.length,1);
  assert.equal((await store.edit({id:'56',etag:'"etag-1"',code:'203'},principal)).ok,true);
  assert(seenPatch);assert.equal(patchedBody.ShiftCode,'203');assert.equal(patchedBody.LastEditorOid,oid);
});
test('stale edit fails without overwriting',async()=>{
  const s=createStore('a'.repeat(30),env,async()=>({ok:true,status:200,json:async()=>({id:'8',eTag:'"new"',fields:{ShiftDate:'2026-11-20'}})}));
  await assert.rejects(()=>s.edit({id:'8',etag:'"old"',code:'203'},principal),EditConflict);
});
test('malicious Graph paging URLs are rejected',async()=>{
  const s=createStore('a'.repeat(30),env,async()=>listResp([],{ '@odata.nextLink':'https://attacker.example/steal'}));
  await assert.rejects(()=>s.roster('2026-11'));
});

import {reviewWeeklyRest} from '../lib/weekly-rest.mjs';
import {validateTransition,canEditPeriod} from '../lib/periods.mjs';
import {isSameOrigin} from '../lib/access.mjs';
test('manager-only publication, restricted editing and transition review',()=>{
  assert.equal(hasRight('editor','publish'),false);
  assert.equal(canEditPeriod('PUBLISHED'),false);
  assert.equal(canEditPeriod('REVIEW'),true);
  assert.throws(()=>validateTransition('DRAFT','PUBLISHED',{reviewed:true}));
  assert.throws(()=>validateTransition('REVIEW','PUBLISHED',{reviewed:false}));
  assert.equal(validateTransition('REVIEW','PUBLISHED',{reviewed:true}),'PUBLISHED');
});
test('fail-closed same-origin checks on state mutation',()=>{
  const req=(origin)=>({url:'https://shiftos.example/api/roster',headers:{get:()=>origin}});
  assert.equal(isSameOrigin(req('https://shiftos.example')),true);
  assert.equal(isSameOrigin(req('https://malicious.example')),false);
  assert.equal(isSameOrigin(req(null)),false);
});
test('35-hour checker flags complete weekly window, does not misread missing days as rest',()=>{
  const arr=[];
  for(let d=1;d<=11;d++)arr.push({employeeKey:'e',date:`2026-11-${String(d).padStart(2,'0')}`,code:'203'});
  const person=[{key:'e',name:'Fictional person'}];
  const warnings=reviewWeeklyRest(arr,person);
  assert(warnings.some(x=>x.type==='rest35'));
  const partial=arr.filter(x=>x.date!=='2026-11-05');
  assert.equal(reviewWeeklyRest(partial,person).length,0);
});
test('unconfigured period blocks a new write',async()=>{
  const fetchMock=async(url)=>{
    if(url.includes('5555-6666'))return listResp([]);
    if(url.includes('1111-2222'))return listResp([{id:'10',fields:{EmployeeKey:'X1',Active:true}}]);
    throw new Error('unexpected fetch');
  };
  const store=createStore('a'.repeat(30),env,fetchMock);
  await assert.rejects(()=>store.addShift({employeeKey:'X1',date:'2026-11-01',code:'203'},principal));
});
