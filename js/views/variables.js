window.App = window.App || {};
App.views = App.views || {};

App.views.variables = (function () {
  const { fmt, getCategoria, toast } = App.utils;
  const filters = App.views._filters;

  let editId = null;
  let bound = false;
  const state = { categoria: '', sort: 'fecha-desc' };

  function rowVista(r) {
    const c = getCategoria(r.categoria);
    return `
      <tr class="border-t border-slate-100 hover:bg-slate-50">
        ${App.bulk.checkboxCell('variables', r.id)}
        <td class="px-4 py-3">${new Date(r.fecha).toLocaleDateString('es-MX')}</td>
        <td class="px-4 py-3">${r.concepto}</td>
        <td class="px-4 py-3"><span class="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full" style="background:${c.color}20;color:${c.color}">● ${c.nombre}</span></td>
        <td class="px-4 py-3 text-right font-semibold text-rose-600">${fmt(r.monto)}</td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <button data-edit-var="${r.id}" class="text-brand-600 hover:text-brand-700 text-xs mr-3">Editar</button>
          ${App.bulk.rowDuplicarBtn('variables', r.id)}
          <button data-del="variables" data-id="${r.id}" class="text-rose-500 hover:text-rose-700 text-xs">Eliminar</button>
        </td>
      </tr>`;
  }

  function rowEdicion(r) {
    const opts = App.state.categorias.map(c =>
      `<option value="${c.id}" ${c.id === r.categoria ? 'selected' : ''}>${c.nombre}</option>`
    ).join('');
    return `
      <tr class="border-t border-slate-100 bg-brand-50/40" data-edit-row="${r.id}">
        ${App.bulk.emptyCell()}
        <td class="px-4 py-2">
          <input type="date" name="fecha" value="${r.fecha}" class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
        </td>
        <td class="px-4 py-2">
          <input type="text" name="concepto" value="${r.concepto.replace(/"/g, '&quot;')}" class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
        </td>
        <td class="px-4 py-2">
          <select name="categoria" class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm">${opts}</select>
        </td>
        <td class="px-4 py-2">
          <input type="number" step="0.01" name="monto" value="${r.monto}" class="w-full text-right border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
        </td>
        <td class="px-4 py-2 text-right whitespace-nowrap">
          <button data-save-var="${r.id}" class="text-emerald-600 hover:text-emerald-700 text-xs font-medium mr-3">Guardar</button>
          <button data-cancel-var="1" class="text-slate-500 hover:text-slate-700 text-xs">Cancelar</button>
        </td>
      </tr>`;
  }

  function bindAcciones() {
    if (bound) return;
    bound = true;
    const tbody = document.getElementById('tablaVariables');

    tbody.addEventListener('click', e => {
      const editar = e.target.dataset.editVar;
      if (editar) { editId = editar; render(); return; }
      if (e.target.dataset.cancelVar) { editId = null; render(); return; }

      const guardar = e.target.dataset.saveVar;
      if (guardar) {
        const fila = tbody.querySelector(`[data-edit-row="${guardar}"]`);
        const fecha = fila.querySelector('input[name="fecha"]').value;
        const concepto = fila.querySelector('input[name="concepto"]').value.trim();
        const categoria = fila.querySelector('select[name="categoria"]').value;
        const monto = parseFloat(fila.querySelector('input[name="monto"]').value);
        if (!fecha || !concepto || !categoria || isNaN(monto)) { toast('Datos inválidos'); return; }
        const it = App.state.variables.find(x => x.id === guardar);
        if (it) { it.fecha = fecha; it.concepto = concepto; it.categoria = categoria; it.monto = monto; App.store.save(); }
        editId = null; App.render(); toast('Gasto actualizado');
      }
    });
  }

  function setCategoria(v) { state.categoria = v; App.render(); }
  function setSort(v)      { state.sort = v;      App.render(); }
  function reset()         { state.categoria = ''; state.sort = 'fecha-desc'; App.render(); }

  function render() {
    const all = App.state.variables;
    const rows = filters.apply(all, state, true);

    document.getElementById('filterBar-variables').innerHTML = filters.toolbarHTML('variables', state, true);

    document.getElementById('tablaVariables').innerHTML = rows.length
      ? rows.map(r => r.id === editId ? rowEdicion(r) : rowVista(r)).join('')
      : `<tr><td colspan="6" class="text-center py-8 text-slate-400 text-sm">${all.length ? 'Sin resultados con este filtro' : 'Sin gastos variables'}</td></tr>`;

    document.getElementById('totalsBar-variables').innerHTML = filters.totalsHTML(rows, all, 'Total mostrado');
    document.getElementById('bulkBar-variables').innerHTML = App.bulk.barHTML('variables');
    App.bulk.setVisible('variables', rows.map(r => r.id));
    App.bulk.syncSelectAll('variables');
    bindAcciones();

    if (typeof App.views.variables.updateHint === 'function') App.views.variables.updateHint();
  }

  return { render, setCategoria, setSort, reset };
})();
