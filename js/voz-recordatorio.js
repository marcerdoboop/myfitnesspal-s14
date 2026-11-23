// =====================================================================
// S14 · Mejora: VOZ en Recordatorios (#contacto)
// ---------------------------------------------------------------------
// Problema: el formulario pide 5 campos y un checkbox; en el celular es
// incómodo. Mejora: dictar "suplemento de hierro, todos los días, a las 8"
// y el formulario se rellena solo.
// Principios HAI:
//  - Control del usuario: NUNCA se envía solo; la persona revisa, corrige
//    y marca "Entiendo que es una simulación". Botón "Deshacer".
//  - Recuperación ante errores: dice qué entendió y qué NO; si la hora no
//    existe en la lista, elige la más cercana y lo avisa; si el navegador
//    no tiene micrófono, se puede escribir la misma frase.
// =====================================================================
(function (global) {
  'use strict';

  // ---------- 1. Intérprete de la frase (puro: se prueba en Node) ----------
  const NUMEROS = { una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12 };
  const HORAS = { manana: '8:00 a. m.', mediodia: '12:00 m.', noche: '8:00 p. m.' };

  function normalizar(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!,;]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function interpretar(texto) {
    const n = ' ' + normalizar(texto) + ' ';
    const r = { tipo: null, frecuencia: null, hora: null, nombre: null, correo: null, avisos: [] };

    // Tipo de recordatorio
    if (/(control|examen|analisis|chequeo|cita|hemoglobina|medico|doctor|tamizaje)/.test(n)) r.tipo = 'Control de hemoglobina';
    else if (/(suplemento|hierro|pastilla|sulfato|jarabe|gotas|vitamina|chispitas|micronutriente|tableta|capsula|medicina)/.test(n)) r.tipo = 'Suplemento de hierro';

    // Frecuencia
    if (/(todos los dias|todo los dias|diario|diariamente|cada dia|a diario|cada manana|cada noche|toda la semana)/.test(n)) r.frecuencia = 'Todos los días';
    else if (/(cada semana|semanal|semanalmente|una vez a la semana|los (lunes|martes|miercoles|jueves|viernes|sabados|domingos)|cada (lunes|martes|miercoles|jueves|viernes|sabado|domingo))/.test(n)) r.frecuencia = 'Cada semana';
    else if (/(cada mes|mensual|mensualmente|una vez al mes|al mes)/.test(n)) r.frecuencia = 'Cada mes';

    // Hora
    const momentoNoche = /(noche|p ?m\b|pm\b|antes de dormir|cena|de la tarde)/.test(n);
    const momentoManana = /(manana|a ?m\b|am\b|desayuno|al despertar|temprano)/.test(n);
    const momentoMediodia = /(mediodia|medio dia|almuerzo)/.test(n);
    let num = null;
    const m = n.match(/a las? (\d{1,2})(?::(\d{2}))?|(\d{1,2}):(\d{2})|(\d{1,2}) ?(?:de la|en la|a ?m|p ?m|horas|hrs)/);
    if (m) num = parseInt(m[1] || m[3] || m[5], 10);
    else {
      const w = n.match(/a las? (una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\b/);
      if (w) num = NUMEROS[w[1]];
    }
    if (num !== null) {
      // Pasar a formato 24 h según el momento del día que se dijo
      let h = num;
      if (num === 12) h = 12;
      else if (num > 12) h = num;                         // "20 horas"
      else if (momentoNoche) h = num + 12;                 // "8 de la noche"
      else if (momentoManana) h = num;                     // "8 de la mañana"
      else if (num >= 1 && num <= 6) h = num + 12;         // "a las 3" → de la tarde
      // Elegir el horario disponible más cercano (8, 12 o 20 h)
      const opciones = [[8, HORAS.manana], [12, HORAS.mediodia], [20, HORAS.noche]];
      const [hMasCercana, etiqueta] = opciones.reduce((a, b) => (Math.abs(b[0] - h) < Math.abs(a[0] - h) ? b : a));
      r.hora = etiqueta;
      if (hMasCercana !== h) {
        r.avisos.push('Solo hay 3 horarios (8:00 a. m., 12:00 m. y 8:00 p. m.). Elegí el más cercano a lo que dijiste (' + etiqueta + '); cámbialo si prefieres otro.');
      } else if (num === 8 && !momentoNoche && !momentoManana) {
        r.avisos.push('Entendí 8 de la mañana. Si era de la noche, elige 8:00 p. m.');
      }
    } else if (momentoMediodia) r.hora = HORAS.mediodia;
    else if (momentoNoche) r.hora = HORAS.noche;
    else if (momentoManana) r.hora = HORAS.manana;

    // Nombre ("me llamo Ana", "mi nombre es Ana")
    const nom = String(texto).match(/(?:me llamo|mi nombre es|soy)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ]+)/i);
    if (nom && !/^(un|una|el|la|mama|papa)$/i.test(nom[1])) r.nombre = nom[1].charAt(0).toUpperCase() + nom[1].slice(1).toLowerCase();

    // Correo dictado: "ana arroba gmail punto com"
    const c = n.match(/([a-z0-9._ ]+?) arroba ([a-z0-9 ]+?) punto (com|pe|org|net|edu)(?: punto (pe|com))?\b/);
    if (c) {
      const usuario = c[1].trim().split(' ').pop();
      r.correo = usuario + '@' + c[2].replace(/\s+/g, '') + '.' + c[3] + (c[4] ? '.' + c[4] : '');
    }

    if (!r.tipo) r.avisos.push('No entendí qué quieres recordar. Di “suplemento” o “control de hemoglobina”.');
    if (!r.frecuencia) r.avisos.push('No entendí cada cuánto. Di “todos los días”, “cada semana” o “cada mes”.');
    if (!r.hora) r.avisos.push('No entendí la hora. Di “a las 8 de la mañana”, “a las 12” o “a las 8 de la noche”.');
    return r;
  }

  const API = { interpretar, normalizar };
  global.VozRecordatorio = API;
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }

  // ---------- 2. Interfaz (solo en el navegador) ----------
  function iniciar() {
    const caja = document.querySelector('#dictado-recordatorio');
    if (!caja) return;
    const form = caja.closest('form');
    const boton = caja.querySelector('.dictado-boton');
    const campoFrase = caja.querySelector('#frase-recordatorio');
    const botonUsar = caja.querySelector('.dictado-usar');
    const estado = caja.querySelector('.dictado-estado');
    const resumen = caja.querySelector('.dictado-resumen');
    const campos = { nombre: form.querySelector('#nombre'), correo: form.querySelector('#correo'), tipo: form.querySelector('#tipo'), frecuencia: form.querySelector('#frecuencia'), hora: form.querySelector('#hora') };
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)');
    let copia = null;

    caja.hidden = false;

    function rellenar(texto) {
      const r = interpretar(texto);
      copia = {}; Object.entries(campos).forEach(([k, el]) => { copia[k] = el.value; });
      const llenados = [];
      [['tipo', r.tipo, '¿Qué?'], ['frecuencia', r.frecuencia, '¿Cada cuánto?'], ['hora', r.hora, '¿A qué hora?'], ['nombre', r.nombre, 'Nombre'], ['correo', r.correo, 'Correo']].forEach(([k, v, etiqueta]) => {
        if (!v) return;
        campos[k].value = v;
        llenados.push({ etiqueta, valor: v, campo: campos[k] });
        campos[k].classList.remove('recien-llenado'); void campos[k].offsetWidth; campos[k].classList.add('recien-llenado');
      });
      pintarResumen(texto, llenados, r.avisos);
    }

    function pintarResumen(texto, llenados, avisos) {
      resumen.textContent = '';
      resumen.hidden = false;
      const oido = document.createElement('p'); oido.className = 'dictado-oido';
      oido.append('Escuché: ');
      const q = document.createElement('q'); q.textContent = texto; oido.appendChild(q);
      resumen.appendChild(oido);
      if (llenados.length) {
        const ul = document.createElement('ul'); ul.className = 'dictado-lista';
        llenados.forEach(l => { const li = document.createElement('li'); const b = document.createElement('strong'); b.textContent = l.etiqueta + ' '; li.append('✓ ', b, l.valor); ul.appendChild(li); });
        resumen.appendChild(ul);
      }
      avisos.forEach(a => { const p = document.createElement('p'); p.className = 'dictado-aviso'; p.textContent = '⚠ ' + a; resumen.appendChild(p); });
      const pie = document.createElement('p'); pie.className = 'dictado-pie';
      pie.textContent = llenados.length ? 'Revisa los campos, corrige lo que haga falta y marca la casilla final. No se envía nada hasta que pulses “Programar recordatorio”.' : 'No llené ningún campo. Intenta de nuevo o complétalos a mano.';
      resumen.appendChild(pie);
      if (llenados.length) {
        const deshacer = document.createElement('button'); deshacer.type = 'button'; deshacer.className = 'dictado-deshacer'; deshacer.textContent = 'Deshacer relleno';
        deshacer.addEventListener('click', () => {
          if (!copia) return;
          Object.entries(campos).forEach(([k, el]) => { el.value = copia[k]; });
          copia = null; resumen.hidden = true; estado.textContent = 'Listo, dejé el formulario como estaba.';
        });
        resumen.appendChild(deshacer);
      }
      estado.textContent = llenados.length ? 'Llené ' + llenados.length + (llenados.length === 1 ? ' campo.' : ' campos.') + (avisos.length ? ' Revisa los avisos.' : '') : 'No pude entender la frase.';
    }

    botonUsar.addEventListener('click', () => { if (campoFrase.value.trim()) rellenar(campoFrase.value.trim()); else { estado.textContent = 'Escribe o dicta una frase primero.'; campoFrase.focus(); } });
    campoFrase.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); botonUsar.click(); } });

    // Reconocimiento de voz
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      boton.disabled = true;
      boton.querySelector('.dictado-texto').textContent = 'Dictado no disponible';
      estado.textContent = 'Tu navegador no permite dictar. Escribe la frase y pulsa “Rellenar”. (Funciona en Chrome y Edge.)';
      return;
    }
    let rec = null, escuchando = false;
    boton.addEventListener('click', () => {
      if (escuchando) { rec.stop(); return; }
      rec = new Rec(); rec.lang = 'es-PE'; rec.interimResults = true; rec.maxAlternatives = 1;
      let final = '';
      rec.onstart = () => { escuchando = true; boton.setAttribute('aria-pressed', 'true'); caja.classList.add('escuchando'); boton.querySelector('.dictado-texto').textContent = 'Te escucho… (toca para terminar)'; estado.textContent = 'Di, por ejemplo: “suplemento de hierro, todos los días, a las 8”.'; };
      rec.onresult = ev => {
        let parcial = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) { if (ev.results[i].isFinal) final += ev.results[i][0].transcript; else parcial += ev.results[i][0].transcript; }
        campoFrase.value = (final + parcial).trim();
      };
      rec.onerror = ev => {
        const motivos = { 'not-allowed': 'No tengo permiso para usar el micrófono. Actívalo en el candado de la barra de direcciones o escribe la frase.', 'no-speech': 'No te escuché. Toca el micrófono e intenta de nuevo.', 'audio-capture': 'No encontré un micrófono. Puedes escribir la frase.', network: 'El dictado necesita internet. Puedes escribir la frase.' };
        if (ev.error !== 'aborted') estado.textContent = motivos[ev.error] || 'No pude escucharte. Puedes escribir la frase.';
      };
      rec.onend = () => {
        escuchando = false; boton.setAttribute('aria-pressed', 'false'); caja.classList.remove('escuchando'); boton.querySelector('.dictado-texto').textContent = 'Dictar recordatorio';
        if (final.trim()) rellenar(final.trim());
      };
      try { rec.start(); } catch (e) { estado.textContent = 'No pude iniciar el micrófono.'; }
    });
    void reducir;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})(typeof window !== 'undefined' ? window : globalThis);
