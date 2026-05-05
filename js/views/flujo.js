window.App = window.App || {};
App.views = App.views || {};

App.views.flujo = (function () {
  const { fmt, fmtSign, ymLabel } = App.utils;
  const { totalesMes, mesesConDatos } = App.calc;

  let chart;

  function calcularFilas() {
    let acum = 0;
    return mesesConDatos().map(m => {
      const t = totalesMes(m);
      const ahorrosNetos = t.aportes - t.retiros;
      const balance = t.ingresos - t.fijos - t.variables;
      acum += balance - ahorrosNetos;
      return { m, ...t, ahorrosNetos, balance, acum };
    });
  }

  function renderTabla(filas) {
    document.getElementById('tablaFlujo').innerHTML = filas.length ? filas.slice().reverse().map(f => `
      <tr class="border-t border-slate-100 hover:bg-slate-50">
        <td class="px-4 py-3 capitalize">${ymLabel(f.m)}</td>
        <td class="px-4 py-3 text-right text-emerald-600">${fmt(f.ingresos)}</td>
        <td class="px-4 py-3 text-right text-rose-600">${fmt(f.fijos)}</td>
        <td class="px-4 py-3 text-right text-rose-600">${fmt(f.variables)}</td>
        <td class="px-4 py-3 text-right ${f.ahorrosNetos >= 0 ? 'text-amber-600' : 'text-rose-600'}">${f.ahorrosNetos >= 0 ? '+' : '-'}${fmt(f.ahorrosNetos)}</td>
        <td class="px-4 py-3 text-right font-bold ${f.balance >= 0 ? 'text-brand-600' : 'text-rose-600'}">${fmtSign(f.balance)}</td>
      </tr>
    `).join('') : `<tr><td colspan="6" class="text-center py-8 text-slate-400 text-sm">Sin datos aún</td></tr>`;
  }

  function renderChart(filas) {
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('chartFlujoAcum'), {
      type: 'line',
      data: {
        labels: filas.map(f => ymLabel(f.m)),
        datasets: [{
          label: 'Caja acumulada',
          data: filas.map(f => f.acum),
          borderColor: '#1968ed',
          backgroundColor: 'rgba(25,104,237,.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#1968ed'
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: v => fmt(v) } } }
      }
    });
  }

  function render() {
    const filas = calcularFilas();
    renderTabla(filas);
    renderChart(filas);
  }

  return { render };
})();
