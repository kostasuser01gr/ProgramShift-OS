import {readFile,writeFile} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import {execFileSync} from 'node:child_process';
import {decryptXlsx} from '../lib/backup.mjs';

const source=process.argv[2];
if(!source||!source.endsWith('.xlsx.enc')){console.error('Usage: node scripts/decrypt-backup.mjs path/to/backup.xlsx.enc');process.exitCode=2;}
else{
  const rl=createInterface({input,output});
  let echoDisabled=false;
  try {
    if(input.isTTY && process.platform!=='win32') {execFileSync('stty',['-echo'],{stdio:'inherit'});echoDisabled=true;}
    const password=await rl.question('Supervisor backup passphrase: ');
    if(echoDisabled){execFileSync('stty',['echo'],{stdio:'inherit'});echoDisabled=false;output.write('\n');}
    const bytes=decryptXlsx(await readFile(source),password);
    const target=source.slice(0,-4);
    await writeFile(target,bytes,{flag:'wx',mode:0o600});
    console.log('Recovered XLSX:',target);
  }catch(e){console.error('Unable to decrypt or file already exists:',e.message);process.exitCode=1;}
  finally{if(echoDisabled)try{execFileSync('stty',['echo'],{stdio:'inherit'});}catch{} rl.close();}
}
