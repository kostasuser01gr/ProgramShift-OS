import { roleForIdentity } from '../lib/access.mjs';
const required=['AZURE_AD_TENANT_ID','AZURE_AD_CLIENT_ID','AZURE_AD_CLIENT_SECRET','NEXTAUTH_SECRET',
  'SHAREPOINT_SITE_ID','SHAREPOINT_EMPLOYEES_LIST_ID','SHAREPOINT_SHIFTS_LIST_ID','SHAREPOINT_PERIODS_LIST_ID','BLOCKED_OIDS',
  'MANAGER_OIDS','IT_APPROVED','HOSTING_APPROVED','PRIVATE_ACL_REVIEWED','CODEBOOK_APPROVED','MIN_STAFF_PER_DAY'];
const errors=[];
for(const key of required){const val=process.env[key];if(!val||val==='false')errors.push(`${key}: missing/unapproved`);}
if((process.env.NEXTAUTH_SECRET||'').length<32) errors.push('NEXTAUTH_SECRET: less than 32 characters');
if(!process.env.NEXTAUTH_URL?.startsWith('https://')) errors.push('NEXTAUTH_URL: HTTPS required');
if(!/^\d+$/.test(process.env.MIN_STAFF_PER_DAY||'')||Number(process.env.MIN_STAFF_PER_DAY)<1||Number(process.env.MIN_STAFF_PER_DAY)>100) errors.push('MIN_STAFF_PER_DAY: must be an approved integer 1..100');
if(!/^[0-9a-f-]{36}(,[0-9a-f-]{36})*$/i.test(process.env.BLOCKED_OIDS||''))errors.push('BLOCKED_OIDS: explicit Entra object IDs required');
for(const id of (process.env.BLOCKED_OIDS||'').split(',').map(x=>x.trim().toLowerCase())) {
  if((process.env.MANAGER_OIDS||'').toLowerCase().split(',').includes(id) || (process.env.EDITOR_OIDS||'').toLowerCase().split(',').includes(id)) errors.push('Shared account cannot be an authorized editor');
}
if(process.env.OPS_WRITE_ENABLED==='true'){
  for(const key of ['SHAREPOINT_OPERATIONS_LIST_ID','OPS_STATION_ID'])if(!process.env[key])errors.push(`${key}: required for rental operations writes`);
  if(!/^[A-Z0-9_-]{2,24}$/.test(process.env.OPS_STATION_ID||''))errors.push('OPS_STATION_ID: invalid');
}
if(errors.length){console.error('PRODUCTION RELEASE BLOCKED:',errors.join(' | '));process.exitCode=1;}
else console.log('Static configuration prerequisites satisfied. Live IT, Graph permissions, co-authoring and privacy audits still required.');
