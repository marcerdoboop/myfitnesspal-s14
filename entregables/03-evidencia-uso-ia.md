# Evidencia del uso de IA (prompts de cada integrante)

La guía pide usar Gemini. El docente permitió usar otra IA; en este trabajo se usó **Claude (Anthropic)** para analizar, proponer y desarrollar las mejoras.

> **Para las capturas:** cada integrante copia **su** prompt en la IA (Claude o Gemini), toma captura del prompt y de la respuesta, y la compara con la tabla "Qué se aceptó o modificó".

Todos los prompts tienen los 5 elementos que pide la guía: **(1)** el problema, **(2)** el contexto y el público, **(3)** la mejora, **(4)** los principios HAI y **(5)** la interfaz emergente.

**Contexto común (pegar al inicio de cada prompt):**
```text
Somos estudiantes de HCI. Nuestra web "MyFitnessPal" (HTML, CSS y JavaScript, publicada en
GitHub Pages, sin servidor) ayuda a prevenir la anemia ferropénica en Perú. Público: estudiantes,
madres y familias con poco tiempo y presupuesto, que usan sobre todo el celular; también personas
mayores. Propón 2 o 3 alternativas, recomienda una viable para hoy y explica cómo implementarla.
```

---

### 1 · Voz en Recordatorios
```text
[1] Problema: el formulario de recordatorios pide 5 campos y un checkbox y es incómodo en el celular.
[2] Público: el del contexto común, que programa el suplemento de hierro de su hijo o su control.
[3] Mejora: dictar una frase ("suplemento de hierro, todos los días, a las 8") y rellenar el formulario.
[4] Principios HAI: control del usuario (no enviar solo, poder corregir y deshacer) y recuperación
    ante errores (qué pasa si no entiende la hora o el micrófono falla).
[5] Interfaz emergente: reconocimiento de voz en español de Perú.
```
| Recomendación de la IA | Decisión |
|---|---|
| Web Speech API + intérprete de la frase | ✅ Aceptada |
| Enviar el formulario automáticamente | ❌ Descartada: viola el control del usuario |
| Hora que no existe en la lista → la más cercana, con aviso | ✅ Aceptada |
| Escribir la frase si no hay micrófono | ✅ Aceptada (y permite probarlo en cualquier navegador) |

### 2 · Asistente conversacional por texto (Ferri)
```text
[1] Problema: términos como "mg", "meta de 18 mg" o "absorción" no se explican y no hay a quién preguntar.
[2] Público: el del contexto común, con poca familiaridad con términos de nutrición.
[3] Mejora: un chat flotante, solo de texto, que responda dudas sobre anemia y hierro.
    No debe recomendar menús ni programar recordatorios (eso lo hacen otras secciones).
[4] Principios HAI: transparencia (avisar que no reemplaza al médico y decir en qué se basa) y confianza
    (no inventar, qué hacer ante una urgencia).
[5] Interfaz emergente: asistente conversacional (texto).
```
| Recomendación de la IA | Decisión |
|---|---|
| Motor conversacional propio en el navegador, con respuestas revisadas | ✅ Aceptada: sin claves expuestas y sin "alucinaciones" en temas de salud |
| LLM en la nube (Botpress) | 🔁 Modificada: queda como modo opcional |
| Voz en el chat | ❌ Descartada: la voz es exclusiva de Recordatorios |
| Botones "¿Qué significa mg?" junto a los términos | ✅ Aceptada |
| Adjuntar imágenes y leerlas (OCR) en el dispositivo | ✅ Aceptada luego: lee resultados de hemoglobina, etiquetas y cajas de suplemento, sin subir la imagen |

### 3 · Recomendaciones personalizadas en Menús
```text
[1] Problema: los menús son iguales para todos y no consideran gustos ni restricciones
    (no come hígado, es vegetariano).
[2] Público: el del contexto común, con presupuesto de S/ 10 a S/ 20 al día.
[3] Mejora: filtros de preferencia y recomendaciones con "por qué te lo recomendamos".
[4] Principios HAI: transparencia (explicar cada recomendación y lo que se ocultó) y control del
    usuario (cambiar o quitar filtros).
[5] Interfaz emergente: recomendaciones personalizadas.
```
| Recomendación de la IA | Decisión |
|---|---|
| Filtrar por restricciones y ordenar por hierro dentro del presupuesto | ✅ Aceptada |
| Explicación por menú (% de la meta, costo, preferencia cumplida, absorción) | ✅ Aceptada |
| Aprender de los clics del usuario | ❌ Descartada: poco transparente para una demo |
| Agregar menús vegetarianos para S/ 15 y S/ 20 | 🔁 Modificada: se agregaron 2, marcados "Nuevo" |

### 4 · Gestos en el video
```text
[1] Problema: el video solo se controla con los botones pequeños del reproductor.
[2] Público: el del contexto común, que ve el video en el celular.
[3] Mejora: gestos táctiles y atajos de teclado (sin voz) para controlar el video.
[4] Principios HAI: control del usuario y retroalimentación visible de cada acción.
[5] Interfaz emergente: interacción por gestos.
```
| Recomendación de la IA | Decisión |
|---|---|
| Doble toque a los lados ±10 s, mantener = 2× | ✅ Aceptada |
| Deslizar para cambiar el volumen | ❌ Descartada: choca con el desplazamiento de la página |
| Atajos K/J/L, flechas, M, F | ✅ Aceptada; flechas y espacio solo con el video enfocado |
| Aviso visible de cada acción | ✅ Aceptada; sin animación cuando la acción es por teclado |

### 5 · Reconocimiento de imágenes en el Semáforo
```text
[1] Problema: el semáforo de hierro solo deja elegir 3 casos fijos; no se puede registrar lo que comí.
[2] Público: el del contexto común, que almuerza fuera o cocina en casa.
[3] Mejora: subir una foto del plato y estimar su hierro (puede simularse con alimentos reconocibles).
[4] Principios HAI: transparencia (qué detectó y con qué confianza) y recuperación ante errores
    (corregir el alimento).
[5] Interfaz emergente: reconocimiento de imágenes.
```
| Recomendación de la IA | Decisión |
|---|---|
| Modelo de visión en la nube | ❌ Descartada: requiere clave y la foto saldría del dispositivo |
| Estimación por colores en el navegador + nombre del archivo | ✅ Aceptada como simulación declarada |
| Mostrar confianza y "cómo lo dedujo" | ✅ Aceptada |
| Corregir, quitar o agregar alimentos antes de sumar | ✅ Aceptada |

### 6 · Interfaz adaptativa
```text
[1] Problema: el texto es pequeño y denso y el contraste cansa con poca luz o a personas mayores.
[2] Público: el del contexto común, incluidas personas mayores.
[3] Mejora: adaptar la web al dispositivo (modo oscuro, reducción de movimiento, tamaño de texto)
    y dar un panel con A− / A+ y modo oscuro.
[4] Principios HAI: control del usuario y accesibilidad.
[5] Interfaz emergente: interfaz adaptativa.
```
| Recomendación de la IA | Decisión |
|---|---|
| Respetar `prefers-color-scheme` y `prefers-reduced-motion` | ✅ Aceptada |
| Panel con A− / A+, Sistema / Claro / Oscuro y "Menos animaciones" | ✅ Aceptada |
| Cambiar el tema solo según la hora | ❌ Descartada: el usuario pierde el control |
| Mostrar "Detectamos en tu dispositivo" | ✅ Aceptada (transparencia) |
