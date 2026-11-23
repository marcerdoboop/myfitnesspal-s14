# Pasos 3 y 4 · Integración, verificación y despliegue

## Integración
Cada mejora vive en sus propios archivos. La integración solo agrega etiquetas en el `<head>` y el bloque de HTML de cada sección.

| # | Mejora | Archivos nuevos | HTML tocado |
|---|---|---|---|
| 1 | Voz en Recordatorios | `js/voz-recordatorio.js` | `index.html`: bloque `#dictado-recordatorio` dentro del formulario |
| 2 | Ferri (texto + imágenes) | `js/ferri-config.js`, `js/ferri-conocimiento.js`, `js/ferri-motor.js`, `js/ferri-chat.js`, `css/ferri.css`, `vendor/tesseract/` (OCR) | `<head>` de las 3 páginas; botones `.ayuda-ferri` |
| 3 | Menús personalizados | `js/menus-personalizados.js` | `index.html`: `#preferencias-menu` |
| 4 | Gestos en el video | `js/video-gestos.js` | `recursos.html`: `data-gestos` en el `<video>` y la lista de atajos |
| 5 | Foto del plato | `js/plato-foto.js` | `index.html`: `#mi-plato` dentro de `#orientador` |
| 6 | Interfaz adaptativa | `css/adaptativo.css`, `js/apariencia.js`, `js/apariencia-temprano.js` | `<head>` de las 3 páginas (al final) |
| — | Estilos de 1, 3, 4 y 5 | `css/mejoras.css` | `<head>` de `index.html` y `recursos.html` |

**Cómo se comunican sin chocar:**
- "Agregar al diario" (Menús) envía el evento `diario:agregar`, que escucha el Semáforo.
- Los botones `data-ferri-pregunta` abren a Ferri con la pregunta ya hecha.
- El test de síntomas avisa su resultado con `test:resultado`.

Ningún archivo depende del orden de carga de otro, salvo `ferri-*.js` entre sí.

## Verificación
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
Resultados: **Ferri 82/82 (incluye 8 de imágenes) · Dictado 13/13 · Menús 8/8 · Plato 9/9**.

También se probó Ferri con imágenes reales en un navegador servido por HTTP: un análisis ("Hemoglobina 11.2 g/dL"), una etiqueta ("Hierro 4.5 mg"), una caja de "Sulfato ferroso" y la foto de un plato. Las cuatro se leyeron bien en menos de 1 segundo cada una. La lectura de texto **no funciona al abrir el archivo directo** (`file://`), porque el navegador bloquea el trabajador de OCR; en GitHub Pages sí funciona.

Probado en Chromium de escritorio (1280 px) y en un iPhone 13 emulado, en modo claro y oscuro, sin errores en la consola. Se comprobó:
- doble toque y mantener en el video;
- tecla M;
- la foto de un plato de lentejas con espinaca;
- el filtro vegetariano;
- el dictado escrito;
- la persistencia del tema y del tamaño de texto al recargar.

**Para probar en un celular real (después de publicar):**
- [ ] 🎤 Dictar recordatorio (pide permiso del micrófono; funciona en Chrome/Edge para Android y en Safari).
- [ ] Doble toque y mantener presionado en el video.
- [ ] Tomar una foto real de un plato.
- [ ] Activar el modo oscuro del celular y ver que la web lo sigue.

## Despliegue en GitHub Pages
1. Repositorio: `marcerdoboop/myfitnesspal-s14`, rama `main`.
2. **Settings → Pages → Deploy from a branch → `main` / `(root)` → Save**.
3. La web queda en `https://marcerdoboop.github.io/myfitnesspal-s14/`.

> El micrófono y la cámara necesitan **HTTPS**, que GitHub Pages ya tiene. Al abrir el archivo con doble clic pueden no funcionar.
