/** Read-only preview of a legacy Europcar workbook. Never uploads or prints personal staff data.
 * Optional --export writes JSON locally with mode 0600 (requires private approved environment).
 */
import ExcelJS from 'exceljs';
import {writeFile} from 'node:fs/promises';
import {CODE_TO_SHIFT} from '../lib/shifts.mjs';
const input=process.argv[2],exportFlag=process.argv[3]==='--export', output=process.argv[4];
if(!input||!input.endsWith('.xlsx')||(exportFlag&&!output)){
  console.error('Usage: node scripts/prepare-import.mjs PRIVATE_WORKBOOK.xlsx [--export OUTPUT_PRIVATE.json]');process.exitCode=2;
}else{
  const book=new ExcelJS.Workbook();
  try{
    await book.xlsx.readFile(input);
    const sheet=book.getWorksheet('ΩΡΑΡΙΑ');
    if(!sheet)throw Error('Missing canonical ΩΡΑΡΙΑ sheet. No data exported.');
    const keys=new Map(Object.entries(CODE_TO_SHIFT).filter(([key,value])=>/\d\d:\d\d-/.test(value)).map(([key,value])=>[value,key]));
    const employees=[],shifts=[];let unknown=0,missed=0;
    const days=[];
    sheet.getRow(1).eachCell({includeEmpty:false},(c,col)=>{
      if(col<4)return;
      let val=c.value;
      if(val instanceof Date) val=val.toISOString().slice(0,10);
      else val=String(val??'').slice(0,10);
      if(/^20\d\d-\d\d-\d\d$/.test(val))days.push({col,date:val});
    });
    if(!days.length)throw Error('Could not verify date header; no import performed.');
    sheet.eachRow((row,rowIndex)=>{
      if(rowIndex===1)return;
      const ame=String(row.getCell(1).value??'').trim();
      const surname=String(row.getCell(2).value??'').trim();
      const firstname=String(row.getCell(3).value??'').trim();
      if(!surname&&!firstname&&!ame)return;
      if(!ame){missed++;return;}
      employees.push({key:ame,name:`${surname} ${firstname}`.trim()});
      for(const {col,date} of days){
        const val=String(row.getCell(col).text||'').trim().replace(/[–—−]/g,'-');
        const code=!val?'':val==='ΡΕΠΟ'?'R':val.startsWith('ΑΔΕΙΑ')?'L':val.startsWith('ΑΝΑΡΡΩΤΙΚΗ')?'S':keys.get(val);
        if(val&&!code){unknown++;continue;}
        shifts.push({employeeKey:ame,date,code});
      }
    });
    console.log(JSON.stringify({sheets:book.worksheets.map(w=>w.name),employees:employees.length,days:days.length,
      shiftRows:shifts.length,unmappedCells:unknown,missingEmployeeKeys:missed,
      readyForImport:unknown===0&&missed===0},null,2));
    if(exportFlag){
      if(unknown||missed)throw Error('Import blocked due to incomplete codes or employee IDs.');
      await writeFile(output,JSON.stringify({schemaVersion:1,employees,shifts},null,2),{mode:0o600,flag:'wx'});
      console.log('Private preview exported locally (0600). Do NOT commit it to GitHub.');
    }
  }catch(e){console.error('Migration preview failed:',e.message);process.exitCode=1;}
}
