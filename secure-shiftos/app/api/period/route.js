import {NextResponse} from 'next/server';
import {requireActor} from '../../../lib/auth.js';
import {isSameOrigin,noCacheHeaders} from '../../../lib/access.mjs';
import {createStore,GraphFailure,EditConflict} from '../../../lib/graph.mjs';
import {MonthLocked} from '../../../lib/month-lock.mjs';
import {ReleaseRejected} from '../../../lib/release-gates.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function PATCH(req){
  const output=(x,status=200)=>NextResponse.json(x,{status,headers:noCacheHeaders()});
  if(!isSameOrigin(req))return output({error:'Forbidden origin'},403);
  const auth=await requireActor(req,'publish');if(!auth.ok)return output({error:'Access denied'},auth.status);
  let input;try{input=await req.json();}catch{return output({error:'Bad JSON'},400);}
  try{return output(await createStore(auth.graphToken).changePeriod(input,auth.actor));}
  catch(error){
    if(error instanceof ReleaseRejected)return output({error:'Η δημοσίευση απορρίφθηκε από τον έλεγχο',code:error.code},422);
    if(error instanceof MonthLocked)return output({error:'Περίοδος προσωρινά δεσμευμένη. Επικοινώνησε με IT αν επιμένει.'},423);
    return output({error:'Period transition rejected'},error instanceof EditConflict?409:error instanceof GraphFailure?error.status:400);
  }
}
