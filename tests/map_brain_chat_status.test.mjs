import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the chat starts without a stale log entry and offers an honest load status', () => {
  const html = readFileSync('public/openworld/index.html', 'utf8');
  const log = html.match(/<ul[^>]*id="log"[^>]*>([\s\S]*?)<\/ul>/);
  assert.ok(log);
  assert.equal(log[1].trim(), '');
  assert.match(html, /id="chat-note">NO_DATA: no local answer model is connected/);
});
