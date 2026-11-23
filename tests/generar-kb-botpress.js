// Genera docs/botpress/base-conocimiento.md a partir de js/ferri-conocimiento.js
// Ejecutar: node tests/generar-kb-botpress.js
const fs = require('fs'), path = require('path');
const K = require(path.join(__dirname, '..', 'js', 'ferri-conocimiento.js'));
const limpio = t => t.replace(/\*\*/g, '');
let md = '# Base de conocimiento · Ferri (MyFitnessPal)\n\nDocumento para subir a la Knowledge Base de Botpress. Información educativa general (MINSA / OMS). No reemplaza a un profesional de salud.\n\n';
md += '## Test rápido de síntomas (HU05)\n\n' + limpio(K.TEMAS.test.texto) + '\n\n' + limpio(K.TEMAS.confianza.texto) + '\n\n';
md += '## Significado de cada color del semáforo\n\n';
for (const e of Object.values(K.ESTADOS)) {
  md += `### Semáforo ${e.color} (${e.rango})\n\n${limpio(e.significado)}\n\nEn palabras simples: ${e.simple}\n\nPor qué sale este color: ${e.porque}\n\nQué hacer:\n${e.hacer.map(h => '- ' + h).join('\n')}\n\n`;
}
md += '## Los 5 síntomas del test y su relación con la anemia\n\n';
for (const s of Object.values(K.SINTOMAS)) md += `### ${s.nombre[0].toUpperCase() + s.nombre.slice(1)}\n\n${s.explicacion}\n\nTambién puede deberse a: ${s.otrasCausas}.\n\n`;
const titulos = { hemoglobina: 'Hemoglobina', hierro: 'Hierro', anemia: 'Anemia ferropénica', examen: 'Examen de hemoglobina', absorcion: 'Cómo absorber mejor el hierro', alimentos: 'Alimentos con hierro', suplemento: 'Suplementos de hierro', riesgo: 'Grupos de riesgo', privacidad: 'Privacidad' };
for (const [k, t] of Object.entries(titulos)) {
  const x = K.TEMAS[k];
  md += `## ${t}\n\n${limpio(x.texto)}\n\n${limpio(x.mas)}\n\nFuente: ${x.fuente}\n\n`;
}
md += '## Tabla de alimentos (valores aproximados por porción casera)\n\n| Alimento | Hierro | Porción | Tipo | Nivel | Nota |\n|---|---|---|---|---|---|\n';
for (const a of K.ALIMENTOS) md += `| ${a.nombre} | ${a.mg} | ${a.porcion} | ${a.tipo === 'hemo' ? 'hemínico' : 'no hemínico'} | ${a.nivel} | ${a.nota} |\n`;
md += '\n## Urgencias\n\n' + limpio(K.URGENCIA.texto) + '\n';
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'botpress', 'base-conocimiento.md'), md);
console.log('OK', md.length, 'caracteres');
