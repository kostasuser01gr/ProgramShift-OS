// Node-only verification of project source syntax; JSX parsed by TS compiler API if available.
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(join(dir,x.name)):[join(dir,x.name)]);}
let fail=0;const files=walk('app').concat(walk('lib'),walk('scripts')).filter(x=>/\.(?:mjs|js|jsx)$/.test(x));
for(const f of files){if(!f.endsWith('.mjs'))continue;const r=spawnSync(process.execPath,['--check',f]);if(r.status!==0){console.error('SYNTAX ERROR',f,r.stderr?.toString());fail++;}}
let ts;try{ts=await import('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');}catch{};
if(ts){for(const f of files.filter(x=>x.endsWith('.jsx')||x.endsWith('.js'))){const s=readFileSync(f,'utf8');const source=ts.createSourceFile(f,s,ts.ScriptTarget.Latest,true,f.endsWith('.jsx')?ts.ScriptKind.JSX:ts.ScriptKind.JS);if(source.parseDiagnostics.length){fail++;console.error('JSX PARSE ERROR',f,source.parseDiagnostics.map(x=>x.messageText));}}}
else console.warn('TypeScript JSX parser unavailable; JSX parse not independently verified.');
console.log(`Syntax checked ${files.length} sources; failures: ${fail}`);process.exitCode=fail?1:0;
