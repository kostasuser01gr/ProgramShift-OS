import NextAuth from 'next-auth';
import {NextResponse} from 'next/server';
import {authOptions} from '../../../../lib/auth.js';
// Fail closed when enterprise SSO is not provisioned. Synthetic /demo stays independent.
const ready=['NEXTAUTH_SECRET','AZURE_AD_TENANT_ID','AZURE_AD_CLIENT_ID','AZURE_AD_CLIENT_SECRET']
  .every(key=>typeof process.env[key]==='string'&&process.env[key].trim().length>0);
const handler=ready?NextAuth(authOptions):null;
function unavailable(){return NextResponse.json({error:'Corporate Microsoft 365 authentication not configured'},
  {status:503,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function GET(req,context){return handler?handler(req,context):unavailable();}
export async function POST(req,context){return handler?handler(req,context):unavailable();}
