/* ============================================================================
 *  os/services.js — Program Shift OS shared platform services (framework-free)
 *  Bus · Perms · Notify · Audit · Memory · Tasks · Notes · Automations · Chat ·
 *  Settings · Favorites · persistence · AI bridge.  One global: window.OS
 * ========================================================================== */
(function () {
  'use strict';

  // ---- tiny utils -----------------------------------------------------------
  // 'app.view' …
  var uid = function (p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 9); };
  function greeklish(s) {
    var map = { 'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o', 'ά': 'a', 'έ': 'e', 'ή': 'i', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ώ': 'o', 'ϊ': 'i', 'ϋ': 'y', 'ΐ': 'i', 'ΰ': 'y' };
    return String(s || '').toLowerCase().split('').map(function (c) { return map[c] != null ? map[c] : (/[a-z0-9]/.test(c) ? c : ''); }).join('').slice(0, 18);
  }
  function load(key, fallback) {
    try { var v = localStorage.getItem('psos.' + key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem('psos.' + key, JSON.stringify(val)); } catch (e) { /* quota / private mode */ }
  }
  function timeAgo(ts, lang) {
    var s = Math.floor((Date.now() - ts) / 1000), en = lang !== 'el';
    if (s < 60) return en ? 'just now' : 'μόλις τώρα';
    var m = Math.floor(s / 60); if (m < 60) return m + (en ? 'm ago' : 'λ πριν');
    var h = Math.floor(m / 60); if (h < 24) return h + (en ? 'h ago' : 'ω πριν');
    var d = Math.floor(h / 24); return d + (en ? 'd ago' : 'μ πριν');
  }

  // ---- event bus (with ring-buffer log) -------------------------------------
  var Bus = (function () {
    var subs = {}, log = [];
    return {
      on: function (ev, fn) { (subs[ev] = subs[ev] || []).push(fn); return function () { subs[ev] = (subs[ev] || []).filter(function (f) { return f !== fn; }); }; },
      emit: function (ev, payload) {
        var rec = { id: uid('ev'), ev: ev, payload: payload || {}, at: Date.now() };
        log.push(rec); if (log.length > 600) log.shift();
        (subs[ev] || []).forEach(function (fn) { try { fn(payload, rec); } catch (e) { console.error('[bus]', ev, e); } });
        (subs['*'] || []).forEach(function (fn) { try { fn(rec); } catch (e) { console.error(e); } });
        return rec;
      },
      log: function () { return log.slice().reverse(); }
    };
  })();

  // ---- permissions (RBAC) ---------------------------------------------------
  // action -> roles allowed. Roles: owner, manager, employee, viewer.
  var PERM = {
    'app.view':            ['owner', 'manager', 'employee', 'viewer'],
    'schedule.view':       ['owner', 'manager', 'employee', 'viewer'],
    'schedule.edit':       ['owner', 'manager'],
    'schedule.publish':    ['owner', 'manager'],
    'requests.create':     ['owner', 'manager', 'employee'],
    'requests.approve':    ['owner', 'manager'],
    'import':              ['owner', 'manager'],
    'export':              ['owner', 'manager', 'viewer'],
    'automation.manage':   ['owner', 'manager'],
    'automation.run':      ['owner', 'manager'],
    'files.manage':        ['owner', 'manager', 'employee'],
    'forms.manage':        ['owner', 'manager'],
    'forms.fill':          ['owner', 'manager', 'employee'],
    'reservations.view':   ['owner', 'manager', 'employee', 'viewer'],
    'reservations.upload': ['owner', 'manager', 'employee'],
    'reservations.manage': ['owner', 'manager'],
    'members.manage':      ['owner'],
    'members.view':        ['owner', 'manager'],
    'members.edit':        ['owner', 'manager'],
    'settings.manage':     ['owner'],
    'settings.personal':   ['owner', 'manager', 'employee', 'viewer'],
    'ai.actions':          ['owner', 'manager', 'employee'],
    'audit.view':          ['owner', 'manager'],
    'tasks.manage':        ['owner', 'manager', 'employee'],
    'notes.manage':        ['owner', 'manager', 'employee'],
    'chat.post':           ['owner', 'manager', 'employee']
  };
  var Perms = {
    // Specialized roles resolve to a permission TIER, so new supervisor roles
    // never require rewriting the matrix — the "future-proof permission engine".
    tier: function (role) { return ROLE_TIER[role] || role || 'employee'; },
    can: function (role, action) { var a = PERM[action]; if (!a) return true; var t = ROLE_TIER[role] || role; return a.indexOf(t) >= 0 || a.indexOf(role) >= 0; },
    matrix: PERM
  };
  // role -> permission tier (owner = full, manager = supervisor, employee, viewer)
  var ROLE_TIER = {
    owner: 'owner', admin: 'owner', inspector: 'owner',
    manager: 'manager', supervisor: 'manager', coordinator: 'manager',
    cs_supervisor: 'manager', fleet_supervisor: 'manager',
    employee: 'employee', viewer: 'viewer'
  };
  // supervisor department/title (for dashboards + display)
  var ROLE_DEPT = { inspector: 'inspection', coordinator: 'station', cs_supervisor: 'customer', fleet_supervisor: 'fleet' };

  // ---- notifications --------------------------------------------------------
  var Notify = (function () {
    var items = load('notifs', []);
    function persist() { save('notifs', items.slice(0, 80)); }
    return {
      add: function (n) {
        var it = Object.assign({ id: uid('n'), at: Date.now(), unread: true, priority: 'normal', module: 'system' }, n);
        items.unshift(it); persist(); Bus.emit('notification.created', it); return it;
      },
      all: function () { return items.slice(); },
      unread: function () { return items.filter(function (i) { return i.unread; }).length; },
      markRead: function (id) { items.forEach(function (i) { if (!id || i.id === id) i.unread = false; }); persist(); Bus.emit('notification.read', { id: id }); },
      clear: function () { items = []; persist(); Bus.emit('notification.read', {}); }
    };
  })();

  // ---- audit log (append-only) ----------------------------------------------
  var Audit = (function () {
    var items = load('audit', []);
    return {
      add: function (e) {
        var it = Object.assign({ id: uid('a'), at: Date.now(), severity: 'info' }, e);
        items.unshift(it); if (items.length > 400) items.pop(); save('audit', items.slice(0, 400));
        Bus.emit('audit.logged', it); return it;
      },
      all: function () { return items.slice(); }
    };
  })();

  // ---- operational memory / timeline ---------------------------------------
  var Memory = (function () {
    var items = load('memory', []);
    return {
      add: function (m) { var it = Object.assign({ id: uid('m'), at: Date.now() }, m); items.unshift(it); if (items.length > 300) items.pop(); save('memory', items.slice(0, 300)); return it; },
      all: function () { return items.slice(); },
      since: function (ts) { return items.filter(function (i) { return i.at >= ts; }); },
      today: function () { var d = new Date(); d.setHours(0, 0, 0, 0); return items.filter(function (i) { return i.at >= d.getTime(); }); }
    };
  })();

  // ---- generic persisted collection ----------------------------------------
  function Collection(key, seed) {
    var items = load(key, null); if (items == null) { items = seed || []; save(key, items); }
    return {
      all: function () { return items.slice(); },
      get: function (id) { return items.filter(function (i) { return i.id === id; })[0]; },
      add: function (rec) { var it = Object.assign({ id: uid(key) }, rec); items.unshift(it); save(key, items); return it; },
      update: function (id, patch) { items = items.map(function (i) { return i.id === id ? Object.assign({}, i, patch) : i; }); save(key, items); return items.filter(function (i) { return i.id === id; })[0]; },
      remove: function (id) { items = items.filter(function (i) { return i.id !== id; }); save(key, items); },
      replace: function (next) { items = next.slice(); save(key, items); }
    };
  }

  // seed data ----------------------------------------------------------------
  var Tasks = Collection('tasks', [
    { id: 't_seed1', title: 'Δημοσίευση προγράμματος Ιουνίου', done: false, due: '12/6', assignee: 'Σοφία', priority: 'high', module: 'schedule' },
    { id: 't_seed2', title: 'Έλεγχος νυχτερινών βαρδιών', done: false, due: '10/6', assignee: 'Χριστίνα', priority: 'normal', module: 'warnings' },
    { id: 't_seed3', title: 'Έγκριση αιτημάτων άδειας', done: true, due: '8/6', assignee: 'Σοφία', priority: 'normal', module: 'requests' }
  ]);
  var Notes = Collection('notes', [
    { id: 'no_seed1', title: 'Κανόνας στελέχωσης Σαββατοκύριακου', body: 'Ελάχιστο 14 άτομα σε εργασία τα Σ/Κ λόγω αυξημένης κίνησης.', at: Date.now() - 86400000, pinned: true },
    { id: 'no_seed2', title: 'Προτιμήσεις προσωπικού', body: 'Η Μαρντογιάν προτιμά πρωινά. Ο Μπαμπατσής αποφεύγει νύχτες (ιατρικό).', at: Date.now() - 3600000, pinned: false }
  ]);
  var Files = Collection('files', []);
  var Forms = Collection('forms', [
    { id: 'fm_seed1', title: 'Αναφορά Συμβάντος Βάρδιας', desc: 'Κατέγραψε ένα συμβάν κατά τη διάρκεια της βάρδιας.', at: Date.now() - 86400000,
      fields: [
        { id: 'f1', type: 'text', label: 'Όνομα', required: true },
        { id: 'f2', type: 'date', label: 'Ημερομηνία', required: true },
        { id: 'f3', type: 'select', label: 'Σοβαρότητα', options: ['Χαμηλή', 'Μέτρια', 'Υψηλή'], required: true },
        { id: 'f4', type: 'textarea', label: 'Περιγραφή', required: false }
      ] }
  ]);
  var FormSubs = Collection('form_subs', []);

  // ---- reservations (dynamic operational load) ------------------------------
  // type: return | delivery | inspection | service ; dept: fleet | customer | station
  var Reservations = (function () {
    var coll = Collection('reservations', [
      { id: 'rv_s1', day: 12, type: 'delivery', dept: 'customer', customer: 'A. Nikolaou', vehicle: 'ABC-1234', note: '', status: 'confirmed', at: Date.now() - 7200000, by: 'Σοφία' },
      { id: 'rv_s2', day: 12, type: 'return', dept: 'fleet', customer: 'M. Papadaki', vehicle: 'XYZ-5678', note: '', status: 'confirmed', at: Date.now() - 6400000, by: 'Σοφία' },
      { id: 'rv_s3', day: 13, type: 'delivery', dept: 'customer', customer: 'G. Ioannou', vehicle: 'KLM-2211', note: 'VIP', status: 'confirmed', at: Date.now() - 5200000, by: 'Σοφία' },
      { id: 'rv_s4', day: 13, type: 'inspection', dept: 'fleet', customer: '—', vehicle: 'KLM-2211', note: '', status: 'pending', at: Date.now() - 5000000, by: 'Σοφία' },
      { id: 'rv_s5', day: 14, type: 'delivery', dept: 'customer', customer: 'D. Georgiou', vehicle: 'PPL-9090', note: '', status: 'confirmed', at: Date.now() - 4000000, by: 'Σοφία' }
    ]);
    function sig(r) { return [r.day, r.type, (r.vehicle || '').toUpperCase().trim(), (r.customer || '').toLowerCase().trim()].join('|'); }
    return {
      all: coll.all, get: coll.get, update: coll.update, remove: coll.remove,
      add: function (rec) { var it = coll.add(Object.assign({ status: 'confirmed', at: Date.now() }, rec)); Bus.emit('record.created', { type: 'reservation', id: it.id }); return it; },
      signature: sig,
      // returns {dupes:[], conflicts:[]} for a candidate list against existing
      analyze: function (candidates) {
        var existing = coll.all(); var seen = {}; existing.forEach(function (r) { seen[sig(r)] = r; });
        var dupes = [], conflicts = [], localSeen = {};
        candidates.forEach(function (c, i) {
          var s = sig(c);
          if (seen[s] || localSeen[s]) dupes.push(i);
          localSeen[s] = true;
          // conflict: same vehicle, same day, different type return+delivery
          existing.concat(candidates.slice(0, i)).forEach(function (r) {
            if (r.vehicle && c.vehicle && r.vehicle.toUpperCase() === c.vehicle.toUpperCase() && r.day === c.day && r.type !== c.type && conflicts.indexOf(i) < 0) conflicts.push(i);
          });
        });
        return { dupes: dupes, conflicts: conflicts };
      },
      importMany: function (list, by) {
        var n = 0; list.forEach(function (r) { coll.add(Object.assign({ status: 'confirmed', at: Date.now(), by: by || 'import' }, r)); n++; });
        Bus.emit('reservations.imported', { count: n }); return n;
      },
      byDay: function () { var m = {}; coll.all().forEach(function (r) { (m[r.day] = m[r.day] || []).push(r); }); return m; }
    };
  })();

  var Automations = Collection('automations', [
    { id: 'au_seed1', name: 'Ειδοποίηση για υποστελέχωση', trigger: 'understaffed', action: 'notify', enabled: true, runs: 0, last: null,
      desc: 'Όταν μια ημέρα πέφτει κάτω από το ελάχιστο, στείλε ειδοποίηση.' },
    { id: 'au_seed2', name: 'Σήμανση πολλών νυχτών', trigger: 'nights', action: 'notify', enabled: true, runs: 0, last: null,
      desc: 'Εντόπισε υπαλλήλους με >4 συνεχόμενες νύχτες και ειδοποίησε.' },
    { id: 'au_seed3', name: 'Ημερήσια σύνοψη κάλυψης', trigger: 'daily', action: 'report', enabled: false, runs: 0, last: null,
      desc: 'Κάθε πρωί στις 07:00 δημιούργησε σύνοψη κάλυψης.' }
  ]);
  var Chat = (function () {
    var key = 'chat';
    var seed = {
      'general': [
        { id: 'c1', who: 'Σοφία', role: 'owner', text: 'Καλημέρα! Το πρόγραμμα Ιουνίου είναι σχεδόν έτοιμο.', at: Date.now() - 7200000 },
        { id: 'c2', who: 'Χριστίνα', role: 'manager', text: 'Έλεγξα τις νύχτες, 2 προειδοποιήσεις απομένουν.', at: Date.now() - 5400000 }
      ],
      'schedule': [
        { id: 'c3', who: 'Μιχάλης', role: 'manager', text: 'Χρειαζόμαστε ένα ακόμη άτομο το Σάββατο 13/6.', at: Date.now() - 3600000 }
      ],
      'requests': []
    };
    var data = load(key, seed);
    return {
      channels: function () { return Object.keys(data); },
      get: function (ch) { return (data[ch] || []).slice(); },
      post: function (ch, msg) { (data[ch] = data[ch] || []).push(Object.assign({ id: uid('c'), at: Date.now() }, msg)); save(key, data); Bus.emit('chat.posted', { ch: ch, msg: msg }); },
      ensure: function (ch) { if (!data[ch]) { data[ch] = []; save(key, data); } }
    };
  })();

  // ---- settings -------------------------------------------------------------
  var Settings = (function () {
    var s = load('settings', { theme: 'light', lang: 'el', aiTone: 'concise', density: 'comfortable', disabledModules: [] });
    return {
      get: function () { return Object.assign({}, s); },
      set: function (patch) { s = Object.assign({}, s, patch); save('settings', s); Bus.emit('settings.changed', s); return s; }
    };
  })();

  // ---- favorites / pins -----------------------------------------------------
  var Favorites = (function () {
    var f = load('favorites', ['launcher', 'schedule', 'coverage', 'warnings', 'ai']);
    var recent = [];
    return {
      list: function () { return f.slice(); },
      toggle: function (id) { f = f.indexOf(id) >= 0 ? f.filter(function (x) { return x !== id; }) : f.concat([id]); save('favorites', f); return f.slice(); },
      has: function (id) { return f.indexOf(id) >= 0; },
      touch: function (id) { recent = [id].concat(recent.filter(function (x) { return x !== id; })).slice(0, 8); },
      recent: function () { return recent.slice(); }
    };
  })();

  // ---- AI bridge (real if window.claude.complete exists, else local) --------
  var AI = {
    available: function () { return !!(window.claude && window.claude.complete); },
    complete: async function (prompt) {
      if (window.claude && window.claude.complete) {
        try { return await window.claude.complete(prompt); } catch (e) { return null; }
      }
      return null;
    }
  };

  // ---- members & roles (seeded from the real roster; persisted) -------------
  function normalizeRole(r) {
    var s = String(r || '').toLowerCase().trim();
    if (/owner|ιδιοκτ/.test(s)) return 'owner';
    if (/manager|supervis|διαχειρ|προϊστ|επόπτ|υπεύθ/.test(s)) return 'manager';
    if (/view|προβολ|θεατ/.test(s)) return 'viewer';
    return 'employee';
  }
  var Members = (function () {
    function seed() {
      var emps = (window.APP_DATA && window.APP_DATA.employees) || [];
      // The ONLY supervisors, keyed by ΑΜΕ. Everyone else is an employee.
      // 6044 Ψιστάκης Μανώλης · 6069 Τζανιδάκη Κωνσταντίνα · 6021 Μαρντογιάν Λυδία
      var SUP = { '6044': 'coordinator', '6069': 'cs_supervisor', '6021': 'fleet_supervisor' };
      var list = [{ id: 'owner_sofia', name: 'Σοφία', first: 'Σοφία', email: 'sofia@programshift.gr', role: 'owner', dept: 'inspection', ame: '—', core: true }];
      emps.forEach(function (e) {
        list.push({ id: 'm_' + e.ame, name: e.name, first: e.first, surname: e.surname,
          email: (greeklish(e.first) || greeklish(e.surname) || ('staff' + e.ame)) + '@programshift.gr',
          role: SUP[e.ame] || 'employee',
          dept: ROLE_DEPT[SUP[e.ame]] || null, ame: e.ame });
      });
      return list;
    }
    var items = load('members', null);
    if (items == null || !items.length) { items = seed(); save('members', items); }
    // idempotent migration: the four named supervisors carry their roles even
    // on pre-existing localStorage data. A ONE-TIME correction (v2) also demotes
    // the two surnames wrongly seeded as 'manager' by an earlier build — guarded
    // by a flag so it never overrides a later MANUAL promotion.
    (function migrateSupervisors() {
      var SUP = { '6044': 'coordinator', '6069': 'cs_supervisor', '6021': 'fleet_supervisor' };
      var changed = false;
      items = items.map(function (m) {
        if (SUP[m.ame] && m.role !== SUP[m.ame] && (m.role === 'employee' || m.role === 'manager')) { changed = true; return Object.assign({}, m, { role: SUP[m.ame], dept: ROLE_DEPT[SUP[m.ame]] }); }
        return m;
      });
      if (!load('mig_sup_v2', false)) {
        items = items.map(function (m) {
          if (m.role === 'manager' && !SUP[m.ame] && (m.ame === '6400' || m.ame === '6537' || /ΔΕΣΔΕΝΑΚΗ|ΣΥΡΙΓΩΝΑΚΗΣ/.test(m.surname || ''))) { changed = true; return Object.assign({}, m, { role: 'employee', dept: null }); }
          return m;
        });
        save('mig_sup_v2', true);
      }
      if (changed) save('members', items);
    })();
    function persist() { save('members', items); }
    return {
      list: function () { return items.filter(function (m) { return !m.removed; }); },
      setRole: function (id, role) { items = items.map(function (m) { return m.id === id ? Object.assign({}, m, { role: role }) : m; }); persist(); Bus.emit('member.role_changed', { id: id, role: role }); },
      remove: function (id) { items = items.map(function (m) { return m.id === id ? Object.assign({}, m, { removed: true }) : m; }); persist(); Bus.emit('member.removed', { id: id }); },
      restore: function (rec) { var id = rec && rec.id; var found = false; items = items.map(function (m) { if (m.id === id) { found = true; return Object.assign({}, m, { removed: false }); } return m; }); if (!found && rec) items.push(Object.assign({}, rec, { removed: false })); persist(); Bus.emit('member.added', rec || {}); },
      add: function (rec) { var it = Object.assign({ id: uid('m'), role: 'employee', ame: '—' }, rec); items.push(it); persist(); Bus.emit('member.added', it); return it; },
      counts: function () { var c = {}; items.filter(function (m) { return !m.removed; }).forEach(function (m) { c[m.role] = (c[m.role] || 0) + 1; }); return c; },
      reseed: function () { items = seed(); save('members', items); },
      // upsert members + their pre-issued roles from an imported roster
      importRoster: function (emps) {
        var n = 0;
        (emps || []).forEach(function (e) {
          if (!e.ame) return;
          var id = 'm_' + e.ame;
          var existing = items.filter(function (m) { return m.id === id; })[0];
          var role = e.role ? normalizeRole(e.role) : (existing ? existing.role : 'employee');
          if (existing) { items = items.map(function (m) { return m.id === id ? Object.assign({}, m, { role: role, removed: false, name: e.name || m.name, email: e.email || m.email }) : m; }); }
          else { items.push({ id: id, name: e.name, first: e.first, surname: e.surname, email: e.email || (greeklish(e.first || e.surname) || ('staff' + e.ame)) + '@programshift.gr', role: role, ame: e.ame }); }
          n++;
        });
        persist(); Bus.emit('members.imported', { count: n }); return n;
      }
    };
  })();

  // ---- schedule visibility (publish / draft / windowed reveal) --------------
  var Visibility = (function () {
    var v = load('visibility', { '2026-06': { published: true, mode: 'all', from: 0, to: 29, days: [] } });
    function get(key) { return v[key] || { published: false, mode: 'all', from: 0, to: 6, days: [] }; }
    return {
      get: get,
      set: function (key, patch) { v[key] = Object.assign({}, get(key), patch); save('visibility', v); Bus.emit('visibility.changed', { key: key }); return v[key]; },
      // supervisors (owner/manager) always see everything; others see only released days
      canSee: function (key, dayIndex, role) {
        if (role === 'owner' || role === 'manager') return true;
        var s = get(key);
        if (!s.published) return false;
        if (s.mode === 'all') return true;
        if (s.mode === 'window') return dayIndex >= s.from && dayIndex <= s.to;
        if (s.mode === 'days') return s.days.indexOf(dayIndex) >= 0;
        return false;
      }
    };
  })();

  // ---- auth / session (members directory = user directory) -----------------
  // Recognize the four named supervisors by username (Greek or Latin).
  function recognizeSupervisor(name, email) {
    var s = (String(name || '') + ' ' + String(email || '')).toLowerCase().replace(/ς/g, 'σ').replace(/[\u0300-\u036f]/g, '');
    if (/sofia|σοφια/.test(s)) return { role: 'owner', dept: 'inspection' };
    if (/psistak|ψιστακ|manolis.*psis|μανωλη.*ψιστ/.test(s)) return { role: 'coordinator', dept: 'station' };
    if (/tzanidak|τζανιδακ|konstantina.*tzani|κωνσταντινα.*τζαν/.test(s)) return { role: 'cs_supervisor', dept: 'customer' };
    if (/mardogian|μαρντογιαν|lidia.*mard|λυδια.*μαρντ/.test(s)) return { role: 'fleet_supervisor', dept: 'fleet' };
    return null;
  }

  var Auth = (function () {
    var session = load('session', null);
    var creds = load('creds', {});        // email(lower) -> password (saved for instant login)
    var saved = load('savedlogins', []);  // [{email,name,role}] for the "saved accounts" picker
    function find(email) { return Members.list().filter(function (m) { return (m.email || '').toLowerCase() === String(email || '').toLowerCase(); })[0]; }
    function rememberCred(email, password, m) {
      var k = String(email || '').toLowerCase();
      if (password) creds[k] = password; save('creds', creds);
      if (saved.filter(function (s) { return s.email.toLowerCase() === k; }).length === 0) { saved.unshift({ email: m.email, name: m.name, role: m.role }); saved = saved.slice(0, 8); save('savedlogins', saved); }
    }
    function begin(m) { session = { id: m.id, name: m.name, email: m.email, role: m.role }; save('session', session); Bus.emit('user.logged_in', session); Audit.add({ action: 'user.login', target: m.name, role: m.role, module: 'auth' }); return session; }
    return {
      current: function () { return session; },
      find: find,
      savedLogins: function () { return saved.slice(); },
      hasCred: function (email) { return !!creds[String(email || '').toLowerCase()]; },
      forget: function (email) { var k = String(email || '').toLowerCase(); delete creds[k]; saved = saved.filter(function (s) { return s.email.toLowerCase() !== k; }); save('creds', creds); save('savedlogins', saved); },
      // login(email, password, remember). If the account has no stored password yet, the first
      // password provided is set. If it has one, it must match. remember=save for instant login.
      login: function (email, password, remember) {
        var m = find(email); if (!m) return { error: 'no_account' };
        var k = String(email).toLowerCase();
        if (creds[k]) { if (password != null && password !== '' && password !== creds[k]) return { error: 'bad_password' }; }
        else if (password) { creds[k] = password; save('creds', creds); }
        if (remember) rememberCred(email, password, m);
        return begin(m);
      },
      // instant login from a saved account (password already stored)
      instant: function (email) { var m = find(email); if (!m) return { error: 'no_account' }; Audit.add({ action: 'user.instant_login', target: m.name, role: m.role, module: 'auth' }); return begin(m); },
      loginAs: function (m) { return begin(m); },
      signup: function (name, email, password, remember) {
        var existing = find(email); if (existing) { return this.login(existing.email, password, remember); }
        var recognized = recognizeSupervisor(name, email);
        var role = recognized ? recognized.role : 'employee';
        var m = Members.add({ name: name, first: (name || '').split(' ')[0], email: email, role: role, dept: recognized ? recognized.dept : null });
        if (password) { creds[String(email).toLowerCase()] = password; save('creds', creds); }
        if (remember) rememberCred(email, password, m);
        session = { id: m.id, name: m.name, email: m.email, role: role }; save('session', session);
        Bus.emit('user.logged_in', session); Audit.add({ action: recognized ? 'user.signup.supervisor' : 'user.signup', target: name + (recognized ? ' → ' + role : ''), role: role, module: 'auth' }); return session;
      },
      logout: function () { Audit.add({ action: 'user.logout', role: session && session.role, module: 'auth' }); session = null; save('session', null); Bus.emit('user.logged_out', {}); }
    };
  })();

  window.OS = {
    uid: uid, timeAgo: timeAgo, load: load, save: save, greeklish: greeklish,
    roleTier: function (r) { return ROLE_TIER[r] || r || 'employee'; },
    roleDept: function (r) { return ROLE_DEPT[r] || null; },
    isSupervisor: function (r) { var t = ROLE_TIER[r] || r; return t === 'owner' || t === 'manager'; },
    recognizeSupervisor: recognizeSupervisor,
    norm: function (s) { return String(s || '').toLowerCase().replace(/ς/g, 'σ').replace(/[\u0300-\u036f]/g, ''); },
    Bus: Bus, Perms: Perms, Notify: Notify, Audit: Audit, Memory: Memory,
    Tasks: Tasks, Notes: Notes, Automations: Automations, Chat: Chat,
    Settings: Settings, Favorites: Favorites, Members: Members, Visibility: Visibility, Auth: Auth,
    Files: Files, Forms: Forms, FormSubs: FormSubs, Reservations: Reservations, AI: AI
  };
})();
