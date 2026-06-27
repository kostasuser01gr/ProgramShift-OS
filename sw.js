/* Program Shift OS — service worker.
   NETWORK-FIRST for app code (so updates always reach users), with cache as an
   offline fallback. Cache-first would pin stale code until a manual version bump. */
var CACHE = 'program-shift-os-v4';
var SHELL = [
  './',
  './index.html',
  './app/styles.css', './os/os.css',
  './app/data.js', './app/i18n.js', './os/services.js',
  './app/ios-frame.jsx', './app/ui.jsx', './app/owner.jsx', './app/employee.jsx', './app/manager.jsx',
  './os/modules.jsx', './os/modules2.jsx', './os/modules3.jsx', './os/modules4.jsx', './os/modules5.jsx', './os/modules6.jsx', './os/help.jsx', './os/ai-agent.jsx', './os/auth.jsx', './os/shell.jsx', './os/root.jsx',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function () { /* tolerate partial */ }); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  // Network-first: always try the live file, fall back to cache only when offline.
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { try { c.put(e.request, copy); } catch (x) { } });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) { return hit || caches.match('./index.html'); });
    })
  );
});
