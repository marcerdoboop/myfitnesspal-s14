# Pasos 3 y 4 · Integración, verificación y despliegue

## Integración (responsable de integración)
Cada integrante entrega sus archivos modificados y sus evidencias. Para la mejora **P1 (Ferri)**:

**Archivos nuevos**
- `js/ferri-config.js`, `js/ferri-conocimiento.js`, `js/ferri-motor.js`, `js/ferri-chat.js`
- `css/ferri.css`
- `tests/probar-ferri.js`, `tests/generar-kb-botpress.js`
- `docs/BOTPRESS.md`, `docs/botpress/*`

**Archivos modificados**
- `index.html`: caja de resultado del test (escala, "En palabras simples", botón de Ferri) y enlaces a los scripts de Ferri en el `<head>`.
- `js/test-sintomas.js`: comparte el resultado con Ferri (evento `test:resultado`) y permite que Ferri marque casillas (`window.TestSintomas.marcar`).
- `recursos.html`, `confirmacion.html`: solo agregan las 5 líneas de Ferri en el `<head>`.

**Cómo integrar sin romper el trabajo de los demás**
1. Copiar los archivos nuevos.
2. En cada HTML, pegar el bloque `<!-- S14 · Ferri … -->` antes de `</head>`.
3. En `index.html`, reemplazar solo el `<div id="resultado-sintomas">…</div>`.
4. Reemplazar `js/test-sintomas.js`. Conserva los mismos `id` y el comportamiento original.
5. Ferri no usa nombres globales que choquen: todo está dentro de funciones. Solo expone `window.Ferri`, `window.FerriMotor`, `window.FerriConocimiento` y `window.FERRI_CONFIG`.

## Verificación
```bash
node tests/probar-ferri.js
```
Resultado: **Ferri: 66/66 casos correctos (100 %)**.

Lista de verificación manual (escritorio y celular):
- [x] El test sigue funcionando igual (verde / amarillo / rojo y "Programar control").
- [x] "¿Dudas con tu resultado? Pregúntale a Ferri" abre el chat y explica el resultado.
- [x] "¿Por qué?", "no entiendo" y "cuéntame más" usan el contexto.
- [x] "También tengo mareos" → pide confirmación → actualiza las casillas y el semáforo.
- [x] Esc cierra el chat y el foco vuelve al botón.
- [x] Micrófono: en Chrome o Edge dicta; si no hay permiso, lo explica.
- [x] Sin errores en la consola.

## Despliegue en GitHub Pages
1. Sube el repositorio a GitHub (rama `main`).
2. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
3. Espera 1–2 minutos. La web queda en `https://<tu-usuario>.github.io/<nombre-del-repo>/`.
4. Ábrela en el celular y repite la lista de verificación.

> El micrófono necesita **HTTPS**. GitHub Pages ya lo usa; al abrir el archivo directamente con doble clic (`file://`) el dictado puede no funcionar.
