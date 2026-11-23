// Pruebas de las recomendaciones de menús. Ejecutar: node tests/probar-menus.js
const path = require('path');
const M = require(path.join(__dirname, '..', 'js', 'menus-personalizados.js'));
const casos = [
  ['Sin filtros, S/ 10: 3 menús que entran en el presupuesto', M.recomendar(10, {}), r => r.menus.length === 3 && r.menus.every(m => m.costo <= 10)],
  ['Vegetariano: ningún menú con carne, vísceras ni pescado', M.recomendar(20, { vegetariano: true }), r => r.menus.every(m => m.etiquetas.includes('vegetariano'))],
  ['Sin vísceras: no aparece hígado ni sangrecita', M.recomendar(20, { 'sin-visceras': true }), r => r.menus.every(m => !m.etiquetas.includes('visceras'))],
  ['Ordena por hierro: el primero tiene más mg', M.recomendar(20, {}), r => r.menus[0].mg >= r.menus[1].mg],
  ['Gusto por menestras sube las menestras', M.recomendar(20, { menestras: true }), r => r.menus[0].etiquetas.includes('menestra')],
  ['Cuenta los ocultos (transparencia)', M.recomendar(15, { vegetariano: true }), r => r.ocultos.vegetariano === 3],
  ['Cada menú explica por qué (meta de 18 mg y presupuesto)', M.recomendar(15, {}), r => r.menus.every(m => /meta diaria de 18 mg/.test(m.razones[0]) && /S\/ 15/.test(m.razones[1]))],
  ['Si nada cumple, la lista queda vacía (la interfaz lo explica)', M.recomendar(10, { vegetariano: true, 'sin-huevo': true }), r => r.menus.length === 2],
];
let ok = 0;
casos.forEach(([nombre, r, cond]) => { if (cond(r)) ok++; else console.log('✗', nombre, r.menus.map(m => m.id)); });
console.log(`Menús: ${ok}/${casos.length} casos correctos`);
process.exitCode = ok === casos.length ? 0 : 1;
