window.App = window.App || {};
App.views = App.views || {};

App.views.ahorros = (function () {
  const { fmt, toast } = App.utils;
  const { totalAhorrado } = App.calc;

  let editId = null;
  let bound = false;

  function rowVista(r) {
    return `
      <tr class="border-t border-slate-100 hover:bg-slate-50">
        ${App.bulk.checkboxCell('ahorros', r.id)}
        <td class="px-4 py-3">${new Date(r.fecha).toLocaleDateString('es-MX')}</td>
        <td class="px-4 py-3">${r.concepto}</td>
        <td class="px-4 py-3"><span class="text-xs px-2 py-1 rounded-full ${r.tipo === 'aporte' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">${r.tipo}</span></td>
        <td class="px-4 py-3 text-right font-semibold ${r.tipo === 'aporte' ? 'text-emerald-600' : 'text-rose-600'}">${r.tipo === 'aporte' ? '+' : '-'}${fmt(r.monto)}</td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <button data-edit-aho="${r.id}" class="text-brand-600 hover:text-brand-700 text-xs mr-3">Editar</button>
          ${App.bulk.rowDuplicarBtn('ahorros', r.id)}
          <button data-del="ahorros" data-id="${r.id}" class="text-rose-500 hover:text-rose-700 text-xs">Eliminar</button>
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
          <select name="tipo" class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
            <option value="aporte" ${r.tipo === 'aporte' ? 'selected' : ''}>Aporte (+)</option>
            <option value="retiro" ${r.tipo === 'retiro' ? 'selected' : ''}>Retiro (-)</option>
          </select>
        </td>
        <td class="px-4 py-2">
          <input type="number" step="0.01" name="monto" value="${r.monto}" class="w-full text-right border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
        </td>
        <td class="px-4 py-2 text-right whitespace-nowrap">
          <button data-save-aho="${r.id}" class="text-emerald-600 hover:text-emerald-700 text-xs font-medium mr-3">Guardar</button>
          <button data-cancel-aho="1" class="text-slate-500 hover:text-slate-700 text-xs">Cancelar</button>
        </td>
      </tr>`;
  }

  function bindAcciones() {
    if (bound) return;
    bound = true;
    const tbody = document.getElementById('tablaAhorros');

    tbody.addEventListener('click', e => {
      const editar = e.target.dataset.editAho;
      if (editar) { editId = editar; render(); return; }
      if (e.target.dataset.cancelAho) { editId = null; render(); return; }

      const guardar = e.target.dataset.saveAho;
      if (guardar) {
        const fila = tbody.querySelector(`[data-edit-row="${guardar}"]`);
        const fecha = fila.querySelector('input[name="fecha"]').value;
        const concepto = fila.querySelector('input[name="concepto"]').value.trim();
        const tipo = fila.querySelector('select[name="tipo"]').value;
        const monto = parseFloat(fila.querySelector('input[name="monto"]').value);
        if (!fecha || !concepto || !tipo || isNaN(monto)) { toast('Datos inválidos'); return; }
        const it = App.state.ahorros.find(x => x.id === guardar);
        if (it) { it.fecha = fecha; it.concepto = concepto; it.tipo = tipo; it.monto = monto; App.store.save(); }
        editId = null; App.render(); toast('Movimiento actualizado');
      }
    });
  }

  function renderTabla() {
    const rows = [...App.state.ahorros].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    document.getElementById('tablaAhorros').innerHTML = rows.length
      ? rows.map(r => r.id === editId ? rowEdicion(r) : rowVista(r)).join('')
      : `<tr><td colspan="6" class="text-center py-8 text-slate-400 text-sm">Sin movimientos de ahorro</td></tr>`;
    document.getElementById('bulkBar-ahorros').innerHTML = App.bulk.barHTML('ahorros');
    App.bulk.syncSelectAll('ahorros');
    bindAcciones();
  }

  function renderResumen() {
    const total = totalAhorrado();
    document.getElementById('ahorroTotal').textContent = fmt(total);

    const meta = App.state.metaAhorro;
    if (meta.monto > 0) {
      const pct = Math.min(100, Math.round((total / meta.monto) * 100));
      document.getElementById('ahorroPct').textContent = pct + '%';
      document.getElementById('ahorroBar').style.width = pct + '%';
      document.getElementById('ahorroMetaLabel').textContent =
        `Meta: ${fmt(meta.monto)}` + (meta.descripcion ? ` · ${meta.descripcion}` : '');
    } else {
      document.getElementById('ahorroPct').textContent = '—';
      document.getElementById('ahorroBar').style.width = '0%';
      document.getElementById('ahorroMetaLabel').textContent = 'Meta no definida';
    }

    document.getElementById('inputMeta').value = meta.monto || '';
    document.getElementById('inputMetaDesc').value = meta.descripcion || '';
  }

  function render() {
    renderTabla();
    renderResumen();
  }

  return { render };
})();
