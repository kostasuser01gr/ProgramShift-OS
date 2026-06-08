/*************************************************************************************************
 *  ΠΡΟΓΡΑΜΜΑ ΒΑΡΔΙΩΝ — Bound Apps Script for the monthly staff shift schedule
 *  -----------------------------------------------------------------------------------------------
 *  Spreadsheet : "ΙΟΥΝΙΟΣ 2026 ΣΟΦΙΑ"  (≈29 employees, 30 day-columns)
 *  Tabs        : ΩΡΑΡΙΑ (human-readable input) · CODED (numeric mirror) · CHECK (legacy, untouched)
 *
 *  WHAT THIS DOES, in one click (menu «Εργαλεία Προγράμματος» → «🚀 Πλήρης Εγκατάσταση»):
 *    1.  Seeds the FULL valid-shift list into a hidden sheet and binds the named range SHIFTS.
 *    2.  Puts a reject-invalid dropdown on the shift grid D2:AG200.
 *    3.  Applies the 7 colour rules (invalid / repo / leave / night / late / midday / morning).
 *    4.  Builds dashboards: ΣΥΝΟΨΗ (coverage), ΚΑΡΤΕΛΑ ΥΠΑΛΛΗΛΟΥ (employee), ΤΡΕΧΟΥΣΑ ΕΒΔΟΜΑΔΑ.
 *    5.  Builds the warnings sheet ΠΡΟΕΙΔΟΠΟΙΗΣΕΙΣ (rest-gap, nights, long streaks, sandwich, invalid).
 *    6.  Builds the edit-history sheet ΙΣΤΟΡΙΚΟ and installs the onEdit + daily-backup triggers.
 *    7.  Applies all protections (owner keeps everything; editors can only fill D2:AG200).
 *
 *  IMPORTANT: This script is run by the OWNER inside the live file. It is idempotent — every setup
 *  function is safe to re-run. Nothing here can email passwords, reach the internet, or touch CHECK.
 *
 *  To repoint everything at CODED (if your team types numeric codes instead of text shifts):
 *  set CONFIG.INPUT_SHEET = CONFIG.SHEETS.CODED and CONFIG.USE_CODES = true, then re-run setup.
 *************************************************************************************************/


/* ============================================================================================ *
 *  CONFIG  —  the only block you should ever need to edit
 * ============================================================================================ */
var CONFIG = {

  /* --- sheet names ------------------------------------------------------------------------- */
  SHEETS: {
    ORARIA:    'ΩΡΑΡΙΑ',                 // human-readable schedule  (THE input sheet)
    CODED:     'CODED',                  // numeric mirror           (derived; owner-only)
    CHECK:     'CHECK',                  // legacy grid              (LEAVE UNTOUCHED)
    LIST:      'ΛΙΣΤΑ_ΒΑΡΔΙΩΝ',          // hidden helper holding the SHIFTS list
    SUMMARY:   'ΣΥΝΟΨΗ',                 // coverage dashboard
    CARD:      'ΚΑΡΤΕΛΑ ΥΠΑΛΛΗΛΟΥ',      // one-employee view (dropdown)
    WEEK:      'ΤΡΕΧΟΥΣΑ ΕΒΔΟΜΑΔΑ',      // whole team, 7 days from TODAY()
    WARN:      'ΠΡΟΕΙΔΟΠΟΙΗΣΕΙΣ',        // validator output
    HISTORY:   'ΙΣΤΟΡΙΚΟ',               // edit log
    STATS:     'ΣΤΑΤΙΣΤΙΚΑ'              // fairness / balance report  (v2)
  },

  /* --- which sheet people actually edit ---------------------------------------------------- */
  INPUT_SHEET: 'ΩΡΑΡΙΑ',                 // = SHEETS.ORARIA. Set to 'CODED' to repoint (see top).
  USE_CODES:   false,                    // true → validate/colour/aggregate the numeric code set
  AUTO_SYNC_CODED: true,                  // v2: mirror ΩΡΑΡΙΑ edits into CODED automatically (onEdit)

  /* --- named range bound to the list ------------------------------------------------------- */
  NAMED_RANGE: 'SHIFTS',

  /* --- grid geometry (identical on ΩΡΑΡΙΑ / CODED / CHECK) ---------------------------------- */
  GRID: {
    HEADER_ROW: 1,                       // row 1 = dates
    FIRST_ROW:  2,                       // employees start row 2
    LAST_ROW:   200,                     // generous: new employees appear automatically
    FIRST_COL:  4,                       // D = day 1
    LAST_COL:   33,                      // AG = day 30  (30 day-columns)
    COL_AME:    1,                       // A = ΑΜΕ (id)
    COL_SURNAME:2,                       // B = ΕΠΩΝΥΜΟ
    COL_NAME:   3                        // C = ΟΝΟΜΑ
  },

  /* --- tunable thresholds for the validator ------------------------------------------------ */
  RULES: {
    MIN_REST_HOURS:      11,             // rest gap below this between worked days = hard 🛑
    MAX_CONSEC_NIGHTS:    4,             // more than this many nights in a row = 🛑
    MAX_CONSEC_WORKDAYS:  6,             // more than this many worked days w/o ΡΕΠΟ = 🛑
    FLAG_EMPTY_CELLS:  true              // list blank cells for active employees as ⚠️
  },

  /* --- staffing limits for the ΣΥΝΟΨΗ indicator row ---------------------------------------- */
  STAFF: { MIN_PER_DAY: 12, MAX_PER_DAY: 24 },

  /* --- backup / pdf ------------------------------------------------------------------------ */
  BACKUP: { HOUR: 2, RETENTION_DAYS: 30, FOLDER: 'Backups — Πρόγραμμα Βαρδιών' },
  PDF:    { FOLDER: 'PDF — Πρόγραμμα Βαρδιών' },

  /* --- conditional-format colours (background) --------------------------------------------- */
  COLORS: {
    INVALID: '#CC0000', REPO: '#EFEFEF', LEAVE: '#F4CCCC', NIGHT: '#B4A7D6',
    LATE: '#FCE5CD', MIDDAY: '#CFE2F3', MORNING: '#D9EAD3'
  }
};

/* ---------------------------------------------------------------------------------------------
 *  THE REAL VALID-SHIFT SET  (derived from the live code↔shift table in cols AJ:AK).
 *  Text values = canonical (the ΩΡΑΡΙΑ values). Order: 8h ranges, then 6-day variants, then tokens.
 * ------------------------------------------------------------------------------------------- */
var SHIFT_VALUES_TEXT = [
  // standard ~8h ranges, on the hour and half-hour
  '04:00-12:00','05:00-13:00','06:00-14:00','07:00-15:00','07:30-15:30',
  '08:00-16:00','09:00-17:00','10:00-18:00','10:30-18:30','11:00-19:00',
  '12:00-20:00','12:30-20:30','13:00-21:00','13:30-21:30','14:00-22:00',
  '14:30-22:30','15:00-23:00','15:30-23:30','16:00-00:00','17:00-01:00',
  '18:00-02:00','22:00-06:00','23:00-07:00',
  // six-day (~6h40) variants — note 16:30-23:10 ends :10, the rest end :40
  '07:00-13:40','08:00-14:40','09:00-15:40','10:00-16:40','11:00-17:40',
  '12:00-18:40','13:00-19:40','14:00-20:40','15:00-21:40','16:00-22:40',
  '16:30-23:10','17:00-23:40',
  // non-work tokens
  'ΡΕΠΟ','ΑΔΕΙΑ 5ΗΜΕΡΟΥ','ΑΔΕΙΑ 6ΗΜΕΡΟΥ','ΑΝΑΡΡΩΤΙΚΗ 5ΗΜΕΡΟΥ','ΑΝΑΡΡΩΤΙΚΗ 6ΗΜΕΡΟΥ'
];

/* The numeric code set (used only if CONFIG.USE_CODES = true). 'R' = ΡΕΠΟ. */
var SHIFT_VALUES_CODED = [
  '422','201','202','203','403','301','206','208','209','210','211','404','212','405',
  '213','406','214','402','215','333','218','216','217',
  '232','233','234','235','240','241','236','237','238','239','242','243','R'
];

/** Returns the active list of valid values depending on CONFIG.USE_CODES. */
function shiftValues_() { return CONFIG.USE_CODES ? SHIFT_VALUES_CODED : SHIFT_VALUES_TEXT; }

