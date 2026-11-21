import {NextResponse} from 'next/server';
import {requireActor} from '../../../lib/auth.js';
import {createStore,GraphFailure,EditConflict} from '../../../lib/graph.mjs';
import {isMonth,isSameOrigin,noCacheHeaders} from '../../../lib/access.mjs';
import {reviewWarnings,CODE_TO_SHIFT} from '../../../lib/shifts.mjs';
import {reviewWeeklyRest} from '../../../lib/weekly-rest.mjs';
export const dynamic='force-dynamic';export const runtime='nodejs';
const json=(x,status=200)=>NextResponse.json(x,{status,headers:noCacheHeaders()});
const fail=e=>e instanceof EditConflict?json({error:'Η εγγραφή άλλαξε από άλλον editor. Ανανέωσε τη σελίδα.'},409):json({error:'Operation unavailable'},e instanceof GraphFailure?e.status:503);
export async function GET(req){
  const a=await requireActor(req,'read');if(!a.ok)return json({error:'Access denied'},a.status);
  const month=new URL(req.url).searchParams.get('month')||new Date().toISOString().slice(0,7);
  if(!isMonth(month))return json({error:'Invalid month'},400);
  try{const r=await createStore(a.graphToken).roster(month);
    return json({month,employees:r.employees,shifts:r.shifts,period:r.period,
      warnings:[...reviewWarnings(r.context,r.employees),...reviewWeeklyRest(r.context,r.employees)].filter(w=>w.date.startsWith(month)),codes:CODE_TO_SHIFT});
  }catch(e){return fail(e);}
}
export async function PATCH(req){
  if(!isSameOrigin(req))return json({error:'Forbidden origin'},403);
  const a=await requireActor(req,'write');if(!a.ok)return json({error:'Access denied'},a.status);
  let input;try{input=await req.json();}catch{return json({error:'Bad JSON'},400);}
  try{return json(await createStore(a.graphToken).edit(input,a.actor));}catch(e){return fail(e);}
}
export async function POST(req){
  if(!isSameOrigin(req))return json({error:'Forbidden origin'},403);
  const a=await requireActor(req,'write');if(!a.ok)return json({error:'Access denied'},a.status);
  let input;try{input=await req.json();}catch{return json({error:'Bad JSON'},400);}
  try{return json(await createStore(a.graphToken).addShift(input,a.actor),201);}catch(e){return fail(e);}
}
