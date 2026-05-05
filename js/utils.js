window.App = window.App || {};

App.utils = (function () {
  function uid() { return Math.random().toString(36).slice(2, 10); }

  function fmt(n) {
    const abs = Math.abs(Number(n) || 0);
    return App.state.moneda + abs.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function fmtSign(n) {
    const v = Number(n) || 0;
    return (v < 0 ? '-' : '') + fmt(v);
  }

  function ymKey(d) {
    const dt = (d instanceof Date) ? d : new Date(d);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
  }

  function ymLabel(key) {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }

  function getCategoria(id) {
    return App.state.categorias.find(c => c.id === id) || { nombre: '—', color: '#94a3b8' };
  }

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 2000);
  }

  function setToday(form) {
    const fecha = form.querySelector('input[name="fecha"]');
    if (fecha && !fecha.value) fecha.value = new Date().toISOString().slice(0, 10);
  }

  return { uid, fmt, fmtSign, ymKey, ymLabel, getCategoria, toast, setToday };
})();