/* ---------------------------------------------------------------------------------------------
 *  TEXT → CODE map (from the live AJ:AK table) — used by the ΩΡΑΡΙΑ→CODED mirror (v2).
 *  Leave tokens have no clean numeric code in the legacy table (208/235 are reused for work
 *  shifts too), so the mirror passes them through AS TEXT — lossless and reversible.
 * ------------------------------------------------------------------------------------------- */
var TEXT_TO_CODE = {
  '04:00-12:00':'422','05:00-13:00':'201','06:00-14:00':'202','07:00-15:00':'203',
  '07:30-15:30':'403','08:00-16:00':'301','09:00-17:00':'206','10:00-18:00':'208',
  '10:30-18:30':'209','11:00-19:00':'210','12:00-20:00':'211','12:30-20:30':'404',
  '13:00-21:00':'212','13:30-21:30':'405','14:00-22:00':'213','14:30-22:30':'406',
  '15:00-23:00':'214','15:30-23:30':'402','16:00-00:00':'215','17:00-01:00':'333',
  '18:00-02:00':'218','22:00-06:00':'216','23:00-07:00':'217',
  '07:00-13:40':'243','08:00-14:40':'232','09:00-15:40':'233','10:00-16:40':'234',
  '11:00-17:40':'235','12:00-18:40':'236','13:00-19:40':'237','14:00-20:40':'238',
  '15:00-21:40':'239','16:00-22:40':'240','16:30-23:10':'241','17:00-23:40':'242',
  'ΡΕΠΟ':'R'
};
var GREEK_MONTHS = ['ΙΑΝΟΥΑΡΙΟΣ','ΦΕΒΡΟΥΑΡΙΟΣ','ΜΑΡΤΙΟΣ','ΑΠΡΙΛΙΟΣ','ΜΑΪΟΣ','ΙΟΥΝΙΟΣ',
                    'ΙΟΥΛΙΟΣ','ΑΥΓΟΥΣΤΟΣ','ΣΕΠΤΕΜΒΡΙΟΣ','ΟΚΤΩΒΡΙΟΣ','ΝΟΕΜΒΡΙΟΣ','ΔΕΚΕΜΒΡΙΟΣ'];

/** Map one human-readable value to its CODED equivalent (leave/unknown pass through as text). */
function toCode_(text) {
  var t = String(text).trim();
  if (t === '') return '';
  if (isRepo_(t)) return 'R';
  if (TEXT_TO_CODE[t]) return TEXT_TO_CODE[t];
  return t;   // leave tokens & anything unmapped stay as-is
}


/* ============================================================================================ *
 *  MENU
 * ============================================================================================ */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Εργαλεία Προγράμματος')
      .addItem('🚀 Πλήρης Εγκατάσταση (ένα κλικ)', 'menuSetupEverything')
      .addItem('🔗 Οδηγός Κοινής Χρήσης', 'menuSetupSharing')
      .addSeparator()
      .addItem('✅ Έλεγχος Προγράμματος', 'menuRunValidator')
      .addItem('⚠️ Άνοιγμα Προειδοποιήσεων', 'menuOpenWarnings')
      .addItem('📊 Άνοιγμα Σύνοψης Κάλυψης', 'menuOpenSummary')
      .addItem('👤 Άνοιγμα Καρτέλας Υπαλλήλου', 'menuOpenCard')
      .addItem('📅 Άνοιγμα Τρέχουσας Εβδομάδας', 'menuOpenWeek')
      .addSeparator()
      .addItem('🖨️ Εξαγωγή σε PDF', 'menuExportPdf')
      .addItem('💾 Αντίγραφο Ασφαλείας Τώρα', 'menuBackupNow')
      .addSeparator()
      .addSubMenu(ui.createMenu('Επεκτάσεις')
        .addItem('🔁 Συγχρονισμός CODED', 'menuSyncCoded')
        .addItem('🔎 Έλεγχος συμφωνίας ΩΡΑΡΙΑ/CODED', 'menuCheckSync')
        .addItem('📈 Στατιστικά / Ισορροπία', 'menuStats')
        .addItem('🗓️ Νέος μήνας (αντίγραφο)', 'menuNewMonth'))
      .addSubMenu(ui.createMenu('Για προχωρημένους')
        .addItem('1. Λίστα βαρδιών + SHIFTS', 'menuBuildList')
        .addItem('2. Dropdown (έλεγχος εγκυρότητας)', 'menuApplyValidation')
        .addItem('3. Χρωματικοί κανόνες', 'menuApplyFormatting')
        .addItem('4. Σύνοψη / Καρτέλα / Εβδομάδα', 'menuBuildDashboards')
        .addItem('5. Φύλλο Ιστορικού', 'menuBuildHistory')
        .addItem('6. Εγκατάσταση triggers', 'menuInstallTriggers')
        .addItem('7. Προστασίες φύλλων', 'menuSetupProtections')
        .addSeparator()
        .addItem('❌ Αφαίρεση όλων των προστασιών', 'menuRemoveProtections'))
      .addToUi();
  } catch (err) {
    // onOpen must never throw or the file looks broken to staff.
    Logger.log('onOpen error: ' + err);
  }
}


/* ============================================================================================ *
 *  MENU WRAPPERS  —  thin, each one toasts + try/catch so a failure is visible but non-fatal
 * ============================================================================================ */
function menuSetupEverything()  { setupEverything(); }
function menuSetupSharing()     { setupSharing(); }
function menuRunValidator()     { guard_('Έλεγχος', function(){ runValidator(); openSheet_(CONFIG.SHEETS.WARN); }); }
function menuOpenWarnings()     { guard_('Προειδοποιήσεις', function(){ openSheet_(CONFIG.SHEETS.WARN); }); }
function menuOpenSummary()      { guard_('Σύνοψη', function(){ openSheet_(CONFIG.SHEETS.SUMMARY); }); }
function menuOpenCard()         { guard_('Καρτέλα', function(){ openSheet_(CONFIG.SHEETS.CARD); }); }
function menuOpenWeek()         { guard_('Εβδομάδα', function(){ openSheet_(CONFIG.SHEETS.WEEK); }); }
function menuExportPdf()        { guard_('PDF', function(){ exportPdf(); }); }
function menuBackupNow()        { guard_('Αντίγραφο', function(){ backupNow(); }); }
function menuBuildList()        { guard_('Λίστα', function(){ buildShiftsList_(); toast_('Η λίστα SHIFTS δημιουργήθηκε.'); }); }
function menuApplyValidation()  { guard_('Dropdown', function(){ applyValidation_(); toast_('Το dropdown εφαρμόστηκε.'); }); }
function menuApplyFormatting()  { guard_('Χρώματα', function(){ applyConditionalFormatting_(); toast_('Οι χρωματικοί κανόνες εφαρμόστηκαν.'); }); }
function menuBuildDashboards()  { guard_('Πίνακες', function(){ buildCoverageDashboard_(); buildEmployeeCard_(); buildCurrentWeek_(); toast_('Οι πίνακες δημιουργήθηκαν.'); }); }
function menuBuildHistory()     { guard_('Ιστορικό', function(){ ensureHistorySheet_(); toast_('Το φύλλο ΙΣΤΟΡΙΚΟ είναι έτοιμο.'); }); }
function menuInstallTriggers()  { guard_('Triggers', function(){ installTriggers_(); toast_('Τα triggers εγκαταστάθηκαν.'); }); }
function menuSetupProtections() { guard_('Προστασίες', function(){ setupProtections_(); toast_('Οι προστασίες εφαρμόστηκαν.'); }); }
function menuRemoveProtections(){ guard_('Προστασίες', function(){ removeAllProtections_(); toast_('Όλες οι προστασίες αφαιρέθηκαν.'); }); }
/* v2 */
function menuSyncCoded()       { guard_('Συγχρονισμός', function(){ syncCodedFromOraria_(); }); }
function menuCheckSync()        { guard_('Συμφωνία', function(){ checkSyncMismatch_(); }); }
function menuStats()            { guard_('Στατιστικά', function(){ buildStats_(); openSheet_(CONFIG.SHEETS.STATS); }); }
function menuNewMonth()         { guard_('Νέος μήνας', function(){ newMonthCopy(); }); }


/* ============================================================================================ *
 *  MASTER SETUP  —  one click. Each step is wrapped so one failure can't abort the rest.
 * ============================================================================================ */
