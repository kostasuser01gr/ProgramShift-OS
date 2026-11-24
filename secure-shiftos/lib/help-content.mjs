// Public interface documentation only. Never include live employees, credentials or private SharePoint data.
export const HELP_TOPICS = Object.freeze({
  overview: {title:'Επισκόπηση',short:'Η συνολική εικόνα του προγράμματος.',detail:'Συγκεντρώνει βάρδιες, εκκρεμότητες και ημερήσια κάλυψη. Οι αριθμοί προκύπτουν από το πρόγραμμα του επιλεγμένου μήνα.',connects:['schedule','coverage','checks']},
  schedule: {title:'Πρόγραμμα',short:'Εδώ καταχωρίζονται οι βάρδιες.',detail:'Επιλέγεις μήνα, εργαζόμενο και ημέρα. Η αλλαγή μιας βάρδιας επηρεάζει τον υπολογισμό κάλυψης και τους ελέγχους. Σε πραγματική λειτουργία χρειάζεται εγκεκριμένος λογαριασμός.',connects:['coverage','checks','release']},
  coverage: {title:'Κάλυψη σταθμού',short:'Πόσοι είναι προγραμματισμένοι ανά ημέρα.',detail:'Υπολογίζεται από τις βάρδιες της κάθε ημέρας. Δεν αποτελεί αυτόματα εγκεκριμένη στελέχωση ή πρόβλεψη φόρτου.',connects:['schedule','checks']},
  checks: {title:'Έλεγχοι CHECK',short:'Προειδοποιήσεις για πιθανά λάθη.',detail:'Ελέγχει άγνωστους κωδικούς, κενά και διαστήματα ανάπαυσης. Ο έλεγχος 35ωρης είναι ενδεικτικός και απαιτεί επιβεβαίωση. Δεν υποκαθιστά ανθρώπινο ή νομικό έλεγχο.',connects:['schedule','release']},
  release: {title:'Δημοσίευση',short:'Η ροή έγκρισης του προγράμματος.',detail:'DRAFT → REVIEW → PUBLISHED → LOCKED. Η αλλαγή κατάστασης αφορά εγκεκριμένους χρήστες και δεν παρέχει από μόνη της δικαιώματα προβολής σε προσωπικό.',connects:['checks','backup']},
  backup: {title:'Excel Backup',short:'Ασφαλές, κρυπτογραφημένο αντίγραφο.',detail:'Σε πραγματική λειτουργία ο manager μπορεί να δημιουργήσει κρυπτογραφημένο αρχείο .xlsx.enc με δικό του κωδικό. Το Excel είναι αντίγραφο ασφαλείας, όχι η βάση ζωντανών αλλαγών.',connects:['release']},
  period: {title:'Περίοδος / μήνας',short:'Επιλογή του μήνα εργασίας.',detail:'Κάθε μήνας είναι ανεξάρτητη περίοδος. Η πλοήγηση αλλάζει την περίοδο που προβάλλεται· δεν μεταφέρει αυτόματα καταχωρίσεις.',connects:['schedule']},
  codes: {title:'Κωδικοί βαρδιών',short:'Οι σύντομοι κωδικοί αντιστοιχούν σε ωράρια.',detail:'Παράδειγμα: 203 → 07:00–15:00 και R → ρεπό, βάσει του δοκιμαστικού πίνακα CODED. Δεν είναι σωστό να εισαχθεί άγνωστος κωδικός.',connects:['schedule','checks']},
  rest: {title:'Ανάπαυση 11ωρης / 35ωρης',short:'Έλεγχοι διαδοχικών βαρδιών και ανάπαυσης.',detail:'Ο μηχανισμός εξετάζει και βάρδιες που περνούν τα μεσάνυχτα. Οι προειδοποιήσεις απαιτούν επιβεβαίωση και σωστή κάλυψη δεδομένων.',connects:['checks','release']},
  search: {title:'Αναζήτηση και φίλτρα',short:'Εντοπισμός εργαζομένου και τύπου βάρδιας.',detail:'Τα φίλτρα αλλάζουν μόνο την προβολή. Δεν αφαιρούν εγγραφές, ούτε μεταβάλλουν το δημοσιευμένο πρόγραμμα.',connects:['schedule']},
  stage: {title:'DRAFT · REVIEW · PUBLISHED · LOCKED',short:'Ο κύκλος ζωής κάθε προγράμματος.',detail:'DRAFT = επεξεργασία · REVIEW = έλεγχος · PUBLISHED = εγκεκριμένη έκδοση · LOCKED = κλείδωμα επεξεργασίας. Η ορατότητα στο Microsoft 365 ελέγχεται χωριστά από την κατάσταση.',connects:['release','backup']},
  access: {title:'Πρόσβαση και ταυτοποίηση',short:'Ατομική εταιρική σύνδεση, όχι κοινός κωδικός.',detail:'Η πραγματική εφαρμογή ελέγχει την ταυτότητα και τη ρητή έγκριση χρήστη στον server. Ένα tooltip, κρυφό φύλλο ή γενικός κωδικός Excel δεν προστατεύει εμπιστευτικά δεδομένα.',connects:['release','backup']},
  commands: {title:'Γρήγορες εντολές',short:'Συντομεύσεις πληκτρολογίου.',detail:'⌘K / Ctrl+K ανοίγει το μενού εντολών στο demo, το / οδηγεί στην αναζήτηση και το ? ανοίγει τον οδηγό όταν δεν γράφεις σε πεδίο.',connects:['search','overview']},
  audit: {title:'Ιστορικό ενεργειών',short:'Ποιος άλλαξε τι και πότε.',detail:'Στο demo το ιστορικό υπάρχει μόνο στη μνήμη της τρέχουσας σελίδας. Για πραγματική χρήση απαιτείται αμετάβλητο server-side audit log.',connects:['schedule','release']},
  lab: {title:'Προσομοίωση φόρτου',short:'Δοκιμή υποθετικών παραδόσεων και επιστροφών.',detail:'Άλλαξε τις χειροκίνητες παραδοχές και δες την επίδραση σε τρεις ζώνες. Η ανάλυση δεν συνδέεται με πραγματικές κρατήσεις, δεν εκτελεί αλλαγές και δεν πιστοποιεί στελέχωση.',connects:['schedule','coverage','flow']},
  hub: {title:'Κέντρο εργασιών',short:'Πίνακας εκκρεμοτήτων και ελεγχόμενων εργαλείων.',detail:'Ενώνει τους ίδιους ελέγχους με read-only εργαλεία, προσομοίωση, προτάσεις χωρίς εγγραφή και εκπαιδευτικές οδηγίες. Δεν στέλνει αιτήματα έγκρισης ούτε δημιουργεί μόνιμο audit.',connects:['schedule','coverage','checks','flow']},
  flow: {title:'Ροές εργασίας',short:'Οδηγός τεσσάρων σταδίων για υπευθύνους.',detail:'Οπτική καθοδήγηση: Πρόγραμμα, Έλεγχος, Έγκριση, Backup. Η πλοήγηση δεν εκτελεί αυτόματα ή μη εγκεκριμένες ενέργειες.',connects:['schedule','checks','release','backup']},
  security: {title:'Κέντρο ασφάλειας Excel',short:'Ζωντανή εικόνα δικαιωμάτων και σύνδεσμοι πρόσβασης.',detail:'Η εφαρμογή επιθεωρεί read-only τα δικαιώματα αρχείου και γονικού φακέλου. Αν υπάρχουν ευρείς ή ανώνυμοι σύνδεσμοι, δεν χαρακτηρίζει το αρχείο ιδιωτικό. Ο κωδικός backup είναι διαφορετικός από την πρόσβαση στο κύριο Excel. Τα υπάρχοντα email δεν τροποποιούνται.',connects:['access','backup','release']},
  demo: {title:'Δοκιμαστικό περιβάλλον',short:'Ασφαλής προσομοίωση χωρίς προσωπικά δεδομένα.',detail:'Οι εργαζόμενοι είναι φανταστικοί, οι αλλαγές δεν αποθηκεύονται στη Microsoft και δεν παράγονται πραγματικά backups.',connects:['overview','schedule']},
});

