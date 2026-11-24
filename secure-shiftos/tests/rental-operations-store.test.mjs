import test from 'node:test';
import assert from 'node:assert/strict';
import {createOperationsStore} from '../lib/operations/graph-store.mjs';
import {EditConflict} from '../lib/graph.mjs';
import {OperationsError} from '../lib/operations/domain.mjs';
const token='t'.repeat(40),manager={oid:'manager-oid',role:'manager'},editor={oid:'editor-oid',role:'editor'};
const env={SHAREPOINT_SITE_ID:'company.sharepoint.com,site,web',SHAREPOINT_OPERATIONS_LIST_ID:'ops-tasks',OPS_STATION_ID:'HER',OPS_WRITE_ENABLED:'true'};
const sample={type:'RETURN_CHECK',dueDate:'2026-11-25',slot:'mid',team:'returns',priority:'normal',reference:''};
function mock(){let seq=0,posts=0,patches=0,records=[];const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
 const fetchImpl=async(url,opts={})=>{
  const path=new URL(url).pathname,method=opts.method||'GET';
  if(method==='POST'){
   posts++;const fields=JSON.parse(opts.body).fields;const row={id:String(++seq),eTag:'"etag1"',fields};records.push(row);return json(row,201);
  }
  const id=/\/items\/(\d+)(?:\/fields)?$/.exec(path)?.[1];
  if(method==='PATCH'){
    patches++;const row=records.find(r=>r.id===id);if(!row)return json({},404);
    if(opts.headers['If-Match']!==row.eTag)return json({},412);
    Object.assign(row.fields,JSON.parse(opts.body));row.eTag='"etag'+(Number(row.eTag.replace(/\D/g,''))+1)+'"';return json(row.fields);
  }
  if(id){const row=records.find(r=>r.id===id);return row?json(row):json({},404);}
  return json({value:records});
 };
 const store=createOperationsStore(token,env,fetchImpl,()=>`task-${seq+1}`);
 return {store,records,stats:()=>({posts,patches})};
}
test('corporate operation store refuses missing approved write configuration',()=>{assert.throws(()=>createOperationsStore(token,{...env,OPS_WRITE_ENABLED:'false'}));assert.throws(()=>createOperationsStore(token,{...env,OPS_STATION_ID:''}));assert.throws(()=>createOperationsStore('short',env));});
test('creation and list persist operation for correct station with server-controlled actor',async()=>{const {store,records}=mock();const created=await store.create(sample,editor);assert.equal(created.id,'1');assert.equal(created.history[0].actorOid,'editor-oid');assert.equal(created.station,'HER');assert.equal((await store.list())[0].type,'RETURN_CHECK');assert.equal(records[0].fields.TaskKey,'task-1');await assert.rejects(()=>store.create({...sample,StationKey:'CHQ'},editor),OperationsError);});
test('staff can execute tasks, manager verifies, and ETag conflict blocks stale edits',async()=>{const {store,records,stats}=mock();const a=await store.create(sample,editor);assert.equal(a.revision,1);await store.transition({id:a.id,etag:a.etag,next:'IN_PROGRESS'},editor);assert.equal(records[0].fields.RevisionNum,2);await assert.rejects(()=>store.transition({id:a.id,etag:a.etag,next:'DONE'},editor),EditConflict);
 const b=(await store.list())[0];await store.transition({id:a.id,etag:b.etag,next:'DONE'},editor);const c=(await store.list())[0];await assert.rejects(()=>store.transition({id:a.id,etag:c.etag,next:'VERIFIED'},editor),{code:'MANAGER_REQUIRED'});const d=await store.transition({id:a.id,etag:c.etag,next:'VERIFIED'},manager);assert.equal(d.revision,4);assert.equal(stats().patches,3);const latest=(await store.list())[0];assert.equal(latest.history.length,4);assert.equal(latest.history.at(-1).actorOid,'manager-oid');});
test('cross-station task cannot be changed, even with valid task ID',async()=>{const {store,records}=mock();const a=await store.create(sample,manager);records[0].fields.StationKey='CHQ';assert.deepEqual(await store.list(),[]);await assert.rejects(()=>store.transition({id:a.id,etag:a.etag,next:'IN_PROGRESS'},manager),{code:'DENIED'});});
test('Graph returns stale status on server-side CAS race',async()=>{let patchCalls=0;const row={id:'8',eTag:'"2"',fields:{TaskKey:'t',StationKey:'HER',TaskType:'PICKUP_READY',DueDate:'2026-11-24',TimeSlot:'early',TeamKey:'front-desk',PriorityKey:'normal',ReferenceCode:'',StatusKey:'NEW',RevisionNum:1,CreatedStamp:'2026-11-24T12:00:00Z',UpdatedStamp:'2026-11-24T12:00:00Z',HistoryJson:JSON.stringify([{revision:1}])}};
 const impl=async(url,opts={})=>{if(opts.method==='PATCH'){patchCalls++;return new Response('{}',{status:412});}return new Response(JSON.stringify(row),{status:200});};
 const store=createOperationsStore(token,env,impl);await assert.rejects(()=>store.transition({id:'8',etag:'"2"',next:'IN_PROGRESS'},manager),EditConflict);assert.equal(patchCalls,1);});

test('corporate adapter refuses user-supplied reference even when demo validator accepts it',async()=>{const {store}=mock();await assert.rejects(()=>store.create({...sample,reference:'SIM-123'},manager),{code:'REFERENCE_DISABLED'});});
