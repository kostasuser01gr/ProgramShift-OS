/** Deterministic, read-only suggestions. Never authorizes or performs a write. */
function count(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.floor(n)):0;}
export function decisionInbox({missing=0,invalid=0,warnings=0,status='UNCONFIGURED'}={}){
  const inbox=[];
  const gaps=count(missing),bad=count(invalid),checks=count(warnings);
  if(bad)inbox.push({id:'invalid',severity:'high',title:'Έλεγξε τους κωδικούς',description:`${bad} μη αναγνωρισμένες καταχωρίσεις χρειάζονται επιβεβαίωση.`,route:'checks'});
  if(gaps)inbox.push({id:'missing',severity:'high',title:'Συμπλήρωσε το πρόγραμμα',description:`${gaps} κενές θέσεις στο μηνιαίο πρόγραμμα.`,route:'schedule'});
  if(checks)inbox.push({id:'checks',severity:'high',title:'Επίλυσε τα CHECK',description:`${checks} προειδοποιήσεις απαιτούν επανεξέταση από υπεύθυνο.`,route:'checks'});
  if(status==='UNCONFIGURED')inbox.push({id:'setup',severity:'info',title:'Δεν έχει δημιουργηθεί περίοδος',description:'Χρειάζεται εταιρική παραμετροποίηση πριν από πραγματικές αλλαγές.',route:'flow'});
  else if(status==='DRAFT')inbox.push({id:'review',severity:'info',title:'Οργάνωσε την ανασκόπηση',description:'Έλεγξε την κάλυψη και τις εκκρεμότητες πριν ζητήσεις έγκριση.',route:'flow'});
  else if(status==='REVIEW')inbox.push({id:'approve',severity:'info',title:'Προετοίμασε την έγκριση',description:'Η τελική δημοσίευση γίνεται μόνο μετά τον έλεγχο του server.',route:'release'});
  else if(status==='PUBLISHED')inbox.push({id:'backup',severity:'info',title:'Έλεγξε την ασφαλή διατήρηση',description:'Επιβεβαίωσε ότι υπάρχει δοκιμασμένο, κρυπτογραφημένο αντίγραφο.',route:'backup'});
  else if(status==='LOCKED')inbox.push({id:'locked',severity:'info',title:'Η περίοδος είναι κλειδωμένη',description:'Για αλλαγές απαιτείται νέα εγκεκριμένη διαδικασία.',route:'flow'});
  if(!inbox.length)inbox.push({id:'inspect',severity:'info',title:'Κάνε έναν τελευταίο έλεγχο',description:'Οι αυτοματοποιημένοι έλεγχοι δεν αντικαθιστούν τον υπεύθυνο.',route:'checks'});
  return inbox;
}
