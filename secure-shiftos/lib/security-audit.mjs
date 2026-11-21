// Source-of-truth access assessment. A workbook protection password is NOT an ACL.
const broadScopes = new Set(['anonymous', 'organization']);
const validScopes = new Set(['anonymous', 'organization', 'users']);
const roles = new Set(['owner', 'write', 'read']);

export function assessPermissions(filePermissions, parentPermissions, options = {}) {
  if (!Array.isArray(filePermissions) || !Array.isArray(parentPermissions)) {
    return { state: 'UNVERIFIED', reason: 'Δεν ολοκληρώθηκε ο έλεγχος δικαιωμάτων.', riskCount: null, risks: [], directGrants: null };
  }
  const risks = [];
  const direct = new Set();
  const snapshots = [
    ['file', 'Αρχείο Excel', filePermissions],
    ['parent', 'Γονικός φάκελος', parentPermissions],
  ];
  let explicitOwnerCount = 0;
  for (const [layer, label, permissions] of snapshots) {
    for (const permission of permissions) {
      if (!permission || typeof permission !== 'object') continue;
      const scope = String(permission.link?.scope || '').toLowerCase();
      if (permission.link && (!validScopes.has(scope) || !scope)) {
        risks.push({ layer, kind: 'UNCLEAR_LINK', label: `${label}: σύνδεσμος μη επαληθευμένου εύρους` });
      } else if (permission.link && broadScopes.has(scope)) {
        risks.push({ layer, kind: 'BROAD_LINK', label: `${label}: πρόσβαση μέσω συνδέσμου (${scope})` });
      }
      const p = permission.grantedToV2 || permission.grantedTo || permission.granted_to_v2 || permission.granted_to;
      const identity = p?.user?.id || p?.user?.email || p?.siteUser?.id;
      if (layer === 'file' && identity) direct.add(String(identity).toLowerCase());
      const assignedRoles = Array.isArray(permission.roles) ? permission.roles : [];
      if (layer === 'file' && assignedRoles.some(r => roles.has(String(r).toLowerCase()) && String(r).toLowerCase() === 'owner')) explicitOwnerCount++;
    }
  }
  const sharedAccountStillHasAccess = options.sharedAccountHasAccess !== false;
  if (sharedAccountStillHasAccess) {
    risks.push({ layer: 'identity', kind: 'SHARED_ACCOUNT', label: 'Κοινόχρηστος λογαριασμός: οι χρήστες με κοινή σύνδεση δεν διαχωρίζονται' });
  }
  return {
    state: risks.length ? 'NOT_PRIVATE' : 'REQUIRES_HUMAN_VERIFICATION',
    riskCount: risks.length,
    risks,
    directGrants: direct.size,
    ownersFound: explicitOwnerCount,
    existingIdentitiesPreserved: true,
    evidence: 'READ_ONLY',
  };
}

export function runbook() {
  return [
    {id:'backup', title:'Σώσε ασφαλές αντίγραφο και επιβεβαίωσε το ιστορικό εκδόσεων', owner:'Προϊστάμενος'},
    {id:'accounts', title:'Επιβεβαίωσε όλους τους σημερινούς καταχωρισμένους λογαριασμούς (χωρίς διαγραφή email)', owner:'Προϊστάμενος'},
    {id:'links', title:'OneDrive → ΠΡΟΓΡΑΜΜΑ.xlsx → Διαχείριση πρόσβασης → κατάργηση ανώνυμων συνδέσμων', owner:'Ιδιοκτήτης αρχείου'},
    {id:'folder', title:'OneDrive → HERAKLION → Διαχείριση πρόσβασης → κατάργηση συνδέσμων ευρείας πρόσβασης', owner:'Ιδιοκτήτης φακέλου'},
    {id:'shared', title:'Έλεγχος κοινούχρηστου λογαριασμού σταθμού: απομόνωση εμπιστευτικού αρχείου σε χώρο με ατομικές ταυτότητες', owner:'Microsoft 365 IT'},
    {id:'purview', title:'Έλεγχος διαθεσιμότητας Purview sensitivity label και συμβατότητας co-authoring', owner:'Microsoft 365 IT'},
    {id:'verify', title:'Δοκιμή με μη εξουσιοδοτημένο λογαριασμό, έλεγχο εκδόσεων και ταυτόχρονες αλλαγές', owner:'Προϊστάμενοι + IT'},
  ];
}

export function passwordGuidance(value) {
  const len = Array.from(String(value || '')).length;
  return { valid: len >= 16 && len <= 256, length: len, message: len < 16 ? 'Για το κρυπτογραφημένο backup χρησιμοποίησε τουλάχιστον 16 χαρακτήρες.' : len > 256 ? 'Μέγιστο 256 χαρακτήρες.' : 'Αποδεκτό μήκος για το backup. Διατήρησε τον κωδικό σε εταιρικό password manager.' };
}
