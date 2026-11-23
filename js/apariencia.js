// =====================================================================
// S14 · Mejora: INTERFAZ ADAPTATIVA (apariencia de toda la web)
// ---------------------------------------------------------------------
// Problema: texto pequeño y denso; el contraste cansa en celulares con
// poca luz o a usuarios mayores.
// Mejora: la web detecta modo claro/oscuro, reducción de movimiento y el
// tamaño de texto del sistema, y ofrece un panel con A− / A+, tema
// (Sistema / Claro / Oscuro) y "menos animaciones".
// Principios: control del usuario y accesibilidad.
// =====================================================================
(function () {
  'use strict';
  const CLAVE = 'mfp-apariencia';
  const ESCALAS = [0.9, 1, 1.15, 1.3, 1.5];
  const raiz = document.documentElement;
  const mqOscuro = window.matchMedia('(prefers-color-scheme: dark)');
  const mqMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  let pref = {};
  try { pref = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { pref = {}; }
  pref.tema = pref.tema || 'sistema';
  pref.escala = pref.escala || 1;
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(pref)); } catch (e) { /* nada */ } }

  // Tamaño de letra base del navegador/sistema (lo que la persona configuró)
  function tamanoSistema() {
    const sonda = document.createElement('div');
    sonda.style.cssText = 'position:absolute;visibility:hidden;font-size:medium';
    document.body.appendChild(sonda);
    const px = parseFloat(getComputedStyle(sonda).fontSize) || 16;
    sonda.remove();
    return px;
  }

  // ---------- Panel ----------
  const caja = document.createElement('div');
  caja.className = 'apariencia';
  caja.innerHTML = `
    <button class="apariencia-boton" type="button" aria-expanded="false" aria-controls="apariencia-panel" aria-label="Ajustar texto y colores" title="Ajustar texto y colores">
      <span aria-hidden="true">Aa</span>
    </button>
    <section id="apariencia-panel" class="apariencia-panel" aria-labelledby="apariencia-titulo" hidden>
      <h2 id="apariencia-titulo">Ver mejor</h2>
      <div class="ap-grupo" role="group" aria-labelledby="ap-texto">
        <p id="ap-texto" class="ap-etiqueta">Tamaño del texto</p>
        <div class="ap-fila">
          <button type="button" class="ap-tam" data-dir="-1" aria-label="Texto más pequeño">A−</button>
          <output class="ap-valor" aria-live="polite">100 %</output>
          <button type="button" class="ap-tam ap-tam-mas" data-dir="1" aria-label="Texto más grande">A+</button>
        </div>
      </div>
      <fieldset class="ap-grupo">
        <legend class="ap-etiqueta">Colores</legend>
        <div class="ap-segmentado">
          <label><input type="radio" name="ap-tema" value="sistema"><span>Sistema</span></label>
          <label><input type="radio" name="ap-tema" value="claro"><span>Claro</span></label>
          <label><input type="radio" name="ap-tema" value="oscuro"><span>Oscuro</span></label>
        </div>
      </fieldset>
      <label class="ap-interruptor"><input type="checkbox" class="ap-movimiento"> <span>Menos animaciones</span></label>
      <div class="ap-detectado">
        <p class="ap-etiqueta">Detectamos en tu dispositivo</p>
        <ul></ul>
      </div>
      <button type="button" class="ap-restablecer">Restablecer</button>
    </section>`;
  document.body.appendChild(caja);

  const boton = caja.querySelector('.apariencia-boton');
  const panel = caja.querySelector('.apariencia-panel');
  const valor = caja.querySelector('.ap-valor');
  const detectado = caja.querySelector('.ap-detectado ul');
  const chkMov = caja.querySelector('.ap-movimiento');

  function aplicar() {
    if (pref.tema === 'sistema') raiz.removeAttribute('data-tema'); else raiz.setAttribute('data-tema', pref.tema);
    raiz.style.setProperty('--escala', pref.escala);
    if (pref.movimiento === 'reducido') raiz.setAttribute('data-movimiento', 'reducido'); else raiz.removeAttribute('data-movimiento');
    valor.textContent = Math.round(pref.escala * 100) + ' %';
    caja.querySelector('.ap-tam[data-dir="-1"]').disabled = pref.escala <= ESCALAS[0];
    caja.querySelector('.ap-tam[data-dir="1"]').disabled = pref.escala >= ESCALAS[ESCALAS.length - 1];
    caja.querySelectorAll('input[name="ap-tema"]').forEach(r => { r.checked = r.value === pref.tema; });
    chkMov.checked = pref.movimiento === 'reducido' || (pref.movimiento !== 'normal' && mqMovimiento.matches);
    pintarDetectado();
  }

  function pintarDetectado() {
    const px = tamanoSistema();
    const items = [
      (mqOscuro.matches ? '🌙 Modo oscuro' : '☀️ Modo claro') + ' en tu sistema' + (pref.tema === 'sistema' ? ' (lo estamos usando)' : ''),
      mqMovimiento.matches ? '🐢 Prefieres menos movimiento: reducimos las animaciones' : '✨ Animaciones normales',
      '🔤 Texto base de tu navegador: ' + Math.round(px) + ' px' + (px > 16 ? ' (agrandado, lo respetamos)' : px < 16 ? ' (reducido)' : ' (normal)')
    ];
    detectado.textContent = '';
    items.forEach(t => { const li = document.createElement('li'); li.textContent = t; detectado.appendChild(li); });
  }

  function abrir() { panel.hidden = false; boton.setAttribute('aria-expanded', 'true'); requestAnimationFrame(() => panel.classList.add('abierto')); pintarDetectado(); }
  function cerrar(devolverFoco) {
    panel.classList.remove('abierto'); boton.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!panel.classList.contains('abierto')) panel.hidden = true; }, 160);
    if (devolverFoco) boton.focus();
  }
  boton.addEventListener('click', () => (panel.hidden ? abrir() : cerrar(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) cerrar(true); });
  document.addEventListener('pointerdown', e => { if (!panel.hidden && !caja.contains(e.target)) cerrar(false); });

  caja.querySelectorAll('.ap-tam').forEach(b => b.addEventListener('click', () => {
    let i = ESCALAS.indexOf(pref.escala); if (i < 0) i = 1;
    i = Math.min(ESCALAS.length - 1, Math.max(0, i + parseInt(b.dataset.dir, 10)));
    pref.escala = ESCALAS[i]; guardar(); aplicar();
  }));
  caja.querySelectorAll('input[name="ap-tema"]').forEach(r => r.addEventListener('change', () => { pref.tema = r.value; guardar(); aplicar(); }));
  chkMov.addEventListener('change', () => { pref.movimiento = chkMov.checked ? 'reducido' : 'normal'; guardar(); aplicar(); });
  caja.querySelector('.ap-restablecer').addEventListener('click', () => { pref = { tema: 'sistema', escala: 1 }; guardar(); aplicar(); });

  // Si el sistema cambia (por ejemplo, el celular pasa a modo oscuro de noche), la web lo sigue
  mqOscuro.addEventListener('change', pintarDetectado);
  mqMovimiento.addEventListener('change', aplicar);
  aplicar();
})();
