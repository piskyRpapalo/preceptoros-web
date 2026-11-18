// Networked, read-only canary. It NEVER invents nodes: input is the current public Aduana GET snapshot.
// Run manually at the delivery gate; intentionally not CI, because CI cannot guarantee current live hardware.
const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {readFileSync, mkdirSync} = require('node:fs');
const {resolve, extname, sep} = require('node:path');
const {chromium} = require('playwright-core');

const base = resolve(__dirname, '../public');
const out = process.env.LIVE_COLONY_RECEIPTS || '/tmp/preceptoros-live-colony-canary';
const kinds = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml',
  '.webmanifest':'application/manifest+json', '.png':'image/png', '.webp':'image/webp',
  '.wasm':'application/wasm', '.woff2':'font/woff2'
};
(async () => {
  const url = 'https://api.preceptoros.org/api/v1/latidos';
  const response = await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000)});
  assert.equal(response.status,200,'Aduana GET must provide a measured world-state');
  const raw = await response.text();
  assert.ok(Buffer.byteLength(raw) < 16384,'world-state reply must stay bounded');
  const snapshot = JSON.parse(raw);
  assert.equal(snapshot.esquema,'preceptoros.openworld-estado/2');
  assert.equal(snapshot.cobertura?.estado,'MEDIDO');
  const rows = snapshot.colonia?.nodes;
  assert.ok(Array.isArray(rows),'the publisher must return node evidence');
  const live = rows.filter(n => n?.seal==='LIVE' && n.alive===true);
  const stale = rows.filter(n => n?.seal==='STALE');
  const expectedIds = live.map(n => n.id).sort();
  let apiReads = 0, serverWrites = 0;
  const server = createServer((request,res) => {
    const u = new URL(request.url,'http://local');
    if (u.pathname==='/api/world-state') {
      apiReads++;
      res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
      res.end(raw);
      return;
    }
    if (request.method!=='GET') {serverWrites++; res.writeHead(405); res.end(); return;}
    try {
      const rel = decodeURIComponent(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname);
      const p=resolve(base,'.'+rel);
      if (!p.startsWith(base+sep)){res.writeHead(403);res.end();return;}
      const bytes=readFileSync(p);
      res.writeHead(200,{'Content-Type':kinds[extname(p)]||'application/octet-stream','Cache-Control':'no-store'});
      res.end(bytes);
    } catch {res.writeHead(404);res.end();}
  });
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  mkdirSync(out,{recursive:true,mode:0o700});
  const site='http://127.0.0.1:'+server.address().port+'/openworld/';
  const browser=await chromium.launch({
    executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage']
  });
  const receipts=[];
  try {
    for(const [width,height] of [[420,680],[360,640]]) {
      const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,serviceWorkers:'block'});
      const page=await ctx.newPage();
      const exceptions=[], writes=[], offOrigin=[];
      page.on('pageerror', e=>exceptions.push(String(e).slice(0,190)));
      page.on('request', request => {
        if (request.method()!=='GET') writes.push(request.method());
        const destination=request.url();
        if (/^https?:/.test(destination) && new URL(destination).origin!==new URL(site).origin)
          offOrigin.push(new URL(destination).origin);
      });
      await page.goto(site,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(expected => {
        const box=document.getElementById('node-doors');
        const present=box && box.querySelectorAll('button.node-door').length;
        return !!(window.AtlasNodeBeacon && window.AtlasOpenworldState && box &&
          (expected ? present===expected : box.textContent.includes('NO_DATA')));
      },live.length,{timeout:12000});
      const result=await page.evaluate(snapshot => {
        const buttons=[...document.querySelectorAll('#node-doors button.node-door')];
        const projected=window.AtlasOpenworldState.leer(snapshot);
        const nodeFrames=window.AtlasNodeBeacon.nodes().map(n=>window.AtlasNodeBeacon.frame(n,new Date().toISOString().slice(0,10)));
        return {
          buttonIds:buttons.map(b=>b.id.slice('node-door-'.length)).sort(),
          buttonLabels:buttons.map(b=>b.textContent),
          ariaLabels:buttons.map(b=>b.getAttribute('aria-label')),
          lastMeasuredLabels:buttons.every(b=>/LIVE.*measured day \d{4}-\d{2}-\d{2}/.test(b.textContent)),
          stateText:document.getElementById('state')?.textContent?.slice(0,300)||'NO_DATA',
          visibleColonyIds:(projected.colonia?.nodes||[]).map(n=>n.id).sort(),
          sealLedger:projected.seals,
          hidden:projected.hidden,
          ownerChatBound:window.AtlasNodeBeacon.nodes().filter(n=>n.id!=='primer-ancla').every(n=>!window.AtlasNodeBeacon.TALKS[n.id]),
          frames:nodeFrames.map(f=>({id:f.id,status:f.status,source:f.source,hasMeasuredDay:/measurement day \d{4}-\d{2}-\d{2}/.test(f.change[0]),bytes:new TextEncoder().encode(JSON.stringify(f)).length})),
        };
      }, snapshot);
      assert.deepEqual(result.buttonIds,expectedIds);
      assert.deepEqual(result.visibleColonyIds,expectedIds);
      assert.ok(result.buttonLabels.every(x=>/LIVE/.test(x)),'all map doors must advertise LIVE');
      assert.equal(result.lastMeasuredLabels,true,'LIVE doors must show the last recorded day');
      assert.ok(stale.every(n=>result.sealLedger[n.id]==='STALE'),'history must remain in source ledger');
      assert.equal(result.hidden,rows.length-live.length);
      assert.equal(result.ownerChatBound,true,'other LIVE nodes never inherit Node 0 Hexelion chat');
      assert.ok(result.frames.every(f=>f.status==='LIVE'&&f.source==='gateway:/api/world-state'&&f.hasMeasuredDay&&f.bytes<1024));
      assert.equal(exceptions.length,0,JSON.stringify(exceptions));
      assert.deepEqual(writes,[], 'the visitor page must not issue writes on load');
      assert.deepEqual(offOrigin,[], 'the visitor page must not phone home across origins');
      const image=resolve(out,'colony_'+width+'x'+height+'.png');
      await page.screenshot({path:image,fullPage:true});
      receipts.push({viewport:width+'x'+height,rendered:result.buttonIds,
        lastMeasuredLabels:result.buttonLabels,staleHidden:stale.length,
        hiddenHistory:result.hidden,frames:result.frames,exceptions,writes:writes.length,offOrigin:offOrigin.length,screenshot:image,
        source:'public_Aduana_GET_snapshot'});
      await ctx.close();
    }
  } finally {
    await browser.close();
    await new Promise(ok=>server.close(ok));
  }
  assert.ok(apiReads>=2,'the browser must read /api/world-state');
  assert.equal(serverWrites,0,'no local server mutation may be attempted');
  console.log(JSON.stringify({
    schema:'preceptoros.live-colony-browser-readonly/1',
    verdict:'PASS',source:url,worldStateSchema:snapshot.esquema,
    publishedRecords:rows.length,live:live.map(n=>({id:n.id,since:n.since})),
    stale:stale.map(n=>({id:n.id,since:n.since})),browserReads:apiReads,
    reports:receipts,observedServerWrites:serverWrites,simulatedNodes:0
  }));
})().catch(error=>{console.error(String(error.stack||error));process.exitCode=1;});
