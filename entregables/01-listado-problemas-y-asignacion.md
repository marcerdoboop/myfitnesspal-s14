# Paso 1 · Listado de problemas y asignación de mejoras

**Solución:** MyFitnessPal, una web para prevenir y controlar la anemia ferropénica (ODS 3).
**Público objetivo:** estudiantes, madres y familias peruanas con poco tiempo y presupuesto.

> **Origen de los hallazgos.** El equipo no realizó la Semana 13 (pruebas con usuarios + SUS). Este listado combina:
> (a) el problema que reportaron los usuarios con el test de síntomas: *"no entendían el resultado"*;
> (b) una revisión heurística de la versión desplegada (heurísticas de Nielsen), hecha recorriendo las tareas principales.
> Si el equipo tiene datos de la Semana 11 o hace una mini-prueba con SUS, deben reemplazar o completar la columna **Evidencia**.

## Tareas usadas para revisar la web
1. Hacer el test de síntomas y decir qué significa el resultado.
2. Encontrar un menú rico en hierro de S/ 10.
3. Programar un recordatorio para el control de hemoglobina.

## Problemas y oportunidades de mejora

| # | Problema observado | Evidencia | Heurística de Nielsen | Impacto | Viabilidad | Mejora con IA / interfaz emergente |
|---|---|---|---|---|---|---|
| **P1** | **Los usuarios no entienden el resultado del test de síntomas.** Ven "Semáforo en amarillo" pero no saben qué significa, si tienen anemia, por qué salió ese color ni qué hacer. | Reportado por los usuarios. El resultado solo muestra el conteo y una frase; no hay escala ni ayuda. | H2 Relación con el mundo real · H10 Ayuda y documentación · H1 Visibilidad del estado | **Alto**: es la HU que orienta una decisión de salud | Alta | **Asistente conversacional (Ferri)** con contexto del test, voz y explicación en palabras simples |
| P2 | El semáforo diario de hierro usa casos fijos de ejemplo; el usuario no sabe cómo registrar lo que comió. | Revisión heurística: los radios "Poco hierro / Más o menos / Meta cumplida" no dependen del usuario. | H1 Visibilidad · H2 Mundo real | Alto | Media | Reconocimiento de imágenes: foto del plato → estimar hierro |
| P3 | "Agregar al diario" (en Menús) solo lleva al semáforo y no suma nada, lo que confunde. | Revisión heurística: el botón promete una acción que no ocurre. | H1 Visibilidad · H4 Consistencia | Medio | Alta | Recomendaciones personalizadas según presupuesto y preferencias |
| P4 | Programar un recordatorio exige completar 6 campos y ver una página de confirmación aparte. | Revisión heurística: tarea 3. | H7 Flexibilidad y eficiencia · H5 Prevención de errores | Medio | Media | Comando de voz: "recuérdame mi suplemento a las 8" |
| P5 | El menú "Resolver" no dice qué contiene; cuesta encontrar el test y los menús. | Revisión heurística: hay que abrir el desplegable para descubrir las opciones. | H6 Reconocer antes que recordar · H2 | Medio | Alta | Búsqueda por voz / renombrar a "Herramientas" |

## Asignación (coordinada por el Team Leader)

| Integrante | Rol | Problema asignado | Mejora |
|---|---|---|---|
| *(tu nombre)* | Desarrollo de la mejora P1 | **P1 · Resultado del test incomprensible** | Ferri, asistente conversacional multimodal (texto + voz) |
| *(Integrante 2)* | | P2 | Reconocimiento de imágenes de alimentos |
| *(Integrante 3)* | | P3 | Recomendaciones personalizadas |
| *(Integrante 4)* | | P4 | Recordatorio por comando de voz |
| *(Integrante 5)* | Responsable de integración | P5 | Navegación y búsqueda por voz |

Criterio de priorización: **impacto × viabilidad**. P1 va primero porque afecta una decisión de salud (hacerse o no el examen) y se puede implementar completa en la sesión.
