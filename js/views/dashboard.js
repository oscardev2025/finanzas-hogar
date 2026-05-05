window.App = window.App || {};
App.views = App.views || {};

App.views.dashboard = (function () {
  const { fmt, fmtSign, ymKey, ymLabel, getCategoria } = App.utils;
  const { totalesMes, totalAhorrado, distribucionGastos, mesesUltimos, estadoPresupuesto } = App.calc;

  let chartFlujo, chartDist;

  function renderKpis() {
    const t = totalesMes(App.nav.currentMonth);
    document.getElementById('kpiIngresos').textContent = fmt(t.ingresos);
    document.getElementById('kpiIngresosDetalle').textContent =
      `Fijos ${fmt(t.ingresosFijos)} · Variables ${fmt(t.ingresosVariables)}`;
    document.getElementById('kpiGastos').textContent = fmt(t.gastos);
    document.getElementById('kpiGastosDetalle').textContent =
      `Fijos ${fmt(t.fijos)} · Variables ${fmt(t.variables)}`;

    const balance = t.ingresos - t.gastos;
    const elBal = document.getElementById('kpiBalance');
    elBal.textContent = fmtSign(balance);
    elBal.className = 'text-2xl font-bold mt-2 ' + (balance >= 0 ? 'text-brand-600' : 'text-rose-600');
    const pct = t.ingresos > 0 ? Math.round((balance / t.ingresos) * 100) : 0;
    document.getElementById('kpiBalancePct').textContent = `${pct}% de ingresos`;

    const ahorrado = totalAhorrado();
    document.getElementById('kpiAhorrado').textContent = fmt(ahorrado);
    const meta = App.state.metaAhorro;
    if (meta.monto > 0) {
      const pctMeta = Math.min(100, Math.round((ahorrado / meta.monto) * 100));
      document.getElementById('kpiAhorroMeta').textContent =
        `${pctMeta}% de ${fmt(meta.monto)}` + (meta.descripcion ? ` · ${meta.descripcion}` : '');
    } else {
      document.getElementById('kpiAhorroMeta').textContent = 'Define una meta en Ahorros';
    }
  }

  function renderChartFlujo() {
    const meses = mesesUltimos(6);
    const datosIng = meses.map(m => totalesMes(m).ingresos);
    const datosGas = meses.map(m => totalesMes(m).gastos);
    const labels = meses.map(m => ymLabel(m).split(' ')[0].slice(0, 3));

    if (chartFlujo) chartFlujo.destroy();
    chartFlujo = new Chart(document.getElementById('chartFlujo'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Ingresos', data: datosIng, backgroundColor: '#10b981', borderRadius: 6 },
          { label: 'Gastos',   data: datosGas, backgroundColor: '#ef4444', borderRadius: 6 }
        ]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => fmt(v) } } }
      }
    });
  }

  function renderChartDist() {
    const dist = distribucionGastos(App.nav.currentMonth);
    const labels = Object.keys(dist).map(id => getCategoria(id).nombre);
    const data = Object.values(dist);
    const colors = Object.keys(dist).map(id => getCategoria(id).color);

    if (chartDist) chartDist.destroy();
    if (data.length === 0) {
      chartDist = new Chart(document.getElementById('chartDist'), {
        type: 'doughnut',
        data: { labels: ['Sin datos'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'] }] },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    } else {
      chartDist = new Chart(document.getElementById('chartDist'), {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
        options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } }
      });
    }
  }

  function renderMovimientos() {
    const movs = [
      ...App.state.ingresos.map(i => ({ ...i, tipo: 'ingreso' })),
      ...App.state.variables.map(i => ({ ...i, tipo: 'variable' })),
      ...App.state.ahorros.map(i => ({ ...i, tipo: 'ahorro_' + i.tipo }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8);

    document.getElementById('recentList').innerHTML = movs.length ? movs.map(m => {
      const isPos = m.tipo === 'ingreso' || m.tipo === 'ahorro_retiro';
      const color = isPos ? 'text-emerald-600' : 'text-rose-600';
      const icon = m.tipo === 'ingreso' ? '↑' : m.tipo.startsWith('ahorro') ? '★' : '↓';
      return `
        <div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm">${icon}</div>
            <div>
              <p class="text-sm font-medium text-slate-800">${m.concepto}</p>
              <p class="text-xs text-slate-500">${new Date(m.fecha).toLocaleDateString('es-MX')}</p>
            </div>
          </div>
          <span class="font-semibold ${color}">${isPos ? '+' : '-'}${fmt(m.monto)}</span>
        </div>`;
    }).join('') : '<p class="text-sm text-slate-400">Aún no hay movimientos.</p>';
  }

  function renderTopCategorias() {
    const dist = distribucionGastos(App.nav.currentMonth);
    const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const total = Object.values(dist).reduce((a, b) => a + b, 0);

    document.getElementById('topCats').innerHTML = sorted.length ? sorted.map(([id, val]) => {
      const c = getCategoria(id);
      const pct = total > 0 ? Math.round((val / total) * 100) : 0;
      return `
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="font-medium" style="color:${c.color}">● ${c.nombre}</span>
            <span class="text-slate-600">${fmt(val)} <span class="text-slate-400">(${pct}%)</span></span>
          </div>
          <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full" style="width:${pct}%; background:${c.color}"></div>
          </div>
        </div>`;
    }).join('') : '<p class="text-sm text-slate-400">Sin gastos este mes.</p>';
  }

  function renderPresupuestos() {
    const month = App.nav.currentMonth;
    const lista = App.state.presupuestos.filter(p => p.mes === month);
    const cont = document.getElementById('dashPresupuestos');
    if (!cont) return;

    if (!lista.length) {
      cont.innerHTML = `<p class="text-sm text-slate-400 col-span-full text-center py-6">No hay presupuestos asignados para ${ymLabel(month)}. <br><span class="text-xs">Asigna uno en la vista Presupuestos.</span></p>`;
      return;
    }

    cont.innerHTML = lista.map(p => {
      const c = getCategoria(p.categoria);
      const { gastado, restante, pct, excedido } = estadoPresupuesto(p);
      const barColor = excedido ? '#ef4444' : (pct >= 80 ? '#f59e0b' : c.color);
      const restanteColor = excedido ? 'text-rose-600' : 'text-emerald-600';
      const restanteLabel = excedido
        ? `Excedido ${fmt(Math.abs(restante))}`
        : `Restan ${fmt(restante)}`;
      return `
        <div class="border border-slate-100 rounded-xl p-3">
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${c.color}"></span>
              <span class="text-sm font-medium text-slate-700 truncate">${c.nombre}</span>
            </div>
            <span class="text-xs ${restanteColor} font-semibold shrink-0">${restanteLabel}</span>
          </div>
          <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all" style="width:${Math.min(100, pct)}%; background:${barColor}"></div>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">${fmt(gastado)} / ${fmt(p.monto)} · ${pct}%</p>
        </div>`;
    }).join('');
  }

  function render() {
    renderKpis();
    renderChartFlujo();
    renderChartDist();
    renderMovimientos();
    renderTopCategorias();
    renderPresupuestos();
  }

  return { render };
})();
