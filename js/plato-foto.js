// =====================================================================
// S14 · Mejora: RECONOCIMIENTO DE IMÁGENES en el Semáforo de hierro
// ---------------------------------------------------------------------
// Problema: el usuario solo elegía entre 3 casos fijos y no podía
// registrar lo que comió.
// Mejora: sube una foto del plato → se estiman los alimentos y su hierro
// → se suman al semáforo del día (meta 18 mg).
// Cómo "ve" (demostración, 100 % en el navegador, la foto no se sube):
//  1. Nombre del archivo ("lentejas.jpg") → confianza alta.
//  2. Colores de la foto (rojo oscuro = hígado/sangrecita, marrón =
//     menestras, verde = espinaca…) → confianza según cuánto ocupa.
// Principios HAI:
//  - Transparencia: dice QUÉ detectó, CON QUÉ CONFIANZA y CÓMO.
//  - Recuperación ante errores: cada alimento se puede cambiar o quitar,
//    y se pueden agregar los que faltan.
// =====================================================================
(function (global) {
  'use strict';

  // Hierro aproximado por porción de plato (valores de ejemplo)
  const ALIMENTOS = [
    { id: 'sangrecita', nombre: 'Sangrecita', mg: 10, sin: ['sangrecita', 'sangre'] },
    { id: 'higado', nombre: 'Hígado', mg: 7, sin: ['higado', 'higadito', 'encebollado'] },
    { id: 'bazo', nombre: 'Bazo', mg: 9, sin: ['bazo'] },
    { id: 'carne', nombre: 'Carne de res', mg: 3, sin: ['carne', 'res', 'bistec', 'lomo', 'saltado'] },
    { id: 'pollo', nombre: 'Pollo', mg: 1, sin: ['pollo', 'pechuga', 'gallina'] },
    { id: 'pescado', nombre: 'Pescado', mg: 2, sin: ['pescado', 'bonito', 'jurel', 'sardina', 'atun', 'ceviche'] },
    { id: 'huevo', nombre: 'Huevo', mg: 1, sin: ['huevo', 'tortilla'] },
    { id: 'lentejas', nombre: 'Lentejas', mg: 5, sin: ['lenteja', 'lentejas'] },
    { id: 'frejoles', nombre: 'Frejoles o pallares', mg: 4, sin: ['frejol', 'frejoles', 'frijol', 'pallar', 'pallares', 'menestra', 'garbanzo'] },
    { id: 'quinua', nombre: 'Quinua', mg: 2, sin: ['quinua', 'quinoa', 'kiwicha', 'canihua'] },
    { id: 'espinaca', nombre: 'Espinaca o acelga', mg: 3, sin: ['espinaca', 'acelga'] },
    { id: 'ensalada', nombre: 'Ensalada verde o brócoli', mg: 1, sin: ['ensalada', 'brocoli', 'lechuga', 'verdura'] },
    { id: 'arroz', nombre: 'Arroz', mg: 0.5, sin: ['arroz'] },
    { id: 'papa', nombre: 'Papa', mg: 1, sin: ['papa', 'papas', 'camote', 'yuca'] },
    { id: 'tomate', nombre: 'Tomate', mg: 0.5, sin: ['tomate'] },
    { id: 'citrico', nombre: 'Limón o naranja', mg: 0, sin: ['limon', 'naranja', 'mandarina', 'jugo'], vitC: true }
  ];
  const POR_ID = Object.fromEntries(ALIMENTOS.map(a => [a.id, a]));
  const META = 18;

  // Grupos de color → alimento más probable + alternativas
  const GRUPOS = [
    { id: 'rojo-oscuro', alimento: 'higado', alternativas: ['sangrecita', 'bazo', 'carne'], nombre: 'rojo oscuro' },
    { id: 'marron', alimento: 'lentejas', alternativas: ['frejoles', 'carne', 'quinua'], nombre: 'marrón' },
    { id: 'verde', alimento: 'espinaca', alternativas: ['ensalada'], nombre: 'verde' },
    { id: 'amarillo', alimento: 'papa', alternativas: ['huevo', 'quinua'], nombre: 'amarillo' },
    { id: 'naranja', alimento: 'citrico', alternativas: ['papa'], nombre: 'naranja' },
    { id: 'rojo-vivo', alimento: 'tomate', alternativas: ['carne'], nombre: 'rojo' },
    { id: 'blanco', alimento: 'arroz', alternativas: ['quinua', 'papa'], nombre: 'blanco' }
  ];

  function normalizar(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function rgbAHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return [h, max ? d / max : 0, max];
  }

  function grupoDePixel(r, g, b) {
    const [h, s, v] = rgbAHsv(r, g, b);
    if (v < 0.1) return null;                                  // sombras
    if (s < 0.14) return v > 0.78 ? 'blanco' : null;           // blancos (arroz o plato) / grises (mesa)
    const rojo = h <= 15 || h >= 340;
    if (rojo && s >= 0.35 && v < 0.5) return 'rojo-oscuro';
    if (rojo && s >= 0.5) return 'rojo-vivo';
    if (h > 15 && h <= 40 && s >= 0.6 && v >= 0.72) return 'naranja';
    if (h > 12 && h <= 45 && s >= 0.25 && v < 0.72) return h <= 25 && v < 0.42 && s >= 0.4 ? 'rojo-oscuro' : 'marron';
    if (h > 40 && h <= 65 && s >= 0.4 && v >= 0.5) return 'amarillo';
    if (h > 65 && h <= 170 && s >= 0.22 && v >= 0.18) return 'verde';
    return null;
  }

  // Analiza los píxeles (Uint8ClampedArray RGBA) → [{ alimento, confianza, como }]
  function analizarPixeles(datos) {
    const cuenta = {}; let total = 0;
    for (let i = 0; i < datos.length; i += 4) {
      if (datos[i + 3] < 128) continue;
      total++;
      const g = grupoDePixel(datos[i], datos[i + 1], datos[i + 2]);
      if (g) cuenta[g] = (cuenta[g] || 0) + 1;
    }
    if (!total) return [];
    const comida = Object.entries(cuenta).filter(([g]) => g !== 'blanco').reduce((a, [, n]) => a + n, 0);
    const res = [];
    GRUPOS.forEach(gr => {
      const n = cuenta[gr.id] || 0;
      const parte = n / total;
      if (gr.id === 'blanco') {
        // El blanco puede ser el plato: solo se propone arroz si hay comida y mucho blanco, con confianza baja
        if (parte >= 0.3 && comida / total >= 0.15) res.push({ alimento: gr.alimento, alternativas: gr.alternativas, confianza: 0.35, como: 'mucho color ' + gr.nombre + ' (podría ser el plato)' });
        return;
      }
      if (parte >= 0.08) {
        const confianza = Math.min(0.9, 0.4 + parte * 1.2);
        res.push({ alimento: gr.alimento, alternativas: gr.alternativas, confianza, como: 'color ' + gr.nombre + ' en el ' + Math.round(parte * 100) + ' % de la foto' });
      }
    });
    return res.sort((a, b) => b.confianza - a.confianza).slice(0, 4);
  }

  // Busca alimentos en el nombre del archivo: "almuerzo-lentejas-arroz.jpg"
  function analizarNombre(nombreArchivo) {
    const n = ' ' + normalizar(nombreArchivo).replace(/\.[a-z0-9]+$/, '').replace(/[^a-z]+/g, ' ') + ' ';
    return ALIMENTOS.filter(a => a.sin.some(s => n.includes(' ' + s + ' '))).map(a => ({ alimento: a.id, alternativas: [], confianza: 0.95, como: 'nombre del archivo' }));
  }

  // Combina ambas fuentes sin repetir alimentos (gana la de mayor confianza)
  function combinar(porNombre, porColor) {
    const mapa = new Map();
    porNombre.concat(porColor).forEach(d => { const prev = mapa.get(d.alimento); if (!prev || prev.confianza < d.confianza) mapa.set(d.alimento, d); });
    return Array.from(mapa.values()).sort((a, b) => b.confianza - a.confianza);
  }

  function estado(mg) {
    if (mg >= META) return { clase: 'verde', titulo: 'Semáforo en verde', texto: '¡Meta cumplida! Hoy comiste el hierro que necesitas.' };
    if (mg >= META / 2) return { clase: 'amarillo', titulo: 'Semáforo en amarillo', texto: 'Ya pasaste la mitad de tu meta. Te faltan ' + redondear(META - mg) + ' mg.' };
    return { clase: 'rojo', titulo: 'Semáforo en rojo', texto: 'Te faltan ' + redondear(META - mg) + ' mg. Prueba sumar sangrecita, hígado o menestras con limón.' };
  }
  function redondear(x) { return Math.round(x * 10) / 10; }

  const API = { ALIMENTOS, analizarPixeles, analizarNombre, combinar, estado, grupoDePixel, META };
  global.PlatoFoto = API;
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }

  // ---------- Interfaz ----------
  const CLAVE = 'mfp-diario-' + new Date().toISOString().slice(0, 10); // un diario por día, solo en este navegador
  function iniciar() {
    const raiz = document.querySelector('#mi-plato');
    if (!raiz) return;
    raiz.hidden = false;
    const entrada = raiz.querySelector('#foto-plato');
    const zonaAnalisis = raiz.querySelector('.plato-analisis');
    const vista = raiz.querySelector('.plato-vista');
    const listaDetectados = raiz.querySelector('.plato-detectados');
    const estadoTxt = raiz.querySelector('.plato-estado');
    const botonConfirmar = raiz.querySelector('.plato-confirmar');
    const botonManual = raiz.querySelector('.plato-manual-boton');
    const manual = raiz.querySelector('.plato-manual');
    const diarioLista = raiz.querySelector('.diario-lista');
    const diarioTotal = raiz.querySelector('.diario-total');
    const diarioBarra = raiz.querySelector('.diario-barra span');
    const diarioCaja = raiz.querySelector('.plato-diario');
    const diarioEstado = raiz.querySelector('.diario-estado');
    let detectados = [];
    let diario = [];
    try { diario = JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { diario = []; }

    function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(diario)); } catch (e) { /* sin almacenamiento */ } }

    // Lista manual (también sirve para agregar lo que la foto no detectó)
    ALIMENTOS.forEach(a => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'plato-chip';
      b.textContent = a.nombre + (a.mg ? ' · ' + a.mg + ' mg' : ' · vitamina C');
      b.addEventListener('click', () => {
        if (!zonaAnalisis.hidden) { // corrigiendo una foto: se agrega a los detectados
          if (!detectados.some(d => d.alimento === a.id)) detectados.push({ alimento: a.id, alternativas: [], confianza: 1, como: 'agregado por ti' });
          pintarDetectados();
        } else {
          agregarAlDiario([{ nombre: a.nombre, mg: a.mg, origen: 'lista' }]);
        }
      });
      manual.appendChild(b);
    });
    botonManual.addEventListener('click', () => {
      manual.hidden = !manual.hidden;
      botonManual.setAttribute('aria-expanded', String(!manual.hidden));
    });

    entrada.addEventListener('change', () => {
      const archivo = entrada.files && entrada.files[0];
      if (!archivo) return;
      if (!/^image\//.test(archivo.type)) { estadoTxt.textContent = 'Ese archivo no es una imagen. Prueba con una foto (JPG o PNG).'; return; }
      const url = URL.createObjectURL(archivo);
      const img = new Image();
      img.onload = () => {
        vista.src = url; vista.alt = 'Foto de tu plato';
        zonaAnalisis.hidden = false;
        estadoTxt.textContent = 'Analizando tu plato…';
        // Recorte central (evita bordes del plato y la mesa) a 96×96 px
        const lienzo = document.createElement('canvas'); const L = 96;
        lienzo.width = L; lienzo.height = L;
        const ctx = lienzo.getContext('2d', { willReadFrequently: true });
        const lado = Math.min(img.naturalWidth, img.naturalHeight) * 0.8;
        ctx.drawImage(img, (img.naturalWidth - lado) / 2, (img.naturalHeight - lado) / 2, lado, lado, 0, 0, L, L);
        let porColor = [];
        try { porColor = analizarPixeles(ctx.getImageData(0, 0, L, L).data); } catch (e) { porColor = []; }
        detectados = combinar(analizarNombre(archivo.name), porColor);
        pintarDetectados();
        manual.hidden = true;
        entrada.value = '';
      };
      img.onerror = () => { estadoTxt.textContent = 'No pude abrir esa imagen. Prueba con otra foto.'; };
      img.src = url;
    });

    function pintarDetectados() {
      listaDetectados.textContent = '';
      if (!detectados.length) {
        estadoTxt.textContent = 'No reconocí alimentos en la foto. Elígelos de la lista de abajo.';
        manual.hidden = false; botonManual.setAttribute('aria-expanded', 'true');
      } else {
        estadoTxt.textContent = 'Esto es lo que creo ver. Revisa y corrige antes de sumarlo.';
      }
      detectados.forEach((d, i) => {
        const a = POR_ID[d.alimento];
        const li = document.createElement('li'); li.className = 'detectado';
        const fila = document.createElement('div'); fila.className = 'detectado-fila';
        const sel = document.createElement('select'); sel.setAttribute('aria-label', 'Alimento detectado ' + (i + 1) + ' (puedes cambiarlo)');
        const opciones = [d.alimento].concat(d.alternativas || []).concat(ALIMENTOS.map(x => x.id)).filter((v, j, arr) => arr.indexOf(v) === j);
        opciones.forEach(id => { const o = document.createElement('option'); o.value = id; o.textContent = POR_ID[id].nombre + ' (' + POR_ID[id].mg + ' mg)'; sel.appendChild(o); });
        sel.value = d.alimento;
        sel.addEventListener('change', () => { d.alimento = sel.value; d.confianza = 1; d.como = 'corregido por ti'; pintarDetectados(); });
        const quitar = document.createElement('button'); quitar.type = 'button'; quitar.className = 'detectado-quitar'; quitar.textContent = '✕';
        quitar.setAttribute('aria-label', 'Quitar ' + a.nombre);
        quitar.addEventListener('click', () => { detectados.splice(i, 1); pintarDetectados(); });
        fila.append(sel, quitar);
        const conf = document.createElement('div'); conf.className = 'confianza';
        const barra = document.createElement('span'); barra.className = 'confianza-barra'; barra.style.setProperty('--valor', d.confianza);
        const txt = document.createElement('span'); txt.className = 'confianza-texto';
        txt.textContent = (d.confianza >= 1 ? 'Seguro' : 'Confianza ' + Math.round(d.confianza * 100) + ' %') + ' · ' + d.como;
        conf.append(barra, txt);
        li.append(fila, conf);
        listaDetectados.appendChild(li);
      });
      const total = detectados.reduce((s, d) => s + POR_ID[d.alimento].mg, 0);
      botonConfirmar.disabled = !detectados.length;
      botonConfirmar.textContent = 'Sumar ' + redondear(total) + ' mg a mi día';
    }

    botonConfirmar.addEventListener('click', () => {
      const vitC = detectados.some(d => POR_ID[d.alimento].vitC);
      agregarAlDiario(detectados.map(d => ({ nombre: POR_ID[d.alimento].nombre, mg: POR_ID[d.alimento].mg, origen: 'foto' })));
      zonaAnalisis.hidden = true; detectados = [];
      if (vitC) diarioEstado.dataset.extra = 'Bien: el limón o la naranja ayudan a absorber el hierro.';
    });
    raiz.querySelector('.plato-cancelar').addEventListener('click', () => { zonaAnalisis.hidden = true; detectados = []; estadoTxt.textContent = ''; });

    function agregarAlDiario(items) { diario = diario.concat(items); guardar(); pintarDiario(true); }
    document.addEventListener('diario:agregar', e => agregarAlDiario([{ nombre: e.detail.nombre, mg: e.detail.mg, origen: e.detail.origen || 'menú' }]));

    function pintarDiario(cambio) {
      diarioLista.textContent = '';
      diario.forEach((d, i) => {
        const li = document.createElement('li');
        li.append(d.nombre + ' · ' + d.mg + ' mg ');
        const o = document.createElement('span'); o.className = 'diario-origen'; o.textContent = '(' + d.origen + ')'; li.appendChild(o);
        const x = document.createElement('button'); x.type = 'button'; x.className = 'detectado-quitar'; x.textContent = '✕'; x.setAttribute('aria-label', 'Quitar ' + d.nombre + ' del diario');
        x.addEventListener('click', () => { diario.splice(i, 1); guardar(); pintarDiario(true); });
        li.appendChild(x);
        diarioLista.appendChild(li);
      });
      const mg = redondear(diario.reduce((s, d) => s + d.mg, 0));
      const e = estado(mg);
      diarioCaja.dataset.estado = e.clase;
      diarioTotal.textContent = mg + ' mg de 18 mg';
      diarioBarra.style.setProperty('--avance', Math.min(1, mg / META));
      diarioEstado.textContent = (diario.length ? e.titulo + '. ' + e.texto : 'Todavía no registras comidas hoy.') + (diarioEstado.dataset.extra && diario.length ? ' ' + diarioEstado.dataset.extra : '');
      raiz.querySelector('.diario-reiniciar').hidden = !diario.length;
      if (cambio) { diarioCaja.classList.remove('pulso'); void diarioCaja.offsetWidth; diarioCaja.classList.add('pulso'); }
    }
    raiz.querySelector('.diario-reiniciar').addEventListener('click', () => { diario = []; delete diarioEstado.dataset.extra; guardar(); pintarDiario(true); });
    pintarDiario(false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})(typeof window !== 'undefined' ? window : globalThis);
