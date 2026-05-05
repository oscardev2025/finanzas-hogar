window.App = window.App || {};
App.views = App.views || {};

App.views.flujo = (function () {
  const { fmt, fmtSign, ymKey, ymLabel } = App.utils;
  const { totalesMes, isClosed, cerrarMes, reabrirMes, saldoInicioMes, balanceCajaMes } = App.calc;

  let chart;
  let bound = false;

  const hoy = new Date();
  const ymHoy   = ymKey(hoy);
  const ymPlus  = ymKey(new Date(hoy.getFullYear(), hoy.getMonth() + 11, 1));
  const state = { desde: ymHoy, hasta: ymPlus };

  function ymToDate(ym) {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }
  function addMonths(ym, n) {
    const d = ymToDate(ym);
    return ymKey(new Date(d.getFullYear(), d.getMonth() + n, 1));
  }
  function rangeMeses(desde, hasta) {
    if (desde > hasta) [desde, hasta] = [hasta, desde];
    const out = [];
    let cur = desde;
    let safety = 0;
    while (cur <= hasta && safety++ < 600) {
      out.push(cur);
      cur = addMonths(cur, 1);
    }
    return out;
  }

  function calcularFilas() {
    let acum = saldoInicioMes(state.desde);
    return rangeMeses(state.desde, state.hasta).map(m => {
      const t = totalesMes(m);
      const ahorrosNetos = t.aportes - t.retiros;
      const balance = t.balance;
      acum += balance - ahorrosNetos;
      const futuro = m > ymHoy;
      const cerrado = isClosed(m);
      return { m, ...t, ahorrosNetos, balance, acum, futuro, cerrado };
    });
  }

  function estadoCell(f) {
    if (f.futuro) return `<span class="text-xs text-slate-400">Proyección</span>`;
    if (f.cerrado) return `
      <span class="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
        Cerrado
      </span>
      <button data-flujo-action="reabrir" data-mes="${f.m}" class="ml-2 text-[11px] text-slate-500 hover:text-slate-700">Reabrir</button>`;
    return `<button data-flujo-action="cerrar" data-mes="${f.m}" class="text-xs text-brand-600 hover:text-brand-700 font-medium">Cerrar mes</button>`;
  }

  function renderTabla(filas) {
    document.getElementById('tablaFlujo').innerHTML = filas.length ? filas.slice().reverse().map(f => `
      <tr class="border-t border-slate-100 hover:bg-slate-50 ${f.futuro ? 'text-slate-500' : ''}">
        <td class="px-4 py-3 capitalize">${ymLabel(f.m)}${f.futuro ? ' <span class="text-[10px] uppercase tracking-wide text-brand-500 ml-1">proy.</span>' : ''}</td>
        <td class="px-4 py-3 text-right text-emerald-600">${fmt(f.ingresos)}</td>
        <td class="px-4 py-3 text-right text-rose-600">${fmt(f.fijos)}</td>
        <td class="px-4 py-3 text-right text-rose-600">${fmt(f.variables)}</td>
        <td class="px-4 py-3 text-right ${f.ahorrosNetos >= 0 ? 'text-amber-600' : 'text-rose-600'}">${f.ahorrosNetos >= 0 ? '+' : '-'}${fmt(f.ahorrosNetos)}</td>
        <td class="px-4 py-3 text-right font-bold ${f.balance >= 0 ? 'text-brand-600' : 'text-rose-600'}">${fmtSign(f.balance)}</td>
        <td class="px-4 py-3 text-right font-medium ${f.acum >= 0 ? 'text-slate-700' : 'text-rose-700'}">${fmtSign(f.acum)}</td>
        <td class="px-4 py-3 text-right whitespace-nowrap">${estadoCell(f)}</td>
      </tr>
    `).join('') : `<tr><td colspan="8" class="text-center py-8 text-slate-400 text-sm">Rango sin datos</td></tr>`;
  }

  function renderChart(filas) {
    if (chart) chart.destroy();
    const ctx = document.getElementById('chartFlujoAcum');
    if (!ctx || filas.length === 0) return;

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: filas.map(f => ymLabel(f.m)),
        datasets: [{
          label: 'Saldo acumulado',
          data: filas.map(f => f.acum),
          borderColor: '#1968ed',
          backgroundColor: 'rgba(25,104,237,.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: filas.map(f => f.cerrado ? '#10b981' : (f.futuro ? '#94a3b8' : '#1968ed')),
          segment: {
            borderDash: ctx => filas[ctx.p1DataIndex].futuro ? [6, 4] : undefined
          }
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: c => {
                const f = filas[c.dataIndex];
                const tag = f.cerrado ? ' (cerrado)' : f.futuro ? ' (proyección)' : '';
                return `${fmtSign(c.parsed.y)}${tag}`;
              }
            }
          }
        },
        scales: { y: { ticks: { callback: v => fmtSign(v) } } }
      }
    });
  }

  function updateInputs() {
    const a = document.getElementById('flujoDesde');
    const b = document.getElementById('flujoHasta');
    if (a) a.value = state.desde;
    if (b) b.value = state.hasta;
  }

  function bindControls() {
    if (bound) return;
    bound = true;
    document.getElementById('flujoDesde').addEventListener('change', e => {
      if (!e.target.value) return;
      state.desde = e.target.value;
      if (state.hasta < state.desde) state.hasta = state.desde;
      render();
    });
    document.getElementById('flujoHasta').addEventListener('change', e => {
      if (!e.target.value) return;
      state.hasta = e.target.value;
      if (state.desde > state.hasta) state.desde = state.hasta;
      render();
    });
    document.getElementById('flujoPreset12').addEventListener('click', () => {
      state.desde = ymHoy;
      state.hasta = addMonths(ymHoy, 11);
      render();
    });
    document.getElementById('flujoPreset24').addEventListener('click', () => {
      state.desde = ymHoy;
      state.hasta = addMonths(ymHoy, 23);
      render();
    });

    document.getElementById('tablaFlujo').addEventListener('click', e => {
      const btn = e.target.closest('[data-flujo-action]');
      if (!btn) return;
      const mes = btn.dataset.mes;
      const action = btn.dataset.flujoAction;
      if (action === 'cerrar') {
        if (!confirm(`Cerrar ${ymLabel(mes)}?\n\nSe guardará una foto de los ingresos y gastos fijos vigentes (con sus overrides). A partir de aquí, cambios en las plantillas no afectarán este mes.`)) return;
        cerrarMes(mes); App.store.save(); App.render(); App.utils.toast('Mes cerrado');
      } else if (action === 'reabrir') {
        if (!confirm(`Reabrir ${ymLabel(mes)}?\n\nSe descartará el snapshot y el mes volverá a calcularse a partir de las plantillas y overrides actuales.`)) return;
        reabrirMes(mes); App.store.save(); App.render(); App.utils.toast('Mes reabierto');
      }
    });
  }

  function render() {
    updateInputs();
    bindControls();
    const filas = calcularFilas();
    renderTabla(filas);
    renderChart(filas);
  }

  return { render };
})();
