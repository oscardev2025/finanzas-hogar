window.App = window.App || {};
App.views = App.views || {};

App.views.ingresosFijos = (function () {
  const { fmt, toast } = App.utils;

  let editId = null;
  let bound = false;

  function rowVista(r) {
    const numOvr = Object.keys(App.state.overrides?.ingresosFijos?.[r.id] || {}).length;
    const ovrBadge = numOvr > 0
      ? `<span class="inline-flex items-center gap-1 ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">${numOvr}</span>`
      : '';
    const vigLbl = App.utils.vigenciaLabel(r);
    const vigBadge = vigLbl
      ? `<div class="text-[10px] text-slate-500 mt-0.5">📅 ${vigLbl}</div>`
      : '';
    return `
      <tr class="border-t border-slate-100 hover:bg-slate-50">
        ${App.bulk.checkboxCell('ingresosFijos', r.id)}
        <td class="px-4 py-3">${r.concepto}${vigBadge}</td>
        <td class="px-4 py-3 text-right font-semibold text-emerald-600">+${fmt(r.monto)}</td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <button data-ovr-ifij="${r.id}" class="text-amber-600 hover:text-amber-700 text-xs mr-3">Por mes${ovrBadge}</button>
          <button data-edit-ifij="${r.id}" class="text-brand-600 hover:text-brand-700 text-xs mr-3">Editar</button>
          ${App.bulk.rowDuplicarBtn('ingresosFijos', r.id)}
          <button data-del="ingresosFijos" data-id="${r.id}" class="text-rose-500 hover:text-rose-700 text-xs">Eliminar</button>
        </td>
      </tr>`;
  }

  function rowEdicion(r) {
    return `
      <tr class="border-t border-slate-100 bg-brand-50/40" data-edit-row="${r.id}">
        ${App.bulk.emptyCell()}
        <td class="px-4 py-2">
          <input type="text" name="concepto" value="${r.concepto.replace(/"/g, '&quot;')}" class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
        </td>
        <td class="px-4 py-2">
          <input type="number" step="0.01" name="monto" value="${r.monto}" class="w-full text-right border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
        </td>
        <td class="px-4 py-2 text-right whitespace-nowrap">
          <button data-save-ifij="${r.id}" class="text-emerald-600 hover:text-emerald-700 text-xs font-medium mr-3">Guardar</button>
          <button data-cancel-ifij="1" class="text-slate-500 hover:text-slate-700 text-xs">Cancelar</button>
        </td>
      </tr>`;
  }

  function bindAcciones() {
    if (bound) return;
    bound = true;
    const tbody = document.getElementById('tablaIngresosFijos');

    tbody.addEventListener('click', e => {
      const ovr = e.target.closest('[data-ovr-ifij]')?.dataset.ovrIfij;
      if (ovr) { App.overrides.open('ingresosFijos', ovr); return; }

      const editar = e.target.dataset.editIfij;
      if (editar) { editId = editar; render(); return; }
      if (e.target.dataset.cancelIfij) { editId = null; render(); return; }

      const guardar = e.target.dataset.saveIfij;
      if (guardar) {
        const fila = tbody.querySelector(`[data-edit-row="${guardar}"]`);
        const concepto = fila.querySelector('input[name="concepto"]').value.trim();
        const monto = parseFloat(fila.querySelector('input[name="monto"]').value);
        if (!concepto || isNaN(monto)) { toast('Datos inválidos'); return; }
        const it = App.state.ingresosFijos.find(x => x.id === guardar);
        if (it) { it.concepto = concepto; it.monto = monto; App.store.save(); }
        editId = null; App.render(); toast('Ingreso fijo actualizado');
      }
    });
  }

  function render() {
    const rows = App.state.ingresosFijos || [];
    document.getElementById('tablaIngresosFijos').innerHTML = rows.length
      ? rows.map(r => r.id === editId ? rowEdicion(r) : rowVista(r)).join('')
      : `<tr><td colspan="4" class="text-center py-8 text-slate-400 text-sm">Sin ingresos fijos</td></tr>`;
    document.getElementById('bulkBar-ingresosFijos').innerHTML = App.bulk.barHTML('ingresosFijos');
    App.bulk.syncSelectAll('ingresosFijos');
    bindAcciones();
  }

  return { render };
})();
