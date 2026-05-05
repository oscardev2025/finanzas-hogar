window.App = window.App || {};

App.store = (function () {
  const KEY = App.config.STORAGE_KEY;

  let writeTimer = null;
  let writing = false;
  let pending = false;

  function loadCache() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(App.config.defaultState);
      const parsed = JSON.parse(raw);
      return { ...structuredClone(App.config.defaultState), ...parsed };
    } catch {
      return structuredClone(App.config.defaultState);
    }
  }

  function saveCache() {
    try { localStorage.setItem(KEY, JSON.stringify(App.state)); } catch {}
  }

  function setStatus(state) {
    const dot = document.getElementById('syncDot');
    const lbl = document.getElementById('syncLabel');
    if (!dot || !lbl) return;
    const map = {
      idle:    ['bg-emerald-500', 'Sincronizado'],
      saving:  ['bg-amber-400 animate-pulse', 'Guardando…'],
      offline: ['bg-rose-500', 'Sin conexión'],
      loading: ['bg-slate-400 animate-pulse', 'Cargando…']
    };
    const [cls, txt] = map[state] || map.idle;
    dot.className = 'w-2 h-2 rounded-full ' + cls;
    lbl.textContent = txt;
  }

  async function loadFromServer() {
    setStatus('loading');
    try {
      const res = await fetch('/api/data', { credentials: 'same-origin' });
      if (res.status === 401) { setStatus('offline'); return { ok: false, unauthorized: true }; }
      if (!res.ok) { setStatus('offline'); return { ok: false }; }
      const { state } = await res.json();
      if (state) {
        App.state = { ...structuredClone(App.config.defaultState), ...state };
        saveCache();
      }
      setStatus('idle');
      return { ok: true };
    } catch {
      setStatus('offline');
      return { ok: false };
    }
  }

  function save() {
    saveCache();
    setStatus('saving');
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(flush, 600);
  }

  async function flush() {
    if (writing) { pending = true; return; }
    writing = true;
    try {
      const res = await fetch('/api/data', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(App.state)
      });
      if (res.status === 401) {
        setStatus('offline');
        App.auth?.show();
        return;
      }
      if (!res.ok) throw new Error('save-failed');
      setStatus('idle');
    } catch {
      setStatus('offline');
      // reintento suave a los 5s
      setTimeout(() => { if (!writing) save(); }, 5000);
    } finally {
      writing = false;
      if (pending) { pending = false; save(); }
    }
  }

  function reset() {
    App.state = structuredClone(App.config.defaultState);
    saveCache();
    save();
  }

  function replace(data) {
    App.state = { ...structuredClone(App.config.defaultState), ...data };
    saveCache();
    save();
  }

  return { loadCache, loadFromServer, save, reset, replace, setStatus };
})();

App.state = App.store.loadCache();
