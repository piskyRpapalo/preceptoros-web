/* MVP-A0 · Real Chromium regression for the two PWA scopes.
 * A clean, script-free WEB probe avoids racing OpenWorld's existing auto-reload
 * on controllerchange; root WEB offline routes are checked via their cached
 * asset and in the separate sw_harness.mjs route regression.
 * NODE_PATH=<existing dir containing playwright-core> node --test tests/mvp_a0_sw_coexist.browser.cjs
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const {mkdirSync}=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const publicRoot=path.resolve(__dirname,'../public');
let upgradeMode=false;
const requested=[];
const contentTypes={'.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.webmanifest':'application/manifest+json','.png':'image/png','.json':'application/json'};
const server=createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');
 let name=u.pathname;
 requested.push(name);
 if(name==='/__mvp_a0_probe__'){
   res.writeHead(200,{'content-type':'text/html'});return res.end('<!doctype html><title>WEB scope probe</title>');
 }
 if(name==='/app'){res.writeHead(308,{location:'/app/'+u.search});return res.end();}
 if(name==='/app/' || name==='/')name+='index.html';
 if(name==='/openworld/')name+='index.html';
 const asset=path.resolve(publicRoot,'.'+name);
 if(!asset.startsWith(publicRoot+path.sep)){res.writeHead(403);return res.end();}
 try{
  let bytes=await readFile(asset);
  if(name==='/sw.js' && u.searchParams.has('upgrade')){
   const before=bytes.toString();
   const after=before.replace(/const VERSION = '([^']+)';/,
     (_,version)=>"const VERSION = '"+version+"-mvp-a0-upgrade';");
   if(after===before)throw Error('missing SW version');
   bytes=Buffer.from(after);
  }
  res.writeHead(200,{'content-type':contentTypes[path.extname(name)]||'application/octet-stream',
    'cache-control':'no-store'});
  return res.end(bytes);
 }catch(e){if(name==='/sw.js'||name==='/sw-listas.js')console.error('SW_SERVER_404',name,String(e));res.writeHead(404);return res.end();}
});
async function waitFor(page,fn,arg,timeout=20000){
 await page.waitForFunction(fn,arg,{timeout});
}
async function rootInstall(page,upgrade){
 const script=upgrade?'/sw.js?upgrade=1':'/sw.js';
 await page.evaluate(source=>navigator.serviceWorker.register(source,
   {scope:'/',updateViaCache:'none'}),script);
 await waitFor(page,async expected=>{
  const r=await navigator.serviceWorker.getRegistration('/');
  if(!r?.active || r.active.state!=='activated')return false;
  const current=new URL(r.active.scriptURL);
  if(current.pathname+current.search!==expected)return false;
  const keys=await caches.keys();
  return keys.some(k=>k.startsWith('shell-preceptoros-') &&
    (!expected.includes('upgrade=1') || k.endsWith('-mvp-a0-upgrade')));
 },script);
}
async function appOpen(page,base){
 const result=await page.goto(base+'/app/',{waitUntil:'domcontentloaded',timeout:20000});
 assert.equal(result.status(),200);
 await waitFor(page,()=>!!window.PreceptorMiniProjectGuide &&
   document.querySelectorAll('[role="tab"]').length===4);
 await waitFor(page,async()=>{
   const regs=await navigator.serviceWorker.getRegistrations();
   return regs.some(r=>r.scope.endsWith('/app/') && r.active?.state==='activated') &&
     !!navigator.serviceWorker.controller?.scriptURL.includes('/app/sw.js');
 },null);
}
test('MVP-A0: Chrome both SW installation orders, two mobile widths, update, offline and persistence',
 {timeout:155000},async t=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true,
   executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
   args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const order of ['mini-first','root-first'])for(const width of [360,420]){
   await t.test(order+' '+width,{timeout:35000},async()=>{
    const ctx=await browser.newContext({viewport:{width,height:740},serviceWorkers:'allow'});
    try{
     const page=await ctx.newPage(),start=requested.length;
     if(order==='root-first'){
      await page.goto(base+'/__mvp_a0_probe__',{waitUntil:'domcontentloaded'});
      await rootInstall(page,false);
      await appOpen(page,base);
     }else{
      await appOpen(page,base);
      await rootInstall(page,false);
     }
     await page.locator('#tab-documentos').focus();
     await page.keyboard.press('Enter');
     assert.equal(await page.locator('#tab-documentos').getAttribute('aria-selected'),'true');
     await page.locator('#tab-conversacion').focus();
     await page.keyboard.press('Enter');
     const a11y=await page.evaluate(()=>{
      const x=document.getElementById('mini-offline-badge');
      return {live:x.getAttribute('aria-live'),state:x.dataset.state,acho:x.dataset.acho};
     });
     assert.equal(a11y.live,'polite');
     assert.equal(a11y.state,'DETERMINISTIC_ONLY');
     assert.equal(a11y.acho,a11y.state);
     if(order==='mini-first'){
      const dir=path.resolve(__dirname,'../docs/receipts');mkdirSync(dir,{recursive:true});
      await page.screenshot({path:path.join(dir,'mvp-a0-mini-'+width+'.png')});
     }
     await page.evaluate(()=>{
      document.getElementById('mini-start-project').click();
      const template=document.getElementById('mini-project-template');
      template.value='law';template.dispatchEvent(new Event('change'));
      document.getElementById('mini-project-title').value='MVP-A0-'+Date.now();
      document.getElementById('mini-project-form').requestSubmit();
      document.getElementById('mini-to-documents').click();
      document.getElementById('documentos-nuevo-btn').click();
      const title=document.getElementById('documentos-titulo');
      title.value='Source note';title.dispatchEvent(new Event('input'));
      document.getElementById('documentos-contenido').value='Owner reviewed source.';
      document.getElementById('documentos-guardar').click();
     });
     const saved=await page.evaluate(()=>({
      project:JSON.parse(localStorage.getItem('preceptoros.public-mini.project.v1'))?.title,
      docs:window.PreceptorDocuments.loadDocuments().filter(x=>x.state==='saved').length,
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+4
     }));
     assert.match(saved.project,/^MVP-A0-/);assert.equal(saved.docs,1);assert.equal(saved.overflow,false);
     await rootInstall(page,true);
     await waitFor(page,async()=>{
      const ks=await caches.keys();
      const child=ks.some(k=>k.startsWith('preceptoros-public-mini-'));
      const root=ks.some(k=>k.startsWith('shell-preceptoros-') && k.endsWith('-mvp-a0-upgrade'));
      if(!child||!root)return false;
      const c=await caches.open(ks.find(k=>k.startsWith('shell-preceptoros-') && k.endsWith('-mvp-a0-upgrade')));
      return !!await c.match('/openworld/');
     },null);
     const foreign=requested.slice(start).filter(x=>
      (x.startsWith('/api/') && x!=='/api/world-state') || x.includes('21434')||x.includes('8742'));
     assert.deepEqual(foreign,[]);
     await ctx.setOffline(true);
     await page.reload({waitUntil:'domcontentloaded',timeout:20000});
     await waitFor(page,()=>!!window.PreceptorMiniProjectGuide && !!window.PreceptorDocuments,null);
     const offline=await page.evaluate(()=>({
      project:window.PreceptorMiniProjectGuide.load(localStorage,window.PreceptorCompanionOnboarding)?.ok,
      docs:window.PreceptorDocuments.loadDocuments().filter(x=>x.state==='saved').length,
      ctrl:navigator.serviceWorker.controller?.scriptURL,
      tabs:document.querySelectorAll('[role=tab]').length
     }));
     assert.equal(offline.project,true);assert.equal(offline.docs,1);
     assert.equal(offline.tabs,4);assert.match(offline.ctrl,/\/app\/sw\.js/);
     console.log(JSON.stringify({status:'PASS',order,width,project:true,documents:1,
       rootSW:'upgraded',miniSW:'preserved',rootWorldCache:true,offline:true,privateApi:0}));
    }finally{await ctx.close();}
   });
  }
 }finally{
  await browser?.close();
  await new Promise(r=>server.close(r));
 }
});
