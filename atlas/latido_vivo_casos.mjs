// Pieza 2 · el mapa vivo — RETIRADA por decreto del Soberano (2026-11-05, PR #654): la capa latido_vivo.js
// sale del mundo; el estado nativo del hex es la única realidad. Casos vaciados, patrón de la casa
// (reef_building_casos tras el corte D): el fichero queda como registro, no exige la capa muerta.
// Uso: node atlas/latido_vivo_casos.mjs
const casos = [];
const rojos = casos.filter((c) => !c.ok);
console.log(JSON.stringify({ pieza: 'latido-vivo', retirada: 'decreto happy-out 2026-11-05', casos: casos.length, rojos: rojos.length, detalle: rojos }));
process.exitCode = rojos.length ? 1 : 0;
