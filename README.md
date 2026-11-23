# MyFitnessPal · Semana 14: Human-AI Interaction

Web educativa para prevenir la anemia ferropénica (ODS 3), mejorada con **Ferri**, un asistente conversacional con voz.

**Problema que resuelve:** los usuarios **no entendían el resultado del test de síntomas**.
**Mejora:** Ferri conoce el resultado del test y lo explica conversando, con texto o con voz. Aplica transparencia, control del usuario, confianza y recuperación ante errores.

## Probar
- **En línea:** `https://<tu-usuario>.github.io/<repo>/` (ver despliegue en `entregables/04-integracion-y-despliegue.md`).
- **Local:** abre `index.html` en el navegador (o con Live Server en VS Code).
- **Pruebas del motor:**
  ```bash
  node tests/probar-ferri.js
  ```

Prueba esto: marca 3 síntomas → **Ver resultado** → **Pregúntale a Ferri** → escribe *"¿por qué amarillo?"*, luego *"no entiendo"*, luego *"también tengo dolor de cabeza"*, o usa el 🎤.

## Entregables de la Semana 14
| Evidencia que pide la guía | Archivo |
|---|---|
| Listado de problemas y mejoras asignadas | [`entregables/01-listado-problemas-y-asignacion.md`](entregables/01-listado-problemas-y-asignacion.md) |
| Problema, solución, justificación e implementación | [`entregables/02-mejora-individual-ferri.md`](entregables/02-mejora-individual-ferri.md) |
| Prompt, respuesta de la IA y qué se aceptó o modificó | [`entregables/03-evidencia-uso-ia.md`](entregables/03-evidencia-uso-ia.md) |
| Comparación antes / después | [`entregables/capturas/`](entregables/capturas/) |
| Integración, verificación y despliegue | [`entregables/04-integracion-y-despliegue.md`](entregables/04-integracion-y-despliegue.md) |
| Conexión opcional con Botpress | [`docs/BOTPRESS.md`](docs/BOTPRESS.md) |

## Estructura
```
index.html, recursos.html, confirmacion.html
css/estilos.css            estilos originales
css/ferri.css              estilos del asistente (S14)
js/test-sintomas.js        test HU05 (modificado en S14)
js/ferri-config.js         motor local o Botpress
js/ferri-conocimiento.js   lo que sabe Ferri (MINSA / OMS)
js/ferri-motor.js          entiende, recuerda el contexto y responde
js/ferri-chat.js           interfaz, voz 🎤 y lectura 🔊
tests/                     pruebas automáticas
docs/botpress/             base de conocimiento e instrucciones para Botpress
.claude/skills/            skills de diseño de emilkowalski/skills (MIT)
```

## Créditos
- Contenido de salud: información general del MINSA y la OMS, con fines educativos. **No reemplaza a un profesional de salud.**
- Principios de animación e interfaz: [emilkowalski/skills](https://github.com/emilkowalski/skills) (licencia MIT, en `.claude/skills/LICENSE-emilkowalski`).
- Recursos originales del sitio: ver `FUENTES.txt`.
