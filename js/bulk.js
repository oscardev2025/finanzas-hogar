window.App = window.App || {};

App.bulk = (function () {
  const selections = {};
  let editingKey = null;

  const FIELDS = {
    ingresosFijos: [
      { name: 'concepto', label: 'Concepto',  type: 'text'   },
      { name: 'monto',    label: 'Monto',     type: 'number', step: '0.01' }
    ],
    ingresos: [
      { name: 'fecha',    label: 'Fecha',     type: 'date'   },
      { name: 'concepto', label: 'Concepto',  type: 'text'   },
      { name: 'monto',    label: 'Monto',     type: 'number', step: '0.01' }
    ],
    fijos: [
      { name: 'concepto', label: 'Concepto',  type: 'text'   },
      { name: 'categoria',label: 'Categoría', type: 'cat'    },
      { name: 'monto',    label: 'Monto',     type: 'number', step: '0.01' }
    ],
    variables: [
      { name: 'fecha',    label: 'Fecha',     type: 'date'   },
      { name: 'concepto', label: 'Concepto',  type: 'text'   },
      { name: 'categoria',label: 'Categoría', type: 'cat'    },
      { name: 'monto',    label: 'Monto',     type: 'number', step: '0.01' }
    ],
    ahorros: [
      { name: 'fecha',    label: 'Fecha',     type: 'date'   },
      { name: 'concepto', label: 'Concepto',  type: 'text'   },
      { name: 'tipo',     label: 'Tipo',      type: 'tipo'   },
      { name: 'monto',    label: 'Monto',     type: 'number', step: '0.01' }
    ]
  };

  function getSet(key) {
    if (!selections[key]) selections[key] = new Set();
    return selections[key];
  }
  function isSelected(key, id) { return getSet(key).has(id); }
  function clear(key) { getSet(key).clear(); editingKey = null; }
  function toggle(key, id) {
    const s = getSet(key);
    if (s.has(id)) s.delete(id); else s.add(id);
  }

  function fieldHTML(key, f) {
    if (f.type === 'cat') {
      const opts = App.state.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
      return `<select name="${f.name}" class="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white">
        <option value="">— Sin cambios —</option>${opts}</select>`;
    }
    if (f.type === 'tipo') {
      return `<select name="${f.name}" class="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white">
        <option value="">— Sin cambios —</option>
        <option value="aporte">Aporte</option>
        <option value="retiro">Retiro</option>
      </select>`;
    }
    const step = f.step ? ` step="${f.step}"` : '';
    return `<input type="${f.type}" name="${f.name}"${step} placeholder="Sin cambios" class="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />`;
  }

  function checkboxCell(key, id) {
    return `<td class="px-4 py-3 w-10">
      <input type="checkbox" data-bulk-select="${key}" data-bulk-id="${id}" ${isSelected(key, id) ? 'checked' : ''} class="rounded cursor-pointer" />
    </td>`;
  }

  function emptyCell() { return `<td class="px-4 py-2"></td>`; }

  function rowDuplicarBtn(key, id) {
    return `<button data-dup-row="${key}" data-id="${id}" class="text-slate-500 hover:text-slate-700 text-xs mr-3">Duplicar</button>`;
  }

  function syncSelectAll(key) {
    const el = document.getElementById(`bulkSelAll-${key}`);
    if (!el) return;
    const total = (App.state[key] || []).length;
    const sel = getSet(key).size;
    el.checked = total > 0 && sel === total;
    el.indeterminate = sel > 0 && sel < total;
  }

  function barHTML(key) {
    const n = getSet(key).size;
    if (n === 0) return '';

    if (editingKey === key) {
      const fields = FIELDS[key].map(f => `
        <div class="flex flex-col">
          <label class="text-[10px] uppercase tracking-wide text-slate-500 mb-1">${f.label}</label>
          ${fieldHTML(key, f)}
        </div>`).join('');
      return `
        <div class="bg-brand-50 border-b border-brand-100 p-3">
          <p class="text-xs text-brand-700 mb-3">Editando <strong>${n}</strong> registro${n > 1 ? 's' : ''}. Deja vacíos los campos que no quieras cambiar.</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3" data-bulk-form="${key}">${fields}</div>
          <div class="flex justify-end gap-2">
            <button data-bulk-action="cancelar-editar" data-bulk-key="${key}" class="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
            <button data-bulk-action="aplicar-editar" data-bulk-key="${key}" class="px-3 py-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white rounded font-medium">Aplicar a ${n}</button>
          </div>
        </div>`;
    }

    return `
      <div class="bg-brand-50 border-b border-brand-100 px-4 py-2 flex items-center justify-between">
        <span class="text-xs text-brand-700 font-medium">${n} seleccionado${n > 1 ? 's' : ''}</span>
        <div class="flex items-center gap-1 text-xs">
          <button data-bulk-action="editar" data-bulk-key="${key}" class="px-3 py-1.5 text-brand-700 hover:bg-brand-100 rounded font-medium">Editar</button>
          <button data-bulk-action="duplicar" data-bulk-key="${key}" class="px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded font-medium">Duplicar</button>
          <button data-bulk-action="eliminar" data-bulk-key="${key}" class="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded font-medium">Eliminar</button>
          <button data-bulk-action="cancelar" data-bulk-key="${key}" title="Limpiar selección" class="px-2 py-1.5 text-slate-500 hover:bg-slate-100 rounded">✕</button>
        </div>
      </div>`;
  }

  function duplicarUno(key, id) {
    const item = App.state[key].find(x => x.id === id);
    if (!item) return;
    App.state[key].push({ ...item, id: App.utils.uid() });
    App.store.save(); App.render(); App.utils.toast('Duplicado');
  }

  function applyBulkEdit(key) {
    const form = document.querySelector(`[data-bulk-form="${key}"]`);
    if (!form) return;
    const updates = {};
    FIELDS[key].forEach(f => {
      const el = form.querySelector(`[name="${f.name}"]`);
      const v = (el.value || '').trim();
      if (v === '') return;
      updates[f.name] = (f.type === 'number') ? parseFloat(v) : v;
    });
    const set = getSet(key);
    if (Object.keys(updates).length === 0) {
      editingKey = null; App.render(); App.utils.toast('Sin cambios'); return;
    }
    App.state[key].forEach(item => {
      if (set.has(item.id)) Object.assign(item, updates);
    });
    App.store.save(); clear(key); App.render(); App.utils.toast('Cambios aplicados');
  }

  function init() {
    document.body.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.bulkSelect) {
        toggle(t.dataset.bulkSelect, t.dataset.bulkId);
        App.render();
      } else if (t.dataset.bulkSelectAll) {
        const key = t.dataset.bulkSelectAll;
        const set = getSet(key);
        if (t.checked) {
          (App.state[key] || []).forEach(x => set.add(x.id));
        } else {
          set.clear();
        }
        App.render();
      }
    });

    document.body.addEventListener('click', e => {
      const dup = e.target.dataset.dupRow;
      if (dup) {
        duplicarUno(dup, e.target.dataset.id);
        return;
      }

      const action = e.target.dataset.bulkAction;
      if (!action) return;
      const key = e.target.dataset.bulkKey;
      const set = getSet(key);

      if (action === 'cancelar')        { clear(key); App.render(); return; }
      if (action === 'cancelar-editar') { editingKey = null; App.render(); return; }
      if (action === 'editar')          { if (set.size === 0) return; editingKey = key; App.render(); return; }
      if (action === 'aplicar-editar')  { applyBulkEdit(key); return; }
      if (action === 'eliminar') {
        if (set.size === 0) return;
        if (!confirm(`¿Eliminar ${set.size} registro${set.size > 1 ? 's' : ''}?`)) return;
        App.state[key] = App.state[key].filter(x => !set.has(x.id));
        clear(key); App.store.save(); App.render(); App.utils.toast('Eliminados');
        return;
      }
      if (action === 'duplicar') {
        if (set.size === 0) return;
        const copies = App.state[key].filter(x => set.has(x.id))
          .map(x => ({ ...x, id: App.utils.uid() }));
        App.state[key].push(...copies);
        clear(key); App.store.save(); App.render(); App.utils.toast('Duplicados');
      }
    });
  }

  return {
    init, isSelected, getSet, clear,
    checkboxCell, emptyCell, rowDuplicarBtn,
    barHTML, syncSelectAll, duplicarUno
  };
})();
