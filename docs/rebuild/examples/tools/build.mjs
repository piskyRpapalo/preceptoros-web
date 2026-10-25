import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SKINS = JSON.parse(readFileSync(join(here, 'skins.json'), 'utf8'));
export const SCRIPTS = ['tabla_semantica', 'comic_%74okens', 'comic_accents', 'valores', 'gacha', 'comic_atoms', 'bubble_light', 'bubble_language', 'bubble_bestiary', 'bubble_world', 'core', 'isometric_floor_projection', 'world_camera', 'map_zoom', 'fog_of_war', 'assets/atlas-coord', 'canon', 'taller', 'combate_ticks', 'escuadron', 'wave_render', 'assets/worm_transition', 'escena', 'sea-floor', 'gdpr-art25-ephemeral-crab', 'crab_render_hd', 'bubble_icons', 'db', 'army-wave-panel', 'summon-wave-card', 'summon_reveal', 'assets/auth'];
export const TOOLS = {
  web: [['../../../public/index.html', 'Play theGame'], ['../../../public/creation.html', 'Creation studio']],
  pub: [['/', 'Play theGame'], ['/creation.html', 'Creation studio']],
  app: [['/dashboard.html', 'Chat with your local model, voice and console'], ['/app.html', 'Detail panel']]
};
export const WEB_PREFIX = '../../../public/game/';
export const APP_PREFIX = '/face/bubble/';
export const APP_BASE = '/face/';
export const PUB_PREFIX = '/game/';
export const PUB_BASE = '/face/';
const PUB_HEAD = '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">\n<link rel="manifest" href="/manifest.webmanifest">\n<meta name="theme-color" content="#17131F">';
const PUB_FOOT = '<footer class="honest-footer"><p>Signatures prove authorship of the supplied bytes. A page view does not prove a node is live.</p><a href="/">Home</a></footer>';
const TITLES = { basic: 'Neutral', atlantis: 'Atlantis for children', zombie: 'Zombie terminal' };
export function page(name, prefix, base = '') {
  const skin = SKINS[name];
  const tpl = readFileSync(join(here, 'tools', 'face.tpl.html'), 'utf8');
  const app = prefix === APP_PREFIX, pub = prefix === PUB_PREFIX;
  const src = (s) => s.startsWith('assets/') ? (app ? prefix + s.slice(7) : prefix.replace('game/', 'assets/') + s.slice(7)) : prefix + s;
  const scripts = SCRIPTS.map((s) => `<script src="${(pub ? src(s).replace('%74', 't') : src(s))}.js"></script>`).join('') + ['face_world', 'face_world_terrain', 'face_hero', 'face_paint', 'face_battle', 'face_panel', 'face_hud', 'face', 'face_army', 'face_eggs', 'face_workshop', 'face_fight', 'face_tutorial'].map((f) => `<script src="${base}${f}.js"></script>`).join('');
  const tools = TOOLS[app ? 'app' : pub ? 'pub' : 'web'].map((t) => `<a href="${t[0]}">${t[1]}</a>`).join('');
  return tpl.replace('{{TITLE}}', TITLES[name]).replace('{{LAYOUT}}', skin.layout).replace('{{SKIN}}', JSON.stringify(Object.assign({ name }, skin))).replace('{{SCRIPTS}}', scripts + (pub ? '<script src="/assets/pwa.js"></script>' : '')).replace('{{TOOLS}}', tools).replace('{{HEAD}}', pub ? PUB_HEAD : '<link rel="icon" href="data:,">').replace('{{FOOT}}', pub ? PUB_FOOT : '').split('{{BASE}}').join(base);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] || here, app = process.argv[3] === 'app', pub = process.argv[3] === 'public', prefix = app ? APP_PREFIX : pub ? PUB_PREFIX : WEB_PREFIX, base = app ? APP_BASE : pub ? PUB_BASE : '';
  for (const name of Object.keys(SKINS)) { const html = page(name, prefix, base); writeFileSync(join(out, name + '.html'), html); console.log(name + '.html', Buffer.byteLength(html)); }
}
