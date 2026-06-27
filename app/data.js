/* ============================================================================
 *  app/data.js — DEMO DATA ONLY
 *  This file contains randomly generated fictional employee data for
 *  portfolio demonstration purposes only.
 *  No real employees, real names, real IDs, or real shift schedules are used.
 *  All names are fictional. All employee IDs are randomly generated.
 * ========================================================================== */
(function () {
  // --- code → human-readable shift -------------------------------------------
  var CODE_TO_SHIFT = {
    '422':'04:00-12:00','201':'05:00-13:00','202':'06:00-14:00','203':'07:00-15:00',
    '403':'07:30-15:30','301':'08:00-16:00','206':'09:00-17:00','208':'10:00-18:00',
    '209':'10:30-18:30','210':'11:00-19:00','211':'12:00-20:00','404':'12:30-20:30',
    '212':'13:00-21:00','405':'13:30-21:30','213':'14:00-22:00','406':'14:30-22:30',
    '214':'15:00-23:00','402':'15:30-23:30','215':'16:00-00:00','333':'17:00-01:00',
    '218':'18:00-02:00','216':'22:00-06:00','217':'23:00-07:00',
    '243':'07:00-13:40','232':'08:00-14:40','233':'09:00-15:40','234':'10:00-16:40',
    '235':'11:00-17:40','236':'12:00-18:40','237':'13:00-19:40','238':'14:00-20:40',
    '239':'15:00-21:40','240':'16:00-22:40','241':'16:30-23:10','242':'17:00-23:40',
    'R':'ΡΕΠΟ'
  };

  // --- raw rows: [ID, surname, first, ...30 shift codes] --------------------
  // All names and IDs are fictional demo data
  var RAW = [
    ['1001','ΠΑΠΑΔΑΚΗΣ','ΓΙΩΡΓΟΣ','210,210,R,210,R,208,208,210,R,210,210,R,208,208,210,210,R,210,R,208,208,210,210,R,210,R,208,208,210,210'],
    ['1002','ΝΙΚΟΛΑΟΥ','ΕΛΕΝΗ','301,301,301,301,301,R,R,301,301,301,301,R,R,301,301,301,301,301,301,R,R,301,301,301,301,R,R,301,301,301'],
    ['1003','ΑΝΤΩΝΙΟΥ','ΜΑΡΙΑ','208,203,R,R,203,203,203,203,203,402,R,402,402,R,R,R,213,213,206,203,203,203,R,217,217,218,213,R,R,R'],
    ['1004','ΚΩΝΣΤΑΝΤΙΝΟΥ','ΝΙΚΟΣ','217,R,R,402,402,402,402,217,217,217,217,R,R,213,208,203,R,R,402,402,402,402,402,217,217,217,R,R,203,203'],
    ['1005','ΓΕΩΡΓΙΟΥ','ΣΟΦΙΑ','402,402,402,402,402,R,R,203,203,R,R,203,203,203,402,402,402,402,R,R,203,203,203,203,203,203,R,R,208,208'],
    ['1006','ΔΗΜΗΤΡΙΟΥ','ΧΡΙΣΤΙΝΑ','217,217,217,217,R,R,203,R,R,206,206,206,206,206,213,213,206,203,203,R,R,301,301,R,R,218,213,213,213,R'],
    ['1007','ΠΑΠΑΓΕΩΡΓΙΟΥ','ΜΙΧΑΛΗΣ','R,R,206,203,206,206,206,402,402,402,R,R,402,402,217,217,R,R,402,402,402,213,213,206,206,R,R,206,206,217'],
    ['1008','ΣΤΕΦΑΝΙΔΗΣ','ΦΩΤΗΣ','213,213,206,R,203,203,R,R,R,213,213,213,206,206,206,206,R,R,301,301,301,301,301,R,R,206,206,206,213,213'],
    ['1009','ΑΛΕΞΑΝΔΡΟΥ','ΝΑΤΑΛΙΑ','217,R,R,402,218,218,402,R,R,203,203,203,203,203,203,R,R,217,217,217,217,R,R,402,402,402,402,402,R,R'],
    ['1010','ΙΩΑΝΝΟΥ','ΑΡΓΥΡΩ','402,402,402,R,R,402,402,R,R,203,203,217,217,217,R,R,203,203,203,203,402,213,206,203,213,R,R,402,402,402'],
    ['1011','ΣΤΑΥΡΑΚΑΚΗΣ','ΑΛΕΞΑΝΔΡΑ','206,203,R,R,217,217,217,217,217,R,R,402,402,402,402,402,R,R,203,203,203,R,R,203,203,203,203,203,402,402'],
    ['1012','ΜΑΝΟΥΣΑΚΗΣ','ΣΤΕΛΛΑ','R,R,206,206,203,203,203,203,203,203,402,R,R,402,402,R,R,402,213,208,203,203,203,203,301,208,R,R,217,217'],
    ['1013','ΚΑΛΛΕΡΓΗΣ','ΕΛΕΥΘΕΡΙΑ','203,R,R,402,402,402,402,402,213,R,402,210,R,203,203,203,203,203,R,R,402,402,402,R,R,217,217,217,R,R'],
    ['1014','ΤΣΑΚΑΛΑΚΗΣ','ΑΝΝΑ','R,R,203,203,301,301,301,402,402,402,R,R,402,402,402,217,217,R,R,203,203,R,203,203,R,402,402,402,402,402'],
    ['1015','ΜΑΡΚΑΚΗΣ','ΛΥΔΙΑ','301,301,301,301,301,R,R,301,301,301,301,301,R,R,301,301,301,301,301,R,R,301,301,301,301,301,R,R,301,301'],
    ['1016','ΒΛΑΧΑΚΗΣ','ΓΙΑΝΝΗΣ','206,206,206,217,R,R,206,402,213,R,206,206,206,R,206,203,206,301,217,R,R,208,R,R,206,206,206,206,206,206'],
    ['1017','ΡΕΘΥΜΝΙΩΤΑΚΗΣ','ΜΙΧΑΛΗΣ','402,402,217,R,R,208,218,212,208,217,217,R,R,402,402,402,402,402,210,R,R,217,217,R,218,R,402,402,R,402'],
    ['1018','ΧΑΤΖΙΔΑΚΗΣ','ΙΑΚΩΒΟΣ','208,217,R,R,301,301,301,301,402,R,R,402,402,212,301,301,R,R,203,203,203,217,217,R,R,402,402,402,402,R'],
    ['1019','ΛΥΡΑΤΖΑΚΗΣ','ΚΩΝΣΤΑΝΤΙΝΟΣ','203,203,203,R,R,402,213,R,206,301,R,301,208,208,R,R,402,402,402,402,405,206,203,203,203,203,R,R,R,402'],
    ['1020','ΠΕΡΑΚΗΣ','ΕΛΕΝΗ','R,R,402,210,301,203,203,301,301,301,301,R,R,301,402,402,217,217,R,R,203,203,203,203,203,203,R,R,R,203'],
    ['1021','ΣΠΥΡΙΔΑΚΗΣ','ΑΝΝΑ','301,R,R,203,203,203,203,203,R,R,203,203,402,211,203,203,203,203,301,R,R,402,R,402,402,R,402,402,402,402'],
    ['1022','ΜΠΑΛΤΑΚΗΣ','ΠΕΤΡΟΣ','402,402,402,402,217,R,R,R,203,402,402,R,210,402,402,402,R,R,301,402,402,R,402,402,R,210,203,203,203,203'],
    ['1023','ΞΕΝΑΚΗΣ','ΜΑΝΩΛΗΣ','R,R,203,203,206,402,402,402,213,210,R,206,206,R,R,R,402,402,402,217,217,R,R,402,402,402,217,217,217,R'],
    ['1024','ΤΡΙΑΝΤΑΦΥΛΛΙΔΗΣ','ΜΑΝΩΛΗΣ','203,203,R,R,203,217,217,R,R,402,402,402,402,211,203,R,203,301,R,301,301,402,402,402,402,402,R,R,R,301'],
    ['1025','ΚΑΤΣΑΡΑΚΗΣ','ΗΛΙΑΣ','402,402,402,402,402,R,R,203,203,R,211,211,203,R,402,402,R,402,402,213,R,206,203,203,R,R,203,203,203,203'],
    ['1026','ΦΑΝΟΥΡΑΚΗΣ','ΝΙΚΟΣ','402,R,R,402,402,402,402,402,R,R,301,301,203,301,301,301,301,R,R,301,301,301,301,R,R,402,402,402,402,R'],
    ['1027','ΟΡΦΑΝΑΚΗΣ','ΚΩΝΣΤΑΝΤΙΝΟΣ','R,R,301,301,301,203,402,R,210,301,R,217,217,217,217,R,R,203,203,203,203,206,206,206,206,206,R,R,R,402'],
    ['1028','ΚΑΠΕΤΑΝΑΚΗΣ','ΜΑΡΙΑ','208,208,208,208,208,R,R,208,208,208,208,208,R,R,208,208,208,208,208,R,R,208,208,208,208,208,R,R,208,208'],
    ['1029','ΖΕΡΒΑΚΗΣ','ΓΙΑΝΝΗΣ','208,208,208,208,208,R,R,208,208,208,208,208,R,R,208,208,208,208,208,R,R,208,208,208,208,208,R,R,208,208']
  ];

  var YEAR = 2026, MONTH = 6, DAYS = 30;

  // --- dates -----------------------------------------------------------------
  var YEAR = 2026, MONTH = 6, DAYS = 30;

  // --- dates -----------------------------------------------------------------
  var DOW_EL = ['Κυ','Δε','Τρ','Τε','Πε','Πα','Σα'];
  var DOW_EN = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  var dates = [];
  for (var d = 1; d <= DAYS; d++) {
    var dt = new Date(YEAR, MONTH - 1, d);
    dates.push({ day: d, dow: dt.getDay(), weekend: dt.getDay() === 0 || dt.getDay() === 6, date: dt });
  }

  // --- shift helpers ---------------------------------------------------------
  function parseShift(s) {
    var m = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/.exec(String(s).trim());
    if (!m) return null;
    var start = (+m[1]) * 60 + (+m[2]), end = (+m[3]) * 60 + (+m[4]);
    if (end <= start) end += 1440;
    return { start: start, end: end, hours: (end - start) / 60, startHour: +m[1] };
  }
  function isRepo(s) { return String(s).trim() === 'ΡΕΠΟ' || String(s).trim() === 'R'; }
  function isLeave(s) { return /ΑΔΕΙΑ|ΑΝΑΡΡΩΤΙΚΗ/.test(String(s)); }
  function category(s) {
    if (!s || s === '') return 'empty';
    if (isRepo(s)) return 'repo';
    if (isLeave(s)) return 'leave';
    var t = parseShift(s); if (!t) return 'invalid';
    var h = t.startHour;
    if (h === 22 || h === 23) return 'night';
    if (h >= 15 && h <= 18) return 'late';
    if (h >= 12 && h <= 14) return 'midday';
    if (h >= 4 && h <= 11) return 'morning';
    return 'invalid';
  }
  var CAT = {
    empty:   { bg: '#FFFFFF', bd: '#E3DDD0', fg: '#9a9286', el: 'Κενό',     en: 'Empty' },
    repo:    { bg: '#EFEFEF', bd: '#dcdcdc', fg: '#6c655a', el: 'Ρεπό',     en: 'Day off' },
    leave:   { bg: '#F4CCCC', bd: '#e6b3b3', fg: '#8a3b3b', el: 'Άδεια',    en: 'Leave' },
    night:   { bg: '#B4A7D6', bd: '#9a8bc4', fg: '#3a2d63', el: 'Νύχτα',    en: 'Night' },
    late:    { bg: '#FCE5CD', bd: '#f0cfa8', fg: '#8a5a1e', el: 'Απόγευμα', en: 'Late' },
    midday:  { bg: '#CFE2F3', bd: '#aecbe8', fg: '#28567e', el: 'Μεσημέρι', en: 'Midday' },
    morning: { bg: '#D9EAD3', bd: '#bcd9b2', fg: '#3f6b41', el: 'Πρωί',     en: 'Morning' },
    invalid: { bg: '#CC0000', bd: '#a30000', fg: '#ffffff', el: 'Άκυρο',   en: 'Invalid' }
  };

  // --- build employees -------------------------------------------------------
  var employees = RAW.map(function (r, idx) {
    var codes = r[3].split(',');
    var shifts = codes.map(function (c) { return CODE_TO_SHIFT[c.trim()] || c.trim(); });
    return {
      idx: idx, ame: r[0], surname: r[1], first: r[2],
      name: r[1] + ' ' + r[2],
      codes: codes, shifts: shifts,
      cats: shifts.map(category)
    };
  });

  // --- coverage per day ------------------------------------------------------
  var STAFF = { min: 12, max: 24 };
  function computeCoverage(M) {
    M = M || active(); var employees = M.employees, dates = M.dates;
    return dates.map(function (dd, j) {
      var counts = { repo: 0, leave: 0, night: 0, working: 0, total: 0, morning: 0, midday: 0, late: 0 };
      employees.forEach(function (e) {
        var c = e.cats[j];
        if (c === 'empty') return;
        counts.total++;
        if (c === 'repo') counts.repo++;
        else if (c === 'leave') counts.leave++;
        else {
          counts.working++;
          if (c === 'night') counts.night++;
          if (c === 'morning') counts.morning++;
          if (c === 'midday') counts.midday++;
          if (c === 'late') counts.late++;
        }
      });
      var status = counts.working < STAFF.min ? 'low' : (counts.working > STAFF.max ? 'high' : 'ok');
      return Object.assign({ day: dd.day, dow: dd.dow, weekend: dd.weekend, status: status }, counts);
    });
  }

  // --- warnings (same rules as the validator) --------------------------------
  var RULES = { minRest: 11, maxNights: 4, maxWork: 6 };
  function computeWarnings(M) {
    M = M || active(); var employees = M.employees, dates = M.dates, DAYS = M.days;
    function w(sev, e, j, type, el, en, j2) {
      var dl = '' + dates[j].day + '/' + M.month;
      if (j2 != null) dl += '→' + dates[j2].day + '/' + M.month;
      return { sev: sev, empIdx: e.idx, empName: e.name, ame: e.ame, day: dates[j].day, dateLabel: dl, type: type, el: el, en: en };
    }
    var out = [];
    employees.forEach(function (e) {
      var nightRun = 0, workRun = 0;
      for (var j = 0; j < DAYS; j++) {
        var cur = e.shifts[j], t = parseShift(cur);
        if (t && (t.startHour === 22 || t.startHour === 23)) {
          nightRun++;
          if (nightRun === RULES.maxNights + 1)
            out.push(w('hard', e, j, 'nights', 'Πάνω από ' + RULES.maxNights + ' συνεχόμενες νύχτες', 'More than ' + RULES.maxNights + ' consecutive nights'));
        } else nightRun = 0;
        if (t) {
          workRun++;
          if (workRun === RULES.maxWork + 1)
            out.push(w('hard', e, j, 'streak', 'Πάνω από ' + RULES.maxWork + ' ημέρες εργασίας χωρίς ρεπό', 'More than ' + RULES.maxWork + ' workdays without a day off'));
        } else workRun = 0;
        if (t && j + 1 < DAYS) {
          var nxt = parseShift(e.shifts[j + 1]);
          if (nxt) {
            var rest = (1440 + nxt.start) - t.end;
            if (rest >= 0 && rest < RULES.minRest * 60)
              out.push(w('hard', e, j, 'rest', 'Ανάπαυση ' + (rest / 60).toFixed(1) + 'ω (<' + RULES.minRest + 'ω) πριν την επόμενη βάρδια', 'Only ' + (rest / 60).toFixed(1) + 'h rest (<' + RULES.minRest + 'h) before next shift', j + 1));
          }
        }
        if (t && j > 0 && j + 1 < DAYS && isLeave(e.shifts[j - 1]) && isLeave(e.shifts[j + 1]))
          out.push(w('soft', e, j, 'sandwich', 'Βάρδια ανάμεσα σε δύο άδειες — πιθανό λάθος', 'Shift between two leave days — likely a typo'));
      }
    });
    out.sort(function (a, b) { return a.empName < b.empName ? -1 : (a.empName > b.empName ? 1 : a.day - b.day); });
    return out;
  }

  // --- fairness / balance ----------------------------------------------------
  function computeStats(M) {
    M = M || active(); var employees = M.employees, dates = M.dates, DAYS = M.days;
    var rows = employees.map(function (e) {
      var s = { idx: e.idx, name: e.name, ame: e.ame, days: 0, hours: 0, nights: 0, wknd: 0, repo: 0, morning: 0, late: 0 };
      for (var j = 0; j < DAYS; j++) {
        var c = e.cats[j];
        if (c === 'repo') { s.repo++; continue; }
        if (c === 'leave' || c === 'empty') continue;
        var t = parseShift(e.shifts[j]); if (!t) continue;
        s.days++; s.hours += t.hours;
        if (c === 'night') s.nights++;
        if (c === 'morning') s.morning++;
        if (c === 'late') s.late++;
        if (dates[j].weekend) s.wknd++;
      }
      s.hours = Math.round(s.hours * 10) / 10;
      return s;
    });
    var avg = {};
    ['days', 'hours', 'nights', 'wknd', 'repo'].forEach(function (k) {
      avg[k] = Math.round((rows.reduce(function (a, r) { return a + r[k]; }, 0) / rows.length) * 10) / 10;
    });
    return { rows: rows, avg: avg };
  }

  // --- sample requests (employee → manager) ----------------------------------
  var requests = [
    { id: 'r1', type: 'swap',  empIdx: 5,  status: 'pending', day: 14, withIdx: 7,  el: 'Αλλαγή βάρδιας 14/6 με Στεφανίδη', en: 'Swap 14 Jun shift with Stefanidis' },
    { id: 'r2', type: 'leave', empIdx: 12, status: 'pending', day: 19, el: 'Άδεια 19–20/6 (5ήμερο)', en: 'Leave 19–20 Jun (5-day)' },
    { id: 'r3', type: 'swap',  empIdx: 20, status: 'pending', day: 9,  withIdx: 22, el: 'Αλλαγή ρεπό 9/6', en: 'Swap day off on 9 Jun' },
    { id: 'r4', type: 'leave', empIdx: 3,  status: 'approved', day: 27, el: 'Άδεια 27/6', en: 'Leave 27 Jun' }
  ];

  // --- notifications ---------------------------------------------------------
  var notifications = [
    { id: 'n1', kind: 'published', el: 'Το πρόγραμμα Ιουνίου δημοσιεύτηκε', en: 'June schedule was published', when: 'πριν 2 ώρες', whenEn: '2h ago', unread: true },
    { id: 'n2', kind: 'approved',  el: 'Η άδειά σου στις 27/6 εγκρίθηκε', en: 'Your 27 Jun leave was approved', when: 'χθες', whenEn: 'yesterday', unread: true },
    { id: 'n3', kind: 'reminder',  el: 'Αύριο: νυχτερινή βάρδια 22:00', en: 'Tomorrow: night shift at 22:00', when: 'χθες', whenEn: 'yesterday', unread: false }
  ];

  // --- months registry -------------------------------------------------------
  var EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var GR_MONTHS = ['Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος','Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος'];
  function buildDates(y, m, days) {
    var out = [];
    for (var d = 1; d <= days; d++) { var dt = new Date(y, m - 1, d); out.push({ day: d, dow: dt.getDay(), weekend: dt.getDay() === 0 || dt.getDay() === 6, date: dt }); }
    return out;
  }
  var june = { key: '2026-06', year: YEAR, month: MONTH, days: DAYS, dates: dates, employees: employees, today: 12,
    label: { el: 'Ιούνιος 2026', en: 'June 2026' } };
  var months = [june];
  var activeKey = june.key;
  function active() { for (var i = 0; i < months.length; i++) if (months[i].key === activeKey) return months[i]; return june; }
  function setActive(key) { activeKey = key; }
  function makeMonth(y, m) {
    var days = new Date(y, m, 0).getDate();
    var emps = employees.map(function (e) {
      var sh = []; for (var j = 0; j < days; j++) sh.push(e.shifts[j % e.shifts.length]);
      return { idx: e.idx, ame: e.ame, surname: e.surname, first: e.first, name: e.name, codes: [], shifts: sh, cats: sh.map(category) };
    });
    return { key: y + '-' + ('0' + m).slice(-2), year: y, month: m, days: days, dates: buildDates(y, m, days), employees: emps, today: 1,
      label: { el: GR_MONTHS[m - 1] + ' ' + y, en: EN_MONTHS[m - 1] + ' ' + y } };
  }
  function addMonth() {
    var last = months[months.length - 1];
    var ny = last.month === 12 ? last.year + 1 : last.year, nm = last.month === 12 ? 1 : last.month + 1;
    var mo = makeMonth(ny, nm); months.push(mo); return mo;
  }
  function parseScheduleCSV(text) {
    var lines = String(text).split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
    if (lines.length < 2) return null;
    var split = function (l) { return l.split(/[\t,;]/).map(function (c) { return c.trim().replace(/^"|"$/g, ''); }); };
    var header = split(lines[0]);
    var lower = header.map(function (h) { return h.toLowerCase(); });
    var roleIdx = -1, emailIdx = -1;
    lower.forEach(function (h, i) {
      if (roleIdx < 0 && /role|ρόλ/.test(h)) roleIdx = i;
      if (emailIdx < 0 && /email|e-?mail|ηλεκτρον/.test(h)) emailIdx = i;
    });
    var dayIdx = [];
    for (var k = 3; k < header.length; k++) { if (k !== roleIdx && k !== emailIdx) dayIdx.push(k); }
    if (dayIdx.length < 1 && roleIdx < 0 && emailIdx < 0) { dayIdx = []; for (var k2 = 3; k2 < header.length; k2++) dayIdx.push(k2); }
    if (dayIdx.length < 1) return null;
    var emps = [];
    for (var i = 1; i < lines.length; i++) {
      var c = split(lines[i]);
      var ame = (c[0] || '').trim();
      if (!ame || ame === '0') continue;
      var sh = dayIdx.map(function (di) { var v = (c[di] || '').trim(); return CODE_TO_SHIFT[v] || v; });
      emps.push({ idx: emps.length, ame: ame, surname: (c[1] || '').trim(), first: (c[2] || '').trim(),
        name: ((c[1] || '') + ' ' + (c[2] || '')).trim(), codes: [], shifts: sh, cats: sh.map(category),
        role: roleIdx >= 0 ? (c[roleIdx] || '').trim() : '', email: emailIdx >= 0 ? (c[emailIdx] || '').trim() : '' });
    }
    if (!emps.length) return null;
    return { days: Math.min(dayIdx.length, 31), employees: emps, hasRoles: roleIdx >= 0 };
  }
  function monthFromImport(parsed, fileName) {
    var last = months[months.length - 1];
    var ny = last.month === 12 ? last.year + 1 : last.year, nm = last.month === 12 ? 1 : last.month + 1;
    var src = (parsed && parsed.employees && parsed.employees.length) ? parsed : {
      days: active().days,
      employees: active().employees.map(function (e) { return { ame: e.ame, surname: e.surname, first: e.first, name: e.name, shifts: e.shifts.slice() }; })
    };
    var days = src.days;
    var mo = {
      key: 'imp-' + Date.now(), year: ny, month: nm, days: days, dates: buildDates(ny, nm, days), today: 1,
      imported: fileName || true,
      employees: src.employees.map(function (e, i) {
        var sh = e.shifts.slice(); while (sh.length < days) sh.push('ΡΕΠΟ'); sh = sh.slice(0, days);
        return { idx: i, ame: e.ame, surname: e.surname, first: e.first, name: e.name, codes: [], shifts: sh, cats: sh.map(category) };
      }),
      label: { el: GR_MONTHS[nm - 1] + ' ' + ny, en: EN_MONTHS[nm - 1] + ' ' + ny }
    };
    months.push(mo); return mo;
  }

  window.APP_DATA = {
    YEAR: YEAR, MONTH: MONTH, DAYS: DAYS, STAFF: STAFF, RULES: RULES,
    DOW_EL: DOW_EL, DOW_EN: DOW_EN,
    dates: dates, employees: employees, CAT: CAT, requests: requests, notifications: notifications,
    months: months, active: active, setActive: setActive, makeMonth: makeMonth, addMonth: addMonth,
    parseScheduleCSV: parseScheduleCSV, monthFromImport: monthFromImport,
    parseShift: parseShift, isRepo: isRepo, isLeave: isLeave, category: category,
    computeCoverage: computeCoverage, computeWarnings: computeWarnings, computeStats: computeStats,
    catOf: function (s) { return CAT[category(s)]; }
  };
})();
