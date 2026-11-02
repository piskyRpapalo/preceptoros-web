// Decreto p0 (buzon#30, 2026-11-01): the walker access was retired from Army; the page links back to /openworld/.
// Keep the Army deep link honest until an account profile is linked to the shared colony state.
import { writeFileSync } from 'node:fs';
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Army · OpenWorld</title>
<meta name="description" content="Army data is unavailable until an account profile is linked to the shared OpenWorld colony.">
<link rel="icon" type="image/svg+xml" href="/assets/mark.svg">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#17131F">
<style>
:root{color-scheme:light dark;font:16px/1.5 system-ui,sans-serif;color:#20182b;background:#17131f}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:20px}main{max-width:42rem;padding:24px;border:2px solid #20182b;border-radius:16px;background:#f2f5f7;color:#20182b}h1,p{margin:0 0 1rem}a{display:inline-flex;align-items:center;min-height:48px;padding:0 14px;border:2px solid currentColor;border-radius:8px;color:inherit;font-weight:650}
</style>
</head>
<body><main>
<h1>Army · NO_DATA</h1>
<p>No account army or SHA-256 profile is connected to the shared colony state. No synthetic army or separate map is shown here.</p>
<a href="/openworld/">Back to OpenWorld</a>
<footer class="honest-footer"><p>No army data or account profile is measured here.</p></footer>
</main><script src="/assets/pwa.js"></script></body>
</html>
`;
writeFileSync(new URL('../public/game/army.html', import.meta.url), html);
console.log(JSON.stringify({bytes: Buffer.byteLength(html), map: 'NO_DATA until an account profile is linked'}));
