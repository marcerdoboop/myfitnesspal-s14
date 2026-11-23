// =====================================================================
// S14 · Mejora: RECOMENDACIONES PERSONALIZADAS en Menús (#menus)
// ---------------------------------------------------------------------
// Problema: los menús eran iguales para todos y no consideraban gustos
// ni restricciones (no come hígado, es vegetariano…).
// Mejora: filtros de preferencia + "¿Por qué te lo recomendamos?".
// Principios HAI:
//  - Transparencia: cada menú explica por qué se recomienda y se dice
//    cuántos se ocultaron y por qué.
//  - Control del usuario: el usuario elige sus filtros, puede quitarlos
//    con un toque y ver todos. Se recuerdan solo en este navegador.
// =====================================================================
(function (global) {
  'use strict';

  // Valores de hierro y costo inventados para la demostración (igual que la versión anterior)
  const MENUS = [
    { id: 'lentejas', nombre: 'Lentejas con arroz y ensalada de tomate con limón', mg: 6, costo: 6, etiquetas: ['vegetariano', 'menestra'], vitC: 'limón', ingredientes: 'lentejas, arroz, tomate, limón', preparacion: 'cocinar las lentejas y servirlas con arroz.' },
    { id: 'frejoles', nombre: 'Frejoles con arroz y zarza criolla', mg: 5, costo: 7, etiquetas: ['vegetariano', 'menestra'], vitC: 'limón', ingredientes: 'frejoles, arroz, cebolla, limón', preparacion: 'guisar los frejoles y servir con la zarza.' },
    { id: 'tortilla', nombre: 'Tortilla de quinua con ensalada de espinaca', mg: 4, costo: 8, etiquetas: ['vegetariano', 'huevo'], vitC: 'limón', ingredientes: 'quinua, huevo, espinaca, limón', preparacion: 'mezclar la quinua con el huevo y freír en sartén.' },
    { id: 'pallares-huevo', nombre: 'Guiso de pallares con espinaca y huevo, con jugo de naranja', mg: 7, costo: 11, etiquetas: ['vegetariano', 'menestra', 'huevo'], vitC: 'naranja', ingredientes: 'pallares, espinaca, huevo, naranja', preparacion: 'guisar los pallares con la espinaca y servir con huevo sancochado.', nuevo: true },
    { id: 'sangrecita', nombre: 'Sangrecita salteada con arroz', mg: 11, costo: 12, etiquetas: ['visceras', 'animal'], ingredientes: 'sangrecita, cebolla, ají panca, arroz', preparacion: 'saltear la sangrecita con cebolla y ají.' },
    { id: 'higado', nombre: 'Hígado encebollado con arroz y papa', mg: 9, costo: 13, etiquetas: ['visceras', 'animal'], ingredientes: 'hígado, cebolla, arroz, papa', preparacion: 'dorar el hígado con cebolla a fuego alto.' },
    { id: 'lentejas-pollo', nombre: 'Lentejas con pollo y ensalada de betarraga con naranja', mg: 7, costo: 14, etiquetas: ['menestra', 'animal'], vitC: 'naranja', ingredientes: 'lentejas, pollo, betarraga, naranja', preparacion: 'cocinar las lentejas con el pollo desmenuzado.' },
    { id: 'quinua-lentejas', nombre: 'Quinua con lentejas y brócoli al limón', mg: 8, costo: 14, etiquetas: ['vegetariano', 'menestra'], vitC: 'limón', ingredientes: 'quinua, lentejas, brócoli, limón', preparacion: 'cocinar la quinua y las lentejas por separado y mezclarlas con el brócoli.', nuevo: true },
    { id: 'sangrecita-quinua', nombre: 'Sangrecita con quinua y ensalada con naranja', mg: 12, costo: 16, etiquetas: ['visceras', 'animal'], vitC: 'naranja', ingredientes: 'sangrecita, quinua, tomate, naranja', preparacion: 'saltear la sangrecita y servir sobre la quinua.' },
    { id: 'higado-plancha', nombre: 'Hígado a la plancha con quinua y ensalada con limón', mg: 10, costo: 18, etiquetas: ['visceras', 'animal'], vitC: 'limón', ingredientes: 'hígado, quinua, tomate, limón', preparacion: 'cocinar el hígado a la plancha con poco aceite.' },
    { id: 'pallares-bonito', nombre: 'Pallares con bonito y arroz', mg: 6, costo: 19, etiquetas: ['menestra', 'pescado', 'animal'], ingredientes: 'pallares, bonito, arroz, ají amarillo', preparacion: 'guisar los pallares y agregar el bonito en trozos.' }
  ];

  const FILTROS = {
    vegetariano: { etiqueta: 'Soy vegetariano/a', excluye: m => !m.etiquetas.includes('vegetariano'), motivo: 'tienen carne, vísceras o pescado', razon: 'Es vegetariano, como pediste.' },
    'sin-visceras': { etiqueta: 'No como hígado ni sangrecita', excluye: m => m.etiquetas.includes('visceras'), motivo: 'tienen hígado o sangrecita', razon: 'No tiene hígado ni sangrecita.' },
    'sin-pescado': { etiqueta: 'No como pescado', excluye: m => m.etiquetas.includes('pescado'), motivo: 'tienen pescado', razon: 'No tiene pescado.' },
    'sin-huevo': { etiqueta: 'No como huevo', excluye: m => m.etiquetas.includes('huevo'), motivo: 'tienen huevo', razon: 'No tiene huevo.' }
  };
  const META = 18;

  // Recomendación pura (se prueba en Node): devuelve los menús y por qué
  function recomendar(presupuesto, prefs) {
    const activos = Object.keys(FILTROS).filter(k => prefs[k]);
    const ocultos = {};
    let enPresupuesto = 0;
    const candidatos = MENUS.filter(m => {
      if (m.costo > presupuesto) return false;
      enPresupuesto++;
      const motivo = activos.find(k => FILTROS[k].excluye(m));
      if (motivo) { ocultos[motivo] = (ocultos[motivo] || 0) + 1; return false; }
      return true;
    });
    const puntaje = m => m.mg + (prefs.menestras && m.etiquetas.includes('menestra') ? 6 : 0);
    const elegidos = candidatos.sort((a, b) => puntaje(b) - puntaje(a) || a.costo - b.costo).slice(0, 3);
    return {
      menus: elegidos.map(m => ({ ...m, razones: razones(m, presupuesto, prefs, activos) })),
      ocultos, enPresupuesto, activos
    };
  }

  function razones(m, presupuesto, prefs, activos) {
    const r = ['Aporta **' + m.mg + ' mg** de hierro: el ' + Math.round(m.mg / META * 100) + ' % de tu meta diaria de 18 mg.'];
    r.push('Cuesta **S/ ' + m.costo + '**, dentro de tu presupuesto de S/ ' + presupuesto + '.');
    activos.filter(k => !(activos.includes('vegetariano') && (k === 'sin-visceras' || k === 'sin-pescado'))).forEach(k => r.push(FILTROS[k].razon));
    if (prefs.menestras && m.etiquetas.includes('menestra')) r.push('Tiene menestras, que marcaste como tus favoritas.');
    if (m.etiquetas.includes('visceras')) r.push('Su hierro es de origen animal (hemínico): el cuerpo lo absorbe mejor.');
    else if (m.vitC) r.push('Lleva ' + m.vitC + ': su vitamina C ayuda a absorber el hierro de las menestras y verduras.');
    return r;
  }

  const API = { MENUS, FILTROS, recomendar };
  global.MenusPersonalizados = API;
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }

  // ---------- Interfaz ----------
  const CLAVE = 'mfp-preferencias-menu';
  function iniciar() {
    const panelPrefs = document.querySelector('#preferencias-menu');
    const fieldset = document.querySelector('#menus fieldset.orientador');
    if (!panelPrefs || !fieldset) return;
    const resultados = fieldset.querySelector('.resultados');
    const contenedor = document.createElement('div');
    contenedor.className = 'recomendados';
    contenedor.setAttribute('aria-live', 'polite');
    resultados.appendChild(contenedor);
    fieldset.classList.add('personalizado');
    panelPrefs.hidden = false;

    let prefs = {};
    try { prefs = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { prefs = {}; }
    panelPrefs.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = !!prefs[c.value]; });

    function presupuesto() {
      const r = fieldset.querySelector('input[name="presupuesto"]:checked');
      return r ? parseInt(r.id.replace('p', ''), 10) : 10;
    }

    function negritas(destino, texto) {
      texto.split(/(\*\*[^*]+\*\*)/g).forEach(t => {
        if (!t) return;
        if (t.startsWith('**')) { const b = document.createElement('strong'); b.textContent = t.slice(2, -2); destino.appendChild(b); }
        else destino.appendChild(document.createTextNode(t));
      });
    }

    function pintar() {
      const p = presupuesto();
      const r = recomendar(p, prefs);
      contenedor.textContent = '';

      const cabecera = document.createElement('p');
      cabecera.className = 'recomendados-resumen';
      const totalOcultos = Object.values(r.ocultos).reduce((a, b) => a + b, 0);
      cabecera.append(r.activos.length || prefs.menestras ? 'Recomendados para ti con S/ ' + p + ' al día.' : 'Menús ricos en hierro con S/ ' + p + ' al día. Marca tus preferencias para personalizarlos.');
      contenedor.appendChild(cabecera);

      if (!r.menus.length) {
        const vacio = document.createElement('div'); vacio.className = 'recomendados-vacio';
        const t = document.createElement('p'); t.textContent = 'Ningún menú de hasta S/ ' + p + ' cumple todas tus preferencias.';
        const s = document.createElement('p'); s.textContent = 'Prueba con un presupuesto mayor o quita algún filtro.';
        vacio.append(t, s); contenedor.appendChild(vacio);
      }

      const ul = document.createElement('ul'); ul.className = 'recomendados-lista';
      r.menus.forEach((m, i) => {
        const li = document.createElement('li'); li.className = 'menu-tarjeta'; li.style.setProperty('--i', i);
        const h = document.createElement('h3'); h.textContent = m.nombre;
        if (m.nuevo) { const n = document.createElement('span'); n.className = 'menu-nuevo'; n.textContent = 'Nuevo'; h.append(' ', n); }
        const datos = document.createElement('p'); datos.className = 'menu-datos';
        datos.textContent = 'Hierro: ' + m.mg + ' mg · Costo: S/ ' + m.costo;
        const prep = document.createElement('p'); prep.className = 'menu-prep';
        prep.textContent = 'Ingredientes: ' + m.ingredientes + '. Preparación: ' + m.preparacion;
        const d = document.createElement('details'); d.className = 'menu-porque';
        const sm = document.createElement('summary'); sm.textContent = '¿Por qué te lo recomendamos?';
        const lr = document.createElement('ul');
        m.razones.forEach(t => { const x = document.createElement('li'); negritas(x, t); lr.appendChild(x); });
        d.append(sm, lr);
        const agregar = document.createElement('button'); agregar.type = 'button'; agregar.className = 'boton menu-agregar'; agregar.textContent = 'Agregar al diario';
        agregar.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('diario:agregar', { detail: { nombre: m.nombre, mg: m.mg, origen: 'menú' } }));
          agregar.textContent = '✓ Agregado al diario';
          setTimeout(() => { agregar.textContent = 'Agregar al diario'; }, 2200);
        });
        li.append(h, datos, prep, d, agregar);
        ul.appendChild(li);
      });
      contenedor.appendChild(ul);

      if (totalOcultos) {
        const o = document.createElement('p'); o.className = 'recomendados-ocultos';
        const partes = Object.entries(r.ocultos).map(([k, n]) => n + (n === 1 ? ' menú que ' + FILTROS[k].motivo.replace('tienen', 'tiene') : ' menús que ' + FILTROS[k].motivo));
        o.textContent = 'Ocultamos ' + partes.join(' y ') + ', según tus preferencias.';
        const ver = document.createElement('button'); ver.type = 'button'; ver.className = 'pref-limpiar'; ver.textContent = 'Ver todos';
        ver.addEventListener('click', limpiar);
        o.append(' ', ver);
        contenedor.appendChild(o);
      }
    }

    function limpiar() {
      prefs = {};
      panelPrefs.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = false; });
      guardar(); pintar();
    }
    function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(prefs)); } catch (e) { /* sin almacenamiento */ } }

    panelPrefs.addEventListener('change', e => {
      if (e.target.type !== 'checkbox') return;
      prefs[e.target.value] = e.target.checked;
      // vegetariano implica sin vísceras ni pescado: se marcan para que se vea la consecuencia
      if (e.target.value === 'vegetariano' && e.target.checked) {
        ['sin-visceras', 'sin-pescado'].forEach(k => { prefs[k] = true; const c = panelPrefs.querySelector('input[value="' + k + '"]'); if (c) c.checked = true; });
      }
      guardar(); pintar();
    });
    panelPrefs.querySelector('.pref-limpiar').addEventListener('click', limpiar);
    fieldset.addEventListener('change', e => { if (e.target.name === 'presupuesto') pintar(); });
    pintar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})(typeof window !== 'undefined' ? window : globalThis);
