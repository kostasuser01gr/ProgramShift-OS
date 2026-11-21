import {randomUUID} from 'node:crypto';
/**
 * Non-expiring per-period fenced mutation lock (SharePoint item ETag CAS).
 * No TTL: if a worker crashes, writes stay BLOCKED pending audited IT recovery.
 * Every editor and publisher MUST acquire the same period lock.
 */
export class MonthLocked extends Error {
  constructor(){super('Period mutation lock held. Do not retry blindly.');this.name='MonthLocked';this.status=423;}
}
export async function withMonthLock({read,patch},month,run){
  const p=await read(month);
  if(!p?.id||!p.etag)throw new MonthLocked();
  if(p.mutationLock)throw new MonthLocked();
  const token=randomUUID();
  await patch(p.id,p.etag,{MutationLock:token}); // Graph's If-Match enforces compare-and-swap.
  const held=await read(month);
  if(held.mutationLock!==token||!held.etag)throw new MonthLocked();
  held._beforeLockEtag=p.etag;
  let result,error;
  try{result=await run(held);}catch(e){error=e;}
  // Release only our own lock; failure is intentionally fail-closed.
  try{
    const current=await read(month);
    if(current.mutationLock!==token)throw new MonthLocked();
    await patch(current.id,current.etag,{MutationLock:''});
  }catch(e){throw new MonthLocked();}
  if(error)throw error;
  return result;
}
