import {isDate,isMonth} from './access.mjs';
import {CODE_TO_SHIFT} from './shifts.mjs';
import {canEditPeriod,validateTransition} from './periods.mjs';
import {reviewWarnings} from './shifts.mjs';
import {reviewWeeklyRest} from './weekly-rest.mjs';
import {withMonthLock,MonthLocked} from './month-lock.mjs';
import {validateRelease,ReleaseRejected} from './release-gates.mjs';
export class GraphFailure extends Error{constructor(status=503){super('Corporate Microsoft 365 store unavailable');this.status=status;}}
export class EditConflict extends Error{constructor(){super('Concurrent change. Reload the roster.');this.status=409;}}
function required(env){
  const keys=['SHAREPOINT_SITE_ID','SHAREPOINT_EMPLOYEES_LIST_ID','SHAREPOINT_SHIFTS_LIST_ID','SHAREPOINT_PERIODS_LIST_ID'];
  for(const k of keys)if(!env[k]||!/^[A-Za-z0-9.,!_-]{3,180}$/.test(env[k]))throw new GraphFailure();
  const root=`https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(env.SHAREPOINT_SITE_ID)}/lists/`;
  const url=k=>root+encodeURIComponent(env[k])+'/items';
  return {employees:url('SHAREPOINT_EMPLOYEES_LIST_ID'),shifts:url('SHAREPOINT_SHIFTS_LIST_ID'),periods:url('SHAREPOINT_PERIODS_LIST_ID')};
}
export function createStore(token,env=process.env,fetchImpl=fetch){
  if(typeof token!=='string'||token.length<20)throw new GraphFailure(401);
  const urls=required(env),headers={Authorization:`Bearer ${token}`,Accept:'application/json'};
  async function request(url,options={}){
    const parsed=new URL(url),valid=['employees','shifts','periods'].some(k=>parsed.pathname.startsWith(new URL(urls[k]).pathname));
    if(parsed.origin!=='https://graph.microsoft.com'||!valid)throw new GraphFailure(502);
    let res;try{res=await fetchImpl(url,{...options,headers:{...headers,...options.headers},cache:'no-store',redirect:'error'});}catch{throw new GraphFailure();}
    if(res.status===409||res.status===412)throw new EditConflict();
    if(!res.ok)throw new GraphFailure([401,403].includes(res.status)?403:503);
    if(res.status===204)return {};
    try{return await res.json();}catch{throw new GraphFailure();}
  }
  async function pages(root){
    let url=root+'?$expand=fields&$top=200',all=[];
    for(let page=0;url&&page<45;page++){
      const data=await request(url);if(!Array.isArray(data.value))throw new GraphFailure();
      all.push(...data.value);
      url=data['@odata.nextLink']||'';
      if(url){
        const next=new URL(url),r=new URL(root);
        if(next.origin!==r.origin||next.pathname!==r.pathname)throw new GraphFailure(502);
      }
    }
    if(url)throw new GraphFailure(503);
    return all;
  }
  const tag=item=>String(item?.eTag||item?.['@odata.etag']||'');
  async function getPeriod(month){
    if(!isMonth(month))throw new GraphFailure(400);
    const rows=await pages(urls.periods);
    const match=rows.filter(x=>String(x.fields?.PeriodKey||'')===month);
    if(match.length!==1)return {month,status:'UNCONFIGURED',id:null,etag:null};
    const x=match[0],status=String(x.fields?.Status||'');
    if(!['DRAFT','REVIEW','PUBLISHED','LOCKED'].includes(status)||!tag(x))throw new GraphFailure();
    return {month,status,id:String(x.id),etag:tag(x),reviewedBy:String(x.fields?.ReviewedBy||''),mutationLock:String(x.fields?.MutationLock||'')};
  }
  async function roster(month){
    if(!isMonth(month))throw new GraphFailure(400);
    const [employeeRows,shiftRows,period]=await Promise.all([pages(urls.employees),pages(urls.shifts),getPeriod(month)]);
    const employees=employeeRows.map(item=>({key:String(item.fields?.EmployeeKey||''),name:String(item.fields?.DisplayName||''),active:item.fields?.Active===true||String(item.fields?.Active).toLowerCase()==='true'})).filter(x=>x.active&&x.key&&x.name).sort((a,b)=>a.name.localeCompare(b.name,'el'));
    const employeeIds=new Set(employees.map(e=>e.key));
    const context=shiftRows.map(item=>({id:String(item.id),etag:tag(item),employeeKey:String(item.fields?.EmployeeKey||''),date:String(item.fields?.ShiftDate||'').slice(0,10),code:String(item.fields?.ShiftCode||'')}))
      .filter(x=>isDate(x.date)&&employeeIds.has(x.employeeKey));
    if(context.some(s=>!/^\d+$/.test(s.id)||!s.etag))throw new GraphFailure();
    return {month,employees,shifts:context.filter(x=>x.date.startsWith(month)),context,period,updatedAt:new Date().toISOString()};
  }
  const patchPeriod=(id,etag,fields)=>request(urls.periods+'/'+id+'/fields',{
    method:'PATCH',headers:{'Content-Type':'application/json','If-Match':etag},body:JSON.stringify(fields)
  });
  const mutate=(month,work)=>withMonthLock({read:getPeriod,patch:patchPeriod},month,work);
  async function edit(input,actor){
    const id=String(input?.id||''),etag=input?.etag,code=input?.code;
    if(!/^[1-9]\d{0,18}$/.test(id)||typeof etag!=='string'||etag.length<3||etag.length>250||etag==='*'||typeof code!=='string'||(code!==''&&!Object.hasOwn(CODE_TO_SHIFT,code)))throw new GraphFailure(400);
    const path=urls.shifts+'/'+id,previous=await request(path+'?$expand=fields');
    if(String(previous.id)!==id||!previous.fields||tag(previous)!==etag)throw new EditConflict();
    const date=String(previous.fields.ShiftDate||'').slice(0,10);
    if(!isDate(date))throw new GraphFailure();
    return mutate(date.slice(0,7),async(period)=>{
      if(!canEditPeriod(period.status))throw new GraphFailure(423);
      // Recheck after acquiring lock in case another manager edited the row.
      const latest=await request(path+'?$expand=fields');
      if(tag(latest)!==etag||String(latest.fields?.ShiftDate||'').slice(0,10)!==date)throw new EditConflict();
      await request(path+'/fields',{method:'PATCH',headers:{'Content-Type':'application/json','If-Match':etag},body:JSON.stringify({ShiftCode:code,LastEditorOid:actor.oid})});
      return {ok:true};
    });
  }
  async function addShift(input,actor){
    const key=String(input?.employeeKey||''),date=String(input?.date||''),code=input?.code;
    if(!/^[\w-]{1,80}$/.test(key)||!isDate(date)||typeof code!=='string'||(code!==''&&!Object.hasOwn(CODE_TO_SHIFT,code)))throw new GraphFailure(400);
    return mutate(date.slice(0,7),async(period)=>{
      if(!canEditPeriod(period.status))throw new GraphFailure(423);
      const [known,existing]=await Promise.all([pages(urls.employees),pages(urls.shifts)]);
      if(!known.some(e=>String(e.fields?.EmployeeKey||'')===key&&String(e.fields?.Active).toLowerCase()==='true'))throw new GraphFailure(400);
      if(existing.some(s=>String(s.fields?.ShiftKey||'')===key+'|'+date))throw new EditConflict();
      const fields={Title:key+'|'+date,ShiftKey:key+'|'+date,EmployeeKey:key,ShiftDate:date,ShiftCode:code,LastEditorOid:actor.oid};
      const created=await request(urls.shifts,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields})});
      return {ok:true,id:String(created.id)};
    });
  }
  async function changePeriod(input,actor){
    const month=String(input?.month||''),next=String(input?.next||''),etag=String(input?.etag||'');
    if(!isMonth(month)||!/^.{3,250}$/.test(etag)||etag==='*')throw new GraphFailure(400);
    return mutate(month,async(period)=>{
      // Compare client-visible revision to pre-acquisition revision; lock itself changes the ETag.
      if(period._beforeLockEtag!==etag)throw new EditConflict();
      validateTransition(period.status,next,{reviewed:input?.reviewed===true});
      if(next==='PUBLISHED'){
        const current=await roster(month);
        validateRelease(current,env);
      }
      await patchPeriod(period.id,period.etag,{
        Status:next,
        ReviewedBy:next==='REVIEW'||next==='PUBLISHED'?actor.oid:period.reviewedBy
      });
      return {ok:true,status:next};
    });
  }
  return {roster,edit,addShift,getPeriod,changePeriod};
}