function setupEverything() {
  var ss = getSS_();
  var steps = [
    ['Λίστα βαρδιών + SHIFTS',        buildShiftsList_],
    ['Dropdown εγκυρότητας',          applyValidation_],
    ['Χρωματικοί κανόνες',            applyConditionalFormatting_],
    ['Σύνοψη κάλυψης',                buildCoverageDashboard_],
    ['Καρτέλα υπαλλήλου',             buildEmployeeCard_],
    ['Τρέχουσα εβδομάδα',             buildCurrentWeek_],
    ['Στατιστικά / ισορροπία',        buildStats_],
    ['Φύλλο ιστορικού',               ensureHistorySheet_],
    ['Έλεγχος προγράμματος',          runValidator],
    ['Εγκατάσταση triggers',          installTriggers_],
    ['Προστασίες φύλλων',             setupProtections_]   // protections LAST (so writes above succeed)
  ];

  var ok = [], failed = [];
  for (var i = 0; i < steps.length; i++) {
    var name = steps[i][0], fn = steps[i][1];
    try { fn(); ok.push('✓ ' + name); }
    catch (err) { failed.push('✗ ' + name + ' — ' + err); Logger.log(name + ' failed: ' + err); }
  }

  var msg = 'ΟΛΟΚΛΗΡΩΘΗΚΕ\n\nΕπιτυχία:\n' + ok.join('\n');
  if (failed.length) msg += '\n\nΑπέτυχαν (δοκιμάστε ξανά μεμονωμένα):\n' + failed.join('\n');
  msg += '\n\nΕπόμενο βήμα: «🔗 Οδηγός Κοινής Χρήσης».';
  try { SpreadsheetApp.getUi().alert('Εργαλεία Προγράμματος', msg, SpreadsheetApp.getUi().ButtonSet.OK); }
  catch (e) { toast_(failed.length ? 'Εγκατάσταση με σφάλματα — δες Logs' : 'Η εγκατάσταση ολοκληρώθηκε.'); }
}


/* ============================================================================================ *
 *  1.  HIDDEN LIST  +  NAMED RANGE  "SHIFTS"
 * ============================================================================================ */
function buildShiftsList_() {
  var ss = getSS_();
  var sh = ss.getSheetByName(CONFIG.SHEETS.LIST) || ss.insertSheet(CONFIG.SHEETS.LIST);
  sh.clear();

  var vals = shiftValues_();
  sh.getRange(1, 1, 1, 1).setValue('ΕΓΚΥΡΕΣ ΒΑΡΔΙΕΣ (μην επεξεργάζεστε χειροκίνητα)')
    .setFontWeight('bold');
  var out = vals.map(function (v) { return [v]; });
  sh.getRange(2, 1, out.length, 1).setValues(out);

  // (Re)bind the named range to exactly the value cells.
  var rng = sh.getRange(2, 1, vals.length, 1);
  ss.setNamedRange(CONFIG.NAMED_RANGE, rng);   // setNamedRange overwrites an existing range of same name

  sh.autoResizeColumn(1);
  sh.hideSheet();
  return sh;
}


/* ============================================================================================ *
 *  2.  DATA VALIDATION  (reject invalid) on the input grid
 * ============================================================================================ */
function applyValidation_() {
  var sh = inputSheet_();
  var g  = CONFIG.GRID;
  var listSheet = getSS_().getSheetByName(CONFIG.SHEETS.LIST);
  if (!listSheet) buildShiftsList_();
  var listRange = getSS_().getRangeByName(CONFIG.NAMED_RANGE);
  if (!listRange) { buildShiftsList_(); listRange = getSS_().getRangeByName(CONFIG.NAMED_RANGE); }

  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(listRange, true)         // dropdown from SHIFTS
    .setAllowInvalid(false)                        // REJECT anything not in the list
    .setHelpText('Επιλέξτε έγκυρη βάρδια από τη λίστα (π.χ. 07:00-15:00, ΡΕΠΟ, ΑΔΕΙΑ 5ΗΜΕΡΟΥ). '
               + 'Οι μη έγκυρες τιμές απορρίπτονται.')
    .build();

  gridRange_(sh).setDataValidation(rule);
}


/* ============================================================================================ *
 *  3.  CONDITIONAL FORMATTING  (7 rules, first match wins, relative D2 formulas)
 * ============================================================================================ */
function applyConditionalFormatting_() {
  var sh = inputSheet_();
  var grid = gridRange_(sh);
  var c = CONFIG.COLORS;

  // Keep any existing rules that DON'T target the grid; drop ours (idempotent re-apply).
  var kept = sh.getConditionalFormatRules().filter(function (r) {
    return !rulesTouchGrid_(r);
  });

  var mk = function (formula, bg, white) {
    var b = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(formula).setBackground(bg).setRanges([grid]);
    if (white) b.setFontColor('#FFFFFF').setBold(true);
    return b.build();
  };

  // NOTE: when USE_CODES is on, the regex/text rules below won't match numbers — only the
  // "invalid" rule stays meaningful. That's expected; colours are a human-readable feature.
  var rules = [
    mk('=AND(D2<>"",COUNTIF(' + CONFIG.NAMED_RANGE + ',D2)=0)', c.INVALID, true),  // 1 invalid
    mk('=D2="ΡΕΠΟ"', c.REPO, false),                                               // 2 repo
    mk('=OR(REGEXMATCH(D2&"","ΑΔΕΙΑ"),REGEXMATCH(D2&"","ΑΝΑΡΡΩΤΙΚΗ"))', c.LEAVE, false), // 3 leave/sick
    mk('=REGEXMATCH(D2&"","^(22|23):")', c.NIGHT, false),                          // 4 night
    mk('=REGEXMATCH(D2&"","^(15|16|17|18):")', c.LATE, false),                     // 5 late
    mk('=REGEXMATCH(D2&"","^(12|13|14):")', c.MIDDAY, false),                      // 6 midday
    mk('=REGEXMATCH(D2&"","^(0[4-9]|1[01]):")', c.MORNING, false)                  // 7 morning
  ];

  sh.setConditionalFormatRules(kept.concat(rules));
}


/* ============================================================================================ *
 *  4.  VALIDATOR  →  ΠΡΟΕΙΔΟΠΟΙΗΣΕΙΣ   (never touches CHECK)
 * ============================================================================================ */
