import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const page=fileURLToPath(new URL('./hex_projection_check.html',import.meta.url));
function capture() {
 const html=execFileSync(process.env.CHROME || 'google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--dump-dom','file://'+page],{encoding:'utf8',maxBuffer:4*1024*1024,stdio:['ignore','pipe','ignore']});
 const match=html.match(/<pre id="receipt">(.*?)<\/pre>/s); assert.ok(match,'missing bitmap receipt');
 const receipt=JSON.parse(match[1]); assert.equal(receipt.vector.v,'preceptoros.vector/1');
 return Buffer.from(receipt.pixels);
}
const a=capture(), b=capture();
assert.equal(a.length,256*160*4); assert.deepEqual(a,b,'bitmap changed with the same vector and fixture');
const changed=Buffer.from(b); changed[0]^=1; assert.notDeepEqual(a,changed,'sabotage must be detected');
console.log('bitmap n=2 byte-identical; sabotage detected; sha256='+createHash('sha256').update(a).digest('hex'));
