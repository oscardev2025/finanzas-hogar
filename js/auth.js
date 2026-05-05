window.App = window.App || {};

App.auth = (function () {
  const overlay = () => document.getElementById('loginOverlay');
  const form = () => document.getElementById('loginForm');
  const errorEl = () => document.getElementById('loginError');
  const userInput = () => document.getElementById('loginUser');
  const passInput = () => document.getElementById('loginPass');
  const submitBtn = () => form()?.querySelector('button[type="submit"]');

  function show() {
    const ov = overlay();
    if (!ov) return;
    ov.classList.remove('hidden');
    setTimeout(() => userInput()?.focus(), 50);
  }
  function hide() { overlay()?.classList.add('hidden'); }

  function setError(msg) {
    const e = errorEl();
    if (!e) return;
    e.textContent = msg || '';
    e.classList.toggle('hidden', !msg);
  }

  function setLoading(loading) {
    const b = submitBtn();
    if (!b) return;
    b.disabled = loading;
    b.textContent = loading ? 'Entrando…' : 'Entrar';
  }

  async function check() {
    try {
      const res = await fetch('/api/session', { credentials: 'same-origin' });
      if (!res.ok) return false;
      const data = await res.json();
      return !!data.authenticated;
    } catch {
      return false;
    }
  }

  async function login(user, pass) {
    const res = await fetch('/api/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass })
    });
    return res.ok;
  }

  async function logout() {
    try { await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }); } catch {}
    location.reload();
  }

  function bindForm(onSuccess) {
    const f = form();
    if (!f) return;
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
        const ok = await login(userInput().value.trim(), passInput().value);
        if (!ok) { setError('Usuario o contraseña incorrectos.'); return; }
        passInput().value = '';
        hide();
        await onSuccess();
      } catch {
        setError('No se pudo conectar. Reintenta.');
      } finally {
        setLoading(false);
      }
    });
  }

  return { check, login, logout, show, hide, bindForm };
})();
