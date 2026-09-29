(() => {
  const ADAPTERS = [
    {id:"youtube", host:/youtube\.com$/, selectors:[".ytp-caption-segment"]},
    {id:"zdf", host:/(^|\.)zdf\.de$/, selectors:["[class*='subtitle']","[class*='caption']","[aria-live='polite']"]},
    {id:"ard", host:/(^|\.)ardmediathek\.de$/, selectors:["[class*='subtitle']","[class*='caption']","[aria-live='polite']"]}
  ];

  const UI_STRINGS = {
    tr:{
      settings:"Ayarlar",close:"Kapat",general:"Genel",interfaceLanguage:"Arayüz dili",theme:"Tema",themeSystem:"Sistem",themeLight:"Açık",themeDark:"Koyu",
      languageLearningActive:"Language Learning aktif",languageLearningActiveHelp:"Video ve panel özelliklerini birlikte açar veya kapatır.",
      translationView:"Çeviri görünümü",videoTranslation:"Video çevirisi",videoTranslationHelp:"Videoda kaynak altyazının altında çeviriyi gösterir.",
      panelTranslation:"Panel çevirisi",panelTranslationHelp:"Altyazılar sekmesindeki satırlarda çeviriyi gösterir.",
      followActiveSubtitle:"Aktif altyazıyı otomatik takip et",followActiveSubtitleHelp:"Video ilerledikçe paneli oynatılan altyazı satırına kaydırır.",
      textSize:"Yazı boyutu",sourceSubtitle:"Kaynak altyazı",translationSubtitle:"Çeviri altyazısı",
      subtitles:"Altyazılar",words:"Kelimeler",saved:"Kaydedilenler",active:"Aktif",inactive:"Pasif",
      translation:"Çeviri",waitingSubtitles:"Altyazı bekleniyor…",openPanel:"Language Learning panelini aç",collapsePanel:"Paneli küçült"
    },
    en:{
      settings:"Settings",close:"Close",general:"General",interfaceLanguage:"Interface language",theme:"Theme",themeSystem:"System",themeLight:"Light",themeDark:"Dark",
      languageLearningActive:"Language Learning active",languageLearningActiveHelp:"Turns the video and panel features on or off together.",
      translationView:"Translation display",videoTranslation:"Video translation",videoTranslationHelp:"Shows the translation below the source subtitle on the video.",
      panelTranslation:"Panel translation",panelTranslationHelp:"Shows translations in subtitle rows inside the panel.",
      followActiveSubtitle:"Follow active subtitle",followActiveSubtitleHelp:"Scrolls the panel to the currently playing subtitle.",
      textSize:"Text size",sourceSubtitle:"Source subtitle",translationSubtitle:"Translation subtitle",
      subtitles:"Subtitles",words:"Words",saved:"Saved",active:"Active",inactive:"Inactive",
      translation:"Translation",waitingSubtitles:"Waiting for subtitles…",openPanel:"Open Language Learning panel",collapsePanel:"Collapse panel"
    },
    de:{
      settings:"Einstellungen",close:"Schließen",general:"Allgemein",interfaceLanguage:"Oberflächensprache",theme:"Design",themeSystem:"System",themeLight:"Hell",themeDark:"Dunkel",
      languageLearningActive:"Language Learning aktiv",languageLearningActiveHelp:"Schaltet Video- und Panel-Funktionen gemeinsam ein oder aus.",
      translationView:"Übersetzungsanzeige",videoTranslation:"Videoübersetzung",videoTranslationHelp:"Zeigt die Übersetzung unter dem Quelluntertitel im Video.",
      panelTranslation:"Panelübersetzung",panelTranslationHelp:"Zeigt Übersetzungen in den Untertitelzeilen des Panels.",
      followActiveSubtitle:"Aktiven Untertitel automatisch verfolgen",followActiveSubtitleHelp:"Scrollt das Panel zum aktuell abgespielten Untertitel.",
      textSize:"Textgröße",sourceSubtitle:"Quelluntertitel",translationSubtitle:"Übersetzungsuntertitel",
      subtitles:"Untertitel",words:"Wörter",saved:"Gespeichert",active:"Aktiv",inactive:"Inaktiv",
      translation:"Übersetzung",waitingSubtitles:"Untertitel werden geladen…",openPanel:"Language-Learning-Panel öffnen",collapsePanel:"Panel einklappen"
    }
  };

  const state = {
    cache:new Map(),
    panelTranslationCache:new Map(),
    analysisInflight:new Map(),
    tooltip:null,
    tooltipHideTimer:null,
    settings:{extensionEnabled:true,showVideoTranslation:true,showPanelTranslation:true,followActiveSubtitle:true,interfaceLanguage:"tr",theme:"dark",panelWidthFactor:1,germanFontSize:100,translationFontSize:100,youtubeSubtitlePositionY:82,zdfSubtitlePositionY:88},
    learningItems:[],
    learningProfileId:null,
    encounterCaptureKeys:new Set(),
    panel:{
      element:null,
      handle:null,
      tab:"subtitles",
      selectedLemma:"",
      selectedGroupKey:"",
      collapsed:false,
      docked:false,
      wordsView:"overview",
      wordsSearch:"",
      senseRows:null,
      senseRowsVideoId:"",
      senseRowsPromise:null,
    },
    youtube:{
      overlay:null,
      germanLine:null,
      video:null,
      frameId:null,
      videoListeners:null,
      videoId:"",
      cues:null,
      cueCache:new Map(),
      cueIndex:-1,
      timedAvailable:false,
      domPending:"",
      domStable:"",
      domLastChange:0,
      domFirstSeen:0,
      domTimer:null,
      hideTimer:null,
      corpusIndexing:new Set(),
      transcriptAnalysis:null,
      transcriptAnalysisVideoId:"",
      transcriptAnalysisRun:0,
      previewTimer:null,
      videoUnknownLemmas:new Set(),
      videoUnknownExpressions:new Set(),
      transcriptAnalysisPromise:null,
      expressionGroupsAnalysis:null,
      expressionGroupsVideoId:"",
      expressionGroupsPromise:null,
    },
    zdf:{videoId:"",video:null,cues:null,cueIndex:-1,overlay:null,germanLine:null,loading:false,loaded:false,error:"",frameId:null,videoListeners:null}
  };

  const adapter=ADAPTERS.find(a=>a.host.test(location.hostname));
  if(!adapter) return;


  function uiText(key){
    const lang=state.settings.interfaceLanguage||"tr";
    return UI_STRINGS[lang]?.[key] || UI_STRINGS.tr[key] || key;
  }

  function updateSharedPanelUi(){
    const panel=state.panel.element;
    if(!panel) return;
    const active=state.settings.extensionEnabled!==false;
    const label=panel.querySelector(".gle-master-switch em");
    if(label) label.textContent=active?uiText("active"):uiText("inactive");
    const settingsButton=panel.querySelector(".gle-header-settings");
    if(settingsButton){
      settingsButton.title=uiText("settings");
      settingsButton.setAttribute("aria-label",uiText("settings"));
    }
    const labels={subtitles:"subtitles",words:"words",saved:"saved"};
    panel.querySelectorAll("[data-tab]").forEach(button=>{
      button.textContent=uiText(labels[button.dataset.tab]||button.dataset.tab);
    });
    if(state.panel.handle){
      state.panel.handle.title=state.panel.collapsed?uiText("openPanel"):uiText("collapsePanel");
      state.panel.handle.setAttribute("aria-label",state.panel.handle.title);
    }
  }

  function applySharedAppearance(){
    const theme=state.settings.theme||"system";
    document.documentElement.dataset.gleTheme=theme;
    document.documentElement.style.setProperty("--gle-german-font-scale",(Number(state.settings.germanFontSize||100)/100).toFixed(2));
    document.documentElement.style.setProperty("--gle-translation-font-scale",(Number(state.settings.translationFontSize||100)/100).toFixed(2));
    document.documentElement.classList.toggle("gle-extension-disabled",state.settings.extensionEnabled===false);
    applyYouTubeAppearance();
  }

  function ensurePlayerControls(){
    // Player controls are integrated into the platform-independent shared panel header.
    return ensureSharedPanel();
  }

  function renderPlayerControls(){
    const panel=state.panel.element;
    if(!panel) return;
    const toggle=panel.querySelector(".gle-header-main-toggle");
    if(toggle){
      const active=state.settings.extensionEnabled!==false;
      toggle.checked=active;
      toggle.closest(".gle-master-switch")?.classList.toggle("is-active",active);
      const label=toggle.closest(".gle-master-switch")?.querySelector("em");
      if(label) label.textContent=active?uiText("active"):uiText("inactive");
    }
    applySharedAppearance();
  }

  function ensureSettingsDialog(){
    let dialog=document.getElementById("gle-settings-dialog");
    if(dialog){ dialog.hidden=false; return dialog; }
    dialog=document.createElement("div");
    dialog.id="gle-settings-dialog";
    dialog.innerHTML='<div class="gle-settings-card" role="dialog" aria-modal="true" aria-labelledby="gle-settings-title"><header><strong id="gle-settings-title">Language Learning · '+esc(uiText("settings"))+'</strong><button type="button" class="gle-settings-close" aria-label="'+escAttr(uiText("close"))+'">×</button></header><div class="gle-settings-body"><section class="gle-settings-section"><h3>'+esc(uiText("general"))+'</h3><label class="gle-settings-select"><span>'+esc(uiText("interfaceLanguage"))+'</span><select name="interfaceLanguage"><option value="tr">Türkçe</option><option value="en">English</option><option value="de">Deutsch</option></select></label><label class="gle-settings-select"><span>'+esc(uiText("theme"))+'</span><select name="theme"><option value="system">'+esc(uiText("themeSystem"))+'</option><option value="light">'+esc(uiText("themeLight"))+'</option><option value="dark">'+esc(uiText("themeDark"))+'</option></select></label><label class="gle-settings-toggle"><span class="gle-settings-copy"><b>'+esc(uiText("languageLearningActive"))+'</b><small>'+esc(uiText("languageLearningActiveHelp"))+'</small></span><input name="extensionEnabled" type="checkbox"><span class="gle-settings-track"></span></label></section><section class="gle-settings-section"><h3>'+esc(uiText("translationView"))+'</h3><label class="gle-settings-toggle"><span class="gle-settings-copy"><b>'+esc(uiText("videoTranslation"))+'</b><small>'+esc(uiText("videoTranslationHelp"))+'</small></span><input name="showVideoTranslation" type="checkbox"><span class="gle-settings-track"></span></label><label class="gle-settings-toggle"><span class="gle-settings-copy"><b>'+esc(uiText("panelTranslation"))+'</b><small>'+esc(uiText("panelTranslationHelp"))+'</small></span><input name="showPanelTranslation" type="checkbox"><span class="gle-settings-track"></span></label><label class="gle-settings-toggle"><span class="gle-settings-copy"><b>'+esc(uiText("followActiveSubtitle"))+'</b><small>'+esc(uiText("followActiveSubtitleHelp"))+'</small></span><input name="followActiveSubtitle" type="checkbox"><span class="gle-settings-track"></span></label></section><section class="gle-settings-section"><h3>'+esc(uiText("textSize"))+'</h3><label>'+esc(uiText("sourceSubtitle"))+' <output data-for="germanFontSize"></output><input name="germanFontSize" type="range" min="70" max="180" step="5"></label><label>'+esc(uiText("translationSubtitle"))+' <output data-for="translationFontSize"></output><input name="translationFontSize" type="range" min="70" max="180" step="5"></label></section></div></div>';
    document.documentElement.appendChild(dialog);
    const sync=()=>{
      for(const name of ["germanFontSize","translationFontSize"]){
        const input=dialog.querySelector('[name="'+name+'"]');
        input.value=state.settings[name];
        dialog.querySelector('[data-for="'+name+'"]').textContent=state.settings[name]+"%";
      }
      dialog.querySelector('[name="interfaceLanguage"]').value=state.settings.interfaceLanguage||"tr";
      dialog.querySelector('[name="theme"]').value=state.settings.theme||"system";
      for(const name of ["extensionEnabled","showVideoTranslation","showPanelTranslation","followActiveSubtitle"]){
        dialog.querySelector('[name="'+name+'"]').checked=state.settings[name]!==false;
      }
    };
    sync();
    dialog.querySelector(".gle-settings-close").addEventListener("click",()=>{dialog.hidden=true;});
    dialog.addEventListener("click",event=>{if(event.target===dialog) dialog.hidden=true;});
    for(const name of ["germanFontSize","translationFontSize"]){
      dialog.querySelector('[name="'+name+'"]').addEventListener("input",async event=>{
        state.settings[name]=Number(event.target.value);
        dialog.querySelector('[data-for="'+name+'"]').textContent=state.settings[name]+"%";
        applySharedAppearance();
        await chrome.storage.sync.set({[name]:state.settings[name]});
      });
    }
    dialog.querySelector('[name="interfaceLanguage"]').addEventListener("change",async event=>{
      state.settings.interfaceLanguage=event.target.value;
      await chrome.storage.sync.set({interfaceLanguage:state.settings.interfaceLanguage});
      updateSharedPanelUi();
      renderSharedPanel();
      dialog.remove();
      ensureSettingsDialog();
    });
    dialog.querySelector('[name="theme"]').addEventListener("change",async event=>{
      state.settings.theme=event.target.value;
      await chrome.storage.sync.set({theme:state.settings.theme});
      applySharedAppearance();
    });
    for(const name of ["extensionEnabled","showVideoTranslation","showPanelTranslation","followActiveSubtitle"]){
      dialog.querySelector('[name="'+name+'"]').addEventListener("change",async event=>{
        state.settings[name]=event.target.checked;
        await chrome.storage.sync.set({[name]:event.target.checked});
        if(name==="extensionEnabled") renderPlayerControls();
        if(name==="showVideoTranslation") refreshVideoTranslations();
        if(name==="showPanelTranslation" && state.panel.tab==="subtitles") renderSharedPanel();
      });
    }
    return dialog;
  }

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
      status:item.status||"learning",
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
    if(adapter.id==="youtube" && state.panel.element && !state.panel.element.hidden){
      renderSharedPanel();
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
    if(!state.settings.showVideoTranslation) return;
    if(!data?.sentence_meaning_tr || node.dataset.gleText!==text) return;
    const translation=cleanTranslationText(data.sentence_meaning_tr);
    if(!translation) return;
    const line=document.createElement("span");
    line.className="gle-subtitle-translation";
    line.textContent=translation;
    node.appendChild(line);
  }

  async function renderSentenceTranslation(node,text,translationText=text){
    if(!state.settings.showVideoTranslation) {
      node.querySelector(".gle-subtitle-translation")?.remove();
      return;
    }
    try{
      const data=await analyze(translationText);
      applySentenceTranslation(node,text,data);
    }catch(_error){}
  }

  function refreshVideoTranslations(){
    document.querySelectorAll(".gle-subtitle-translation").forEach(el=>el.remove());
    if(!state.settings.showVideoTranslation) return;
    document.querySelectorAll("[data-gle-text]").forEach(node=>{
      let translationText=node.dataset.gleText;
      if(adapter.id==="youtube" && node===state.youtube.germanLine && state.youtube.cues && state.youtube.cueIndex>=0){
        translationText=globalThis.GLEYoutubeCues.translationTextForCue(state.youtube.cues,state.youtube.cueIndex);
      }
      renderSentenceTranslation(node,node.dataset.gleText,translationText);
    });
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
            bubbleType:"word",
            bubbleSurface:token.text,
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
        bubbleType:"word",
        bubbleSurface:token.text,
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
        const surface=visible.map(index=>tokens[index]?.text).filter(Boolean).join(" ");
        const currentItem={
          ...(expressionMembers.get(visible[0])||item),
          bubbleType:"expression",
          bubbleSurface:match.canonical||item.label||surface||match.surface,
        };
        expressionBadges.set(visible[0],currentItem);
        if(currentItem?.id) {
          seenLearningItems.set(currentItem.id,{item:currentItem,surface:surface||currentItem.label});
        }
      }
    }

    for(const match of expressions){
      const key=String(match.pattern_id||match.canonical||"").toLocaleLowerCase("de-DE");
      if(!state.youtube.videoUnknownExpressions.has(key)) continue;
      const visible=[];
      mappedTokens.forEach((mapped,i)=>{
        if(mapped && match.token_indices?.includes(mapped.i)){
          const currentItem={
            id:null,
            kind:"video-unknown-expression",
            key,
            label:match.canonical||match.surface||key,
            meaning_tr:match.contextual_meaning_tr||(match.meaning_tr||[])[0]||"",
          };
          expressionMembers.set(i,currentItem);
          visible.push(i);
        }
      });
      if(visible.length){
        const surface=visible.map(index=>tokens[index]?.text).filter(Boolean).join(" ");
        const currentItem={
          ...expressionMembers.get(visible[0]),
          bubbleType:"expression",
          bubbleSurface:match.canonical||surface||match.surface||key,
        };
        expressionBadges.set(visible[0],currentItem);
      }
    }

    for(const {item,surface} of seenLearningItems.values()){
      captureSeenLearningItem(item,surface);
    }

    let visibleBubbleCount=0;
    tokens.forEach((token,i)=>{
      const span=document.createElement("span");
      span.textContent=token.text;
      span.className=token.pos==="PUNCT"?"gle-punct":"gle-word";
      span.dataset.gleIndex=token.i;
      const learningItem=expressionMembers.get(i)||learningWordLabels.get(i);
      if(learningItem){
        span.classList.add("gle-learning-item");
        if(learningItem.kind==="video-unknown" || learningItem.kind==="video-unknown-expression"){
          span.classList.add("gle-video-unknown-item");
        }else{
          span.classList.add("gle-persistent-learning-item");
        }
      }
      const badgeItem=expressionBadges.get(i)||learningWordLabels.get(i);
      if(badgeItem && visibleBubbleCount<2 && badgeItem.meaning_tr){
        const bubble=document.createElement("span");
        bubble.className="gle-learning-bubble "+
          ((badgeItem.kind==="video-unknown" || badgeItem.kind==="video-unknown-expression")?"temporary":"persistent")+
          " "+(badgeItem.bubbleType==="expression"?"expression":"word");
        if(badgeItem.bubbleType==="expression"){
          const source=document.createElement("span");
          source.className="gle-learning-bubble-source";
          source.textContent=badgeItem.bubbleSurface||badgeItem.label||"";
          const meaning=document.createElement("span");
          meaning.className="gle-learning-bubble-meaning";
          meaning.textContent=badgeItem.meaning_tr||"";
          bubble.append(source,meaning);
        }else{
          const meaning=document.createElement("span");
          meaning.className="gle-learning-bubble-meaning";
          meaning.textContent=badgeItem.meaning_tr||"";
          bubble.appendChild(meaning);
        }
        span.appendChild(bubble);
        visibleBubbleCount+=1;
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

    const translationPromise=state.settings.showVideoTranslation
      ? analyze(translationText).catch(()=>null)
      : Promise.resolve(null);
    const localAnalysisPromise=analyze(text);
    const contextAnalysisPromise=hoverContextText===text
      ? Promise.resolve(null)
      : analyze(hoverContextText).catch(()=>null);

    translationPromise.then(data=>{
      if(data && node.dataset.gleText===text) applySentenceTranslation(node,text,data);
    });

    try{
      const data=await localAnalysisPromise;
      if(node.dataset.gleText!==text) return;

      // Fast path: show learned/marked words and expressions immediately from the
      // current subtitle cue instead of waiting for the wider context analysis.
      renderAnalyzedTokens(node,text,data,data);

      const hoverData=await contextAnalysisPromise;
      if(node.dataset.gleText!==text) return;
      if(hoverData) renderAnalyzedTokens(node,text,data,hoverData);

      const translationData=await translationPromise;
      if(translationData && node.dataset.gleText===text) applySentenceTranslation(node,text,translationData);
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
    const previousVideoId=state.youtube.videoId;
    if(previousVideoId && state.youtube.cues?.length){
      state.youtube.cueCache.set(previousVideoId,state.youtube.cues);
    }
    state.youtube.videoId=videoId;
    const cachedCues=videoId ? state.youtube.cueCache.get(videoId) : null;
    state.youtube.cues=cachedCues||null;
    state.youtube.cueIndex=-1;
    state.youtube.timedAvailable=Boolean(cachedCues?.length);
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
    state.panel.selectedLemma="";
    state.panel.selectedGroupKey="";
    state.panel.wordsView="overview";
    state.panel.wordsSearch="";
    state.youtube.videoUnknownLemmas=new Set();
    state.youtube.videoUnknownExpressions=new Set();
    stopYouTubePreview();
    hideYouTubeOverlay();
    if(state.panel.element) renderSharedPanel();
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
    const video=adapter.id==="zdf" ? bindZdfVideo() : bindYouTubeVideo();
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

  function setSharedPanelCollapsed(collapsed){
    state.panel.collapsed=Boolean(collapsed);
    if(!state.panel.collapsed && adapter.id==="youtube" && !state.youtube.cues?.length){
      const videoId=currentYouTubeVideoId()||state.youtube.videoId;
      const cached=videoId ? state.youtube.cueCache.get(videoId) : null;
      if(cached?.length){
        state.youtube.videoId=videoId;
        state.youtube.cues=cached;
        state.youtube.timedAvailable=true;
      }
    }
    const panel=state.panel.element;
    if(!panel) return;
    panel.classList.toggle("collapsed",state.panel.collapsed);
    const handle=state.panel.handle;
    if(handle){
      handle.textContent=state.panel.collapsed?"‹":"›";
      handle.title=state.panel.collapsed?uiText("openPanel"):uiText("collapsePanel");
      handle.setAttribute("aria-label",handle.title);
      handle.classList.toggle("collapsed",state.panel.collapsed);
    }
    syncSharedPanelHost();
    if(!state.panel.collapsed && state.panel.tab==="subtitles") renderSharedPanel();
  }

  function zdfPlayerShell(video){
    if(!video) return null;
    const fullscreenRoot=document.fullscreenElement;
    if(fullscreenRoot?.contains(video)) return fullscreenRoot;
    let node=video.parentElement;
    let fallback=node;
    while(node && node!==document.body && node!==document.documentElement){
      const rect=node.getBoundingClientRect();
      if(rect.width>=video.getBoundingClientRect().width*0.9) fallback=node;
      const controls=[...node.querySelectorAll("button,[role=button]")];
      const hasFullscreenControl=controls.some(control=>
        /vollbild|fullscreen|full screen/i.test(
          [control.getAttribute("aria-label"),control.getAttribute("title"),control.textContent]
            .filter(Boolean).join(" ")
        )
      );
      if(hasFullscreenControl) return node;
      node=node.parentElement;
    }
    return fallback;
  }

  function clearZdfPanelLayout(){
    document.documentElement.classList.remove("gle-zdf-panel-open");
    document.documentElement.style.removeProperty("--gle-zdf-panel-space");
    document.querySelectorAll(".gle-zdf-player-shell-panel-open,.gle-zdf-media-host-panel-open").forEach(node=>{
      node.classList.remove("gle-zdf-player-shell-panel-open","gle-zdf-media-host-panel-open");
      node.style.removeProperty("--gle-zdf-panel-width");
    });
    document.querySelectorAll(".gle-zdf-video-panel-open").forEach(node=>{
      node.classList.remove("gle-zdf-video-panel-open");
      node.style.removeProperty("--gle-zdf-video-scale");
      node.style.removeProperty("--gle-zdf-panel-width");
    });
    document.querySelectorAll(".gle-zdf-fullscreen-panel-open,.gle-zdf-fullscreen-panel-collapsed").forEach(node=>{
      node.classList.remove("gle-zdf-fullscreen-panel-open","gle-zdf-fullscreen-panel-collapsed");
      node.style.removeProperty("--gle-zdf-fullscreen-panel-width");
    });
  }

  function syncPanelHandleGeometry(panel){
    const handle=state.panel.handle;
    if(!panel || !handle || state.panel.collapsed) return;
    const rect=panel.getBoundingClientRect();
    if(!rect.height) return;
    const centerY=Math.max(52,Math.min(innerHeight-52,rect.top+Math.min(120,rect.height*0.22)));
    document.documentElement.style.setProperty("--gle-panel-handle-top",centerY+"px");
  }

  function syncSharedPanelHost(){
    const panel=state.panel.element;
    if(adapter.id==="zdf"){
      if(!panel) return;
      const fullscreenRoot=document.fullscreenElement;
      const video=bindZdfVideo() || state.zdf.video;
      const mediaHost=video?.parentElement;
      const playerShell=zdfPlayerShell(video);
      const open=!state.panel.collapsed;
      const host=fullscreenRoot || document.documentElement;

      clearZdfPanelLayout();
      if(panel.parentElement!==host) host.appendChild(panel);
      const handle=state.panel.handle;
      if(handle && handle.parentElement!==host) host.appendChild(handle);
      panel.classList.add("gle-provider-panel-layout");
      panel.classList.toggle("docked",Boolean(fullscreenRoot));

      if(open){
        const viewportWidth=fullscreenRoot?.getBoundingClientRect().width || innerWidth || 1;
        const basePanelWidth=fullscreenRoot
          ? Math.min(420,Math.max(320,viewportWidth*0.30))
          : Math.min(408,Math.max(320,viewportWidth*0.30));
        const factor=clamp(Number(state.settings.panelWidthFactor)||1,0.6,1.1);
        const panelWidth=Math.min(viewportWidth*0.45,Math.max(220,basePanelWidth*factor));
        document.documentElement.style.setProperty("--gle-panel-base-width",basePanelWidth+"px");
        document.documentElement.style.setProperty("--gle-panel-current-width",panelWidth+"px");
        video?.classList.add("gle-zdf-video-panel-open");
        video?.style.removeProperty("--gle-zdf-video-scale");
        video?.style.setProperty("--gle-zdf-panel-width",panelWidth+"px");
        playerShell?.classList.add("gle-zdf-player-shell-panel-open");
        playerShell?.style.setProperty("--gle-zdf-panel-width",panelWidth+"px");
        if(playerShell===mediaHost){
          mediaHost?.classList.add("gle-zdf-media-host-panel-open");
        }

        if(fullscreenRoot){
          fullscreenRoot.classList.add("gle-zdf-fullscreen-panel-open");
          fullscreenRoot.style.setProperty("--gle-zdf-fullscreen-panel-width",panelWidth+"px");
        }else{
          document.documentElement.classList.add("gle-zdf-panel-open");
          document.documentElement.style.setProperty("--gle-zdf-panel-space",(panelWidth+24)+"px");
        }
      }else if(fullscreenRoot){
        fullscreenRoot.classList.add("gle-zdf-fullscreen-panel-collapsed");
      }
      state.panel.docked=Boolean(fullscreenRoot);
      requestAnimationFrame(()=>syncPanelHandleGeometry(panel));
      return;
    }
    const player=document.querySelector(".html5-video-player");
    if(!panel || !player) return;

    const fullscreen=Boolean(document.fullscreenElement) || player.classList.contains("ytp-fullscreen");
    const rect=player.getBoundingClientRect();

    if(fullscreen){
      const width=rect.width||1;
      const basePanelWidth=Math.min(420,width*0.35);
      const factor=clamp(Number(state.settings.panelWidthFactor)||1,0.6,1.1);
      const panelWidth=Math.min(width*0.45,Math.max(220,basePanelWidth*factor));
      if(panel.parentElement!==player) player.appendChild(panel);
      const handle=state.panel.handle;
      if(handle && handle.parentElement!==player) player.appendChild(handle);
      state.panel.docked=true;
      panel.classList.remove("gle-youtube-external-panel");
      panel.classList.add("docked","gle-youtube-fullscreen-panel");
      document.documentElement.style.setProperty("--gle-panel-current-width",panelWidth+"px");
      document.documentElement.style.setProperty("--gle-panel-base-width",basePanelWidth+"px");
      player.style.setProperty("--gle-panel-width",panelWidth+"px");
      player.classList.add("gle-panel-player-fullscreen");
      player.classList.toggle("gle-panel-fullscreen-open",!state.panel.collapsed);

      if(!state.panel.collapsed){
        const scale=Math.max(0.55,(width-panelWidth)/width);
        player.style.setProperty("--gle-video-scale",String(scale));
      }else{
        player.style.removeProperty("--gle-video-scale");
      }
      player.querySelector(".html5-video-container")?.style.removeProperty("--gle-video-content-width");
      requestAnimationFrame(()=>syncPanelHandleGeometry(panel));
      return;
    }

    if(panel.parentElement!==document.documentElement) document.documentElement.appendChild(panel);
    const handle=state.panel.handle;
    if(handle && handle.parentElement!==document.documentElement) document.documentElement.appendChild(handle);
    state.panel.docked=false;
    panel.classList.remove("docked","gle-provider-panel-layout","gle-youtube-fullscreen-panel");
    panel.classList.add("gle-youtube-external-panel");
    player.classList.remove("gle-panel-docked","gle-panel-docked-collapsed","gle-panel-player-fullscreen","gle-panel-fullscreen-open");
    player.style.removeProperty("--gle-panel-width");
    player.style.removeProperty("--gle-video-scale");
    player.querySelector(".html5-video-container")?.style.removeProperty("--gle-video-content-width");

    const viewportWidth=window.innerWidth || document.documentElement.clientWidth || 1;
    const viewportHeight=window.innerHeight || document.documentElement.clientHeight || 1;
    const gap=6;
    const naturalLeft=Math.max(0,rect.right+gap);
    const basePanelWidth=Math.max(220,viewportWidth-naturalLeft);
    const factor=clamp(Number(state.settings.panelWidthFactor)||1,0.6,1.1);
    const panelWidth=Math.min(viewportWidth-12,Math.max(220,basePanelWidth*factor));
    const left=Math.max(0,viewportWidth-panelWidth);

    document.documentElement.style.setProperty("--gle-panel-base-width",basePanelWidth+"px");
    document.documentElement.style.setProperty("--gle-youtube-panel-left",left+"px");
    document.documentElement.style.setProperty("--gle-youtube-panel-top","0px");
    document.documentElement.style.setProperty("--gle-youtube-panel-width",panelWidth+"px");
    document.documentElement.style.setProperty("--gle-youtube-panel-height",viewportHeight+"px");
    document.documentElement.style.setProperty("--gle-panel-current-width",panelWidth+"px");
    document.documentElement.style.setProperty("--gle-panel-handle-right",Math.max(0,viewportWidth-left)+"px");
    requestAnimationFrame(()=>syncPanelHandleGeometry(panel));
  }

  function installPanelResizeHandle(panel){
    const resizer=panel.querySelector(".gle-panel-resizer");
    if(!resizer || resizer.dataset.ready==="1") return;
    resizer.dataset.ready="1";
    resizer.addEventListener("pointerdown",event=>{
      if(event.button!==0 || state.panel.collapsed) return;
      event.preventDefault();
      event.stopPropagation();
      const startX=event.clientX;
      const startFactor=clamp(Number(state.settings.panelWidthFactor)||1,0.6,1.1);
      const baseWidth=Math.max(1,parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gle-panel-base-width"))||panel.getBoundingClientRect().width);
      resizer.setPointerCapture?.(event.pointerId);
      panel.classList.add("gle-panel-resizing");
      const move=moveEvent=>{
        const factor=clamp(startFactor+(startX-moveEvent.clientX)/baseWidth,0.6,1.1);
        state.settings.panelWidthFactor=factor;
        syncSharedPanelHost();
      };
      const finish=()=>{
        resizer.removeEventListener("pointermove",move);
        resizer.removeEventListener("pointerup",finish);
        resizer.removeEventListener("pointercancel",finish);
        panel.classList.remove("gle-panel-resizing");
        chrome.storage.sync.set({panelWidthFactor:state.settings.panelWidthFactor});
      };
      resizer.addEventListener("pointermove",move);
      resizer.addEventListener("pointerup",finish);
      resizer.addEventListener("pointercancel",finish);
    });
  }

  function ensureSharedPanel(){
    if(!["youtube","zdf"].includes(adapter.id)) return null;
    if(state.panel.element?.isConnected){
      syncSharedPanelHost();
      return state.panel.element;
    }

    const panel=document.createElement("aside");
    panel.id="gle-shared-panel";
    panel.className="gle-shared-panel";
    panel.innerHTML='<div class="gle-panel-resizer" role="separator" aria-orientation="vertical" title="Panel genişliğini ayarla"></div><div class="gle-panel-productbar"><strong>Language Learning</strong><div class="gle-panel-actions"><label class="gle-master-switch" title="Language Learning"><input class="gle-header-main-toggle" type="checkbox"><span></span><em>'+esc(uiText("active"))+'</em></label><button type="button" class="gle-header-settings" aria-label="'+escAttr(uiText("settings"))+'" title="'+escAttr(uiText("settings"))+'">⚙</button></div></div><div class="gle-panel-head"><div class="gle-panel-tabs"><button type="button" data-tab="subtitles">'+esc(uiText("subtitles"))+'</button><button type="button" data-tab="words">'+esc(uiText("words"))+'</button><button type="button" data-tab="saved">'+esc(uiText("saved"))+'</button></div></div><div class="gle-panel-body"></div>';

    let handle=state.panel.handle;
    if(!handle?.isConnected){
      handle=document.createElement("button");
      handle.type="button";
      handle.id="gle-panel-edge-handle";
      handle.className="gle-panel-edge-handle";
      handle.addEventListener("click",event=>{
        event.stopPropagation();
        setSharedPanelCollapsed(!state.panel.collapsed);
      });
      document.documentElement.appendChild(handle);
      state.panel.handle=handle;
    }
    panel.querySelector(".gle-header-main-toggle").addEventListener("change",async event=>{
      state.settings.extensionEnabled=event.target.checked;
      await chrome.storage.sync.set({extensionEnabled:state.settings.extensionEnabled});
      renderPlayerControls();
    });
    panel.querySelector(".gle-header-settings").addEventListener("click",()=>ensureSettingsDialog());

    panel.querySelectorAll("[data-tab]").forEach(button=>{
      button.addEventListener("click",()=>{
        state.panel.tab=button.dataset.tab;
        state.panel.selectedLemma="";
        state.panel.selectedGroupKey="";
        renderSharedPanel();
      });
    });

    document.documentElement.appendChild(panel);
    state.panel.element=panel;
    installPanelResizeHandle(panel);

    const active=state.settings.extensionEnabled!==false;
    const mainToggle=panel.querySelector(".gle-header-main-toggle");
    if(mainToggle) mainToggle.checked=active;
    const mainLabel=panel.querySelector(".gle-master-switch em");
    if(mainLabel) mainLabel.textContent=active?uiText("active"):uiText("inactive");

    setSharedPanelCollapsed(state.panel.collapsed);
    syncSharedPanelHost();
    return panel;
  }

  function updatePanelActiveCue(){
    const panel=state.panel.element;
    if(!panel || state.panel.collapsed || state.panel.tab!=="subtitles") return;
    panel.querySelectorAll(".gle-transcript-row.active").forEach(row=>row.classList.remove("active"));
    const active=panel.querySelector('[data-cue-index="'+state.youtube.cueIndex+'"]');
    if(active){
      active.classList.add("active");
      if(state.settings.followActiveSubtitle!==false) active.scrollIntoView({block:"nearest"});
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
    renderSharedPanel();
  }

  function videoUnknownExpressionStorageKey(videoId=state.youtube.videoId){
    return "gleVideoUnknownExpressions:"+String(videoId||"");
  }

  async function loadVideoUnknownExpressions(){
    const key=videoUnknownExpressionStorageKey();
    if(!state.youtube.videoId){
      state.youtube.videoUnknownExpressions=new Set();
      return;
    }
    const stored=await chrome.storage.local.get(key);
    state.youtube.videoUnknownExpressions=new Set(Array.isArray(stored[key])?stored[key]:[]);
  }

  async function toggleVideoUnknownExpression(entry){
    const key=String(entry?.patternId||entry?.canonical||"").toLocaleLowerCase("de-DE");
    if(!key) return;
    if(state.youtube.videoUnknownExpressions.has(key)) state.youtube.videoUnknownExpressions.delete(key);
    else state.youtube.videoUnknownExpressions.add(key);
    await chrome.storage.local.set({[videoUnknownExpressionStorageKey()]:[...state.youtube.videoUnknownExpressions]});
    refreshLearningHighlights();
    renderSharedPanel();
  }

  function expressionGroupsCacheKey(){
    const cues=state.youtube.cues||[];
    const first=cues[0];
    const last=cues[cues.length-1];
    return "gleExpressionGroups:v2:"+state.youtube.videoId+":"+cues.length+":"+Math.round(first?.startMs||0)+":"+Math.round(last?.endMs||0);
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
          if(state.panel.tab==="words") renderSharedPanel();
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
                meaningTr:expression.contextual_meaning_tr || (expression.meaning_tr||[])[0] || "",
                grammarHint:expression.grammar_hint || "",
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
        if(state.panel.tab==="words") renderSharedPanel();
      }catch(error){
        console.warn("Video expression group analysis failed",error);
        state.youtube.expressionGroupsAnalysis=[];
        if(state.panel.tab==="words") renderSharedPanel();
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
          if(state.panel.element) renderSharedPanel();
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
        if(state.panel.element) renderSharedPanel();
      }catch(error){
        console.warn("Video word analysis failed",error);
        if(state.panel.element && state.panel.tab==="words"){
          const body=state.panel.element.querySelector(".gle-panel-body");
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
      body.innerHTML='<div class="gle-panel-empty">'+esc(uiText("waitingSubtitles"))+'</div>';
      return;
    }
    const controls=document.createElement("div");
    controls.className="gle-transcript-controls";
    controls.innerHTML='<span>'+esc(uiText("translation"))+'</span><div class="gle-transcript-switches"><label class="gle-translation-switch"><em>'+esc(uiText("videoTranslation"))+'</em><input type="checkbox" data-setting="showVideoTranslation" '+(state.settings.showVideoTranslation!==false?"checked":"")+'><span></span></label><label class="gle-translation-switch"><em>'+esc(uiText("panelTranslation"))+'</em><input type="checkbox" data-setting="showPanelTranslation" '+(state.settings.showPanelTranslation!==false?"checked":"")+'><span></span></label></div>';
    controls.querySelectorAll("input[data-setting]").forEach(input=>input.addEventListener("change",async event=>{
      const name=event.target.dataset.setting;
      state.settings[name]=event.target.checked;
      await chrome.storage.sync.set({[name]:event.target.checked});
      if(name==="showVideoTranslation") refreshVideoTranslations();
      if(name==="showPanelTranslation") renderSharedPanel();
    }));
    const list=document.createElement("div");
    list.className="gle-transcript-list";
    cues.forEach((cue,index)=>{
      const row=document.createElement("button");
      row.type="button";
      row.className="gle-transcript-row"+(index===state.youtube.cueIndex?" active":"");
      row.dataset.cueIndex=String(index);
      const cached=state.panelTranslationCache.get(cue.text)||"";
      row.innerHTML='<span class="gle-row-time">'+panelClock(cue.startMs)+'</span><span class="gle-row-text"><span class="gle-row-source">'+esc(cue.text)+'</span>'+(state.settings.showPanelTranslation!==false?'<span class="gle-row-translation" data-translation-index="'+index+'">'+esc(cached)+'</span>':"")+'</span><span class="gle-row-play">▶</span>';
      row.addEventListener("click",()=>playYouTubeCue(index));
      list.appendChild(row);
    });
    body.replaceChildren(controls,list);
    if(state.settings.showPanelTranslation!==false) hydratePanelTranslations(list,cues);
    updatePanelActiveCue();
  }

  function hydratePanelTranslations(list,cues){
    const nodes=[...list.querySelectorAll(".gle-row-translation")];
    const load=async node=>{
      const index=Number(node.dataset.translationIndex);
      const cue=cues[index];
      if(!cue || node.dataset.loaded==="1") return;
      node.dataset.loaded="1";
      let translation=state.panelTranslationCache.get(cue.text)||"";
      if(!translation){
        try{
          const data=await analyze(cue.text);
          translation=cleanTranslationText(data?.sentence_meaning_tr||"");
          if(translation) state.panelTranslationCache.set(cue.text,translation);
        }catch(_error){}
      }
      if(node.isConnected) node.textContent=translation;
    };
    if(!("IntersectionObserver" in window)){ nodes.slice(0,30).forEach(load); return; }
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        load(entry.target);
      }
    },{root:list.closest(".gle-panel-body"),rootMargin:"300px 0px"});
    nodes.forEach(node=>observer.observe(node));
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
      state.panel.selectedLemma="";
      renderSharedPanel();
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
      const chips=items.map(entry=>{
        const learning=isLearning("expression",entry.patternId||entry.canonical);
        const videoUnknown=state.youtube.videoUnknownExpressions.has(
          String(entry.patternId||entry.canonical||"").toLocaleLowerCase("de-DE")
        );
        return '<div class="gle-expression-chip-wrap'+(videoUnknown?" unknown":"")+'">'+
          '<button type="button" class="gle-expression-chip'+(learning?" learning":"")+'" data-group-key="'+escAttr(entry.key)+'">'+
            '<span>'+(learning?"★ ":"")+esc(entry.canonical)+'</span><b>'+entry.count+'×</b>'+
          '</button>'+
          '<button type="button" class="gle-expression-learn'+(videoUnknown?" active":"")+'" data-group-learn-key="'+escAttr(entry.key)+'" title="'+(videoUnknown?"Bu video için anlam gösterimini kapat":"Bu video için anlamını altyazıda göster")+'">'+(videoUnknown?"✓":"+")+'</button>'+
        '</div>';
      }).join("");
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
      state.panel.selectedGroupKey="";
      renderSharedPanel();
    });
    body.querySelectorAll(".gle-word-occurrence").forEach(button=>{
      button.addEventListener("click",()=>playYouTubeCue(Number(button.dataset.cueIndex)));
    });
  }

  function wordsToolbar(analysis){
    const q=state.panel.wordsSearch||"";
    const views=[
      ["overview","Genel"],
      ["alphabetical","A-Z"],
      ["frequency","Sıklık"],
      ["groups","Kelime grupları"],
      ["senses","Anlamlar"],
    ];
    return '<div class="gle-words-tools">'+
      '<div class="gle-words-subtabs">'+views.map(([id,label])=>
        '<button type="button" data-words-view="'+id+'" class="'+(state.panel.wordsView===id?"active":"")+'">'+label+'</button>'
      ).join("")+'</div>'+
      '<label class="gle-word-search"><span>⌕</span><input type="search" placeholder="Bu videoda kelime ara…" value="'+escAttr(q)+'" aria-label="Bu videoda kelime ara"></label>'+
    '</div>';
  }

  function filterPanelWords(entries){
    const q=String(state.panel.wordsSearch||"").trim().toLocaleLowerCase("de-DE");
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

  async function showPanelExpressionTooltip(button,entry){
    const cueIndex=entry?.occurrences?.[0];
    const cue=(state.youtube.cues||[])[cueIndex];
    if(!cue?.text) return;
    try{
      const data=await analyze(cue.text);
      const expression=(data.expressions||[]).find(expr=>
        (entry.patternId && expr.pattern_id===entry.patternId) ||
        String(expr.canonical||"").toLocaleLowerCase("de-DE")===String(entry.canonical||"").toLocaleLowerCase("de-DE")
      );
      const tokenIndex=expression?.token_indices?.[0];
      if(Number.isInteger(tokenIndex)){
        renderCard(data,tokenIndex,button);
        return;
      }
    }catch(_error){}

    cancelTooltipHide();
    const learning=isLearning("expression",entry.patternId||entry.canonical);
    state.tooltip.innerHTML=
      '<div class="gle-hover-head"><b>'+esc(entry.canonical)+'</b><span>'+esc(expressionGroupLabel(entry.type))+'</span></div>'+
      (entry.meaningTr?'<div class="gle-context gle-context-primary"><b>Anlam:</b> '+esc(entry.meaningTr)+'</div>':"")+
      (entry.grammarHint?'<div class="gle-note"><b>Yapı:</b> '+esc(entry.grammarHint)+'</div>':"")+
      '<div class="gle-learn-actions"><button type="button" class="gle-learn-button gle-expression-tooltip-learn">'+(learning?"★":"☆")+' <span>Öğren</span></button></div>';

    const learnButton=state.tooltip.querySelector(".gle-expression-tooltip-learn");
    learnButton?.addEventListener("click",async()=>{
      learnButton.disabled=true;
      try{
        const key=entry.patternId||entry.canonical;
        if(isLearning("expression",key)){
          await removeLearningItem("expression",key);
        }else{
          await saveLearningItem({
            kind:"expression",
            key,
            label:entry.canonical,
            meaning_tr:entry.meaningTr||"",
            surface:entry.forms?.[0]||entry.canonical,
          });
        }
        renderSharedPanel();
        state.tooltip.hidden=true;
      }finally{
        learnButton.disabled=false;
      }
    });

    const r=button.getBoundingClientRect();
    state.tooltip.hidden=false;
    state.tooltip.style.left=Math.min(window.innerWidth-370,Math.max(8,r.left))+"px";
    state.tooltip.style.top=Math.max(8,r.top-state.tooltip.offsetHeight-10)+"px";
  }

  async function toggleExpressionLearning(entry){
    const key=entry.patternId||entry.canonical;
    if(!key) return;
    if(isLearning("expression",key)){
      await removeLearningItem("expression",key);
    }else{
      const cueIndex=entry.occurrences?.[0];
      const cue=(state.youtube.cues||[])[cueIndex];
      const encounterSnapshot=cue ? {
        surface_form:entry.forms?.[0]||entry.canonical,
        sentence:cue.text,
        provider:"youtube",
        source_type:"video",
        external_id:state.youtube.videoId,
        url:"https://www.youtube.com/watch?v="+encodeURIComponent(state.youtube.videoId),
        title:currentYouTubeTitle(),
        media_timestamp_ms:Math.round(cue.startMs),
        media_end_timestamp_ms:Math.round(cue.endMs),
        context:{cue_index:cue.index ?? cueIndex,page_url:location.href},
      } : null;
      await saveLearningItem({
        kind:"expression",
        key,
        label:entry.canonical,
        meaning_tr:entry.meaningTr||"",
        surface:entry.forms?.[0]||entry.canonical,
      },encounterSnapshot);
    }
    renderSharedPanel();
  }

  function learningItemForSense(row){
    return state.learningItems.find(item=>item.kind==="learning-unit" && item.key===row.key);
  }

  async function analyzePanelWordSenses(){
    const videoId=state.youtube.videoId;
    const cues=state.youtube.cues||[];
    if(!videoId || !cues.length) return;
    if(state.panel.senseRowsVideoId===videoId && state.panel.senseRows) return;
    if(state.panel.senseRowsVideoId===videoId && state.panel.senseRowsPromise) return state.panel.senseRowsPromise;
    state.panel.senseRowsVideoId=videoId;
    state.panel.senseRows=null;
    const task=(async()=>{
      try{
        const apiBase=await platformApiBase();
        const rows=new Map();
        const batchSize=120;
        for(let offset=0;offset<cues.length;offset+=batchSize){
          const chunk=cues.slice(offset,offset+batchSize);
          const response=await fetch(apiBase+"/api/v1/learning-units-batch",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({source_language:"de",texts:chunk.map(cue=>cue.text)}),
          });
          if(!response.ok) throw new Error("learning unit analysis "+response.status);
          const payload=await response.json();
          (payload.items||[]).forEach((item,index)=>{
            const cueIndex=offset+index;
            for(const unit of item.learning_units||[]){
              const key=String(unit.id||"");
              if(!key) continue;
              let row=rows.get(key);
              if(!row){
                row={
                  key,
                  lemma:String(unit.lemma||unit.canonical||""),
                  canonical:String(unit.canonical||unit.lemma||""),
                  meaningTr:String(unit.meaning_tr||""),
                  unitType:String(unit.unit_type||"Kelime"),
                  senseId:String(unit.sense_id||""),
                  patternId:String(unit.pattern_id||""),
                  cueIndex,
                  surface:String(unit.surface||unit.canonical||""),
                  occurrences:[],
                };
                rows.set(key,row);
              }
              if(!row.occurrences.includes(cueIndex)) row.occurrences.push(cueIndex);
            }
          });
        }
        state.panel.senseRows=[...rows.values()].sort((a,b)=>a.canonical.localeCompare(b.canonical,"de") || a.meaningTr.localeCompare(b.meaningTr,"tr"));
      }catch(error){
        console.warn("Learning unit table analysis failed",error);
        state.panel.senseRows=[];
      }finally{
        state.panel.senseRowsPromise=null;
        if(state.panel.tab==="words" && state.panel.wordsView==="senses") renderSharedPanel();
      }
    })();
    state.panel.senseRowsPromise=task;
    return task;
  }

  async function setSenseStatus(row,status){
    const profileId=state.learningProfileId || await ensureLearningProfile();
    const apiBase=await platformApiBase();
    const response=await fetch(apiBase+"/api/v1/learning-items",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        profile_id:profileId,
        canonical_form:row.canonical,
        canonical_key:row.key,
        category:"learning-unit",
        status,
        meaning:row.meaningTr,
        meaning_language:"tr",
        metadata:{
          source:"chrome-extension",
          cue_index:row.cueIndex,
          sense_id:row.senseId||null,
          pattern_id:row.patternId||null,
        },
      }),
    });
    if(!response.ok) throw new Error("word sense status "+response.status);
    await loadLearningItems();
  }

  function renderWordSenseTable(body){
    if(state.panel.senseRowsVideoId!==state.youtube.videoId || !state.panel.senseRows){
      body.innerHTML='<div class="gle-panel-summary"><strong>'+(state.youtube.transcriptAnalysis?.length||0)+'</strong><span>farklı lemma</span><strong>'+(state.youtube.cues||[]).length+'</strong><span>altyazı bölümü</span></div>'+wordsToolbar(state.youtube.transcriptAnalysis||[])+'<div class="gle-panel-empty"><b>Anlamlar hazırlanıyor…</b><span>Her kullanım cümle bağlamında analiz ediliyor.</span></div>';
      bindPanelWordControls(body,state.youtube.transcriptAnalysis||[]);
      analyzePanelWordSenses();
      return;
    }
    const q=String(state.panel.wordsSearch||"").trim().toLocaleLowerCase("de-DE");
    const rows=state.panel.senseRows.filter(row=>!q || row.lemma.includes(q) || row.meaningTr.toLocaleLowerCase("tr-TR").includes(q));
    const table='<div class="gle-sense-table"><div class="gle-sense-head"><span>Öğrenme birimi</span><span>Bu kullanımdaki anlam</span><span>Tür</span><span>Durum</span></div>'+rows.map(row=>{
      const item=learningItemForSense(row);
      const learning=item?.status==="learning";
      const known=item?.status==="learned" || item?.status==="known";
      return '<div class="gle-sense-row" data-sense-key="'+escAttr(row.key)+'"><button type="button" class="gle-sense-word" data-sense-jump="'+escAttr(row.key)+'">'+esc(row.canonical)+'</button><span class="gle-sense-meaning">'+esc(row.meaningTr)+'</span><span class="gle-sense-type">'+esc(row.unitType)+'</span><span class="gle-sense-actions"><button type="button" data-sense-learn="'+escAttr(row.key)+'" class="'+(learning?"active":"")+'" title="Öğreniyorum">★</button><button type="button" data-sense-known="'+escAttr(row.key)+'" class="'+(known?"active":"")+'" title="Biliyorum">✓</button></span></div>';
    }).join("")+'</div>';
    body.innerHTML='<div class="gle-panel-summary"><strong>'+rows.length+'</strong><span>anlam/kullanım</span><strong>'+(state.youtube.cues||[]).length+'</strong><span>altyazı bölümü</span></div>'+wordsToolbar(state.youtube.transcriptAnalysis||[])+(rows.length?table:'<div class="gle-panel-empty">Sonuç bulunamadı.</div>');
    bindPanelWordControls(body,state.youtube.transcriptAnalysis||[]);
    body.querySelectorAll("[data-sense-jump]").forEach(button=>button.addEventListener("click",()=>{
      const row=state.panel.senseRows.find(item=>item.key===button.dataset.senseJump);
      if(row) playYouTubeCue(row.cueIndex);
    }));
    const bindStatus=(selector,status)=>body.querySelectorAll(selector).forEach(button=>button.addEventListener("click",async()=>{
      const key=button.dataset.senseLearn||button.dataset.senseKnown;
      const row=state.panel.senseRows.find(item=>item.key===key);
      if(!row) return;
      button.disabled=true;
      try{ await setSenseStatus(row,status); renderSharedPanel(); }
      catch(error){ console.warn("Word sense status failed",error); button.disabled=false; }
    }));
    bindStatus("[data-sense-learn]","learning");
    bindStatus("[data-sense-known]","learned");
  }

  function bindPanelWordControls(body,analysis){
    body.querySelectorAll("[data-words-view]").forEach(button=>{
      button.addEventListener("click",()=>{
        state.panel.wordsView=button.dataset.wordsView||"overview";
        state.panel.selectedLemma="";
        state.panel.selectedGroupKey="";
        renderSharedPanel();
      });
    });

    const search=body.querySelector(".gle-word-search input");
    if(search){
      search.addEventListener("input",()=>{
        state.panel.wordsSearch=search.value;
        const cursor=search.selectionStart;
        renderSharedPanel();
        requestAnimationFrame(()=>{
          const next=state.panel.element?.querySelector(".gle-word-search input");
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
        state.panel.selectedLemma=button.dataset.lemma;
        renderSharedPanel();
      });
    });

    body.querySelectorAll(".gle-expression-chip").forEach(button=>{
      const entry=(state.youtube.expressionGroupsAnalysis||[]).find(item=>item.key===button.dataset.groupKey);
      let hoverTimer=null;
      button.addEventListener("mouseenter",()=>{
        hoverTimer=setTimeout(()=>showPanelExpressionTooltip(button,entry),180);
      });
      button.addEventListener("mouseleave",event=>{
        clearTimeout(hoverTimer);
        const next=event.relatedTarget;
        if(next && state.tooltip?.contains(next)) return;
        scheduleTooltipHide(850);
      });
      button.addEventListener("click",()=>{
        state.panel.selectedGroupKey=button.dataset.groupKey;
        state.panel.selectedLemma="";
        renderSharedPanel();
      });
    });

    body.querySelectorAll(".gle-expression-learn").forEach(button=>{
      button.addEventListener("click",async event=>{
        event.stopPropagation();
        const entry=(state.youtube.expressionGroupsAnalysis||[]).find(item=>item.key===button.dataset.groupLearnKey);
        if(!entry) return;
        button.disabled=true;
        try{
          await toggleVideoUnknownExpression(entry);
        }catch(error){
          console.warn("Expression video-mark sync failed",error);
          button.disabled=false;
        }
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

    if(state.panel.wordsView==="senses"){
      renderWordSenseTable(body);
      return;
    }

    if(state.panel.selectedGroupKey){
      const group=(state.youtube.expressionGroupsAnalysis||[]).find(item=>item.key===state.panel.selectedGroupKey);
      if(group){
        renderExpressionGroupDetail(body,group);
        return;
      }
      state.panel.selectedGroupKey="";
    }

    if(state.panel.selectedLemma){
      const entry=analysis.find(item=>item.lemma===state.panel.selectedLemma);
      if(entry){
        renderWordDetail(body,entry);
        return;
      }
      state.panel.selectedLemma="";
    }

    const visible=filterPanelWords(analysis);
    const learning=visible.filter(entry=>learningItemForLemma(entry.lemma));
    const learningSet=new Set(learning.map(entry=>entry.lemma));
    const frequent=visible.filter(entry=>!learningSet.has(entry.lemma) && entry.count>=3);
    const frequentSet=new Set(frequent.map(entry=>entry.lemma));
    const others=visible.filter(entry=>!learningSet.has(entry.lemma) && !frequentSet.has(entry.lemma));

    const groups=state.youtube.expressionGroupsAnalysis;
    let content="";
    if(state.panel.wordsView==="alphabetical"){
      content=alphabeticalWordList(visible);
    }else if(state.panel.wordsView==="frequency"){
      content=frequencyWordList(visible);
    }else if(state.panel.wordsView==="groups"){
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
        state.panel.tab="words";
        state.panel.selectedLemma=button.dataset.lemma;
        renderSharedPanel();
      });
    });
  }

  function renderSharedPanel(){
    const panel=ensureSharedPanel();
    if(!panel) return;
    panel.querySelectorAll("[data-tab]").forEach(button=>button.classList.toggle("active",button.dataset.tab===state.panel.tab));
    const body=panel.querySelector(".gle-panel-body");
    if(state.panel.tab==="words") renderPanelWords(body);
    else if(state.panel.tab==="saved") renderPanelSaved(body);
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
      // YouTube can emit transient disabled states while its UI/player is
      // reflowing (for example when our panel is collapsed/reopened). Preserve
      // the already loaded timed cue list for the same video; only a real video
      // identity change should clear it.
      if(message.videoId && state.youtube.videoId && message.videoId!==state.youtube.videoId){
        resetYouTube(message.videoId);
      }
      return;
    }

    if(message.type!=="track-data" || !message.payload) return;

    try{
      const cues=globalThis.GLEYoutubeCues.parseJson3Cues(message.payload);
      if(!cues.length) return;
      clearTimeout(state.youtube.domTimer);
      state.youtube.domTimer=null;
      state.youtube.cues=cues;
      if(state.youtube.videoId) state.youtube.cueCache.set(state.youtube.videoId,cues);
      state.youtube.cueIndex=-1;
      state.youtube.timedAvailable=true;
      indexPreparedCorpusFromYouTube(cues);
      ensureSharedPanel();
      Promise.all([loadVideoUnknownLemmas(),loadVideoUnknownExpressions()]).then(()=>{
        renderSharedPanel();
        refreshLearningHighlights();
      });
      renderSharedPanel();
      analyzeWholeYouTubeTranscript();
      bindYouTubeVideo();
      const video=state.youtube.video || document.querySelector("video.html5-main-video") || document.querySelector("video");
      const currentCue=video ? globalThis.GLEYoutubeCues.cueAtTime(cues,video.currentTime*1000) : cues[0];
      prefetchYouTubeAnalyses(currentCue?.index ?? 0);
      renderTimedCue();
    }catch(_error){
      if(!state.youtube.cues?.length){
        state.youtube.timedAvailable=false;
        state.youtube.cues=null;
      }
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
      ensureSharedPanel();
      syncSharedPanelHost();
      window.postMessage({source:"gle-youtube-content",type:"refresh"},location.origin);
      scanYouTube();
    });
  });

  window.addEventListener("wheel",event=>{
    const panel=state.panel.element;
    if(!panel || state.panel.collapsed || !panel.contains(event.target)) return;
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

  document.addEventListener("fullscreenchange",()=>requestAnimationFrame(syncSharedPanelHost));
  window.addEventListener("resize",()=>requestAnimationFrame(syncSharedPanelHost));

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
    ensureSharedPanel();
    syncSharedPanelHost();

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



  function ensureZdfPanel(){
    if(adapter.id!=="zdf") return null;
    return ensureSharedPanel();
  }

  function renderZdfPanel(){
    if(adapter.id!=="zdf") return;
    renderSharedPanel();
  }

  function adoptZdfMediaForSharedPanel(){
    state.youtube.videoId=state.zdf.videoId;
    state.youtube.video=state.zdf.video;
    state.youtube.cues=state.zdf.cues;
    state.youtube.cueIndex=state.zdf.cueIndex;
    state.youtube.timedAvailable=Boolean(state.zdf.loaded);
  }

  function cueAtTime(cues,timeMs){
    if(!Array.isArray(cues)) return null;
    return cues.find(cue=>timeMs>=cue.startMs && timeMs<cue.endMs) || null;
  }

  function ensureZdfOverlay(){
    const video=document.querySelector("video");
    if(!video) return null;
    const host=video.parentElement || document.documentElement;
    let overlay=host.querySelector?.(".gle-zdf-overlay");
    if(!overlay){
      overlay=document.createElement("div");
      overlay.className="gle-youtube-overlay gle-zdf-overlay";
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
      host.appendChild(overlay);
      installZdfDragHandle(video,overlay,handle);
    }
    state.zdf.overlay=overlay;
    state.zdf.germanLine=overlay.querySelector(".gle-youtube-german");
    const videoRect=video.getBoundingClientRect();
    const hostRect=host.getBoundingClientRect();
    const overlayLeft=(videoRect.left-hostRect.left+videoRect.width/2)+"px";
    overlay.style.setProperty("--gle-zdf-overlay-left",overlayLeft);
    overlay.style.left=overlayLeft;
    overlay.style.width=videoRect.width+"px";
    overlay.style.maxWidth="none";
    overlay.style.top=clamp(Number(state.settings.zdfSubtitlePositionY)||88,8,92)+"%";
    return {video,overlay,germanLine:state.zdf.germanLine};
  }

  function installZdfDragHandle(video,overlay,handle){
    handle.addEventListener("pointerdown",event=>{
      if(event.button!==0) return;
      event.preventDefault();
      event.stopPropagation();
      const rect=video.getBoundingClientRect();
      if(!rect.height) return;
      const startY=event.clientY;
      const startPosition=clamp(Number(state.settings.zdfSubtitlePositionY)||88,8,92);
      handle.setPointerCapture?.(event.pointerId);
      overlay.classList.add("gle-dragging");
      const onMove=moveEvent=>{
        const next=clamp(startPosition+((moveEvent.clientY-startY)/rect.height)*100,8,92);
        state.settings.zdfSubtitlePositionY=next;
        overlay.style.top=next+"%";
      };
      const finish=()=>{
        handle.removeEventListener("pointermove",onMove);
        handle.removeEventListener("pointerup",finish);
        handle.removeEventListener("pointercancel",finish);
        overlay.classList.remove("gle-dragging");
        chrome.storage.sync.set({zdfSubtitlePositionY:state.settings.zdfSubtitlePositionY});
      };
      handle.addEventListener("pointermove",onMove);
      handle.addEventListener("pointerup",finish);
      handle.addEventListener("pointercancel",finish);
    });
  }

  function renderZdfCue(mediaTime){
    const cues=state.zdf.cues;
    const ui=ensureZdfOverlay();
    if(!cues?.length || !ui) return false;
    const seconds=Number.isFinite(mediaTime)?mediaTime:ui.video.currentTime;
    const cue=cueAtTime(cues,seconds*1000);
    if(!cue){
      ui.overlay.hidden=true;
      state.zdf.cueIndex=-1;
      state.youtube.cueIndex=-1;
      updatePanelActiveCue();
      return true;
    }
    ui.overlay.hidden=false;
    if(state.zdf.cueIndex!==cue.index){
      state.zdf.cueIndex=cue.index;
      state.youtube.cueIndex=cue.index;
      decorate(ui.germanLine,cue.text);
      if(state.settings.showVideoTranslation!==false){
        renderSentenceTranslation(ui.germanLine,cue.text,cue.text);
      }
      updatePanelActiveCue();
    }
    return true;
  }

  function bindZdfVideo(){
    const video=document.querySelector("video");
    if(!video || video===state.zdf.video) return video;
    if(state.zdf.video && state.zdf.videoListeners){
      ["timeupdate","seeking","seeked","play","pause","ratechange"].forEach(type=>
        state.zdf.video.removeEventListener(type,state.zdf.videoListeners)
      );
      if(state.zdf.frameId!==null && state.zdf.video.cancelVideoFrameCallback){
        state.zdf.video.cancelVideoFrameCallback(state.zdf.frameId);
      }
    }
    state.zdf.video=video;
    state.zdf.videoListeners=()=>renderZdfCue();
    ["timeupdate","seeking","seeked","play","pause","ratechange"].forEach(type=>
      video.addEventListener(type,state.zdf.videoListeners)
    );
    if(video.requestVideoFrameCallback){
      const onFrame=(_now,metadata)=>{
        if(state.zdf.video!==video) return;
        renderZdfCue(metadata.mediaTime);
        state.zdf.frameId=video.requestVideoFrameCallback(onFrame);
      };
      state.zdf.frameId=video.requestVideoFrameCallback(onFrame);
    }
    return video;
  }

  async function extensionFetch(url,options={}){
    const result=await chrome.runtime.sendMessage({type:"gle-zdf-fetch",url,options});
    if(!result) throw new Error("extension-fetch-no-response");
    if(result.error && !result.status) throw new Error(result.error);
    return {
      ok:Boolean(result.ok),
      status:Number(result.status||0),
      statusText:result.statusText||"",
      text:async()=>result.body||"",
      json:async()=>JSON.parse(result.body||"null"),
    };
  }

  async function loadZdfTimedSubtitles(){
    if(adapter.id!=="zdf" || state.zdf.loading) return;
    const videoId=globalThis.GLEZdfProvider?.zdfVideoId(location.href);
    if(!videoId) return;
    if(state.zdf.loaded && state.zdf.videoId===videoId) {
      bindZdfVideo();
      renderZdfCue();
      return;
    }
    ensureZdfPanel();
    state.zdf.loading=true;
    state.zdf.videoId=videoId;
    renderZdfPanel();
    state.zdf.error="";
    try{
      const tracks=await globalThis.GLEZdfProvider.discoverSubtitleTracks(videoId,extensionFetch);
      const german=tracks.find(track=>/^(de|deu|ger)(-|$)/i.test(track.language||"")) || tracks[0];
      if(!german) throw new Error("missing-zdf-subtitle-track");
      let response;
      try { response=await extensionFetch(german.url,{cache:"no-store"}); }
      catch(error){ throw new Error("zdf-subtitle-fetch: "+String(error?.message||error)); }
      if(!response.ok) throw new Error("zdf-subtitle-http-"+response.status);
      const cues=globalThis.GLEZdfProvider.parseTtmlCues(await response.text());
      if(!cues.length) throw new Error("empty-zdf-subtitles");
      state.zdf.cues=cues;
      state.zdf.cueIndex=-1;
      state.zdf.loaded=true;
      bindZdfVideo();
      adoptZdfMediaForSharedPanel();
      ensureSharedPanel();
      Promise.all([loadVideoUnknownLemmas(),loadVideoUnknownExpressions()]).then(()=>{
        renderSharedPanel();
        refreshLearningHighlights();
      });
      renderSharedPanel();
      analyzeWholeYouTubeTranscript();
      analyzeWholeYouTubeExpressionGroups();
      renderZdfCue();
    }catch(error){
      state.zdf.error=String(error?.message||error);
      state.zdf.loaded=false;
      renderSharedPanel();
      console.warn("ZDF timed subtitles unavailable",error);
    }finally{
      state.zdf.loading=false;
      renderSharedPanel();
    }
  }

  function scan(){
    if(adapter.id==="youtube"){
      scanYouTube();
      return;
    }
    if(adapter.id==="zdf"){
      ensureZdfPanel();
      loadZdfTimedSubtitles();
      if(state.zdf.loaded){ bindZdfVideo(); renderZdfCue(); return; }
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
    extensionEnabled:true,
    showSentenceTranslation:null,
    showVideoTranslation:null,
    showPanelTranslation:null,
    followActiveSubtitle:true,
    interfaceLanguage:"tr",
    theme:"dark",
    panelWidthFactor:1,
    germanFontSize:100,
    translationFontSize:100,
    youtubeSubtitlePositionY:82,
    zdfSubtitlePositionY:88
  },settings=>{
    const legacyTranslation=settings.showSentenceTranslation;
    const migrated={};
    if(settings.showVideoTranslation===null){
      settings.showVideoTranslation=legacyTranslation===null?true:legacyTranslation!==false;
      migrated.showVideoTranslation=settings.showVideoTranslation;
    }
    if(settings.showPanelTranslation===null){
      settings.showPanelTranslation=legacyTranslation===null?true:legacyTranslation!==false;
      migrated.showPanelTranslation=settings.showPanelTranslation;
    }
    delete settings.showSentenceTranslation;
    if(Object.keys(migrated).length) chrome.storage.sync.set(migrated);
    state.settings=settings;
    if(adapter.id==="zdf" && Number(state.settings.germanFontSize)===100 && Number(state.settings.translationFontSize)===100){
      state.settings.germanFontSize=115;
      state.settings.translationFontSize=115;
      chrome.storage.sync.set({germanFontSize:115,translationFontSize:115});
    }
    ensurePlayerControls();
    applySharedAppearance();
    scan();
    ensureLearningProfile()
      .then(()=>loadLearningItems())
      .catch(error=>console.warn("Learning state bootstrap failed",error));
  });

  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area!=="sync") return;
    if(changes.extensionEnabled) state.settings.extensionEnabled=changes.extensionEnabled.newValue;
    if(changes.showVideoTranslation) state.settings.showVideoTranslation=changes.showVideoTranslation.newValue;
    if(changes.showPanelTranslation) state.settings.showPanelTranslation=changes.showPanelTranslation.newValue;
    if(changes.followActiveSubtitle) state.settings.followActiveSubtitle=changes.followActiveSubtitle.newValue;
    if(changes.interfaceLanguage){
      state.settings.interfaceLanguage=changes.interfaceLanguage.newValue||"tr";
      updateSharedPanelUi();
      if(state.panel.element) renderSharedPanel();
      document.getElementById("gle-settings-dialog")?.remove();
    }
    if(changes.theme){
      state.settings.theme=changes.theme.newValue||"dark";
    }
    if(changes.panelWidthFactor){
      state.settings.panelWidthFactor=clamp(Number(changes.panelWidthFactor.newValue)||1,0.6,1.1);
      syncSharedPanelHost();
    }
    if(changes.germanFontSize) state.settings.germanFontSize=changes.germanFontSize.newValue;
    if(changes.translationFontSize) state.settings.translationFontSize=changes.translationFontSize.newValue;
    if(changes.youtubeSubtitlePositionY) state.settings.youtubeSubtitlePositionY=changes.youtubeSubtitlePositionY.newValue;
    applySharedAppearance();
    if(changes.showPanelTranslation && state.panel.tab==="subtitles") renderSharedPanel();
    if(changes.showVideoTranslation) refreshVideoTranslations();
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
