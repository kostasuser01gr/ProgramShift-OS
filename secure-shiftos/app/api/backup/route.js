import {requireActor} from '../../../lib/auth.js';
import {createStore} from '../../../lib/graph.mjs';
import {isMonth,isSameOrigin,noCacheHeaders} from '../../../lib/access.mjs';
import {CODE_TO_SHIFT,reviewWarnings} from '../../../lib/shifts.mjs';
import {encryptXlsx} from '../../../lib/backup.mjs';
import ExcelJS from 'exceljs';
import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const fail=(status)=>NextResponse.json({error:'Backup unavailable'},{status,headers:noCacheHeaders()});

export async function POST(req){
  if(!isSameOrigin(req))return fail(403);
  const a=await requireActor(req,'backup');if(!a.ok)return fail(a.status);
  let body;try{body=await req.json();}catch{return fail(400);}
  const month=body?.month,pass=body?.password;
  if(!isMonth(month)||typeof pass!=='string'||pass.length<16||pass.length>256)return fail(400);
  try{
    const r=await createStore(a.graphToken).roster(month);
    const dates=Array.from({length:new Date(+month.slice(0,4),+month.slice(5),0).getDate()},(_,i)=>month+'-'+String(i+1).padStart(2,'0'));
    const rows=new Map(r.shifts.map(s=>[s.employeeKey+'|'+s.date,s]));
    const w=new ExcelJS.Workbook(); w.creator='Europcar ShiftOS';w.created=new Date();
    const hours=w.addWorksheet('ΩΡΑΡΙΑ');const codes=w.addWorksheet('CODED');const checks=w.addWorksheet('CHECK');
    const header=['ΑΜΕ','ΟΝΟΜΑ',...dates];hours.addRow(header);codes.addRow(header);
    for(const employee of r.employees){
      const row=[employee.key,employee.name];const codeRow=[employee.key,employee.name];
      for(const day of dates){const c=rows.get(employee.key+'|'+day)?.code||'';row.push(CODE_TO_SHIFT[c]||c);codeRow.push(c);}
      hours.addRow(row);codes.addRow(codeRow);
    }
    checks.addRow(['ΑΜΕ','Εργαζόμενος','Ημερομηνία','Έλεγχος','Περιγραφή']);
    for(const v of reviewWarnings(r.context,r.employees).filter(x=>x.date.startsWith(month)))checks.addRow([v.employeeKey,v.employee,v.date,v.type,v.message]);
    for(const sheet of [hours,codes,checks]){sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF165A49'}};sheet.views=[{state:'frozen',xSplit:2,ySplit:1}];sheet.getColumn(2).width=28;sheet.getColumn(1).width=16;}
    const data=Buffer.from(await w.xlsx.writeBuffer());
    const encrypted=encryptXlsx(data,pass);
    return new Response(encrypted,{status:200,headers:{...noCacheHeaders(),'Content-Type':'application/octet-stream',
      'Content-Disposition':`attachment; filename="EUROPCAR_${month}.xlsx.enc"`}});
  }catch{return fail(503);}
}
