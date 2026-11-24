'use client';
import {decisionInbox} from '../../lib/decision-inbox.mjs';
export default function DecisionInbox({missing=0,invalid=0,warnings=0,status,onNavigate}){
 const tasks=decisionInbox({missing,invalid,warnings,status}).slice(0,4);
 return <section className="opsInbox" aria-label="Προτεινόμενες επόμενες ενέργειες">
  <div className="opsInboxIntro"><span className="eyebrow">GUIDED ACTIONS</span><h2>Επόμενες ενέργειες</h2><p>Οι προτάσεις παράγονται από κανόνες, όχι από AI μοντέλο. Δεν εκτελούνται αυτόματα.</p></div>
  <div className="opsInboxCards">{tasks.map(task=><article key={task.id} className={'opsInboxItem '+task.severity}><span className="opsInboxMark" aria-hidden="true">{task.severity==='high'?'!':'✓'}</span><div><h3>{task.title}</h3><p>{task.description}</p></div><button type="button" onClick={()=>onNavigate?.(task.route)} aria-label={'Άνοιγμα: '+task.title}>Άνοιγμα ↗</button></article>)}</div>
 </section>;
}
