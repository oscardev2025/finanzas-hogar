window.App = window.App || {};
App.views = App.views || {};

// Helpers compartidos para vistas con filtro por categoría + ordenación + totales.
App.views._filters = (function () {
  const { fmt, getCategoria } = App.utils;

  // Aplica filtro por categoría y ordenación. `withDate` indica si la entidad tiene `fecha`.
  function apply(rows, state, withDate) {
    let out = rows;
    if (state.categoria) out = out.filter(r => r.categoria === state.categoria);

    const cmp = (a, b) => {
      switch (state.sort) {
        case 'alfa-asc':   return a.concepto.localeCompare(b.concepto, 'es', { sensitivity: 'base' });
        case 'alfa-desc':  return b.concepto.localeCompare(a.concepto, 'es', { sensitivity: 'base' });
        case 'monto-desc': return Number(b.monto) - Number(a.monto);
        case 'monto-asc':  return Number(a.monto) - Number(b.monto);
        case 'cat': {
          const na = getCategoria(a.categoria).nombre;
          const nb = getCategoria(b.categoria).nombre;
          return na.localeCompare(nb, 'es', { sensitivity: 'base' })
              || a.concepto.localeCompare(b.concepto, 'es', { sensitivity: 'base' });
        }
        case 'fecha-asc':  return withDate ? new Date(a.fecha) - new Date(b.fecha) : 0;
        case 'fecha-desc':
        default:           return withDate ? new Date(b.fecha) - new Date(a.fecha) : 0;
      }
    };
    return [...out].sort(cmp);
  }

  function toolbarHTML(key, state, withDate) {
    const catOpts = App.state.categorias
      .map(c => `<option value="${c.id}" ${c.id === state.categoria ? 'selected' : ''}>${c.nombre}</option>`)
      .join('');

    const sortOptions = [
      withDate ? ['fecha-desc', 'Fecha (más reciente)'] : null,
      withDate ? ['fecha-asc',  'Fecha (más antigua)']  : null,
      ['alfa-asc',   'Concepto (A → Z)'],
      ['alfa-desc',  'Concepto (Z → A)'],
      ['cat',        'Categoría (A → Z)'],
      ['monto-desc', 'Monto (mayor a menor)'],
      ['monto-asc',  'Monto (menor a mayor)']
    ].filter(Boolean);

    const sortOpts = sortOptions
      .map(([v, l]) => `<option value="${v}" ${v === state.sort ? 'selected' : ''}>${l}</option>`)
      .join('');

    const reset = (state.categoria || (state.sort && state.sort !== (withDate ? 'fecha-desc' : 'cat')))
      ? `<button data-filter-reset="${key}" class="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5">Limpiar</button>`
      : '';

    return `
      <div class="flex flex-wrap items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs">
        <label class="flex items-center gap-2">
          <span class="text-slate-500">Categoría:</span>
          <select data-filter-cat="${key}" class="border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
            <option value="">Todas</option>${catOpts}
          </select>
        </label>
        <label class="flex items-center gap-2">
          <span class="text-slate-500">Ordenar por:</span>
          <select data-filter-sort="${key}" class="border border-slate-200 rounded-lg px-2 py-1.5 bg-white">${sortOpts}</select>
        </label>
        ${reset}
      </div>`;
  }

  function totalsHTML(rows, allRows, label = 'Total') {
    const totalFiltrado = rows.reduce((a, r) => a + Number(r.monto), 0);

    // Subtotales por categoría calculados sobre TODOS los registros (no el filtrado),
    // para que el desglose siempre muestre la foto completa.
    const porCat = {};
    allRows.forEach(r => { porCat[r.categoria] = (porCat[r.categoria] || 0) + Number(r.monto); });
    const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1]);

    if (allRows.length === 0) return '';

    const chips = cats.map(([id, val]) => {
      const c = getCategoria(id);
      return `
        <span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style="background:${c.color}15;color:${c.color}">
          <span class="w-1.5 h-1.5 rounded-full" style="background:${c.color}"></span>
          ${c.nombre}: <strong>${fmt(val)}</strong>
        </span>`;
    }).join('');

    return `
      <div class="px-4 py-3 bg-slate-50 border-t border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-500 uppercase tracking-wide">${label}</span>
          <span class="text-base font-bold text-slate-900">${fmt(totalFiltrado)}</span>
        </div>
        <div class="flex flex-wrap gap-1.5">${chips}</div>
      </div>`;
  }

  // Bind global de eventos. Llamar una sola vez desde init.
  let bound = false;
  function bindEvents(handlers) {
    if (bound) return;
    bound = true;
    document.body.addEventListener('change', e => {
      const k1 = e.target.dataset.filterCat;
      const k2 = e.target.dataset.filterSort;
      if (k1 && handlers[k1]) handlers[k1].setCategoria(e.target.value);
      if (k2 && handlers[k2]) handlers[k2].setSort(e.target.value);
    });
    document.body.addEventListener('click', e => {
      const k = e.target.dataset.filterReset;
      if (k && handlers[k]) handlers[k].reset();
    });
  }

  return { apply, toolbarHTML, totalsHTML, bindEvents };
})();
