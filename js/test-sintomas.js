// HU05 · Test rápido de síntomas
// Este archivo solo se usa en index.html. Se vincula con defer en el <head>.

// PASO 1. DOM: buscar los elementos del HTML por su id.
const formulario = document.querySelector('#form-sintomas');       // el <form> con las casillas
const cajaResultado = document.querySelector('#resultado-sintomas'); // caja que empieza oculta
const textoConteo = document.querySelector('#conteo-sintomas');      // "3 síntomas marcados"
const textoTitulo = document.querySelector('#titulo-resultado');     // "Semáforo en amarillo"
const textoMensaje = document.querySelector('#mensaje-resultado');   // recomendación
const botonControl = document.querySelector('#boton-control');       // enlace "Programar control"
const selectTipo = document.querySelector('#tipo');                  // <select> que YA existe en Recordatorios

// PASO 2. Límites del semáforo (fáciles de cambiar).
const MINIMO_AMARILLO = 2; // desde 2 síntomas: amarillo
const MINIMO_ROJO = 4;     // desde 4 síntomas: rojo

// PASO 3. Contar cuántas casillas están marcadas.
function contarSintomas() {
  return formulario.querySelectorAll('input[name="sintoma"]:checked').length;
}

// PASO 4. Según la cantidad, decidir color, textos y si se recomienda el control.
function obtenerEstado(cantidad) {
  const palabra = cantidad === 1 ? 'síntoma' : 'síntomas';

  if (cantidad >= MINIMO_ROJO) {
    return {
      clase: 'estado-rojo',
      titulo: 'Semáforo en rojo',
      mensaje: 'Tienes ' + cantidad + ' ' + palabra + '. Hazte un examen de hemoglobina lo antes posible y consulta a un profesional de salud.',
      recomendar: true
    };
  }
  if (cantidad >= MINIMO_AMARILLO) {
    return {
      clase: 'estado-amarillo',
      titulo: 'Semáforo en amarillo',
      mensaje: 'Tienes ' + cantidad + ' ' + palabra + '. Te recomendamos hacerte un examen de hemoglobina.',
      recomendar: true
    };
  }
  return {
    clase: 'estado-verde',
    titulo: 'Semáforo en verde',
    mensaje: 'Tienes ' + cantidad + ' ' + palabra + '. Por ahora no necesitas un examen. Si los síntomas continúan, consulta a un profesional de salud.',
    recomendar: false
  };
}

// PASO 5. Mostrar el resultado en la página (cambia texto, clase y atributos hidden).
function mostrarResultado(cantidad) {
  const estado = obtenerEstado(cantidad);

  cajaResultado.className = 'resultado-sintomas ' + estado.clase; // pone el color
  textoConteo.textContent = cantidad + (cantidad === 1 ? ' síntoma marcado' : ' síntomas marcados');
  textoTitulo.textContent = estado.titulo;
  textoMensaje.textContent = estado.mensaje;
  botonControl.hidden = !estado.recomendar; // el botón solo aparece en amarillo y rojo
  cajaResultado.hidden = false;             // mostrar la caja
}

// PASO 6. Eventos.
// 6.1 submit: se produce al pulsar "Ver resultado" (o Enter). preventDefault evita recargar la página.
formulario.addEventListener('submit', function (evento) {
  evento.preventDefault();
  mostrarResultado(contarSintomas());
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
