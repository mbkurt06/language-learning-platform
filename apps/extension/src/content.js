(() => {
  const ADAPTERS = [
    {id:"youtube", host:/youtube\.com$/, selectors:[".ytp-caption-segment"]},
    {id:"zdf", host:/(^|\.)zdf\.de$/, selectors:["[class*='subtitle']","[class*='caption']","[aria-live='polite']"]},
    {id:"ard", host:/(^|\.)ardmediathek\.de$/, selectors:["[class*='subtitle']","[class*='caption']","[aria-live='polite']"]}
  ];

  const state = {
    cache:new Map(),
    analysisInflight:new Map(),
    tooltip:null,
    tooltipHideTimer:null,
    settings:{showSentenceTranslation:true,germanFontSize:100,translationFontSize:100,youtubeSubtitlePositionY:82},
    learningItems:[],
    learningProfileId:null,
    encounterCaptureKeys:new Set(),
    youtube:{
      overlay:null,
      germanLine:null,
      video:null,
      frameId:null,
      videoListeners:null,
      videoId:"",
      cues:null,
      cueIndex:-1,
      timedAvailable:false,
      domPending:"",
      domStable:"",
      domLastChange:0,
      domFirstSeen:0,
      domTimer:null,
      hideTimer:null,
      corpusIndexing:new Set(),
      panel:null,
      panelTab:"subtitles",
      transcriptAnalysis:null,
      transcriptAnalysisVideoId:"",
      transcriptAnalysisRun:0,
      previewTimer:null,
      panelSelectedLemma:"",
      panelCollapsed:false,
      panelDocked:false,
      videoUnknownLemmas:new Set(),
      transcriptAnalysisPromise:null,
      expressionGroupsAnalysis:null,
      expressionGroupsVideoId:"",
      expressionGroupsPromise:null,
      panelSelectedGroupKey:"",
      wordsView:"overview",
      wordsSearch:"",
    }
  };

  const adapter=ADAPTERS.find(a=>a.host.test(location.hostname));
  if(!adapter) return;

  function tokenize(text){
    return text.match(/[\p{L}\p{M}ßÄÖÜäöü]+(?:['’-][\p{L}\p{M}]+)?|[^\s]/gu)||[];
  }

  function cancelTooltipHide(){
    clearTimeout(state.tooltipHideTimer);
    state.tooltipHideTimer=null;
  }

  function scheduleTooltipHide(delay=240){
    if(state.tooltipHideTimer) return;
    state.tooltipHideTimer=setTimeout(()=>{
      state.tooltipHideTimer=null;
      if(state.tooltip) state.tooltip.hidden=true;
    },delay);
  }

  function createTooltip(){
    const el=document.createElement("div");
    el.id="gle-tooltip";
    el.hidden=true;
    el.addEventListener("mouseenter",cancelTooltipHide);
    el.addEventListener("mouseleave",()=>scheduleTooltipHide(350));
    document.documentElement.appendChild(el);
    return el;
  }

  function esc(s){
    const d=document.createElement("div");
    d.textContent=s??"";
    return d.innerHTML;
  }

  function escAttr(s){
    return esc(s).replace(/"/g,"&quot;");
  }

  function expressionTypeLabel(type){
    return ({
      IDIOM:"Kalıp / deyim",
      REFLEXIVE_VERB:"Refleksif fiil",
      VERB_PREPOSITION:"Fiil + edat",
      REFLEXIVE_VERB_PREPOSITION:"Refleksif fiil + edat",
      NOMEN_VERB:"İsim + fiil kalıbı",
      FUNCTION_VERB:"Sabit fiil kalıbı",
      ADJECTIVE_PREPOSITION:"Sıfat + edat",
      NOUN_PREPOSITION:"İsim + edat",
      PARTICLE_VERB:"Ayrılabilen fiil",
      COPULAR_CONSTRUCTION:"Sabit yapı (sein/werden/bleiben)",
      GRAMMAR_CONSTRUCTION:"Dilbilgisi yapısı",
      COLLOCATION:"Birlikte kullanım",
      FIXED_CONSTRUCTION:"Sabit yapı"
    })[type] || "Birlikte kullanım";
  }

  function posLabel(pos){
    return ({
      NOUN:"İsim",
      PROPN:"Özel isim",
      VERB:"Fiil",
      AUX:"Yardımcı fiil",
      ADJ:"Sıfat",
      ADV:"Zarf",
      ADP:"Edat",
      PRON:"Zamir",
      DET:"Tanımlık / belirleyici",
      SCONJ:"Bağlaç",
      CCONJ:"Bağlaç",
      PART:"Parçacık",
      NUM:"Sayı",
      INTJ:"Ünlem",
    })[pos] || "Kelime";
  }

  function learningKey(kind,key){
    return kind+":"+String(key||"").toLocaleLowerCase("de-DE");
  }

  function isLearning(kind,key){
    const wanted=learningKey(kind,key);
    return state.learningItems.some(item=>learningKey(item.kind,item.key)===wanted);
  }

  async function platformApiBase(){
    const {platformApiUrl="http://127.0.0.1:8000"}=await chrome.storage.sync.get("platformApiUrl");
    return platformApiUrl.replace(/\/$/,"");
  }

  function normalizeApiLearningItem(item){
    const translation=(item.translations||[]).find(entry=>entry.language==="tr") || item.translations?.[0];
    return {
      id:item.id,
      kind:item.category,
      key:item.canonical_key,
      label:item.canonical_form,
      meaning_tr:translation?.meaning||"",
      encounters:item.encounters||[],
    };
  }

  function refreshLearningHighlights(){
    if(adapter.id==="youtube" && state.youtube.cues?.length){
      state.youtube.cueIndex=-1;
      renderTimedCue();
      return;
    }
    document.querySelectorAll("[data-gle-text]").forEach(node=>{
      const text=node.dataset.gleText;
      node.dataset.gleText="";
      decorate(node,text);
    });
  }

  async function ensureLearningProfile(){
    const stored=await chrome.storage.sync.get({
      clientSubject:"",
      learningProfileId:"",
      learningItems:[],
      learningItemsMigratedToApi:false,
    });
    let clientSubject=stored.clientSubject;
    if(!clientSubject){
      clientSubject=crypto.randomUUID();
      await chrome.storage.sync.set({clientSubject});
    }

    const apiBase=await platformApiBase();
    const response=await fetch(apiBase+"/api/v1/profiles/ensure",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        external_subject:clientSubject,
        source_language:"de",
        target_language:"tr",
      }),
    });
    if(!response.ok) throw new Error("Platform API profile "+response.status);
    const profile=await response.json();
    state.learningProfileId=profile.id;
    await chrome.storage.sync.set({learningProfileId:profile.id});

    if(!stored.learningItemsMigratedToApi && Array.isArray(stored.learningItems) && stored.learningItems.length){
      for(const legacy of stored.learningItems){
        await fetch(apiBase+"/api/v1/learning-items",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            profile_id:profile.id,
            canonical_form:legacy.label||legacy.key,
            canonical_key:String(legacy.key||"").toLocaleLowerCase("de-DE"),
            category:legacy.kind||"word",
            status:"learning",
            meaning:legacy.meaning_tr||null,
            meaning_language:legacy.meaning_tr?"tr":null,
            metadata:{migrated_from:"chrome.storage.sync"},
          }),
        });
      }
      await chrome.storage.sync.set({learningItemsMigratedToApi:true});
      await chrome.storage.sync.remove("learningItems");
    }
    return profile.id;
  }

  async function loadLearningItems(){
    const profileId=state.learningProfileId || await ensureLearningProfile();
    const apiBase=await platformApiBase();
    const response=await fetch(apiBase+"/api/v1/learning-items?profile_id="+encodeURIComponent(profileId));
    if(!response.ok) throw new Error("Platform API learning items "+response.status);
    const payload=await response.json();
    state.learningItems=(payload.items||[]).map(normalizeApiLearningItem);
    refreshLearningHighlights();
    if(adapter.id==="youtube" && state.youtube.panel && !state.youtube.panel.hidden){
      renderYouTubeSidePanel();
    }
  }

  async function saveLearningItem(item, encounterSnapshot=null){
    const normalized={...item,key:String(item.key||"").toLocaleLowerCase("de-DE")};
    const id=learningKey(normalized.kind,normalized.key);
    if(state.learningItems.some(existing=>learningKey(existing.kind,existing.key)===id)) return;
    const profileId=state.learningProfileId || await ensureLearningProfile();
    const apiBase=await platformApiBase();
    const response=await fetch(apiBase+"/api/v1/learning-items",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        profile_id:profileId,
        canonical_form:normalized.label||normalized.key,
        canonical_key:normalized.key,
        category:normalized.kind,
        status:"learning",
        meaning:normalized.meaning_tr||null,
        meaning_language:normalized.meaning_tr?"tr":null,
        metadata:{source:"chrome-extension"},
      }),
    });
    if(!response.ok) throw new Error("Platform API learning item "+response.status);
    const created=await response.json();
    await captureCurrentEncounter(created.id,normalized.surface||normalized.label||normalized.key,encounterSnapshot);
    await loadLearningItems();
    return created;
  }

  function currentYouTubeEncounter(surfaceForm){
    if(adapter.id!=="youtube") return null;
    const videoId=state.youtube.videoId || new URL(location.href).searchParams.get("v");
    if(!videoId) return null;

    const cue=state.youtube.cues?.[state.youtube.cueIndex] || null;
    const video=state.youtube.video || document.querySelector("video.html5-main-video") || document.querySelector("video");
    const fallbackStart=Math.max(0,Math.round((video?.currentTime||0)*1000));
    const startMs=Number.isFinite(cue?.startMs) ? Math.round(cue.startMs) : fallbackStart;
    const endMs=Number.isFinite(cue?.endMs) && cue.endMs>startMs
      ? Math.round(cue.endMs)
      : startMs+5000;
    const sentence=cue?.text || state.youtube.germanLine?.dataset.gleText || "";

    return {
      surface_form:surfaceForm,
      sentence,
      provider:"youtube",
      source_type:"video",
      external_id:videoId,
      url:"https://www.youtube.com/watch?v="+encodeURIComponent(videoId),
      title:document.title.replace(/\s*-\s*YouTube\s*$/u,"").trim() || null,
      media_timestamp_ms:startMs,
      media_end_timestamp_ms:endMs,
      context:{
        cue_index:cue?.index ?? null,
        page_url:location.href,
      },
    };
  }

  async function captureCurrentEncounter(learningItemId,surfaceForm,encounterSnapshot=null){
    const encounter=encounterSnapshot || currentYouTubeEncounter(surfaceForm);
    if(!encounter || !encounter.sentence) return;
    const apiBase=await platformApiBase();
    const response=await fetch(apiBase+"/api/v1/encounters",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({learning_item_id:learningItemId,...encounter}),
    });
    if(!response.ok) throw new Error("Platform API encounter "+response.status);
  }

  function captureSeenLearningItem(item,surfaceForm){
    if(adapter.id!=="youtube" || !item?.id) return;
    const cue=state.youtube.cues?.[state.youtube.cueIndex];
    const videoId=state.youtube.videoId || new URL(location.href).searchParams.get("v");
    if(!cue || !videoId) return;

    const key=[item.id,videoId,cue.index].join(":");
    if(state.encounterCaptureKeys.has(key)) return;
    state.encounterCaptureKeys.add(key);

    const snapshot=currentYouTubeEncounter(surfaceForm);
    if(!snapshot){
      state.encounterCaptureKeys.delete(key);
      return;
    }

    captureCurrentEncounter(item.id,surfaceForm,snapshot).catch(()=>{
      state.encounterCaptureKeys.delete(key);
    });
  }

  async function removeLearningItem(kind,key){
    const wanted=learningKey(kind,key);
    const item=state.learningItems.find(existing=>learningKey(existing.kind,existing.key)===wanted);
    if(!item?.id) return;
    const apiBase=await platformApiBase();
    const response=await fetch(apiBase+"/api/v1/learning-items/"+encodeURIComponent(item.id),{method:"DELETE"});
    if(!response.ok && response.status!==404) throw new Error("Platform API learning item "+response.status);
    await loadLearningItems();
  }

  function renderCard(data, tokenIndex, anchor){
    cancelTooltipHide();
    const h=data.hover?.[String(tokenIndex)]||data.hover?.[tokenIndex]||{};
    const expressions=h.primary_expressions||[];
    const expr=expressions[0];
    const lexical=h.lexical_form;
    const notes=h.usage_notes||[];
    const dictionaryMeanings=h.dictionary_meanings_tr||[];
    const sourceToken=(data.tokens||[]).find(token=>token.i===tokenIndex);
    const lemma=sourceToken?.lemma||sourceToken?.text||"";

    const primaryLabel=expr ? expr.canonical : lemma;
    const primaryType=expr ? expressionTypeLabel(expr.type) : posLabel(sourceToken?.pos);
    const primaryMeaning=expr
      ? (expr.contextual_meaning_tr||(expr.meaning_tr||[])[0]||h.contextual_word_meaning_tr||"")
      : (h.contextual_word_meaning_tr||dictionaryMeanings[0]||"");

    const header=primaryLabel
      ? `<div class="gle-hover-head"><b>${esc(primaryLabel)}</b><span>${esc(primaryType)}</span></div>`
      : "";
    const contextual=primaryMeaning
      ? `<div class="gle-context gle-context-primary"><b>Bu cümlede:</b> ${esc(primaryMeaning)}</div>`
      : "";

    const usage=notes.filter(note=>note.kind!=="GRAMMAR_ROLE")
      .map(note=>`<div class="gle-note"><b>${esc(note.label)}</b> · ${esc(note.explanation_tr)}</div>`)
      .join("");

    const grammarHint=expr?.grammar_hint
      ? `<div class="gle-note"><b>Yapı:</b> ${esc(expr.grammar_hint)}</div>`
      : "";
    const noun=lexical?.article
      ? `<div class="gle-lexical"><b>${esc(lexical.article)} ${esc(lexical.singular)}</b> · die ${esc(lexical.plural)}</div>`
      : "";
    const standalone=expr && dictionaryMeanings.length
      ? `<div class="gle-standalone"><b>${esc(lemma)} tek başına:</b> ${esc(dictionaryMeanings.join(", "))}</div>`
      : "";
    const dictionary=!expr && dictionaryMeanings.length>1
      ? `<details><summary>Diğer sözlük anlamları</summary><div>${esc(dictionaryMeanings.join(", "))}</div></details>`
      : "";

    const learnTarget=expr ? {
      kind:"expression",
      key:expr.pattern_id||expr.canonical,
      label:expr.canonical,
      meaning:primaryMeaning,
      surface:expr.surface||primaryLabel,
    } : {
      kind:"word",
      key:lemma,
      label:lemma,
      meaning:primaryMeaning,
      surface:sourceToken?.text||lemma,
    };
    const encounterSnapshot=currentYouTubeEncounter(learnTarget.surface);
    const learning=learnTarget.key && isLearning(learnTarget.kind,learnTarget.key);
    const learnAction=learnTarget.key
      ? `<div class="gle-learn-actions"><button type="button" class="gle-learn-button gle-learn-toggle" title="${learning?"Öğreniyorum listesinden kaldır":"Öğreniyorum listesine ekle"}" aria-label="${learning?"Öğreniyorum listesinden kaldır":"Öğreniyorum listesine ekle"}" data-kind="${escAttr(learnTarget.kind)}" data-key="${escAttr(learnTarget.key)}" data-label="${escAttr(learnTarget.label)}" data-meaning="${escAttr(learnTarget.meaning)}" data-surface="${escAttr(learnTarget.surface)}">${learning?"★":"☆"} <span>Öğren</span></button></div>`
      : "";

    state.tooltip.innerHTML=header+contextual+grammarHint+noun+standalone+usage+dictionary+learnAction || "<div>Henüz analiz yok.</div>";
    const learnButton=state.tooltip.querySelector(".gle-learn-toggle");
    if(learnButton){
      learnButton.addEventListener("click",async()=>{
        const kind=learnButton.dataset.kind;
        const key=learnButton.dataset.key;
        const id=learningKey(kind,key);
        const existing=state.learningItems.some(item=>learningKey(item.kind,item.key)===id);
        learnButton.disabled=true;
        try{
          if(existing){
            await removeLearningItem(kind,key);
            learnButton.innerHTML="☆ <span>Öğren</span>";
            learnButton.title="Öğreniyorum listesine ekle";
            learnButton.setAttribute("aria-label","Öğreniyorum listesine ekle");
          }else{
            await saveLearningItem({
              kind,
              key,
              label:learnButton.dataset.label,
              meaning_tr:learnButton.dataset.meaning,
              surface:learnButton.dataset.surface,
            },encounterSnapshot);
            learnButton.innerHTML="★ <span>Öğren</span>";
            learnButton.title="Öğreniyorum listesinden kaldır";
            learnButton.setAttribute("aria-label","Öğreniyorum listesinden kaldır");
          }
        }catch(error){
          console.warn("Learning item sync failed",error);
        }finally{
          learnButton.disabled=false;
        }
      });
    }

    const r=anchor.getBoundingClientRect();
    state.tooltip.hidden=false;
    state.tooltip.style.left=Math.min(window.innerWidth-370,Math.max(8,r.left))+"px";
    state.tooltip.style.top=Math.max(8,r.top-state.tooltip.offsetHeight-10)+"px";
  }

  async function analyze(text){
    if(state.cache.has(text)) return state.cache.get(text);
    if(state.analysisInflight.has(text)) return state.analysisInflight.get(text);

    const request=(async()=>{
      const {platformApiUrl="http://127.0.0.1:8000"}=await chrome.storage.sync.get("platformApiUrl");
      const response=await fetch(platformApiUrl.replace(/\/$/,"")+"/api/v1/analyze",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          source_language:"de",
          target_language:"tr",
          text
        })
      });
      if(!response.ok) throw new Error("Platform API "+response.status);
      const payload=await response.json();
      const data=payload.analysis;
      if(!data) throw new Error("Platform API response missing analysis");
      state.cache.set(text,data);
      return data;
    })();

    state.analysisInflight.set(text,request);
    try{
      return await request;
    }finally{
      if(state.analysisInflight.get(text)===request) state.analysisInflight.delete(text);
    }
  }

  function cleanTranslationText(text){
    return String(text||"")
      .replace(/\b([\p{L}\p{N}]+)(?:\s+\1){2,}\b/giu,"$1")
      .replace(/\s+/g," ")
      .trim();
  }

  function applySentenceTranslation(node,text,data){
    node.querySelector(".gle-subtitle-translation")?.remove();
    if(!state.settings.showSentenceTranslation) return;
    if(!data?.sentence_meaning_tr || node.dataset.gleText!==text) return;
    const translation=cleanTranslationText(data.sentence_meaning_tr);
    if(!translation) return;
    const line=document.createElement("span");
    line.className="gle-subtitle-translation";
    line.textContent=translation;
    node.appendChild(line);
  }

  async function renderSentenceTranslation(node,text,translationText=text){
    if(!state.settings.showSentenceTranslation) {
      node.querySelector(".gle-subtitle-translation")?.remove();
      return;
    }
    try{
      const data=await analyze(translationText);
      applySentenceTranslation(node,text,data);
    }catch(_error){}
  }

  function shouldInsertSpace(token,next){
    if(!next) return false;
    if(next.pos==="PUNCT" && /^[,.;:!?…\)\]\}»”’]$/u.test(next.text)) return false;
    if(token.pos==="PUNCT" && /^[\(\[\{«„“]$/u.test(token.text)) return false;
    return true;
  }

  function normalizedTokenText(token){
    return String(token?.text||"").toLocaleLowerCase("de-DE");
  }

  function findTokenSequenceOffset(contextTokens,currentTokens){
    if(!contextTokens?.length || !currentTokens?.length || currentTokens.length>contextTokens.length) return -1;
    outer:
    for(let start=0;start<=contextTokens.length-currentTokens.length;start++){
      for(let i=0;i<currentTokens.length;i++){
        if(normalizedTokenText(contextTokens[start+i])!==normalizedTokenText(currentTokens[i])) continue outer;
      }
      return start;
    }
    return -1;
  }

  function renderAnalyzedTokens(node,text,data,hoverData=data){
    if(node.dataset.gleText!==text) return;
    const translationNode=node.querySelector(".gle-subtitle-translation");
    node.textContent="";
    const tokens=data.tokens||[];
    const hoverTokens=hoverData.tokens||[];
    const hoverOffset=hoverData===data ? 0 : findTokenSequenceOffset(hoverTokens,tokens);
    const mappedTokens=tokens.map((token,i)=>hoverOffset>=0 ? hoverTokens[hoverOffset+i] : token);

    const learningWordLabels=new Map();
    for(const item of state.learningItems){
      if(item.kind!=="word") continue;
      tokens.forEach((token,i)=>{
        if(String(token.lemma||"").toLocaleLowerCase("de-DE")===String(item.key||"").toLocaleLowerCase("de-DE")){
          const mapped=mappedTokens[i]||token;
          const currentHover=hoverData.hover?.[String(mapped.i)]||hoverData.hover?.[mapped.i]||{};
          learningWordLabels.set(i,{
            ...item,
            meaning_tr:currentHover.contextual_word_meaning_tr||item.meaning_tr,
          });
        }
      });
    }

    for(const token of tokens){
      const lemma=String(token.lemma||"").toLocaleLowerCase("de-DE");
      if(!state.youtube.videoUnknownLemmas.has(lemma)) continue;
      const i=tokens.indexOf(token);
      const mapped=mappedTokens[i]||token;
      const currentHover=hoverData.hover?.[String(mapped.i)]||hoverData.hover?.[mapped.i]||{};
      const meaning=currentHover.contextual_word_meaning_tr||(currentHover.dictionary_meanings_tr||[])[0]||"";
      learningWordLabels.set(i,{
        id:null,
        kind:"video-unknown",
        key:lemma,
        label:lemma,
        meaning_tr:meaning,
      });
    }

    const seenLearningItems=new Map();
    for(const [index,item] of learningWordLabels){
      const token=tokens[index];
      if(item?.id && token?.text) seenLearningItems.set(item.id,{item,surface:token.text});
    }

    const expressionMembers=new Map();
    const expressionBadges=new Map();
    const expressions=hoverData.expressions||[];
    for(const item of state.learningItems){
      if(item.kind!=="expression") continue;
      const match=expressions.find(expr=>
        String(expr.pattern_id||expr.canonical||"").toLocaleLowerCase("de-DE")===
        String(item.key||"").toLocaleLowerCase("de-DE")
      );
      if(!match) continue;
      const visible=[];
      mappedTokens.forEach((mapped,i)=>{
        if(mapped && match.token_indices?.includes(mapped.i)){
          const currentItem={
            ...item,
            meaning_tr:match.contextual_meaning_tr||(match.meaning_tr||[])[0]||item.meaning_tr,
          };
          expressionMembers.set(i,currentItem);
          visible.push(i);
        }
      });
      if(visible.length) {
        const currentItem=expressionMembers.get(visible[0])||item;
        expressionBadges.set(visible[0],currentItem);
        if(currentItem?.id) {
          const surface=visible.map(index=>tokens[index]?.text).filter(Boolean).join(" ");
          seenLearningItems.set(currentItem.id,{item:currentItem,surface:surface||currentItem.label});
        }
      }
    }

    for(const {item,surface} of seenLearningItems.values()){
      captureSeenLearningItem(item,surface);
    }

    tokens.forEach((token,i)=>{
      const span=document.createElement("span");
      span.textContent=token.text;
      span.className=token.pos==="PUNCT"?"gle-punct":"gle-word";
      span.dataset.gleIndex=token.i;
      const learningItem=expressionMembers.get(i)||learningWordLabels.get(i);
      if(learningItem){
        span.classList.add("gle-learning-item");
        if(learningItem.kind==="video-unknown") span.classList.add("gle-video-unknown-item");
      }
      const badgeItem=expressionBadges.get(i)||learningWordLabels.get(i);
      if(badgeItem){
        span.dataset.gleLearningLabel=`${badgeItem.label} → ${badgeItem.meaning_tr||""}`;
      }
      if(span.classList.contains("gle-word")){
        const mappedToken=mappedTokens[i]||token;
        span.addEventListener("mouseenter",()=>{
          cancelTooltipHide();
          renderCard(
            hoverOffset>=0 ? hoverData : data,
            mappedToken?.i ?? token.i,
            span
          );
        });
        span.addEventListener("mouseleave",()=>scheduleTooltipHide(260));
      }
      node.appendChild(span);
      if(shouldInsertSpace(token,tokens[i+1])) node.append(" ");
    });
    if(translationNode) node.appendChild(translationNode);
  }

  function renderFallbackTokens(node,text){
    node.textContent="";
    const parts=tokenize(text);
    parts.forEach((part,i)=>{
      const span=document.createElement("span");
      span.textContent=part;
      span.className=/^[\p{L}\p{M}]/u.test(part)?"gle-word":"gle-punct";
      node.appendChild(span);
      if(i<parts.length-1) node.append(" ");
    });
  }

  async function decorate(node,text,translationText=text,hoverContextText=text){
    if(node.dataset.gleText===text) return;
    node.dataset.gleText=text;
    renderFallbackTokens(node,text);

    const translationPromise=state.settings.showSentenceTranslation
      ? analyze(translationText).catch(()=>null)
      : Promise.resolve(null);

    translationPromise.then(data=>{
      if(data) applySentenceTranslation(node,text,data);
    });

    try{
      const [data,hoverData]=await Promise.all([
        analyze(text),
        hoverContextText===text ? Promise.resolve(null) : analyze(hoverContextText),
      ]);
      if(node.dataset.gleText!==text) return;
      renderAnalyzedTokens(node,text,data,hoverData||data);

      const translationData=await translationPromise;
      if(translationData) applySentenceTranslation(node,text,translationData);
    }catch(_error){}
  }

  function sourceText(node){
    return node.dataset.gleSource || node.dataset.gleText || (node.innerText||node.textContent||"").trim();
  }

  function clamp(value,min,max){
    return Math.min(max,Math.max(min,value));
  }

  function applyYouTubeAppearance(){
    const overlay=state.youtube.overlay;
    const germanLine=state.youtube.germanLine;
    if(!overlay || !germanLine) return;
    overlay.style.setProperty("--gle-german-font-scale",(state.settings.germanFontSize/100).toFixed(2));
    overlay.style.setProperty("--gle-translation-font-scale",(state.settings.translationFontSize/100).toFixed(2));
    overlay.style.top=clamp(Number(state.settings.youtubeSubtitlePositionY)||82,8,92)+"%";
  }

  function installYouTubeDragHandle(player,overlay,handle){
    handle.addEventListener("pointerdown",event=>{
      if(event.button!==0) return;
      event.preventDefault();
      event.stopPropagation();

      const rect=player.getBoundingClientRect();
      if(!rect.height) return;

      const startY=event.clientY;
      const startPosition=clamp(Number(state.settings.youtubeSubtitlePositionY)||82,8,92);
      handle.setPointerCapture?.(event.pointerId);
      overlay.classList.add("gle-dragging");

      const onMove=moveEvent=>{
        const next=clamp(startPosition+((moveEvent.clientY-startY)/rect.height)*100,8,92);
        state.settings.youtubeSubtitlePositionY=next;
        overlay.style.top=next+"%";
      };

      const finish=()=>{
        handle.removeEventListener("pointermove",onMove);
        handle.removeEventListener("pointerup",finish);
        handle.removeEventListener("pointercancel",finish);
        overlay.classList.remove("gle-dragging");
        chrome.storage.sync.set({youtubeSubtitlePositionY:state.settings.youtubeSubtitlePositionY});
      };

      handle.addEventListener("pointermove",onMove);
      handle.addEventListener("pointerup",finish);
      handle.addEventListener("pointercancel",finish);
    });
  }

  function ensureYouTubeOverlay(){
    const player=document.querySelector(".html5-video-player");
    if(!player) return null;

    let overlay=player.querySelector(".gle-youtube-overlay");
    if(!overlay){
      overlay=document.createElement("div");
      overlay.className="gle-youtube-overlay";
      overlay.hidden=true;

      const handle=document.createElement("button");
      handle.type="button";
      handle.className="gle-youtube-drag-handle";
      handle.textContent="↕";
      handle.title="Altyazıyı yukarı/aşağı taşı";
      handle.setAttribute("aria-label","Altyazıyı yukarı veya aşağı taşı");
      overlay.appendChild(handle);

      const germanLine=document.createElement("div");
      germanLine.className="gle-youtube-german";
      overlay.appendChild(germanLine);
      player.appendChild(overlay);
      installYouTubeDragHandle(player,overlay,handle);
    }

    state.youtube.overlay=overlay;
    state.youtube.germanLine=overlay.querySelector(".gle-youtube-german");
    applyYouTubeAppearance();
    return {player,overlay,germanLine:state.youtube.germanLine};
  }

  function setYouTubeCustomActive(active){
    const player=document.querySelector(".html5-video-player");
    if(player) player.classList.toggle("gle-custom-captions-active",Boolean(active));
  }

  function showYouTubeText(text,translationText=text,hoverContextText=text){
    const ui=ensureYouTubeOverlay();
    if(!ui || !text) return;
    clearTimeout(state.youtube.hideTimer);
    state.youtube.hideTimer=null;
    setYouTubeCustomActive(true);
    ui.overlay.hidden=false;
    decorate(ui.germanLine,text,translationText,hoverContextText);
  }

  function hideYouTubeOverlay(){
    if(state.youtube.overlay) state.youtube.overlay.hidden=true;
    setYouTubeCustomActive(false);
  }

  function resetYouTube(videoId=""){
    clearTimeout(state.youtube.domTimer);
    clearTimeout(state.youtube.hideTimer);
    state.youtube.domTimer=null;
    state.youtube.hideTimer=null;
    state.youtube.videoId=videoId;
    state.youtube.cues=null;
    state.youtube.cueIndex=-1;
    state.youtube.timedAvailable=false;
    state.youtube.domPending="";
    state.youtube.domStable="";
    state.youtube.domLastChange=0;
    state.youtube.domFirstSeen=0;
    state.youtube.transcriptAnalysis=null;
    state.youtube.transcriptAnalysisVideoId="";
    state.youtube.transcriptAnalysisRun+=1;
    state.youtube.transcriptAnalysisPromise=null;
    state.youtube.expressionGroupsAnalysis=null;
    state.youtube.expressionGroupsVideoId="";
    state.youtube.expressionGroupsPromise=null;
    state.youtube.panelSelectedLemma="";
    state.youtube.panelSelectedGroupKey="";
    state.youtube.wordsView="overview";
    state.youtube.wordsSearch="";
    state.youtube.videoUnknownLemmas=new Set();
    stopYouTubePreview();
    hideYouTubeOverlay();
    if(state.youtube.panel) renderYouTubeSidePanel();
  }

  function currentYouTubeVideoId(){
    try{
      return new URL(location.href).searchParams.get("v") || "";
    }catch(_error){
      return "";
    }
  }

  function currentYouTubeTitle(){
    const heading=document.querySelector("ytd-watch-metadata h1 yt-formatted-string");
    const headingText=(heading?.textContent||"").trim();
    if(headingText) return headingText;

    const metaTitle=document.querySelector('meta[itemprop="name"]')?.getAttribute("content")
      || document.querySelector('meta[name="title"]')?.getAttribute("content");
    if(metaTitle?.trim()) return metaTitle.trim();

    return document.title.replace(/\s*-\s*YouTube\s*$/u,"").trim()||null;
  }


  function panelClock(ms){
    const total=Math.max(0,Math.floor((Number(ms)||0)/1000));
    return Math.floor(total/60)+":"+String(total%60).padStart(2,"0");
  }

  function contextualCueWindow(index,minMs=5000,maxMs=10000){
    const cues=state.youtube.cues||[];
    if(!cues[index]) return null;
    let left=index;
    let right=index;
    while(cues[right].endMs-cues[left].startMs<minMs){
      const options=[];
      if(left>0){
        const span=cues[right].endMs-cues[left-1].startMs;
        if(span<=maxMs) options.push({span,left:left-1,right});
      }
      if(right+1<cues.length){
        const span=cues[right+1].endMs-cues[left].startMs;
        if(span<=maxMs) options.push({span,left,right:right+1});
      }
      if(!options.length) break;
      options.sort((a,b)=>a.span-b.span);
      left=options[0].left;
      right=options[0].right;
    }
    return {startMs:cues[left].startMs,endMs:cues[right].endMs};
  }

  function stopYouTubePreview(){
    if(state.youtube.previewTimer!==null){
      clearInterval(state.youtube.previewTimer);
      state.youtube.previewTimer=null;
    }
  }

  function playYouTubeCue(index){
    const video=bindYouTubeVideo();
    const range=contextualCueWindow(index);
    if(!video || !range) return;
    stopYouTubePreview();
    video.currentTime=Math.max(0,range.startMs/1000);
    video.play().catch(()=>{});
    state.youtube.previewTimer=setInterval(()=>{
      if(video.currentTime*1000>=range.endMs-100){
        stopYouTubePreview();
        video.pause();
        video.currentTime=Math.max(range.startMs/1000,(range.endMs-120)/1000);
      }
    },80);
  }

  function setYouTubePanelCollapsed(collapsed){
    state.youtube.panelCollapsed=Boolean(collapsed);
    const panel=state.youtube.panel;
    if(!panel) return;
    panel.classList.toggle("collapsed",state.youtube.panelCollapsed);
    const toggle=panel.querySelector(".gle-panel-toggle");
    if(toggle){
      toggle.textContent=state.youtube.panelCollapsed?"‹":"›";
      toggle.title=state.youtube.panelCollapsed?"Paneli aç":"Paneli küçült";
      toggle.setAttribute("aria-label",toggle.title);
    }
    syncYouTubePanelHost();
  }

  function syncYouTubePanelHost(){
    const panel=state.youtube.panel;
    const player=document.querySelector(".html5-video-player");
    if(!panel || !player) return;

    const flexy=document.querySelector("ytd-watch-flexy");
    const fullscreen=Boolean(document.fullscreenElement) || player.classList.contains("ytp-fullscreen");
    const theater=Boolean(flexy?.hasAttribute("theater")) && player.getBoundingClientRect().width>=900;
    const shouldDock=fullscreen || theater;

    if(shouldDock && panel.parentElement!==player){
      player.appendChild(panel);
    }else if(!shouldDock && panel.parentElement!==document.documentElement){
      document.documentElement.appendChild(panel);
    }

    state.youtube.panelDocked=shouldDock;
    panel.classList.toggle("docked",shouldDock);
    player.classList.toggle("gle-panel-docked",shouldDock && !state.youtube.panelCollapsed);
    player.classList.toggle("gle-panel-docked-collapsed",shouldDock && state.youtube.panelCollapsed);

    if(shouldDock && !state.youtube.panelCollapsed){
      const width=player.getBoundingClientRect().width || 1;
      const panelWidth=Math.min(420,width*0.35);
      const scale=Math.max(0.55,(width-panelWidth)/width);
      player.style.setProperty("--gle-video-scale",String(scale));
      player.style.setProperty("--gle-panel-width",panelWidth+"px");
    }else{
      player.style.removeProperty("--gle-video-scale");
      player.style.removeProperty("--gle-panel-width");
    }
  }

  function ensureYouTubeSidePanel(){
    if(adapter.id!=="youtube") return null;
    if(state.youtube.panel?.isConnected){
      syncYouTubePanelHost();
      return state.youtube.panel;
    }

    const panel=document.createElement("aside");
    panel.id="gle-youtube-panel";
    panel.innerHTML='<div class="gle-panel-head"><div class="gle-panel-tabs"><button type="button" data-tab="subtitles">Altyazılar</button><button type="button" data-tab="words">Kelimeler</button><button type="button" data-tab="saved">Kaydedilenler</button></div><button type="button" class="gle-panel-toggle" aria-label="Paneli küçült" title="Paneli küçült">›</button></div><div class="gle-panel-body"></div>';

    panel.querySelector(".gle-panel-toggle").addEventListener("click",()=>{
      setYouTubePanelCollapsed(!state.youtube.panelCollapsed);
    });

    panel.querySelectorAll("[data-tab]").forEach(button=>{
      button.addEventListener("click",()=>{
        state.youtube.panelTab=button.dataset.tab;
        state.youtube.panelSelectedLemma="";
        state.youtube.panelSelectedGroupKey="";
        renderYouTubeSidePanel();
      });
    });

    document.documentElement.appendChild(panel);
    state.youtube.panel=panel;
    setYouTubePanelCollapsed(state.youtube.panelCollapsed);
    syncYouTubePanelHost();
    return panel;
  }

  function updatePanelActiveCue(){
    const panel=state.youtube.panel;
    if(!panel || state.youtube.panelCollapsed || state.youtube.panelTab!=="subtitles") return;
    panel.querySelectorAll(".gle-transcript-row.active").forEach(row=>row.classList.remove("active"));
    const active=panel.querySelector('[data-cue-index="'+state.youtube.cueIndex+'"]');
    if(active){
      active.classList.add("active");
      active.scrollIntoView({block:"nearest"});
    }
  }

  function learningItemForLemma(lemma){
    return state.learningItems.find(item=>
      item.kind==="word" &&
      String(item.key||"").toLocaleLowerCase("de-DE")===String(lemma||"").toLocaleLowerCase("de-DE")
    );
  }

  function videoUnknownStorageKey(videoId=state.youtube.videoId){
    return "gleVideoUnknown:"+String(videoId||"");
  }

  async function loadVideoUnknownLemmas(){
    const key=videoUnknownStorageKey();
    if(!state.youtube.videoId){
      state.youtube.videoUnknownLemmas=new Set();
      return;
    }
    const stored=await chrome.storage.local.get(key);
    state.youtube.videoUnknownLemmas=new Set(Array.isArray(stored[key])?stored[key]:[]);
  }

  async function toggleVideoUnknownLemma(lemma){
    const normalized=String(lemma||"").toLocaleLowerCase("de-DE");
    if(!normalized) return;
    if(state.youtube.videoUnknownLemmas.has(normalized)) state.youtube.videoUnknownLemmas.delete(normalized);
    else state.youtube.videoUnknownLemmas.add(normalized);
    await chrome.storage.local.set({[videoUnknownStorageKey()]:[...state.youtube.videoUnknownLemmas]});
    refreshLearningHighlights();
    renderYouTubeSidePanel();
  }

  function expressionGroupsCacheKey(){
    const cues=state.youtube.cues||[];
    const first=cues[0];
    const last=cues[cues.length-1];
    return "gleExpressionGroups:v1:"+state.youtube.videoId+":"+cues.length+":"+Math.round(first?.startMs||0)+":"+Math.round(last?.endMs||0);
  }

  async function analyzeWholeYouTubeExpressionGroups(){
    const videoId=state.youtube.videoId;
    const cues=state.youtube.cues||[];
    if(!videoId || !cues.length) return;
    if(state.youtube.expressionGroupsVideoId===videoId && state.youtube.expressionGroupsAnalysis) return;
    if(state.youtube.expressionGroupsVideoId===videoId && state.youtube.expressionGroupsPromise) return state.youtube.expressionGroupsPromise;

    state.youtube.expressionGroupsVideoId=videoId;
    const task=(async()=>{
      const cacheKey=expressionGroupsCacheKey();
      try{
        const cached=await chrome.storage.local.get(cacheKey);
        if(Array.isArray(cached[cacheKey])){
          state.youtube.expressionGroupsAnalysis=cached[cacheKey];
          if(state.youtube.panelTab==="words") renderYouTubeSidePanel();
          return;
        }
      }catch(_error){}

      try{
        const apiBase=await platformApiBase();
        const items=[];
        const batchSize=120;
        for(let offset=0;offset<cues.length;offset+=batchSize){
          const chunk=cues.slice(offset,offset+batchSize);
          const response=await fetch(apiBase+"/api/v1/expression-groups-batch",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({source_language:"de",texts:chunk.map(cue=>cue.text)}),
          });
          if(!response.ok) throw new Error("expression group analysis "+response.status);
          const payload=await response.json();
          (payload.items||[]).forEach((item,index)=>items.push({item,cueIndex:offset+index}));
        }

        const grouped=new Map();
        for(const {item,cueIndex} of items){
          for(const expression of item.expressions||[]){
            const key=String(expression.type||"")+"|"+String(expression.pattern_id||expression.canonical||"");
            let entry=grouped.get(key);
            if(!entry){
              entry={
                key,
                type:String(expression.type||""),
                patternId:String(expression.pattern_id||""),
                canonical:String(expression.canonical||expression.surface||""),
                count:0,
                forms:new Set(),
                occurrences:[],
              };
              grouped.set(key,entry);
            }
            entry.count+=1;
            if(expression.surface) entry.forms.add(String(expression.surface));
            if(!entry.occurrences.includes(cueIndex)) entry.occurrences.push(cueIndex);
          }
        }

        const analysis=[...grouped.values()]
          .map(entry=>({...entry,forms:[...entry.forms]}))
          .sort((a,b)=>b.count-a.count || a.canonical.localeCompare(b.canonical,"de"));
        state.youtube.expressionGroupsAnalysis=analysis;
        chrome.storage.local.set({[cacheKey]:analysis}).catch(()=>{});
        if(state.youtube.panelTab==="words") renderYouTubeSidePanel();
      }catch(error){
        console.warn("Video expression group analysis failed",error);
        state.youtube.expressionGroupsAnalysis=[];
        if(state.youtube.panelTab==="words") renderYouTubeSidePanel();
      }finally{
        state.youtube.expressionGroupsPromise=null;
      }
    })();

    state.youtube.expressionGroupsPromise=task;
    return task;
  }

  function transcriptAnalysisCacheKey(){
    const cues=state.youtube.cues||[];
    const first=cues[0];
    const last=cues[cues.length-1];
    return "gleTranscriptAnalysis:v2:"+state.youtube.videoId+":"+cues.length+":"+Math.round(first?.startMs||0)+":"+Math.round(last?.endMs||0);
  }

  async function analyzeWholeYouTubeTranscript(){
    const videoId=state.youtube.videoId;
    const cues=state.youtube.cues||[];
    if(!videoId || !cues.length) return;
    if(state.youtube.transcriptAnalysisVideoId===videoId && state.youtube.transcriptAnalysis) return;
    if(state.youtube.transcriptAnalysisVideoId===videoId && state.youtube.transcriptAnalysisPromise){
      return state.youtube.transcriptAnalysisPromise;
    }

    const run=++state.youtube.transcriptAnalysisRun;
    state.youtube.transcriptAnalysisVideoId=videoId;
    state.youtube.transcriptAnalysis=null;

    const task=(async()=>{
      const cacheKey=transcriptAnalysisCacheKey();
      try{
        const cached=await chrome.storage.local.get(cacheKey);
        if(run!==state.youtube.transcriptAnalysisRun) return;
        if(Array.isArray(cached[cacheKey])){
          state.youtube.transcriptAnalysis=cached[cacheKey];
          analyzeWholeYouTubeExpressionGroups();
          if(state.youtube.panel) renderYouTubeSidePanel();
          return;
        }
      }catch(_error){}

      try{
        const apiBase=await platformApiBase();
        const batchSize=200;
        const items=[];

        for(let offset=0;offset<cues.length;offset+=batchSize){
          if(run!==state.youtube.transcriptAnalysisRun) return;
          const chunk=cues.slice(offset,offset+batchSize);
          const response=await fetch(apiBase+"/api/v1/tokens-batch",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              source_language:"de",
              texts:chunk.map(cue=>cue.text),
            }),
          });
          if(!response.ok){
            const detail=await response.text().catch(()=>"");
            throw new Error("batch token analysis "+response.status+" "+detail);
          }
          const payload=await response.json();
          items.push(...(payload.items||[]));
        }

        if(run!==state.youtube.transcriptAnalysisRun) return;

        const words=new Map();
        items.forEach((item,index)=>{
          for(const token of item.tokens||[]){
            const pos=String(token.pos||"").toUpperCase();
            if(!token.lemma || ["PUNCT","SPACE","SYM"].includes(pos)) continue;
            const lemma=String(token.lemma).toLocaleLowerCase("de-DE");
            if(!lemma || !/[\p{L}]/u.test(lemma)) continue;
            let entry=words.get(lemma);
            if(!entry){
              entry={lemma,pos,count:0,forms:new Set(),occurrences:[]};
              words.set(lemma,entry);
            }
            entry.count+=1;
            entry.forms.add(String(token.text||lemma));
            if(!entry.occurrences.includes(index)) entry.occurrences.push(index);
          }
        });

        const analysis=[...words.values()]
          .map(entry=>({lemma:entry.lemma,pos:entry.pos,count:entry.count,forms:[...entry.forms],occurrences:entry.occurrences}))
          .sort((a,b)=>b.count-a.count || a.lemma.localeCompare(b.lemma,"de"));

        state.youtube.transcriptAnalysis=analysis;
        chrome.storage.local.set({[cacheKey]:analysis}).catch(()=>{});
        analyzeWholeYouTubeExpressionGroups();
        if(state.youtube.panel) renderYouTubeSidePanel();
      }catch(error){
        console.warn("Video word analysis failed",error);
        if(state.youtube.panel && state.youtube.panelTab==="words"){
          const body=state.youtube.panel.querySelector(".gle-panel-body");
          if(body) body.innerHTML='<div class="gle-panel-empty"><b>Kelime analizi başarısız.</b><span>'+esc(String(error?.message||error))+'</span></div>';
        }
      }finally{
        if(run===state.youtube.transcriptAnalysisRun) state.youtube.transcriptAnalysisPromise=null;
      }
    })();

    state.youtube.transcriptAnalysisPromise=task;
    return task;
  }

  function renderPanelSubtitles(body){
    const cues=state.youtube.cues||[];
    if(!cues.length){
      body.innerHTML='<div class="gle-panel-empty">Altyazı bekleniyor…</div>';
      return;
    }
    const frag=document.createDocumentFragment();
    cues.forEach((cue,index)=>{
      const row=document.createElement("button");
      row.type="button";
      row.className="gle-transcript-row"+(index===state.youtube.cueIndex?" active":"");
      row.dataset.cueIndex=String(index);
      row.innerHTML='<span class="gle-row-time">'+panelClock(cue.startMs)+'</span><span class="gle-row-text">'+esc(cue.text)+'</span><span class="gle-row-play">▶</span>';
      row.addEventListener("click",()=>playYouTubeCue(index));
      frag.appendChild(row);
    });
    body.replaceChildren(frag);
    updatePanelActiveCue();
  }

  function wordGroup(title,entries){
    if(!entries.length) return "";
    const chips=entries.map(entry=>{
      const learning=Boolean(learningItemForLemma(entry.lemma));
      const unknown=state.youtube.videoUnknownLemmas.has(entry.lemma);
      return '<div class="gle-word-chip-wrap'+(unknown?" unknown":"")+'">'+
        '<button type="button" class="gle-word-chip'+(learning?" learning":"")+'" data-lemma="'+escAttr(entry.lemma)+'"><span>'+(learning?"★ ":"")+esc(entry.lemma)+'</span><b>'+entry.count+'×</b></button>'+
        '<button type="button" class="gle-word-mark'+(unknown?" active":"")+'" data-mark-lemma="'+escAttr(entry.lemma)+'" title="'+(unknown?"Altyazıda anlam gösterimini kapat":"Bu kelimenin anlamını altyazıda göster")+'">'+(unknown?"✓":"+")+'</button>'+
      '</div>';
    }).join("");
    return '<section class="gle-word-group"><h3>'+esc(title)+'</h3><div class="gle-word-grid">'+chips+'</div></section>';
  }

  function renderWordDetail(body,entry){
    const learning=learningItemForLemma(entry.lemma);
    const cues=state.youtube.cues||[];
    const rows=entry.occurrences.map(index=>{
      const cue=cues[index];
      if(!cue) return "";
      return '<button type="button" class="gle-word-occurrence" data-cue-index="'+index+'"><span>▶</span><b>'+panelClock(cue.startMs)+'</b><em>'+esc(cue.text)+'</em></button>';
    }).join("");
    body.innerHTML='<div class="gle-word-detail-head"><button type="button" class="gle-word-back">← Kelimeler</button><div><strong>'+esc(entry.lemma)+'</strong><span>'+entry.count+' kez'+(learning?" · ★ Öğreniyorum":"")+'</span></div></div><div class="gle-word-forms">Videodaki biçimler: '+esc(entry.forms.join(", "))+'</div><div class="gle-word-occurrences">'+rows+'</div>';
    body.querySelector(".gle-word-back").addEventListener("click",()=>{
      state.youtube.panelSelectedLemma="";
      renderYouTubeSidePanel();
    });
    body.querySelectorAll(".gle-word-occurrence").forEach(button=>{
      button.addEventListener("click",()=>playYouTubeCue(Number(button.dataset.cueIndex)));
    });
  }

  function expressionGroupLabel(type){
    return ({
      VERB_PREPOSITION:"Fiil + edat",
      REFLEXIVE_VERB:"Refleksif fiiller",
      REFLEXIVE_VERB_PREPOSITION:"Refleksif fiil + edat",
      IDIOM:"Deyimler",
      NOUN_PREPOSITION:"İsim + edat",
      ADJECTIVE_PREPOSITION:"Sıfat + edat",
      NOMEN_VERB:"İsim + fiil birliktelikleri",
      FUNCTION_VERB:"Funktionsverbgefüge",
      PARTICLE_VERB:"Ayrılabilen fiiller",
      COPULAR_CONSTRUCTION:"Kopula kalıpları",
      COLLOCATION:"Kollokasyonlar",
      CONNECTOR:"Bağlaç / bağlantı kalıpları",
      FIXED_CONSTRUCTION:"Sabit kalıplar",
      GRAMMAR_CONSTRUCTION:"Gramer kalıpları",
    })[type] || type;
  }

  function expressionGroupsSection(entries){
    if(entries===null) return '<section class="gle-expression-groups"><h3>Kelime grupları</h3><div class="gle-groups-loading">Kelime grupları analiz ediliyor…</div></section>';
    if(!entries?.length) return '<section class="gle-expression-groups"><h3>Kelime grupları</h3><div class="gle-groups-empty">Bu videoda desteklenen kelime grubu bulunamadı.</div></section>';

    const order=[
      "IDIOM",
      "NOMEN_VERB",
      "FUNCTION_VERB",
      "FIXED_CONSTRUCTION",
      "COLLOCATION",
      "VERB_PREPOSITION",
      "REFLEXIVE_VERB_PREPOSITION",
      "REFLEXIVE_VERB",
      "NOUN_PREPOSITION",
      "ADJECTIVE_PREPOSITION",
      "PARTICLE_VERB",
      "COPULAR_CONSTRUCTION",
      "CONNECTOR",
      "GRAMMAR_CONSTRUCTION",
    ];
    const sections=order.map(type=>{
      const items=entries.filter(entry=>entry.type===type);
      if(!items.length) return "";
      const chips=items.map(entry=>
        '<button type="button" class="gle-expression-chip" data-group-key="'+escAttr(entry.key)+'">'+
          '<span>'+esc(entry.canonical)+'</span><b>'+entry.count+'×</b>'+
        '</button>'
      ).join("");
      return '<div class="gle-expression-subgroup"><h4>'+esc(expressionGroupLabel(type))+'</h4><div class="gle-expression-grid">'+chips+'</div></div>';
    }).join("");

    return '<section class="gle-expression-groups"><h3>Kelime grupları</h3>'+sections+'</section>';
  }

  function renderExpressionGroupDetail(body,entry){
    const cues=state.youtube.cues||[];
    const rows=entry.occurrences.map(index=>{
      const cue=cues[index];
      if(!cue) return "";
      return '<button type="button" class="gle-word-occurrence" data-cue-index="'+index+'"><span>▶</span><b>'+panelClock(cue.startMs)+'</b><em>'+esc(cue.text)+'</em></button>';
    }).join("");

    body.innerHTML='<div class="gle-word-detail-head"><button type="button" class="gle-word-back">← Kelimeler</button><div><strong>'+esc(entry.canonical)+'</strong><span>'+esc(expressionGroupLabel(entry.type))+' · '+entry.count+' kez</span></div></div>'+
      '<div class="gle-word-forms">Videodaki biçimler: '+esc(entry.forms.join(", "))+'</div>'+
      '<div class="gle-word-occurrences">'+rows+'</div>';

    body.querySelector(".gle-word-back").addEventListener("click",()=>{
      state.youtube.panelSelectedGroupKey="";
      renderYouTubeSidePanel();
    });
    body.querySelectorAll(".gle-word-occurrence").forEach(button=>{
      button.addEventListener("click",()=>playYouTubeCue(Number(button.dataset.cueIndex)));
    });
  }

  function wordsToolbar(analysis){
    const q=state.youtube.wordsSearch||"";
    const views=[
      ["overview","Genel"],
      ["alphabetical","A-Z"],
      ["frequency","Sıklık"],
      ["groups","Kelime grupları"],
    ];
    return '<div class="gle-words-tools">'+
      '<div class="gle-words-subtabs">'+views.map(([id,label])=>
        '<button type="button" data-words-view="'+id+'" class="'+(state.youtube.wordsView===id?"active":"")+'">'+label+'</button>'
      ).join("")+'</div>'+
      '<label class="gle-word-search"><span>⌕</span><input type="search" placeholder="Bu videoda kelime ara…" value="'+escAttr(q)+'" aria-label="Bu videoda kelime ara"></label>'+
    '</div>';
  }

  function filterPanelWords(entries){
    const q=String(state.youtube.wordsSearch||"").trim().toLocaleLowerCase("de-DE");
    if(!q) return entries;
    return entries.filter(entry=>
      String(entry.lemma||"").toLocaleLowerCase("de-DE").includes(q) ||
      (entry.forms||[]).some(form=>String(form).toLocaleLowerCase("de-DE").includes(q))
    );
  }

  function alphabeticalWordList(entries){
    const sorted=[...entries].sort((a,b)=>a.lemma.localeCompare(b.lemma,"de"));
    return wordGroup("A-Z",sorted);
  }

  function frequencyWordList(entries){
    const sorted=[...entries].sort((a,b)=>b.count-a.count || a.lemma.localeCompare(b.lemma,"de"));
    return wordGroup("En çok geçenden aza",sorted);
  }

  async function showPanelWordTooltip(button,entry){
    const cueIndex=entry?.occurrences?.[0];
    const cue=(state.youtube.cues||[])[cueIndex];
    if(!cue?.text) return;
    try{
      const data=await analyze(cue.text);
      const token=(data.tokens||[]).find(token=>
        String(token.lemma||"").toLocaleLowerCase("de-DE")===String(entry.lemma||"").toLocaleLowerCase("de-DE")
      );
      if(!token) return;
      renderCard(data,token.i,button);
    }catch(_error){}
  }

  function bindPanelWordControls(body,analysis){
    body.querySelectorAll("[data-words-view]").forEach(button=>{
      button.addEventListener("click",()=>{
        state.youtube.wordsView=button.dataset.wordsView||"overview";
        state.youtube.panelSelectedLemma="";
        state.youtube.panelSelectedGroupKey="";
        renderYouTubeSidePanel();
      });
    });

    const search=body.querySelector(".gle-word-search input");
    if(search){
      search.addEventListener("input",()=>{
        state.youtube.wordsSearch=search.value;
        const cursor=search.selectionStart;
        renderYouTubeSidePanel();
        requestAnimationFrame(()=>{
          const next=state.youtube.panel?.querySelector(".gle-word-search input");
          if(next){
            next.focus();
            try{ next.setSelectionRange(cursor,cursor); }catch(_error){}
          }
        });
      });
    }

    body.querySelectorAll(".gle-word-chip").forEach(button=>{
      const entry=analysis.find(item=>item.lemma===button.dataset.lemma);
      let hoverTimer=null;
      button.addEventListener("mouseenter",()=>{
        hoverTimer=setTimeout(()=>showPanelWordTooltip(button,entry),180);
      });
      button.addEventListener("mouseleave",event=>{
        clearTimeout(hoverTimer);
        const next=event.relatedTarget;
        if(next && state.tooltip?.contains(next)) return;
        scheduleTooltipHide(850);
      });
      button.addEventListener("click",()=>{
        state.youtube.panelSelectedLemma=button.dataset.lemma;
        renderYouTubeSidePanel();
      });
    });

    body.querySelectorAll(".gle-expression-chip").forEach(button=>{
      button.addEventListener("click",()=>{
        state.youtube.panelSelectedGroupKey=button.dataset.groupKey;
        state.youtube.panelSelectedLemma="";
        renderYouTubeSidePanel();
      });
    });

    body.querySelectorAll(".gle-word-mark").forEach(button=>{
      button.addEventListener("click",event=>{
        event.stopPropagation();
        toggleVideoUnknownLemma(button.dataset.markLemma);
      });
    });
  }

  function renderPanelWords(body){
    const analysis=state.youtube.transcriptAnalysis;
    if(!analysis){
      body.innerHTML='<div class="gle-panel-empty"><b>Video kelimeleri analiz ediliyor…</b><span>Altyazıdaki kelimeler lemma bazında gruplanıyor.</span></div>';
      analyzeWholeYouTubeTranscript();
      return;
    }

    if(state.youtube.panelSelectedGroupKey){
      const group=(state.youtube.expressionGroupsAnalysis||[]).find(item=>item.key===state.youtube.panelSelectedGroupKey);
      if(group){
        renderExpressionGroupDetail(body,group);
        return;
      }
      state.youtube.panelSelectedGroupKey="";
    }

    if(state.youtube.panelSelectedLemma){
      const entry=analysis.find(item=>item.lemma===state.youtube.panelSelectedLemma);
      if(entry){
        renderWordDetail(body,entry);
        return;
      }
      state.youtube.panelSelectedLemma="";
    }

    const visible=filterPanelWords(analysis);
    const learning=visible.filter(entry=>learningItemForLemma(entry.lemma));
    const learningSet=new Set(learning.map(entry=>entry.lemma));
    const frequent=visible.filter(entry=>!learningSet.has(entry.lemma) && entry.count>=3);
    const frequentSet=new Set(frequent.map(entry=>entry.lemma));
    const others=visible.filter(entry=>!learningSet.has(entry.lemma) && !frequentSet.has(entry.lemma));

    const groups=state.youtube.expressionGroupsAnalysis;
    let content="";
    if(state.youtube.wordsView==="alphabetical"){
      content=alphabeticalWordList(visible);
    }else if(state.youtube.wordsView==="frequency"){
      content=frequencyWordList(visible);
    }else if(state.youtube.wordsView==="groups"){
      content=expressionGroupsSection(groups);
    }else{
      content=
        expressionGroupsSection(groups)+
        wordGroup("★ Bu videoda geçen öğrendiğim kelimeler",learning)+
        wordGroup("Bu videoda sık geçenler",frequent)+
        wordGroup("Diğer kelimeler",others);
    }

    if(!content){
      content='<div class="gle-panel-empty"><b>Sonuç bulunamadı.</b><span>Arama kelimesini değiştir.</span></div>';
    }

    body.innerHTML='<div class="gle-panel-summary"><strong>'+analysis.length+'</strong><span>farklı lemma</span><strong>'+(state.youtube.cues||[]).length+'</strong><span>altyazı bölümü</span></div>'+
      wordsToolbar(analysis)+content;
    bindPanelWordControls(body,analysis);
  }

  function renderPanelSaved(body){
    const analysis=state.youtube.transcriptAnalysis;
    if(!analysis){
      body.innerHTML='<div class="gle-panel-empty">Kayıtlar hazırlanıyor…</div>';
      analyzeWholeYouTubeTranscript();
      return;
    }
    const present=analysis.map(entry=>({entry,item:learningItemForLemma(entry.lemma)})).filter(value=>value.item);
    if(!present.length){
      body.innerHTML='<div class="gle-panel-empty"><b>Bu videoda öğrenme listenden kelime yok.</b><span>Bir kelimeyi altyazıdan ★ Öğren olarak kaydettiğinde burada görünür.</span></div>';
      return;
    }
    body.innerHTML='<div class="gle-saved-list">'+present.map(({entry,item})=>'<button type="button" class="gle-saved-word" data-lemma="'+escAttr(entry.lemma)+'"><span><strong>★ '+esc(item.label||entry.lemma)+'</strong><small>'+esc(item.meaning_tr||"")+'</small></span><b>'+entry.count+'×</b></button>').join("")+'</div>';
    body.querySelectorAll(".gle-saved-word").forEach(button=>{
      button.addEventListener("click",()=>{
        state.youtube.panelTab="words";
        state.youtube.panelSelectedLemma=button.dataset.lemma;
        renderYouTubeSidePanel();
      });
    });
  }

  function renderYouTubeSidePanel(){
    const panel=ensureYouTubeSidePanel();
    if(!panel) return;
    panel.querySelectorAll("[data-tab]").forEach(button=>button.classList.toggle("active",button.dataset.tab===state.youtube.panelTab));
    const body=panel.querySelector(".gle-panel-body");
    if(state.youtube.panelTab==="words") renderPanelWords(body);
    else if(state.youtube.panelTab==="saved") renderPanelSaved(body);
    else renderPanelSubtitles(body);
  }

  async function indexPreparedCorpusFromYouTube(cues){
    const videoId=state.youtube.videoId || new URL(location.href).searchParams.get("v");
    if(!videoId || state.youtube.corpusIndexing.has(videoId) || !cues?.length) return;

    state.youtube.corpusIndexing.add(videoId);
    try{
      const apiBase=await platformApiBase();
      const targetsResponse=await fetch(apiBase+"/api/v1/example-corpus/index-targets");
      if(!targetsResponse.ok) throw new Error("index targets "+targetsResponse.status);
      const targetsPayload=await targetsResponse.json();
      const targetLemmas=targetsPayload.targets?.[videoId];
      if(!Array.isArray(targetLemmas) || !targetLemmas.length) return;

      const response=await fetch(apiBase+"/api/v1/example-corpus/index-cues",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          provider:"youtube",
          external_id:videoId,
          title:currentYouTubeTitle(),
          url:"https://www.youtube.com/watch?v="+encodeURIComponent(videoId),
          language:"de",
          target_lemmas:targetLemmas,
          cues:cues.map(cue=>({
            start_ms:Math.round(cue.startMs),
            end_ms:Math.round(cue.endMs),
            text:cue.text,
          })),
        }),
      });
      if(!response.ok) throw new Error("corpus index "+response.status);
      const result=await response.json();
      console.info("GLE corpus indexed",videoId,result);
    }catch(error){
      state.youtube.corpusIndexing.delete(videoId);
      console.warn("GLE corpus indexing failed",error);
    }
  }

  async function indexCurrentYouTubeVideo(){
    const cues=state.youtube.cues;
    const videoId=state.youtube.videoId || new URL(location.href).searchParams.get("v");
    if(adapter.id!=="youtube" || !videoId || !cues?.length){
      throw new Error("YouTube altyazısı henüz hazır değil");
    }

    const apiBase=await platformApiBase();
    const response=await fetch(apiBase+"/api/v1/example-corpus/index-video",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        provider:"youtube",
        external_id:videoId,
        title:currentYouTubeTitle(),
        url:"https://www.youtube.com/watch?v="+encodeURIComponent(videoId),
        language:"de",
        index_all:true,
        cues:cues.map(cue=>({
          start_ms:Math.round(cue.startMs),
          end_ms:Math.round(cue.endMs),
          text:cue.text,
        })),
      }),
    });
    if(!response.ok) throw new Error("corpus index "+response.status);
    return response.json();
  }

  chrome.runtime.onMessage.addListener((message,_sender,sendResponse)=>{
    if(message?.type!=="gle-index-current-video") return;
    indexCurrentYouTubeVideo()
      .then(result=>sendResponse({
        ok:true,
        count:result.count||0,
        uniqueLemmas:result.unique_lemmas||0,
      }))
      .catch(error=>sendResponse({ok:false,error:String(error?.message||error)}));
    return true;
  });

  function prefetchYouTubeAnalyses(index,horizon=2){
    const cues=state.youtube.cues;
    if(!cues?.length || index<0) return;

    for(let i=index;i<=Math.min(cues.length-1,index+horizon);i++){
      const text=cues[i]?.text;
      if(text && !state.cache.has(text)) analyze(text).catch(()=>{});

      // Sentence translation is latency-sensitive. Prefetch translation
      // context for the visible cue and a small number of upcoming cues so
      // playback can stay ahead of the subtitle clock. Wide hover context
      // remains lazy to avoid flooding the engine.
      const translationText=globalThis.GLEYoutubeCues.translationTextForCue(cues,i);
      if(translationText && !state.cache.has(translationText)) analyze(translationText).catch(()=>{});
    }
  }

  function renderTimedCue(mediaTime,prefetchHorizon=2){
    const cues=state.youtube.cues;
    if(!cues?.length) return false;

    const video=state.youtube.video || document.querySelector("video.html5-main-video") || document.querySelector("video");
    if(!video) return false;

    const seconds=Number.isFinite(mediaTime)?mediaTime:video.currentTime;
    const cue=globalThis.GLEYoutubeCues.cueAtTime(cues,seconds*1000);

    setYouTubeCustomActive(true);
    if(!cue){
      if(state.youtube.overlay) state.youtube.overlay.hidden=true;
      state.youtube.cueIndex=-1;
      return true;
    }

    prefetchYouTubeAnalyses(cue.index,prefetchHorizon);

    if(state.youtube.cueIndex!==cue.index){
      state.youtube.cueIndex=cue.index;
      const translationText=globalThis.GLEYoutubeCues.translationTextForCue(cues,cue.index);
      const hoverContextText=globalThis.GLEYoutubeCues.hoverTextForCue(cues,cue.index);
      showYouTubeText(cue.text,translationText,hoverContextText);
      updatePanelActiveCue();
    }else if(state.youtube.overlay){
      state.youtube.overlay.hidden=false;
    }
    return true;
  }

  function bindYouTubeVideo(){
    const video=document.querySelector("video.html5-main-video") || document.querySelector("video");
    if(!video || video===state.youtube.video) return video;

    if(state.youtube.video && state.youtube.videoListeners){
      ["timeupdate","seeking","seeked","play","pause","ratechange"].forEach(type=>
        state.youtube.video.removeEventListener(type,state.youtube.videoListeners)
      );
      if(state.youtube.frameId!==null && state.youtube.video.cancelVideoFrameCallback){
        state.youtube.video.cancelVideoFrameCallback(state.youtube.frameId);
      }
    }

    state.youtube.video=video;
    state.youtube.videoListeners=event=>{
      const horizon=event?.type==="seeking" || event?.type==="seeked" ? 5 : 2;
      renderTimedCue(undefined,horizon);
    };
    ["timeupdate","seeking","seeked","play","pause","ratechange"].forEach(type=>
      video.addEventListener(type,state.youtube.videoListeners)
    );

    if(video.requestVideoFrameCallback){
      const onFrame=(_now,metadata)=>{
        if(state.youtube.video!==video) return;
        renderTimedCue(metadata.mediaTime);
        state.youtube.frameId=video.requestVideoFrameCallback(onFrame);
      };
      state.youtube.frameId=video.requestVideoFrameCallback(onFrame);
    }

    return video;
  }

  function receiveYouTubeBridge(event){
    const message=event.data;
    if(event.source!==window || event.origin!==location.origin || message?.source!=="gle-youtube-caption-bridge") return;

    if(message.videoId && message.videoId!==state.youtube.videoId){
      resetYouTube(message.videoId);
    }

    if(message.type==="track-status" && message.enabled===false){
      resetYouTube(message.videoId || state.youtube.videoId);
      return;
    }

    if(message.type!=="track-data" || !message.payload) return;

    try{
      const cues=globalThis.GLEYoutubeCues.parseJson3Cues(message.payload);
      if(!cues.length) return;
      clearTimeout(state.youtube.domTimer);
      state.youtube.domTimer=null;
      state.youtube.cues=cues;
      state.youtube.cueIndex=-1;
      state.youtube.timedAvailable=true;
      indexPreparedCorpusFromYouTube(cues);
      ensureYouTubeSidePanel();
      loadVideoUnknownLemmas().then(()=>{
        renderYouTubeSidePanel();
        refreshLearningHighlights();
      });
      renderYouTubeSidePanel();
      analyzeWholeYouTubeTranscript();
      bindYouTubeVideo();
      const video=state.youtube.video || document.querySelector("video.html5-main-video") || document.querySelector("video");
      const currentCue=video ? globalThis.GLEYoutubeCues.cueAtTime(cues,video.currentTime*1000) : cues[0];
      prefetchYouTubeAnalyses(currentCue?.index ?? 0);
      renderTimedCue();
    }catch(_error){
      state.youtube.timedAvailable=false;
      state.youtube.cues=null;
    }
  }

  function connectYouTubeBridge(){
    window.addEventListener("message",receiveYouTubeBridge);
    window.postMessage({source:"gle-youtube-content",type:"refresh"},location.origin);
  }

  document.addEventListener("yt-navigate-finish",()=>{
    requestAnimationFrame(()=>{
      const videoId=currentYouTubeVideoId();
      if(videoId && videoId!==state.youtube.videoId) resetYouTube(videoId);
      ensureYouTubeSidePanel();
      syncYouTubePanelHost();
      window.postMessage({source:"gle-youtube-content",type:"refresh"},location.origin);
      scanYouTube();
    });
  });

  window.addEventListener("wheel",event=>{
    const panel=state.youtube.panel;
    if(!panel || state.youtube.panelCollapsed || !panel.contains(event.target)) return;
    if(Math.abs(event.deltaX)>Math.abs(event.deltaY)) return;

    const body=panel.querySelector(".gle-panel-body");
    if(!body) return;

    // Capture before YouTube's own page-level wheel handlers. In theater mode
    // YouTube can otherwise scroll the document even though the panel itself
    // is scrollable, pulling recommended videos up behind the player.
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation==="function") event.stopImmediatePropagation();
    body.scrollTop+=event.deltaY;
  },{capture:true,passive:false});

  document.addEventListener("fullscreenchange",()=>requestAnimationFrame(syncYouTubePanelHost));
  window.addEventListener("resize",()=>requestAnimationFrame(syncYouTubePanelHost));

  function collectYouTubeDomText(){
    const containers=[...document.querySelectorAll(".ytp-caption-window-bottom")];
    const entries=containers.map(container=>{
      const parts=[...container.querySelectorAll(".ytp-caption-segment")]
        .map(node=>(node.textContent||"").trim())
        .filter(Boolean);
      const text=globalThis.GLEYoutubeCues.normalizeCueText(parts.join(" "));
      return text;
    }).filter(Boolean);
    return entries[entries.length-1] || "";
  }

  function commitDomPending(){
    const yt=state.youtube;
    yt.domTimer=null;
    if(yt.timedAvailable || !yt.domPending) return;

    const now=Date.now();
    const quietFor=now-yt.domLastChange;
    const totalFor=now-yt.domFirstSeen;
    const complete=globalThis.GLEYoutubeCues.sentenceIsComplete(yt.domPending);
    const wordCount=yt.domPending.split(/\s+/).filter(Boolean).length;

    if(!complete && quietFor<900 && totalFor<2600){
      yt.domTimer=setTimeout(commitDomPending,Math.max(120,900-quietFor));
      return;
    }

    const extendsStable=yt.domStable && yt.domPending.startsWith(yt.domStable) && yt.domPending!==yt.domStable;
    if(extendsStable && !complete && totalFor<2600 && wordCount<14){
      yt.domTimer=setTimeout(commitDomPending,350);
      return;
    }

    yt.domStable=yt.domPending;
    yt.domFirstSeen=0;
    showYouTubeText(yt.domStable);
  }

  function queueDomText(text){
    const yt=state.youtube;
    if(yt.timedAvailable) return;

    const normalized=globalThis.GLEYoutubeCues.normalizeCueText(text);
    if(!normalized || normalized===yt.domPending) return;

    const now=Date.now();
    if(!yt.domFirstSeen) yt.domFirstSeen=now;
    yt.domPending=normalized;
    yt.domLastChange=now;

    clearTimeout(yt.domTimer);
    const complete=globalThis.GLEYoutubeCues.sentenceIsComplete(normalized);
    yt.domTimer=setTimeout(commitDomPending,complete?120:900);
  }

  function scanYouTube(){
    const currentVideoId=currentYouTubeVideoId();
    if(currentVideoId && currentVideoId!==state.youtube.videoId){
      resetYouTube(currentVideoId);
      window.postMessage({source:"gle-youtube-content",type:"refresh"},location.origin);
    }

    ensureYouTubeOverlay();
    ensureYouTubeSidePanel();
    syncYouTubePanelHost();

    if(state.youtube.timedAvailable){
      bindYouTubeVideo();
      renderTimedCue();
      return;
    }

    const text=collectYouTubeDomText();
    if(text){
      clearTimeout(state.youtube.hideTimer);
      state.youtube.hideTimer=null;
      queueDomText(text);
      return;
    }

    if(state.youtube.domStable && state.youtube.hideTimer===null){
      state.youtube.hideTimer=setTimeout(()=>{
        state.youtube.hideTimer=null;
        state.youtube.domStable="";
        state.youtube.domPending="";
        state.youtube.domFirstSeen=0;
        hideYouTubeOverlay();
      },650);
    }
  }

  function scan(){
    if(adapter.id==="youtube"){
      scanYouTube();
      return;
    }

    for(const selector of adapter.selectors){
      document.querySelectorAll(selector).forEach(node=>{
        const text=sourceText(node);
        if(text && text.length<500 && !node.querySelector(".gle-word")) decorate(node,text);
      });
    }
  }

  state.tooltip=createTooltip();

  chrome.storage.sync.get({
    showSentenceTranslation:true,
    germanFontSize:100,
    translationFontSize:100,
    youtubeSubtitlePositionY:82
  },settings=>{
    state.settings=settings;
    scan();
    ensureLearningProfile()
      .then(()=>loadLearningItems())
      .catch(error=>console.warn("Learning state bootstrap failed",error));
  });

  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area!=="sync") return;
    if(changes.showSentenceTranslation) state.settings.showSentenceTranslation=changes.showSentenceTranslation.newValue;
    if(changes.germanFontSize) state.settings.germanFontSize=changes.germanFontSize.newValue;
    if(changes.translationFontSize) state.settings.translationFontSize=changes.translationFontSize.newValue;
    if(changes.youtubeSubtitlePositionY) state.settings.youtubeSubtitlePositionY=changes.youtubeSubtitlePositionY.newValue;
    applyYouTubeAppearance();

    document.querySelectorAll(".gle-subtitle-translation").forEach(el=>el.remove());
    document.querySelectorAll("[data-gle-text]").forEach(node=>{
      if(!state.settings.showSentenceTranslation) return;
      let translationText=node.dataset.gleText;
      if(adapter.id==="youtube" && node===state.youtube.germanLine && state.youtube.cues && state.youtube.cueIndex>=0){
        translationText=globalThis.GLEYoutubeCues.translationTextForCue(state.youtube.cues,state.youtube.cueIndex);
      }
      renderSentenceTranslation(node,node.dataset.gleText,translationText);
    });
  });

  document.addEventListener("mousemove",event=>{
    const overTooltip=state.tooltip?.contains(event.target);
    const overWord=event.target.closest?.(".gle-word");
    if(overTooltip || overWord){
      cancelTooltipHide();
      return;
    }
    scheduleTooltipHide(260);
  });

  if(adapter.id==="youtube") connectYouTubeBridge();

  let scanScheduled=false;
  new MutationObserver(()=>{
    if(scanScheduled) return;
    scanScheduled=true;
    requestAnimationFrame(()=>{
      scanScheduled=false;
      scan();
    });
  }).observe(document.documentElement,{subtree:true,childList:true,characterData:true});

  scan();
})();
