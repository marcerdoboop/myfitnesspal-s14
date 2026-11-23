// Pruebas del reconocimiento del plato. Ejecutar: node tests/probar-plato.js
const path = require('path');
const P = require(path.join(__dirname, '..', 'js', 'plato-foto.js'));
// Imagen sintética: lista de [color RGB, proporción]
function imagen(partes, total = 1000) {
  const d = new Uint8ClampedArray(total * 4); let i = 0;
  partes.forEach(([rgb, prop]) => { for (let k = 0; k < Math.round(prop * total); k++, i++) d.set([...rgb, 255], i * 4); });
  return d;
}
const HIGADO = [110, 40, 30], LENTEJA = [140, 95, 50], ESPINACA = [40, 110, 40], PLATO = [245, 245, 240], TOMATE = [220, 40, 35], NARANJA = [245, 150, 30];
const casos = [
  ['Hígado sobre plato blanco', P.analizarPixeles(imagen([[HIGADO, .4], [PLATO, .6]])), r => r[0].alimento === 'higado' && r[0].confianza > .5],
  ['Lentejas con espinaca', P.analizarPixeles(imagen([[LENTEJA, .45], [ESPINACA, .25], [PLATO, .3]])), r => r.some(x => x.alimento === 'lentejas') && r.some(x => x.alimento === 'espinaca')],
  ['Plato vacío: no inventa comida', P.analizarPixeles(imagen([[PLATO, 1]])), r => r.length === 0],
  ['Tomate y naranja', P.analizarPixeles(imagen([[TOMATE, .3], [NARANJA, .3], [PLATO, .4]])), r => r.some(x => x.alimento === 'tomate') && r.some(x => x.alimento === 'citrico')],
  ['Nombre del archivo', P.analizarNombre('almuerzo-lentejas_con_arroz.JPG'), r => r.length === 2 && r.every(x => x.confianza === .95)],
  ['El nombre gana a los colores', P.combinar(P.analizarNombre('sangrecita.jpg'), P.analizarPixeles(imagen([[HIGADO, .5], [PLATO, .5]]))), r => r[0].alimento === 'sangrecita'],
  ['Semáforo: 4 mg rojo', [P.estado(4)], r => r[0].clase === 'rojo'],
  ['Semáforo: 12 mg amarillo', [P.estado(12)], r => r[0].clase === 'amarillo'],
  ['Semáforo: 18 mg verde', [P.estado(18)], r => r[0].clase === 'verde'],
];
let ok = 0;
casos.forEach(([n, r, c]) => { if (c(r)) ok++; else console.log('✗', n, JSON.stringify(r)); });
console.log(`Plato: ${ok}/${casos.length} casos correctos`);
process.exitCode = ok === casos.length ? 0 : 1;
