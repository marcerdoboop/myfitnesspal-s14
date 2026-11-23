// Pruebas del intérprete de dictado de Recordatorios. Ejecutar: node tests/probar-voz-recordatorio.js
const path = require('path');
const V = require(path.join(__dirname, '..', 'js', 'voz-recordatorio.js'));
const casos = [
  ['suplemento de hierro, todos los días, a las 8', { tipo: 'Suplemento de hierro', frecuencia: 'Todos los días', hora: '8:00 a. m.' }],
  ['Recuérdame tomar mi pastilla de hierro cada día a las ocho de la noche', { tipo: 'Suplemento de hierro', frecuencia: 'Todos los días', hora: '8:00 p. m.' }],
  ['control de hemoglobina cada mes a las 12', { tipo: 'Control de hemoglobina', frecuencia: 'Cada mes', hora: '12:00 m.' }],
  ['mi cita con el médico una vez al mes al mediodía', { tipo: 'Control de hemoglobina', frecuencia: 'Cada mes', hora: '12:00 m.' }],
  ['las gotas de mi bebé diario en la mañana', { tipo: 'Suplemento de hierro', frecuencia: 'Todos los días', hora: '8:00 a. m.' }],
  ['sulfato ferroso cada semana a las 20 horas', { tipo: 'Suplemento de hierro', frecuencia: 'Cada semana', hora: '8:00 p. m.' }],
  ['vitamina los lunes antes de dormir', { tipo: 'Suplemento de hierro', frecuencia: 'Cada semana', hora: '8:00 p. m.' }],
  ['suplemento todos los días a las 7 de la mañana', { hora: '8:00 a. m.', aviso: /más cercano/ }],
  ['suplemento todos los días a las 3', { hora: '12:00 m.', aviso: /más cercano/ }],
  ['examen cada mes a las 10 de la noche', { hora: '8:00 p. m.', aviso: /más cercano/ }],
  ['suplemento a diario a las 8', { aviso: /Si era de la noche/ }],
  ['me llamo ana, suplemento todos los días a las 8, mi correo es ana arroba gmail punto com', { nombre: 'Ana', correo: 'ana@gmail.com' }],
  ['hola', { tipo: null, frecuencia: null, hora: null, aviso: /No entendí qué quieres recordar/ }],
];
let ok = 0;
for (const [frase, esp] of casos) {
  const r = V.interpretar(frase);
  const fallos = Object.entries(esp).filter(([k, v]) => k === 'aviso' ? !r.avisos.some(a => v.test(a)) : r[k] !== v);
  if (fallos.length) console.log('✗', frase, '\n  esperaba', esp, '\n  obtuvo  ', r); else ok++;
}
console.log(`Dictado: ${ok}/${casos.length} casos correctos`);
process.exitCode = ok === casos.length ? 0 : 1;
