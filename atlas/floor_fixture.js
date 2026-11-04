// Draw the baked cabin floor through the production painter, not a fixture renderer.
(function (root) {
  'use strict';
  var M = root.AtlasMapPainter, chunk = root.FloorFixtureChunk;
  if (!M || !chunk) { throw new Error('floor fixture dependencies missing'); }
  var chunks = { '0_0': chunk }, world = { cells: M.cellsOf(chunks) };
  root.drawFloorFixture = function (canvas, tick, reduced) {
    var frame = M.frameOf(chunk, tick, reduced);
    canvas.dataset.floorFrame = JSON.stringify(frame);
    M.floor(canvas.getContext('2d'), { cx: canvas.width / 2, cy: canvas.height / 2, k: 0.45 }, world, tick, reduced);
    return frame;
  };
})(window);