function runValidator() {
  var ss = getSS_();
  var src = inputSheet_();
  var g = CONFIG.GRID, R = CONFIG.RULES;
  var valid = {};
  shiftValues_().forEach(function (v) { valid[String(v).trim()] = true; });

  // Read everything once.
  var nCols = g.LAST_COL - g.FIRST_COL + 1;
  var dates = src.getRange(g.HEADER_ROW, g.FIRST_COL, 1, nCols).getValues()[0];
  var lastRow = Math.min(src.getLastRow(), g.LAST_ROW);
  var rows = [];
  if (lastRow >= g.FIRST_ROW) {
    var ids   = src.getRange(g.FIRST_ROW, g.COL_AME,     lastRow - g.FIRST_ROW + 1, 1).getValues();
    var surn  = src.getRange(g.FIRST_ROW, g.COL_SURNAME, lastRow - g.FIRST_ROW + 1, 1).getValues();
    var first = src.getRange(g.FIRST_ROW, g.COL_NAME,    lastRow - g.FIRST_ROW + 1, 1).getValues();
    var grid  = src.getRange(g.FIRST_ROW, g.FIRST_COL,   lastRow - g.FIRST_ROW + 1, nCols).getValues();

    for (var i = 0; i < grid.length; i++) {
      var ame = String(ids[i][0]).trim();
      if (!ame || ame === '0') continue;                 // skip filler 0,0,0 rows
      rows.push({
        ame: ame,
        name: (String(surn[i][0]).trim() + ' ' + String(first[i][0]).trim()).trim(),
        days: grid[i]
      });
    }
  }

  var warns = [];   // each: [marker, name, ame, dateLabel, type, description]
  rows.forEach(function (emp) {
    var nightRun = 0, workRun = 0;
    for (var d = 0; d < emp.days.length; d++) {
      var cur = String(emp.days[d]).trim();
      var dateLbl = dateLabel_(dates[d]);

      // -- missing / invalid -----------------------------------------------------------------
      if (cur === '') {
        if (R.FLAG_EMPTY_CELLS)
          warns.push(['⚠️', emp.name, emp.ame, dateLbl, 'ΚΕΝΟ', 'Κενό κελί — δεν έχει οριστεί βάρδια.']);
        nightRun = 0; workRun = 0; continue;
      }
      if (!valid[cur]) {
        warns.push(['🛑', emp.name, emp.ame, dateLbl, 'ΑΚΥΡΗ', 'Μη έγκυρη τιμή «' + cur + '» — εκτός λίστας SHIFTS.']);
      }

      var isLeave = isLeave_(cur), isRepo = isRepo_(cur), t = parseShift_(cur);

      // -- consecutive nights --------------------------------------------------------------
      if (t && (Math.floor(t.start / 60) === 22 || Math.floor(t.start / 60) === 23)) {
        nightRun++;
        if (nightRun === R.MAX_CONSEC_NIGHTS + 1)
          warns.push(['🛑', emp.name, emp.ame, dateLbl, 'ΝΥΧΤΕΣ',
            'Πάνω από ' + R.MAX_CONSEC_NIGHTS + ' συνεχόμενες νύχτες (22:/23:).']);
      } else nightRun = 0;

      // -- consecutive worked days (leave/repo break the streak) ---------------------------
      if (t) {
        workRun++;
        if (workRun === R.MAX_CONSEC_WORKDAYS + 1)
          warns.push(['🛑', emp.name, emp.ame, dateLbl, 'ΣΥΝΕΧΕΙΑ',
            'Πάνω από ' + R.MAX_CONSEC_WORKDAYS + ' συνεχόμενες ημέρες εργασίας χωρίς ΡΕΠΟ.']);
      } else workRun = 0;

      // -- rest gap < N hours between this worked day and the NEXT worked day ---------------
      if (t && d + 1 < emp.days.length) {
        var nxt = parseShift_(String(emp.days[d + 1]).trim());
        if (nxt) {
          // end of today (absolute minutes from today 00:00) → next start is +24h.
          var rest = (1440 + nxt.start) - t.end;     // t.end already +1440 if it crosses midnight
          if (rest >= 0 && rest < R.MIN_REST_HOURS * 60) {
            warns.push(['🛑', emp.name, emp.ame, dateLbl + '→' + dateLabel_(dates[d + 1]), 'ΑΝΑΠΑΥΣΗ',
              'Ανάπαυση ' + (rest / 60).toFixed(1) + 'ω (< ' + R.MIN_REST_HOURS + 'ω) μεταξύ διαδοχικών βαρδιών.']);
          }
        }
      }

      // -- work day sandwiched between two leave days (likely typo) ------------------------
      if (t && d > 0 && d + 1 < emp.days.length) {
        if (isLeave_(String(emp.days[d - 1]).trim()) && isLeave_(String(emp.days[d + 1]).trim()))
          warns.push(['⚠️', emp.name, emp.ame, dateLbl, 'ΥΠΟΨΙΑ',
            'Βάρδια ανάμεσα σε δύο ημέρες άδειας — πιθανό λάθος καταχώρησης.']);
      }
    }
  });

  // Sort by employee then date label.
  warns.sort(function (a, b) {
    if (a[1] !== b[1]) return a[1] < b[1] ? -1 : 1;
    return a[3] < b[3] ? -1 : (a[3] > b[3] ? 1 : 0);
  });

  // Write the sheet (NEW sheet, never CHECK).
  var sh = ss.getSheetByName(CONFIG.SHEETS.WARN) || ss.insertSheet(CONFIG.SHEETS.WARN);
  sh.clear();
  var hard = warns.filter(function (w){ return w[0] === '🛑'; }).length;
  var soft = warns.length - hard;
  sh.getRange(1, 1, 1, 6).merge().setValue(
    'Τελευταίος έλεγχος: ' + Utilities.formatDate(new Date(), tz_(), 'dd/MM/yyyy HH:mm') +
    '   •   🛑 ' + hard + ' σοβαρά   •   ⚠️ ' + soft + ' ήπια')
    .setFontWeight('bold').setBackground('#FFF2CC');
  var head = ['', 'Υπάλληλος', 'ΑΜΕ', 'Ημ/νία', 'Τύπος', 'Περιγραφή'];
  sh.getRange(2, 1, 1, 6).setValues([head]).setFontWeight('bold').setBackground('#D9D9D9');
  if (warns.length) sh.getRange(3, 1, warns.length, 6).setValues(warns);
  else sh.getRange(3, 1).setValue('✓ Δεν βρέθηκαν προβλήματα.');
  sh.setFrozenRows(2);
  sh.setColumnWidth(1, 36); sh.setColumnWidth(2, 200); sh.setColumnWidth(6, 520);
  return sh;
}


/* ============================================================================================ *
 *  5.  COVERAGE DASHBOARD  →  ΣΥΝΟΨΗ   (formulas; reads rows 2:200 so new staff auto-appear)
 * ============================================================================================ */
function buildCoverageDashboard_() {
  var ss = getSS_();
  var sh = ss.getSheetByName(CONFIG.SHEETS.SUMMARY) || ss.insertSheet(CONFIG.SHEETS.SUMMARY);
  sh.clear();

  var g = CONFIG.GRID, nCols = g.LAST_COL - g.FIRST_COL + 1;
  var src = q_(CONFIG.INPUT_SHEET);
  var timeShifts = shiftValues_().filter(function (v) { return /-/.test(v); }); // ranges/codes, not tokens

  // Header row: A1 label, B1.. = dates.
  var header = ['Βάρδια \\ Ημέρα'];
  for (var c = 0; c < nCols; c++) header.push('=' + src + '!' + colA1_(g.FIRST_COL + c) + g.HEADER_ROW);
  var matrix = [header];

  var rowRef = function (rowNum, srcColIdx) {
    return src + '!' + colA1_(srcColIdx) + '$' + g.FIRST_ROW + ':' + colA1_(srcColIdx) + '$' + g.LAST_ROW;
  };

  // One row per concrete shift value.
  var firstShiftRow = 2; // sheet row of first shift line
  timeShifts.forEach(function (val) {
    var line = [val];
    for (var c = 0; c < nCols; c++)
      line.push('=COUNTIF(' + rowRef(0, g.FIRST_COL + c) + ',$A' + (matrix.length + 1) + ')');
    matrix.push(line);
  });

  // Aggregate rows. We capture their sheet row numbers to cross-reference.
  var repoRow, leaveRow, nightRow, workRow, totalRow;
  var pushAgg = function (label, builder) {
    var line = [label];
    for (var c = 0; c < nCols; c++) line.push(builder(g.FIRST_COL + c, matrix.length + 1));
    matrix.push(line);
    return matrix.length; // sheet row number just written
  };

  repoRow  = pushAgg('— ΡΕΠΟ', function (col) {
    return '=COUNTIF(' + rowRef(0, col) + ',"ΡΕΠΟ")';
  });
  leaveRow = pushAgg('— ΑΔΕΙΕΣ/ΑΝΑΡΡΩΤΙΚΕΣ', function (col) {
    var r = rowRef(0, col); return '=COUNTIF(' + r + ',"*ΑΔΕΙΑ*")+COUNTIF(' + r + ',"*ΑΝΑΡΡΩΤΙΚΗ*")';
  });
  nightRow = pushAgg('— ΝΥΧΤΕΡΙΝΕΣ (22:/23:)', function (col) {
    var r = rowRef(0, col); return '=COUNTIF(' + r + ',"22:*")+COUNTIF(' + r + ',"23:*")';
  });
  totalRow = pushAgg('— ΣΥΝΟΛΟ ΑΤΟΜΩΝ', function (col) {
    return '=COUNTA(' + rowRef(0, col) + ')';
  });
  workRow  = pushAgg('— ΣΕ ΕΡΓΑΣΙΑ', function (col, sheetRow) {
    var letter = colA1_(2 + (col - g.FIRST_COL)); // dashboard column for this date
    return '=' + letter + totalRow + '-' + letter + repoRow + '-' + letter + leaveRow;
  });
  var indRow = pushAgg('ΕΝΔΕΙΞΗ', function (col) {
    var letter = colA1_(2 + (col - g.FIRST_COL));
    return '=IF(' + letter + workRow + '<' + CONFIG.STAFF.MIN_PER_DAY + ',"⚠️ ΛΙΓΟΙ",IF(' +
           letter + workRow + '>' + CONFIG.STAFF.MAX_PER_DAY + ',"⚠️ ΠΟΛΛΟΙ","✓"))';
  });

  sh.getRange(1, 1, matrix.length, nCols + 1).setFormulas(matrix);

  // cosmetics
  sh.setFrozenRows(1); sh.setFrozenColumns(1);
  sh.getRange(1, 1, 1, nCols + 1).setFontWeight('bold').setBackground('#D9D9D9');
  sh.getRange(repoRow, 1, indRow - repoRow + 1, nCols + 1).setFontWeight('bold');
  sh.getRange(indRow, 1, 1, nCols + 1).setBackground('#FFF2CC');
  sh.setColumnWidth(1, 180);
  return sh;
}


