window.App = window.App || {};

App.nav = (function () {
  const { ymKey, ymLabel } = App.utils;
  const titles = App.config.viewTitles;

  let currentMonth = ymKey(new Date());

  function buildMonthOptions() {
    const sel = document.getElementById('monthSelector');
    const months = new Set();
    [...App.state.ingresos, ...App.state.variables, ...App.state.ahorros]
      .forEach(i => months.add(ymKey(i.fecha)));
    months.add(ymKey(new Date()));
    const arr = [...months].sort().reverse();
    if (!arr.includes(currentMonth)) currentMonth = arr[0];
    App.nav.currentMonth = currentMonth;
    sel.innerHTML = arr.map(k =>
      `<option value="${k}" ${k === currentMonth ? 'selected' : ''}>${ymLabel(k)}</option>`
    ).join('');
  }

  // Vistas que realmente filtran su contenido por el mes seleccionado.
  const VIEWS_WITH_MONTH = new Set(['dashboard']);

  function openSidebar() {
    document.getElementById('sidebar').classList.remove('-translate-x-full');
    document.getElementById('sidebarBackdrop').classList.remove('hidden');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebarBackdrop').classList.add('hidden');
  }

  function show(view) {
    document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
    document.querySelector(`.nav-item[data-view="${view}"]`).classList.add('active');

    document.querySelectorAll('.view').forEach(x => x.classList.add('hidden'));
    const sec = document.getElementById('view-' + view);
    sec.classList.remove('hidden');
    sec.classList.remove('fade-in'); void sec.offsetWidth; sec.classList.add('fade-in');

    document.getElementById('viewTitle').textContent = titles[view][0];
    document.getElementById('viewSubtitle').textContent = titles[view][1];

    document.getElementById('monthSelector').classList.toggle('hidden', !VIEWS_WITH_MONTH.has(view));

    // En móvil cerrar el drawer al elegir vista.
    if (window.matchMedia('(max-width: 1023px)').matches) closeSidebar();
  }

  function init() {
    document.querySelectorAll('.nav-item').forEach(b =>
      b.addEventListener('click', () => show(b.dataset.view))
    );
    document.getElementById('monthSelector').addEventListener('change', e => {
      currentMonth = e.target.value;
      App.nav.currentMonth = currentMonth;
      App.views.dashboard.render();
    });
    document.getElementById('sidebarToggle')?.addEventListener('click', openSidebar);
    document.getElementById('sidebarBackdrop')?.addEventListener('click', closeSidebar);
  }

  return { init, buildMonthOptions, show, get currentMonth() { return currentMonth; } };
})();
