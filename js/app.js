window.App = window.App || {};

App.render = function render() {
  App.nav.buildMonthOptions();
  App.views.dashboard.render();
  App.views.ingresos.render();
  App.views.fijos.render();
  App.views.variables.render();
  App.views.presupuestos.render();
  App.views.ahorros.render();
  App.views.flujo.render();
  App.views.ajustes.render();
};

let booted = false;

async function bootApp() {
  if (booted) return;
  booted = true;

  App.nav.init();
  App.forms.init();
  App.bulk.init();
  App.io.init();

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) App.auth.logout();
  });

  await App.store.loadFromServer();
  App.render();
}

App.init = async function init() {
  const authed = await App.auth.check();
  App.auth.bindForm(bootApp);
  if (authed) {
    await bootApp();
  } else {
    App.auth.show();
  }
};

document.addEventListener('DOMContentLoaded', App.init);
