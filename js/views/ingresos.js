window.App = window.App || {};
App.views = App.views || {};

App.views.ingresos = (function () {
  const { fmt, toast } = App.utils;

  let editId = null;
  let bound = false;

  function rowVista(r) {
    return `
      <tr class="border-t border-slate-100 hover:bg-slate-50">
        ${App.bulk.checkboxCell('ingresos', r.id)}
        <td class="px-4 py-3">${new Date(r.fecha).toLocaleDateString('es-MX')}</td>
        <td class="px-4 py-3">${r.concepto}</td>
        <td class="px-4 py-3 text-right font-semibold text-emerald-600">+${fmt(r.monto)}</td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <button data-edit-ing="${r.id}" class="text-brand-600 hover:text-brand-700 text-xs mr-3">Editar</button>
          ${App.bulk.rowDuplicarBtn('ingresos', r.id)}
          <button data-del="ingresos" data-id="${r.id}" class="text-rose-500 hover:text-rose-700 text-xs">Eliminar</button>
        </td>
      </tr>`;
  }

  function rowEdicion(r) {
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
          <input type="number" step="0.01" name="monto" value="${r.monto}" class="w-full text-right border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
        </td>
        <td class="px-4 py-2 text-right whitespace-nowrap">
          <button data-save-ing="${r.id}" class="text-emerald-600 hover:text-emerald-700 text-xs font-medium mr-3">Guardar</button>
          <button data-cancel-ing="1" class="text-slate-500 hover:text-slate-700 text-xs">Cancelar</button>
        </td>
      </tr>`;
  }

  function bindAcciones() {
    if (bound) return;
    bound = true;
    const tbody = document.getElementById('tablaIngresos');

    tbody.addEventListener('click', e => {
      const editar = e.target.dataset.editIng;
      if (editar) { editId = editar; render(); return; }

      if (e.target.dataset.cancelIng) { editId = null; render(); return; }

      const guardar = e.target.dataset.saveIng;
      if (guardar) {
        const fila = tbody.querySelector(`[data-edit-row="${guardar}"]`);
        const fecha = fila.querySelector('input[name="fecha"]').value;
        const concepto = fila.querySelector('input[name="concepto"]').value.trim();
        const monto = parseFloat(fila.querySelector('input[name="monto"]').value);
        if (!fecha || !concepto || isNaN(monto)) {
          toast('Datos inválidos');
          return;
        }
        const ing = App.state.ingresos.find(x => x.id === guardar);
        if (ing) {
          ing.fecha = fecha;
          ing.concepto = concepto;
          ing.monto = monto;
          App.store.save();
        }
        editId = null;
        App.render();
        toast('Ingreso actualizado');
      }
    });
  }

  function render() {
    const rows = [...App.state.ingresos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    document.getElementById('tablaIngresos').innerHTML = rows.length
      ? rows.map(r => r.id === editId ? rowEdicion(r) : rowVista(r)).join('')
      : `<tr><td colspan="5" class="text-center py-8 text-slate-400 text-sm">Sin ingresos registrados</td></tr>`;
    document.getElementById('bulkBar-ingresos').innerHTML = App.bulk.barHTML('ingresos');
    App.bulk.syncSelectAll('ingresos');
    bindAcciones();
  }

  return { render };
})();
