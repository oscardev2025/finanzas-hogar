window.App = window.App || {};
App.views = App.views || {};

App.views.ajustes = (function () {
  function renderCategorias() {
    document.getElementById('listaCategorias').innerHTML = App.state.categorias.map(c => `
      <div class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded" style="background:${c.color}"></span>
          <span class="text-sm">${c.nombre}</span>
        </div>
        <button data-delcat="${c.id}" class="text-rose-500 hover:text-rose-700 text-xs">Eliminar</button>
      </div>`).join('');
  }

  function renderCatSelects() {
    const opts = App.state.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    document.querySelectorAll('.cat-select').forEach(s => {
      const prev = s.value;
      s.innerHTML = opts;
      if (prev) s.value = prev;
    });
  }

  function renderPreferencias() {
    document.getElementById('inputMoneda').value = App.state.moneda;
  }

  function renderSync() {
    const cont = document.getElementById('syncStatus');
    if (!cont) return;
    cont.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
        <p class="text-sm text-slate-700">Conectado al servidor. Cada cambio se guarda en la nube automáticamente.</p>
      </div>
      <p class="text-xs text-slate-500 mt-2">Si necesitas un respaldo local, usa <strong>Exportar datos</strong> en la barra lateral.</p>`;
  }

  function render() {
    renderCategorias();
    renderCatSelects();
    renderPreferencias();
    renderSync();
  }

  return { render };
})();
