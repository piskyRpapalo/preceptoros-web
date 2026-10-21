import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const G=require('../public/game/en301_tutorial.js');
const T=require('../public/game/tutorial_fases.js');
test('every tutorial step declares its next action and mirrored words',()=>{
 const view=G.view(T.inicia(),{});
 assert.ok(view.instruction.length); assert.ok(view.next.length);
 assert.equal(view.stamp,'SIMULATED');
 assert.equal(view.audible_text,view.mirror_text);
 assert.ok(new TextEncoder().encode(JSON.stringify(view.frame)).length<1024);
});
test('a continue click cannot assert a battle result',()=>{
 let st=T.elige(T.inicia(),'niebla').estado;
 st=T.evento(st,'pulso',{}).estado;
 st=T.evento(st,'disipa',{dato:'NO_DATA',causa:'fixture'}).estado;
 assert.equal(G.advance(st,{event:'arena101'},{}).ok,false);
});
test('prepared labels retain source measures instead of replacing them', () => {
  const source=require('../public/game/en301_tutorial_building.js').measure('radio').etiqueta;
  const made=G.prepareLabel({title:'My radio',rag_base_prompt:'Explain this radio'}, {ok:true,texto:source,bytes:new TextEncoder().encode(source).length});
  assert.equal(made.ok,true);
  assert.equal(JSON.parse(made.texto).mesuras.touch_px,44);
  assert.equal(JSON.parse(made.texto).authority,false);
});
test('unavailable vibration is not reported as delivered', () => {
 const A=require('../public/game/en301_tutorial_audio.js');
 assert.equal(A.hapticReport({vibrate:()=>false},{ms:[20]}).status,'NO_DATA');
});
test('small model facade and stylesheet keep the touch contract local', async () => {
 const M=require('../public/game/en301_tutorial_model.js');assert.equal(M.FRAME_LIMIT,1024);
 const {readFileSync}=await import('node:fs');
 for(const path of ['../public/assets/en301_tutorial.css','../public/assets/en301_practice.css','../public/game/tutorial-fases.css']) {
  const css=readFileSync(new URL(path,import.meta.url),'utf8');
  assert.match(css,/44px/);assert.doesNotMatch(css,/@import|https?:|url\(/);
 }
});
test('local speech stays available when procedural audio cannot start', () => {
 class El {constructor(){this.children=[];this.listeners={};}get firstChild(){return this.children[0];}appendChild(e){e.parentNode=this;this.children.push(e);}removeChild(e){this.children.splice(this.children.indexOf(e),1);}setAttribute(k,v){this[k]=v;}addEventListener(k,v){this.listeners[k]=v;}focus(){}}
 const doc={createElement:()=>new El(),defaultView:{}},host=new El();let spoken=0;
 const ui=G.mount(doc,host,{audio:{habilitar:()=>({estado:'NO_DATA',causa:'No tone backend'}),deshabilitar(){},verb:()=>({sonido:'NO_DATA',sonido_causa:'No tone backend'})},speech:{getVoices:()=>[{localService:true,lang:'en'}],cancel(){},speak(){spoken++;}},Utterance:function(text){this.text=text;}});
 const all=e=>[e,...e.children.flatMap(all)];const button=all(host).find(e=>e['data-action']==='sound');button.listeners.click();
 assert.equal(spoken,1);ui.destroy();
});
