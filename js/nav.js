window.App = window.App || {};

App.nav = (function () {
  const { ymKey } = App.utils;
  const titles = App.config.viewTitles;

  let currentMonth = ymKey(new Date());

  function buildMonthOptions() {
    const sel = document.getElementById('monthSelector');
    if (!sel) return;
    sel.value = currentMonth;
    App.nav.currentMonth = currentMonth;
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
      if (!e.target.value) { e.target.value = currentMonth; return; }
      currentMonth = e.target.value;
      App.nav.currentMonth = currentMonth;
      App.views.dashboard.render();
    });
    document.getElementById('sidebarToggle')?.addEventListener('click', openSidebar);
    document.getElementById('sidebarBackdrop')?.addEventListener('click', closeSidebar);
  }

  return { init, buildMonthOptions, show, get currentMonth() { return currentMonth; } };
})();
