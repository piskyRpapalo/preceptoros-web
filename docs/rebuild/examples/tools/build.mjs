import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SKINS = JSON.parse(readFileSync(join(here, 'skins.json'), 'utf8'));
export const SCRIPTS = ['tabla_semantica', 'comic_%74okens', 'comic_accents', 'valores', 'gacha', 'comic_atoms', 'bubble_light', 'bubble_language', 'bubble_bestiary', 'bubble_world', 'core', 'isometric_floor_projection', 'world_camera', 'map_zoom', 'fog_of_war', 'assets/atlas-coord', 'canon', 'combate_ticks', 'escuadron', 'wave_render', 'assets/worm_transition'];
export const TOOLS = {
  web: [['../../../public/index.html', 'Play theGame'], ['../../../public/creation.html', 'Creation studio']],
  app: [['/dashboard.html', 'Chat with your local model, voice and console'], ['/app.html', 'Detail panel']]
};
export const WEB_PREFIX = '../../../public/game/';
export const APP_PREFIX = '/face/bubble/';
export const APP_BASE = '/face/';
const TITLES = { basic: 'Neutral', atlantis: 'Atlantis for children', zombie: 'Zombie terminal' };
export function page(name, prefix, base = '') {
  const skin = SKINS[name];
  const tpl = readFileSync(join(here, 'tools', 'face.tpl.html'), 'utf8');
  const app = prefix === APP_PREFIX;
  const src = (s) => s.startsWith('assets/') ? (app ? prefix + s.slice(7) : prefix.replace('/game/', '/assets/') + s.slice(7)) : prefix + s;
  const scripts = SCRIPTS.map((s) => `<script src="${src(s)}.js"></script>`).join('') + ['face_world', 'face_paint', 'face_battle', 'face_panel', 'face', 'face_fight'].map((f) => `<script src="${base}${f}.js"></script>`).join('');
  const tools = TOOLS[app ? 'app' : 'web'].map((t) => `<a href="${t[0]}">${t[1]}</a>`).join('');
  return tpl.replace('{{TITLE}}', TITLES[name]).replace('{{LAYOUT}}', skin.layout).replace('{{SKIN}}', JSON.stringify(Object.assign({ name }, skin))).replace('{{SCRIPTS}}', scripts).replace('{{TOOLS}}', tools).split('{{BASE}}').join(base);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] || here, app = process.argv[3] === 'app', prefix = app ? APP_PREFIX : WEB_PREFIX, base = app ? APP_BASE : '';
  for (const name of Object.keys(SKINS)) { const html = page(name, prefix, base); writeFileSync(join(out, name + '.html'), html); console.log(name + '.html', Buffer.byteLength(html)); }
}
