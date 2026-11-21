// Strict authorization. Identity is taken only from a verified Microsoft Entra session.
export const STATION_EMAIL = 'heraklion.airport@europcargreece.com';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const uuidSet = text => new Set(String(text || '').split(',').map(x=>x.trim().toLowerCase()).filter(x=>UUID.test(x)));

export function roleForIdentity(principal, env=process.env) {
  if (env.NODE_ENV === 'production' && (env.IT_APPROVED !== 'true' || env.HOSTING_APPROVED !== 'true' || env.PRIVATE_ACL_REVIEWED !== 'true')) return null;
  const oid=String(principal?.oid||'').toLowerCase(),tid=String(principal?.tid||'').toLowerCase();
  const email=String(principal?.email||'').trim().toLowerCase();
  if (!UUID.test(oid) || !UUID.test(tid) || tid !== String(env.AZURE_AD_TENANT_ID || '').toLowerCase()) return null;
  // Explicit ID denylist is mandatory; shared accounts cannot be manager identities.
  const blocked=uuidSet(env.BLOCKED_OIDS);
  if (!blocked.size || blocked.has(oid) || email === STATION_EMAIL) return null;
  if (uuidSet(env.MANAGER_OIDS).has(oid)) return 'manager';
  if (uuidSet(env.EDITOR_OIDS).has(oid)) return 'editor';
  return null;
}
export function hasRight(role,action) {
  if (role==='manager') return ['read','write','publish','backup','staff'].includes(action);
  if (role==='editor') return ['read','write'].includes(action);
  return false;
}
export function isMonth(value) {return typeof value==='string' && /^20\d\d-(0[1-9]|1[0-2])$/.test(value);}
export function isDate(value) {
  if(typeof value!=='string'||!/^20\d\d-(0[1-9]|1[0-2])-\d\d$/.test(value))return false;
  const d=new Date(value+'T12:00:00Z');return !Number.isNaN(+d)&&d.toISOString().slice(0,10)===value;
}
export function isPeriodStatus(value) {return ['DRAFT','REVIEW','PUBLISHED','LOCKED'].includes(value);}
export function isSameOrigin(req) {
  // No Origin means neither a trusted browser nor a CSRF proof; reject state mutations.
  const origin=req.headers.get('origin');if(!origin)return false;
  try{return new URL(origin).origin===new URL(req.url).origin;}catch{return false;}
}
export function noCacheHeaders(){return {
  'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'
};}
