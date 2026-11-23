// =====================================================================
// FERRI · Base de conocimiento del asistente conversacional (Semana 14)
// ---------------------------------------------------------------------
// Aquí vive TODO lo que Ferri sabe. El motor (ferri-motor.js) decide
// qué tema usar; este archivo solo guarda los textos.
// Cada tema tiene varios niveles de explicación:
//   texto  → respuesta normal
//   simple → la misma idea con palabras más fáciles ("no entiendo")
//   porque → la razón detrás ("¿por qué?")          [transparencia]
//   mas    → un detalle extra ("cuéntame más")
// Valores aproximados y con fines educativos. No reemplaza a un médico.
// =====================================================================
(function (global) {
  'use strict';

  const SINTOMAS = {
    cansancio: {
      nombre: 'cansancio',
      sinonimos: ['cansancio', 'cansado', 'cansada', 'agotado', 'agotada', 'agotamiento', 'fatiga', 'fatigado', 'fatigada', 'sueno', 'sin energia', 'flojera', 'debilidad', 'debil', 'sin fuerzas'],
      explicacion: 'La hemoglobina lleva oxígeno a tus músculos. Si tienes poca, tus músculos reciben menos “combustible” y te cansas más rápido, incluso haciendo cosas simples.',
      simple: 'Tu cuerpo usa el hierro para mover oxígeno. Con poco hierro, te quedas sin energía más rápido.',
      otrasCausas: 'dormir poco, estrés o una mala alimentación en general'
    },
    mareos: {
      nombre: 'mareos',
      sinonimos: ['mareo', 'mareos', 'mareado', 'mareada', 'me mareo', 'vertigo', 'se me nubla la vista', 'nublada'],
      explicacion: 'Cuando llega menos oxígeno al cerebro, puedes sentir mareos, sobre todo al pararte rápido.',
      simple: 'Si a tu cabeza llega poco oxígeno, te puedes marear.',
      otrasCausas: 'presión baja, no haber comido o deshidratación'
    },
    palidez: {
      nombre: 'palidez',
      sinonimos: ['palidez', 'palido', 'palida', 'piel blanca', 'sin color', 'cara blanca'],
      explicacion: 'La hemoglobina es la que da el color rojo a la sangre. Con menos hemoglobina, la piel, los labios y el interior de los párpados se ven más claros.',
      simple: 'La hemoglobina da color a la sangre. Si baja, te ves más pálido o pálida.',
      otrasCausas: 'frío, poca exposición al sol o el tono natural de tu piel'
    },
    unas: {
      nombre: 'uñas quebradizas',
      sinonimos: ['unas quebradizas', 'las unas', 'mis unas', 'unas debiles', 'se me rompen las unas', 'quebradizas', 'quebradiza'],
      explicacion: 'Con poco hierro, el cuerpo prioriza los órganos importantes y descuida uñas y cabello. Por eso se rompen o se ven delgadas.',
      simple: 'Si falta hierro, las uñas se vuelven débiles.',
      otrasCausas: 'usar mucho detergente o esmalte, o lavarte las manos muy seguido'
    },
    'dolor-cabeza': {
      nombre: 'dolor de cabeza',
      sinonimos: ['dolor de cabeza', 'me duele la cabeza', 'cefalea', 'jaqueca', 'migrana', 'cabeza'],
      explicacion: 'Si al cerebro le llega menos oxígeno, puede aparecer dolor de cabeza frecuente.',
      simple: 'Poco oxígeno en la cabeza puede causar dolor de cabeza.',
      otrasCausas: 'estrés, pantallas, poca agua o dormir mal'
    }
  };

  // Estados del semáforo del test (mismos límites que test-sintomas.js)
  const ESTADOS = {
    'estado-verde': {
      color: 'verde', emoji: '🟢', rango: '0 o 1 síntoma',
      significado: 'Por ahora **no hay señales claras** de anemia. Tener uno o ningún síntoma es común y puede deberse a otras cosas.',
      simple: 'Verde = tranquilo. Casi no tienes señales de anemia.',
      hacer: ['Sigue comiendo alimentos con hierro.', 'Si el síntoma no se va en unas semanas, consulta en tu centro de salud.'],
      porque: 'El test cuenta cuántos síntomas marcaste. Con 0 o 1 sale verde, porque un solo síntoma aislado suele tener otras causas.'
    },
    'estado-amarillo': {
      color: 'amarillo', emoji: '🟡', rango: '2 o 3 síntomas',
      significado: 'Tienes **algunas señales** que suelen aparecer con la anemia. **No significa que tengas anemia**: significa que vale la pena confirmarlo con un examen de hemoglobina.',
      simple: 'Amarillo = atención. Puede ser anemia o no. Un examen de sangre rápido te lo dice.',
      hacer: ['Hazte un examen de hemoglobina en las próximas semanas (es rápido: un pinchazo en el dedo).', 'Mientras tanto, come más alimentos con hierro y acompáñalos con limón o naranja.', 'Puedes programar un recordatorio para no olvidarlo.'],
      porque: 'El test cuenta cuántos síntomas marcaste. Desde 2 síntomas a la vez sale amarillo, porque es menos probable que sea solo casualidad.'
    },
    'estado-rojo': {
      color: 'rojo', emoji: '🔴', rango: '4 o 5 síntomas',
      significado: 'Tienes **muchas señales a la vez** que suelen aparecer con la anemia. Aun así, **solo un examen puede confirmarlo**. Lo recomendable es hacerte el examen de hemoglobina pronto.',
      simple: 'Rojo = no lo dejes pasar. Ve a tu centro de salud y pide un examen de hemoglobina pronto.',
      hacer: ['Hazte un examen de hemoglobina lo antes posible y consulta a un profesional de salud.', 'No tomes pastillas de hierro por tu cuenta: primero confirma con el examen.', 'Programa ahora un recordatorio para tu control.'],
      porque: 'El test cuenta cuántos síntomas marcaste. Desde 4 síntomas sale rojo: cuando aparecen varios juntos, la probabilidad de anemia es mayor.'
    }
  };

  // Alimentos: hierro aproximado por porción casera (valores de referencia educativos)
  const ALIMENTOS = [
    { id: 'sangrecita', nombre: 'sangrecita', sin: ['sangrecita', 'sangre de pollo', 'sangrecita de pollo'], mg: 'unos 8 a 10 mg', porcion: '2 cucharadas (30 g)', tipo: 'hemo', nivel: 'muy alto', nota: 'Es de los alimentos con más hierro y de los más baratos en el Perú.' },
    { id: 'bazo', nombre: 'bazo de res', sin: ['bazo'], mg: 'unos 9 mg', porcion: 'un trozo (30 g)', tipo: 'hemo', nivel: 'muy alto', nota: 'Puedes prepararlo frito o en guiso.' },
    { id: 'higado', nombre: 'hígado', sin: ['higado', 'higadito', 'higado de pollo', 'higado de res'], mg: 'unos 3 a 4 mg', porcion: 'un filete pequeño (40 g)', tipo: 'hemo', nivel: 'alto', nota: 'El hígado de pollo es barato y fácil de cocinar encebollado.' },
    { id: 'bofe', nombre: 'bofe', sin: ['bofe', 'pulmon'], mg: 'unos 3 mg', porcion: '40 g', tipo: 'hemo', nivel: 'alto', nota: 'Muy usado en guisos y anticuchos caseros.' },
    { id: 'res', nombre: 'carne de res', sin: ['carne', 'res', 'carne roja', 'bistec', 'lomo'], mg: 'unos 2 a 3 mg', porcion: 'un bistec (100 g)', tipo: 'hemo', nivel: 'medio', nota: 'Las vísceras tienen más hierro que la carne.' },
    { id: 'pescado', nombre: 'pescado oscuro (bonito, jurel, anchoveta)', sin: ['pescado', 'bonito', 'jurel', 'anchoveta', 'caballa', 'sardina', 'atun'], mg: 'unos 1.5 a 3 mg', porcion: 'un filete (100 g)', tipo: 'hemo', nivel: 'medio', nota: 'La sardina en lata es una opción económica.' },
    { id: 'pollo', nombre: 'pollo', sin: ['pollo', 'pechuga', 'gallina'], mg: 'alrededor de 1 mg', porcion: 'una presa (100 g)', tipo: 'hemo', nivel: 'bajo', nota: 'Tiene poco hierro; las menudencias (hígado, sangrecita) tienen mucho más.' },
    { id: 'huevo', nombre: 'huevo', sin: ['huevo', 'huevos'], mg: 'alrededor de 1 mg', porcion: '1 huevo', tipo: 'no-hemo', nivel: 'bajo', nota: 'Suma, pero no basta por sí solo.' },
    { id: 'lentejas', nombre: 'lentejas', sin: ['lenteja', 'lentejas'], mg: 'unos 3 mg', porcion: '1 taza cocida', tipo: 'no-hemo', nivel: 'medio', nota: 'Acompáñalas con limón o naranja para absorber más hierro.' },
    { id: 'frejoles', nombre: 'frejoles y pallares', sin: ['frejol', 'frejoles', 'frijol', 'frijoles', 'pallar', 'pallares', 'garbanzo', 'garbanzos', 'menestra', 'menestras'], mg: 'unos 2 a 3 mg', porcion: '1 taza cocida', tipo: 'no-hemo', nivel: 'medio', nota: 'Las menestras son baratas y rinden mucho.' },
    { id: 'espinaca', nombre: 'espinaca', sin: ['espinaca', 'espinacas', 'acelga', 'verduras verdes', 'hojas verdes'], mg: 'unos 2 a 3 mg', porcion: '1 taza cocida', tipo: 'no-hemo', nivel: 'medio', nota: 'Tiene hierro, pero se absorbe poco. No es tan poderosa como dicen los dibujos animados: la sangrecita tiene mucho más.' },
    { id: 'quinua', nombre: 'quinua, kiwicha y cañihua', sin: ['quinua', 'quinoa', 'kiwicha', 'canihua', 'canahua', 'avena'], mg: 'unos 1.5 a 3 mg', porcion: '1 taza cocida', tipo: 'no-hemo', nivel: 'medio', nota: 'La cañihua es el grano andino con más hierro.' },
    { id: 'betarraga', nombre: 'betarraga', sin: ['betarraga', 'remolacha', 'beterraga'], mg: 'menos de 1 mg', porcion: '1 taza', tipo: 'no-hemo', nivel: 'bajo', nota: 'Es un mito: su color rojo no significa que tenga mucho hierro.' },
    { id: 'leche', nombre: 'leche y quesos', sin: ['leche', 'queso', 'yogur', 'yogurt'], mg: 'casi nada', porcion: '1 vaso', tipo: 'no-hemo', nivel: 'muy bajo', nota: 'Además, el calcio dificulta absorber el hierro si lo tomas en la misma comida.' }
  ];

  const TEMAS = {
    hemoglobina: {
      texto: 'La **hemoglobina** es una proteína de tus glóbulos rojos que **transporta el oxígeno** por todo el cuerpo. Para fabricarla, tu cuerpo necesita **hierro**. Si te falta hierro, baja la hemoglobina y aparece la anemia.',
      simple: 'Es la parte de la sangre que lleva el aire (oxígeno) a todo tu cuerpo. Se hace con hierro.',
      porque: 'Te lo explico porque el test te recomienda un examen de hemoglobina: ese examen mide cuánta tienes.',
      mas: 'Valores de referencia de la OMS (aproximados): mujeres desde 12 g/dL, varones desde 13 g/dL, gestantes desde 11 g/dL y niños de 6 meses a 5 años desde 11 g/dL. Por debajo de eso se habla de anemia. En zonas de altura los valores se ajustan.',
      fuente: 'OMS, valores de corte de hemoglobina'
    },
    anemia: {
      texto: 'La **anemia ferropénica** pasa cuando tu cuerpo no tiene suficiente **hierro** para producir hemoglobina. Es muy común en el Perú, sobre todo en niños pequeños, gestantes y adolescentes. **Se puede prevenir y tratar** comiendo hierro y, si el médico lo indica, con suplementos.',
      simple: 'Es cuando te falta hierro en la sangre. Te cansa y te pone pálido, pero se puede curar.',
      porque: 'Los 5 síntomas del test (cansancio, mareos, palidez, uñas quebradizas y dolor de cabeza) son señales típicas de la anemia por falta de hierro.',
      mas: 'En niños pequeños es especialmente importante prevenirla, porque puede afectar su desarrollo y aprendizaje. Por eso en los centros de salud del MINSA hacen el tamizaje de hemoglobina gratis a niños y gestantes.',
      fuente: 'MINSA · Plan de reducción de la anemia'
    },
    examen: {
      texto: 'El **examen de hemoglobina** es rápido y sencillo: te pinchan un dedo (o sacan una muestra del brazo) y en pocos minutos sabes tu valor. Lo puedes pedir en tu **centro de salud del MINSA**, en **EsSalud** si tienes seguro, o en un laboratorio particular.',
      simple: 'Es un pinchazo en el dedo. En minutos sabes si tienes anemia.',
      porque: 'Te lo recomiendo porque el test solo **cuenta síntomas**; el examen es lo único que **mide** tu hemoglobina de verdad.',
      mas: '**Casi no duele**: es un pinchazo rápido en el dedo, como una picadura, y dura segundos. Normalmente no necesitas ir en ayunas para un examen de hemoglobina simple, pero confírmalo en tu centro de salud. En niños menores de 5 años y gestantes suele ser gratuito en el MINSA. Si tienes dudas puedes llamar a la Línea 113 (MINSA).',
      fuente: 'MINSA · Línea 113'
    },
    hierro: {
      texto: 'El **hierro** es un mineral que tu cuerpo necesita para fabricar **hemoglobina**, la parte de la sangre que lleva oxígeno a todo el cuerpo. Tu cuerpo no lo produce: **lo obtienes de lo que comes**.',
      simple: 'Es un mineral de la comida que tu sangre necesita para llevar oxígeno.',
      porque: 'Sin suficiente hierro baja la hemoglobina, y por eso aparecen síntomas como cansancio o palidez.',
      mas: 'Una mujer adulta necesita unos 18 mg de hierro al día, un varón unos 8 mg y una gestante unos 27 mg. Por eso el semáforo diario de la página usa una meta de 18 mg.',
      fuente: 'OMS / MINSA'
    },
    absorcion: {
      texto: 'Truco para **absorber más hierro**: acompaña tus comidas con algo que tenga **vitamina C** (limón, naranja, mandarina, tomate). Y **evita el té, el café o las infusiones** justo con la comida: dificultan que el hierro se absorba. Déjalos para una hora después.',
      simple: 'Come con limón o naranja. No tomes té ni café con la comida.',
      porque: 'El hierro de las plantas (lentejas, espinaca) se absorbe poco. La vitamina C lo “ayuda a entrar”, y el té y el café lo “bloquean”.',
      mas: 'Hay dos tipos de hierro: el **hemínico** (sangrecita, hígado, bazo, carnes) se absorbe mucho mejor que el **no hemínico** (menestras, verduras, granos). Combinar ambos en el mismo plato también ayuda.',
      fuente: 'Guías alimentarias MINSA / CENAN'
    },
    alimentos: {
      texto: 'Los alimentos con **más hierro** y que más se absorben son de origen animal: **sangrecita, bazo, hígado y bofe**. También ayudan las **lentejas, frejoles, quinua y espinaca**, sobre todo si las acompañas con limón o naranja.',
      simple: 'Lo mejor: sangrecita, hígado y bazo. También lentejas y frejoles con limón.',
      porque: 'Te recomiendo primero las vísceras porque tienen el hierro que mejor absorbe el cuerpo y además son baratas.',
      mas: 'Una meta práctica: incluir **2 cucharadas de un alimento rico en hierro de origen animal al día**. En la sección “Menús por presupuesto” tienes ideas desde S/ 10.',
      fuente: 'MINSA · Recomendaciones para prevenir la anemia'
    },
    suplemento: {
      texto: 'Los **suplementos de hierro** (como el sulfato ferroso) se toman **solo si un profesional de salud los indica**, con la dosis que él te diga. Tomar hierro por tu cuenta puede causar molestias y esconder otro problema.',
      simple: 'Las pastillas de hierro solo con receta. No las tomes por tu cuenta.',
      porque: 'Te lo digo porque no sé tu valor real de hemoglobina: un exceso de hierro también hace daño.',
      mas: 'Molestias comunes: estreñimiento, heces oscuras o malestar de estómago. Suelen tomarse con jugo de naranja y lejos de la leche o el té. Si tienes molestias, coméntalo con tu médico: no lo dejes de golpe sin avisar.',
      fuente: 'MINSA · Suplementación con hierro'
    },
    riesgo: {
      texto: 'Los grupos con **más riesgo** de anemia son: **niños de 6 meses a 3 años**, **gestantes**, **adolescentes mujeres** y personas que comen pocos alimentos de origen animal.',
      simple: 'Más riesgo: bebés, embarazadas y adolescentes mujeres.',
      porque: 'Estos grupos necesitan más hierro porque están creciendo o formando a un bebé.',
      mas: 'Una gestante necesita unos 27 mg de hierro al día, una mujer adulta unos 18 mg y un varón adulto unos 8 mg.',
      fuente: 'OMS / MINSA'
    },
    confianza: {
      texto: 'Te soy transparente: el test es una **orientación**, no un diagnóstico. **Solo cuenta** cuántos síntomas marcaste (0–1 verde, 2–3 amarillo, 4–5 rojo). No sabe tu edad, tu alimentación ni tu valor de hemoglobina. Por eso, ante la duda, **el examen es lo que vale**.',
      simple: 'El test solo te orienta. El examen de sangre es el que confirma.',
      porque: 'Prefiero que sepas los límites del test para que tomes tus decisiones con información real.',
      mas: 'Yo (Ferri) tampoco soy un médico: soy un asistente automático que responde con información general del MINSA y la OMS. Si algo de lo que digo no te sirve, puedes marcarlo con 👎 y te lo explico de otra forma.',
      fuente: 'Diseño del test de síntomas (HU05)'
    },
    privacidad: {
      texto: 'Tranquilo o tranquila: **no guardo nada** en ningún servidor. Tus respuestas del test y esta conversación solo viven en esta pestaña del navegador y se borran al cerrarla. Puedes borrar la conversación cuando quieras con el botón **↺**.',
      simple: 'No guardo tus datos. Todo se borra al cerrar la página.',
      porque: 'Hablamos de salud, que es información sensible; por eso Ferri funciona dentro de tu navegador.',
      mas: 'Si usas el micrófono, el reconocimiento de voz lo hace tu propio navegador (por ejemplo Chrome). Si no quieres usarlo, puedes escribir.',
      fuente: 'Política de la demo'
    },
    test: {
      texto: 'El **test rápido de síntomas** te pregunta por 5 señales comunes de anemia: cansancio, mareos, palidez, uñas quebradizas y dolor de cabeza. Según **cuántas** marques, te muestra un semáforo: **verde** (0–1), **amarillo** (2–3) o **rojo** (4–5).',
      simple: 'Marcas lo que sientes y te da un color: verde, amarillo o rojo.',
      porque: 'Usamos un semáforo porque es fácil de entender de un vistazo.',
      mas: 'Puedes decirme cosas como “también tengo mareos” o “ya no tengo dolor de cabeza” y actualizo tu test aquí mismo.',
      fuente: 'HU05 · Test rápido de síntomas'
    }
  };

  const URGENCIA = {
    patrones: ['desmaye', 'desmayo', 'me desmaye', 'perdi el conocimiento', 'dolor de pecho', 'dolor en el pecho', 'me falta el aire', 'falta de aire', 'no puedo respirar', 'ahogo', 'sangrado', 'sangro mucho', 'vomito sangre', 'heces negras', 'corazon acelerado', 'palpitaciones fuertes', 'me quiero morir', 'emergencia'],
    texto: '⚠️ Lo que describes **puede ser una urgencia**. No esperes al resultado de un test: **busca atención médica ahora**. En el Perú puedes llamar al **106 (SAMU)** o acudir a la emergencia más cercana. Si es posible, no vayas solo o sola.'
  };

  global.FerriConocimiento = { SINTOMAS, ESTADOS, ALIMENTOS, TEMAS, URGENCIA };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.FerriConocimiento;
})(typeof window !== 'undefined' ? window : globalThis);
