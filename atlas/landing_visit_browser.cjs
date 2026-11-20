// Serve public/ on loopback and pass the URL. Requires playwright-core and Chromium.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
async function run() {
  const url = process.argv[2];
  const browser = await chromium.launch({executablePath:process.env.CHROME_BINARY || '/usr/bin/google-chrome'});
  try {
    for (const [width,height] of [[360,720],[420,800],[900,900],[1440,900]]) {
      const page = await browser.newPage({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'});
      await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(url).origin ? route.continue() : route.abort());
      await page.goto(url);
      const box = await page.locator('main').boundingBox();
      assert.ok(Math.abs(box.x+box.width/2-width/2)<1 && Math.abs(box.y+box.height/2-height/2)<1);
      assert.equal(await page.locator('#acho-reel').getAttribute('src'),null);
      const map=page.frames().find(f=>f.parentFrame());
      await map.waitForFunction(()=>window.AtlasWelcome);
      await map.evaluate(()=>document.querySelector('#visitor-play').addEventListener('visitor:render',e=>{
        window.visit=e.detail.account.info().publicKey;
        window.copper=e.detail.state.copper;
      }));
      await page.locator('#look-around').click();
      assert.equal(await map.evaluate(()=>window.visit),undefined);
      await page.goBack();
      await page.locator('#start').click();
      await page.waitForURL('**/#openworld');
      const key=await map.evaluate(()=>window.visit);
      assert.match(key,/^[0-9a-f]{64}$/);
      assert.equal(await map.evaluate(()=>window.copper),100);
      await page.goBack();
      assert.equal(await page.locator('#start').evaluate(el=>document.activeElement===el),true);
      await page.locator('#start').click();
      await page.waitForURL('**/#openworld');
      assert.equal(await map.evaluate(()=>window.visit),key);
      assert.equal(await page.locator('iframe').count(),1);
      console.log(width,height,'centered, poster, look, signed visit, Back, same key, single map');
      await page.close();
    }
    const failed = await browser.newPage({serviceWorkers:'block'});
    const requests = [];
    failed.on('request', req => requests.push(req.url()));
    await failed.addInitScript(() => {
      Object.defineProperty(navigator.connection, 'saveData', {value:true});
      crypto.subtle.verify = async () => false;
    });
    await failed.goto(url);
    const failedMap = failed.frames().find(f=>f.parentFrame());
    await failedMap.waitForFunction(()=>window.AtlasWelcome);
    await failed.locator('#start').click();
    await failed.waitForFunction(()=>document.querySelector('#landing-result').textContent.includes('Visit proof failed'));
    assert.equal(await failed.locator('#landing-world').getAttribute('aria-hidden'),'true');
    assert.equal(await failedMap.locator('#visitor-beacon').count(),0);
    assert.equal(requests.some(path=>path.endsWith('.webm')),false);
    console.log('Save-Data: zero video requests. Rejected proof: no active visit, map hidden.');
    await failed.close();
  } finally { await browser.close(); }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
