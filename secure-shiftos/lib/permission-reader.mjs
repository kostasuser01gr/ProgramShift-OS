// Read-only Microsoft Graph permission inspection; never mutates ACLs.
import {assessPermissions} from './security-audit.mjs';
export class PermissionAuditUnavailable extends Error {
  constructor(message='Permission audit unavailable',status=503){super(message);this.status=status;}
}
const DRIVE_ID = /^[A-Za-z0-9!_-]{10,260}$/;
const ITEM_ID = /^[A-Za-z0-9!_-]{5,260}$/;
export function permissionPaths(env=process.env){
  const id=env.EXCEL_DRIVE_ID, file=env.EXCEL_FILE_ITEM_ID, folder=env.EXCEL_PARENT_ITEM_ID;
  if(!DRIVE_ID.test(String(id||''))||!ITEM_ID.test(String(file||''))||!ITEM_ID.test(String(folder||'')))throw new PermissionAuditUnavailable('Excel file or folder identity not configured');
  const root=`https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(id)}/items/`;
  return {file:root+encodeURIComponent(file)+'/permissions',parent:root+encodeURIComponent(folder)+'/permissions'};
}
export async function readPermissionLayers(token,env=process.env,fetchImpl=fetch){
  if(typeof token!=='string'||token.length<20)throw new PermissionAuditUnavailable('Missing delegated token',401);
  const paths=permissionPaths(env);
  async function read(root){
    const original=new URL(root);let next=root;const found=[];const seen=new Set();
    for(let page=0;next&&page<12;page++){
      if(seen.has(next))throw new PermissionAuditUnavailable('Pagination cycle');seen.add(next);
      const candidate=new URL(next);
      if(candidate.origin!==original.origin||candidate.pathname!==original.pathname)throw new PermissionAuditUnavailable('Unsafe nextLink',502);
      let res;try{res=await fetchImpl(next,{headers:{'Authorization':`Bearer ${token}`,'Accept':'application/json'},cache:'no-store',redirect:'error'});}catch{throw new PermissionAuditUnavailable();}
      if(!res.ok)throw new PermissionAuditUnavailable(res.status===401||res.status===403?'Audit lacks permission':'Graph unavailable',res.status===401?401:503);
      let value;try{value=await res.json();}catch{throw new PermissionAuditUnavailable('Malformed Graph response');}
      if(!Array.isArray(value.value))throw new PermissionAuditUnavailable('Missing permission list');
      found.push(...value.value);next=value['@odata.nextLink']||null;
    }
    if(next)throw new PermissionAuditUnavailable('Excessive pagination');return found;
  }
  const [file,parent]=await Promise.all([read(paths.file),read(paths.parent)]);
  return assessPermissions(file,parent,{sharedAccountHasAccess:true}); // Current source workbook remains in station-owned OneDrive
}
