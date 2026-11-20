// Run against the local public/ server with playwright-core and system Chromium.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
async function run() {
  const browser = await chromium.launch({executablePath:process.env.CHROME_BINARY || '/usr/bin/google-chrome'});
  try {
    for (const width of [360,900]) {
      const page=await browser.newPage({viewport:{width,height:760},serviceWorkers:'block'});
      const intake=[];
      await page.route('**/*',route=>{
        const url=new URL(route.request().url());
        if(url.pathname.includes('/ingesta')) intake.push(url.pathname);
        return url.origin===new URL(process.argv[2]).origin?route.continue():route.abort();
      });
      await page.goto(new URL('/openworld/',process.argv[2]).href);
      await page.waitForSelector('#open-chat-text',{state:'attached'});
      await page.waitForSelector('#voices-title',{state:'attached'});
      const stage=page.locator('#stage'), top=page.locator('#map-communication'), dest=top.locator('select');
      await top.locator('button').click();
      const panel=await page.locator('#voices').boundingBox(), floor=await stage.boundingBox();
      console.log({panel,floor,active:await page.locator("#voices").getAttribute("data-active-category")});
      assert.ok(panel.y-floor.y<70 && panel.height<floor.height*.7);
      assert.equal(await page.locator('#gamepad [data-cat=Communication]').count(),0);
      assert.equal(await page.locator('#view-joystick').isVisible(),true);
      assert.equal(await page.locator('#character-joystick').isVisible(),true);
      if (process.env.RECEIPTS) await page.screenshot({path:process.env.RECEIPTS+'/chat-'+width+'.png'});
      await page.locator('#open-chat-text').fill('Local unsent draft');
      for (const id of ['open-chat','log','entry','voices']) assert.equal(await page.locator('#'+id).count(),1);
      for (const channel of ['radio','echoes','chat']) {
        await dest.selectOption(channel);
        assert.equal(await page.locator('#open-chat-text').isVisible(),false);
        assert.equal(await page.locator('#entry').isVisible(),channel==='chat');
      }
      await page.locator('#chat-destination').selectOption('hexelion');
      assert.ok(await page.locator('#entry').getByText(/On Send/).isVisible());
      await dest.selectOption('public');
      assert.equal(await page.locator('#open-chat-text').inputValue(),'Local unsent draft');
      await dest.press('Escape'); assert.ok(await page.locator('#voices').isHidden());
      await page.locator('#gp-play').click();
      const dock=page.locator('#gamepad .gp-mid button:visible');
      const names=await dock.evaluateAll(items=>items.map(b=>b.getAttribute('aria-label')));
      for(const name of ['Help','Crab','Army']) assert.ok(names.includes(name));
      await page.locator('#gamepad [data-cat=Army]').click();
      assert.ok(await page.locator('#army-visit').isVisible());
      console.log('Visit dock:', names.join(', '));
      assert.deepEqual(intake,[]);
      console.log(width,'top chat, both sticks, four destinations, public draft retained, zero intake requests');
      await page.close();
    }
  } finally { await browser.close(); }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
