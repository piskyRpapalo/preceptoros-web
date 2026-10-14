// TOUR: prueba del popup sobre el mismo navegador y fixture del arnes de lugares.
export async function runTour({valor,page,pausa,report}) {
    report.tour = [];
    if(!await valor('!!document.getElementById("menu-pliego-tutorial")')) report.failures.push('tutorial is not always in the real menu');
    // El fixture de UI SALTA los seis pasos; los eventos de los seis se prueban en tour_casos, sin firmas.
    await valor(`(() => {const T=AtlasTutorial; T.abre('menu'); let n=0; while(T.ficha().paso && !T.PASOS.find(p=>p.id===T.ficha().paso)?.tour && n++<6) T.saltaPaso(); T.tic(); document.getElementById('menu-pliego-tutorial')?.focus();})()`);
    const competence=await valor('AtlasTutorial.ficha().competencia');
    const focusLive=await valor(`(() => {const b=document.querySelector('#genesis-tour [data-action]'),id=b.dataset.action,real=AtlasScreenScript.lugar; b.focus();
      AtlasScreenScript.lugar=(...args)=>{const s=real(...args);return {...s,lineas:s.lineas.concat([['State','EMULATED focus probe']])};};
      AtlasTutorial.tic();const preserved=document.activeElement.dataset.action===id; AtlasScreenScript.lugar=real;AtlasTutorial.tic();return preserved;})()`);
    if(!focusLive) report.failures.push('live figures removed the focused action');
    await page.cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await page.cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27}); await pausa(100);
    const escaped=await valor('({step:AtlasTutorial.ficha().paso,competence:AtlasTutorial.ficha().competencia,open:document.getElementById("genesis-tour").open,focus:document.activeElement.id})');
    if(escaped.step!==null||escaped.open||escaped.competence!==competence||escaped.focus!=='menu-pliego-tutorial') report.failures.push('Escape/skip/focus failed: '+JSON.stringify(escaped));
    await valor("AtlasTutorial.abre('menu')");
    let espera=0;
    for (let n=0;n<40;n++) {
      await valor('AtlasTutorial.tic()');
      if(await valor('AtlasTutorial.ficha().paso && !document.getElementById("genesis-tour").open')) {
        await valor("document.getElementById('menu-pliego-tutorial').click()");
      }
      const f=await valor(`(() => {const T=AtlasTutorial,p=T.PASOS.find(p=>p.id===T.ficha().paso),d=document.getElementById('genesis-tour');
        if(!p) return null; const a=d.querySelector('[data-action]'),s=d.querySelector('#tour-skip');
        return {id:p.id,open:d.open,lines:T.ficha().lineas,rendered:[...d.querySelectorAll('dl dt')].map(t=>[t.textContent,t.nextElementSibling.textContent]),
          action:a?.dataset.action,href:a?.getAttribute('href'),image:d.querySelectorAll('img').length,goal:d.querySelector('.genesis-tour-goal').textContent,
          skip:s?.getBoundingClientRect().toJSON(),height:innerHeight,competence:T.ficha().competencia};})()`);
      if(!f) break;
      report.tour.push(f);
      if(!f.open || JSON.stringify(f.lines)!==JSON.stringify(f.rendered) || f.image || !f.goal || !f.skip || f.skip.height<44 || f.skip.top<0 || f.skip.bottom>f.height) report.failures.push('popup/script/goal/skip invalid: '+f.id);
      if(f.id==='tour-place-observatorio' && !f.action) {
        // Una mirada previa de la prueba de fichas sigue en curso; se espera su ciclo real de fin.
        if(++espera>12) { report.failures.push('observatory did not finish its measured cycle wait'); break; }
        await pausa(1000); n--; continue;
      }
      if(f.id==='tour-place-observatorio') {
        await valor(`window.__tourAction=AtlasTour.actua; AtlasTour.actua=()=>({cause:'NO_DATA (EMULATED rejection probe)',next:'Next: retry the measured action or skip.'}); document.querySelector('#genesis-tour [data-action]').click()`);
        const rejection=await valor(`({step:AtlasTutorial.ficha().paso,competence:AtlasTutorial.ficha().competencia,text:document.querySelector('#genesis-tour [role=status]').textContent})`);
        if(rejection.step!==f.id||rejection.competence!==f.competence||!rejection.text.includes('NO_DATA')||!rejection.text.includes('Next:')) report.failures.push('rejection did not branch: '+f.id);
        await valor('AtlasTour.actua=window.__tourAction');
      }
      if(f.href || !f.action) { await valor("document.getElementById('tour-skip-stop').click()"); }
      else { await valor("document.querySelector('#genesis-tour [data-action]').click()"); }
      await pausa(350);
      if(f.id==='tour-place-cristal') {
        const receipt=await valor('document.getElementById("pliego-ficha").innerText');
        if(!receipt.includes('Cycle ')||!receipt.includes('frames · quality')) report.failures.push('crystal receipt obtained but not presented to the reader');
      }
      if(f.id==='tour-menu-opinar') {
        const open=await valor('!!document.querySelector(".pc-dlg[open]")');
        if(!open) report.failures.push('Feedback menu action did not open its existing dialog');
        await valor('document.querySelector(".pc-dlg[open]")?.close()');
      }
      await valor('AtlasTutorial.tic()');
      if(await valor('AtlasTutorial.ficha().paso')===f.id) { report.failures.push('real action did not advance: '+f.id); break; }
    }
    // Reabrir desde menu, Escape salta y restituye foco; no inventa competencia.
    await valor(`AtlasTutorial.abre('menu'); AtlasTutorial.salta()`);
    report.tourDone=await valor('AtlasTutorial.ficha()');
    if(report.tourDone.paso!==null) report.failures.push('tour not finished/skippable');
}
