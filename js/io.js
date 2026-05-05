window.App = window.App || {};

App.io = (function () {
  const { toast } = App.utils;

  function exportar() {
    const blob = new Blob([JSON.stringify(App.state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzas_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importar(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        App.store.replace(JSON.parse(reader.result));
        App.render();
        toast('Datos importados');
      } catch {
        alert('Archivo inválido.');
      }
    };
    reader.readAsText(file);
  }

  function reset() {
    if (!confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) return;
    App.store.reset();
    App.render();
    toast('Datos borrados');
  }

  function init() {
    document.getElementById('exportBtn').addEventListener('click', exportar);
    document.getElementById('importInput').addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) importar(file);
      e.target.value = '';
    });
    document.getElementById('resetBtn').addEventListener('click', reset);
  }

  return { init, exportar, importar, reset };
})();
