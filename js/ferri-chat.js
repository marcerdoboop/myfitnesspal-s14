// =====================================================================
// FERRI · Interfaz del chat (Semana 14 · Human-AI Interaction)
// ---------------------------------------------------------------------
// - Botón flotante + panel de chat accesible (teclado, lector de pantalla).
// - Multimodal: texto, voz 🎤 (Web Speech API) y lectura en voz alta 🔊.
// - Transparencia: muestra qué datos usa ("Contexto: tu test") y en qué
//   se basa cada respuesta ("¿En qué me baso?").
// - Control del usuario: reiniciar, apagar la voz, deshacer cambios,
//   calificar respuestas 👍/👎 (👎 = "explícamelo de otra forma").
// - Todo vive en esta pestaña (sessionStorage). No se envía a servidores
//   en modo local.
// =====================================================================
(function () {
  'use strict';

  const CONFIG = window.FERRI_CONFIG || { motor: 'local', voz: { idioma: 'es-PE' } };
  const CLAVE = 'ferri-sesion-v1';
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  const enIndex = !!document.querySelector('#form-sintomas');

  // ---------- Estado persistente por pestaña ----------
  let guardado = {};
  try { guardado = JSON.parse(sessionStorage.getItem(CLAVE)) || {}; } catch (e) { guardado = {}; }
  let historial = Array.isArray(guardado.historial) ? guardado.historial : [];
  let resultado = guardado.resultado || null;
  let leerEnVoz = guardado.leerEnVoz != null ? guardado.leerEnVoz : !!(CONFIG.voz && CONFIG.voz.leerRespuestas);

  function guardar() {
    try { sessionStorage.setItem(CLAVE, JSON.stringify({ historial: historial.slice(-40), resultado, leerEnVoz })); } catch (e) { /* modo privado: no pasa nada */ }
  }

  // ---------- Motor ----------
  const motor = window.FerriMotor.crearConversacion({
    alActualizarTest: function (ids) {
      resultado = { sintomas: ids.slice(), estado: estadoDe(ids.length) };
      if (window.TestSintomas) window.TestSintomas.marcar(ids);
      pintarContexto();
      guardar();
    }
  });
  if (resultado) motor.fijarResultado(resultado.sintomas);

  function estadoDe(n) { return n >= 4 ? 'estado-rojo' : n >= 2 ? 'estado-amarillo' : 'estado-verde'; }

  // ---------- DOM ----------
  const NOMBRES = { cansancio: 'cansancio', mareos: 'mareos', palidez: 'palidez', unas: 'uñas quebradizas', 'dolor-cabeza': 'dolor de cabeza' };
  const COLOR = { 'estado-verde': 'verde', 'estado-amarillo': 'amarillo', 'estado-rojo': 'rojo' };

  const raiz = document.createElement('div');
  raiz.className = 'ferri';
  raiz.innerHTML = `
    <button class="ferri-lanzador" type="button" aria-expanded="false" aria-controls="ferri-panel">
      <span class="ferri-avatar" aria-hidden="true">Fe</span>
      <span class="ferri-lanzador-texto">Pregúntale a Ferri</span>
      <span class="ferri-punto" hidden></span>
    </button>
    <section id="ferri-panel" class="ferri-panel" role="dialog" aria-modal="false" aria-labelledby="ferri-titulo" data-estado="cerrado" tabindex="-1" hidden>
      <header class="ferri-cabecera">
        <span class="ferri-avatar" aria-hidden="true">Fe</span>
        <div class="ferri-identidad">
          <h2 id="ferri-titulo">Ferri</h2>
          <p>Asistente con IA · no es un médico</p>
        </div>
        <button class="ferri-icono" type="button" data-accion="voz" aria-pressed="false" aria-label="Leer respuestas en voz alta" title="Leer respuestas en voz alta">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path class="ferri-ondas" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
        <button class="ferri-icono" type="button" data-accion="reiniciar" aria-label="Borrar conversación" title="Borrar conversación">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 4v4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="ferri-icono" type="button" data-accion="cerrar" aria-label="Cerrar chat" title="Cerrar (Esc)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </header>
      <div class="ferri-contexto" hidden>
        <span class="ferri-contexto-semaforo" aria-hidden="true"></span>
        <p><strong>Contexto que uso:</strong> <span class="ferri-contexto-texto"></span></p>
        <a class="ferri-contexto-editar" href="index.html#test-sintomas">Editar</a>
      </div>
      <div class="ferri-mensajes" role="log" aria-live="polite" aria-relevant="additions" tabindex="0" aria-label="Conversación con Ferri"></div>
      <div class="ferri-chips" role="group" aria-label="Sugerencias"></div>
      <form class="ferri-entrada" autocomplete="off">
        <label class="ferri-solo-lector" for="ferri-texto">Escribe tu pregunta</label>
        <textarea id="ferri-texto" rows="1" maxlength="400" placeholder="Escribe tu duda…" enterkeyhint="send"></textarea>
        <button class="ferri-icono ferri-mic" type="button" data-accion="mic" aria-pressed="false" aria-label="Hablar con el micrófono" title="Hablar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
        <button class="ferri-enviar" type="submit" aria-label="Enviar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12z"/></svg>
        </button>
      </form>
      <p class="ferri-pie">Respuestas automáticas con información del MINSA y la OMS. No guardo tus datos.</p>
    </section>
    <div class="ferri-aviso" role="status" aria-live="polite" hidden></div>`;
  document.body.appendChild(raiz);

  const $ = s => raiz.querySelector(s);
  const lanzador = $('.ferri-lanzador'), panel = $('.ferri-panel'), mensajes = $('.ferri-mensajes');
  const chips = $('.ferri-chips'), form = $('.ferri-entrada'), campo = $('#ferri-texto');
  const botonVoz = $('[data-accion="voz"]'), botonMic = $('[data-accion="mic"]'), aviso = $('.ferri-aviso');

  // ---------- Abrir / cerrar (transiciones interrumpibles, sin keyframes) ----------
  let temporizadorCierre = null;
  function abrir(opciones) {
    if (usarBotpress && botpressListo) return; // en modo Botpress atiende su propio chat
    clearTimeout(temporizadorCierre);
    panel.hidden = false;
    lanzador.setAttribute('aria-expanded', 'true');
    lanzador.querySelector('.ferri-punto').hidden = true;
    document.documentElement.classList.add('ferri-abierto');
    requestAnimationFrame(() => { panel.dataset.estado = 'abierto'; });
    if (!mensajes.childElementCount) {
      if (historial.length) {
        historial.forEach(m => pintarMensaje(m, false));
        const ultimoBot = historial.slice().reverse().find(m => m.de === 'bot');
        if (ultimoBot) pintarChips(ultimoBot.chips);
      }
      else if (!(opciones && opciones.explicar)) decirBot(motor.bienvenida(), false);
    }
    if (opciones && opciones.explicar) {
      if (resultado) { pintarMensaje({ de: 'usuario', texto: 'No entiendo mi resultado del test. ¿Me lo explicas?' }); responderCon(motor.explicarResultado()); }
      else decirBot(motor.bienvenida());
    }
    pintarContexto();
    // En celular no abrimos el teclado de golpe; en escritorio sí enfocamos el campo.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) setTimeout(() => campo.focus({ preventScroll: true }), 50);
    else panel.focus({ preventScroll: true });
    bajar(false);
  }

  function cerrar() {
    panel.dataset.estado = 'cerrado';
    lanzador.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('ferri-abierto');
    detenerVoz(); detenerMic();
    temporizadorCierre = setTimeout(() => { panel.hidden = true; }, reducirMovimiento.matches ? 0 : 180);
    lanzador.focus({ preventScroll: true });
  }

  lanzador.addEventListener('click', () => (panel.dataset.estado === 'abierto' ? cerrar() : abrir()));
  raiz.addEventListener('click', e => { if (e.target === raiz && panel.dataset.estado === 'abierto') cerrar(); }); // toque en el fondo (celular)
  raiz.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.dataset.estado === 'abierto') { e.stopPropagation(); cerrar(); } });
  document.addEventListener('ferri:abrir', e => abrir(e.detail || {}));

  $('[data-accion="cerrar"]').addEventListener('click', cerrar);
  $('[data-accion="reiniciar"]').addEventListener('click', () => {
    detenerVoz();
    historial = []; mensajes.textContent = ''; motor.reiniciar(); guardar();
    decirBot(motor.bienvenida(), false);
    avisar('Conversación borrada.');
  });

  // ---------- Contexto visible (transparencia) ----------
  function pintarContexto() {
    const caja = $('.ferri-contexto');
    if (!resultado) { caja.hidden = true; return; }
    const ids = resultado.sintomas;
    caja.hidden = false;
    caja.dataset.color = COLOR[resultado.estado];
    $('.ferri-contexto-texto').textContent = 'tu test en ' + COLOR[resultado.estado] + ' · ' + (ids.length ? ids.map(id => NOMBRES[id]).join(', ') : 'sin síntomas');
    const editar = $('.ferri-contexto-editar');
    editar.href = enIndex ? '#test-sintomas' : 'index.html#test-sintomas';
  }
  $('.ferri-contexto-editar').addEventListener('click', () => { if (enIndex) cerrar(); });

  // ---------- Pintar mensajes (sin innerHTML con texto del usuario) ----------
  function conNegritas(destino, texto) {
    texto.split(/(\*\*[^*]+\*\*)/g).forEach(trozo => {
      if (!trozo) return;
      if (trozo.startsWith('**') && trozo.endsWith('**')) {
        const b = document.createElement('strong'); b.textContent = trozo.slice(2, -2); destino.appendChild(b);
      } else destino.appendChild(document.createTextNode(trozo));
    });
  }

  function pintarMensaje(m, animar) {
    const fila = document.createElement('div');
    fila.className = 'ferri-msj ferri-msj-' + m.de + (m.urgente ? ' ferri-msj-urgente' : '') + (animar === false ? ' sin-animacion' : '');
    const burbuja = document.createElement('div');
    burbuja.className = 'ferri-burbuja';

    if (m.de === 'usuario') {
      burbuja.textContent = m.texto;
      if (m.porVoz) { const v = document.createElement('span'); v.className = 'ferri-por-voz'; v.textContent = '🎤 dictado'; burbuja.appendChild(v); }
    } else {
      const lectorAntes = document.createElement('span'); lectorAntes.className = 'ferri-solo-lector'; lectorAntes.textContent = 'Ferri dice: ';
      burbuja.appendChild(lectorAntes);
      (m.texto || []).forEach(t => { const p = document.createElement('p'); conNegritas(p, t); burbuja.appendChild(p); });
      if (m.lista && m.lista.length) {
        const ul = document.createElement('ul');
        m.lista.forEach(t => { const li = document.createElement('li'); conNegritas(li, t); ul.appendChild(li); });
        burbuja.appendChild(ul);
      }
      if (m.acciones && m.acciones.length) {
        const zona = document.createElement('div'); zona.className = 'ferri-acciones';
        m.acciones.forEach(a => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'ferri-accion'; b.textContent = a.etiqueta + ' →';
          b.addEventListener('click', () => ejecutarAccion(a)); zona.appendChild(b);
        });
        burbuja.appendChild(zona);
      }
      const pie = document.createElement('div'); pie.className = 'ferri-meta';
      if (m.base) {
        const d = document.createElement('details');
        const s = document.createElement('summary'); s.textContent = '¿En qué me baso?';
        const p = document.createElement('p'); p.textContent = m.base;
        d.append(s, p); pie.appendChild(d);
      }
      if (m.calificable !== false && m.id) {
        const grupo = document.createElement('span'); grupo.className = 'ferri-votos'; grupo.setAttribute('role', 'group'); grupo.setAttribute('aria-label', '¿Te sirvió esta respuesta?');
        [['👍', 'Me sirvió', 'si'], ['👎', 'No me sirvió, explícalo de otra forma', 'no']].forEach(([icono, etiqueta, valor]) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'ferri-voto'; b.textContent = icono;
          b.setAttribute('aria-label', etiqueta); b.title = etiqueta; b.setAttribute('aria-pressed', String(m.voto === valor));
          b.addEventListener('click', () => votar(m, valor, grupo)); grupo.appendChild(b);
        });
        pie.appendChild(grupo);
      }
      if (pie.childElementCount) burbuja.appendChild(pie);
    }
    fila.appendChild(burbuja);
    mensajes.appendChild(fila);
    if (animar !== false) {
      // Si la respuesta es más alta que la ventana, mostrarla desde su inicio (no desde el final)
      if (m.de === 'bot' && fila.offsetHeight > mensajes.clientHeight - 24) {
        mensajes.scrollTo({ top: fila.offsetTop - mensajes.offsetTop - 8, behavior: reducirMovimiento.matches ? 'auto' : 'smooth' });
      } else bajar(true);
    }
    return fila;
  }

  function votar(m, valor, grupo) {
    m.voto = valor;
    grupo.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String((i === 0 ? 'si' : 'no') === valor)));
    guardar();
    if (valor === 'no') {
      // Recuperación ante errores: re-explicar en modo simple
      pintarMensaje({ de: 'usuario', texto: 'No me sirvió, explícamelo de otra forma.' });
      historial.push({ de: 'usuario', texto: 'No me sirvió, explícamelo de otra forma.' });
      responderCon(motor.responder('no entiendo'));
    } else avisar('¡Gracias! Me ayuda a mejorar.');
  }

  function bajar(suave) {
    mensajes.scrollTo({ top: mensajes.scrollHeight, behavior: suave && !reducirMovimiento.matches ? 'smooth' : 'auto' });
  }

  function pintarChips(lista) {
    chips.textContent = '';
    (lista || []).slice(0, 4).forEach(t => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ferri-chip'; b.textContent = t;
      b.addEventListener('click', () => enviar(t, false));
      chips.appendChild(b);
    });
  }

  // ---------- Conversación ----------
  let contador = 0;
  function decirBot(resp, animar) {
    const m = Object.assign({ de: 'bot', id: 'm' + Date.now() + (contador++) }, resp);
    historial.push(m); guardar();
    pintarMensaje(m, animar);
    pintarChips(resp.chips);
    if (leerEnVoz) hablar(resp);
  }

  let escribiendo = null;
  function responderCon(resp) {
    // Breve indicador de "escribiendo" proporcional al largo (máx. 650 ms): se siente natural sin hacer esperar
    if (escribiendo) { escribiendo.remove(); escribiendo = null; }
    const largo = (resp.texto || []).join(' ').length;
    const espera = reducirMovimiento.matches ? 120 : Math.min(650, 220 + largo * 1.5);
    escribiendo = document.createElement('div');
    escribiendo.className = 'ferri-msj ferri-msj-bot ferri-escribiendo';
    escribiendo.innerHTML = '<div class="ferri-burbuja" aria-label="Ferri está escribiendo"><span></span><span></span><span></span></div>';
    mensajes.appendChild(escribiendo); bajar(true);
    chips.textContent = '';
    setTimeout(() => { if (escribiendo) { escribiendo.remove(); escribiendo = null; } decirBot(resp); }, espera);
  }

  function enviar(texto, porVoz) {
    texto = String(texto || '').trim();
    if (!texto) return;
    const m = { de: 'usuario', texto, porVoz: !!porVoz };
    historial.push(m); guardar();
    pintarMensaje(m);
    campo.value = ''; ajustarAltura();
    if (usarBotpress && botpressListo) { enviarABotpress(texto); return; }
    responderCon(motor.responder(texto));
  }

  form.addEventListener('submit', e => { e.preventDefault(); enviar(campo.value, false); });
  campo.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(campo.value, false); } });
  function ajustarAltura() { campo.style.height = 'auto'; campo.style.height = Math.min(campo.scrollHeight, 120) + 'px'; }
  campo.addEventListener('input', ajustarAltura);

  function ejecutarAccion(a) {
    if (a.tipo === 'control') {
      if (!enIndex) { location.href = 'index.html?control=1#contacto'; return; }
      const select = document.querySelector('#tipo');
      if (select) select.value = 'Control de hemoglobina';
      cerrar();
      const destino = document.querySelector('#contacto');
      destino.scrollIntoView({ behavior: reducirMovimiento.matches ? 'auto' : 'smooth' });
      setTimeout(() => { const f = document.querySelector('#frecuencia'); if (f) f.focus({ preventScroll: true }); }, 400);
      avisar('Elegí “Control de hemoglobina”. Completa la frecuencia y la hora.');
    } else if (a.tipo === 'ir') {
      if (!enIndex) { location.href = 'index.html' + a.destino; return; }
      cerrar();
      const destino = document.querySelector(a.destino);
      if (destino) { destino.scrollIntoView({ behavior: reducirMovimiento.matches ? 'auto' : 'smooth' }); destino.setAttribute('tabindex', '-1'); destino.focus({ preventScroll: true }); }
    }
  }
  // Viene de otra página con ?control=1
  if (enIndex && /[?&]control=1/.test(location.search)) {
    const select = document.querySelector('#tipo'); if (select) select.value = 'Control de hemoglobina';
  }

  // ---------- Resultado del test ----------
  document.addEventListener('test:resultado', e => {
    resultado = { sintomas: e.detail.sintomas, estado: e.detail.estado };
    motor.fijarResultado(resultado.sintomas);
    guardar(); pintarContexto();
    if (e.detail.origen === 'ferri') return; // el cambio lo hizo Ferri: ya lo contó en el chat
    if (panel.dataset.estado === 'abierto') {
      decirBot({ texto: ['Vi tu nuevo resultado: semáforo en **' + COLOR[resultado.estado] + '**. ¿Te lo explico?'], chips: ['Sí, explícame mi resultado', '¿Qué hago ahora?'] });
    } else {
      lanzador.querySelector('.ferri-punto').hidden = false; // puntito: "tengo algo para ti"
      lanzador.classList.add('ferri-lanzador-atento');
    }
  });

  // ---------- Avisos breves ----------
  let temporizadorAviso = null;
  function avisar(texto) {
    aviso.textContent = texto; aviso.hidden = false;
    requestAnimationFrame(() => aviso.classList.add('visible'));
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => { aviso.classList.remove('visible'); setTimeout(() => { aviso.hidden = true; }, 200); }, 2600);
  }

  // ---------- Voz: lectura en voz alta (🔊) ----------
  const puedeHablar = 'speechSynthesis' in window;
  function textoPlano(resp) {
    return [].concat(resp.texto || [], resp.lista || []).join('. ')
      .replace(/\*\*/g, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/→/g, '').replace(/\s+/g, ' ');
  }
  function hablar(resp) {
    if (!puedeHablar) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(textoPlano(resp));
    u.lang = (CONFIG.voz && CONFIG.voz.idioma) || 'es-PE';
    const voces = window.speechSynthesis.getVoices();
    const voz = voces.find(v => v.lang === u.lang) || voces.find(v => v.lang && v.lang.startsWith('es'));
    if (voz) u.voice = voz;
    u.rate = 1.02;
    window.speechSynthesis.speak(u);
  }
  function detenerVoz() { if (puedeHablar) window.speechSynthesis.cancel(); }
  function pintarBotonVoz() { botonVoz.setAttribute('aria-pressed', String(leerEnVoz)); botonVoz.title = leerEnVoz ? 'Dejar de leer en voz alta' : 'Leer respuestas en voz alta'; }
  if (!puedeHablar) botonVoz.hidden = true;
  pintarBotonVoz();
  botonVoz.addEventListener('click', () => {
    leerEnVoz = !leerEnVoz; guardar(); pintarBotonVoz();
    if (!leerEnVoz) detenerVoz();
    avisar(leerEnVoz ? 'Leeré mis respuestas en voz alta.' : 'Lectura en voz alta apagada.');
  });

  // ---------- Voz: reconocimiento (🎤) ----------
  const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, escuchando = false, textoPrevio = '';
  if (!Reconocimiento) {
    botonMic.disabled = true;
    botonMic.title = 'Tu navegador no permite dictar por voz. Prueba con Chrome o Edge, o escribe tu pregunta.';
    botonMic.setAttribute('aria-label', botonMic.title);
  }
  function detenerMic() { if (rec && escuchando) rec.abort(); }
  botonMic.addEventListener('click', () => {
    if (!Reconocimiento) return;
    if (escuchando) { rec.stop(); return; }
    detenerVoz();
    rec = new Reconocimiento();
    rec.lang = (CONFIG.voz && CONFIG.voz.idioma) || 'es-PE';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    textoPrevio = campo.value;
    let final = '';
    rec.onstart = () => { escuchando = true; botonMic.setAttribute('aria-pressed', 'true'); form.classList.add('escuchando'); campo.placeholder = 'Te escucho… (toca 🎤 para terminar)'; };
    rec.onresult = ev => {
      let parcial = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript; else parcial += ev.results[i][0].transcript;
      }
      campo.value = (textoPrevio + ' ' + final + parcial).trim(); ajustarAltura();
    };
    rec.onerror = ev => {
      const motivos = {
        'not-allowed': 'No tengo permiso para usar el micrófono. Puedes activarlo en el candado de la barra de direcciones, o escribir tu pregunta.',
        'service-not-allowed': 'El dictado por voz no está disponible aquí. Puedes escribir tu pregunta.',
        'no-speech': 'No te escuché. Intenta de nuevo hablando cerca del micrófono.',
        'audio-capture': 'No encontré un micrófono. Puedes escribir tu pregunta.',
        'network': 'El dictado necesita internet. Revisa tu conexión o escribe tu pregunta.'
      };
      if (ev.error !== 'aborted') avisar(motivos[ev.error] || 'No pude escucharte. Puedes escribir tu pregunta.');
    };
    rec.onend = () => {
      escuchando = false; botonMic.setAttribute('aria-pressed', 'false'); form.classList.remove('escuchando'); campo.placeholder = 'Escribe tu duda…';
      const texto = campo.value.trim();
      if (final.trim() && texto) {
        if (!leerEnVoz && puedeHablar) { leerEnVoz = true; pintarBotonVoz(); avisar('Como me hablaste, te responderé en voz alta (🔊 para apagar).'); }
        enviar(texto, true);
      }
    };
    try { rec.start(); } catch (e) { avisar('No pude iniciar el micrófono.'); }
  });

  // ---------- Modo Botpress (opcional, ver docs/BOTPRESS.md) ----------
  const scriptsBP = (CONFIG.botpress && CONFIG.botpress.scripts || []).filter(Boolean);
  const usarBotpress = CONFIG.motor === 'botpress' && scriptsBP.length >= 1;
  let botpressListo = false;

  function cargarScript(src) {
    return new Promise((ok, falla) => { const s = document.createElement('script'); s.src = src; s.async = false; s.onload = ok; s.onerror = falla; document.head.appendChild(s); });
  }

  function datosParaBotpress() {
    return resultado ? { semaforo: COLOR[resultado.estado], sintomas: resultado.sintomas.map(id => NOMBRES[id]).join(', ') || 'ninguno', cantidad: String(resultado.sintomas.length) } : { semaforo: 'sin test', sintomas: 'ninguno', cantidad: '0' };
  }

  function enviarABotpress(texto) {
    const bp = window.botpress;
    try {
      if (bp.updateUser) bp.updateUser({ data: datosParaBotpress() });
      bp.open && bp.open();
      bp.sendMessage && bp.sendMessage(texto);
    } catch (e) { responderCon(motor.responder(texto)); }
  }

  if (usarBotpress) {
    const limite = new Promise((_, falla) => setTimeout(() => falla(new Error('tiempo')), 8000));
    Promise.race([scriptsBP.reduce((p, src) => p.then(() => cargarScript(src)), Promise.resolve()).then(() => new Promise(ok => {
      const revisar = () => (window.botpress && window.botpress.on ? ok() : setTimeout(revisar, 150)); revisar();
    })), limite]).then(() => {
      window.botpress.on('webchat:ready', () => {
        botpressListo = true;
        raiz.classList.add('ferri-con-botpress'); // Botpress trae su propia burbuja: ocultamos la nuestra
        try { window.botpress.updateUser({ data: datosParaBotpress() }); } catch (e) { /* sin datos */ }
      });
      document.addEventListener('ferri:abrir', () => {
        if (!botpressListo) return;
        try { window.botpress.updateUser({ data: datosParaBotpress() }); window.botpress.open(); if (resultado) window.botpress.sendMessage('No entiendo mi resultado del test (semáforo ' + COLOR[resultado.estado] + ', síntomas: ' + datosParaBotpress().sintomas + '). ¿Me lo explicas?'); } catch (e) { /* vuelve al motor local */ }
      }, true);
    }).catch(() => { console.info('[Ferri] Botpress no cargó: uso el motor local.'); });
  }

  // Exponer para pruebas manuales en consola
  window.Ferri = { abrir, cerrar, enviar };
})();
