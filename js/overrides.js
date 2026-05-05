window.App = window.App || {};

App.overrides = (function () {
  const { fmt, ymKey, ymLabel } = App.utils;

  let current = null; // { tipo: 'fijos'|'ingresosFijos', item }

  function ymToDate(ym) {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }
  function addMonths(ym, n) {
    const d = ymToDate(ym);
    return ymKey(new Date(d.getFullYear(), d.getMonth() + n, 1));
  }

  function rangoMeses() {
    // Últimos 12 + actual + próximos 12.
    const meses = [];
    const hoy = ymKey(new Date());
    for (let i = -12; i <= 12; i++) meses.push(addMonths(hoy, i));
    return meses;
  }

  function open(tipo, itemId) {
    const list = App.state[tipo] || [];
    const item = list.find(x => x.id === itemId);
    if (!item) return;
    current = { tipo, item };
    render();
    document.getElementById('overridesModal').classList.remove('hidden');
  }

  function close() {
    current = null;
    document.getElementById('overridesModal').classList.add('hidden');
    App.render();
  }

  function render() {
    if (!current) return;
    const { tipo, item } = current;
    const cerrados = App.state.cierres || {};

    document.getElementById('overridesTitle').textContent =
      `${item.concepto} · ajustes por mes`;
    document.getElementById('overridesDefault').textContent =
      `Monto por defecto: ${fmt(item.monto)}`;

    // Sección vigencia
    document.getElementById('overridesVigDesde').value = item.vigenciaDesde || '';
    document.getElementById('overridesVigHasta').value = item.vigenciaHasta || '';
    const tieneVig = !!(item.vigenciaDesde || item.vigenciaHasta);
    document.getElementById('overridesVigClear').classList.toggle('hidden', !tieneVig);

    // Tabla mes × monto
    const filas = rangoMeses().map(mes => {
      const ovr = App.calc.getOverride(tipo, item.id, mes) || {};
      const cerrado = !!cerrados[mes];
      const enVig = App.calc.dentroDeVigencia(item, mes);
      const valor = ovr.monto != null ? ovr.monto : '';
      const omit = !!ovr.omitido;
      const efectivo = App.calc.montoEfectivo(tipo, item, mes);

      let dispCol;
      if (cerrado) {
        dispCol = `<span class="text-xs text-amber-600">Mes cerrado</span>`;
      } else if (!enVig) {
        dispCol = `<span class="text-xs text-slate-400">Fuera de vigencia</span>`;
      } else {
        dispCol = `
          <input type="number" step="0.01" data-ovr-monto="${mes}" value="${valor}" placeholder="${item.monto}"
                 ${omit ? 'disabled' : ''} class="w-28 border border-slate-200 rounded-lg px-2 py-1 text-sm text-right" />
          <label class="ml-3 inline-flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" data-ovr-omit="${mes}" ${omit ? 'checked' : ''} class="rounded" />
            Omitir
          </label>
          ${ovr.monto != null || omit ? `<button data-ovr-clear="${mes}" class="ml-2 text-xs text-rose-500 hover:text-rose-700">Limpiar</button>` : ''}
        `;
      }

      const trCls = (cerrado || !enVig) ? 'bg-slate-50/60 text-slate-400' : '';

      return `
        <tr class="border-t border-slate-100 ${trCls}">
          <td class="px-3 py-2 capitalize text-sm">${ymLabel(mes)}</td>
          <td class="px-3 py-2 text-right text-xs">${efectivo === null ? '—' : fmt(efectivo)}</td>
          <td class="px-3 py-2 text-right whitespace-nowrap">${dispCol}</td>
        </tr>`;
    }).join('');

    document.getElementById('overridesBody').innerHTML = filas;
  }

  function setVigencia(field, value) {
    if (!current) return;
    current.item[field] = value || null;
    if (!current.item[field]) delete current.item[field];
    App.store.save();
    render();
  }

  function bind() {
    const modal = document.getElementById('overridesModal');
    if (!modal || modal.dataset.bound) return;
    modal.dataset.bound = '1';

    modal.addEventListener('click', e => {
      if (e.target.dataset.overridesClose != null || e.target === modal) {
        close();
        return;
      }
      const clearMes = e.target.dataset.ovrClear;
      if (clearMes && current) {
        App.calc.setOverride(current.tipo, current.item.id, clearMes, null);
        App.store.save(); render();
        return;
      }
      if (e.target.id === 'overridesVigClear' && current) {
        delete current.item.vigenciaDesde;
        delete current.item.vigenciaHasta;
        App.store.save(); render();
      }
    });

    modal.addEventListener('change', e => {
      if (!current) return;
      const t = e.target;

      if (t.id === 'overridesVigDesde') {
        setVigencia('vigenciaDesde', t.value);
        return;
      }
      if (t.id === 'overridesVigHasta') {
        setVigencia('vigenciaHasta', t.value);
        return;
      }

      if (t.dataset.ovrMonto != null) {
        const mes = t.dataset.ovrMonto;
        const v = t.value.trim();
        const existing = App.calc.getOverride(current.tipo, current.item.id, mes) || {};
        const newOvr = { ...existing, monto: v === '' ? undefined : parseFloat(v) };
        if (newOvr.monto == null) delete newOvr.monto;
        App.calc.setOverride(current.tipo, current.item.id, mes, newOvr);
        App.store.save(); render();
      } else if (t.dataset.ovrOmit != null) {
        const mes = t.dataset.ovrOmit;
        const existing = App.calc.getOverride(current.tipo, current.item.id, mes) || {};
        const newOvr = { ...existing, omitido: t.checked };
        if (!newOvr.omitido) delete newOvr.omitido;
        App.calc.setOverride(current.tipo, current.item.id, mes, newOvr);
        App.store.save(); render();
      }
    });
  }

  return { open, close, bind };
})();
