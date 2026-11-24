import {NextResponse} from 'next/server';
import {requireActor} from '../../../lib/auth.js';
import {createStore,GraphFailure} from '../../../lib/graph.mjs';
import {isMonth,isSameOrigin,noCacheHeaders} from '../../../lib/access.mjs';
import {executeGateway,GatewayError,toolCatalog,TOOL_NAMES} from '../../../lib/gateway/core.mjs';

export const dynamic='force-dynamic';
export const runtime='nodejs';
const reply=(data,status=200)=>NextResponse.json(data,{status,headers:noCacheHeaders()});
const fail=error=>error instanceof GatewayError?reply({ok:false,code:error.code,error:error.message},error.status):error instanceof GraphFailure?reply({ok:false,code:'DATA_UNAVAILABLE',error:'Τα εταιρικά δεδομένα δεν είναι διαθέσιμα.'},error.status):reply({ok:false,code:'UNAVAILABLE',error:'Το εργαλείο δεν είναι διαθέσιμο.'},503);

async function readBoundedJSON(req){
 if(!String(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))throw new GatewayError('UNSUPPORTED_CONTENT_TYPE','Απαιτείται JSON.',415);
 const len=Number(req.headers.get('content-length'));
 if(Number.isFinite(len)&&len>8192)throw new GatewayError('PAYLOAD_TOO_LARGE','Το αίτημα είναι πολύ μεγάλο.',413);
 const reader=req.body?.getReader();if(!reader)throw new GatewayError('BAD_INPUT','Κενό αίτημα.');
 let bytes=0;const parts=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value?.byteLength||0;if(bytes>8192)throw new GatewayError('PAYLOAD_TOO_LARGE','Το αίτημα είναι πολύ μεγάλο.',413);parts.push(value);}}
 finally{reader.releaseLock();}
 const payload=new Uint8Array(bytes);let off=0;for(const chunk of parts){payload.set(chunk,off);off+=chunk.byteLength;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(payload));}
 catch{throw new GatewayError('BAD_JSON','Δεν ήταν δυνατό να διαβαστεί το JSON.');}
}
export async function GET(req){
 const actor=await requireActor(req,'read');if(!actor.ok)return reply({ok:false,error:'Access denied'},actor.status);
 return reply({ok:true,mode:'CORPORATE_READ_ONLY',tools:toolCatalog()});
}
export async function POST(req){
 if(!isSameOrigin(req))return reply({ok:false,code:'FORBIDDEN_ORIGIN',error:'Access denied'},403);
 const actor=await requireActor(req,'read');if(!actor.ok)return reply({ok:false,error:'Access denied'},actor.status);
 try{
  const body=await readBoundedJSON(req);
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['tool','arguments'].includes(k)))throw new GatewayError('BAD_INPUT','Μη έγκυρη εντολή.');
  if(!TOOL_NAMES.includes(body.tool))throw new GatewayError('UNKNOWN_TOOL','Άγνωστη εντολή.',404);
  const month=body.arguments?.month;
  if(!isMonth(month))throw new GatewayError('BAD_MONTH','Μη έγκυρος μήνας.');
  const roster=await createStore(actor.graphToken).roster(month);
  const context={mode:'corporate',role:actor.actor.role,month,employees:roster.employees,shifts:roster.shifts,status:roster.period?.status||'UNCONFIGURED'};
  return reply(executeGateway(body.tool,body.arguments,context));
 }catch(e){return fail(e);}
}
