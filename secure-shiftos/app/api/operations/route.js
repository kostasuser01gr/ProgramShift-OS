import {NextResponse} from 'next/server';
import {requireActor} from '../../../lib/auth.js';
import {isSameOrigin,noCacheHeaders} from '../../../lib/access.mjs';
import {GraphFailure,EditConflict} from '../../../lib/graph.mjs';
import {OperationsError,validateCreate,validateTransition} from '../../../lib/operations/domain.mjs';
import {createOperationsStore} from '../../../lib/operations/graph-store.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
const output=(data,status=200)=>NextResponse.json(data,{status,headers:noCacheHeaders()});
const failure=e=>output({ok:false,code:e instanceof OperationsError?e.code:e instanceof EditConflict?'REVISION_CONFLICT':'UNAVAILABLE',error:e instanceof OperationsError?e.message:e instanceof EditConflict?'Άλλαξε ήδη αυτή η εργασία. Ανανέωσε και προσπάθησε ξανά.':'Η εταιρική υπηρεσία δεν είναι διαθέσιμη.'},e instanceof OperationsError?e.status:e instanceof EditConflict?409:e instanceof GraphFailure?e.status:503);
async function body(req){if(!String(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))throw new OperationsError('CONTENT_TYPE','Απαιτείται JSON.',415);
 const limit=4096;const header=Number(req.headers.get('content-length'));if(Number.isFinite(header)&&header>limit)throw new OperationsError('PAYLOAD_LIMIT','Πολύ μεγάλο αίτημα.',413);
 const reader=req.body?.getReader();if(!reader)throw new OperationsError('BAD_INPUT','Κενό αίτημα.');let size=0;const parts=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value?.byteLength||0;if(size>limit)throw new OperationsError('PAYLOAD_LIMIT','Πολύ μεγάλο αίτημα.',413);parts.push(value);}}finally{reader.releaseLock();}
 const raw=new Uint8Array(size);let offset=0;for(const chunk of parts){raw.set(chunk,offset);offset+=chunk.byteLength;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));}catch{throw new OperationsError('BAD_JSON','Μη έγκυρο JSON.');}}
export async function GET(req){const actor=await requireActor(req,'read');if(!actor.ok)return output({ok:false,error:'Access denied'},actor.status);
 try{return output({ok:true,mode:'CORPORATE',tasks:await createOperationsStore(actor.graphToken).list()});}catch(e){return failure(e);}}
export async function POST(req){if(!isSameOrigin(req))return output({ok:false,error:'Forbidden origin'},403);const actor=await requireActor(req,'write');if(!actor.ok)return output({ok:false,error:'Access denied'},actor.status);
 try{const input=validateCreate(await body(req));return output({ok:true,task:await createOperationsStore(actor.graphToken).create(input,actor.actor)},201);}catch(e){return failure(e);}}
export async function PATCH(req){if(!isSameOrigin(req))return output({ok:false,error:'Forbidden origin'},403);const actor=await requireActor(req,'write');if(!actor.ok)return output({ok:false,error:'Access denied'},actor.status);
 try{const input=validateTransition(await body(req));return output(await createOperationsStore(actor.graphToken).transition(input,actor.actor));}catch(e){return failure(e);}}