export const GUIDE_STEPS = Object.freeze([
  {id:'welcome',title:'Καλώς ήρθες στο ShiftOS',topic:'demo',section:'overview',text:'Ξεκίνα από την επισκόπηση. Όσα βλέπεις στο demo είναι συνθετικά δεδομένα και δεν αλλάζουν το επίσημο Excel.',task:'Άνοιξε την Επισκόπηση.'},
  {id:'period',title:'Διάλεξε μήνα',topic:'period',section:'schedule',text:'Χρησιμοποίησε τα βελάκια περιόδου. Κάθε μήνας έχει δικές του βάρδιες.',task:'Μετάβαση στο Πρόγραμμα.'},
  {id:'assign',title:'Καταχώρισε μία βάρδια',topic:'codes',section:'schedule',text:'Βρες εργαζόμενο με την αναζήτηση, πάτησε κελί και διάλεξε κωδικό από τη λίστα.',task:'Δοκίμασε αλλαγή μόνο στο συνθετικό demo.'},
  {id:'capacity',title:'Δες την κάλυψη',topic:'coverage',section:'coverage',text:'Η αλλαγή βάρδιας ενημερώνει τον πίνακα κάλυψης. Διάλεξε ημέρα για ανάλυση.',task:'Άνοιξε την Κάλυψη σταθμού.'},
  {id:'validate',title:'Έλεγξε τα CHECK',topic:'checks',section:'checks',text:'Δες άγνωστους κωδικούς, κενά και προειδοποιήσεις ανάπαυσης πριν από την έγκριση.',task:'Άνοιξε τους Ελέγχους CHECK.'},
  {id:'publish',title:'Κατανόησε τη δημοσίευση',topic:'stage',section:'release',text:'Η πορεία DRAFT → REVIEW → PUBLISHED → LOCKED έχει κανόνες και δεν αλλάζει αυτόματα τα δικαιώματα των εργαζομένων.',task:'Άνοιξε τη Δημοσίευση.'},
  {id:'security',title:'Έλεγξε ποιος μπορεί να δει το αρχείο',topic:'security',section:'security',text:'Έλεγξε σύνδεσμο αρχείου, δικαιώματα γονικού φακέλου και πρόσβαση μέσω κοινούχρηστου λογαριασμού. Μην συγχέεις τον κωδικό backup με το κλείδωμα του Excel.',task:'Άνοιξε το Κέντρο ασφάλειας.'},
  {id:'hub',title:'Δες το Κέντρο εργασιών',topic:'hub',section:'hub',text:'Άνοιξε τον πίνακα εκκρεμοτήτων και τα ασφαλή εργαλεία. Η προεπισκόπηση έγκρισης δεν υποβάλλει πραγματικό αίτημα.',task:'Άνοιξε το Κέντρο εργασιών.'},
  {id:'whatif',title:'Δοκίμασε χωρίς να αλλάξεις τίποτα',topic:'lab',section:'lab',text:'Στον προσομοιωτή επιλέγεις υποθετικές παραδόσεις και επιστροφές. Τα αποτελέσματα δεν είναι πρόβλεψη πραγματικών κρατήσεων.',task:'Άνοιξε την Προσομοίωση.'},
  {id:'workflow',title:'Ακολούθησε τις ροές εργασίας',topic:'flow',section:'flow',text:'Οι τέσσερις φάσεις βοηθούν στην οργάνωση της ημέρας. Κανένα πάτημα δεν δημοσιεύει πρόγραμμα αυτόματα.',task:'Άνοιξε τις Ροές εργασίας.'},
  {id:'restore',title:'Διατήρησε ασφαλές αντίγραφο',topic:'backup',section:'backup',text:'Το Excel είναι κρυπτογραφημένο backup. Το demo δεν μπορεί να εξαγάγει αληθινά αρχεία ή να συνδεθεί με Microsoft 365.',task:'Άνοιξε την ενότητα Excel Backup.'},
]);

