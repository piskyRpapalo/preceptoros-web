// Observe the existing consumers during real browser loading; no product instrumentation.
export async function installWavesCraft(cmd) {
  await cmd('Page.addScriptToEvaluateOnNewDocument', {source:`
    window.__wavesCraftLoading=false;
    new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)
      if(n.textContent==='Opening WavesCraft…')window.__wavesCraftLoading=true;
    }).observe(document,{childList:true,subtree:true});`});
}
export async function checkWavesCraft(evaluate, failures, path) {
  const ok = await evaluate(`document.querySelector('.atlas-incubadora h4')?.textContent==='WavesCraft'
    && window.__wavesCraftLoading===true
    && AtlasJuego.texto('army_carga')==='Opening WavesCraft…'`);
  if (!ok) failures.push({path,step:'WavesCraft',snippet:'heading or observed loading label mismatch'});
}
