/* ============================================================================
 *  os/ai-agent.jsx — Agentic layer for the assistant.
 *  Turns natural language into REAL platform actions (edit shifts, publish,
 *  roles, members, tasks, notes, months, requests, navigation…), each with a
 *  preview + apply + UNDO. Per product decision, the agent acts WITHOUT role
 *  restrictions — it can change anything. Every action is audit-logged.
 * ========================================================================== */
(function () {
  'use strict';
  var SHIFT_VOCAB = [
    '04:00-12:00','05:00-13:00','06:00-14:00','07:00-15:00','07:30-15:30','08:00-16:00',
    '09:00-17:00','10:00-18:00','10:30-18:30','11:00-19:00','12:00-20:00','12:30-20:30',
    '13:00-21:00','13:30-21:30','14:00-22:00','14:30-22:30','15:00-23:00','15:30-23:30',
    '16:00-00:00','17:00-01:00','18:00-02:00','22:00-06:00','23:00-07:00',
    'ΡΕΠΟ','ΑΔΕΙΑ 5ΗΜΕΡΟΥ','ΑΝΑΡΡΩΤΙΚΗ 5ΗΜΕΡΟΥ'
  ];

  function norm(s) { return (window.OS && window.OS.norm ? window.OS.norm(s) : String(s || '').toLowerCase()); }

  // ---- entity resolution ----------------------------------------------------
  function findEmployee(month, q) {
    if (q == null) return null;
    var nq = norm(q);
    // by ΑΜΕ
    var byAme = month.employees.filter(function (e) { return String(e.ame) === String(q).trim(); })[0];
    if (byAme) return byAme;
    // by surname / first / full
    var hits = month.employees.filter(function (e) { return norm(e.name).indexOf(nq) >= 0 || norm(e.surname).indexOf(nq) >= 0 || norm(e.first).indexOf(nq) >= 0; });
    return hits.length === 1 ? hits[0] : (hits[0] || null);
  }
  function resolveShift(q) {
    if (!q) return null;
    var nq = String(q).trim().toLowerCase();
    if (/^(ρεπο|ρεπό|repo|day ?off|off)$/i.test(nq)) return 'ΡΕΠΟ';
    if (/αδεια|άδεια|leave/i.test(nq)) return 'ΑΔΕΙΑ 5ΗΜΕΡΟΥ';
    if (/αναρ|sick/i.test(nq)) return 'ΑΝΑΡΡΩΤΙΚΗ 5ΗΜΕΡΟΥ';
    var m = /(\d{1,2})[:.]?(\d{2})?\s*[-–to]+\s*(\d{1,2})[:.]?(\d{2})?/.exec(nq);
    if (m) {
      var a = ('0' + m[1]).slice(-2) + ':' + (m[2] || '00');
      var b = ('0' + m[3]).slice(-2) + ':' + (m[4] || '00');
      var cand = a + '-' + b;
      if (SHIFT_VOCAB.indexOf(cand) >= 0) return cand;
      // nearest by start hour
      var hit = SHIFT_VOCAB.filter(function (s) { return s.indexOf(a + '-') === 0; })[0];
      if (hit) return hit;
      return cand;
    }
    // single start hour: "to 14" → 14:00-22:00
    var h = /^(\d{1,2})$/.exec(nq);
    if (h) { var hh = ('0' + h[1]).slice(-2); return SHIFT_VOCAB.filter(function (s) { return s.indexOf(hh + ':00-') === 0; })[0] || null; }
    return null;
  }

  /* ==========================================================================
   *  TOOL REGISTRY — each tool: run(args, ctx) → { summary, undo }
   *  No permission checks (god-mode per product decision). All audit-logged.
   * ======================================================================== */
  var TOOLS = {
    set_shift: function (args, ctx) {
      var e = findEmployee(ctx.month, args.employee);
      if (!e) return { error: 'no_employee', detail: args.employee };
      var day = parseInt(args.day, 10); if (!day || day < 1 || day > ctx.month.days) return { error: 'bad_day', detail: args.day };
      var shift = resolveShift(args.shift); if (!shift) return { error: 'bad_shift', detail: args.shift };
      var j = day - 1, before = e.shifts[j];
      ctx.setCell(e.idx, j, shift);
      window.OS.Audit.add({ action: 'ai.set_shift', target: e.name + ' · ' + day + '/' + ctx.month.month, before: before, after: shift, role: ctx.role, module: 'ai' });
      return { summary: e.name + ' · ' + day + '/' + ctx.month.month + ': ' + (before || '—') + ' → ' + shift,
        undo: function () { ctx.setCell(e.idx, j, before); } };
    },
    day_off: function (args, ctx) { return TOOLS.set_shift({ employee: args.employee, day: args.day, shift: 'ΡΕΠΟ' }, ctx); },

    fix_warning: function (args, ctx) {
      var w = ctx.derived.warnings[args.index]; if (!w) return { error: 'no_warning' };
      var e = ctx.month.employees.filter(function (x) { return String(x.ame) === String(w.ame); })[0];
      if (!e) return { error: 'no_employee' };
      var j = w.day - 1, before = e.shifts[j], fix;
      if (w.type === 'rest' || w.type === 'nights' || w.type === 'streak') fix = 'ΡΕΠΟ';
      else if (w.type === 'sandwich') fix = 'ΑΔΕΙΑ 5ΗΜΕΡΟΥ';
      else return { error: 'no_autofix' };
      ctx.setCell(e.idx, j, fix);
      window.OS.Audit.add({ action: 'ai.fix_warning', target: e.name + ' · ' + w.dateLabel, before: before, after: fix, role: ctx.role, module: 'ai' });
      return { summary: '🛠 ' + e.name + ' · ' + w.dateLabel + ': ' + (before || '—') + ' → ' + fix + '  (' + w.type + ')',
        undo: function () { ctx.setCell(e.idx, j, before); } };
    },

    publish: function (args, ctx) {
      var before = window.OS.Visibility.get(ctx.month.key);
      var patch = { published: true };
      if (args.week != null) { patch.mode = 'window'; patch.from = (args.week - 1) * 7; patch.to = Math.min((args.week - 1) * 7 + 6, ctx.month.days - 1); }
      else if (args.from != null) { patch.mode = 'window'; patch.from = args.from - 1; patch.to = (args.to || args.from) - 1; }
      else patch.mode = 'all';
      window.OS.Visibility.set(ctx.month.key, patch);
      window.OS.Audit.add({ action: 'ai.publish', target: ctx.month.label.en + ' · ' + (patch.mode === 'all' ? 'all' : (patch.from + 1) + '–' + (patch.to + 1)), role: ctx.role, module: 'ai' });
      window.OS.Notify.add({ type: 'publish', title: 'Schedule released', desc: ctx.month.label.en + ' · ' + (patch.mode === 'all' ? 'whole month' : 'days ' + (patch.from + 1) + '–' + (patch.to + 1)), module: 'ai', priority: 'high' });
      return { summary: '📢 Published ' + (patch.mode === 'all' ? 'whole month' : 'days ' + (patch.from + 1) + '–' + (patch.to + 1)),
        undo: function () { window.OS.Visibility.set(ctx.month.key, before); } };
    },
    unpublish: function (args, ctx) {
      var before = window.OS.Visibility.get(ctx.month.key);
      window.OS.Visibility.set(ctx.month.key, { published: false });
      window.OS.Audit.add({ action: 'ai.unpublish', target: ctx.month.label.en, role: ctx.role, module: 'ai' });
      return { summary: '🙈 Hidden from staff (draft)', undo: function () { window.OS.Visibility.set(ctx.month.key, before); } };
    },

    change_role: function (args, ctx) {
      var members = window.OS.Members.list();
      var nq = norm(args.member);
      var m = members.filter(function (x) { return norm(x.name).indexOf(nq) >= 0 || String(x.ame) === String(args.member).trim(); })[0];
      if (!m) return { error: 'no_member', detail: args.member };
      var role = /owner|ιδιοκτ/i.test(args.role) ? 'owner' : /manager|διαχειρ|προϊστ|επόπτ/i.test(args.role) ? 'manager' : /view|προβολ/i.test(args.role) ? 'viewer' : 'employee';
      var before = m.role;
      window.OS.Members.setRole(m.id, role);
      window.OS.Audit.add({ action: 'ai.change_role', target: m.name, before: before, after: role, role: ctx.role, module: 'ai' });
      return { summary: '👤 ' + m.name + ': ' + before + ' → ' + role, undo: function () { window.OS.Members.setRole(m.id, before); } };
    },
    remove_member: function (args, ctx) {
      var members = window.OS.Members.list();
      var nq = norm(args.member);
      var m = members.filter(function (x) { return norm(x.name).indexOf(nq) >= 0 || String(x.ame) === String(args.member).trim(); })[0];
      if (!m) return { error: 'no_member', detail: args.member };
      var snapshot = Object.assign({}, m);
      window.OS.Members.remove(m.id);
      window.OS.Audit.add({ action: 'ai.remove_member', target: m.name, role: ctx.role, module: 'ai' });
      return { summary: '🗑 Removed ' + m.name, undo: function () { window.OS.Members.restore ? window.OS.Members.restore(snapshot) : window.OS.Members.add(snapshot); } };
    },

    create_task: function (args, ctx) {
      var t = window.OS.Tasks.add({ title: args.title, done: false, priority: args.priority || 'normal', assignee: args.assignee || '—', module: 'ai' });
      window.OS.Audit.add({ action: 'ai.create_task', target: args.title, role: ctx.role, module: 'ai' });
      window.OS.Bus.emit('task.assigned', { title: args.title });
      return { summary: '✓ Task: ' + args.title, undo: function () { window.OS.Tasks.remove(t.id); } };
    },
    add_note: function (args, ctx) {
      var n = window.OS.Notes.add({ title: args.title || 'Note', body: args.body || '', at: Date.now(), pinned: false });
      window.OS.Audit.add({ action: 'ai.add_note', target: args.title, role: ctx.role, module: 'ai' });
      return { summary: '📝 Note: ' + (args.title || args.body || '').slice(0, 40), undo: function () { window.OS.Notes.remove(n.id); } };
    },
    add_month: function (args, ctx) {
      var mo = ctx.addMonth();
      return { summary: '🗓 Created ' + mo.label.en, undo: null };
    },
    approve_request: function (args, ctx) {
      var pend = ctx.requests.filter(function (r) { return r.status === 'pending'; });
      var r = pend[(args.index || 1) - 1] || pend[0]; if (!r) return { error: 'no_request' };
      ctx.setRequests(ctx.requests.map(function (x) { return x.id === r.id ? Object.assign({}, x, { status: 'approved' }) : x; }));
      window.OS.Audit.add({ action: 'ai.approve_request', target: r.id, role: ctx.role, module: 'ai' });
      return { summary: '✅ Approved request', undo: function () { ctx.setRequests(ctx.requests.map(function (x) { return x.id === r.id ? Object.assign({}, x, { status: 'pending' }) : x; })); } };
    },
    open_module: function (args, ctx) {
      var reg = window.OS_REGISTRY, nq = norm(args.module);
      var m = reg.filter(function (x) { return norm(x.name.en).indexOf(nq) >= 0 || norm(x.name.el).indexOf(nq) >= 0 || x.id === args.module; })[0];
      if (!m) return { error: 'no_module', detail: args.module };
      ctx.open(m.id);
      return { summary: '↗ Opened ' + m.name.en, undo: null };
    },
    export_csv: function (args, ctx) { window.exportMonthCSV(ctx.month); return { summary: '⬇ Exported ' + ctx.month.label.en + ' (CSV)', undo: null }; },
    set_theme: function (args, ctx) { var b = ctx.theme; ctx.setTheme(/dark|σκο/i.test(args.theme) ? 'dark' : 'light'); return { summary: '🎨 Theme: ' + (/dark|σκο/i.test(args.theme) ? 'dark' : 'light'), undo: function () { ctx.setTheme(b); } }; }
  };

  /* ==========================================================================
   *  LOCAL INTENT PARSER (EL + EN) — used when the live model is unavailable,
   *  and as a fast-path. Returns { reply, actions:[{tool,args,label}] }.
   * ======================================================================== */
  function parseIntent(text, ctx) {
    var s = text.trim(); var ns = norm(s); var en = ctx.lang === 'en';
    var actions = [];
    var dayNums = (s.match(/\b(\d{1,2})\b/g) || []).map(Number);

    // fix all warnings
    if (/fix all|διορθωσε ολ|fix everything|διόρθωσε όλ|fix the warning|fix warning|διόρθωσε/i.test(ns)) {
      var fixable = ctx.derived.warnings.map(function (w, i) { return { w: w, i: i }; }).filter(function (o) { return o.w.type !== 'empty'; });
      if (!fixable.length) return { reply: en ? 'No fixable warnings right now.' : 'Καμία διορθώσιμη προειδοποίηση.', actions: [] };
      fixable.slice(0, 20).forEach(function (o) { actions.push({ tool: 'fix_warning', args: { index: o.i }, label: (en ? 'Fix: ' : 'Διόρθωση: ') + o.w.empName + ' · ' + o.w.dateLabel }); });
      return { reply: (en ? 'I can resolve ' : 'Μπορώ να λύσω ') + fixable.length + (en ? ' warning(s) by inserting rest days. Review and apply:' : ' προειδοποιήσεις βάζοντας ρεπό. Δες & εφάρμοσε:'), actions: actions };
    }

    // publish
    if (/publish|δημοσ|release|άνοιξε στο προσωπικό|ανοιξε στο προσωπικο|show.*(staff|week)|reveal/i.test(ns)) {
      var wk = /(week|εβδομ\w*)\s*(\d)/i.exec(s); var weekN = wk ? +wk[2] : null;
      if (/all|whole|ολο|όλο/i.test(ns)) actions.push({ tool: 'publish', args: { scope: 'all' }, label: en ? 'Publish whole month' : 'Δημοσίευση όλου του μήνα' });
      else if (weekN) actions.push({ tool: 'publish', args: { week: weekN }, label: (en ? 'Publish week ' : 'Δημοσίευση εβδομάδας ') + weekN });
      else if (dayNums.length >= 2) actions.push({ tool: 'publish', args: { from: dayNums[0], to: dayNums[1] }, label: (en ? 'Publish days ' : 'Δημοσίευση ημερών ') + dayNums[0] + '–' + dayNums[1] });
      else actions.push({ tool: 'publish', args: { scope: 'all' }, label: en ? 'Publish whole month' : 'Δημοσίευση όλου του μήνα' });
      return { reply: en ? 'Ready to publish:' : 'Έτοιμο για δημοσίευση:', actions: actions };
    }
    if (/unpublish|hide|κρυψε|κρύψε|draft|προχειρο|πρόχειρο/i.test(ns)) {
      return { reply: en ? 'Hide the schedule from staff:' : 'Απόκρυψη από το προσωπικό:', actions: [{ tool: 'unpublish', args: {}, label: en ? 'Set to draft (hidden)' : 'Πρόχειρο (κρυφό)' }] };
    }

    // change role
    var roleM = /(make|set|κανε|κάνε|promote|προηγαγε)\s+(.+?)\s+(an?\s+)?(owner|manager|employee|viewer|ιδιοκτ\w*|διαχειρ\w*|προϊστ\w*|υπαλλ\w*|προβολ\w*)/i.exec(s);
    if (roleM) { return { reply: en ? 'Change role:' : 'Αλλαγή ρόλου:', actions: [{ tool: 'change_role', args: { member: roleM[2].trim(), role: roleM[4] }, label: (en ? 'Set ' : 'Όρισε ') + roleM[2].trim() + ' → ' + roleM[4] }] }; }

    // remove member
    var remM = /(remove|delete|διαγραψε|διέγραψε|αφαιρεσε|αφαίρεσε|βγαλε|βγάλε)\s+(.+)/i.exec(s);
    if (remM && /member|μελ|staff|υπαλ|τον |την |the /i.test(ns)) { var who = remM[2].replace(/\b(member|the|τον|την|μέλος|υπάλληλο)\b/gi, '').trim(); return { reply: en ? 'Remove member:' : 'Αφαίρεση μέλους:', actions: [{ tool: 'remove_member', args: { member: who }, label: (en ? 'Remove ' : 'Αφαίρεση ') + who }] }; }

    // set shift: "set/give NAME on DAY to SHIFT" or "NAME DAY SHIFT"
    var shiftM = /(?:set|give|βαλε|βάλε|βαζω|put|assign|αναθεσε)\s+(.+?)\s+(?:on|στι[ςσ]|day|μερα|ημερα)?\s*(\d{1,2})\s+(?:to|σε|=|→|->)?\s*(.+)/i.exec(s);
    if (shiftM) { var sh = resolveShift(shiftM[3]); if (sh) return { reply: en ? 'Change shift:' : 'Αλλαγή βάρδιας:', actions: [{ tool: 'set_shift', args: { employee: shiftM[1].trim(), day: +shiftM[2], shift: shiftM[3].trim() }, label: shiftM[1].trim() + ' · ' + en ? 'day ' : 'ημ. ' + shiftM[2] + ' → ' + sh }] }; }
    // day off: "give NAME a day off on DAY"
    var offM = /(day ?off|ρεπο|ρεπό|off)\s.*?(\d{1,2})|(\d{1,2}).*(day ?off|ρεπο|ρεπό)/i.exec(s);
    if (offM && /(day ?off|ρεπο|ρεπό)/i.test(ns)) {
      var nameM = /(?:give|βαλε|βάλε|δωσε|δώσε)\s+(.+?)\s+(?:a\s+)?(?:day ?off|ρεπο|ρεπό|off)/i.exec(s);
      var d = dayNums[0];
      if (nameM && d) return { reply: en ? 'Add day off:' : 'Προσθήκη ρεπό:', actions: [{ tool: 'day_off', args: { employee: nameM[1].trim(), day: d }, label: nameM[1].trim() + ' · ' + (en ? 'day off on ' : 'ρεπό στις ') + d }] };
    }

    // task / note
    var taskM = /(?:task|εργασια|εργασία|todo|create task|νεα εργασια|νέα εργασία)[:\-]?\s+(.+)/i.exec(s);
    if (taskM && /task|εργασ|todo/i.test(ns)) return { reply: en ? 'Create task:' : 'Νέα εργασία:', actions: [{ tool: 'create_task', args: { title: taskM[1].trim() }, label: (en ? 'Task: ' : 'Εργασία: ') + taskM[1].trim() }] };
    var noteM = /(?:note|σημειωσ\w*|σημείωσ\w*)[:\-]?\s+(.+)/i.exec(s);
    if (noteM && /note|σημει/i.test(ns)) return { reply: en ? 'Add note:' : 'Νέα σημείωση:', actions: [{ tool: 'add_note', args: { title: noteM[1].trim().slice(0, 40), body: noteM[1].trim() }, label: (en ? 'Note: ' : 'Σημείωση: ') + noteM[1].trim().slice(0, 30) }] };

    // new month
    if (/new month|νεο[ςσ]? μηνα|νέο[ςσ]? μήνα|next month|επομενο[ςσ]? μηνα|επόμενο[ςσ]? μήνα|add month/i.test(ns)) return { reply: en ? 'Create the next month:' : 'Δημιουργία επόμενου μήνα:', actions: [{ tool: 'add_month', args: {}, label: en ? 'Create next month' : 'Νέος μήνας' }] };
    // approve request
    if (/approve|εγκρ\w*|accept/i.test(ns) && /request|αιτημ/i.test(ns)) return { reply: en ? 'Approve request:' : 'Έγκριση αιτήματος:', actions: [{ tool: 'approve_request', args: { index: dayNums[0] || 1 }, label: en ? 'Approve pending request' : 'Έγκριση αιτήματος' }] };
    // export
    if (/export|εξαγωγ\w*|csv|download/i.test(ns)) return { reply: en ? 'Export the current month:' : 'Εξαγωγή τρέχοντος μήνα:', actions: [{ tool: 'export_csv', args: {}, label: 'CSV · ' + ctx.month.label.en }] };
    // theme
    if (/dark mode|σκουρο|σκούρο|light mode|φωτειν\w*|theme|θεμα|θέμα/i.test(ns)) return { reply: en ? 'Switch theme:' : 'Αλλαγή θέματος:', actions: [{ tool: 'set_theme', args: { theme: /dark|σκο/i.test(ns) ? 'dark' : 'light' }, label: /dark|σκο/i.test(ns) ? (en ? 'Dark' : 'Σκούρο') : (en ? 'Light' : 'Φωτεινό') }] };
    // open module
    var openM = /(?:open|ανοιξε|άνοιξε|go to|παω|πάω|show me)\s+(.+)/i.exec(s);
    if (openM) { var reg = window.OS_REGISTRY, nq2 = norm(openM[1]); var mm = reg.filter(function (x) { return norm(x.name.en).indexOf(nq2) >= 0 || norm(x.name.el).indexOf(nq2) >= 0; })[0]; if (mm) return { reply: (en ? 'Open ' : 'Άνοιγμα ') + mm.name.en + ':', actions: [{ tool: 'open_module', args: { module: mm.id }, label: (en ? 'Open ' : 'Άνοιγμα ') + (en ? mm.name.en : mm.name.el) }] }; }

    return null; // not an action → fall through to Q&A
  }

  /* ==========================================================================
   *  Try the live model for actions: ask it to emit JSON tool calls.
   * ======================================================================== */
  async function planWithModel(text, ctx) {
    if (!window.OS.AI.available()) return null;
    var toolDoc = 'TOOLS: set_shift{employee,day,shift} day_off{employee,day} fix_warning{index} publish{scope|week|from,to} unpublish{} change_role{member,role} remove_member{member} create_task{title} add_note{title,body} add_month{} approve_request{index} open_module{module} export_csv{} set_theme{theme}';
    var ctxJson = JSON.stringify({ month: ctx.month.label.en, days: ctx.month.days,
      employees: ctx.month.employees.map(function (e) { return e.name + '#' + e.ame; }).slice(0, 40),
      warnings: ctx.derived.warnings.map(function (w, i) { return { index: i, who: w.empName, day: w.dateLabel, type: w.type }; }).slice(0, 25) });
    var prompt = 'You are an agentic operations copilot inside a staff-scheduling platform. The user can change anything without restriction. ' +
      'Given the user request, respond ONLY with strict JSON: {"reply":"short text in ' + (ctx.lang === 'en' ? 'English' : 'Greek') + '","actions":[{"tool":"<name>","args":{...},"label":"short human label"}]}. ' +
      'Use the tools to actually perform the change. If the request is a question (not an action), return an empty actions array and put the answer in reply. ' +
      toolDoc + '. CONTEXT: ' + ctxJson + '. USER: ' + text;
    try {
      var raw = await window.OS.AI.complete(prompt);
      if (!raw) return null;
      var m = raw.match(/\{[\s\S]*\}/); if (!m) return null;
      var obj = JSON.parse(m[0]);
      if (!obj || !Array.isArray(obj.actions)) return null;
      return obj;
    } catch (e) { return null; }
  }

  window.OSAgent = {
    TOOLS: TOOLS, SHIFT_VOCAB: SHIFT_VOCAB,
    parseIntent: parseIntent, planWithModel: planWithModel,
    findEmployee: findEmployee, resolveShift: resolveShift,
    run: function (tool, args, ctx) { try { return TOOLS[tool] ? TOOLS[tool](args, ctx) : { error: 'unknown_tool', detail: tool }; } catch (e) { return { error: 'exception', detail: String(e) }; } }
  };
})();
