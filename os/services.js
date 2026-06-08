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
    can: function (role, action) { var a = PERM[action]; return !a ? true : a.indexOf(role) >= 0; },
    matrix: PERM
  };

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
      var mgr = ['ΔΕΣΔΕΝΑΚΗ', 'ΣΥΡΙΓΩΝΑΚΗΣ'];
      var list = [{ id: 'owner_sofia', name: 'Σοφία', first: 'Σοφία', email: 'sofia@programshift.gr', role: 'owner', ame: '—', core: true }];
      emps.forEach(function (e) {
        list.push({ id: 'm_' + e.ame, name: e.name, first: e.first, surname: e.surname,
          email: (greeklish(e.first) || greeklish(e.surname) || ('staff' + e.ame)) + '@programshift.gr',
          role: mgr.indexOf(e.surname) >= 0 ? 'manager' : 'employee', ame: e.ame });
      });
      return list;
    }
    var items = load('members', null);
    if (items == null || !items.length) { items = seed(); save('members', items); }
    function persist() { save('members', items); }
    return {
      list: function () { return items.filter(function (m) { return !m.removed; }); },
      setRole: function (id, role) { items = items.map(function (m) { return m.id === id ? Object.assign({}, m, { role: role }) : m; }); persist(); Bus.emit('member.role_changed', { id: id, role: role }); },
      remove: function (id) { items = items.map(function (m) { return m.id === id ? Object.assign({}, m, { removed: true }) : m; }); persist(); Bus.emit('member.removed', { id: id }); },
      add: function (rec) { var it = Object.assign({ id: uid('m'), role: 'employee', ame: '—' }, rec); items.push(it); persist(); Bus.emit('member.added', it); return it; },
      counts: function () { var c = { owner: 0, manager: 0, employee: 0, viewer: 0 }; items.filter(function (m) { return !m.removed; }).forEach(function (m) { c[m.role] = (c[m.role] || 0) + 1; }); return c; },
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
  var Auth = (function () {
    var session = load('session', null);
    function find(email) { return Members.list().filter(function (m) { return (m.email || '').toLowerCase() === String(email || '').toLowerCase(); })[0]; }
    return {
      current: function () { return session; },
      find: find,
      login: function (email) { var m = find(email); if (!m) return null; session = { id: m.id, name: m.name, email: m.email, role: m.role }; save('session', session); Bus.emit('user.logged_in', session); Audit.add({ action: 'user.login', target: m.name, role: m.role, module: 'auth' }); return session; },
      loginAs: function (m) { session = { id: m.id, name: m.name, email: m.email, role: m.role }; save('session', session); Bus.emit('user.logged_in', session); Audit.add({ action: 'user.login', target: m.name, role: m.role, module: 'auth' }); return session; },
      signup: function (name, email) {
        var existing = find(email); if (existing) { return this.login(existing.email); }
        var m = Members.add({ name: name, first: (name || '').split(' ')[0], email: email, role: 'employee' });
        session = { id: m.id, name: m.name, email: m.email, role: 'employee' }; save('session', session);
        Bus.emit('user.logged_in', session); Audit.add({ action: 'user.signup', target: name, role: 'employee', module: 'auth' }); return session;
      },
      logout: function () { Audit.add({ action: 'user.logout', role: session && session.role, module: 'auth' }); session = null; save('session', null); Bus.emit('user.logged_out', {}); }
    };
  })();

  window.OS = {
    uid: uid, timeAgo: timeAgo, load: load, save: save, greeklish: greeklish,
    norm: function (s) { return String(s || '').toLowerCase().replace(/ς/g, 'σ').replace(/[\u0300-\u036f]/g, ''); },
    Bus: Bus, Perms: Perms, Notify: Notify, Audit: Audit, Memory: Memory,
    Tasks: Tasks, Notes: Notes, Automations: Automations, Chat: Chat,
    Settings: Settings, Favorites: Favorites, Members: Members, Visibility: Visibility, Auth: Auth,
    Files: Files, Forms: Forms, FormSubs: FormSubs, AI: AI
  };
})();