export const CONNECTIONS = Object.freeze([
  {id:'schedule',label:'Βάρδιες & CODED',desc:'Καταχώριση εισόδου'},
  {id:'coverage',label:'Κάλυψη',desc:'Αριθμός βαρδιών ανά ημέρα'},
  {id:'checks',label:'CHECK',desc:'Προειδοποιήσεις / εγκυρότητα'},
  {id:'release',label:'Έγκριση',desc:'DRAFT → REVIEW → PUBLISHED'},
  {id:'lab',label:'Προσομοίωση',desc:'Υποθετική εκτίμηση φόρτου'},
  {id:'hub',label:'Κέντρο εργασιών',desc:'Αναλύσεις, κανόνες και εργαλεία read-only'},
  {id:'flow',label:'Οδηγός ροής',desc:'Εξήγηση των ελεγχόμενων βημάτων'},
  {id:'security',label:'Security Center',desc:'Read-only ACL audit & verification'},
  {id:'backup',label:'Excel Backup',desc:'Κρυπτογραφημένο αντίγραφο'},
]);

export function normalizeGreek(value='') {return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('el-GR').trim();}
export function searchHelp(query='') {const needle=normalizeGreek(query);return Object.entries(HELP_TOPICS).filter(([,topic])=>!needle||normalizeGreek([topic.title,topic.short,topic.detail].join(' ')).includes(needle));}
export function topicForSection(section) {return section === 'grid' ? 'schedule' : (Object.prototype.hasOwnProperty.call(HELP_TOPICS,section) ? section : 'overview');}
export function nextStep(index,delta){return Math.max(0,Math.min(GUIDE_STEPS.length-1,index+delta));}

export function sectionForTopic(topic){
 const aliases={codes:'schedule',search:'schedule',period:'schedule',stage:'release',rest:'checks',demo:'overview',audit:'release',access:'overview',commands:'overview'};
 const section=aliases[topic]||topic;
 return ['overview','schedule','coverage','checks','release','backup','security','lab','flow','hub'].includes(section)?section:'overview';
}
