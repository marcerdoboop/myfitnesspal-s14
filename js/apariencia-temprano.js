// S14 · Interfaz adaptativa: aplica las preferencias guardadas ANTES de pintar la página
// (evita el "parpadeo" de modo claro a oscuro). Se carga sin defer en el <head>.
(function () {
  try {
    var p = JSON.parse(localStorage.getItem('mfp-apariencia')) || {};
    var raiz = document.documentElement;
    if (p.tema === 'claro' || p.tema === 'oscuro') raiz.setAttribute('data-tema', p.tema);
    if (p.escala) raiz.style.setProperty('--escala', p.escala);
    if (p.movimiento === 'reducido') raiz.setAttribute('data-movimiento', 'reducido');
  } catch (e) { /* sin almacenamiento: se usan las preferencias del sistema */ }
})();
