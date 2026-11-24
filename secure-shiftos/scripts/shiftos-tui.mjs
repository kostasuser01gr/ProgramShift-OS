#!/usr/bin/env node
/** Local, menu-driven terminal UI. Synthetic sandbox ONLY. */
import readline from 'node:readline/promises';
import {stdin,stdout,stderr} from 'node:process';
import {toolCatalog} from '../lib/gateway/core.mjs';
import {runCLI} from './shiftos-cli.mjs';
export function menuText(){return ['','SHIFTOS · OFFLINE DEMO','────────────────────────────','Επίλεξε εργαλείο (0 για έξοδο):',...toolCatalog().map((t,i)=>` ${i+1}. ${t.title}`),' 0. Έξοδος',''].join('\n');}
export function selectionToTool(value){if(value==='0')return null;const n=Number(value);return /^\d+$/.test(value)&&Number.isSafeInteger(n)?toolCatalog()[n-1]?.name||undefined:undefined;}
const isMain=process.argv[1]?.endsWith('shiftos-tui.mjs');
if(isMain){
 if(!process.argv.includes('--demo')){stderr.write('Μόνο συνθετικό demo: απαιτείται --demo\n');process.exit(2);}
 const rl=readline.createInterface({input:stdin,output:stdout});
 try{
  let running=true;
  while(running){
   stdout.write(menuText());
   let selected;try{selected=(await rl.question('Επιλογή: ')).trim();}catch{break;}
   const tool=selectionToTool(selected);
   if(tool===null){running=false;break;}
   if(!tool){stdout.write('Μη έγκυρη επιλογή.\n');continue;}
   let month='2026-11';try{month=(await rl.question('Μήνας YYYY-MM (κενό = 2026-11): ')).trim()||month;}catch{break;}
   const args={month};
   if(['coverage.analyze','coverage.simulate','shift.propose'].includes(tool)){
    try{args.date=(await rl.question('Ημερομηνία YYYY-MM-DD: ')).trim();}catch{break;}
   }
   if(tool==='manual.search'){try{args.query=(await rl.question('Αναζήτηση: ')).trim();}catch{break;}}
   if(tool==='shift.propose'){
    try{args.employeeKey=(await rl.question('Synthetic employeeKey (π.χ. DEMO-01): ')).trim();args.code=(await rl.question('Κωδικός βάρδιας: ')).trim();}catch{break;}
   }
   try{const result=runCLI(['--demo','call',tool,JSON.stringify(args)]);stdout.write(JSON.stringify(result,null,2)+'\n');}
   catch(e){stdout.write('Σφάλμα: '+e.message+'\n');}
  }
 }finally{rl.close();}
}
