import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SKINS = JSON.parse(readFileSync(join(here, 'skins.json'), 'utf8'));
export const SCRIPTS = ['tabla_semantica', 'comic_%74okens', 'comic_accents', 'valores', 'gacha', 'comic_atoms', 'bubble_light', 'bubble_language', 'core'];
export const WEB_PREFIX = '../../../public/game/';
export const APP_PREFIX = 'bubble/';
const TITLES = { basic: 'Basic', atlantis: 'Atlantis', zombie: 'Zombie' };
export function page(name, prefix) {
  const skin = SKINS[name];
  const tpl = readFileSync(join(here, 'tools', 'face.tpl.html'), 'utf8');
  const scripts = SCRIPTS.map((s) => `<script src="${prefix}${s}.js"></script>`).join('') + '<script src="face.js"></script>';
  return tpl.replace('{{TITLE}}', TITLES[name]).replace('{{SKIN}}', JSON.stringify(Object.assign({ name }, skin))).replace('{{SCRIPTS}}', scripts);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] || here, prefix = process.argv[3] || WEB_PREFIX;
  for (const name of Object.keys(SKINS)) { writeFileSync(join(out, name + '.html'), page(name, prefix)); console.log(name + '.html', Buffer.byteLength(page(name, prefix))); }
}
