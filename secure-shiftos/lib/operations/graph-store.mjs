import {OperationsError,OPS_STATES,validateCreate,validateTransition,makeTask,advanceTask} from './domain.mjs';
import {GraphFailure,EditConflict} from '../graph.mjs';
/** SharePoint List adapter with delegated, per-user Graph token. No service credentials. */
export function createOperationsStore(token,env=process.env,fetchImpl=fetch,uuid=()=>crypto.randomUUID()){
  const site=env.SHAREPOINT_SITE_ID,listId=env.SHAREPOINT_OPERATIONS_LIST_ID,station=env.OPS_STATION_ID;
  const validId=x=>typeof x==='string'&&/^[a-zA-Z0-9.,!_-]{3,180}$/.test(x);
  if(!token||token.length<20)throw new GraphFailure(401);
  if(!validId(site)||!validId(listId)||typeof station!=='string'||!/^[A-Z0-9_-]{2,24}$/.test(station)||env.OPS_WRITE_ENABLED!=='true')throw new GraphFailure(503);
  const root=`https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(site)}/lists/${encodeURIComponent(listId)}/items`;
  const request=async(url,opts={})=>{
    const u=new URL(url),r=new URL(root);
    if(u.origin!==r.origin||!(u.pathname===r.pathname||u.pathname.startsWith(r.pathname+'/')))throw new GraphFailure(502);
    let response;try{response=await fetchImpl(url,{...opts,cache:'no-store',redirect:'error',headers:{Authorization:`Bearer ${token}`,Accept:'application/json',...(opts.headers||{})}});}catch{throw new GraphFailure(503);}
    if(response.status===409||response.status===412)throw new EditConflict();
    if(!response.ok)throw new GraphFailure([401,403].includes(response.status)?403:503);
    try{return response.status===204?{}:await response.json();}catch{throw new GraphFailure(503);}
  };
  const etag=x=>String(x?.eTag||x?.['@odata.etag']||'');
  const parse=x=>{
    let history;try{history=JSON.parse(String(x.fields?.HistoryJson||''));}catch{throw new GraphFailure(503);}
    if(!Array.isArray(history)||history.length<1||history.length>120)throw new GraphFailure(503);
    const task={id:String(x.id),etag:etag(x),key:String(x.fields.TaskKey||''),station:String(x.fields.StationKey||''),type:String(x.fields.TaskType||''),dueDate:String(x.fields.DueDate||'').slice(0,10),slot:String(x.fields.TimeSlot||''),team:String(x.fields.TeamKey||''),priority:String(x.fields.PriorityKey||''),reference:String(x.fields.ReferenceCode||''),status:String(x.fields.StatusKey||''),revision:Number(x.fields.RevisionNum),createdAt:String(x.fields.CreatedStamp||''),updatedAt:String(x.fields.UpdatedStamp||''),history};
    if(!/^\d{1,19}$/.test(task.id)||!task.etag||!Number.isInteger(task.revision)||task.revision<1||task.history.at(-1)?.revision!==task.revision||!Object.hasOwn(OPS_STATES,task.status))throw new GraphFailure(503);
    try{validateCreate({type:task.type,dueDate:task.dueDate,slot:task.slot,priority:task.priority,team:task.team,reference:task.reference});}catch{throw new GraphFailure(503);}
    return task;
  };
  const serialize=t=>({TaskKey:t.key,StationKey:t.station,TaskType:t.type,DueDate:t.dueDate,TimeSlot:t.slot,TeamKey:t.team,PriorityKey:t.priority,ReferenceCode:t.reference,StatusKey:t.status,RevisionNum:t.revision,CreatedStamp:t.createdAt,UpdatedStamp:t.updatedAt,HistoryJson:JSON.stringify(t.history)});
  async function list(){let url=root+'?$expand=fields&$top=100',rows=[];for(let n=0;n<30&&url;n++){
    const batch=await request(url);if(!Array.isArray(batch.value))throw new GraphFailure(503);
    rows.push(...batch.value);url=batch['@odata.nextLink']||'';
    if(url){const u=new URL(url),r=new URL(root);if(u.origin!==r.origin||u.pathname!==r.pathname)throw new GraphFailure(502);}
    if(n===29&&url)throw new GraphFailure(503);
  }
  // filter station before returning; the SharePoint site must also enforce station ACLs.
  return rows.filter(x=>String(x.fields?.StationKey||'')===station).map(parse).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.id.localeCompare(b.id));}
  async function create(input,actor){if(!['manager','editor'].includes(actor?.role)||!actor?.oid)throw new OperationsError('DENIED','Απαιτείται επώνυμη εξουσιοδότηση.',403);
    if(input?.reference)throw new OperationsError('REFERENCE_DISABLED','Για εταιρικές εγγραφές ο κωδικός δημιουργείται αυτόματα. Μην καταχωρίζετε αναγνωριστικά πελατών ή οχημάτων.',400);
    const task=makeTask(uuid(),validateCreate(input),station,actor);
    const data=await request(root,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:{Title:task.type+' · '+task.dueDate,...serialize(task)}})});
    return parse(data);
  }
  async function transition(input,actor){validateTransition(input);
    const path=root+'/'+input.id,existing=parse(await request(path+'?$expand=fields'));
    if(existing.station!==station)throw new OperationsError('DENIED','Εργασία άλλου σταθμού.',403);
    if(existing.etag!==input.etag)throw new EditConflict();
    const updated=advanceTask(existing,input.next,actor,existing.revision);
    const result=await request(path+'/fields',{method:'PATCH',headers:{'Content-Type':'application/json','If-Match':input.etag},body:JSON.stringify(serialize(updated))});
    // This item update is atomic with its own HistoryJson; SharePoint versions remain enabled by IT.
    return {ok:true,id:input.id,status:updated.status,revision:updated.revision,item:result};
  }
  return {list,create,transition};
}
