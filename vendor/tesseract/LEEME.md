# Tesseract.js (lectura de texto en imágenes, OCR)

Copia local para que Ferri pueda **leer** el texto de una imagen sin servidores ni claves.
Solo se descarga cuando el usuario adjunta una imagen en el chat.

- `tesseract.min.js`, `worker.min.js`: tesseract.js 5.1.1 (Apache-2.0) — https://github.com/naptha/tesseract.js
- `core/`: tesseract.js-core 5.1.1, versiones LSTM con y sin SIMD (Apache-2.0)
- `lang/spa.traineddata.gz`: modelo de español `4.0.0_best_int` de @tesseract.js-data/spa 1.0.0 (Apache-2.0)
