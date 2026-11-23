// =====================================================================
// FERRI · Configuración
// ---------------------------------------------------------------------
// motor: 'local'    → Ferri responde con su propio motor conversacional
//                     (js/ferri-motor.js). Funciona sin internet extra,
//                     sin cuentas y sin claves. Es el modo por defecto.
// motor: 'botpress' → El chat lo atiende un bot de Botpress Cloud (LLM).
//                     Pasos en docs/BOTPRESS.md. Si Botpress no carga en
//                     8 segundos, Ferri vuelve solo al motor local.
// =====================================================================
window.FERRI_CONFIG = {
  motor: 'local',

  // Pega aquí las DOS direcciones de los <script> que te da Botpress en
  // Dashboard → tu bot → Webchat → Deploy settings / "Embed code".
  // Ejemplo (las tuyas serán distintas):
  //   'https://cdn.botpress.cloud/webchat/v3.3/inject.js'
  //   'https://files.bpcontent.cloud/2026/11/23/12/20261123120000-ABCDEFGH.js'
  botpress: {
    scripts: [
      // 'https://cdn.botpress.cloud/webchat/vX.X/inject.js',
      // 'https://files.bpcontent.cloud/....js'
    ]
  }
};
