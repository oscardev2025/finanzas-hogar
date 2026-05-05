window.App = window.App || {};

App.calc = (function () {
  const { ymKey } = App.utils;

  function totalesMes(month) {
    const s = App.state;
    const ingresosFijos     = (s.ingresosFijos || []).reduce((a, b) => a + Number(b.monto), 0);
    const ingresosVariables = s.ingresos.filter(i => ymKey(i.fecha) === month).reduce((a, b) => a + Number(b.monto), 0);
    const ingresos          = ingresosFijos + ingresosVariables;
    const fijos             = s.fijos.reduce((a, b) => a + Number(b.monto), 0);
    const variables         = s.variables.filter(i => ymKey(i.fecha) === month).reduce((a, b) => a + Number(b.monto), 0);
    const aportes           = s.ahorros.filter(i => ymKey(i.fecha) === month && i.tipo === 'aporte').reduce((a, b) => a + Number(b.monto), 0);
    const retiros           = s.ahorros.filter(i => ymKey(i.fecha) === month && i.tipo === 'retiro').reduce((a, b) => a + Number(b.monto), 0);
    return {
      ingresos, ingresosFijos, ingresosVariables,
      fijos, variables, aportes, retiros,
      gastos: fijos + variables,
      balance: ingresos - fijos - variables - aportes + retiros
    };
  }

  function totalAhorrado() {
    return App.state.ahorros.reduce((a, b) =>
      a + (b.tipo === 'aporte' ? Number(b.monto) : -Number(b.monto)), 0);
  }

  function distribucionGastos(month) {
    const dist = {};
    App.state.fijos.forEach(f => { dist[f.categoria] = (dist[f.categoria] || 0) + Number(f.monto); });
    App.state.variables
      .filter(i => ymKey(i.fecha) === month)
      .forEach(v => { dist[v.categoria] = (dist[v.categoria] || 0) + Number(v.monto); });
    return dist;
  }

  function mesesUltimos(n) {
    const meses = [];
    const hoy = new Date();
    for (let i = n - 1; i >= 0; i--) {
      meses.push(ymKey(new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)));
    }
    return meses;
  }

  function mesesConDatos() {
    const meses = new Set();
    App.state.ingresos.forEach(i => meses.add(ymKey(i.fecha)));
    App.state.variables.forEach(i => meses.add(ymKey(i.fecha)));
    App.state.ahorros.forEach(i => meses.add(ymKey(i.fecha)));
    if (meses.size === 0) meses.add(ymKey(new Date()));
    return [...meses].sort();
  }

  function gastoCategoriaMes(categoriaId, month) {
    const fijos = App.state.fijos
      .filter(f => f.categoria === categoriaId)
      .reduce((a, b) => a + Number(b.monto), 0);
    const variables = App.state.variables
      .filter(v => v.categoria === categoriaId && ymKey(v.fecha) === month)
      .reduce((a, b) => a + Number(b.monto), 0);
    return fijos + variables;
  }

  function presupuestoCategoriaMes(categoriaId, month) {
    const p = App.state.presupuestos.find(x => x.categoria === categoriaId && x.mes === month);
    return p ? Number(p.monto) : 0;
  }

  function estadoPresupuesto(p) {
    const gastado = gastoCategoriaMes(p.categoria, p.mes);
    const monto = Number(p.monto) || 0;
    const restante = monto - gastado;
    const pct = monto > 0 ? Math.min(100, Math.round((gastado / monto) * 100)) : 0;
    return { gastado, restante, pct, excedido: gastado > monto };
  }

  return {
    totalesMes, totalAhorrado, distribucionGastos, mesesUltimos, mesesConDatos,
    gastoCategoriaMes, presupuestoCategoriaMes, estadoPresupuesto
  };
})();
