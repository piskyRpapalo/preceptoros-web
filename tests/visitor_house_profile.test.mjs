import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const P = require('../public/game/visitor_house_profile.js');
const valid = () => ({title:'My first house',bio:'Find my open work here',links:[
  {label:'GitHub',url:'https://github.com/piskyRpapalo'},
  {label:'LinkedIn',url:'https://www.linkedin.com/in/example'}]});

test('minimal first house profile carries no identity or public authority',()=>{
  const r=P.normalize(valid()); assert.equal(r.ok,true);
  assert.equal(r.card.esquema,'preceptoros.visitor-house/1');
  assert.deepEqual(Object.keys(r.card),['esquema','title','bio','links']);
  assert.equal(JSON.stringify(r.card).includes('privateKey'),false);
  assert.ok(new TextEncoder().encode(JSON.stringify(r.card)).length<1024);
});
test('public HTTPS social hosts accepted without query tracking',()=>{
  for(const s of ['https://github.com/example','https://www.linkedin.com/in/sample/','https://bsky.app/profile/sample','https://codeberg.org/example']){
    assert.equal(P.safeUrl(s),new URL(s).href,s);
  }
});
test('unsafe protocols, credentials, parameters, local hosts and impostor domains rejected',()=>{
  for(const s of ['javascript:alert(1)','data:text/html,x','http://github.com/test',
    'https://github.com.evil.test/x','https://x.com@evil.test/x','https://user:pass@github.com/x',
    'https://github.com/a?token=secret','https://github.com/a#secret','https://127.0.0.1/test',
    'https://localhost/test','https://github.com:8443/a','https://github.com\\@evil.test/x',
    'https://github.com/a\nb']){
      assert.equal(P.safeUrl(s),null,s);
    }
});
test('oversized content, incomplete links, duplicates and more than three rejected',()=>{
  let s=valid();s.title='';assert.equal(P.normalize(s).ok,false);
  s=valid();s.bio='❤'.repeat(190);assert.equal(P.normalize(s).ok,false);
  s=valid();s.links.push(s.links[0]);assert.equal(P.normalize(s).ok,false);
  s=valid();s.links.push({label:'X',url:'https://x.com/user'}, {label:'YT',url:'https://youtube.com/@a'});assert.equal(P.normalize(s).ok,false);
  s=valid();s.links[1].url='javascript:alert(1)';assert.equal(P.normalize(s).ok,false);
  s=valid();s.links[1].label='';assert.equal(P.normalize(s).ok,false);
  assert.equal(P.normalize(null).ok,false);
});
test('preview uses text nodes and noopener noreferrer; HTML never parsed',()=>{
  class Element {
    constructor(tag){this.tag=tag;this.children=[];this.textContent='';}
    append(...xs){this.children.push(...xs);}appendChild(x){this.children.push(x);return x;}
  }
  const doc={createElement:t=>new Element(t)};
  const r=P.normalize({title:'<img src=x onerror=alert(1)>',bio:'<script>alert(1)</script>',
    links:[{label:'<b>GitHub</b>',url:'https://github.com/owner'}]});
  assert.equal(r.ok,true);const tree=P.preview(doc,r.card);
  assert.equal(tree.children[0].textContent,r.card.title);
  assert.equal(tree.children[1].textContent,r.card.bio);
  const a=tree.children[2].children[0].children[0];
  assert.equal(a.textContent,'<b>GitHub</b>');
  assert.equal(a.rel,'noopener noreferrer');assert.equal(a.target,'_blank');
  assert.equal(a.href,'https://github.com/owner');
  assert.equal(JSON.stringify(tree).includes('innerHTML'),false);
});
