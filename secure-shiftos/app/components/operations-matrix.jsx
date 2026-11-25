'use client';
import {useMemo} from 'react';
import {OPS_TEAMS,OPS_SLOTS} from '../../lib/operations/domain.mjs';
import {operationsMatrix,matrixHeatLevel} from '../../lib/operations/instrumentation.mjs';
export default function OperationsMatrix({tasks=[],station='HER',activeTeam='all',activeSlot='all',activeStatus='all',onSelect,onClear}){
 const model=useMemo(()=>operationsMatrix(tasks,station),[tasks,station]);
 const selected=activeTeam!=='all'||activeSlot!=='all'||activeStatus!=='all';
 return <section className="instMatrixPanel" aria-labelledby="inst-matrix-title">
  <header className="instMatrixHeader"><div><span className="instMicroLabel">WORK QUEUE · DISTRIBUTION</span><h3 id="inst-matrix-title">Εκκρεμότητες ανά ομάδα και ζώνη</h3><p>Επίλεξε μια μέτρηση για να δεις τις αντίστοιχες ανοιχτές εργασίες.</p></div><div className="instMatrixActions"><span className="instMatrixTotal"><strong>{model.totalOpen}</strong><small>Ανοιχτές εργασίες</small></span>{selected&&<button type="button" onClick={onClear} className="instReset" aria-label="Καθαρισμός φίλτρων κατανομής">Καθαρισμός φίλτρων</button>}</div></header>
  {model.totalOpen===0?<div className="instMatrixEmpty" role="status">Δεν υπάρχουν ανοιχτές εργασίες για να απεικονιστούν. Το διάγραμμα δεν παράγει τεχνητές τιμές.</div>:<div className="instMatrixScroll"><div className="instMatrixGrid" role="group" aria-label="Ανοιχτές εργασίες ανά ομάδα και χρονική ζώνη"><div className="instMatrixCorner" aria-hidden="true">Ομάδα / ζώνη</div>{model.slots.map(slot=><div key={slot} className="instMatrixColHeader">{OPS_SLOTS[slot]}</div>)}
   {model.teams.map(team=><div className="instMatrixRow" key={team}><div className="instMatrixTeamLabel">{OPS_TEAMS[team]}</div>{model.slots.map(slot=>{const cell=model.matrix[team][slot],level=matrixHeatLevel(cell.open,model.maxOpen),isActive=activeTeam===team&&activeSlot===slot&&activeStatus==='OPEN';return <button type="button" key={slot} className={'instMatrixCell'+(isActive?' isActive':'')} data-heat={level} disabled={cell.open===0} aria-pressed={isActive} aria-label={`${OPS_TEAMS[team]}, ${OPS_SLOTS[slot]}: ${cell.open} ανοιχτές εργασίες${cell.blocked?`, ${cell.blocked} σε αναμονή`:''}${cell.urgent?`, ${cell.urgent} επείγουσες`:''}`} title={`${OPS_TEAMS[team]} · ${OPS_SLOTS[slot]} — ${cell.open} ανοιχτές · ${cell.blocked} σε αναμονή · ${cell.urgent} επείγουσες`} onClick={()=>onSelect?.(team,slot)}><strong>{cell.open}</strong>{cell.blocked>0&&<small>! {cell.blocked}</small>}</button>;})}</div>)}
  </div></div>}
  <footer className="instMatrixLegend"><span><i className="instLegendMark"/>Σχετική ένταση ανά κελί — όχι ποσοστό στελέχωσης</span><span>Πηγή: τρέχουσες εγγραφές Operations · όχι live feed</span>{model.excluded>0&&<strong role="status">{model.excluded} μη έγκυρες εγγραφές δεν περιλήφθηκαν.</strong>}</footer>
 </section>;
}
