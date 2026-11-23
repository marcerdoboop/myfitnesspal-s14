// =====================================================================
// S14 · Mejora: GESTOS en Video y guía (recursos.html)
// ---------------------------------------------------------------------
// Problema: el video solo se controlaba con los botones pequeños del
// reproductor, difíciles de tocar en el celular.
// Mejora (solo gestos táctiles y teclado, sin voz):
//  - Doble toque a la izquierda / derecha: retrocede / adelanta 10 s.
//  - Un toque en el centro: reproducir / pausar.
//  - Mantener presionado: velocidad 2× mientras se mantiene.
//  - Atajos de teclado (K, J, L, flechas, M, F, < >, 0–9).
//  - Aviso visible de cada acción + lista de gestos a la vista.
// Principios: control del usuario y retroalimentación.
// =====================================================================
(function () {
  'use strict';
  const video = document.querySelector('video[data-gestos]');
  if (!video) return;

  // ---------- Estructura ----------
  const marco = document.createElement('div');
  marco.className = 'video-gestos';
  marco.tabIndex = 0;
  marco.setAttribute('role', 'group');
  marco.setAttribute('aria-label', 'Video con gestos y atajos de teclado. Pulsa K para reproducir o pausar.');
  video.parentNode.insertBefore(marco, video);
  marco.appendChild(video);
  video.removeAttribute('width');

  const capa = document.createElement('div');
  capa.className = 'video-capa';
  capa.innerHTML = '<span class="video-onda video-onda-izq" aria-hidden="true"></span><span class="video-onda video-onda-der" aria-hidden="true"></span>';
  marco.appendChild(capa);

  const aviso = document.createElement('div');
  aviso.className = 'video-aviso';
  aviso.setAttribute('role', 'status');
  aviso.setAttribute('aria-live', 'polite');
  marco.appendChild(aviso);

  const pista = document.createElement('p');
  pista.className = 'video-pista';
  pista.textContent = 'Doble toque a los lados para saltar 10 s · mantén presionado para 2×';
  marco.appendChild(pista);
  const ocultarPista = () => pista.classList.add('oculta');
  video.addEventListener('play', () => setTimeout(ocultarPista, 2500), { once: true });

  // ---------- Aviso visible ----------
  let tAviso = null;
  function avisar(texto, porTeclado) {
    aviso.textContent = texto;
    aviso.classList.toggle('instantaneo', !!porTeclado); // las acciones de teclado no se animan
    aviso.classList.remove('visible'); void aviso.offsetWidth; aviso.classList.add('visible');
    clearTimeout(tAviso);
    tAviso = setTimeout(() => aviso.classList.remove('visible'), 900);
  }

  // ---------- Acciones ----------
  const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function saltar(seg, porTeclado) {
    video.currentTime = Math.min(Math.max(0, video.currentTime + seg), video.duration || Infinity);
    avisar((seg > 0 ? '⏩ +' : '⏪ −') + Math.abs(seg) + ' s · ' + fmt(video.currentTime), porTeclado);
  }
  function alternar(porTeclado) {
    if (video.paused) { video.play().catch(() => avisar('No se pudo reproducir', porTeclado)); avisar('▶ Reproducir', porTeclado); }
    else { video.pause(); avisar('⏸ Pausa', porTeclado); }
  }
  function velocidad(v, porTeclado) {
    video.playbackRate = Math.min(2, Math.max(0.5, Math.round(v * 4) / 4));
    avisar('Velocidad ' + video.playbackRate + '×', porTeclado);
  }
  function volumen(delta, porTeclado) {
    video.muted = false;
    video.volume = Math.min(1, Math.max(0, Math.round((video.volume + delta) * 10) / 10));
    avisar('🔊 Volumen ' + Math.round(video.volume * 100) + ' %', porTeclado);
  }
  function silencio(porTeclado) { video.muted = !video.muted; avisar(video.muted ? '🔇 Silenciado' : '🔊 Con sonido', porTeclado); }
  function pantallaCompleta(porTeclado) {
    if (document.fullscreenElement) { document.exitFullscreen(); avisar('Salir de pantalla completa', porTeclado); }
    else if (marco.requestFullscreen) { marco.requestFullscreen().catch(() => {}); avisar('Pantalla completa', porTeclado); }
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iPhone
  }

  // ---------- Gestos táctiles / mouse sobre la capa ----------
  let ultimoToque = 0, tUnToque = null, tMantener = null, manteniendo = false, velocidadPrevia = 1, inicio = null;
  function zona(x) {
    const r = capa.getBoundingClientRect();
    const rel = (x - r.left) / r.width;
    return rel < 0.35 ? 'izq' : rel > 0.65 ? 'der' : 'centro';
  }
  function onda(lado) {
    const el = capa.querySelector('.video-onda-' + lado);
    el.classList.remove('activa'); void el.offsetWidth; el.classList.add('activa');
  }

  capa.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    inicio = { x: e.clientX, y: e.clientY };
    capa.setPointerCapture(e.pointerId);
    tMantener = setTimeout(() => {
      manteniendo = true;
      velocidadPrevia = video.playbackRate;
      video.playbackRate = 2;
      if (video.paused) video.play().catch(() => {});
      capa.classList.add('manteniendo');
      avisar('⏩ 2× mientras mantienes presionado');
    }, 450);
  });
  capa.addEventListener('pointermove', e => {
    if (inicio && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 12) clearTimeout(tMantener); // fue un arrastre
  });
  function soltar(e) {
    clearTimeout(tMantener);
    if (!inicio) return;
    inicio = null;
    if (manteniendo) {
      manteniendo = false;
      video.playbackRate = velocidadPrevia;
      capa.classList.remove('manteniendo');
      avisar('Velocidad ' + velocidadPrevia + '×');
      return;
    }
    if (e.type === 'pointercancel') return;
    const ahora = Date.now();
    const z = zona(e.clientX);
    if (ahora - ultimoToque < 300) {
      // Doble toque
      clearTimeout(tUnToque);
      ultimoToque = 0;
      if (z === 'izq') { saltar(-10); onda('izq'); }
      else if (z === 'der') { saltar(10); onda('der'); }
      else pantallaCompleta();
      ocultarPista();
    } else {
      ultimoToque = ahora;
      // Un solo toque en el centro: reproducir/pausar (espera por si llega un segundo toque)
      tUnToque = setTimeout(() => { if (z === 'centro') alternar(); else avisar('Toca dos veces para saltar 10 s'); }, 300);
    }
  }
  capa.addEventListener('pointerup', soltar);
  capa.addEventListener('pointercancel', soltar);
  capa.addEventListener('contextmenu', e => e.preventDefault()); // mantener presionado no abre el menú

  // ---------- Teclado ----------
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    const enCampo = t.closest && t.closest('input, textarea, select, [contenteditable], .ferri, .menu, nav');
    const enVideo = marco.contains(t);
    if (enCampo || !(enVideo || t === document.body)) return;
    const k = e.key;
    const acciones = {
      ' ': () => alternar(true), k: () => alternar(true), K: () => alternar(true),
      j: () => saltar(-10, true), J: () => saltar(-10, true), l: () => saltar(10, true), L: () => saltar(10, true),
      ArrowLeft: () => saltar(-5, true), ArrowRight: () => saltar(5, true),
      ArrowUp: () => volumen(0.1, true), ArrowDown: () => volumen(-0.1, true),
      m: () => silencio(true), M: () => silencio(true), f: () => pantallaCompleta(true), F: () => pantallaCompleta(true),
      '<': () => velocidad(video.playbackRate - 0.25, true), '>': () => velocidad(video.playbackRate + 0.25, true),
      ',': () => velocidad(video.playbackRate - 0.25, true), '.': () => velocidad(video.playbackRate + 0.25, true)
    };
    if (/^[0-9]$/.test(k) && video.duration) {
      e.preventDefault();
      video.currentTime = video.duration * (parseInt(k, 10) / 10);
      avisar('Ir al ' + k + '0 % · ' + fmt(video.currentTime), true);
      return;
    }
    // Espacio y flechas solo cuando el video tiene el foco: en el resto de la página siguen desplazando
    if (!enVideo && (k === ' ' || k.startsWith('Arrow'))) return;
    if (acciones[k]) { e.preventDefault(); acciones[k](); }
  });
})();
