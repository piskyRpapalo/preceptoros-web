import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SKINS = JSON.parse(readFileSync(join(here, 'skins.json'), 'utf8'));
export const SCRIPTS = ['tabla_semantica', 'comic_%74okens', 'comic_accents', 'valores', 'gacha', 'comic_atoms', 'bubble_light', 'bubble_language', 'bubble_bestiary', 'bubble_world', 'core', 'isometric_floor_projection', 'world_camera', 'map_zoom', 'fog_of_war'];
export const WEB_PREFIX = '../../../public/game/';
export const APP_PREFIX = '/face/bubble/';
export const APP_BASE = '/face/';
const TITLES = { basic: 'Neutral', atlantis: 'Atlantis for children', zombie: 'Zombie terminal' };
export function page(name, prefix, base = '') {
  const skin = SKINS[name];
  const tpl = readFileSync(join(here, 'tools', 'face.tpl.html'), 'utf8');
  const scripts = SCRIPTS.map((s) => `<script src="${prefix}${s}.js"></script>`).join('') + `<script src="${base}face_world.js"></script><script src="${base}face_paint.js"></script><script src="${base}face.js"></script>`;
  return tpl.replace('{{TITLE}}', TITLES[name]).replace('{{LAYOUT}}', skin.layout).replace('{{SKIN}}', JSON.stringify(Object.assign({ name }, skin))).replace('{{SCRIPTS}}', scripts).split('{{BASE}}').join(base);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] || here, app = process.argv[3] === 'app', prefix = app ? APP_PREFIX : WEB_PREFIX, base = app ? APP_BASE : '';
  for (const name of Object.keys(SKINS)) { const html = page(name, prefix, base); writeFileSync(join(out, name + '.html'), html); console.log(name + '.html', Buffer.byteLength(html)); }
}
