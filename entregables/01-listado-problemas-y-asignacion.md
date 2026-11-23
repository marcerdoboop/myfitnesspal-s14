# Paso 1 · Listado de problemas y asignación de mejoras

**Solución:** MyFitnessPal, una web para prevenir y controlar la anemia ferropénica (ODS 3).
**Público objetivo:** estudiantes, madres y familias peruanas que usan sobre todo el celular, con poco tiempo y presupuesto. Incluye personas mayores.

> **Origen de los hallazgos.** El equipo no realizó la Semana 13 (pruebas con usuarios + SUS). Los problemas vienen de la revisión de la versión publicada recorriendo las tareas principales, y de lo que comentaron los usuarios. Si tienen datos de la Semana 11 o hacen una mini-prueba con SUS, agréguenlos en la columna **Evidencia**.

## Problemas y mejoras (una por integrante)

| # | Sección | Problema de usabilidad | Heurística de Nielsen | Mejora con IA / interfaz emergente | Principios HAI | Responsable |
|---|---|---|---|---|---|---|
| 1 | Recordatorios (`#contacto`) | El formulario pide 5 campos y un checkbox; es incómodo en el celular. | H7 Flexibilidad y eficiencia | **Voz** (única mejora con voz): dictar "suplemento de hierro, todos los días, a las 8" y que el formulario se rellene; el usuario corrige antes de enviar. | Control del usuario · Recuperación ante errores | *(Integrante 1)* |
| 2 | Toda la web (componente flotante) | Términos como "mg", "meta de 18 mg" o "absorción" no se explican y no hay a quién preguntar. | H2 Lenguaje del usuario · H10 Ayuda | **Asistente conversacional (Ferri)** por texto y con imágenes adjuntas (lee resultados de hemoglobina, etiquetas y cajas de suplemento): solo responde dudas sobre anemia y hierro. No recomienda menús ni programa recordatorios, para no invadir las otras mejoras. | Transparencia (no reemplaza al médico) · Confianza | *(Integrante 2)* |
| 3 | Menús (`#menus`) | Los menús son iguales para todos y no consideran gustos ni restricciones (no come hígado, es vegetariano). | H7 Flexibilidad · H2 | **Recomendaciones personalizadas**: filtros de preferencia y "¿Por qué te lo recomendamos?". | Transparencia · Control del usuario | *(Integrante 3)* |
| 4 | Video y guía (`recursos.html`) | El video solo se controla con los botones pequeños del reproductor. | H7 Flexibilidad · H3 Control y libertad | **Gestos** táctiles y teclado (sin voz): doble toque ±10 s, mantener presionado = 2×, atajos de teclado y aviso visible de cada acción. | Control del usuario · Retroalimentación | *(Integrante 4)* |
| 5 | Semáforo de hierro (`#orientador`) | Solo se puede elegir entre 3 casos fijos; no se puede registrar lo que se comió. | H1 Visibilidad del estado · H2 | **Reconocimiento de imágenes**: subir una foto del plato y estimar su hierro (detección aproximada por colores y por el nombre del archivo). | Transparencia (qué detectó y con qué confianza) · Recuperación ante errores (corregir el alimento) | *(Integrante 5)* |
| 6 | Apariencia de toda la web | Texto pequeño y denso; el contraste cansa con poca luz o a usuarios mayores. | H8 Diseño estético y minimalista · Accesibilidad | **Interfaz adaptativa**: detecta modo claro/oscuro, reducción de movimiento y tamaño de texto del sistema; panel con A− / A+ y modo oscuro. | Control del usuario · Accesibilidad | *(Integrante 6)* |

**Criterio de asignación (Team Leader):** impacto × viabilidad. Cada mejora vive en su propia sección y archivo, para que el responsable de integración pueda unirlas sin que choquen. Además, cada una usa una tecnología distinta: voz solo en Recordatorios, texto en Ferri, gestos en el video, imágenes en el Semáforo.

## Tareas usadas para revisar la web
1. Registrar lo que comí hoy y ver mi semáforo de hierro.
2. Encontrar un menú vegetariano de S/ 15.
3. Programar un recordatorio desde el celular.
4. Adelantar el video 30 segundos desde el celular.
5. Entender qué significa "Hierro: 6 mg".
6. Leer la web de noche o con letra más grande.