/* ============================================================================================ *
 *  6a.  EMPLOYEE CARD  →  ΚΑΡΤΕΛΑ ΥΠΑΛΛΗΛΟΥ   (dropdown → that person's whole month)
 * ============================================================================================ */
function buildEmployeeCard_() {
  var ss = getSS_();
  var sh = ss.getSheetByName(CONFIG.SHEETS.CARD) || ss.insertSheet(CONFIG.SHEETS.CARD);
  sh.clear();
  var g = CONFIG.GRID, src = q_(CONFIG.INPUT_SHEET), nCols = g.LAST_COL - g.FIRST_COL + 1;

  sh.getRange('A1').setValue('Επιλέξτε ΑΜΕ:').setFontWeight('bold');
  // Dropdown of employee ids.
  var idRange = getSS_().getSheetByName(CONFIG.INPUT_SHEET)
    .getRange(g.FIRST_ROW, g.COL_AME, g.LAST_ROW - g.FIRST_ROW + 1, 1);
  sh.getRange('B1').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(idRange, true).setAllowInvalid(true).build());

  var mRef = src + '!$' + colA1_(g.COL_AME) + '$' + g.FIRST_ROW + ':$' + colA1_(g.COL_AME) + '$' + g.LAST_ROW;
  sh.getRange('A2').setValue('Όνομα:').setFontWeight('bold');
  sh.getRange('B2').setFormula(
    '=IFERROR(INDEX(' + src + '!$' + colA1_(g.COL_SURNAME) + '$' + g.FIRST_ROW + ':$' + colA1_(g.COL_SURNAME) + '$' + g.LAST_ROW +
    ',MATCH($B$1,' + mRef + ',0))&" "&INDEX(' + src + '!$' + colA1_(g.COL_NAME) + '$' + g.FIRST_ROW + ':$' + colA1_(g.COL_NAME) + '$' + g.LAST_ROW +
    ',MATCH($B$1,' + mRef + ',0)),"—")');

  sh.getRange('A4').setValue('Ημ/νία').setFontWeight('bold').setBackground('#D9D9D9');
  sh.getRange('B4').setValue('Βάρδια').setFontWeight('bold').setBackground('#D9D9D9');

  // 30 rows: date + that employee's shift for the day.
  var out = [];
  for (var c = 0; c < nCols; c++) {
    var srcCol = colA1_(g.FIRST_COL + c);
    var dateF  = '=' + src + '!' + srcCol + '$' + g.HEADER_ROW;
    var shiftF = '=IFERROR(INDEX(' + src + '!' + srcCol + '$' + g.FIRST_ROW + ':' + srcCol + '$' + g.LAST_ROW +
                 ',MATCH($B$1,' + mRef + ',0)),"")';
    out.push([dateF, shiftF]);
  }
  sh.getRange(5, 1, out.length, 2).setFormulas(out);

  sh.setColumnWidth(1, 120); sh.setColumnWidth(2, 160);
  sh.setFrozenRows(4);
  return sh;
}


/* ============================================================================================ *
 *  6b.  CURRENT WEEK  →  ΤΡΕΧΟΥΣΑ ΕΒΔΟΜΑΔΑ   (whole team, 7 days from TODAY())
 * ============================================================================================ */
function buildCurrentWeek_() {
  var ss = getSS_();
  var sh = ss.getSheetByName(CONFIG.SHEETS.WEEK) || ss.insertSheet(CONFIG.SHEETS.WEEK);
  sh.clear();
  var g = CONFIG.GRID, src = q_(CONFIG.INPUT_SHEET), nCols = g.LAST_COL - g.FIRST_COL + 1;

  var dateRow = src + '!$' + colA1_(g.FIRST_COL) + '$' + g.HEADER_ROW + ':$' + colA1_(g.LAST_COL) + '$' + g.HEADER_ROW;
  var gridRng = src + '!$' + colA1_(g.FIRST_COL) + '$' + g.FIRST_ROW + ':$' + colA1_(g.LAST_COL) + '$' + g.LAST_ROW;

  // Helper cell J1 holds the column offset (1..30) of TODAY() within the month.
  sh.getRange('J1').setFormula('=IFERROR(MATCH(TODAY(),' + dateRow + ',0),1)');
  sh.getRange('I1').setValue('Στήλη σήμερα →');

  sh.getRange('A1').setValue('ΤΡΕΧΟΥΣΑ ΕΒΔΟΜΑΔΑ (7 ημέρες από σήμερα)').setFontWeight('bold');
  sh.getRange('A2').setValue('Υπάλληλος').setFontWeight('bold').setBackground('#D9D9D9');

  // Header: 7 date columns B2:H2.
  var head = [];
  for (var k = 0; k < 7; k++)
    head.push('=IFERROR(INDEX(' + dateRow + ',1,$J$1+' + k + '),"")');
  sh.getRange(2, 2, 1, 7).setFormulas([head]).setFontWeight('bold').setBackground('#D9D9D9');

  // Employee rows (mirror ΩΡΑΡΙΑ rows 2..200; blank rows stay blank).
  var rowsN = g.LAST_ROW - g.FIRST_ROW + 1;
  var body = [];
  for (var r = 0; r < rowsN; r++) {
    var srcRow = g.FIRST_ROW + r;
    var nameF = '=IF(' + src + '!$' + colA1_(g.COL_AME) + srcRow + '="","",' +
                src + '!$' + colA1_(g.COL_SURNAME) + srcRow + '&" "&' + src + '!$' + colA1_(g.COL_NAME) + srcRow + ')';
    var line = [nameF];
    for (var k2 = 0; k2 < 7; k2++) {
      line.push('=IFERROR(IF(INDEX(' + gridRng + ',' + (r + 1) + ',$J$1+' + k2 + ')="","",' +
                'INDEX(' + gridRng + ',' + (r + 1) + ',$J$1+' + k2 + ')),"")');
    }
    body.push(line);
  }
  sh.getRange(3, 1, body.length, 8).setFormulas(body);

  sh.setFrozenRows(2); sh.setFrozenColumns(1);
  sh.setColumnWidth(1, 200);
  sh.hideColumns(9, 2); // hide I:J helper
  return sh;
}


/* ============================================================================================ *
 *  7.  EDIT HISTORY  →  ΙΣΤΟΡΙΚΟ   (installable onEdit, runs as owner)
 * ============================================================================================ */
function ensureHistorySheet_() {
  var ss = getSS_();
  var sh = ss.getSheetByName(CONFIG.SHEETS.HISTORY);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEETS.HISTORY);
    sh.appendRow(['Χρόνος', 'Email', 'Φύλλο', 'Κελί', 'Υπάλληλος', 'Ημ/νία', 'Παλιά τιμή', 'Νέα τιμή']);
    sh.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#D9D9D9');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Installable onEdit handler. Logs ONLY edits inside ΩΡΑΡΙΑ D2:AG200. */
function onEditLogger(e) {
  try {
    if (!e || !e.range) return;
    var sh = e.range.getSheet();
    if (sh.getName() !== CONFIG.INPUT_SHEET) return;
    var g = CONFIG.GRID;
    var r = e.range.getRow(), c = e.range.getColumn();
    var rEnd = e.range.getLastRow(), cEnd = e.range.getLastColumn();
    // Edit must intersect the grid.
    if (cEnd < g.FIRST_COL || c > g.LAST_COL || rEnd < g.FIRST_ROW || r > g.LAST_ROW) return;

    var log = ensureHistorySheet_();
    var email = '';
    try { email = (e.user && e.user.getEmail()) || Session.getActiveUser().getEmail() || ''; } catch (ig) {}
    var when = new Date();
    var multi = (r !== rEnd || c !== cEnd);

    var a1 = e.range.getA1Notation();
    var emp = '', dat = '';
    try {
      emp = (sh.getRange(r, g.COL_SURNAME).getValue() + ' ' + sh.getRange(r, g.COL_NAME).getValue()).trim();
      var dv = sh.getRange(g.HEADER_ROW, c).getValue();
      dat = dv instanceof Date ? Utilities.formatDate(dv, tz_(), 'dd/MM/yyyy') : String(dv);
    } catch (ig2) {}

    var oldV = multi ? '(μαζική αλλαγή)' : (e.oldValue === undefined ? '' : e.oldValue);
    var newV = multi ? '(μαζική αλλαγή)' : (e.value === undefined ? sh.getRange(r, c).getValue() : e.value);

    log.appendRow([when, email, sh.getName(), a1, emp, dat, oldV, newV]);
    mirrorRangeToCoded_(sh, e.range);   // v2: keep CODED in sync with this edit
    notifyApp_(e.range, oldV, newV);    // v2: push the change to the Vercel app (best-effort)
  } catch (err) {
    Logger.log('onEditLogger error: ' + err);   // never throw from a trigger
  }
}


