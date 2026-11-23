// =====================================================================
// FERRI · Motor conversacional (Semana 14 · Human-AI Interaction)
// ---------------------------------------------------------------------
// Sin servidores ni claves: corre 100 % en el navegador (y en Node para
// las pruebas automáticas de tests/probar-ferri.js).
//
// Cómo "entiende":
//  1. NORMALIZA el mensaje (minúsculas, sin tildes, sin signos).
//  2. EXTRAE ENTIDADES: síntomas, alimentos, números (hemoglobina),
//     grupo (gestante, niño, varón, mujer).
//  3. CLASIFICA LA INTENCIÓN con un puntaje por palabras clave y frases,
//     tolerando errores de tipeo (distancia de Levenshtein).
//  4. USA EL CONTEXTO: recuerda el resultado del test, el último tema y
//     preguntas pendientes ("¿lo agrego a tu test?"), así entiende
//     respuestas cortas como "sí", "¿por qué?", "más" o "no entiendo".
//  5. SI NO ESTÁ SEGURO, NO INVENTA: propone opciones ("¿quisiste decir…?").
//
// Principios HAI aplicados: transparencia (dice en qué se basa),
// control del usuario (confirma antes de cambiar el test), confianza
// (aclara límites: no es médico) y recuperación ante errores.
// =====================================================================
(function (global) {
  'use strict';

  const K = global.FerriConocimiento || (typeof require !== 'undefined' ? require('./ferri-conocimiento.js') : null);
  const { SINTOMAS, ESTADOS, ALIMENTOS, TEMAS, URGENCIA } = K;

  // ---------- 1. Utilidades de texto ----------
  function normalizar(t) {
    return String(t || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9.,\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function palabras(t) { return t.replace(/[.,]/g, ' ').split(' ').filter(Boolean); }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 2) return 3;
    const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let previo = fila[0]; fila[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = fila[j];
        fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, previo + (a[i - 1] === b[j - 1] ? 0 : 1));
        previo = tmp;
      }
    }
    return fila[b.length];
  }

  // Palabras comunes que NUNCA se corrigen como typo (evita "nuevo"→"huevo", "menos"→"menus")
  const NO_CORREGIR = new Set(['menos', 'nuevo', 'nueva', 'color', 'todos', 'todas', 'cuanto', 'cuando', 'donde', 'puedo', 'puedes', 'quiero', 'ahora', 'mejor', 'otra', 'otro', 'cosas', 'tiene', 'tienes', 'hacer', 'saber', 'verde', 'sabes', 'estas', 'estos', 'luego', 'mucho', 'mucha', 'poco', 'pocos', 'bueno', 'buena', 'malo', 'mala', 'nada', 'algo', 'siempre', 'veces', 'dias', 'manana', 'tarde', 'noche', 'casa', 'comida', 'carta', 'parte', 'pasos', 'pasa', 'paso', 'peso', 'mesa', 'cama', 'cara', 'unas', 'unos']);
  let VOCAB = null; // todas las palabras que el motor conoce (se llena al iniciar)

  // ¿El texto contiene la expresión? (frase exacta o palabra con tolerancia a typos)
  function contiene(texto, lista, expr) {
    if (expr.includes(' ')) return (' ' + texto.replace(/[.,]/g, ' ').replace(/\s+/g, ' ') + ' ').includes(' ' + expr + ' ');
    for (const p of lista) {
      if (p === expr) return true;
      const corregible = !NO_CORREGIR.has(p) && !(VOCAB && VOCAB.has(p));
      if (corregible && expr.length >= 5 && p.length >= 4 && levenshtein(p, expr) <= (expr.length >= 8 ? 2 : 1)) return true;
      // prefijo: "alimentacion" ~ "aliment", "examenes" ~ "examen"
      if (expr.length >= 5 && p.length > expr.length && p.startsWith(expr)) return true;
    }
    return false;
  }

  // ---------- 2. Intenciones ----------
  // Cada intención: claves (palabra/frase → peso). Puntaje = suma de pesos.
  const INTENCIONES = {
    saludo:        { hola: 3, holi: 3, buenas: 3, 'buenos dias': 3, 'buenas tardes': 3, 'buenas noches': 3, hey: 2, alo: 2 },
    despedida:     { chau: 4, adios: 4, 'hasta luego': 4, bye: 4, 'me voy': 3 },
    gracias:       { gracias: 4, agradezco: 4, 'muy amable': 3, genial: 1.5, perfecto: 1.5, chevere: 1.5, buenazo: 1.5, excelente: 1.5 },
    identidad:     { 'quien eres': 5, 'que eres': 5, 'eres humano': 5, 'eres un robot': 5, 'eres una ia': 5, 'eres real': 4, 'como te llamas': 5, ferri: 1, bot: 2, robot: 2, 'inteligencia artificial': 3 },
    capacidades:   { 'que puedes hacer': 6, 'en que me ayudas': 5, 'en que me puedes ayudar': 6, ayuda: 2, ayudame: 2, opciones: 2, 'que sabes': 4, menu: 1 },
    explicar_resultado: { resultado: 3, 'mi resultado': 4, significa: 2.5, 'que significa': 3, 'no entiendo': 2, 'no entendi': 2, explica: 2.5, explicame: 3, semaforo: 2.5, color: 1.5, salio: 2, 'me salio': 3, amarillo: 2, rojo: 2, verde: 2, test: 1.5, interpreta: 3, quiere: 0.5, 'que quiere decir': 3 },
    razon_resultado: { 'por que': 2, porque: 1.5, 'por que me salio': 5, 'por que sali': 5, razon: 3, motivo: 3, 'como se calcula': 5, calcula: 3, criterio: 3, 'como funciona el test': 5 },
    que_hacer:     { 'que hago': 5, 'que debo hacer': 6, 'que tengo que hacer': 6, 'ahora que': 4, 'siguiente paso': 5, 'pasos': 2, recomiendas: 3, recomendacion: 3, 'que me recomiendas': 5, aconsejas: 3, consejo: 2 },
    examen:        { examen: 4, analisis: 3, prueba: 1.5, 'prueba de sangre': 5, laboratorio: 3, 'donde me hago': 4, tamizaje: 4, 'pinchazo': 3, ayunas: 3, duele: 2, 'cuanto cuesta': 2, posta: 3, 'centro de salud': 3, essalud: 3, minsa: 2, hospital: 2, 'sacar sangre': 4 },
    hemoglobina:   { hemoglobina: 4, 'que es la hemoglobina': 6, globulos: 3, 'globulos rojos': 4, oxigeno: 2, valores: 2, 'valor normal': 4, normal: 1 },
    hierro:        { 'que es el hierro': 6, 'para que sirve el hierro': 7, 'por que es importante el hierro': 7, 'cuanto hierro necesito': 7, 'cuanto hierro debo': 7, 'necesito hierro': 4 },
    anemia:        { anemia: 3.5, 'que es la anemia': 6, 'que es anemia': 6, ferropenica: 4, 'tengo anemia': 3, anemico: 3, anemica: 3, 'se cura': 3, curar: 2 },
    sintoma_info:  { sintoma: 2, sintomas: 2, 'por que me': 2, 'tiene que ver': 3, relacion: 3, causa: 2, 'por que da': 3, 'por que se': 2 },
    agregar_sintoma: { 'tambien tengo': 6, 'tambien siento': 6, 'tambien me': 4, 'ademas tengo': 6, 'ademas me': 4, agrega: 5, agregar: 5, anade: 5, 'me olvide de marcar': 6, 'olvide marcar': 6, 'me falto marcar': 6, 'tengo': 1, 'siento': 1, 'me siento': 1.5, 'ultimamente': 1 },
    quitar_sintoma: { 'ya no tengo': 6, 'no tengo': 3, quita: 5, quitar: 5, saca: 4, elimina: 5, borra: 3, 'me equivoque': 5, 'marque mal': 6, 'no era': 3, desmarca: 6 },
    rehacer_test:  { 'de nuevo': 3, 'otra vez el test': 6, 'repetir el test': 6, 'volver a hacer': 5, rehacer: 5, 'hacer el test': 5, 'empezar de nuevo': 5, reiniciar: 3, 'nuevo test': 5 },
    alimentos:     { comer: 3, comida: 3, alimentos: 3.5, alimento: 3, alimentacion: 3, dieta: 3, 'que como': 5, 'que debo comer': 6, 'con hierro': 3, 'tienen hierro': 3, 'tiene hierro': 3, hierro: 1.5, nutricion: 3, platos: 2, recetas: 3, receta: 3 },
    absorcion:     { absorber: 4, absorcion: 4, 'vitamina c': 5, vitamina: 3, limon: 3, naranja: 3, te: 1, cafe: 3, infusion: 3, 'con la comida': 2, combinar: 3, mezclar: 2 },
    suplemento:    { suplemento: 5, suplementos: 5, pastilla: 4, pastillas: 4, 'sulfato ferroso': 6, sulfato: 4, jarabe: 4, gotas: 3, multimicronutrientes: 5, chispitas: 5, vitaminas: 2, 'tomar hierro': 5, efectos: 2, estrenimiento: 3 },
    valor_hb:      { 'mi hemoglobina es': 6, 'tengo hemoglobina': 5, 'me salio hemoglobina': 6, 'hemoglobina de': 4, 'g dl': 4, gdl: 4, },
    mg:            { mg: 3, miligramo: 6, miligramos: 6, 'que es mg': 7, 'que significa mg': 7, 'que son los mg': 7, 'que quiere decir mg': 7 },
    meta:          { meta: 4, 'meta de 18': 7, '18 mg': 6, 'meta diaria': 7, 'mi meta': 5, 'cumplir la meta': 6, 'semaforo de hierro': 5, 'semaforo diario': 6 },
    heminico:      { heminico: 7, 'no heminico': 7, 'tipos de hierro': 7, 'hierro animal': 5, 'hierro vegetal': 5 },
    programar_control: { recordatorio: 5, recordar: 4, 'programar': 4, programa: 3, agendar: 4, agenda: 3, cita: 4, alarma: 4, aviso: 3, 'no olvidar': 4, control: 2.5 },
    menus:         { menu: 3, menus: 4, presupuesto: 5, barato: 4, baratos: 4, economico: 4, soles: 3, plata: 2, dinero: 2, cuesta: 1, 'poco dinero': 5 },
    preocupacion:  { grave: 5, 'es grave': 6, preocupado: 5, preocupada: 5, miedo: 5, asustado: 5, asustada: 5, peligroso: 4, 'me voy a morir': 6, nervioso: 4, nerviosa: 4, malo: 1.5 },
    diagnostico:   { 'tengo anemia': 5, 'estoy enfermo': 5, 'estoy enferma': 5, 'soy anemico': 5, 'soy anemica': 5, diagnostico: 4, 'seguro que': 2, confirmar: 2 },
    confianza:     { confiar: 5, confiable: 5, fiable: 5, 'que tan seguro': 6, preciso: 4, precision: 4, exacto: 4, 'es real': 2, 'eres medico': 6, medico: 1.5, 'te equivocas': 4, limites: 4 },
    privacidad:    { datos: 3, privacidad: 6, guardas: 4, guardan: 4, 'mis datos': 5, 'se guarda': 5, comparten: 4, seguro: 0.5 },
    riesgo:        { gestante: 4, embarazada: 4, embarazo: 4, 'mi hijo': 3, 'mi hija': 3, bebe: 3, nino: 3, ninos: 3, ninas: 3, adolescente: 3, riesgo: 4, 'quienes': 1 }
  };

  // Mensajes cortos de seguimiento (dependen del contexto)
  const SEGUIMIENTO = {
    si: ['si', 'sii', 'si porfa', 'si por favor', 'claro', 'ok', 'okey', 'dale', 'ya', 'bueno', 'de acuerdo', 'afirmativo', 'correcto', 'si agregalo', 'si quitalo', 'hazlo', 'por favor', 'porfa'],
    no: ['no', 'nop', 'no gracias', 'mejor no', 'negativo', 'nel', 'todavia no', 'aun no', 'cancelar', 'cancela'],
    porque: ['por que', 'porque', 'por que', 'y eso', 'y eso por que', 'como asi', 'en serio', 'por que dices eso', 'en que te basas', 'de donde sacas eso', 'fuente', 'por que me dices eso'],
    mas: ['mas', 'cuentame mas', 'dime mas', 'mas info', 'mas informacion', 'algo mas', 'y que mas', 'sigue', 'continua', 'amplia', 'detalles', 'mas detalles', 'y luego', 'otro dato', 'ok y'],
    simple: ['no entiendo', 'no entendi', 'no te entiendo', 'mas simple', 'mas facil', 'explicame mejor', 'explica mejor', 'que', 'como', 'eh', 'no comprendo', 'en palabras simples', 'con palabras simples', 'muy complicado', 'no capto', 'otra forma', 'de otra forma', 'que significa eso'],
    repetir: ['repite', 'repitelo', 'otra vez', 'de nuevo', 'repetir']
  };

  // ---------- 3. Extracción de entidades ----------
  function extraerSintomas(n) {
    const lista = palabras(n), encontrados = [];
    for (const [id, s] of Object.entries(SINTOMAS)) {
      if (s.sinonimos.some(x => contiene(n, lista, x))) encontrados.push(id);
    }
    // "cabeza" sola es ambigua con "dolor de cabeza": ya incluida como sinónimo
    return encontrados;
  }

  function extraerAlimentos(n) {
    const lista = palabras(n);
    return ALIMENTOS.filter(a => a.sin.some(x => contiene(n, lista, x)));
  }

  function extraerNumero(n) {
    for (const m of n.matchAll(/(\d{1,3})(?:[.,](\d))?/g)) {
      const v = parseFloat(m[1] + (m[2] ? '.' + m[2] : ''));
      if (v >= 3 && v <= 22) return v;   // rango posible de hemoglobina en g/dL
    }
    return null;
  }

  function extraerGrupo(n) {
    if (/(gestante|embarazada|embarazo|estoy esperando)/.test(n)) return 'gestante';
    if (/(nino|nina|bebe|hijo|hija|menor de 5|anos de edad)/.test(n)) return 'nino';
    if (/(varon|hombre|soy chico|masculino)/.test(n)) return 'varon';
    if (/(mujer|soy chica|femenino|senora|senorita)/.test(n)) return 'mujer';
    return null;
  }

  const CORTE_HB = { mujer: 12, varon: 13, gestante: 11, nino: 11 };
  const NOMBRE_GRUPO = { mujer: 'una mujer (no gestante)', varon: 'un varón', gestante: 'una gestante', nino: 'un niño o niña de 6 meses a 5 años' };

  // ---------- 4. Clasificador ----------
  function puntuar(n) {
    const lista = palabras(n), puntajes = {};
    for (const [intencion, claves] of Object.entries(INTENCIONES)) {
      let p = 0;
      for (const [expr, peso] of Object.entries(claves)) if (peso && contiene(n, lista, expr)) p += peso;
      if (p > 0) puntajes[intencion] = p;
    }
    return puntajes;
  }

  function esSeguimiento(n, tipo) {
    return SEGUIMIENTO[tipo].some(f => n === f || n === f + ' porfa' || n === f + ' por favor');
  }

  // ---------- 5. Formato de respuestas ----------
  // Una respuesta = { texto: [párrafos], lista?: [..], chips?: [..], acciones?: [..], base?: 'en qué se basa', tema? }
  function r(obj) { return Object.assign({ texto: [], chips: [], acciones: [] }, obj); }

  function listaSintomas(ids) {
    const nombres = ids.map(id => SINTOMAS[id].nombre);
    if (nombres.length <= 1) return nombres.join('');
    return nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
  }

  function estadoDe(cantidad) {
    if (cantidad >= 4) return 'estado-rojo';
    if (cantidad >= 2) return 'estado-amarillo';
    return 'estado-verde';
  }

  // ---------- 6. Gestor de diálogo ----------
  function crearConversacion(opciones) {
    const ctx = {
      resultado: null,        // { sintomas: [...ids], estado: 'estado-amarillo' }
      ultimoTema: null,       // clave de TEMAS, 'resultado', 'sintoma:<id>' o 'alimento:<id>'
      ultimaRespuesta: null,
      nivel: 'normal',        // 'simple' cuando el usuario dice "no entiendo"
      pendiente: null,        // { tipo: 'agregar'|'quitar', sintomas: [...] } o { tipo: 'grupo', valor }
      fallos: 0,
      alActualizarTest: (opciones && opciones.alActualizarTest) || function () {}
    };

    function base(textoBase) { return textoBase; }

    // ----- Respuestas por tema -----
    function responderTema(clave, modo) {
      const t = TEMAS[clave];
      ctx.ultimoTema = clave;
      if (modo === 'simple') return r({ texto: [t.simple], chips: ['Cuéntame más', '¿Por qué?'], base: t.fuente, tema: clave });
      if (modo === 'porque') return r({ texto: [t.porque], chips: ['Cuéntame más', '¿Qué hago ahora?'], base: t.fuente, tema: clave });
      if (modo === 'mas') return r({ texto: [t.mas], chips: chipsSegun(clave), base: t.fuente, tema: clave });
      return r({ texto: [ctx.nivel === 'simple' ? t.simple : t.texto], chips: chipsSegun(clave), base: t.fuente, tema: clave });
    }

    function chipsSegun(clave) {
      const mapa = {
        mg: ['¿Qué es la meta de 18 mg?', '¿Qué es la absorción?', '¿Qué alimento tiene más hierro?'],
        meta: ['¿Qué significa mg?', '¿Qué alimento tiene más hierro?', '¿Qué es la absorción?'],
        hierro: ['¿Qué debo comer?', '¿Cuánto hierro necesito?', '¿Qué es la hemoglobina?'],
        hemoglobina: ['¿Dónde me hago el examen?', '¿Qué valor es normal?', '¿Qué debo comer?'],
        anemia: ['¿Tengo anemia?', '¿Qué debo comer?', '¿Quiénes tienen más riesgo?'],
        examen: ['¿Hay que ir en ayunas?', '¿Duele el examen?', '¿Qué es la hemoglobina?'],
        absorcion: ['¿Qué alimentos tienen hierro?', '¿Qué significa mg?'],
        alimentos: ['¿Cómo absorbo mejor el hierro?', '¿Qué significa mg?', '¿La espinaca tiene hierro?'],
        suplemento: ['¿Dónde me hago el examen?', '¿Qué debo comer?'],
        riesgo: ['¿Qué es la anemia?', '¿Dónde me hago el examen?'],
        confianza: ['¿Dónde me hago el examen?', 'Explícame mi resultado'],
        privacidad: ['Explícame mi resultado', '¿Qué puedes hacer?'],
        test: ['Explícame mi resultado', 'Hacer el test']
      };
      return mapa[clave] || ['Explícame mi resultado'];
    }

    function sinResultado() {
      ctx.ultimoTema = 'test';
      return r({
        texto: ['Todavía no veo un resultado del test. 🙂 Primero marca tus síntomas en el **Test rápido de síntomas** y pulsa **Ver resultado**; luego te lo explico paso a paso.', 'También puedes decirme directamente qué sientes, por ejemplo: “tengo cansancio y mareos”.'],
        chips: ['¿Cómo funciona el test?', 'Tengo cansancio y mareos'],
        acciones: [{ tipo: 'ir', destino: '#test-sintomas', etiqueta: 'Ir al test' }]
      });
    }

    function explicarResultado(modo) {
      if (!ctx.resultado) return sinResultado();
      const { sintomas, estado } = ctx.resultado;
      const e = ESTADOS[estado];
      ctx.ultimoTema = 'resultado';
      const cuantos = sintomas.length === 0 ? 'ningún síntoma' : sintomas.length === 1 ? '1 síntoma (' + listaSintomas(sintomas) + ')' : sintomas.length + ' síntomas (' + listaSintomas(sintomas) + ')';
      const baseTxt = 'Tus respuestas del test: ' + cuantos + ' → ' + e.rango + ' = ' + e.color;

      if (modo === 'simple' || ctx.nivel === 'simple') {
        return r({ texto: [e.emoji + ' ' + e.simple], chips: ['¿Qué hago ahora?', '¿Por qué ' + e.color + '?', '¿Dónde me hago el examen?'], base: baseTxt, tema: 'resultado' });
      }
      if (modo === 'porque') {
        const extra = sintomas.length ? 'Marcaste ' + cuantos + '. Por eso tu semáforo salió en **' + e.color + '**.' : 'No marcaste síntomas, por eso salió en **verde**.';
        return r({ texto: [e.porque, extra, 'Ojo: el test **no mide tu sangre**; solo cuenta señales.'], chips: ['¿Puedo confiar en el test?', '¿Qué hago ahora?', 'Cuéntame de mis síntomas'], base: baseTxt, tema: 'resultado' });
      }
      if (modo === 'mas') {
        if (!sintomas.length) return responderTema('alimentos');
        const detalle = sintomas.map(id => '**' + cap(SINTOMAS[id].nombre) + ':** ' + SINTOMAS[id].explicacion);
        return r({ texto: ['Esto es lo que dice cada síntoma que marcaste:'], lista: detalle, chips: ['¿Qué hago ahora?', '¿Puede ser otra cosa?'], base: baseTxt, tema: 'resultado-sintomas' });
      }
      return r({
        texto: [e.emoji + ' Tu semáforo salió en **' + e.color + '** porque marcaste ' + cuantos + '.', e.significado, '**¿Qué puedes hacer?**'],
        lista: e.hacer,
        chips: ['¿Por qué ' + e.color + '?', '¿Qué es la hemoglobina?', 'Cuéntame de mis síntomas'].concat(estado !== 'estado-verde' ? ['¿Dónde me hago el examen?'] : ['¿Qué debo comer?']),
        base: baseTxt,
        tema: 'resultado'
      });
    }

    function queHacer() {
      if (!ctx.resultado) {
        return r({ texto: ['Depende de lo que sientas. Si tienes dudas, haz primero el test de síntomas (toma 30 segundos) y te digo qué hacer según tu resultado.'], chips: ['¿Cómo funciona el test?'], acciones: [{ tipo: 'ir', destino: '#test-sintomas', etiqueta: 'Ir al test' }] });
      }
      const e = ESTADOS[ctx.resultado.estado];
      ctx.ultimoTema = 'resultado';
      return r({
        texto: ['Con tu semáforo en **' + e.color + '** te recomiendo:'],
        lista: e.hacer,
        chips: ['¿Dónde me hago el examen?', '¿Qué debo comer?'].concat(ctx.resultado.estado !== 'estado-verde' ? ['¿Dónde me hago el examen?'] : []),
        base: 'Recomendación para semáforo ' + e.color + ' (' + e.rango + ')'
      });
    }

    function infoSintoma(ids, modo) {
      const id = ids[0], s = SINTOMAS[id];
      ctx.ultimoTema = 'sintoma:' + id;
      const marcado = ctx.resultado && ctx.resultado.sintomas.includes(id);
      const textos = [modo === 'simple' || ctx.nivel === 'simple' ? s.simple : '**' + cap(s.nombre) + ':** ' + s.explicacion];
      if (modo !== 'simple') textos.push('Pero ojo: también puede deberse a ' + s.otrasCausas + '. Por eso un solo síntoma no basta para hablar de anemia.');
      const chips = ['¿Qué hago ahora?'];
      if (ctx.resultado && !marcado) chips.unshift('Agrega ' + s.nombre + ' a mi test');
      if (ids.length > 1) chips.unshift('¿Y ' + SINTOMAS[ids[1]].nombre + '?');
      return r({ texto: textos, chips, base: 'Síntoma: ' + s.nombre + (marcado ? ' (lo marcaste en el test)' : ''), tema: 'sintoma:' + id });
    }

    function infoAlimento(lista) {
      const a = lista[0];
      ctx.ultimoTema = 'alimento:' + a.id;
      const tipo = a.tipo === 'hemo' ? 'hierro **hemínico** (se absorbe bien)' : 'hierro **no hemínico** (se absorbe menos; acompáñalo con limón o naranja)';
      const textos = ['**' + cap(a.nombre) + '**: aporta ' + a.mg + ' de hierro por ' + a.porcion + ' (nivel **' + a.nivel + '**). Es ' + tipo + '.', a.nota];
      if (lista.length > 1) {
        const b = lista[1];
        textos.push('Y **' + b.nombre + '**: ' + b.mg + ' por ' + b.porcion + ' (nivel ' + b.nivel + ').');
      }
      return r({ texto: textos, chips: ['¿Qué alimento tiene más hierro?', '¿Cómo absorbo mejor el hierro?', '¿Qué significa mg?'], base: 'Valores aproximados por porción casera · Tablas peruanas de composición de alimentos (CENAN)', tema: 'alimento:' + a.id });
    }

    function cambiarTest(tipo, ids) {
      if (!ctx.resultado) ctx.resultado = { sintomas: [], estado: 'estado-verde' };
      const actual = new Set(ctx.resultado.sintomas);
      ids.forEach(id => tipo === 'agregar' ? actual.add(id) : actual.delete(id));
      const antes = ctx.resultado.estado;
      ctx.resultado = { sintomas: Array.from(actual), estado: estadoDe(actual.size) };
      ctx.alActualizarTest(ctx.resultado.sintomas);
      const e = ESTADOS[ctx.resultado.estado];
      const cambio = antes !== ctx.resultado.estado ? ' Tu semáforo **cambió a ' + e.color + '** ' + e.emoji + '.' : ' Tu semáforo sigue en **' + e.color + '** ' + e.emoji + '.';
      ctx.ultimoTema = 'resultado';
      return r({
        texto: ['Listo, ' + (tipo === 'agregar' ? 'agregué' : 'quité') + ' **' + listaSintomas(ids) + '** en tu test. Ahora tienes ' + ctx.resultado.sintomas.length + ' de 5 síntomas marcados.' + cambio],
        chips: ['Explícame mi resultado', '¿Qué hago ahora?', 'Deshacer'],
        base: 'Actualicé las casillas del test con tu permiso',
        deshacer: { tipo: tipo === 'agregar' ? 'quitar' : 'agregar', sintomas: ids }
      });
    }

    function proponerCambio(tipo, ids) {
      const ya = ctx.resultado ? ctx.resultado.sintomas : [];
      const validos = tipo === 'agregar' ? ids.filter(id => !ya.includes(id)) : ids.filter(id => ya.includes(id));
      if (!validos.length) {
        return r({ texto: [tipo === 'agregar' ? 'Eso ya estaba marcado en tu test 👍.' : 'Eso no estaba marcado en tu test, así que no hay nada que quitar.'], chips: ['Explícame mi resultado'] });
      }
      ctx.pendiente = { tipo, sintomas: validos };
      return r({
        texto: [(tipo === 'agregar' ? 'Entiendo que también sientes **' : 'Entiendo que ya no sientes **') + listaSintomas(validos) + '**. ¿Quieres que ' + (tipo === 'agregar' ? 'lo agregue a' : 'lo quite de') + ' tu test para recalcular el semáforo?'],
        chips: ['Sí, ' + (tipo === 'agregar' ? 'agrégalo' : 'quítalo'), 'No, solo quería contarte'],
        base: 'Nunca cambio tus respuestas sin preguntarte'
      });
    }

    function interpretarHb(valor, grupo) {
      const corte = CORTE_HB[grupo];
      ctx.pendiente = null;
      ctx.ultimoTema = 'hemoglobina';
      const bajo = valor < corte;
      const textos = [
        'Para ' + NOMBRE_GRUPO[grupo] + ', la OMS considera anemia una hemoglobina **menor a ' + corte + ' g/dL**. Tu valor es **' + valor + ' g/dL**, que está ' + (bajo ? '**por debajo** de ese límite.' : '**dentro del rango esperado**. 🎉'),
        bajo ? 'Esto **sugiere anemia**, pero solo tu médico puede confirmarlo y decirte el tratamiento (por ejemplo, un suplemento con la dosis correcta). Llévale tu resultado.' : 'Aun así, sigue comiendo alimentos con hierro y repite el control cuando te lo indiquen.'
      ];
      if (valor < 7) textos.unshift('⚠️ Un valor tan bajo **requiere atención médica pronto**. Por favor acude a tu centro de salud lo antes posible.');
      return r({ texto: textos, chips: bajo ? ['¿Qué debo comer?', '¿Dónde me hago el examen?', '¿Qué hago con los suplementos?'] : ['¿Qué debo comer?'], base: 'Valores de corte de la OMS a nivel del mar; en zonas de altura se ajustan', tema: 'hemoglobina' });
    }

    function capacidades() {
      ctx.ultimoTema = 'capacidades';
      return r({
        texto: ['Soy **Ferri**, el asistente de MyFitnessPal. **Solo respondo dudas sobre anemia y hierro.** Puedo:'],
        lista: ['Explicarte palabras como **mg**, **meta de 18 mg**, **absorción** o **hierro hemínico**.', 'Explicarte tu resultado del test de síntomas con palabras simples.', 'Interpretar tu valor de hemoglobina si ya te hiciste el examen.', 'Contarte qué alimentos tienen hierro y cómo absorberlo mejor.'],
        chips: ['¿Qué significa mg?', '¿Qué es la meta de 18 mg?', 'Explícame mi resultado'],
        base: 'Información general del MINSA y la OMS · No soy un médico'
      });
    }

    function noEntendi(puntajes) {
      ctx.fallos++;
      const sugerencias = Object.entries(puntajes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([i]) => CHIP_INTENCION[i]).filter(Boolean);
      const base = Array.from(new Set(sugerencias.concat(['¿Qué significa mg?', '¿Qué es la meta de 18 mg?', 'Explícame mi resultado']))).slice(0, 3);
      const textos = ctx.fallos >= 2
        ? ['Perdón, sigo sin entenderte bien 😅. Prueba con frases cortas como “¿qué significa amarillo?” o toca una de estas opciones:']
        : [sugerencias.length ? 'No estoy seguro de haberte entendido. ¿Quisiste decir alguna de estas?' : 'Mmm, no estoy seguro de entender. **Solo respondo dudas sobre anemia y hierro** (mg, la meta de 18 mg, absorción, hemoglobina, el test de síntomas). ¿Te refieres a algo de esto?'];
      return r({ texto: textos, chips: Array.from(new Set(base)), base: 'No encontré una intención clara en tu mensaje, así que prefiero preguntarte antes que inventar' });
    }

    const CHIP_INTENCION = {
      explicar_resultado: 'Explícame mi resultado', razon_resultado: '¿Por qué salió ese color?', que_hacer: '¿Qué hago ahora?',
      examen: '¿Dónde me hago el examen?', hemoglobina: '¿Qué es la hemoglobina?', hierro: '¿Qué es el hierro?', anemia: '¿Qué es la anemia?',
      alimentos: '¿Qué debo comer?', absorcion: '¿Cómo absorbo mejor el hierro?', suplemento: '¿Qué hago con los suplementos?',
      mg: '¿Qué significa mg?', meta: '¿Qué es la meta de 18 mg?', heminico: '¿Qué es hierro hemínico?', confianza: '¿Puedo confiar en el test?',
      privacidad: '¿Guardas mis datos?', riesgo: '¿Quiénes tienen más riesgo?', capacidades: '¿Qué puedes hacer?'
    };

    // ----- Respuestas a seguimiento ("¿por qué?", "más", "no entiendo") -----
    function seguir(modo) {
      const t = ctx.ultimoTema;
      if (!t) return null;
      if (t === 'resultado' || t === 'resultado-sintomas') return explicarResultado(modo === 'mas' && t === 'resultado-sintomas' ? 'porque' : modo);
      if (t.startsWith('sintoma:')) {
        const id = t.split(':')[1];
        if (modo === 'simple') return infoSintoma([id], 'simple');
        if (modo === 'porque') return r({ texto: [SINTOMAS[id].explicacion], chips: ['¿Qué hago ahora?'], base: 'Relación entre ' + SINTOMAS[id].nombre + ' y la falta de hierro' });
        return responderTema('anemia', 'mas');
      }
      if (t.startsWith('alimento:')) {
        if (modo === 'mas' || modo === 'porque') return responderTema('absorcion', modo === 'porque' ? 'porque' : 'texto');
        return responderTema('alimentos', 'simple');
      }
      if (TEMAS[t]) return responderTema(t, modo);
      return null;
    }

    // ----- Punto de entrada -----
    function responder(mensaje) {
      const n = normalizar(mensaje);
      const out = procesar(n, mensaje);
      ctx.ultimaRespuesta = out;
      if (out.tema) ctx.ultimoTema = out.tema;
      return out;
    }

    function procesar(n) {
      if (!n) return r({ texto: ['¿Me escribes tu pregunta? 🙂'], chips: ['Explícame mi resultado'] });

      // 0. Seguridad primero: señales de urgencia
      if (URGENCIA.patrones.some(p => (' ' + n + ' ').includes(' ' + p + ' ') || n.includes(p))) {
        ctx.ultimoTema = null;
        return r({ texto: [URGENCIA.texto], chips: ['Entendido'], base: 'Detecté palabras de posible urgencia en tu mensaje', urgente: true });
      }

      const sintomas = extraerSintomas(n);
      const alimentos = extraerAlimentos(n);
      const numero = extraerNumero(n);
      const grupo = extraerGrupo(n);

      // 1. Preguntas pendientes (control del usuario)
      if (ctx.pendiente) {
        const p = ctx.pendiente;
        if (p.tipo === 'grupo') {
          if (grupo) return interpretarHb(p.valor, grupo);
          if (esSeguimiento(n, 'no')) { ctx.pendiente = null; return r({ texto: ['Está bien. Si quieres, dime “mujer”, “varón”, “gestante” o “niño” cuando quieras y lo interpreto.'], chips: ['¿Qué es la hemoglobina?'] }); }
        } else if (p.tipo === 'agregar' || p.tipo === 'quitar') {
          if (esSeguimiento(n, 'si') || /^si\b/.test(n) || /(agregalo|quitalo|hazlo|dale)/.test(n)) { ctx.pendiente = null; return cambiarTest(p.tipo, p.sintomas); }
          if (esSeguimiento(n, 'no') || /^no\b/.test(n)) { ctx.pendiente = null; return r({ texto: ['Perfecto, no cambio nada. Gracias por contarme. ¿Quieres saber por qué puede pasar eso?'], chips: ['Sí, cuéntame', 'Explícame mi resultado'], tema: 'sintoma:' + p.sintomas[0] }); }
        }
        if (!sintomas.length) ctx.pendiente = p.tipo === 'grupo' ? p : null;
      }

      // 2. Seguimientos cortos con contexto
      if (n === 'deshacer' && ctx.ultimaRespuesta && ctx.ultimaRespuesta.deshacer) {
        const d = ctx.ultimaRespuesta.deshacer; return cambiarTest(d.tipo, d.sintomas);
      }
      if (n.split(' ').length <= 6) {
        if (esSeguimiento(n, 'simple')) { ctx.nivel = 'simple'; const s = seguir('simple'); if (s) return s; }
        if (esSeguimiento(n, 'porque')) { const s = seguir('porque'); if (s) return s; }
        if (esSeguimiento(n, 'mas') || /^(si,? )?cuentame/.test(n)) { const s = seguir('mas'); if (s) return s; }
        if (esSeguimiento(n, 'repetir') && ctx.ultimaRespuesta) return ctx.ultimaRespuesta;
        if (esSeguimiento(n, 'si') && ctx.ultimoTema) { const s = seguir('mas'); if (s) return s; }
      }

      // 3. Número de hemoglobina
      const puntajes = puntuar(n);
      if (numero !== null && (puntajes.valor_hb || puntajes.hemoglobina || /g ?dl|hb\b/.test(n))) {
        if (grupo) return interpretarHb(numero, grupo);
        ctx.pendiente = { tipo: 'grupo', valor: numero };
        return r({ texto: ['Gracias. Para interpretar **' + numero + ' g/dL** necesito saber algo más (el límite cambia según la persona): ¿el resultado es de…?'], chips: ['Mujer', 'Varón', 'Gestante', 'Niño o niña'], base: 'Los valores de corte de la OMS son distintos para cada grupo' });
      }

      // 4. Síntomas mencionados → agregar / quitar / informar
      if (sintomas.length) {
        const pregunta = /(por que|que significa|tiene que ver|relacion|causa|es grave|es normal|que es)/.test(n);
        if (/^(agrega|anade|marca)/.test(n)) return aplicarDirecto('agregar', sintomas);
        if (/^(quita|elimina|desmarca|borra|saca)/.test(n)) return aplicarDirecto('quitar', sintomas);
        if (!pregunta && (puntajes.quitar_sintoma || 0) >= 3) return proponerCambio('quitar', sintomas);
        if (!pregunta && ((puntajes.agregar_sintoma || 0) >= 1 || /^(me siento|siento|tengo|estoy|ando)\b/.test(n))) {
          return ctx.resultado ? proponerCambio('agregar', sintomas) : cambiarTestDesdeCero(sintomas);
        }
        return infoSintoma(sintomas);
      }

      // 5. Alimentos concretos
      if (alimentos.length && !(puntajes.menus >= 4)) {
        if (/(mas hierro|mejor|cual tiene mas)/.test(n) && alimentos.length < 2) return responderTema('alimentos');
        return infoAlimento(alimentos);
      }
      if (/(cual|que) (alimento|comida)? ?tiene mas hierro/.test(n)) return infoAlimento([ALIMENTOS[0], ALIMENTOS[1]]);

      // 6. Intención principal
      const orden = Object.entries(puntajes).sort((a, b) => b[1] - a[1]);
      if (!orden.length || orden[0][1] < 2) return noEntendi(puntajes);
      ctx.fallos = 0;
      let [intencion] = orden[0];

      // Desambiguaciones con contexto
      if (intencion === 'razon_resultado' && !/(salio|sali|semaforo|color|amarillo|rojo|verde|test|resultado|calcula)/.test(n)) {
        const s = seguir('porque'); if (s) return s;
      }
      if ((intencion === 'anemia' || intencion === 'diagnostico') && /(tengo anemia|soy anemic|estoy enferm)/.test(n)) intencion = 'diagnostico';
      // "qué significa 6 mg" habla de la unidad, no del resultado del test
      if (/\bmg\b|miligramo/.test(n) && ['explicar_resultado', 'alimentos', 'hierro', 'mg', 'meta'].includes(intencion)) intencion = /(meta|18 ?mg|al dia|diari)/.test(n) ? 'meta' : 'mg';
      if (intencion === 'explicar_resultado' && /(por que|razon|motivo)/.test(n)) intencion = 'razon_resultado';
      if (intencion === 'hemoglobina' && /(valor|normal|rango|cuanto debe)/.test(n)) return responderTema('hemoglobina', 'mas');
      if (intencion === 'examen' && /(ayunas|cuesta|precio|gratis|duele)/.test(n)) return responderTema('examen', 'mas');

      switch (intencion) {
        case 'saludo':
          return r({ texto: ['¡Hola! 👋 Soy **Ferri**, tu asistente de MyFitnessPal. ' + (ctx.resultado ? 'Veo que ya hiciste el test. ¿Te explico tu resultado?' : 'Te ayudo a entender el test de síntomas y a cuidar tu hierro.')], chips: ctx.resultado ? ['Sí, explícame mi resultado', '¿Qué puedes hacer?'] : ['¿Qué puedes hacer?', '¿Cómo funciona el test?'] });
        case 'despedida':
          return r({ texto: ['¡Cuídate mucho! 💚 Recuerda: si tu semáforo salió amarillo o rojo, el examen de hemoglobina es el siguiente paso. Aquí estaré si me necesitas.'], chips: [] });
        case 'gracias':
          return r({ texto: ['¡De nada! 😊 ¿Hay algo más que quieras saber?'], chips: ['¿Qué significa mg?', '¿Qué debo comer?'] });
        case 'identidad':
          return r({ texto: ['Soy **Ferri**, un asistente automático (inteligencia artificial conversacional) de MyFitnessPal. **No soy una persona ni un médico.** Respondo con información general del MINSA y la OMS, y siempre te digo en qué me baso.'], chips: ['¿Qué puedes hacer?', '¿Puedo confiar en el test?'], base: 'Transparencia: sabes con quién hablas' });
        case 'capacidades': return capacidades();
        case 'explicar_resultado': return explicarResultado();
        case 'razon_resultado': return ctx.resultado ? explicarResultado('porque') : responderTema('test', 'texto');
        case 'que_hacer': return queHacer();
        case 'examen': return responderTema('examen');
        case 'hemoglobina': return responderTema('hemoglobina');
        case 'anemia': return responderTema('anemia');
        case 'hierro': return /(cuanto|necesito)/.test(n) ? responderTema('hierro', 'mas') : responderTema('hierro');
        case 'diagnostico':
          if (!ctx.resultado) return r({ texto: ['No puedo diagnosticarte, pero sí ayudarte a orientarte. Haz el test de síntomas y te explico qué significa tu resultado. Solo un **examen de hemoglobina** confirma la anemia.'], acciones: [{ tipo: 'ir', destino: '#test-sintomas', etiqueta: 'Ir al test' }], chips: ['¿Dónde me hago el examen?'] });
          return r({ texto: ['Con honestidad: **no lo sé, y el test tampoco puede saberlo**. Tu semáforo en **' + ESTADOS[ctx.resultado.estado].color + '** dice que ' + (ctx.resultado.estado === 'estado-verde' ? 'no hay señales claras.' : 'hay señales que conviene revisar.') + ' La única forma de saberlo es un **examen de hemoglobina**.'], chips: ['¿Dónde me hago el examen?', '¿Dónde me hago el examen?', '¿Ya tengo mi valor de hemoglobina?'], base: 'El test cuenta síntomas; no mide la sangre', tema: 'examen' });
        case 'sintoma_info':
          if (ctx.resultado && ctx.resultado.sintomas.length) return explicarResultado('mas');
          return responderTema('test');
        case 'agregar_sintoma':
          return r({ texto: ['¿Qué otro síntoma sientes? Puedo agregar: cansancio, mareos, palidez, uñas quebradizas o dolor de cabeza.'], chips: ['Tengo mareos', 'Tengo palidez', 'Tengo dolor de cabeza'] });
        case 'quitar_sintoma':
          return r({ texto: ['¿Cuál síntoma quieres quitar de tu test?'], chips: (ctx.resultado ? ctx.resultado.sintomas : []).map(id => 'Ya no tengo ' + SINTOMAS[id].nombre) });
        case 'rehacer_test':
          return r({ texto: ['¡Claro! Te llevo al test. Marca de nuevo lo que sientes y pulsa **Ver resultado**; luego vuelve aquí y te lo explico.'], acciones: [{ tipo: 'ir', destino: '#test-sintomas', etiqueta: 'Ir al test' }] });
        case 'alimentos': return responderTema('alimentos');
        case 'absorcion': return responderTema('absorcion');
        case 'suplemento': return responderTema('suplemento');
        case 'valor_hb':
          return r({ texto: ['Si ya tienes tu resultado, escríbeme el número. Por ejemplo: “mi hemoglobina es 11.5”.'], chips: ['Mi hemoglobina es 11.5', 'Aún no me hago el examen'] });
        case 'programar_control':
          return r({ texto: ['Los recordatorios no los programo yo 🙂: están en la sección **Recordatorios** de la página, donde además puedes **dictarlos por voz**.', 'Lo mío son las dudas sobre anemia y hierro. Por ejemplo, ¿sabes qué examen te conviene recordar?'], chips: ['¿Dónde me hago el examen?', '¿Qué es la hemoglobina?'], base: 'Ferri solo resuelve dudas; cada sección de la web tiene su propia herramienta' });
        case 'menus':
          return r({ texto: ['Los menús los encuentras en la sección **Menús por presupuesto**, donde puedes filtrarlos según tus gustos.', 'Yo te puedo explicar lo que ves ahí, por ejemplo qué significa que un plato tenga **6 mg** de hierro.'], chips: ['¿Qué significa mg?', '¿Qué es la meta de 18 mg?'], base: 'Ferri solo resuelve dudas; cada sección de la web tiene su propia herramienta' });
        case 'mg': return responderTema('mg');
        case 'meta': return responderTema('meta');
        case 'heminico': return responderTema('absorcion', 'mas');
        case 'preocupacion': {
          const e = ctx.resultado ? ESTADOS[ctx.resultado.estado] : null;
          return r({ texto: ['Es normal preocuparse 💚. Te cuento algo que te puede tranquilizar: **la anemia por falta de hierro es muy común y se puede tratar**.', e ? 'Tu semáforo en ' + e.color + ' no es un diagnóstico; es una señal para ' + (ctx.resultado.estado === 'estado-verde' ? 'seguir cuidándote.' : 'hacerte un examen sencillo y salir de dudas.') : 'Un examen sencillo de hemoglobina te saca de dudas.'], chips: ['¿Qué hago ahora?', '¿Dónde me hago el examen?'], base: 'Información general del MINSA' });
        }
        case 'confianza': return responderTema('confianza');
        case 'privacidad': return responderTema('privacidad');
        case 'riesgo': return responderTema('riesgo');
        default: return noEntendi(puntajes);
      }
    }

    // Sin test previo: armar el test conversando ("tengo cansancio y mareos")
    // El usuario pidió el cambio de forma explícita ("agrega mareos"): se aplica sin volver a preguntar
    function aplicarDirecto(tipo, ids) {
      const ya = ctx.resultado ? ctx.resultado.sintomas : [];
      const validos = tipo === 'agregar' ? ids.filter(id => !ya.includes(id)) : ids.filter(id => ya.includes(id));
      if (!validos.length) return r({ texto: [tipo === 'agregar' ? 'Eso ya estaba marcado en tu test 👍.' : 'Eso no estaba marcado en tu test.'], chips: ['Explícame mi resultado'] });
      return cambiarTest(tipo, validos);
    }

    function cambiarTestDesdeCero(ids) {
      ctx.pendiente = { tipo: 'agregar', sintomas: ids };
      return r({
        texto: ['Entiendo, sientes **' + listaSintomas(ids) + '**. ¿Quieres que marque ' + (ids.length > 1 ? 'esos síntomas' : 'ese síntoma') + ' en el test y te diga qué significa?'],
        chips: ['Sí, márcalo', 'No, solo quería contarte'],
        base: 'Nunca cambio tus respuestas sin preguntarte'
      });
    }

    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    // ----- Imágenes (S14): Ferri "ve" (colores de la foto) y "lee" (texto por OCR) -----
    // entrada: { texto: 'lo que leyó el OCR', colores: [{ nombre, mg, confianza, como }], ocrFallo: bool, pregunta: 'texto del usuario' }
    function interpretarImagen(entrada) {
      const leido = String(entrada.texto || '').replace(/\s+/g, ' ').trim();
      const n = normalizar(leido);
      const colores = entrada.colores || [];
      const pie = 'Analicé la imagen en tu dispositivo: no se envía a ningún servidor.';
      const conLeido = (base) => leido ? base + ' · Texto que leí: “' + leido.slice(0, 160) + (leido.length > 160 ? '…' : '') + '”' : base;

      // 1) Resultado de laboratorio con hemoglobina
      const hb = n.match(/(hemoglobina|hemoglobin|\bhb\b|\bhgb\b)[^0-9]{0,30}(\d{1,3}(?:[.,]\d{1,2})?)\s*(g ?\/ ?dl|g ?dl|g ?\/ ?l|g ?l)?/);
      if (hb) {
        let v = parseFloat(hb[2].replace(',', '.'));
        if (v > 30 && v < 220) v = Math.round(v) / 10; // 112 g/L → 11.2 g/dL
        if (v >= 3 && v <= 22) {
          const grupo = extraerGrupo(n) || (/(sexo|genero)\W{0,3}f\b|femenino/.test(n) ? 'mujer' : /(sexo|genero)\W{0,3}m\b|masculino/.test(n) ? 'varon' : null);
          const res = grupo ? interpretarHb(v, grupo) : (function () {
            ctx.pendiente = { tipo: 'grupo', valor: v };
            return r({ texto: ['Para interpretarlo necesito saber algo más (el límite cambia según la persona): ¿el resultado es de…?'], chips: ['Mujer', 'Varón', 'Gestante', 'Niño o niña'] });
          })();
          res.texto.unshift('📄 Leí en tu imagen un resultado de **hemoglobina: ' + v + ' g/dL**. Si leí mal el número, escríbemelo y lo corrijo.');
          res.base = conLeido('Leí el texto de la imagen con reconocimiento óptico de caracteres (OCR). ' + pie);
          return res;
        }
      }

      // 2) Caja de suplemento de hierro
      const sup = n.match(/(sulfato ferroso|fumarato ferroso|gluconato ferroso|hierro polimaltosado|polimaltosato|hierro aminoquelado|suplemento de hierro|multimicronutrientes|chispitas)/);
      if (sup) {
        const res = responderTema('suplemento');
        res.texto.unshift('💊 Parece la caja o etiqueta de un **suplemento de hierro** (leí “' + sup[1] + '”).');
        res.texto.push('No puedo decirte la dosis: eso lo indica tu médico según tu hemoglobina.');
        res.base = conLeido('OCR en tu dispositivo · Información general del MINSA. ' + pie);
        return res;
      }

      // 3) Etiqueta nutricional con hierro
      const etiqueta = n.match(/hierro[^0-9]{0,25}(\d{1,3}(?:[.,]\d{1,2})?)\s*mg/);
      if (etiqueta) {
        const mg = parseFloat(etiqueta[1].replace(',', '.'));
        const porc = Math.round(mg / 18 * 100);
        ctx.ultimoTema = 'meta';
        return r({
          texto: ['🏷️ Leí una **etiqueta nutricional**: dice **' + mg + ' mg de hierro** por porción.', 'Eso es el **' + porc + ' %** de la meta diaria de 18 mg de una mujer adulta. ' + (porc >= 20 ? 'Es un buen aporte.' : porc >= 10 ? 'Aporta algo, pero no es de los más altos.' : 'Aporta poco hierro.'), 'Si es un alimento de origen vegetal, acompáñalo con limón o naranja para absorberlo mejor.'],
          chips: ['¿Qué es la meta de 18 mg?', '¿Qué es la absorción?', '¿Qué alimento tiene más hierro?'],
          base: conLeido('OCR en tu dispositivo · % calculado sobre 18 mg/día. ' + pie)
        });
      }

      // 4) Alimentos escritos en la imagen (una carta, una receta, una lista de compras)
      const escritos = leido ? extraerAlimentos(n) : [];
      if (escritos.length) {
        const res = infoAlimento(escritos);
        res.texto.unshift('📝 Leí en tu imagen: ' + escritos.slice(0, 3).map(a => '**' + a.nombre + '**').join(', ') + '.');
        res.base = conLeido('OCR en tu dispositivo · Valores aproximados por porción. ' + pie);
        return res;
      }

      // 5) Foto de comida: estimación por colores
      const comida = colores.filter(c => c.confianza >= 0.45);
      if (comida.length) {
        const total = Math.round(comida.reduce((s, c) => s + c.mg, 0) * 10) / 10;
        ctx.ultimoTema = 'alimentos';
        return r({
          texto: ['🍽️ Parece un plato de comida. Lo que creo ver:'],
          lista: comida.map(c => '**' + c.nombre + '** (~' + c.mg + ' mg de hierro) · confianza ' + Math.round(c.confianza * 100) + ' %'),
          texto2: null,
          chips: ['¿Cómo absorbo mejor el hierro?', '¿Qué alimento tiene más hierro?', '¿Qué es la meta de 18 mg?'],
          base: 'Estimación por los colores de la foto (' + comida.map(c => c.como).join('; ') + '). Puede equivocarse: si no es eso, dime qué alimento es (por ejemplo “es sangrecita”). ' + pie,
          extra: 'En total serían unos **' + total + ' mg**, el ' + Math.round(total / 18 * 100) + ' % de tu meta diaria de 18 mg. Si quieres sumarlo a tu día, usa “Subir foto del plato” en el Semáforo de hierro.'
        });
      }

      // 6) No reconoció nada útil
      const textos = [];
      if (leido) textos.push('Leí este texto en tu imagen: “' + leido.slice(0, 120) + (leido.length > 120 ? '…' : '') + '”, pero no encontré nada sobre hierro o anemia.');
      else if (entrada.ocrFallo) textos.push('No pude leer texto en la imagen y tampoco reconocí comida.');
      else textos.push('No reconocí comida ni texto sobre hierro en tu imagen.');
      textos.push('Puedo ayudarte con fotos de: **un resultado de hemoglobina**, **una etiqueta nutricional**, **la caja de un suplemento de hierro** o **tu plato de comida**. Una foto nítida y de frente funciona mejor.');
      return r({ texto: textos, chips: ['¿Qué significa mg?', '¿Qué es la hemoglobina?'], base: 'Solo respondo dudas sobre anemia y hierro. ' + pie });
    }

    return {
      responder,
      responderImagen(entrada) {
        const o = interpretarImagen(entrada);
        if (o.extra) { o.textoFinal = [o.extra]; delete o.extra; }
        delete o.texto2;
        ctx.ultimaRespuesta = o;
        return o;
      },
      // El test de la página avisa a Ferri cuando hay un resultado nuevo
      fijarResultado(sintomasIds) {
        ctx.resultado = { sintomas: sintomasIds.slice(), estado: estadoDe(sintomasIds.length), explicito: true };
        ctx.pendiente = null;
        ctx.ultimoTema = 'resultado';
      },
      explicarResultado: () => { const o = explicarResultado(); ctx.ultimaRespuesta = o; return o; },
      bienvenida() {
        if (ctx.resultado) return r({ texto: ['¡Hola! Soy **Ferri** 👋. Vi tu resultado del test. ¿Quieres que te lo explique con palabras simples?'], chips: ['Sí, explícame mi resultado', '¿Qué hago ahora?', '¿Qué puedes hacer?'] });
        return r({ texto: ['¡Hola! Soy **Ferri** 👋, el asistente de MyFitnessPal. Resuelvo **dudas sobre anemia y hierro**: qué significa “mg”, la meta de 18 mg, la absorción, tu resultado del test…', 'Escríbeme tu pregunta o **adjunta una imagen 📎**: tu análisis de hemoglobina, una etiqueta nutricional, la caja de tu suplemento o tu plato. Recuerda que **no reemplazo a un médico**.'], chips: ['¿Qué significa mg?', '¿Qué es la meta de 18 mg?', '¿Qué es la absorción?'] });
      },
      reiniciar() { ctx.ultimoTema = null; ctx.pendiente = null; ctx.nivel = 'normal'; ctx.fallos = 0; ctx.ultimaRespuesta = null; },
      volverNivelNormal() { ctx.nivel = 'normal'; },
      contexto: ctx
    };
  }

  // Vocabulario conocido: una palabra que ya conocemos no se "corrige" hacia otra
  VOCAB = new Set();
  const sumar = t => normalizar(t).split(' ').forEach(w => w && VOCAB.add(w));
  Object.values(INTENCIONES).forEach(c => Object.keys(c).forEach(sumar));
  Object.values(SINTOMAS).forEach(s => s.sinonimos.forEach(sumar));
  ALIMENTOS.forEach(a => a.sin.forEach(sumar));
  Object.values(SEGUIMIENTO).forEach(l => l.forEach(sumar));

  const FerriMotor = { crearConversacion, normalizar, _puntuar: puntuar };
  global.FerriMotor = FerriMotor;
  if (typeof module !== 'undefined' && module.exports) module.exports = FerriMotor;
})(typeof window !== 'undefined' ? window : globalThis);
