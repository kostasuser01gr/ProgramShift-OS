#!/usr/bin/env node
/** Experimental MCP stdio server - only synthetic data. Never grants Microsoft rights.
 * JSON-RPC 2.0 newline-delimited framing; stderr for diagnostics, stdout for protocol.
 */
import readline from 'node:readline';
import {runCLI} from './shiftos-cli.mjs';
import {toolCatalog} from '../lib/gateway/core.mjs';
const MAX_LINE=16384;
export const MCP_PROTOCOL_VERSION='2025-06-18';
export function mcpDispatch(message){
 if(!message||message.jsonrpc!=='2.0'||typeof message.method!=='string')return {jsonrpc:'2.0',id:message?.id??null,error:{code:-32600,message:'Invalid Request'}};
 if(message.id===undefined)return null;
 const id=message.id;
 if(message.method==='initialize')return {jsonrpc:'2.0',id,result:{protocolVersion:MCP_PROTOCOL_VERSION,capabilities:{tools:{listChanged:false}},serverInfo:{name:'shiftos-synthetic-stdio',version:'1.2.0-rc1'}}};
 if(message.method==='ping')return {jsonrpc:'2.0',id,result:{}};
 if(message.method==='tools/list')return {jsonrpc:'2.0',id,result:{tools:toolCatalog().map(x=>({name:x.name,title:x.title,description:x.description,inputSchema:x.inputSchema,annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}}))}};
 if(message.method==='tools/call'){
  const p=message.params;
  if(!p||typeof p.name!=='string'||typeof p.arguments!=='object'||p.arguments===null||Array.isArray(p.arguments))return {jsonrpc:'2.0',id,error:{code:-32602,message:'Invalid tools/call params'}};
  try{return {jsonrpc:'2.0',id,result:{content:[{type:'text',text:JSON.stringify(runCLI(['--demo','call',p.name,JSON.stringify(p.arguments)]))}],isError:false}};}
  catch(e){return {jsonrpc:'2.0',id,result:{content:[{type:'text',text:JSON.stringify({ok:false,code:e.code||'INVALID',error:e.message})}],isError:true}};}
 }
 return {jsonrpc:'2.0',id,error:{code:-32601,message:'Method not found'}};
}
if(process.argv[1]?.endsWith('shiftos-mcp.mjs')){
 if(!process.argv.includes('--demo')){process.stderr.write('ShiftOS MCP is synthetic-only. Start with --demo.\n');process.exit(2);}
 process.stdout.on('error',error=>{if(error?.code==='EPIPE')process.exit(0);else throw error;});
 const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
 rl.on('line',line=>{
  let response;
  if(line.length>MAX_LINE)response={jsonrpc:'2.0',id:null,error:{code:-32700,message:'Input too large'}};
  else {try{response=mcpDispatch(JSON.parse(line));}catch{response={jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}};}}
  if(response)process.stdout.write(JSON.stringify(response)+'\n');
 });
}
