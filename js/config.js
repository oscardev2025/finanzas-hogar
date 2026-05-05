window.App = window.App || {};

App.config = {
  STORAGE_KEY: 'finanzas_hogar_v1',

  defaultCategorias: [
    { id: 'cat_hogar',     nombre: 'Hogar',         color: '#1968ed' },
    { id: 'cat_servicios', nombre: 'Servicios',     color: '#0ea5e9' },
    { id: 'cat_comida',    nombre: 'Alimentación',  color: '#10b981' },
    { id: 'cat_transp',    nombre: 'Transporte',    color: '#f59e0b' },
    { id: 'cat_salud',     nombre: 'Salud',         color: '#ef4444' },
    { id: 'cat_ocio',      nombre: 'Ocio',          color: '#8b5cf6' },
    { id: 'cat_otros',     nombre: 'Otros',         color: '#64748b' }
  ],

  viewTitles: {
    dashboard:     ['Dashboard', 'Resumen de tus finanzas'],
    ingresosFijos: ['Ingresos Fijos', 'Sueldo y otros ingresos recurrentes mensuales'],
    ingresos:      ['Ingresos Variables', 'Ingresos puntuales con fecha (freelance, ventas, regalos…)'],
    fijos:         ['Gastos Fijos', 'Suscripciones y pagos recurrentes'],
    variables:     ['Gastos Variables', 'Gastos que surjan en el día a día'],
    presupuestos:  ['Presupuestos', 'Asigna un límite por categoría y mes'],
    ahorros:       ['Ahorros', 'Tus aportes y metas'],
    flujo:         ['Flujo de Caja', 'Histórico mes a mes'],
    ajustes:       ['Ajustes', 'Categorías y preferencias']
  },

  tailwind: {
    theme: {
      extend: {
        colors: {
          brand: {
            50:  '#eef7ff', 100: '#d9ecff', 200: '#bcdeff', 300: '#8dc8ff',
            400: '#57a8ff', 500: '#2f87ff', 600: '#1968ed', 700: '#1454d6',
            800: '#1644ab', 900: '#173d86'
          }
        },
        fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
      }
    }
  }
};

App.config.defaultState = {
  ingresosFijos: [],
  ingresos: [],
  fijos: [],
  variables: [],
  ahorros: [],
  presupuestos: [],
  categorias: App.config.defaultCategorias,
  metaAhorro: { monto: 0, descripcion: '' },
  moneda: '$',

  // Overrides mensuales por fijo / ingresoFijo:
  //   overrides.fijos[fijoId]['YYYY-MM'] = { monto?: number, omitido?: true, nota?: string }
  //   monto presente => sustituye al default; omitido === true => no aplica ese mes.
  overrides: { fijos: {}, ingresosFijos: {} },

  // Snapshots de meses cerrados:
  //   cierres['YYYY-MM'] = {
  //     cerradoEn: ISO,
  //     ingresosFijos: [{id,concepto,monto}],
  //     fijos: [{id,concepto,categoria,monto}],
  //     totales: { ingresosFijos, ingresosVariables, ingresos, fijos, variables, aportes, retiros, gastos, balance },
  //     saldoInicio, saldoFin
  //   }
  cierres: {},

  // Saldo de partida para el flujo de caja acumulado.
  saldoInicial: { mes: '', monto: 0 }
};
