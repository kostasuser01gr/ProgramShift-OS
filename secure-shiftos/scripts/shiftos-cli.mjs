#!/usr/bin/env node
/** Operator interface for disposable synthetic data only; never remote enterprise access. */
import {syntheticRoster} from '../lib/synthetic-fixture.mjs';
import {executeGateway,toolCatalog,GatewayError} from '../lib/gateway/core.mjs';
const usage='Usage: node scripts/shiftos-cli.mjs --demo list | --demo call <tool.name> <json-arguments>'; 
export function runCLI(argv){
 if(argv[0]!=='--demo')throw new GatewayError('DEMO_REQUIRED','Απαιτείται το --demo. Δεν επιτρέπεται σύνδεση με εταιρικά δεδομένα.',403);
 if(argv[1]==='list'&&argv.length===2)return {ok:true,tools:toolCatalog()};
 if(argv[1]!=='call'||argv.length!==4)throw new GatewayError('USAGE',usage,400);
 let args;try{args=JSON.parse(argv[3]);}catch{throw new GatewayError('BAD_JSON','Τα arguments πρέπει να είναι JSON.');}
 const month=args?.month;
 if(typeof month!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))throw new GatewayError('BAD_MONTH','Απαιτείται έγκυρο month.',400);
 const data=syntheticRoster(month);
 return executeGateway(argv[2],args,{...data,mode:'synthetic',syntheticConfirmed:true,role:'manager',status:'DRAFT'});
}
if(process.argv[1]?.endsWith('shiftos-cli.mjs')){
 try{process.stdout.write(JSON.stringify(runCLI(process.argv.slice(2)))+'\n');}
 catch(e){process.stdout.write(JSON.stringify({ok:false,code:e.code||'ERROR',error:e.message})+'\n');process.exitCode=1;}
}
