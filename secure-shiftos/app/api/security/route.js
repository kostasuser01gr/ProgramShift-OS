import {NextResponse} from 'next/server';
import {requireActor} from '../../../lib/auth.js';
import {readPermissionLayers,PermissionAuditUnavailable} from '../../../lib/permission-reader.mjs';
import {noCacheHeaders} from '../../../lib/access.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
function json(value,status=200){return NextResponse.json(value,{status,headers:noCacheHeaders()});}
export async function GET(req){
  const actor=await requireActor(req,'staff'); // only managers; existing email ACL remains untouched
  if(!actor.ok)return json({error:'Access denied'},actor.status);
  try{return json(await readPermissionLayers(actor.graphToken));}
  catch(error){return json({state:'UNVERIFIED',error:'Permission inspection unavailable; do not assume workbook is locked.'},error instanceof PermissionAuditUnavailable?error.status:503);}
}
