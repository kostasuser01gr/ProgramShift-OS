/* ============================================================================
 * app/data.js - schedule helpers and authenticated API payload adapter.
 * No employee or schedule data is embedded in this public asset.
 * ========================================================================== */
(function () {
  var DOW_EL = ['Κυ', 'Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα'];
  var DOW_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  var EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var GR_MONTHS = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  var CODE_TO_SHIFT = {
    '422': '04:00-12:00', '201': '05:00-13:00', '202': '06:00-14:00', '203': '07:00-15:00',
    '403': '07:30-15:30', '301': '08:00-16:00', '206': '09:00-17:00', '208': '10:00-18:00',
    '209': '10:30-18:30', '210': '11:00-19:00', '211': '12:00-20:00', '404': '12:30-20:30',
    '212': '13:00-21:00', '405': '13:30-21:30', '213': '14:00-22:00', '406': '14:30-22:30',
    '214': '15:00-23:00', '402': '15:30-23:30', '215': '16:00-00:00', '333': '17:00-01:00',
    '218': '18:00-02:00', '216': '22:00-06:00', '217': '23:00-07:00',
    '243': '07:00-13:40', '232': '08:00-14:40', '233': '09:00-15:40', '234': '10:00-16:40',
    '235': '11:00-17:40', '236': '12:00-18:40', '237': '13:00-19:40', '238': '14:00-20:40',
    '239': '15:00-21:40', '240': '16:00-22:40', '241': '16:30-23:10', '242': '17:00-23:40',
    'R': 'ΡΕΠΟ'
  };
  var CAT = {
    empty: { bg: '#FFFFFF', bd: '#E3DDD0', fg: '#9a9286', el: 'Κενό', en: 'Empty' },
    repo: { bg: '#EFEFEF', bd: '#dcdcdc', fg: '#6c655a', el: 'Ρεπό', en: 'Day off' },
    leave: { bg: '#F4CCCC', bd: '#e6b3b3', fg: '#8a3b3b', el: 'Άδεια', en: 'Leave' },
    night: { bg: '#B4A7D6', bd: '#9a8bc4', fg: '#3a2d63', el: 'Νύχτα', en: 'Night' },
    late: { bg: '#FCE5CD', bd: '#f0cfa8', fg: '#8a5a1e', el: 'Απόγευμα', en: 'Late' },
    midday: { bg: '#CFE2F3', bd: '#aecbe8', fg: '#28567e', el: 'Μεσημέρι', en: 'Midday' },
    morning: { bg: '#D9EAD3', bd: '#bcd9b2', fg: '#3f6b41', el: 'Πρωί', en: 'Morning' },
    invalid: { bg: '#CC0000', bd: '#a30000', fg: '#ffffff', el: 'Άκυρο', en: 'Invalid' }
  };
  var STAFF = { min: 12, max: 24 };
  var RULES = { minRest: 11, maxNights: 4, maxWork: 6 };

  function parseShift(s) {
    var m = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var start = (+m[1]) * 60 + (+m[2]);
    var end = (+m[3]) * 60 + (+m[4]);
    if (end <= start) end += 1440;
    return { start: start, end: end, hours: (end - start) / 60, startHour: +m[1] };
  }
  function isRepo(s) { return String(s || '').trim() === 'ΡΕΠΟ' || String(s || '').trim() === 'R'; }
  function isLeave(s) { return /ΑΔΕΙΑ|ΑΝΑΡΡΩΤΙΚΗ/.test(String(s || '')); }
  function category(s) {
    if (!s) return 'empty';
    if (isRepo(s)) return 'repo';
    if (isLeave(s)) return 'leave';
    var t = parseShift(s);
    if (!t) return 'invalid';
    if (t.startHour === 22 || t.startHour === 23) return 'night';
    if (t.startHour >= 15 && t.startHour <= 18) return 'late';
    if (t.startHour >= 12 && t.startHour <= 14) return 'midday';
    if (t.startHour >= 4 && t.startHour <= 11) return 'morning';
    return 'invalid';
  }
  function buildDates(y, m, days) {
    var out = [];
    for (var d = 1; d <= days; d++) {
      var dt = new Date(y, m - 1, d);
      out.push({ day: d, dow: dt.getDay(), weekend: dt.getDay() === 0 || dt.getDay() === 6, date: dt });
    }
    return out;
  }
  function computeCoverage(M) {
    return M.dates.map(function (dd, j) {
      var counts = { repo: 0, leave: 0, night: 0, working: 0, total: 0, morning: 0, midday: 0, late: 0 };
      M.employees.forEach(function (e) {
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
  function computeWarnings(M) {
    function warning(sev, e, j, type, el, en, j2) {
      var label = M.dates[j].day + '/' + M.month;
      if (j2 != null) label += '→' + M.dates[j2].day + '/' + M.month;
      return { sev: sev, empIdx: e.idx, empName: e.name, ame: e.ame, day: M.dates[j].day, dateLabel: label, type: type, el: el, en: en };
    }
    var out = [];
    M.employees.forEach(function (e) {
      var nightRun = 0;
      var workRun = 0;
      for (var j = 0; j < M.days; j++) {
        var current = parseShift(e.shifts[j]);
        if (current && (current.startHour === 22 || current.startHour === 23)) {
          nightRun++;
          if (nightRun === RULES.maxNights + 1) out.push(warning('hard', e, j, 'nights', 'Πάνω από ' + RULES.maxNights + ' συνεχόμενες νύχτες', 'More than ' + RULES.maxNights + ' consecutive nights'));
        } else nightRun = 0;
        if (current) {
          workRun++;
          if (workRun === RULES.maxWork + 1) out.push(warning('hard', e, j, 'streak', 'Πάνω από ' + RULES.maxWork + ' ημέρες εργασίας χωρίς ρεπό', 'More than ' + RULES.maxWork + ' workdays without a day off'));
        } else workRun = 0;
        if (current && j + 1 < M.days) {
          var next = parseShift(e.shifts[j + 1]);
          if (next) {
            var rest = (1440 + next.start) - current.end;
            if (rest >= 0 && rest < RULES.minRest * 60) out.push(warning('hard', e, j, 'rest', 'Ανάπαυση ' + (rest / 60).toFixed(1) + 'ω (<' + RULES.minRest + 'ω)', 'Only ' + (rest / 60).toFixed(1) + 'h rest (<' + RULES.minRest + 'h)', j + 1));
          }
        }
        if (current && j > 0 && j + 1 < M.days && isLeave(e.shifts[j - 1]) && isLeave(e.shifts[j + 1])) out.push(warning('soft', e, j, 'sandwich', 'Βάρδια ανάμεσα σε δύο άδειες', 'Shift between two leave days'));
      }
    });
    return out.sort(function (a, b) { return a.empName < b.empName ? -1 : (a.empName > b.empName ? 1 : a.day - b.day); });
  }
  function computeStats(M) {
    var rows = M.employees.map(function (e) {
      var s = { idx: e.idx, name: e.name, ame: e.ame, days: 0, hours: 0, nights: 0, wknd: 0, repo: 0, morning: 0, late: 0 };
      for (var j = 0; j < M.days; j++) {
        var c = e.cats[j];
        if (c === 'repo') { s.repo++; continue; }
        if (c === 'leave' || c === 'empty') continue;
        var shift = parseShift(e.shifts[j]);
        if (!shift) continue;
        s.days++;
        s.hours += shift.hours;
        if (c === 'night') s.nights++;
        if (c === 'morning') s.morning++;
        if (c === 'late') s.late++;
        if (M.dates[j].weekend) s.wknd++;
      }
      s.hours = Math.round(s.hours * 10) / 10;
      return s;
    });
    var avg = {};
    ['days', 'hours', 'nights', 'wknd', 'repo'].forEach(function (key) {
      avg[key] = rows.length ? Math.round((rows.reduce(function (sum, row) { return sum + row[key]; }, 0) / rows.length) * 10) / 10 : 0;
    });
    return { rows: rows, avg: avg };
  }
  function parseScheduleCSV(text) {
    var lines = String(text).split(/\r?\n/).filter(function (line) { return line.trim(); });
    if (lines.length < 2) return null;
    var split = function (line) { return line.split(/[\t,;]/).map(function (cell) { return cell.trim().replace(/^"|"$/g, ''); }); };
    var header = split(lines[0]);
    var lower = header.map(function (value) { return value.toLowerCase(); });
    var roleIdx = lower.findIndex(function (value) { return /role|ρόλ/.test(value); });
    var emailIdx = lower.findIndex(function (value) { return /email|e-?mail|ηλεκτρον/.test(value); });
    var dayIndexes = [];
    for (var k = 3; k < header.length; k++) if (k !== roleIdx && k !== emailIdx) dayIndexes.push(k);
    if (!dayIndexes.length) return null;
    var employees = [];
    for (var i = 1; i < lines.length; i++) {
      var cells = split(lines[i]);
      var ame = (cells[0] || '').trim();
      if (!ame || ame === '0') continue;
      var shifts = dayIndexes.map(function (index) { var value = (cells[index] || '').trim(); return CODE_TO_SHIFT[value] || value; });
      employees.push({
        idx: employees.length, ame: ame, surname: (cells[1] || '').trim(), first: (cells[2] || '').trim(),
        name: ((cells[1] || '') + ' ' + (cells[2] || '')).trim(), codes: [], shifts: shifts, cats: shifts.map(category),
        role: roleIdx >= 0 ? (cells[roleIdx] || '').trim() : '', email: emailIdx >= 0 ? (cells[emailIdx] || '').trim() : ''
      });
    }
    return employees.length ? { days: Math.min(dayIndexes.length, 31), employees: employees, hasRoles: roleIdx >= 0 } : null;
  }

  window.createAppData = function (payload) {
    if (!payload || !payload.schedule || !Array.isArray(payload.schedule.employees) || !Array.isArray(payload.schedule.dates)) throw new Error('Invalid schedule response.');
    var firstIso = payload.schedule.dates[0] && payload.schedule.dates[0].iso;
    var firstDate = firstIso ? new Date(firstIso + 'T00:00:00Z') : new Date();
    var year = firstDate.getUTCFullYear();
    var monthNumber = firstDate.getUTCMonth() + 1;
    var dates = payload.schedule.dates.map(function (d) {
      var date = new Date(d.iso + 'T00:00:00Z');
      return { day: d.day, dow: d.dow, weekend: d.weekend, date: date };
    });
    var employees = payload.schedule.employees.map(function (e, idx) {
      var shifts = (e.shifts || []).slice();
      return { idx: idx, ame: e.ame, surname: e.surname, first: e.first, name: e.name, codes: [], shifts: shifts, cats: shifts.map(category) };
    });
    var now = new Date();
    var currentDay = now.getFullYear() === year && now.getMonth() + 1 === monthNumber ? now.getDate() : 1;
    var serverMonth = {
      key: year + '-' + ('0' + monthNumber).slice(-2), year: year, month: monthNumber, days: dates.length,
      dates: dates, employees: employees, today: currentDay, source: 'server',
      label: { el: GR_MONTHS[monthNumber - 1] + ' ' + year, en: payload.month || (EN_MONTHS[monthNumber - 1] + ' ' + year) }
    };
    var months = [serverMonth];
    var activeKey = serverMonth.key;
    function active() { return months.find(function (item) { return item.key === activeKey; }) || serverMonth; }
    function setActive(key) { activeKey = key; }
    function makeMonth(y, m) {
      var days = new Date(y, m, 0).getDate();
      var roster = active().employees.map(function (e) {
        var shifts = Array.from({ length: days }, function () { return 'ΡΕΠΟ'; });
        return { idx: e.idx, ame: e.ame, surname: e.surname, first: e.first, name: e.name, codes: [], shifts: shifts, cats: shifts.map(category) };
      });
      return { key: y + '-' + ('0' + m).slice(-2), year: y, month: m, days: days, dates: buildDates(y, m, days), employees: roster, today: 1, source: 'local', label: { el: GR_MONTHS[m - 1] + ' ' + y, en: EN_MONTHS[m - 1] + ' ' + y } };
    }
    function addMonth() {
      var last = months[months.length - 1];
      var y = last.month === 12 ? last.year + 1 : last.year;
      var m = last.month === 12 ? 1 : last.month + 1;
      var created = makeMonth(y, m);
      months.push(created);
      return created;
    }
    function monthFromImport(parsed, fileName) {
      var created = addMonth();
      if (parsed && parsed.employees && parsed.employees.length) {
        created.imported = fileName || true;
        created.days = parsed.days;
        created.dates = buildDates(created.year, created.month, parsed.days);
        created.employees = parsed.employees.map(function (e, idx) {
          var shifts = e.shifts.slice(0, parsed.days);
          while (shifts.length < parsed.days) shifts.push('ΡΕΠΟ');
          return { idx: idx, ame: e.ame, surname: e.surname, first: e.first, name: e.name, codes: [], shifts: shifts, cats: shifts.map(category) };
        });
      }
      return created;
    }
    window.APP_DATA = {
      YEAR: year, MONTH: monthNumber, DAYS: dates.length, STAFF: STAFF, RULES: RULES,
      DOW_EL: DOW_EL, DOW_EN: DOW_EN, dates: dates, employees: employees, CAT: CAT,
      requests: [], notifications: [], months: months, active: active, setActive: setActive,
      makeMonth: makeMonth, addMonth: addMonth, parseScheduleCSV: parseScheduleCSV, monthFromImport: monthFromImport,
      parseShift: parseShift, isRepo: isRepo, isLeave: isLeave, category: category,
      computeCoverage: computeCoverage, computeWarnings: computeWarnings, computeStats: computeStats,
      catOf: function (value) { return CAT[category(value)]; }
    };
    return window.APP_DATA;
  };
})();
