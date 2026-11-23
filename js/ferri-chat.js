// =====================================================================
// FERRI · Interfaz del chat (Semana 14 · Human-AI Interaction)
// ---------------------------------------------------------------------
// - Botón flotante + panel de chat accesible (teclado, lector de pantalla).
// - Solo TEXTO y solo dudas sobre anemia y hierro (mg, meta de 18 mg,
//   absorción, hemoglobina, resultado del test). No programa recordatorios
//   ni recomienda menús: eso lo hacen sus propias secciones.
// - Transparencia: muestra qué datos usa ("Contexto: tu test") y en qué
//   se basa cada respuesta ("¿En qué me baso?").
// - Control del usuario: reiniciar, deshacer cambios en el test,
//   calificar respuestas 👍/👎 (👎 = "explícamelo de otra forma").
// - Confianza: avisa siempre que no reemplaza a un médico.
// - Todo vive en esta pestaña (sessionStorage). No se envía a servidores
//   en modo local.
// =====================================================================
(function () {
  'use strict';

  const CONFIG = window.FERRI_CONFIG || { motor: 'local' };
  const CLAVE = 'ferri-sesion-v1';
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  const enIndex = !!document.querySelector('#form-sintomas');

  // ---------- Estado persistente por pestaña ----------
  let guardado = {};
  try { guardado = JSON.parse(sessionStorage.getItem(CLAVE)) || {}; } catch (e) { guardado = {}; }
  let historial = Array.isArray(guardado.historial) ? guardado.historial : [];
  let resultado = guardado.resultado || null;

  function guardar() {
    try { sessionStorage.setItem(CLAVE, JSON.stringify({ historial: historial.slice(-40), resultado })); } catch (e) { /* modo privado: no pasa nada */ }
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
          <p>Dudas sobre anemia y hierro · no reemplaza al médico</p>
        </div>
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
        <button class="ferri-icono ferri-adjuntar" type="button" aria-label="Adjuntar imagen" title="Adjuntar imagen: tu análisis de hemoglobina, una etiqueta, la caja de tu suplemento o tu plato">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 6.5 8.4 14.6a2 2 0 0 0 2.8 2.8l8.1-8.1a4 4 0 0 0-5.6-5.6L5.4 12a6 6 0 0 0 8.5 8.5l6.6-6.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <input class="ferri-archivo" type="file" accept="image/*" hidden>
        <textarea id="ferri-texto" rows="1" maxlength="400" placeholder="Escribe o adjunta una imagen 📎" enterkeyhint="send"></textarea>
        <button class="ferri-enviar" type="submit" aria-label="Enviar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12z"/></svg>
        </button>
      </form>
      <p class="ferri-pie">Asistente automático con información del MINSA y la OMS. <strong>No reemplaza a un médico.</strong> No guardo tus datos.</p>
    </section>
    <div class="ferri-aviso" role="status" aria-live="polite" hidden></div>`;
  document.body.appendChild(raiz);

  const $ = s => raiz.querySelector(s);
  const lanzador = $('.ferri-lanzador'), panel = $('.ferri-panel'), mensajes = $('.ferri-mensajes');
  const chips = $('.ferri-chips'), form = $('.ferri-entrada'), campo = $('#ferri-texto');
  const aviso = $('.ferri-aviso');

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
    temporizadorCierre = setTimeout(() => { panel.hidden = true; }, reducirMovimiento.matches ? 0 : 180);
    lanzador.focus({ preventScroll: true });
  }

  lanzador.addEventListener('click', () => (panel.dataset.estado === 'abierto' ? cerrar() : abrir()));
  raiz.addEventListener('click', e => { if (e.target === raiz && panel.dataset.estado === 'abierto') cerrar(); }); // toque en el fondo (celular)
  raiz.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.dataset.estado === 'abierto') { e.stopPropagation(); cerrar(); } });
  document.addEventListener('ferri:abrir', e => abrir(e.detail || {}));
  // Enlaces de ayuda en la página: <button data-ferri-pregunta="¿Qué significa mg?">
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ferri-pregunta]');
    if (!b || raiz.contains(b)) return;
    e.preventDefault();
    abrir();
    enviar(b.dataset.ferriPregunta);
  });

  $('[data-accion="cerrar"]').addEventListener('click', cerrar);
  $('[data-accion="reiniciar"]').addEventListener('click', () => {
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
      if (m.imagen) {
        const img = document.createElement('img'); img.className = 'ferri-adjunto'; img.src = m.imagen; img.alt = 'Imagen que enviaste';
        burbuja.appendChild(img);
      }
      if (m.texto) burbuja.appendChild(document.createTextNode(m.texto));
    } else {
      const lectorAntes = document.createElement('span'); lectorAntes.className = 'ferri-solo-lector'; lectorAntes.textContent = 'Ferri dice: ';
      burbuja.appendChild(lectorAntes);
      (m.texto || []).forEach(t => { const p = document.createElement('p'); conNegritas(p, t); burbuja.appendChild(p); });
      if (m.lista && m.lista.length) {
        const ul = document.createElement('ul');
        m.lista.forEach(t => { const li = document.createElement('li'); conNegritas(li, t); ul.appendChild(li); });
        burbuja.appendChild(ul);
      }
      (m.textoFinal || []).forEach(t => { const p = document.createElement('p'); conNegritas(p, t); burbuja.appendChild(p); });
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
    Array.from(new Set(lista || [])).slice(0, 4).forEach(t => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ferri-chip'; b.textContent = t;
      b.addEventListener('click', () => enviar(t));
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

  function enviar(texto) {
    texto = String(texto || '').trim();
    if (!texto) return;
    const m = { de: 'usuario', texto };
    historial.push(m); guardar();
    pintarMensaje(m);
    campo.value = ''; ajustarAltura();
    if (usarBotpress && botpressListo) { enviarABotpress(texto); return; }
    responderCon(motor.responder(texto));
  }

  form.addEventListener('submit', e => { e.preventDefault(); enviar(campo.value); });

  // ---------- Imágenes: Ferri "ve" (colores) y "lee" (texto con OCR), todo en el dispositivo ----------
  const archivo = $('.ferri-archivo');
  $('.ferri-adjuntar').addEventListener('click', () => archivo.click());
  archivo.addEventListener('change', () => { if (archivo.files[0]) recibirImagen(archivo.files[0]); archivo.value = ''; });
  campo.addEventListener('paste', e => {
    const item = Array.from(e.clipboardData && e.clipboardData.items || []).find(i => i.type.startsWith('image/'));
    if (item) { e.preventDefault(); recibirImagen(item.getAsFile()); }
  });
  panel.addEventListener('dragover', e => { if (Array.from(e.dataTransfer.items || []).some(i => i.kind === 'file')) { e.preventDefault(); panel.classList.add('soltar-aqui'); } });
  panel.addEventListener('dragleave', e => { if (!panel.contains(e.relatedTarget)) panel.classList.remove('soltar-aqui'); });
  panel.addEventListener('drop', e => {
    panel.classList.remove('soltar-aqui');
    const f = Array.from(e.dataTransfer.files || []).find(x => x.type.startsWith('image/'));
    if (f) { e.preventDefault(); recibirImagen(f); }
  });

  const abs = ruta => new URL(ruta, location.href).href;
  function cargarImagen(file) {
    return new Promise((ok, falla) => {
      const url = URL.createObjectURL(file); const img = new Image();
      img.onload = () => ok(img); img.onerror = () => falla(new Error('imagen')); img.src = url;
    });
  }
  function lienzo(img, max) {
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c;
  }
  function asegurarPlato() {
    return window.PlatoFoto ? Promise.resolve() : cargarScript(abs('js/plato-foto.js'));
  }
  // OCR (Tesseract.js) se descarga solo la primera vez que alguien adjunta una imagen
  let trabajadorOCR = null, alProgresar = null;
  async function obtenerOCR() {
    if (!window.Tesseract) await cargarScript(abs('vendor/tesseract/tesseract.min.js'));
    if (!trabajadorOCR) {
      trabajadorOCR = window.Tesseract.createWorker('spa', 1, {
        workerPath: abs('vendor/tesseract/worker.min.js'), corePath: abs('vendor/tesseract/core'), langPath: abs('vendor/tesseract/lang'), gzip: true,
        logger: m => alProgresar && alProgresar(m)
      }).catch(err => { trabajadorOCR = null; throw err; });
    }
    return trabajadorOCR;
  }
  function conTiempo(promesa, ms) { return Promise.race([promesa, new Promise((_, f) => setTimeout(() => f(new Error('tiempo')), ms))]); }

  function mostrarProcesando(texto) {
    if (escribiendo) { escribiendo.remove(); escribiendo = null; }
    const fila = document.createElement('div'); fila.className = 'ferri-msj ferri-msj-bot ferri-escribiendo ferri-procesando';
    const b = document.createElement('div'); b.className = 'ferri-burbuja';
    b.innerHTML = '<span></span><span></span><span></span>';
    const t = document.createElement('em'); t.className = 'ferri-procesando-texto'; t.textContent = texto; b.appendChild(t);
    fila.appendChild(b); mensajes.appendChild(fila); bajar(true); chips.textContent = '';
    return { poner: x => { t.textContent = x; }, quitar: () => fila.remove() };
  }

  let ocupado = false;
  async function recibirImagen(file) {
    if (ocupado) { avisar('Espera, todavía estoy mirando la imagen anterior.'); return; }
    if (!file || !/^image\//.test(file.type)) { avisar('Ese archivo no es una imagen. Prueba con una foto (JPG o PNG).'); return; }
    if (file.size > 15 * 1024 * 1024) { avisar('La imagen pesa más de 15 MB. Prueba con una foto más liviana.'); return; }
    ocupado = true;
    let img;
    try { img = await cargarImagen(file); } catch (e) { avisar('No pude abrir esa imagen.'); ocupado = false; return; }
    const miniatura = lienzo(img, 360).toDataURL('image/jpeg', 0.8);
    const texto = campo.value.trim();
    const m = { de: 'usuario', texto, imagen: miniatura };
    historial.push(m); guardar(); pintarMensaje(m);
    campo.value = ''; ajustarAltura();
    const estado = mostrarProcesando('Mirando tu imagen…');
    // 1) Ver: colores de la foto (recorte central) + nombre del archivo
    let colores = [];
    try {
      await asegurarPlato();
      const P = window.PlatoFoto, L = 96, c = document.createElement('canvas'); c.width = c.height = L;
      const lado = Math.min(img.naturalWidth, img.naturalHeight) * 0.8;
      c.getContext('2d').drawImage(img, (img.naturalWidth - lado) / 2, (img.naturalHeight - lado) / 2, lado, lado, 0, 0, L, L);
      const porNombre = P.analizarNombre(file.name || '');
      colores = P.combinar(porNombre, P.analizarPixeles(c.getContext('2d').getImageData(0, 0, L, L).data))
        .map(d => { const a = P.ALIMENTOS.find(x => x.id === d.alimento); return { nombre: a.nombre, mg: a.mg, confianza: d.confianza, como: d.como }; })
        .filter(d => d.nombre !== 'Arroz' || d.confianza > 0.4);
    } catch (e) { colores = []; }
    // 2) Leer: texto con OCR
    let leido = '', ocrFallo = false;
    try {
      estado.poner('Preparando la lectura de texto (solo la primera vez tarda un poco)…');
      alProgresar = p => { if (p.status === 'recognizing text') estado.poner('Leyendo el texto… ' + Math.round(p.progress * 100) + ' %'); };
      const w = await conTiempo(obtenerOCR(), 60000);
      const resultado = await conTiempo(w.recognize(lienzo(img, 1800)), 60000);
      leido = (resultado.data && resultado.data.confidence > 35) ? resultado.data.text : '';
    } catch (e) { ocrFallo = true; console.info('[Ferri] No se pudo leer texto:', e && e.message); }
    alProgresar = null;
    estado.quitar();
    const resp = motor.responderImagen({ texto: leido, colores, ocrFallo });
    if (ocrFallo && !colores.length) resp.texto.push('(La lectura de texto necesita la versión publicada de la web; abriendo el archivo directo en el navegador no funciona.)');
    decirBot(resp);
    ocupado = false;
  }
  campo.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(campo.value); } });
  function ajustarAltura() { campo.style.height = 'auto'; campo.style.height = Math.min(campo.scrollHeight, 120) + 'px'; }
  campo.addEventListener('input', ajustarAltura);

  function ejecutarAccion(a) {
    if (a.tipo === 'ir') {
      if (!enIndex) { location.href = 'index.html' + a.destino; return; }
      cerrar();
      const destino = document.querySelector(a.destino);
      if (destino) { destino.scrollIntoView({ behavior: reducirMovimiento.matches ? 'auto' : 'smooth' }); destino.setAttribute('tabindex', '-1'); destino.focus({ preventScroll: true }); }
    }
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
