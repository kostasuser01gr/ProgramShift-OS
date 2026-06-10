/* Authenticated startup for the static Program Shift OS. */
(function () {
  function showError(message) {
    var root = document.getElementById('root');
    root.innerHTML = '<div class="boot"><div class="d">!</div><div id="boot-error-message" style="max-width:520px;text-align:center"></div><button id="retry-boot" class="os-btn">Retry</button></div>';
    document.getElementById('boot-error-message').textContent = message;
    document.getElementById('retry-boot').addEventListener('click', function () { window.location.reload(); });
  }

  async function json(url, options) {
    var response = await fetch(url, Object.assign({ credentials: 'same-origin', cache: 'no-store' }, options || {}));
    if (response.status === 401) {
      window.location.assign('/auth');
      throw new Error('Authentication required.');
    }
    var body = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(body.error || ('Request failed with HTTP ' + response.status + '.'));
    return body;
  }

  function waitForApp(timeoutMs) {
    return new Promise(function (resolve, reject) {
      var started = Date.now();
      function check() {
        if (typeof window.OSRoot === 'function') {
          resolve();
          return;
        }
        if (Date.now() - started >= timeoutMs) {
          reject(new Error('Application modules did not finish loading.'));
          return;
        }
        window.setTimeout(check, 50);
      }
      check();
    });
  }

  window.ProgramShiftAPI = {
    updateCell: function (mutation) {
      return json('/api/cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutation)
      });
    },
    signOut: async function () {
      var csrf = await json('/api/auth/csrf');
      var response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Auth-Return-Redirect': '1'
        },
        body: new URLSearchParams({ csrfToken: csrf.csrfToken, callbackUrl: '/' }).toString()
      });
      var body = await response.json().catch(function () { return {}; });
      window.location.assign(body.url || '/');
    }
  };

  window.addEventListener('load', async function () {
    try {
      var session = await json('/api/auth/session');
      if (!session.user || !session.user.email) {
        window.location.assign('/auth');
        return;
      }
      var payload = await json('/api/schedule');
      window.createAppData(payload);
      window.OS.Auth.setExternal({
        id: session.user.email,
        name: session.user.name || session.user.email,
        email: session.user.email,
        role: session.role || 'employee',
        image: session.user.image || null
      });
      await waitForApp(15000);
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(window.OSRoot));
    } catch (error) {
      if (error.message !== 'Authentication required.') showError('Program Shift could not load: ' + error.message);
    }
  });
})();
