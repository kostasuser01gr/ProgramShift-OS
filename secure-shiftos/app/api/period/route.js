import {NextResponse} from 'next/server';
import {requireActor} from '../../../lib/auth.js';
import {isSameOrigin,noCacheHeaders} from '../../../lib/access.mjs';
import {createStore,GraphFailure,EditConflict} from '../../../lib/graph.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function PATCH(req){
  const output=(x,status=200)=>NextResponse.json(x,{status,headers:noCacheHeaders()});
  if(!isSameOrigin(req))return output({error:'Forbidden origin'},403);
  const auth=await requireActor(req,'publish');if(!auth.ok)return output({error:'Access denied'},auth.status);
  let input;try{input=await req.json();}catch{return output({error:'Bad JSON'},400);}
  try{return output(await createStore(auth.graphToken).changePeriod(input,auth.actor));}
  catch(error){return output({error:'Period transition rejected'},error instanceof EditConflict?409:error instanceof GraphFailure?error.status:400);}
}
