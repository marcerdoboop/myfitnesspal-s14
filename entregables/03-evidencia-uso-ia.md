# Evidencia del uso de IA

La guía pide usar Gemini. El docente permitió usar otra IA, y en este trabajo se usó **Claude (Anthropic)** como asistente para analizar, proponer y desarrollar la mejora.

> Si igual necesitas capturas de Gemini, copia el **prompt** de abajo en gemini.google.com, toma captura de la respuesta y compárala con lo que se implementó (sección 3).

## 1. Prompt usado
Incluye los 5 elementos que pide la guía de la Semana 14:

```text
[1. PROBLEMA DE USABILIDAD]
En las pruebas con usuarios de nuestra web "MyFitnessPal" (prevención de la anemia
ferropénica), los usuarios NO ENTENDÍAN EL RESULTADO DEL TEST DE SÍNTOMAS. El test
tiene 5 casillas (cansancio, mareos, palidez, uñas quebradizas, dolor de cabeza) y
muestra un semáforo: 0–1 verde, 2–3 amarillo, 4–5 rojo, con una frase corta. Los
usuarios preguntaban: "¿tengo anemia?", "¿por qué amarillo?", "¿qué hago ahora?".

[2. CONTEXTO Y PÚBLICO OBJETIVO]
Público: estudiantes, madres y familias peruanas, muchas con poco tiempo, presupuesto
limitado y poca familiaridad con términos médicos. Usan principalmente el celular.
La web es estática (HTML, CSS y JavaScript) publicada en GitHub Pages.

[3. MEJORA QUE QUEREMOS IMPLEMENTAR]
Un asistente conversacional inteligente que explique el resultado del test con
palabras simples, responda preguntas de seguimiento y lleve a la acción (hacerse el
examen de hemoglobina o programar un recordatorio).

[4. PRINCIPIOS DE HUMAN-AI INTERACTION]
Aplica: transparencia (que diga que es IA y en qué se basa), control del usuario
(que no cambie nada sin permiso y se pueda deshacer), confianza (que no diagnostique
ni invente) y recuperación ante errores (qué hace si no entiende o si falla).

[5. INTERFAZ EMERGENTE]
Evalúa incorporar voz (dictado y respuesta hablada) para hacerlo multimodal,
pensando en usuarios que escriben con dificultad en el celular.

Propón 2 o 3 alternativas, recomienda una viable para implementar hoy en una web
estática y describe cómo implementarla.
```

## 2. Respuesta de la IA (resumen fiel)

**Alternativas propuestas:**
| Alternativa | Ventaja | Desventaja |
|---|---|---|
| A. Más texto y una infografía fija en el resultado | Simple | No responde dudas distintas; textos largos que nadie lee |
| B. **Asistente conversacional con el contexto del test** + voz | Responde la duda exacta, explica más simple si no se entiende y lleva a la acción | Más trabajo de desarrollo |
| C. Chatbot de un proveedor externo (LLM en la nube) | Respuestas muy flexibles | Requiere cuenta y clave; en salud puede inventar ("alucinar"); los datos salen del navegador |

**Recomendación de la IA:** la **B**, con un **motor conversacional propio** que corra en el navegador:
- Clasificación de intenciones con tolerancia a errores de tipeo, extracción de entidades (síntomas, alimentos, valor de hemoglobina) y **memoria de contexto** para entender "¿por qué?", "más" o "no entiendo".
- Respuestas revisadas, en varios niveles de dificultad y con fuente, para **no inventar** información de salud.
- Conexión **opcional** a Botpress (LLM), con vuelta automática al motor local si falla.
- Voz con la **Web Speech API** (es-PE), sin servicios de pago.
- Ajustes complementarios en la caja del resultado: escala del semáforo y "En palabras simples".

**Cómo aplicó cada principio HAI:** franja "Contexto que uso" y "¿En qué me baso?" (transparencia); confirmación antes de modificar el test, Deshacer, borrar conversación y apagar la voz (control); no diagnostica y deriva al 106 ante urgencias (confianza); opciones "¿Quisiste decir…?" y 👎 para explicar de otra forma (recuperación ante errores).

## 3. Qué se aceptó, qué se modificó y qué se descartó

| Recomendación | Decisión | Motivo |
|---|---|---|
| Asistente conversacional con contexto del test | ✅ Aceptada | Ataca directamente el problema P1 |
| Motor local por defecto | ✅ Aceptada | Funciona siempre en GitHub Pages, sin claves expuestas y sin enviar datos de salud |
| Botpress (LLM) | 🔁 **Modificada**: queda como modo opcional | El equipo pidió Botpress; se dejó preparado (base de conocimiento + instrucciones + conexión) sin depender de él para la demo |
| Voz (dictado + lectura) | ✅ Aceptada | Interfaz emergente multimodal; útil en el celular |
| Reconocimiento de imágenes (foto del plato) | ❌ Descartada para P1 | No responde al problema del test; se propone para P2 |
| Que Ferri cambie las casillas del test | 🔁 **Modificada**: solo con confirmación y con "Deshacer" | Control del usuario |
| Indicador de "escribiendo…" largo | 🔁 **Modificada**: máximo 650 ms | Que se sienta natural sin hacer esperar (skills de Emil Kowalski) |

## 4. Capturas
- Prompt y respuesta: captura esta conversación con la IA (o la de Gemini si la haces).
- Mejora implementada: ver `entregables/capturas/` y `02-mejora-individual-ferri.md`.
