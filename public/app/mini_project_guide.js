/* Four-zone public MINI project guide · deterministic, browser-owned, no network.
 * Uses existing Documents, Companion draft validator and Owner model slots.
 * The source links are citations to be opened by the owner, not bundled texts.
 */
(function (root) {
  'use strict';
  const SCHEMA = 'preceptoros.mini-project/1';
  const STORAGE = 'preceptoros.public-mini.project.v1';
  const STEPS = Object.freeze(['Create project', 'Describe purpose', 'Add documents',
    'Review project', 'Configure AI', 'My node']);
  const TEMPLATES = Object.freeze({
    law: Object.freeze({
      title: 'European AI & Software Law',
      purpose: 'Explore European AI and software law with versioned primary references.',
      description: 'Owner-editable research project. Compare source versions and explain limits. This template is not legal advice.',
      sources: [
        {title:'AI Act · Regulation (EU) 2024/1689 (original OJ)', url:'https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng', version:'2024-07-12'},
        {title:'Digital Services Act · Regulation (EU) 2022/2065 (original OJ)', url:'https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng', version:'2022-10-27'}
      ]
    }),
    fairness: Object.freeze({
      title: 'Digital Fairness Observatory',
      purpose: 'Study dark patterns and digital fairness with owner-provided evidence.',
      description: 'Owner-editable research project. EU Commission fitness-check source. LAB/DFA benchmark receipts: NO_DATA(not_bundled).',
      sources: [
        {title:'European Commission · Digital Fairness fitness check (SWD(2024)245)',url:'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52024SC0245',version:'2024-10-03'},
        {title:'EU Digital Services Act · Regulation (EU) 2022/2065',url:'https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng',version:'2022-10-27'}
      ]
    })
  });

  const trim = value => typeof value === 'string' ? value.trim() : '';
  function validate(data, companion) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {ok:false,cause:'project_object_missing'};
    const title = trim(data.title), purpose = trim(data.purpose), description = trim(data.description);
    if (!title || title.length > 80) return {ok:false,cause:'project_title_invalid'};
    if (!purpose || purpose.length > 600) return {ok:false,cause:'project_purpose_invalid'};
    if (!description || description.length > 3000) return {ok:false,cause:'project_description_invalid'};
    const validator = companion && companion.renderBuildingDraft;
    if (typeof validator !== 'function') return {ok:false,cause:'companion_validator_unavailable'};
    const draft = validator({name:title,purpose});
    if (!draft.ok) return {ok:false,cause:'project_validation_failed',details:draft.errors};
    if (companion.looksLikeSecret && companion.looksLikeSecret(description)) {
      return {ok:false,cause:'project_description_contains_secret'};
    }
    return {ok:true,value:{schema:SCHEMA,title,purpose,description,slug:draft.slug,
      template: data.template==='law' || data.template==='fairness'?data.template:'custom',
      state:'DRAFT_ONLY',owner:'local_browser',deployment:'NOT_SUBMITTED'}};
  }
  function save(storage, data, companion) {
    const result = validate(data,companion);
    if (!result.ok) return result;
    try {
      storage.setItem(STORAGE,JSON.stringify(result.value));
      return result;
    } catch (_) {return {ok:false,cause:'owner_storage_unavailable'};}
  }
  function load(storage, companion) {
    try {
      const raw = storage.getItem(STORAGE);
      if (!raw) return {ok:false,cause:'no_project_saved'};
      if (raw.length > 4500) return {ok:false,cause:'oversize_project_storage'};
      return validate(JSON.parse(raw),companion);
    } catch (_) {return {ok:false,cause:'project_storage_unreadable'};}
  }
  function documents(docModule) {
    try {
      const rows=docModule.loadDocuments();
      if (!Array.isArray(rows)) return {count:0,cause:'document_index_invalid'};
      const valid=rows.filter(row=> row && typeof row.title==='string' && row.title.length<=80 &&
        typeof row.content==='string' && row.content.length<=100000 && row.state==='saved');
      return {count:valid.length,rows:valid,cause:valid.length===rows.length?null:'invalid_documents_excluded'};
    } catch (_) {return {count:0,cause:'document_index_unavailable'};}
  }
  function modelState(ownerSlots, storage, turn) {
    if (!ownerSlots || !storage || typeof ownerSlots.read!=='function') {
      return {state:'DETERMINISTIC_ONLY',cause:'owner_model_slot_unavailable'};
    }
    const config=ownerSlots.read(storage);
    if (!config.ok) return {state:'DETERMINISTIC_ONLY',cause:config.cause};
    const selection=config.value.private_chat_model;
    if (!selection || selection.runtime==='none') return {state:'DETERMINISTIC_ONLY',cause:'owner_model_not_selected'};
    // A saved label is not a connection. This branch can only be reached by
    // the future owner-controlled adapter after an actual consented local turn.
    if (turn && turn.source==='owner_runtime_turn' && turn.ownerConsent===true &&
        turn.runtimeObserved===true && typeof turn.answer==='string' &&
        trim(turn.answer).length>0 && !trim(turn.answer).startsWith('NO_DATA(')) {
      return {state:'MODEL_VERIFIED',cause:'actual_owner_runtime_turn_observed'};
    }
    return {state:'MODEL_CONFIGURED',cause:'no_verified_model_turn'};
  }
  function progress(project, docs, models, reviewed, openedNode) {
    return [Boolean(project),Boolean(project && project.purpose && project.description),
      docs.count>0, Boolean(project && reviewed),Boolean(models && models.state),
      Boolean(openedNode)].map((complete,index)=>({step:STEPS[index],complete}));
  }
  function answer(question, project, docs, models) {
    const q=trim(question).toLowerCase().replace(/[?!.,]/g,'');
    if (!q || q.length>240) return {state:'NO_DATA',cause:'question_invalid',text:'Ask one short question about this MINI.'};
    const source='preceptoros.mini-project/1; interface/mini_project_guide.js';
    if (/talk|chat|conversation|mini|help|what can you do|how does this work/.test(q)) {
      return {state:'DETERMINISTIC_ONLY',cause:'known_mini_capabilities',source,
        text:'Talk explains these four zones and provides deterministic guidance; it is not a generative model. No private Hexelion connection is granted.'};
    }
    if (/document|file|save|export|privacy|storage|where.*data/.test(q)) {
      return {state:'DETERMINISTIC_ONLY',cause:'local_documents_contract',source:'interface/documents.js',
        text:'Documents remain in this browser localStorage (not encrypted) until you export or explicitly share. Current validated document count: '+docs.count+'. Use Documents to import, edit, download or delete; export the whole project here.'};
    }
    if (/law|european|fairness|source|citation|reference|dark pattern/.test(q)) {
      const refs=project && TEMPLATES[project.template] ? TEMPLATES[project.template].sources : [];
      return {state:refs.length?'DETERMINISTIC_ONLY':'NO_DATA',
        cause:refs.length?'listed_primary_reference_links':'no_verified_sources_for_custom_project',
        source, text:refs.length
          ? refs.map(s=>s.title+' · '+s.version+' · '+s.url).join(' | ')+'. Links identify primary publications; their content is not fetched, indexed or automatically updated.'
          : 'NO_DATA(owner_sources_not_added). Add sources in Documents; MINI does not fabricate references.'};
    }
    if (/model|ai|ollama|llm|generate|intelligence/.test(q)) {
      return {state:models.state,cause:models.cause,source:'interface/owner_model_slots.js',
        text:'Current model: '+models.state+'. A saved name alone is never a verified conversation. AI is optional; no model is installed or contacted automatically.'};
    }
    if (/node|deploy|sign|approval|publish|live/.test(q)) {
      return {state:'DRAFT_ONLY',cause:'node_review_not_submitted',source:'interface/node_registration.js',
        text:'My node prepares a review request. Sign deployment means ask a human to review, not issue an SSH signature. Real receipt, approval, provisioned key and public LIVE are separate.'};
    }
    if (/lab|project|purpose|status|progress|next/.test(q)) {
      return {state:'DRAFT_ONLY',cause:'local_project_progress',source,
        text:project?'Project '+project.title+' is kept locally. Documents: '+docs.count+'. Open Lab to review each step.':
          'Create your first project in Lab. Name, purpose and description are required; no account or model needed.'};
    }
    return {state:'NO_DATA',cause:'deterministic_answer_not_found',source,
      text:'NO_DATA(question_outside_local_guide). I cannot generate an answer without an authorized model. Try asking about Talk, Documents, Lab, My node, sources or models.'};
  }
  function exportBundle(project,docModule) {
    if (!project) return {ok:false,cause:'no_project_saved'};
    const docs=documents(docModule);
    if (docs.cause) return {ok:false,cause:docs.cause};
    return {ok:true,content:JSON.stringify({schema:'preceptoros.mini-project-export/1',
      project,documents:docs.rows.map(d=>({title:d.title,content:d.content,
        modified:d.modified || null})),source_links:TEMPLATES[project.template]?.sources || [],
      declared_by:'browser_owner',sent:false,model_weights_included:false},null,2)};
  }

  function mount(doc,storage,companion,docModule,ownerSlots) {
    const host=doc.getElementById('mini-project-guide');
    if (!host || host.dataset.mounted==='1') return false;
    host.dataset.mounted='1';
    const el=id=>doc.getElementById(id);
    const status=el('mini-project-status');
    const modelsEl=el('mini-model-status');
    const steps=el('mini-project-steps');
    const templates=el('mini-project-template');
    const fields={title:el('mini-project-title'),purpose:el('mini-project-purpose'),
      description:el('mini-project-description')};
    let current=null,reviewed=false,openedNode=false;
    function say(message,state,cause) {
      status.textContent=message;
      status.dataset.state=status.dataset.acho=state;
      status.dataset.cause=cause;
    }
    function refresh() {
      const snapshot=load(storage,companion);
      current=snapshot.ok?snapshot.value:null;
      const docs=documents(docModule);
      const models=modelState(ownerSlots,storage);
      modelsEl.textContent=models.state+' · '+models.cause;
      modelsEl.dataset.state=modelsEl.dataset.acho=models.state;
      steps.replaceChildren();
      progress(current,docs,models,reviewed,openedNode).forEach((step,i)=>{
        const li=doc.createElement('li');
        li.textContent=(step.complete?'Complete: ':'Next: ')+step.step;
        li.dataset.state=li.dataset.acho=step.complete?'DRAFT_ONLY':'NO_DATA';
        li.dataset.step=String(i+1);
        steps.appendChild(li);
      });
      el('mini-project-export').disabled=!current;
      el('mini-project-review').disabled=!current;
      if (!snapshot.ok) say('DRAFT_ONLY · Create a project, enter purpose and description, then save locally.','DRAFT_ONLY',snapshot.cause);
      else say('DRAFT_ONLY · Project '+current.title+' saved in this browser. Documents: '+docs.count+'. No network or publication.',
        'DRAFT_ONLY',docs.cause || 'project_local_only');
    }
    function chooseTemplate(id) {
      const template=TEMPLATES[id];
      if (!template)return;
      fields.title.value=template.title;
      fields.purpose.value=template.purpose;
      fields.description.value=template.description;
      reviewed=false;
      say('DRAFT_ONLY · Editable template loaded. It is not stored until you save it.',
        'DRAFT_ONLY','template_not_saved');
    }
    templates.addEventListener('change',()=>chooseTemplate(templates.value));
    el('mini-project-form').addEventListener('submit',event=>{
      event.preventDefault();
      const result=save(storage,{
        title:fields.title.value,purpose:fields.purpose.value,
        description:fields.description.value,template:templates.value
      },companion);
      if (!result.ok) {
        say('NO_DATA('+result.cause+') · Correct the fields. Nothing was saved.','NO_DATA',result.cause);
        return;
      }
      reviewed=false;
      refresh();
    });
    el('mini-project-review').addEventListener('click',()=>{
      if (!current)return;
      reviewed=true;
      const d=documents(docModule),m=modelState(ownerSlots,storage);
      const review=el('mini-project-review-text');
      review.textContent=JSON.stringify({
        schema:SCHEMA,title:current.title,purpose:current.purpose,description:current.description,
        documents:d.count,model:m.state,source_links:TEMPLATES[current.template]?.sources||[],
        source_content:'NO_DATA(not_downloaded)',lab_dfa_receipts:'NO_DATA(not_bundled)',
        deployment:'NOT_SUBMITTED',authority:'NONE'
      },null,2);
      refresh();
    });
    el('mini-project-export').addEventListener('click',()=>{
      const result=exportBundle(current,docModule);
      if (!result.ok){say('NO_DATA('+result.cause+')','NO_DATA',result.cause);return;}
      const url=URL.createObjectURL(new Blob([result.content],{type:'application/json;charset=utf-8'}));
      const a=doc.createElement('a');a.href=url;a.download='preceptoros-mini-project.json';
      a.rel='noopener';doc.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      say('DRAFT_ONLY · Export requested. Verify the download on your device. Nothing uploaded.',
        'DRAFT_ONLY','export_download_started');
    });
    el('mini-to-documents').addEventListener('click',()=>el('tab-documentos').click());
    el('mini-to-node').addEventListener('click',()=>{
      openedNode=true;el('tab-ajustes').click();refresh();
    });
    el('mini-project-refresh').addEventListener('click',refresh);
    const ask=el('mini-guide-ask');
    el('mini-guide-form').addEventListener('submit',event=>{
      event.preventDefault();
      const a=answer(ask.value,current,documents(docModule),modelState(ownerSlots,storage));
      const out=el('mini-guide-answer');
      out.textContent=a.text+' Source: '+(a.source||'NO_DATA(source_unavailable)');
      out.dataset.state=out.dataset.acho=a.state;
      out.dataset.cause=a.cause;
    });
    const first=load(storage,companion);
    if (first.ok) {
      fields.title.value=first.value.title;fields.purpose.value=first.value.purpose;
      fields.description.value=first.value.description;templates.value=first.value.template;
    }
    refresh();
    return true;
  }
  const api=Object.freeze({schema:SCHEMA,templates:TEMPLATES,steps:STEPS,validate,save,
    load,documents,modelState,progress,answer,exportBundle,mount});
  root.PreceptorMiniProjectGuide=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
