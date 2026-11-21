import AzureADProvider from 'next-auth/providers/azure-ad';
import { getToken } from 'next-auth/jwt';
import { roleForIdentity, hasRight } from './access.mjs';

export const authOptions={
  session:{strategy:'jwt',maxAge:45*60},
  secret:process.env.NEXTAUTH_SECRET,
  providers:[AzureADProvider({
    tenantId:process.env.AZURE_AD_TENANT_ID,
    clientId:process.env.AZURE_AD_CLIENT_ID,
    clientSecret:process.env.AZURE_AD_CLIENT_SECRET,
    authorization:{params:{scope:'openid profile email User.Read Sites.Selected'}}
  })],
  callbacks:{
    async signIn({account,profile}){
      if(account?.provider!=='azure-ad') return false;
      return Boolean(roleForIdentity({oid:profile?.oid,tid:profile?.tid,email:profile?.preferred_username||profile?.email}));
    },
    async jwt({token,account,profile}){
      if(account&&profile){
        token.oid=profile.oid;token.tid=profile.tid;
        token.principalEmail=String(profile.preferred_username||profile.email||'').toLowerCase();
        token.graphToken=account.access_token;
        token.graphExpires=(account.expires_at||0)*1000;
      }
      token.role=roleForIdentity({oid:token.oid,tid:token.tid,email:token.principalEmail});
      return token;
    },
    async session({session,token}){
      // Never expose Graph access tokens through /api/auth/session.
      session.user={...session.user,role:token.role||null};
      return session;
    }
  },
  pages:{signIn:'/login',error:'/login'}
};
export async function requireActor(request,right='read') {
  const token=await getToken({req:request,secret:process.env.NEXTAUTH_SECRET});
  const actor={oid:String(token?.oid||''),tid:String(token?.tid||''),email:String(token?.principalEmail||'')};
  const role=roleForIdentity(actor);
  if(!hasRight(role,right)) return {ok:false,status:403};
  if(!token?.graphToken||!(Number(token.graphExpires)>Date.now()+30000)) return {ok:false,status:401};
  return {ok:true,actor:{...actor,role},graphToken:token.graphToken};
}
