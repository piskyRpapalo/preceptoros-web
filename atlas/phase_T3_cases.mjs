// Corte D (2026-10-28): el lexicon de theGame (atlas-en.json) y sus etiquetas se retiraron con el juego.
// Lo que queda vivo: los hashes de los ficheros que comparte el juego y sostienen /face/ (valores, gacha, core).
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const digest = b => createHash('sha256').update(b).digest('hex');
const protectedFiles = {
  'public/game/values.js': '07bda155e46e2424978b825f3974db00c9eb1b41e644dc76ef84ca2d652eba03',
  'public/game/gacha.js': '36f80335d5d7a0e2adaf77a87a1e1b2d28112dd7a2d41300df51a95abad8d0c5',
  'public/game/core.js': 'c7abbcd524caad2aed3ca2c9f47a81f64257c6fa6aaedbf8274641179fab31c6',

};