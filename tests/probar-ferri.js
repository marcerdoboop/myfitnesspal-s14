// Pruebas automáticas de Ferri (motor conversacional).
// Ejecutar:  node tests/probar-ferri.js
// Cada caso: conversación (lista de mensajes) + qué debe contener la ÚLTIMA respuesta.
const path = require('path');
const F = require(path.join(__dirname, '..', 'js', 'ferri-motor.js'));

const casos = [
  // --- Problema principal: entender el resultado del test ---
  { test: ['cansancio', 'mareos', 'palidez'], dice: ['explícame mi resultado'], espera: /amarillo.*3 síntomas/s },
  { test: ['cansancio', 'mareos', 'palidez'], dice: ['no entiendo mi resultado'], espera: /amarillo/i },
  { test: ['cansancio', 'mareos', 'palidez'], dice: ['qué significa amarillo'], espera: /No significa que tengas anemia/ },
  { test: ['cansancio', 'mareos', 'palidez'], dice: ['k significa mi resultdo'], espera: /amarillo/ },
  { test: ['cansancio', 'mareos', 'palidez', 'unas'], dice: ['por qué me salió rojo?'], espera: /Desde 4 síntomas sale rojo/ },
  { test: ['cansancio'], dice: ['qué quiere decir el semáforo'], espera: /verde/ },
  { test: ['cansancio', 'mareos'], dice: ['explícame mi resultado', 'no entiendo'], espera: /Amarillo = atención/ },
  { test: ['cansancio', 'mareos'], dice: ['explícame mi resultado', 'por qué?'], espera: /Desde 2 síntomas/ },
  { test: ['cansancio', 'mareos'], dice: ['explícame mi resultado', 'cuéntame más'], espera: /Cansancio:.*Mareos:/s },
  { test: ['cansancio', 'mareos'], dice: ['qué hago ahora'], espera: /examen de hemoglobina/ },
  { test: ['cansancio', 'mareos'], dice: ['tengo anemia?'], espera: /no lo sé, y el test tampoco/ },
  { test: ['cansancio', 'mareos'], dice: ['puedo confiar en el test?'], espera: /orientación/ },
  { test: null, dice: ['explícame mi resultado'], espera: /Todavía no veo un resultado/ },
  // --- Control del usuario: cambiar el test conversando ---
  { test: ['cansancio', 'mareos'], dice: ['también tengo palidez'], espera: /Quieres que lo agregue/ },
  { test: ['cansancio', 'mareos'], dice: ['también tengo palidez', 'sí'], espera: /agregué.*palidez.*3 de 5/s },
  { test: ['cansancio', 'mareos'], dice: ['también tengo palidez', 'no'], espera: /no cambio nada/ },
  { test: ['cansancio', 'mareos', 'palidez'], dice: ['ya no tengo mareos', 'si'], espera: /quité.*mareos/s },
  { test: ['cansancio', 'mareos', 'palidez', 'unas'], dice: ['me equivoqué, no tengo uñas quebradizas', 'dale'], espera: /cambió a amarillo/ },
  { test: null, dice: ['tengo cansancio y mareos'], espera: /Quieres que marque/ },
  { test: null, dice: ['me siento muy cansada y mareada', 'sí, márcalo'], espera: /cambió a amarillo/ },
  { test: ['cansancio'], dice: ['agrega dolor de cabeza'], espera: /agregué/ },
  { test: ['cansancio', 'mareos'], dice: ['también tengo mareos'], espera: /ya estaba marcado/ },
  // --- Síntomas ---
  { test: null, dice: ['por qué me mareo?'], espera: /oxígeno al cerebro/ },
  { test: null, dice: ['las uñas quebradizas tienen que ver con la anemia?'], espera: /uñas/i },
  { test: null, dice: ['qué tiene que ver la palidez'], espera: /color rojo/ },
  // --- Hemoglobina (slot filling: pide el dato que falta) ---
  { test: null, dice: ['mi hemoglobina es 11.5'], espera: /necesito saber algo más/ },
  { test: null, dice: ['mi hemoglobina es 11.5', 'mujer'], espera: /menor a 12.*por debajo/s },
  { test: null, dice: ['me salió hemoglobina 13,2', 'varón'], espera: /dentro del rango/ },
  { test: null, dice: ['estoy embarazada y mi hemoglobina es 10.8'], espera: /gestante.*por debajo/s },
  { test: null, dice: ['mi hijo tiene hemoglobina de 6.5 g/dl'], espera: /requiere atención médica pronto/ },
  { test: null, dice: ['tengo 25 años y mi hemoglobina es 12.4', 'mujer'], espera: /12.4.*dentro del rango/s },
  { test: null, dice: ['qué es la hemoglobina'], espera: /transporta el oxígeno/ },
  { test: null, dice: ['cuál es el valor normal de hemoglobina'], espera: /12 g\/dL/ },
  // --- Examen ---
  { test: null, dice: ['dónde me hago el examen?'], espera: /centro de salud/ },
  { test: null, dice: ['hay que ir en ayunas al examen?'], espera: /ayunas/ },
  { test: null, dice: ['duele el examen'], espera: /Casi no duele/ },
  { test: null, dice: ['qué es el hierro?'], espera: /mineral/ },
  { test: null, dice: ['cuánto hierro necesito al día'], espera: /18 mg/ },
  // --- Alimentos ---
  { test: null, dice: ['qué debo comer?'], espera: /sangrecita/ },
  { test: null, dice: ['la espinaca tiene hierro?'], espera: /Espinaca/ },
  { test: null, dice: ['cuánto hierro tienen las lentejas'], espera: /Lentejas/ },
  { test: null, dice: ['la betarraga sirve para la anemia?'], espera: /mito/ },
  { test: null, dice: ['qué alimento tiene más hierro'], espera: /Sangrecita/ },
  { test: null, dice: ['el café con la comida está mal?'], espera: /té, el café/ },
  { test: null, dice: ['menus baratos'], espera: /sección \*\*Menús/ },
  { test: null, dice: ['tengo poco dinero para comer'], espera: /Menús/ },
  // --- Glosario (problema: términos sin explicar) ---
  { test: null, dice: ['qué significa mg'], espera: /miligramo/ },
  { test: null, dice: ['qué significa que un plato tenga 6 mg'], espera: /miligramo/ },
  { test: null, dice: ['que es la meta de 18 mg?'], espera: /mujer adulta necesita al día/ },
  { test: null, dice: ['por qué la meta es 18 mg al día'], espera: /18 mg/ },
  { test: null, dice: ['qué es la absorción'], espera: /vitamina C/ },
  { test: null, dice: ['qué es el hierro hemínico'], espera: /hemínico/ },
  { test: null, dice: ['qué significa mg', 'no entiendo'], espera: /medida muy pequeña/ },
  { test: null, dice: ['qué significa mg', 'por qué'], espera: /grano de arroz/ },
  { test: null, dice: ['puedo tomar pastillas de hierro?'], espera: /solo si un profesional/ },
  { test: null, dice: ['qué es la anemia'], espera: /ferropénica/ },
  { test: null, dice: ['quiénes tienen más riesgo'], espera: /gestantes/ },
  // --- Acciones ---
  { test: ['cansancio', 'mareos'], dice: ['quiero programar un recordatorio'], espera: /no los programo yo/ },
  { test: null, dice: ['quiero hacer el test de nuevo'], espera: /Te llevo al test/ },
  // --- Transparencia / confianza / privacidad ---
  { test: null, dice: ['eres humano?'], espera: /No soy una persona ni un médico/ },
  { test: null, dice: ['quién eres'], espera: /Ferri/ },
  { test: null, dice: ['guardas mis datos?'], espera: /no guardo nada/ },
  { test: null, dice: ['qué puedes hacer'], espera: /Puedo:/ },
  // --- Seguridad ---
  { test: null, dice: ['me desmayé hace rato'], espera: /106/ },
  { test: null, dice: ['tengo dolor de pecho y me falta el aire'], espera: /urgencia/ },
  // --- Emoción ---
  { test: ['cansancio', 'mareos', 'palidez', 'unas'], dice: ['estoy preocupada, es grave?'], espera: /se puede tratar/ },
  // --- Charla ---
  { test: null, dice: ['hola'], espera: /Hola/ },
  { test: ['cansancio', 'mareos'], dice: ['buenas tardes'], espera: /ya hiciste el test/ },
  { test: null, dice: ['gracias!'], espera: /De nada/ },
  { test: null, dice: ['chau'], espera: /Cuídate/ },
  // --- Recuperación ante errores (no inventa) ---
  { test: null, dice: ['asdfgh'], espera: /no estoy seguro/i },
  { test: null, dice: ['cuál es la capital de Francia'], espera: /Solo respondo dudas sobre anemia y hierro/ },
  { test: null, dice: ['xyz', 'qwe'], espera: /sigo sin entenderte/ },
  { test: null, dice: ['quiero un nuevo test'], espera: /Te llevo al test/ },
];

let ok = 0;
const fallas = [];
for (const c of casos) {
  let marcados = null;
  const conv = F.crearConversacion({ alActualizarTest: ids => { marcados = ids; } });
  if (c.test) conv.fijarResultado(c.test);
  let r;
  for (const m of c.dice) r = conv.responder(m);
  const texto = [].concat(r.texto, r.lista || []).join(' ');
  if (c.espera.test(texto)) ok++;
  else fallas.push({ dice: c.dice.join(' → '), espera: String(c.espera), obtuvo: texto.slice(0, 160) });
}
console.log(`Ferri: ${ok}/${casos.length} casos correctos (${Math.round(ok / casos.length * 100)} %)`);
fallas.forEach(f => console.log('\n✗', f.dice, '\n  esperaba', f.espera, '\n  obtuvo  ', f.obtuvo));
process.exitCode = fallas.length ? 1 : 0;
