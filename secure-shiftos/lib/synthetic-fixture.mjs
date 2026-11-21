import {dateKeys} from './insights.mjs';

// All identities are intentionally fictional. Never import customer or staff records in the demo.
const NAMES=['Υποθετικός Α','Υποθετική Β','Υποθετικός Γ','Υποθετική Δ','Υποθετικός Ε','Υποθετική ΣΤ','Υποθετικός Ζ','Υποθετική Η','Υποθετικός Θ','Υποθετική Ι','Υποθετικός Κ','Υποθετική Λ'];
const BASE=['203','203','301','301','206','208','211','213','402','402','217','217'];
export function syntheticRoster(month='2026-11'){
  const dates=dateKeys(month);
  const employees=NAMES.map((name,i)=>({key:`DEMO-${String(i+1).padStart(2,'0')}`,name,team:i<4?'Front Desk':i<8?'Operations':'Night / Support'}));
  const shifts=[];
  employees.forEach((employee,i)=>dates.forEach((date,j)=>{
    // Deliberately simple fictional schedule; not a staffing recommendation.
    let code=(j+i*2)%7>=5?'R':BASE[i];
    if(i===1&&j===14)code='';
    if(i===4&&j===19)code='999';
    if(i===10&&j===10)code='203'; // follows an overnight shift for a CHECK example
    shifts.push({employeeKey:employee.key,date,code});
  }));
  return {month,employees,shifts};
}
