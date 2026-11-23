# MyFitnessPal · Semana 14: Human-AI Interaction e interfaces emergentes

Web educativa para prevenir la anemia ferropénica (ODS 3), mejorada con **6 mejoras de IA e interfaces emergentes**, una por integrante y cada una en su propia sección.

| # | Mejora | Dónde | Tecnología |
|---|---|---|---|
| 1 | Dictar el recordatorio y rellenar el formulario | Recordatorios | 🎤 Voz (única mejora con voz) |
| 2 | **Ferri**, asistente que explica "mg", "meta de 18 mg", "absorción"… | Botón flotante | 💬 Conversacional por texto |
| 3 | Menús según tus gustos, con "¿Por qué te lo recomendamos?" | Menús | ⭐ Recomendaciones personalizadas |
| 4 | Doble toque ±10 s, mantener = 2×, atajos de teclado | Video y guía | 👆 Gestos y teclado |
| 5 | Foto del plato → hierro estimado → semáforo del día | Semáforo de hierro | 📷 Reconocimiento de imágenes |
| 6 | Modo oscuro, A− / A+ y menos movimiento | Toda la web (botón **Aa**) | 🌓 Interfaz adaptativa |

## Probar
- **En línea:** `https://marcerdoboop.github.io/myfitnesspal-s14/` (después de activar GitHub Pages).
- **Local:** abre `index.html` en el navegador. El micrófono necesita HTTPS: pruébalo en la versión en línea.
- **Pruebas automáticas:**
  ```bash
  node tests/probar-ferri.js
  ```
  ```bash
  node tests/probar-voz-recordatorio.js
  ```
  ```bash
  node tests/probar-menus.js
  ```
  ```bash
  node tests/probar-plato.js
  ```

## Entregables de la Semana 14
| Evidencia que pide la guía | Archivo |
|---|---|
| Listado de problemas y mejoras asignadas | [`entregables/01-listado-problemas-y-asignacion.md`](entregables/01-listado-problemas-y-asignacion.md) |
| Problema, solución, tecnología y antes / después de cada mejora | [`entregables/02-mejoras-implementadas.md`](entregables/02-mejoras-implementadas.md) |
| Prompts de IA de cada integrante y qué se aceptó o modificó | [`entregables/03-evidencia-uso-ia.md`](entregables/03-evidencia-uso-ia.md) |
| Integración, verificación y despliegue | [`entregables/04-integracion-y-despliegue.md`](entregables/04-integracion-y-despliegue.md) |
| Capturas antes / después | [`entregables/capturas/`](entregables/capturas/) |
| Conexión opcional de Ferri con Botpress | [`docs/BOTPRESS.md`](docs/BOTPRESS.md) |

## Estructura
```
index.html, recursos.html, confirmacion.html
css/estilos.css               estilos originales
css/mejoras.css               mejoras 1, 3, 4 y 5
css/ferri.css                 mejora 2 (Ferri)
css/adaptativo.css            mejora 6 (modo oscuro, tamaño de texto)
js/voz-recordatorio.js        mejora 1
js/ferri-*.js                 mejora 2
js/menus-personalizados.js    mejora 3
js/video-gestos.js            mejora 4
js/plato-foto.js              mejora 5
js/apariencia*.js             mejora 6
js/test-sintomas.js, menu.js  funciones originales
tests/                        pruebas automáticas
docs/botpress/                base de conocimiento e instrucciones para Botpress
.claude/skills/               skills de diseño de emilkowalski/skills (MIT)
```

La versión anterior a la Semana 14 es el commit `eda3708`.

## Créditos
- Contenido de salud: información general del MINSA y la OMS, con fines educativos. **No reemplaza a un profesional de salud.** Los valores de hierro y costos son aproximados.
- Principios de animación e interfaz: [emilkowalski/skills](https://github.com/emilkowalski/skills) (MIT).
- Recursos originales del sitio: ver `FUENTES.txt`.
