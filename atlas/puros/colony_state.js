function colony(s) {
 const fail=()=>{throw Error()}, ids=new Set(), cells=new Set(), owners=new Set();
 if (!s || Object.keys(s).sort().join()!=='buildings,nodes,units' || !['nodes','buildings','units'].every(k=>Array.isArray(s[k]))) fail();
 const rows=(a,keys,check)=>a.map(o=>{
  if (!o || Object.keys(o).sort().join()!==keys || typeof o.id!=='string' || !o.id || ids.has(o.id)) fail();
  ids.add(o.id); check(o); return {...o};
 });
 const nodes=rows(s.nodes,'id,q,r',o=>{
  if (!Number.isSafeInteger(o.q)||!Number.isSafeInteger(o.r)||cells.has(o.q+','+o.r)) fail();
  cells.add(o.q+','+o.r);
 });
 const nodeIds=new Set(nodes.map(o=>o.id));
 const buildings=rows(s.buildings,'id,node',o=>{
  if (!nodeIds.has(o.node)||owners.has(o.node)) fail(); owners.add(o.node);
 });
 const units=rows(s.units,'id,node',o=>{if (!nodeIds.has(o.node)) fail();});
 s={nodes,buildings,units};
 if (new TextEncoder().encode(JSON.stringify(s)).length>=1024) fail();
 return s;
}
if (typeof module==='object') module.exports=colony;
