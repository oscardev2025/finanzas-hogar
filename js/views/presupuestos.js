window.App = window.App || {};
App.views = App.views || {};

App.views.presupuestos = (function () {
  const { fmt, getCategoria, ymLabel, ymKey } = App.utils;
  const { estadoPresupuesto } = App.calc;

  const expandidos = new Set();

  function gastosDePresupuesto(p) {
    const fijos = App.state.fijos
      .filter(f => f.categoria === p.categoria)
      .map(f => ({ id: f.id, fecha: null, concepto: f.concepto, monto: Number(f.monto), origen: 'fijo' }));
    const variables = App.state.variables
      .filter(v => v.categoria === p.categoria && ymKey(v.fecha) === p.mes)
      .map(v => ({ id: v.id, fecha: v.fecha, concepto: v.concepto, monto: Number(v.monto), origen: 'variable' }));
    return [...fijos, ...variables].sort((a, b) => {
      if (!a.fecha) return -1;
      if (!b.fecha) return 1;
      return new Date(b.fecha) - new Date(a.fecha);
    });
  }

  function renderDetalle(p) {
    const items = gastosDePresupuesto(p);
    if (!items.length) {
      return `<p class="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">Aún no hay gastos en esta categoría este mes.</p>`;
    }
    const filas = items.map(g => {
      const fechaTxt = g.fecha
        ? new Date(g.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
        : 'Mensual';
      const tag = g.origen === 'fijo'
        ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Fijo</span>'
        : '<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">Variable</span>';
      return `
        <div class="flex items-center justify-between py-1.5 text-xs">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-slate-400 w-14 shrink-0">${fechaTxt}</span>
            ${tag}
            <span class="text-slate-700 truncate">${g.concepto}</span>
          </div>
          <span class="font-semibold text-rose-600 shrink-0">- ${fmt(g.monto)}</span>
        </div>`;
    }).join('');
    return `
      <div class="mt-3 pt-3 border-t border-slate-100">
        <p class="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Descuentos del presupuesto</p>
        ${filas}
      </div>`;
  }

  function renderResumen() {
    const month = App.nav.currentMonth;
    const lista = App.state.presupuestos.filter(p => p.mes === month);

    const cont = document.getElementById('listaPresupuestos');
    if (!lista.length) {
      cont.innerHTML = `<p class="text-sm text-slate-400 text-center py-8">Sin presupuestos para ${ymLabel(month)}.</p>`;
      return;
    }

    cont.innerHTML = lista.map(p => {
      const c = getCategoria(p.categoria);
      const { gastado, restante, pct, excedido } = estadoPresupuesto(p);
      const barColor = excedido ? '#ef4444' : (pct >= 80 ? '#f59e0b' : c.color);
      const restanteColor = excedido ? 'text-rose-600' : 'text-emerald-600';
      const restanteLabel = excedido
        ? `Excedido ${fmt(Math.abs(restante))}`
        : `Restante ${fmt(restante)}`;
      const abierto = expandidos.has(p.id);
      return `
        <div class="border border-slate-200 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" style="background:${c.color}"></span>
              <span class="font-medium text-slate-800">${c.nombre}</span>
            </div>
            <div class="flex items-center gap-3">
              <button data-toggle-pres="${p.id}" class="text-brand-600 hover:text-brand-700 text-xs font-medium">
                ${abierto ? 'Ocultar detalle' : 'Ver detalle'}
              </button>
              <button data-del="presupuestos" data-id="${p.id}" class="text-rose-500 hover:text-rose-700 text-xs">Eliminar</button>
            </div>
          </div>
          <div class="flex justify-between text-xs text-slate-500 mb-1">
            <span>Gastado ${fmt(gastado)} de ${fmt(p.monto)}</span>
            <span class="${restanteColor} font-semibold">${restanteLabel}</span>
          </div>
          <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all" style="width:${Math.min(100, pct)}%; background:${barColor}"></div>
          </div>
          <p class="text-xs text-slate-400 mt-1">${pct}% utilizado</p>
          ${abierto ? renderDetalle(p) : ''}
        </div>`;
    }).join('');
  }

  function bindToggle() {
    const cont = document.getElementById('listaPresupuestos');
    if (cont._toggleBound) return;
    cont._toggleBound = true;
    cont.addEventListener('click', e => {
      const id = e.target.dataset.togglePres;
      if (!id) return;
      if (expandidos.has(id)) expandidos.delete(id);
      else expandidos.add(id);
      renderResumen();
    });
  }

  function renderSelectores() {
    const opts = App.state.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    const sel = document.querySelector('#formPresupuesto select[name="categoria"]');
    if (sel) {
      const prev = sel.value;
      sel.innerHTML = opts;
      if (prev) sel.value = prev;
    }
    const inputMes = document.querySelector('#formPresupuesto input[name="mes"]');
    if (inputMes && !inputMes.value) inputMes.value = App.nav.currentMonth;
  }

  function render() {
    renderSelectores();
    renderResumen();
    bindToggle();
  }

  return { render };
})();
