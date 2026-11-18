/* Thin public presentation adapter, not a new MINI router or network service. */
(function () {
 'use strict';
 const id=x=>document.getElementById(x);
 const tabs=[['conversacion','Talk'],['documentos','Documents'],['lab','Lab'],['ajustes','My node']];
 const select=(name,focus=false)=>{
   tabs.forEach(([key])=>{
     const chosen=key===name,button=id('tab-'+key),panel=id('panel-'+key);
     button.setAttribute('aria-selected',String(chosen));
     button.tabIndex=chosen?0:-1;
     panel.hidden=!chosen;
   });
   if(focus)id('tab-'+name).focus();
   id('mini-offline-badge').textContent='DETERMINISTIC_ONLY · '+tabs.find(([x])=>x===name)[1]+' · local only';
 };
 tabs.forEach(([name],index)=>{
   const b=id('tab-'+name);
   b.addEventListener('click',()=>select(name));
   b.addEventListener('keydown',e=>{
     if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
     e.preventDefault();
     const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:
       (index+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
     select(tabs[next][0],true);
   });
 });
 id('mini-start-project').addEventListener('click',()=>select('lab',true));
 window.PreceptorDocuments.mount(document);
 window.PreceptorOwnerModelSlots.mount(document,window.localStorage);
 window.PreceptorNodeRegistration.mount(document);
 window.PreceptorMiniProjectGuide.mount(document,window.localStorage,
   window.PreceptorCompanionOnboarding,window.PreceptorDocuments,window.PreceptorOwnerModelSlots);
 const status=id('offline-mini-status');
 if(status){status.hidden=false;status.textContent='DETERMINISTIC_ONLY · shared MINI router, no model or network';}
 const form=id('form-chat');
 if(form && !form.dataset.miniMounted){
   id('mini-offline-badge').textContent='NO_DATA(mini_router_not_loaded)';
 }
 if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{
   id('mini-offline-badge').textContent='DETERMINISTIC_ONLY · offline caching unavailable; local guide still works';
 });
 select('conversacion');
})();
