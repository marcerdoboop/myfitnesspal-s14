# Conectar Ferri con Botpress (opcional)

Ferri ya funciona sin Botpress: usa su propio motor conversacional (`js/ferri-motor.js`), que corre en el navegador, sin cuentas ni claves. Así la demo funciona siempre en GitHub Pages.

Si el equipo quiere que las respuestas las genere un modelo de lenguaje (LLM) en Botpress Cloud, sigue estos pasos. **La cuenta la tienes que crear tú**: Botpress pide verificar tu correo.

> ⚠️ Los nombres de los menús de Botpress cambian seguido. Desde el entorno donde se preparó este proyecto no se pudo abrir botpress.com, así que los pasos se basan en cómo funciona Botpress Cloud y pueden variar un poco. Si un botón no aparece con ese nombre, busca la opción equivalente.

## 1. Crear la cuenta y el bot
1. Entra a **botpress.com** → **Start for free / Sign up** (con Google o con tu correo).
2. En el Dashboard: **Create Bot** → empezar desde cero (*blank / from scratch*). Nómbralo **Ferri**.
3. Abre el bot en **Studio**.

## 2. Darle el conocimiento
1. En Studio → **Knowledge Bases** → crea una KB llamada `anemia`.
2. **Add source → Document / Text** y sube `docs/botpress/base-conocimiento.md`. Si no acepta `.md`, cambia la extensión a `.txt` o pega el texto.

## 3. Darle la personalidad y las reglas
1. En el **Autonomous Node** / **Agent** (pantalla principal del flujo), abre **Instructions**.
2. Pega el bloque de `docs/botpress/instrucciones-agente.md`.
3. Verifica que el nodo tenga activada la Knowledge Base `anemia`.
4. Prueba en el **Emulator** (panel de la derecha): escribe *"semáforo amarillo, síntomas: cansancio, mareos. No entiendo mi resultado"*.

## 4. Publicar y conectar con la web
1. Pulsa **Publish**.
2. En el Dashboard → tu bot → **Webchat** → **Deploy settings / Embed** copia las **dos direcciones** de los `<script src="…">`: una termina en `inject.js` y la otra es un `.js` en `files.bpcontent.cloud`.
3. En `js/ferri-config.js`:
   ```js
   motor: 'botpress',
   botpress: {
     scripts: [
       'https://cdn.botpress.cloud/webchat/vX.X/inject.js',   // ← la tuya
       'https://files.bpcontent.cloud/....js'                // ← la tuya
     ]
   },
   ```
4. Sube el cambio a GitHub. En la web aparecerá la burbuja de Botpress. El botón **"¿Dudas con tu resultado? Pregúntale a Ferri"** la abre y le envía el resultado del test como primer mensaje.

## Qué pasa si Botpress falla
Si los scripts no cargan en 8 segundos (sin internet, URL mal copiada o bot sin publicar), Ferri vuelve solo al motor local. Esto aplica el principio de **recuperación ante errores**.

## Diferencias entre los dos modos
| | Motor local (por defecto) | Botpress (LLM) |
|---|---|---|
| Cuenta / claves | No necesita | Cuenta de Botpress |
| Privacidad | Nada sale del navegador | Los mensajes van a Botpress Cloud |
| Respuestas | Predecibles, revisadas, con fuentes | Más flexibles; pueden equivocarse |
| Conoce el test | Sí: lee y **modifica** las casillas (con permiso) | Recibe el resultado como texto |
