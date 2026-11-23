// HU05 · Test rápido de síntomas
// Este archivo solo se usa en index.html. Se vincula con defer en el <head>.
// SEMANA 14 (mejora): el resultado ahora (a) muestra la escala del semáforo,
// (b) explica el resultado con palabras simples y (c) se comparte con Ferri,
// el asistente conversacional, para que el usuario pueda preguntarle.

// PASO 1. DOM: buscar los elementos del HTML por su id.
const formulario = document.querySelector('#form-sintomas');       // el <form> con las casillas
const cajaResultado = document.querySelector('#resultado-sintomas'); // caja que empieza oculta
const textoConteo = document.querySelector('#conteo-sintomas');      // "3 síntomas marcados"
const textoTitulo = document.querySelector('#titulo-resultado');     // "Semáforo en amarillo"
const textoMensaje = document.querySelector('#mensaje-resultado');   // recomendación
const textoSimple = document.querySelector('#significado-resultado'); // S14: "En palabras simples…"
const textoMarcados = document.querySelector('#lista-marcados');     // S14: "Marcaste: …"
const botonControl = document.querySelector('#boton-control');       // enlace "Programar control"
const botonFerri = document.querySelector('#boton-ferri');           // S14: abre el asistente
const selectTipo = document.querySelector('#tipo');                  // <select> que YA existe en Recordatorios

// PASO 2. Límites del semáforo (fáciles de cambiar).
const MINIMO_AMARILLO = 2; // desde 2 síntomas: amarillo
const MINIMO_ROJO = 4;     // desde 4 síntomas: rojo

// PASO 3. Leer qué casillas están marcadas (S14: ya no solo cuántas, también cuáles).
function sintomasMarcados() {
  return Array.from(formulario.querySelectorAll('input[name="sintoma"]:checked'));
}

// PASO 4. Según la cantidad, decidir color, textos y si se recomienda el control.
function obtenerEstado(cantidad) {
  const palabra = cantidad === 1 ? 'síntoma' : 'síntomas';

  if (cantidad >= MINIMO_ROJO) {
    return {
      clase: 'estado-rojo',
      titulo: 'Semáforo en rojo',
      mensaje: 'Tienes ' + cantidad + ' ' + palabra + '. Hazte un examen de hemoglobina lo antes posible y consulta a un profesional de salud.',
      simple: 'Tienes varias señales que suelen aparecer con la anemia. No es un diagnóstico, pero no lo dejes pasar: un examen de sangre rápido lo confirma.',
      recomendar: true
    };
  }
  if (cantidad >= MINIMO_AMARILLO) {
    return {
      clase: 'estado-amarillo',
      titulo: 'Semáforo en amarillo',
      mensaje: 'Tienes ' + cantidad + ' ' + palabra + '. Te recomendamos hacerte un examen de hemoglobina.',
      simple: 'Tienes algunas señales de anemia. Puede ser anemia o no: un examen de sangre rápido (un pinchazo en el dedo) te saca de dudas.',
      recomendar: true
    };
  }
  return {
    clase: 'estado-verde',
    titulo: 'Semáforo en verde',
    mensaje: 'Tienes ' + cantidad + ' ' + palabra + '. Por ahora no necesitas un examen. Si los síntomas continúan, consulta a un profesional de salud.',
    simple: 'Casi no tienes señales de anemia. Sigue comiendo alimentos con hierro.',
    recomendar: false
  };
}

// Une nombres: "cansancio, mareos y palidez"
function unirNombres(nombres) {
  if (nombres.length <= 1) return nombres.join('');
  return nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
}

// PASO 5. Mostrar el resultado en la página (cambia texto, clase y atributos hidden).
function mostrarResultado(origen) {
  const marcados = sintomasMarcados();
  const cantidad = marcados.length;
  const estado = obtenerEstado(cantidad);
  const nombres = marcados.map(function (casilla) { return casilla.parentElement.textContent.trim().toLowerCase(); });

  cajaResultado.className = 'resultado-sintomas ' + estado.clase; // pone el color
  textoConteo.textContent = cantidad + (cantidad === 1 ? ' síntoma marcado' : ' síntomas marcados');
  textoTitulo.textContent = estado.titulo;
  textoMensaje.textContent = estado.mensaje;
  textoSimple.textContent = estado.simple;
  textoMarcados.textContent = cantidad ? 'Marcaste: ' + unirNombres(nombres) + '.' : 'No marcaste ningún síntoma.';
  botonControl.hidden = !estado.recomendar; // el botón solo aparece en amarillo y rojo
  cajaResultado.hidden = false;             // mostrar la caja

  // S14: avisar a Ferri (asistente) cuál es el resultado, para que pueda explicarlo.
  document.dispatchEvent(new CustomEvent('test:resultado', {
    detail: { sintomas: marcados.map(function (c) { return c.value; }), estado: estado.clase, origen: origen || 'test' }
  }));
}

// PASO 6. Eventos.
// 6.1 submit: se produce al pulsar "Ver resultado" (o Enter). preventDefault evita recargar la página.
formulario.addEventListener('submit', function (evento) {
  evento.preventDefault();
  mostrarResultado('test');
});

// 6.2 change: si el usuario marca o desmarca una casilla, se oculta el resultado anterior
// para que no muestre datos viejos. El evento "change" de las casillas sube hasta el <form>.
formulario.addEventListener('change', function () {
  cajaResultado.hidden = true;
});

// 6.3 click en "Programar control": deja elegido "Control de hemoglobina" en el formulario
// de Recordatorios. El enlace href="#contacto" se encarga de bajar hasta esa sección.
botonControl.addEventListener('click', function () {
  selectTipo.value = 'Control de hemoglobina';
});

// 6.4 (S14) click en "Pregúntale a Ferri": abre el asistente y le pide explicar el resultado.
botonFerri.addEventListener('click', function () {
  document.dispatchEvent(new CustomEvent('ferri:abrir', { detail: { explicar: true } }));
});

// PASO 7 (S14). Ferri puede marcar o desmarcar casillas cuando el usuario se lo pide
// en el chat ("también tengo mareos"). Siempre pregunta antes de hacerlo.
window.TestSintomas = {
  marcar: function (valores) {
    formulario.querySelectorAll('input[name="sintoma"]').forEach(function (casilla) {
      casilla.checked = valores.includes(casilla.value);
    });
    mostrarResultado('ferri');
  }
};
