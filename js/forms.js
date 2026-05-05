window.App = window.App || {};

App.forms = (function () {
  const { uid, toast, setToday } = App.utils;

  function bindIngreso() {
    document.getElementById('formIngreso').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      App.state.ingresos.push({
        id: uid(),
        fecha: f.get('fecha'),
        concepto: f.get('concepto'),
        monto: parseFloat(f.get('monto'))
      });
      App.store.save(); App.render(); e.target.reset(); toast('Ingreso agregado');
    });
  }

  function bindFijo() {
    document.getElementById('formFijo').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      App.state.fijos.push({
        id: uid(),
        concepto: f.get('concepto'),
        categoria: f.get('categoria'),
        monto: parseFloat(f.get('monto'))
      });
      App.store.save(); App.render(); e.target.reset(); toast('Gasto fijo agregado');
    });
  }

  function bindVariable() {
    const form = document.getElementById('formVariable');
    const hint = document.getElementById('hintPresupuestoVar');
    const { fmt, ymKey, getCategoria } = App.utils;

    function updateHint() {
      const cat = form.querySelector('select[name="categoria"]').value;
      const fecha = form.querySelector('input[name="fecha"]').value;
      if (!cat || !fecha) { hint.classList.add('hidden'); return; }
      const mes = ymKey(fecha);
      const p = App.state.presupuestos.find(x => x.categoria === cat && x.mes === mes);
      if (!p) { hint.classList.add('hidden'); return; }
      const { restante, excedido } = App.calc.estadoPresupuesto(p);
      const c = getCategoria(cat);
      hint.classList.remove('hidden');
      hint.innerHTML = excedido
        ? `<span class="text-rose-600 font-medium">⚠ ${c.nombre}: presupuesto excedido por ${fmt(Math.abs(restante))}</span>`
        : `<span style="color:${c.color}">●</span> Presupuesto restante en <strong>${c.nombre}</strong>: <strong>${fmt(restante)}</strong>`;
    }
    form.querySelector('select[name="categoria"]').addEventListener('change', updateHint);
    form.querySelector('input[name="fecha"]').addEventListener('change', updateHint);
    App.views.variables.updateHint = updateHint;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      App.state.variables.push({
        id: uid(),
        fecha: f.get('fecha'),
        concepto: f.get('concepto'),
        categoria: f.get('categoria'),
        monto: parseFloat(f.get('monto'))
      });
      App.store.save(); App.render(); e.target.reset();
      hint.classList.add('hidden');
      toast('Gasto agregado');
    });
  }

  function bindPresupuesto() {
    document.getElementById('formPresupuesto').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const categoria = f.get('categoria');
      const mes = f.get('mes');
      const monto = parseFloat(f.get('monto'));
      const existente = App.state.presupuestos.find(p => p.categoria === categoria && p.mes === mes);
      if (existente) {
        existente.monto = monto;
        toast('Presupuesto actualizado');
      } else {
        App.state.presupuestos.push({ id: uid(), categoria, mes, monto });
        toast('Presupuesto asignado');
      }
      App.store.save(); App.render(); e.target.reset();
    });
  }

  function bindAhorro() {
    document.getElementById('formAhorro').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      App.state.ahorros.push({
        id: uid(),
        fecha: f.get('fecha'),
        concepto: f.get('concepto'),
        tipo: f.get('tipo'),
        monto: parseFloat(f.get('monto'))
      });
      App.store.save(); App.render(); e.target.reset(); toast('Movimiento de ahorro agregado');
    });
  }

  function bindMeta() {
    document.getElementById('formMeta').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      App.state.metaAhorro = {
        monto: parseFloat(f.get('meta')) || 0,
        descripcion: f.get('descripcion') || ''
      };
      App.store.save(); App.render(); toast('Meta guardada');
    });
  }

  function bindCategoria() {
    document.getElementById('formCategoria').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      App.state.categorias.push({
        id: 'cat_' + uid(),
        nombre: f.get('nombre'),
        color: f.get('color')
      });
      App.store.save(); App.render(); e.target.reset(); toast('Categoría creada');
    });
  }

  function bindEliminaciones() {
    document.body.addEventListener('click', e => {
      const del = e.target.dataset.del;
      if (del) {
        const id = e.target.dataset.id;
        if (!confirm('¿Eliminar este registro?')) return;
        App.state[del] = App.state[del].filter(x => x.id !== id);
        App.store.save(); App.render(); toast('Eliminado');
        return;
      }
      if (e.target.dataset.delcat) {
        const cid = e.target.dataset.delcat;
        const usada = App.state.fijos.some(f => f.categoria === cid)
                   || App.state.variables.some(v => v.categoria === cid);
        if (usada) {
          alert('No se puede eliminar: hay gastos asignados a esta categoría.');
          return;
        }
        App.state.categorias = App.state.categorias.filter(c => c.id !== cid);
        App.store.save(); App.render();
      }
    });
  }

  function bindMoneda() {
    document.getElementById('inputMoneda').addEventListener('change', e => {
      App.state.moneda = e.target.value || '$';
      App.store.save(); App.render();
    });
  }

  function init() {
    bindIngreso();
    bindFijo();
    bindVariable();
    bindPresupuesto();
    bindAhorro();
    bindMeta();
    bindCategoria();
    bindEliminaciones();
    bindMoneda();
    document.querySelectorAll('form').forEach(setToday);
  }

  return { init };
})();
