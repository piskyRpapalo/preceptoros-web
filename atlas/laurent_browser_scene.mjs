// Runs in a fresh Chrome target. The caller supplies the unmodified renderer and a
// copy with an Atlas-only sampling hook; all four style/width passes are retained.
export function installScene(contour, original, instrumented) {
  const methods = ['original', 'direct', 'table', 'recurrence', 'uniform', 'adaptive', 'hermite'];
  const arms = [[1, 24, 21, 0], [-4, 7, 9, 12.25], [11, 1.2, 0.8, -7.5],
    [-14, 0.8, 0.65, 32], [21, 0.45, 0.3, 5.75], [0, 1, 2, 9]];
  const size = 192, radius = 77, scale = radius / original.limite(arms);
  const style = { calidad: 2, giro: 0.37, t: 300, respira: false, color: [210, 78, 72] };
  let method;
  window.laurentPoints = (a, n, k) => {
    const result = contour(a, { method, scale: Math.abs(k), segments: n, epsilon: 0.5 });
    result.points.curves = result.curves;
    return result.points;
  };
  document.head.innerHTML = '<meta name="viewport" content="width=device-width,initial-scale=1">';
  document.body.style.cssText = 'background:#14202a;color:#f1f0e5;font:14px system-ui;margin:12px';
  const title = document.createElement('h1');
  title.style.fontSize = '18px';
  title.textContent = 'Same contour · six approximations';
  document.body.appendChild(title);
  const grid = document.createElement('section');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:6px;max-width:670px';
  document.body.appendChild(grid);
  function surface() {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    return c;
  }
  function draw(which, ctx) {
    method = which;
    ctx.clearRect(0, 0, size, size);
    (which === 'original' ? original : instrumented).dibuja(ctx, arms, size / 2, size / 2, radius, style);
  }
  function pixels(ctx) { return ctx.getImageData(0, 0, size, size).data; }
  function plotGeometry(key) {
    const anglesOriginal = Array.from({length: 221}, (_, i) => i / 220 * 2 * Math.PI);
    const { points, curves, angles } = key === 'original'
      ? { angles: anglesOriginal, points: anglesOriginal.map(a => AtlasGacha.punto(arms, a)), curves: [] }
      : contour(arms, { method: key, scale, segments: 220, epsilon: 0.5 });
    if (points.length !== angles.length || Math.abs(angles.at(-1) - 2 * Math.PI) > 1e-12) {
      throw new Error('Incomplete contour parameter grid');
    }
    let max = 0;
    for (let i = 1; i < points.length; i++) {
      for (let j = 0; j <= 32; j++) {
        const t = j / 32, v = 1 - t, a = points[i - 1], b = points[i];
        const truth = AtlasGacha.punto(arms, angles[i - 1] * v + angles[i] * t);
        const curve = curves?.[i - 1];
        const xy = [0, 1].map(axis => curve
          ? v ** 3 * a[axis] + 3 * v * v * t * curve[0][axis] + 3 * v * t * t * curve[1][axis] + t ** 3 * b[axis]
          : a[axis] * v + b[axis] * t);
        max = Math.max(max, scale * Math.hypot(xy[0] - truth[0], xy[1] - truth[1]));
      }
    }
    return { segments: points.length - 1, probes: (points.length - 1) * 33, maxErrorCanvasPx: max };
  }
  const scratch = surface().getContext('2d', { willReadFrequently: true });
  const trials = Object.fromEntries(methods.map(k => [k, []]));
  const coldMs = {};
  const geometry = {};
  let reference;
  for (const key of methods) {
    const c = surface(), ctx = c.getContext('2d', { willReadFrequently: true });
    const start = performance.now();
    draw(key, ctx);
    const bytes = pixels(ctx);
    coldMs[key] = performance.now() - start;
    if (!reference) reference = bytes;
    let changed = 0, union = 0, channelDelta = 0;
    for (let i = 0; i < bytes.length; i += 4) {
      if (bytes[i + 3] || reference[i + 3]) union++;
      const diff = Math.max(...[0, 1, 2, 3].map(j => Math.abs(bytes[i + j] - reference[i + j])));
      if (diff) changed++;
      channelDelta = Math.max(channelDelta, diff);
    }
    geometry[key] = { ...plotGeometry(key), changed, union, maxRgbaDelta: channelDelta };
    const fig = document.createElement('figure'), label = document.createElement('figcaption');
    fig.style.margin = '0'; c.style.width = '100%'; label.textContent = key;
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', key + ' contour');
    fig.append(c, label); grid.appendChild(fig);
  }
  function sample(round) {
    for (let i = 0; i < methods.length; i++) {
      const key = methods[(i + round) % methods.length];
      for (let f = 0; f < 4; f++) {
        const start = performance.now();
        draw(key, scratch);
        pixels(scratch); // Includes synchronous readback. Distinct from display vsync.
        trials[key].push(performance.now() - start);
      }
    }
  }
  function summarize() {
    return Object.fromEntries(methods.map(key => {
      const times = trials[key].slice(28).sort((a, b) => a - b);
      const percentile = p => times[Math.ceil(times.length * p) - 1];
      return [key, { coldMs: coldMs[key], nFrames: times.length,
        p50Ms: percentile(0.5), p95Ms: percentile(0.95), ...geometry[key] }];
    }));
  }
  function retain(key) {
    // Standalone cost of geometry data kept alive, not total process RSS or GPU memory.
    window.heldContours = Array.from({ length: 32 }, () => key === 'original'
      ? window.originalPoints(arms, 220)
      : contour(arms, { method: key, scale, segments: 220, epsilon: 0.5 }));
  }
  return { sample, summarize, retain, methods, arms, style, radius, scale, size };
}
