import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const map = JSON.parse(read('../docs/web-mcp-capability-map.json'));
const root = JSON.parse(read('../mcp-manifest.json'));
const served = JSON.parse(read('../public/mcp-manifest.json'));
const links = read('../public/game/deep_links.js');
const targets = {
  'summon.tc1': '#summon-access',
  'workshop.dissolve': '.atlas-hud',
  'workshop.sand': '.atlas-hud',
  'lighthouse.move': '#atlas-juego',
  'transparency.log': '#radio-chat-alterna',
  'identity.create': '#identity'
};

test('map covers the identical static inventories and local UI contracts', () => {
  assert.deepEqual(served, root);
  assert.deepEqual(map.actions.map((action) => action.id).sort(),
    root.actions.map((action) => action.id).sort());
  for (const action of map.actions) {
    assert.equal(action.ui_target, targets[action.id]);
    assert.equal(action.mcp_server, null);
    assert.equal(action.mcp_tool, null);
    assert.equal(action.authorizes_effect, false);
    assert.ok(action.human_step);
    assert.ok(links.includes(`'${action.id}':`), `missing UI action ${action.id}`);
  }
});

test('sabotage: a claimed but undeclared MCP capability is rejected by the judge', () => {
  const broken = structuredClone(map);
  broken.actions[0].mcp_tool = 'not_a_declared_tool';
  assert.throws(() => {
    for (const action of broken.actions) {
      assert.equal(action.mcp_server, null);
      assert.equal(action.mcp_tool, null);
    }
  });
});
