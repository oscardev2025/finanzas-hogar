window.App = window.App || {};

App.calc = (function () {
  const { ymKey } = App.utils;

  // --- Overrides --------------------------------------------------------

  function getOverride(tipo, itemId, mes) {
    return App.state.overrides?.[tipo]?.[itemId]?.[mes] || null;
  }

  function setOverride(tipo, itemId, mes, override) {
    if (!App.state.overrides) App.state.overrides = { fijos: {}, ingresosFijos: {} };
    if (!App.state.overrides[tipo]) App.state.overrides[tipo] = {};
    if (!App.state.overrides[tipo][itemId]) App.state.overrides[tipo][itemId] = {};
    if (!override || (override.monto == null && !override.omitido)) {
      delete App.state.overrides[tipo][itemId][mes];
      if (!Object.keys(App.state.overrides[tipo][itemId]).length) delete App.state.overrides[tipo][itemId];
    } else {
      App.state.overrides[tipo][itemId][mes] = override;
    }
  }

  // Monto efectivo de un fijo / ingresoFijo en un mes dado. Devuelve null si está omitido.
  function montoEfectivo(tipo, item, mes) {
    const ovr = getOverride(tipo, item.id, mes);
    if (ovr?.omitido) return null;
    if (ovr?.monto != null && !isNaN(Number(ovr.monto))) return Number(ovr.monto);
    return Number(item.monto) || 0;
  }

  // --- Cierres ----------------------------------------------------------

  function isClosed(mes) { return !!App.state.cierres?.[mes]; }

  function snapshotMes(mes) {
    const ingresosFijos = App.state.ingresosFijos.map(i => {
      const m = montoEfectivo('ingresosFijos', i, mes);
      return m === null ? null : { id: i.id, concepto: i.concepto, monto: m };
    }).filter(Boolean);

    const fijos = App.state.fijos.map(f => {
      const m = montoEfectivo('fijos', f, mes);
      return m === null ? null : { id: f.id, concepto: f.concepto, categoria: f.categoria, monto: m };
    }).filter(Boolean);

    return { ingresosFijos, fijos };
  }

  function cerrarMes(mes) {
    const t = totalesMes(mes); // calcula con overrides actuales
    const snap = snapshotMes(mes);
    const saldoInicio = saldoInicioMes(mes);
    const saldoFin = saldoInicio + t.balance - (t.aportes - t.retiros);
    if (!App.state.cierres) App.state.cierres = {};
    App.state.cierres[mes] = {
      cerradoEn: new Date().toISOString(),
      ingresosFijos: snap.ingresosFijos,
      fijos: snap.fijos,
      totales: t,
      saldoInicio, saldoFin
    };
  }

  function reabrirMes(mes) {
    if (App.state.cierres) delete App.state.cierres[mes];
  }

  // --- Totales ----------------------------------------------------------

  function totalesMes(month) {
    // Si está cerrado, devolver los totales del snapshot tal cual.
    const cierre = App.state.cierres?.[month];
    if (cierre?.totales) return { ...cierre.totales, cerrado: true };

    const s = App.state;

    const ingresosFijos = (s.ingresosFijos || []).reduce((a, i) => {
      const m = montoEfectivo('ingresosFijos', i, month);
      return a + (m === null ? 0 : m);
    }, 0);

    const ingresosVariables = s.ingresos.filter(i => ymKey(i.fecha) === month).reduce((a, b) => a + Number(b.monto), 0);
    const ingresos = ingresosFijos + ingresosVariables;

    const fijos = (s.fijos || []).reduce((a, f) => {
      const m = montoEfectivo('fijos', f, month);
      return a + (m === null ? 0 : m);
    }, 0);

    const variables = s.variables.filter(i => ymKey(i.fecha) === month).reduce((a, b) => a + Number(b.monto), 0);
    const aportes   = s.ahorros.filter(i => ymKey(i.fecha) === month && i.tipo === 'aporte').reduce((a, b) => a + Number(b.monto), 0);
    const retiros   = s.ahorros.filter(i => ymKey(i.fecha) === month && i.tipo === 'retiro').reduce((a, b) => a + Number(b.monto), 0);

    return {
      ingresos, ingresosFijos, ingresosVariables,
      fijos, variables, aportes, retiros,
      gastos: fijos + variables,
      balance: ingresos - fijos - variables,
      cerrado: false
    };
  }

  function totalAhorrado() {
    return App.state.ahorros.reduce((a, b) =>
      a + (b.tipo === 'aporte' ? Number(b.monto) : -Number(b.monto)), 0);
  }

  function distribucionGastos(month) {
    const dist = {};
    (App.state.fijos || []).forEach(f => {
      const m = montoEfectivo('fijos', f, month);
      if (m === null) return;
      dist[f.categoria] = (dist[f.categoria] || 0) + m;
    });
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

  function gastoCategoriaMes(categoriaId, month) {
    const fijos = (App.state.fijos || [])
      .filter(f => f.categoria === categoriaId)
      .reduce((a, f) => {
        const m = montoEfectivo('fijos', f, month);
        return a + (m === null ? 0 : m);
      }, 0);
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

  // --- Saldo acumulado --------------------------------------------------

  function ymToDate(ym) {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }
  function addMonths(ym, n) {
    const d = ymToDate(ym);
    return ymKey(new Date(d.getFullYear(), d.getMonth() + n, 1));
  }

  // Balance de caja del mes (incluye consumo neto a ahorros).
  function balanceCajaMes(mes) {
    const t = totalesMes(mes);
    return t.balance - (t.aportes - t.retiros);
  }

  // Saldo al INICIO del mes dado. Punto de anclaje: saldoInicial.
  // - mes == ini.mes  → devuelve ini.monto.
  // - mes >  ini.mes  → camina hacia adelante sumando balances.
  // - mes <  ini.mes  → camina hacia atrás restando balances (mantiene la
  //   cadena consistente: pidas el rango que pidas en flujo, el saldo
  //   en cualquier mes da el mismo valor).
  function saldoInicioMes(mes) {
    const ini = App.state.saldoInicial || { mes: '', monto: 0 };
    if (!ini.mes) return 0;
    if (mes === ini.mes) return Number(ini.monto) || 0;

    let acc = Number(ini.monto) || 0;

    if (mes > ini.mes) {
      let cur = ini.mes;
      while (cur < mes) {
        const c = App.state.cierres?.[cur];
        if (c?.saldoFin != null && c?.saldoInicio != null && c.saldoInicio === acc) {
          acc = c.saldoFin;
        } else {
          acc += balanceCajaMes(cur);
        }
        cur = addMonths(cur, 1);
      }
      return acc;
    }

    // mes < ini.mes: walk backward
    let cur = ini.mes;
    while (cur > mes) {
      const prev = addMonths(cur, -1);
      acc -= balanceCajaMes(prev);
      cur = prev;
    }
    return acc;
  }

  function saldoFinMes(mes) {
    const c = App.state.cierres?.[mes];
    if (c?.saldoFin != null) return c.saldoFin;
    return saldoInicioMes(mes) + balanceCajaMes(mes);
  }

  return {
    totalesMes, totalAhorrado, distribucionGastos, mesesUltimos,
    gastoCategoriaMes, presupuestoCategoriaMes, estadoPresupuesto,
    montoEfectivo, getOverride, setOverride,
    isClosed, cerrarMes, reabrirMes,
    saldoInicioMes, saldoFinMes, balanceCajaMes
  };
})();
