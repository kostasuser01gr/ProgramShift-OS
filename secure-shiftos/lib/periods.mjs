import {isPeriodStatus} from './access.mjs';
export class PeriodTransitionError extends Error{}
const allowed = Object.freeze({DRAFT:['REVIEW'],REVIEW:['DRAFT','PUBLISHED'],PUBLISHED:['LOCKED'],LOCKED:['DRAFT']});
/** Approval is an explicit manager action. Edits to PUBLISHED or LOCKED are disallowed. */
export function canEditPeriod(status){return status==='DRAFT'||status==='REVIEW';}
export function validateTransition(current,next,{reviewed=false}={}){
  if(!isPeriodStatus(current)||!isPeriodStatus(next)||!allowed[current].includes(next))throw new PeriodTransitionError('Forbidden release transition');
  if(next==='PUBLISHED'&&!reviewed)throw new PeriodTransitionError('Review must be acknowledged');
  return next;
}