/* ============================================================================================ *
 *  TRIGGERS  (installable onEdit + daily backup) — idempotent
 * ============================================================================================ */
function installTriggers_() {
  var ss = getSS_();
  // remove our prior triggers
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var h = t.getHandlerFunction();
    if (h === 'onEditLogger' || h === 'dailyBackup') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onEditLogger').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('dailyBackup').timeBased().atHour(CONFIG.BACKUP.HOUR).everyDays(1).create();
}


/* ============================================================================================ *
 *  BACKUP  (daily trigger + manual)  &  retention
 * ============================================================================================ */
function dailyBackup() {
  try { doBackup_(); trimOldBackups_(); }
  catch (err) { Logger.log('dailyBackup error: ' + err); }
}
function backupNow() {
  var file = doBackup_(); trimOldBackups_();
  toast_('Αντίγραφο: ' + file.getName());
  try {
    SpreadsheetApp.getUi().alert('Αντίγραφο Ασφαλείας',
      'Δημιουργήθηκε:\n' + file.getName() + '\n\n' + file.getUrl(), SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {}
}
function doBackup_() {
  var ss = getSS_();
  var folder = getOrCreateFolder_(CONFIG.BACKUP.FOLDER);
  var stamp = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
  var name = ss.getName() + ' — BACKUP ' + stamp;
  return DriveApp.getFileById(ss.getId()).makeCopy(name, folder);
}
function trimOldBackups_() {
  var folder = getOrCreateFolder_(CONFIG.BACKUP.FOLDER);
  var cutoff = new Date().getTime() - CONFIG.BACKUP.RETENTION_DAYS * 24 * 3600 * 1000;
  var it = folder.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (/BACKUP \d{4}-\d{2}-\d{2}/.test(f.getName()) && f.getDateCreated().getTime() < cutoff) {
      try { f.setTrashed(true); } catch (e) { Logger.log('trim error: ' + e); }
    }
  }
}


/* ============================================================================================ *
 *  PDF EXPORT  (landscape) → Drive folder, shows the link
 * ============================================================================================ */
function exportPdf() {
  var ss = getSS_();
  var sheet = ss.getSheetByName(CONFIG.INPUT_SHEET);
  var gid = sheet.getSheetId();
  var url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?' + [
    'format=pdf', 'gid=' + gid, 'portrait=false', 'fitw=true', 'size=A4',
    'gridlines=true', 'sheetnames=false', 'printtitle=false',
    'top_margin=0.30', 'bottom_margin=0.30', 'left_margin=0.30', 'right_margin=0.30'
  ].join('&');

  var resp = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
  var stamp = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
  var blob = resp.getBlob().setName(ss.getName() + ' ' + stamp + '.pdf');
  var file = getOrCreateFolder_(CONFIG.PDF.FOLDER).createFile(blob);
  try {
    SpreadsheetApp.getUi().alert('Εξαγωγή PDF',
      'Δημιουργήθηκε:\n' + file.getName() + '\n\n' + file.getUrl(), SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) { toast_('PDF: ' + file.getName()); }
}


/* ============================================================================================ *
 *  PROTECTIONS  (idempotent)
 * ============================================================================================ */
function setupProtections_() {
  var ss = getSS_();
  removeAllProtections_();   // clear first → re-applying never stacks
  var me = ownerEmail_();
  var g = CONFIG.GRID;

  // ---- ΩΡΑΡΙΑ : protect the whole sheet EXCEPT the editable grid D2:AG200 ----------------
  var oraria = ss.getSheetByName(CONFIG.INPUT_SHEET);
  if (oraria) {
    var p = oraria.protect().setDescription('PROG: ΩΡΑΡΙΑ (πλην πλέγματος)');
    p.setUnprotectedRanges([gridRange_(oraria)]);
    stripEditors_(p, me);
  }

  // ---- owner-only sheets ----------------------------------------------------------------
  [CONFIG.SHEETS.CODED, CONFIG.SHEETS.LIST, CONFIG.SHEETS.SUMMARY,
   CONFIG.SHEETS.WEEK, CONFIG.SHEETS.WARN, CONFIG.SHEETS.HISTORY, CONFIG.SHEETS.STATS].forEach(function (n) {
    var s = ss.getSheetByName(n);
    if (!s) return;
    var pr = s.protect().setDescription('PROG: owner-only ' + n);
    stripEditors_(pr, me);
  });

  // ---- employee card : locked EXCEPT the single dropdown cell B1 -------------------------
  var card = ss.getSheetByName(CONFIG.SHEETS.CARD);
  if (card) {
    var pc = card.protect().setDescription('PROG: ΚΑΡΤΕΛΑ (πλην B1)');
    pc.setUnprotectedRanges([card.getRange('B1')]);
    stripEditors_(pc, me);
  }
  // NOTE: CHECK is deliberately never protected or touched here.
}

function removeAllProtections_() {
  var ss = getSS_();
  [SpreadsheetApp.ProtectionType.SHEET, SpreadsheetApp.ProtectionType.RANGE].forEach(function (type) {
    ss.getSheets().forEach(function (s) {
      s.getProtections(type).forEach(function (p) {
        try { if (p.canEdit()) p.remove(); } catch (e) { Logger.log('remove protection: ' + e); }
      });
    });
  });
}

/** Make a protection owner-only: remove every editor except the owner, and drop domain edit. */
function stripEditors_(p, ownerEmail) {
  try {
    p.removeEditors(p.getEditors().map(function (u) { return u.getEmail(); })
      .filter(function (em) { return em && em !== ownerEmail; }));
    if (p.canDomainEdit && p.canDomainEdit()) p.setDomainEdit(false);
  } catch (e) { Logger.log('stripEditors: ' + e); }
}


/* ============================================================================================ *
 *  SHARING  (guided)  — set link to Viewer, prompt for named editors
 * ============================================================================================ */
function setupSharing() {
  var ui = SpreadsheetApp.getUi();
  try {
    var file = DriveApp.getFileById(getSS_().getId());

    // 1) Anyone with the link = Viewer.
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
    catch (e) { Logger.log('setSharing: ' + e); }

    // 2) Prompt for 2–3 named editors.
    var res = ui.prompt('Οδηγός Κοινής Χρήσης',
      'Σύνδεσμος: ορίστηκε σε «Προβολή».\n\n'
      + 'Γράψτε τα emails των 2–3 διαχειριστών (editors), χωρισμένα με κόμμα:',
      ui.ButtonSet.OK_CANCEL);
    if (res.getSelectedButton() === ui.Button.OK) {
      var emails = res.getResponseText().split(/[,;\s]+/).filter(function (x) { return /@/.test(x); });
      emails.forEach(function (em) { try { file.addEditor(em); } catch (e) { Logger.log('addEditor ' + em + ': ' + e); } });

      // 3) Best-effort: stop editors from re-sharing (needs Advanced Drive Service "Drive").
      try {
        if (typeof Drive !== 'undefined' && Drive.Files) {
          Drive.Files.update({ writersCanShare: false }, getSS_().getId());
        }
      } catch (e) { Logger.log('writersCanShare (optional): ' + e); }

      ui.alert('Κοινή Χρήση',
        'Έτοιμο.\n• Σύνδεσμος = Προβολή\n• Editors: ' + (emails.join(', ') || '—') +
        '\n\nΣημείωση: η απενεργοποίηση επανα-κοινοποίησης απαιτεί το Advanced Drive Service (προαιρετικό).',
        ui.ButtonSet.OK);
    }
  } catch (err) {
    try { ui.alert('Σφάλμα', String(err), ui.ButtonSet.OK); } catch (e) {}
  }
}


/* ============================================================================================ *
 *  SMALL HELPERS
 * ============================================================================================ */
function getSS_()        { return SpreadsheetApp.getActiveSpreadsheet(); }
function inputSheet_()   { return getSS_().getSheetByName(CONFIG.INPUT_SHEET); }
function tz_()           { return getSS_().getSpreadsheetTimeZone() || 'Europe/Athens'; }
function ownerEmail_()   { try { return DriveApp.getFileById(getSS_().getId()).getOwner().getEmail(); } catch (e) { return Session.getEffectiveUser().getEmail(); } }

/** A1 of the whole editable grid on a given sheet. */
function gridRange_(sh) {
  var g = CONFIG.GRID;
  return sh.getRange(g.FIRST_ROW, g.FIRST_COL, g.LAST_ROW - g.FIRST_ROW + 1, g.LAST_COL - g.FIRST_COL + 1);
}

/** Does a conditional-format rule's range list touch the grid columns/rows? */
function rulesTouchGrid_(rule) {
  var g = CONFIG.GRID;
  return rule.getRanges().some(function (r) {
    return !(r.getLastColumn() < g.FIRST_COL || r.getColumn() > g.LAST_COL ||
             r.getLastRow() < g.FIRST_ROW || r.getRow() > g.LAST_ROW);
  });
}

/** Quote a sheet name for use in a formula, e.g.  'ΩΡΑΡΙΑ'  */
function q_(name) { return "'" + String(name).replace(/'/g, "''") + "'"; }

/** Column index (1=A) → A1 letters. */
function colA1_(idx) {
  var s = '';
  while (idx > 0) { var m = (idx - 1) % 26; s = String.fromCharCode(65 + m) + s; idx = (idx - m - 1) / 26; }
  return s;
}

/** Format a date cell value for warning labels. */
function dateLabel_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'dd/MM');
  return String(v);
}

/** Parse "HH:MM-HH:MM" → {start,end} in minutes (end += 1440 if it crosses midnight). null otherwise. */
function parseShift_(s) {
  var m = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/.exec(String(s).trim());
  if (!m) return null;
  var start = (+m[1]) * 60 + (+m[2]);
  var end   = (+m[3]) * 60 + (+m[4]);
  if (end <= start) end += 1440;     // crosses midnight
  return { start: start, end: end };
}
function isLeave_(s) { return /ΑΔΕΙΑ|ΑΝΑΡΡΩΤΙΚΗ/.test(String(s)); }
function isRepo_(s)  { return String(s).trim() === 'ΡΕΠΟ' || String(s).trim() === 'R'; }

function getOrCreateFolder_(name) {
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function openSheet_(name) {
  var sh = getSS_().getSheetByName(name);
  if (sh) { getSS_().setActiveSheet(sh); toast_('Άνοιξε: ' + name); }
  else toast_('Το φύλλο «' + name + '» δεν υπάρχει ακόμη — τρέξτε την εγκατάσταση.');
}

function toast_(msg) { try { getSS_().toast(msg, 'Εργαλεία Προγράμματος', 5); } catch (e) {} }

/** Run a named action with a uniform try/catch + toast. */
function guard_(label, fn) {
  try { fn(); }
  catch (err) {
    Logger.log(label + ' failed: ' + err);
    try { SpreadsheetApp.getUi().alert(label, 'Σφάλμα: ' + err, SpreadsheetApp.getUi().ButtonSet.OK); }
    catch (e) { toast_(label + ': σφάλμα'); }
  }
}


/* ============================================================================================ *
 *  v2 — ΩΡΑΡΙΑ ↔ CODED SYNC
 *  CODED becomes a true derived mirror: the script (re)builds it, and every grid edit updates it.
 * ============================================================================================ */

/** Full rebuild: read ΩΡΑΡΙΑ grid, map each value, write the whole CODED grid. */
function syncCodedFromOraria_() {
  var ss = getSS_(), g = CONFIG.GRID;
  var src = ss.getSheetByName(CONFIG.SHEETS.ORARIA);
  var dst = ss.getSheetByName(CONFIG.SHEETS.CODED);
  if (!src || !dst) throw new Error('Λείπει το φύλλο ΩΡΑΡΙΑ ή CODED.');
  var nCols = g.LAST_COL - g.FIRST_COL + 1;
  var last = Math.min(src.getLastRow(), g.LAST_ROW);
  if (last < g.FIRST_ROW) { toast_('Δεν υπάρχουν δεδομένα για συγχρονισμό.'); return; }
  var vals = src.getRange(g.FIRST_ROW, g.FIRST_COL, last - g.FIRST_ROW + 1, nCols).getValues();
  var out = vals.map(function (row) { return row.map(toCode_); });
  dst.getRange(g.FIRST_ROW, g.FIRST_COL, out.length, nCols).setValues(out);
  toast_('Το CODED συγχρονίστηκε (' + out.length + ' γραμμές).');
}

/** Incremental: mirror exactly the edited block into CODED. Called from onEditLogger. */
function mirrorRangeToCoded_(sheet, range) {
  try {
    if (!CONFIG.AUTO_SYNC_CODED) return;
    if (!sheet || sheet.getName() !== CONFIG.SHEETS.ORARIA) return;
    var g = CONFIG.GRID, dst = getSS_().getSheetByName(CONFIG.SHEETS.CODED);
    if (!dst) return;
    var r  = Math.max(range.getRow(),        g.FIRST_ROW);
    var c  = Math.max(range.getColumn(),     g.FIRST_COL);
    var r2 = Math.min(range.getLastRow(),    g.LAST_ROW);
    var c2 = Math.min(range.getLastColumn(), g.LAST_COL);
    if (r2 < r || c2 < c) return;                  // edit didn't touch the grid
    var vals = sheet.getRange(r, c, r2 - r + 1, c2 - c + 1).getValues();
    var out  = vals.map(function (row) { return row.map(toCode_); });
    dst.getRange(r, c, out.length, out[0].length).setValues(out);
  } catch (e) { Logger.log('mirrorRangeToCoded_ error: ' + e); }   // never throw from a trigger
}

/** Audit: list cells where CODED disagrees with what ΩΡΑΡΙΑ would produce. */
function checkSyncMismatch_() {
  var ss = getSS_(), g = CONFIG.GRID;
  var src = ss.getSheetByName(CONFIG.SHEETS.ORARIA), dst = ss.getSheetByName(CONFIG.SHEETS.CODED);
  if (!src || !dst) throw new Error('Λείπει το φύλλο ΩΡΑΡΙΑ ή CODED.');
  var nCols = g.LAST_COL - g.FIRST_COL + 1, last = Math.min(src.getLastRow(), g.LAST_ROW);
  var a = src.getRange(g.FIRST_ROW, g.FIRST_COL, last - g.FIRST_ROW + 1, nCols).getValues();
  var b = dst.getRange(g.FIRST_ROW, g.FIRST_COL, last - g.FIRST_ROW + 1, nCols).getValues();
  var diffs = [];
  for (var i = 0; i < a.length; i++) for (var j = 0; j < nCols; j++) {
    var exp = String(toCode_(a[i][j])).trim(), got = String(b[i][j]).trim();
    if (exp !== got)
      diffs.push(colA1_(g.FIRST_COL + j) + (g.FIRST_ROW + i) + ':  "' + got + '"  ≠  "' + exp + '"');
  }
  var msg = diffs.length
    ? ('Βρέθηκαν ' + diffs.length + ' διαφορές:\n\n' + diffs.slice(0, 30).join('\n') + (diffs.length > 30 ? '\n…' : '') +
       '\n\nΤρέξε «🔁 Συγχρονισμός CODED» για διόρθωση.')
    : '✓ Πλήρης συμφωνία ΩΡΑΡΙΑ ↔ CODED.';
  try { SpreadsheetApp.getUi().alert('Έλεγχος συμφωνίας', msg, SpreadsheetApp.getUi().ButtonSet.OK); }
  catch (e) { toast_(diffs.length + ' διαφορές'); }
}


/* ============================================================================================ *
 *  v2 — FAIRNESS / BALANCE REPORT  →  ΣΤΑΤΙΣΤΙΚΑ
 *  Per-employee monthly totals so over/under-loading (esp. nights & weekends) is visible.
 * ============================================================================================ */
function buildStats_() {
  var ss = getSS_(), g = CONFIG.GRID, src = ss.getSheetByName(CONFIG.INPUT_SHEET);
  var nCols = g.LAST_COL - g.FIRST_COL + 1;
  var dates = src.getRange(g.HEADER_ROW, g.FIRST_COL, 1, nCols).getValues()[0];
  var weekend = dates.map(function (d) { return (d instanceof Date) && (d.getDay() === 0 || d.getDay() === 6); });

  var last = Math.min(src.getLastRow(), g.LAST_ROW), rows = [];
  if (last >= g.FIRST_ROW) {
    var ids  = src.getRange(g.FIRST_ROW, g.COL_AME,     last - g.FIRST_ROW + 1, 1).getValues();
    var sn   = src.getRange(g.FIRST_ROW, g.COL_SURNAME, last - g.FIRST_ROW + 1, 1).getValues();
    var fn   = src.getRange(g.FIRST_ROW, g.COL_NAME,    last - g.FIRST_ROW + 1, 1).getValues();
    var grid = src.getRange(g.FIRST_ROW, g.FIRST_COL,   last - g.FIRST_ROW + 1, nCols).getValues();
    for (var i = 0; i < grid.length; i++) {
      var ame = String(ids[i][0]).trim();
      if (!ame || ame === '0') continue;
      var s = { name: (String(sn[i][0]).trim() + ' ' + String(fn[i][0]).trim()).trim(), ame: ame,
                days: 0, hours: 0, nights: 0, wknd: 0, repo: 0, leave: 0, morning: 0, late: 0 };
      for (var j = 0; j < nCols; j++) {
        var v = String(grid[i][j]).trim();
        if (v === '') continue;
        if (isRepo_(v))  { s.repo++;  continue; }
        if (isLeave_(v)) { s.leave++; continue; }
        var t = parseShift_(v); if (!t) continue;
        s.days++; s.hours += (t.end - t.start) / 60;
        var h = Math.floor(t.start / 60);
        if (h === 22 || h === 23) s.nights++;
        if (h >= 4  && h <= 11)   s.morning++;
        if (h >= 15 && h <= 18)   s.late++;
        if (weekend[j])           s.wknd++;
      }
      rows.push(s);
    }
  }
  rows.sort(function (a, b) { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); });

  var sh = ss.getSheetByName(CONFIG.SHEETS.STATS) || ss.insertSheet(CONFIG.SHEETS.STATS);
  sh.clear();
  var head = ['Υπάλληλος', 'ΑΜΕ', 'Ημέρες εργ.', 'Ώρες', 'Νύχτες', 'Σ/Κ', 'ΡΕΠΟ', 'Άδειες', 'Πρωινές', 'Απογ./Βράδυ'];
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#D9D9D9');
  var body = rows.map(function (s) {
    return [s.name, s.ame, s.days, Math.round(s.hours * 10) / 10, s.nights, s.wknd, s.repo, s.leave, s.morning, s.late];
  });
  if (body.length) {
    sh.getRange(2, 1, body.length, head.length).setValues(body);
    var avgRow = body.length + 3;
    sh.getRange(avgRow, 1).setValue('ΜΕΣΟΣ ΟΡΟΣ');
    for (var c = 3; c <= head.length; c++)
      sh.getRange(avgRow, c).setFormula('=ROUND(AVERAGE(' + colA1_(c) + '2:' + colA1_(c) + (body.length + 1) + '),1)');
    sh.getRange(avgRow, 1, 1, head.length).setFontWeight('bold').setBackground('#FFF2CC');
    // Flag anyone whose nights run >2 above the team average.
    var nc = colA1_(5);
    var rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($' + nc + '2<>"",$' + nc + '2>$' + nc + '$' + avgRow + '+2)')
      .setBackground('#F4CCCC').setRanges([sh.getRange(2, 5, body.length, 1)]).build();
    sh.setConditionalFormatRules([rule]);
  } else {
    sh.getRange(2, 1).setValue('Δεν βρέθηκαν υπάλληλοι.');
  }
  sh.setFrozenRows(1); sh.setColumnWidth(1, 210);
  return sh;
}


/* ============================================================================================ *
 *  v2 — ONE-CLICK "NEW MONTH"
 *  Duplicates the file, clears the grid (keeps people), rolls the dates to the chosen month.
 * ============================================================================================ */
function newMonthCopy() {
  var ui = SpreadsheetApp.getUi(), ss = getSS_(), g = CONFIG.GRID;

  // Default: the month after the current sheet's first date.
  var firstDate = ss.getSheetByName(CONFIG.INPUT_SHEET).getRange(g.HEADER_ROW, g.FIRST_COL).getValue();
  var base = (firstDate instanceof Date) ? firstDate : new Date();
  var nm = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  var month = nm.getMonth() + 1, year = nm.getFullYear();

  var res = ui.prompt('Νέος μήνας',
    'Μήνας/Έτος για το αντίγραφο (π.χ. 7/2026).\n\nΆφησέ το κενό για ' + month + '/' + year + '.',
    ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var txt = res.getResponseText().trim();
  if (txt) { var m = /^(\d{1,2})\/(\d{4})$/.exec(txt); if (m) { month = +m[1]; year = +m[2]; } }

  var days = new Date(year, month, 0).getDate();           // 28/29/30/31
  var name = GREEK_MONTHS[month - 1] + ' ' + year + ' ΣΟΦΙΑ';

  var copy = DriveApp.getFileById(ss.getId()).makeCopy(name);
  var ss2  = SpreadsheetApp.openById(copy.getId());

  [CONFIG.SHEETS.ORARIA, CONFIG.SHEETS.CODED].forEach(function (sn) {
    var s = ss2.getSheetByName(sn); if (!s) return;
    var clearCols = Math.max(g.LAST_COL, g.FIRST_COL + days - 1) - g.FIRST_COL + 1;
    var last = Math.min(s.getLastRow(), g.LAST_ROW);
    if (last >= g.FIRST_ROW) s.getRange(g.FIRST_ROW, g.FIRST_COL, last - g.FIRST_ROW + 1, clearCols).clearContent();
    s.getRange(g.HEADER_ROW, g.FIRST_COL, 1, clearCols).clearContent();   // old dates out
    var dr = []; for (var d = 1; d <= days; d++) dr.push(new Date(year, month - 1, d));
    s.getRange(g.HEADER_ROW, g.FIRST_COL, 1, days).setValues([dr]).setNumberFormat('d/m/yy');
  });

  var note = (days !== 30)
    ? '\n\n⚠️ Ο μήνας έχει ' + days + ' ημέρες. Στο νέο αρχείο όρισε CONFIG.GRID.LAST_COL = ' + (g.FIRST_COL + days - 1) + '.'
    : '';
  ui.alert('Νέος μήνας',
    'Δημιουργήθηκε:\n' + name + '\n\n' + copy.getUrl() +
    '\n\nΆνοιξε το νέο αρχείο και τρέξε «🚀 Πλήρης Εγκατάσταση» — τα triggers δεν αντιγράφονται.' + note,
    ui.ButtonSet.OK);
}


/* ============================================================================================ *
 *  v2 — WEBHOOK to the Vercel app  (best-effort; configured via Script Properties)
 *  Project Settings → Script Properties:
 *     APP_WEBHOOK_URL    = https://your-app.vercel.app/api/webhook/sheets
 *     APP_WEBHOOK_SECRET = <same value as WEBHOOK_SECRET in Vercel>
 * ============================================================================================ */
function notifyApp_(range, oldV, newV) {
  try {
    var props = PropertiesService.getScriptProperties();
    var url = props.getProperty('APP_WEBHOOK_URL');
    var secret = props.getProperty('APP_WEBHOOK_SECRET');
    if (!url || !secret) return;                 // not configured yet — skip silently
    var editor = '';
    try { editor = Session.getActiveUser().getEmail() || ''; } catch (e) {}
    UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/json',
      headers: { 'X-Secret': secret },
      payload: JSON.stringify({
        a1: range.getA1Notation(), sheet: range.getSheet().getName(),
        oldV: oldV === undefined ? '' : oldV, newV: newV === undefined ? '' : newV,
        editor: editor, at: new Date().toISOString()
      }),
      muteHttpExceptions: true                   // never throw from a trigger
    });
  } catch (err) { Logger.log('notifyApp_ error: ' + err); }
}
