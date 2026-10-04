(() => {
  const ADAPTERS = [
    {id:"youtube", host:/youtube\.com$/, selectors:[".ytp-caption-segment"]},
    {id:"zdf", host:/(^|\.)zdf\.de$/, selectors:["[class*='subtitle']","[class*='caption']","[aria-live='polite']"]},
    {id:"ard", host:/(^|\.)ardmediathek\.de$/, selectors:["[class*='subtitle']","[class*='caption']","[aria-live='polite']"]}
  ];

  const UI_STRINGS = {
    tr:{
      settings:"Ayarlar",close:"Kapat",general:"Genel",interfaceLanguage:"Arayüz dili",theme:"Tema",themeSystem:"Sistem",themeLight:"Açık",themeDark:"Koyu",
      languageLearningActive:"Language Learning aktif",languageLearningActiveHelp:"Video ve panel özelliklerini birlikte açar veya kapatır.",monitoring:"İzleme",systemMonitor:"Sistem İzleme paneli",systemMonitorHelp:"Çeviri motorları, AI kullanımı ve ileride eklenecek sistem tanılamalarını sol panelde gösterir.",
      translationView:"Çeviri görünümü",videoTranslation:"Video çevirisi",videoTranslationHelp:"Videoda kaynak altyazının altında çeviriyi gösterir.",
      panelTranslation:"Panel çevirisi",panelTranslationHelp:"Cümleler sekmesindeki satırlarda çeviriyi gösterir.",
      followActiveSubtitle:"Aktif altyazıyı otomatik takip et",followActiveSubtitleHelp:"Video ilerledikçe paneli oynatılan altyazı satırına kaydırır.",playbackBehavior:"Video davranışı",pauseOnWordHover:"Altyazı alanına gelince videoyu durdur",pauseOnWordHoverHelp:"Mouse Almanca/Türkçe altyazı alanındayken videoyu durdurur. Kelime açıklama penceresine geçildiğinde de video durmaya devam eder; ikisinden de çıkınca daha önce oynuyorsa devam eder.",autoPauseAfterSentence:"Her altyazı cümlesinden sonra durdur",autoPauseAfterSentenceHelp:"Her zamanlı altyazı bölümünün sonunda videoyu otomatik durdurur.",
      textSize:"Yazı boyutu",sourceSubtitle:"Kaynak altyazı",translationSubtitle:"Çeviri altyazısı",
      subtitles:"Cümleler",words:"Kelimeler",saved:"Kaydedilenler",active:"Aktif",inactive:"Pasif",
      translation:"Çeviri",waitingSubtitles:"İçerikte cümle bekleniyor…",openPanel:"Language Learning panelini aç",collapsePanel:"Paneli küçült",exportData:"Dışa aktar",exportTitle:"Dışa aktar",exportAll:"Tümü",exportSelected:"Seçilenler",exportOriginal:"Yalnız orijinal",exportBilingual:"Orijinal + Türkçe",exportTranslationOnly:"Yalnız Türkçe",exportFormat:"Format",exportContent:"İçerik",exportScope:"Kapsam",exportDownload:"Aktar",exportCancel:"Vazgeç",exportSelectAll:"Tümünü seç",globalSaved:"Tüm kayıtlar",inThisContent:"Bu içerikte"
    },
    en:{
      settings:"Settings",close:"Close",general:"General",interfaceLanguage:"Interface language",theme:"Theme",themeSystem:"System",themeLight:"Light",themeDark:"Dark",
      languageLearningActive:"Language Learning active",languageLearningActiveHelp:"Turns the video and panel features on or off together.",monitoring:"Monitoring",systemMonitor:"System Monitor panel",systemMonitorHelp:"Shows translation engines, AI usage and future diagnostics in the left-side monitor.",
      translationView:"Translation display",videoTranslation:"Video translation",videoTranslationHelp:"Shows the translation below the source subtitle on the video.",
      panelTranslation:"Panel translation",panelTranslationHelp:"Shows translations below sentences inside the panel.",
      followActiveSubtitle:"Follow active subtitle",followActiveSubtitleHelp:"Scrolls the panel to the currently playing subtitle.",playbackBehavior:"Playback behavior",pauseOnWordHover:"Pause video while hovering subtitles",pauseOnWordHoverHelp:"Pauses while the pointer is over the source/translation subtitle card. It stays paused when moving into the word tooltip and resumes after leaving both if it was playing before.",autoPauseAfterSentence:"Pause after every subtitle sentence",autoPauseAfterSentenceHelp:"Automatically pauses at the end of each timed subtitle cue.",
      textSize:"Text size",sourceSubtitle:"Source subtitle",translationSubtitle:"Translation subtitle",
      subtitles:"Sentences",words:"Words",saved:"Saved",active:"Active",inactive:"Inactive",
      translation:"Translation",waitingSubtitles:"Waiting for sentences…",openPanel:"Open Language Learning panel",collapsePanel:"Collapse panel",exportData:"Export",exportTitle:"Export",exportAll:"All",exportSelected:"Selected",exportOriginal:"Original only",exportBilingual:"Original + Turkish",exportTranslationOnly:"Turkish only",exportFormat:"Format",exportContent:"Content",exportScope:"Scope",exportDownload:"Export",exportCancel:"Cancel",exportSelectAll:"Select all",globalSaved:"All saved",inThisContent:"In this content"
    },
    de:{
      settings:"Einstellungen",close:"Schließen",general:"Allgemein",interfaceLanguage:"Oberflächensprache",theme:"Design",themeSystem:"System",themeLight:"Hell",themeDark:"Dunkel",
      languageLearningActive:"Language Learning aktiv",languageLearningActiveHelp:"Schaltet Video- und Panel-Funktionen gemeinsam ein oder aus.",monitoring:"Überwachung",systemMonitor:"Systemmonitor",systemMonitorHelp:"Zeigt Übersetzungsmotoren, AI-Nutzung und zukünftige Diagnosen im linken Monitor.",
      translationView:"Übersetzungsanzeige",videoTranslation:"Videoübersetzung",videoTranslationHelp:"Zeigt die Übersetzung unter dem Quelluntertitel im Video.",
      panelTranslation:"Panelübersetzung",panelTranslationHelp:"Zeigt Übersetzungen unter den Sätzen im Panel.",
      followActiveSubtitle:"Aktiven Untertitel automatisch verfolgen",followActiveSubtitleHelp:"Scrollt das Panel zum aktuell abgespielten Untertitel.",playbackBehavior:"Videowiedergabe",pauseOnWordHover:"Video beim Überfahren des Untertitelbereichs pausieren",pauseOnWordHoverHelp:"Pausiert, solange der Mauszeiger über dem Quell-/Übersetzungsbereich liegt. Beim Wechsel in das Wort-Popup bleibt das Video pausiert und läuft erst nach Verlassen beider Bereiche weiter, wenn es vorher lief.",autoPauseAfterSentence:"Nach jedem Untertitelsatz pausieren",autoPauseAfterSentenceHelp:"Pausiert das Video automatisch am Ende jedes zeitgesteuerten Untertitels.",
      textSize:"Textgröße",sourceSubtitle:"Quelluntertitel",translationSubtitle:"Übersetzungsuntertitel",
      subtitles:"Sätze",words:"Wörter",saved:"Gespeichert",active:"Aktiv",inactive:"Inaktiv",
      translation:"Übersetzung",waitingSubtitles:"Sätze werden geladen…",openPanel:"Language-Learning-Panel öffnen",collapsePanel:"Panel einklappen",exportData:"Exportieren",exportTitle:"Exportieren",exportAll:"Alle",exportSelected:"Ausgewählte",exportOriginal:"Nur Original",exportBilingual:"Original + Türkisch",exportTranslationOnly:"Nur Türkisch",exportFormat:"Format",exportContent:"Inhalt",exportScope:"Umfang",exportDownload:"Exportieren",exportCancel:"Abbrechen",exportSelectAll:"Alle auswählen",globalSaved:"Alle gespeicherten",inThisContent:"In diesem Inhalt"
    }
  };

  const state = {
    cache:new Map(),
    panelTranslationCache:new Map(),
    analysisInflight:new Map(),
    aiIndexBusy:false,
    aiIndexLastStatus:"",
    aiIndexDiagnostic:null,
    aiLabDialog:null,
    aiLabCollapsed:false,
    aiLabWidth:350,
    aiLabHandle:null,
    monitorMainTab:"translation",
    monitorTranslationTab:"ai",
    localDiagnostic:null,
    aiProgressTimer:null,
    aiCoverage:"unknown",
    localCoverage:"unknown",
    localLookupSignature:"",
    aiUsageSummary:null,
    aiUsageBusy:false,
    aiLookupSignature:"",
    aiLookupTimer:null,
    aiLookupBusy:false,
    tooltip:null,
    tooltipHideTimer:null,
    settingsHydrated:false,
    settings:{extensionEnabled:true,systemMonitorEnabled:true,systemMonitorCollapsed:false,systemMonitorWidth:350,showVideoTranslation:true,showPanelTranslation:true,followActiveSubtitle:true,pauseOnWordHover:false,autoPauseAfterSentence:false,interfaceLanguage:"tr",theme:"dark",panelWidthFactor:1,germanFontSize:100,translationFontSize:100,youtubeSubtitlePositionY:82,zdfSubtitlePositionY:88,tooltipPositionLocked:false,tooltipPersistent:false,tooltipHoverMode:false,tooltipLeft:null,tooltipTop:null},
    playback:{hoverVideo:null,hoverAnchor:null,hoverResume:false,hoverResumeTimer:null,autoPausedCueKey:"",autoPauseReleasedCueKey:"",autoPauseTimer:null,autoPauseScheduledKey:""},
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
      savedSearch:"",
      subtitleSearch:"",
      savedView:"learning",
      savedOccurrencePositions:{},
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
    zdf:{videoId:"",video:null,cues:null,cueIndex:-1,overlay:null,germanLine:null,loading:false,loaded:false,error:"",frameId:null,videoListeners:null},
    web:{segments:[],signature:"",url:"",highlightTimer:null,annotationRun:0,annotationLayer:null,annotationLabels:[],annotationTimer:null,interactionReady:false,hoverTimer:null,hoverKey:"",tooltipPinnedKey:"",learningSyncTimer:null}
  };

  const adapter=ADAPTERS.find(a=>a.host.test(location.hostname)) || {id:"web",host:/.*/,selectors:[]};


  function uiText(key){
    const lang=state.settings.interfaceLanguage||"tr";
    return UI_STRINGS[lang]?.[key] || UI_STRINGS.tr[key] || key;
  }

  function analysisSourcePriority(data){
    if(data?.analysis_source==="ai") return 3;
    if(data?.analysis_source==="local") return 2;
    return 1;
  }

  function setAnalysisCache(text,data){
    if(!text || !data) return data;
    const current=state.cache.get(text);
    if(!current || analysisSourcePriority(data)>=analysisSourcePriority(current)){
      state.cache.set(text,data);
      if(data.sentence_meaning_tr) state.panelTranslationCache.set(text,data.sentence_meaning_tr);
    }
    return state.cache.get(text)||data;
  }

  function activeTranslationSourceSummary(){
    const request=currentAiIndexRequest();
    const cues=Array.isArray(request?.cues)?request.cues:[];
    let ai=0, local=0, other=0, total=0;
    for(const cue of cues){
      const text=String(cue?.text||"").trim();
      if(!text) continue;
      total+=1;
      const source=state.cache.get(text)?.analysis_source||"";
      if(source==="ai") ai+=1;
      else if(source==="local") local+=1;
      else other+=1;
    }
    return {ai,local,other,total};
  }

  function updateSharedPanelUi(){
    const panel=state.panel.element;
    if(!panel) return;
    const active=state.settings.extensionEnabled!==false;
    const label=panel.querySelector(".gle-master-switch em");
    if(label) label.textContent=active?uiText("active"):uiText("inactive");
    const exportButton=panel.querySelector(".gle-header-export");
    if(exportButton){
      exportButton.title=uiText("exportData");
      exportButton.setAttribute("aria-label",uiText("exportData"));
    }

    const aiButton=panel.querySelector(".gle-header-ai-analyze");
    const geButton=panel.querySelector(".gle-header-ge-status");
    const sourceSummary=activeTranslationSourceSummary();
    const hasActiveSources=sourceSummary.total>0;
    const allAi=hasActiveSources && sourceSummary.ai===sourceSummary.total;
    const allGe=hasActiveSources && sourceSummary.local===sourceSummary.total;
    const mixedAiGe=sourceSummary.ai>0 && sourceSummary.local>0;
    const partialAi=sourceSummary.ai>0 && !allAi;
    const partialGe=sourceSummary.local>0 && !allGe;

    if(aiButton){
      aiButton.disabled=false;
      aiButton.classList.remove("ai-full","ai-partial","ai-none","ai-running","source-mixed");
      // Active translation provenance owns the color. "Busy" must never mask
      // progressive AI results that are already visible on the page.
      if(allAi){
        aiButton.classList.add("ai-full");
        aiButton.textContent=state.aiIndexBusy?"AI… ✓":"AI ✓";
        aiButton.title=state.aiIndexBusy
          ? "AI analizi sürüyor; ekrandaki aktif çevirilerin tamamı şu anda AI"
          : "Ekrandaki çevirilerin tamamı AI/AI veritabanından";
      }else if(partialAi){
        aiButton.classList.add(mixedAiGe?"source-mixed":"ai-partial");
        aiButton.textContent=state.aiIndexBusy?"AI… +":"AI +";
        aiButton.title=mixedAiGe
          ? (state.aiIndexBusy
              ? "AI analizi sürüyor; aktif kaynak karışık: bazı cümleler AI, bazıları German Engine/local"
              : "Karışık kaynak: bazı cümleler AI, bazıları German Engine/local")
          : "Bazı cümleler AI; kalan cümlelerde başka/fallback kaynak kullanılıyor";
      }else if(state.aiIndexBusy){
        aiButton.classList.add("ai-running");
        aiButton.textContent="AI…";
        aiButton.title="AI analizi sürüyor; henüz ekranda aktif AI cümlesi yok";
      }else{
        aiButton.classList.add("ai-none");
        aiButton.textContent="AI";
        aiButton.title=state.aiLookupBusy
          ? "Mevcut AI analizi veritabanında kontrol ediliyor"
          : "Ekranda aktif AI çevirisi yok; tıklayınca yalnız AI eksikleri analiz edilir";
      }
      aiButton.setAttribute("aria-label",aiButton.title);
    }

    if(geButton){
      geButton.classList.remove("ge-full","ge-partial","source-mixed","ge-idle");
      if(allAi){
        geButton.classList.add("ge-idle");
        geButton.textContent="GE";
        geButton.title="German Engine/local verisi saklı olabilir ancak ekranda aktif kaynak AI";
      }else if(mixedAiGe){
        geButton.classList.add("source-mixed");
        geButton.textContent="GE +";
        geButton.title="Karışık kaynak: AI olmayan cümlelerde German Engine/local aktif";
      }else if(allGe){
        geButton.classList.add("ge-full");
        geButton.textContent="GE ✓";
        geButton.title="Ekrandaki çevirilerin tamamı German Engine/local kaynağından";
      }else if(partialGe){
        geButton.classList.add("ge-partial");
        geButton.textContent="GE +";
        geButton.title="Ekrandaki cümlelerin bir kısmında German Engine/local aktif";
      }else{
        geButton.classList.add("ge-idle");
        geButton.textContent="GE";
        geButton.title="Ekranda aktif German Engine/local çevirisi yok";
      }
      geButton.setAttribute("aria-label",geButton.title);
    }

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
    dialog.innerHTML='<div class="gle-settings-card" role="dialog" aria-modal="true" aria-labelledby="gle-settings-title"><header><strong id="gle-settings-title">Language Learning · '+esc(uiText("settings"))+'</strong><button type="button" class="gle-settings-close" aria-label="'+escAttr(uiText("close"))+'">×</button></header><div class="gle-settings-body"><section class="gle-settings-section"><h3>'+esc(uiText("general"))+'</h3><label class="gle-settings-select"><span>'+esc(uiText("interfaceLanguage"))+'</span><select name="interfaceLanguage"><option value="tr">Türkçe</option><option value="en">English</option><option value="de">Deutsch</option></select></label><label class="gle-settings-select"><span>'+esc(uiText("theme"))+'</span><select name="theme"><option value="system">'+esc(uiText("themeSystem"))+'</option><option value="light">'+esc(uiText("themeLight"))+'</option><option value="dark">'+esc(uiText("themeDark"))+'</option></select></label><label class="gle-settings-toggle"><span class="gle-settings-copy"><b>'+esc(uiText("languageLearningActive"))+'</b><small>'+esc(uiText("languageLearningActiveHelp"))+'</small></span><input name="extensionEnabled" type="checkbox"><span class="gle-settings-track"></span></label></section><section class="gle-settings-section"><h3>'+esc(uiText("monitoring"))+'</h3><label class="gle-settings-toggle"><span class="gle-settings-copy"><b>'+esc(uiText("systemMonitor"))+'</b><small>'+esc(uiText("systemMonitorHelp"))+'</small></span><input name="systemMonitorEnabled" type="checkbox"><span class="gle-settings-track"></span></label></section><section class="gle-settings-section"><h3>'+esc(uiText("translationView"))+'</h3><label class="gle-settings-toggle"><span class="gle-settings-copy"><b>'+esc(uiText("videoTranslation"))+'</b><small>'+esc(uiText("videoTranslationHelp"))+'</small></span><input name="showVideoTranslation" type="checkbox"><span class="gle-settings-track"></span></label><label class="gle-settings-toggle"><span class="gle-settings-copy"><b>'+esc(uiText("panelTranslation"))+'</b><small>'+esc(uiText("panelTranslationHelp"))+'</small></span><input name="showPanelTranslation" type="checkbox"><span class="gle-settings-track"></span></label><label class="gle-settings-toggle"><span class="gle-settings-copy"><b>'+esc(uiText("followActiveSubtitle"))+'</b><small>'+esc(uiText("followActiveSubtitleHelp"))+'</small></span><input name="followActiveSubtitle" type="checkbox"><span class="gle-settings-track"></span></label></section><section class="gle-settings-section"><h3>'+esc(uiText("playbackBehavior"))+'</h3><label class="gle-settings-toggle"><span class="gle-settings-copy"><b>'+esc(uiText("pauseOnWordHover"))+'</b><small>'+esc(uiText("pauseOnWordHoverHelp"))+'</small></span><input name="pauseOnWordHover" type="checkbox"><span class="gle-settings-track"></span></label><label class="gle-settings-toggle"><span class="gle-settings-copy"><b>'+esc(uiText("autoPauseAfterSentence"))+'</b><small>'+esc(uiText("autoPauseAfterSentenceHelp"))+'</small></span><input name="autoPauseAfterSentence" type="checkbox"><span class="gle-settings-track"></span></label></section><section class="gle-settings-section"><h3>'+esc(uiText("textSize"))+'</h3><label>'+esc(uiText("sourceSubtitle"))+' <output data-for="germanFontSize"></output><input name="germanFontSize" type="range" min="70" max="180" step="5"></label><label>'+esc(uiText("translationSubtitle"))+' <output data-for="translationFontSize"></output><input name="translationFontSize" type="range" min="70" max="180" step="5"></label></section></div></div>';
    document.documentElement.appendChild(dialog);
    const sync=()=>{
      for(const name of ["germanFontSize","translationFontSize"]){
        const input=dialog.querySelector('[name="'+name+'"]');
        input.value=state.settings[name];
        dialog.querySelector('[data-for="'+name+'"]').textContent=state.settings[name]+"%";
      }
      dialog.querySelector('[name="interfaceLanguage"]').value=state.settings.interfaceLanguage||"tr";
      dialog.querySelector('[name="theme"]').value=state.settings.theme||"system";
      for(const name of ["extensionEnabled","systemMonitorEnabled","showVideoTranslation","showPanelTranslation","followActiveSubtitle","pauseOnWordHover","autoPauseAfterSentence"]){
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
    for(const name of ["extensionEnabled","systemMonitorEnabled","showVideoTranslation","showPanelTranslation","followActiveSubtitle","pauseOnWordHover","autoPauseAfterSentence"]){
      dialog.querySelector('[name="'+name+'"]').addEventListener("change",async event=>{
        state.settings[name]=event.target.checked;
        await chrome.storage.sync.set({[name]:event.target.checked});
        if(name==="extensionEnabled") renderPlayerControls();
        if(name==="systemMonitorEnabled") syncSystemMonitorVisibility();
        if(name==="showVideoTranslation") refreshVideoTranslations();
        if(name==="showPanelTranslation" && state.panel.tab==="subtitles") renderSharedPanel();
        if(name==="pauseOnWordHover" && !event.target.checked) finishSubtitleHoverPause();
        if(name==="autoPauseAfterSentence" && !event.target.checked){ state.playback.autoPausedCueKey=""; state.playback.autoPauseReleasedCueKey=""; clearAutoPauseTimer(); }
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

  function tooltipPersistent(){
    return state.settings.tooltipPersistent===true;
  }

  function scheduleTooltipHide(delay=240){
    if(tooltipPersistent()) return;
    if(adapter.id==="web" && state.web.tooltipPinnedKey) return;
    if(state.tooltipHideTimer) return;
    state.tooltipHideTimer=setTimeout(()=>{
      state.tooltipHideTimer=null;
      if(tooltipPersistent()) return;
      if(adapter.id==="web" && state.web.tooltipPinnedKey) return;
      if(state.tooltip) state.tooltip.hidden=true;
    },delay);
  }

  function tooltipToolbarHtml(){
    const locked=state.settings.tooltipPositionLocked===true;
    const persistent=state.settings.tooltipPersistent===true;
    const hoverMode=state.settings.tooltipHoverMode===true;
    return '<div class="gle-tooltip-tools">'+
      '<span class="gle-tooltip-tools-spacer"></span>'+
      '<button type="button" class="gle-tooltip-tool gle-tooltip-hover-tool '+(hoverMode?'active':'')+'" data-tooltip-hover-mode title="Hover modu: kelimenin üstüne gelince analiz et" aria-label="Hover modu">Hover</button>'+
      '<button type="button" class="gle-tooltip-tool '+(locked?'active':'')+'" data-tooltip-position-lock title="Konumu sabitle" aria-label="Konumu sabitle">📌</button>'+
      '<button type="button" class="gle-tooltip-tool '+(persistent?'active':'')+'" data-tooltip-persistent title="Sürekli görünür" aria-label="Sürekli görünür">👁</button>'+
    '</div>';
  }

  function syncTooltipToolStates(){
    if(!state.tooltip) return;
    state.tooltip.querySelector("[data-tooltip-hover-mode]")?.classList.toggle("active",state.settings.tooltipHoverMode===true);
    state.tooltip.querySelector("[data-tooltip-position-lock]")?.classList.toggle("active",state.settings.tooltipPositionLocked===true);
    state.tooltip.querySelector("[data-tooltip-persistent]")?.classList.toggle("active",state.settings.tooltipPersistent===true);
  }

  function clampTooltipPosition(left,top){
    const el=state.tooltip;
    const width=el?.offsetWidth||360;
    const height=el?.offsetHeight||180;
    return {
      left:Math.max(8,Math.min(Number(left)||8,window.innerWidth-width-8)),
      top:Math.max(8,Math.min(Number(top)||8,window.innerHeight-height-8)),
    };
  }

  function applyTooltipPosition(anchor){
    const locked=state.settings.tooltipPositionLocked===true;
    const savedLeft=Number(state.settings.tooltipLeft);
    const savedTop=Number(state.settings.tooltipTop);
    if(locked && Number.isFinite(savedLeft) && Number.isFinite(savedTop)){
      const pos=clampTooltipPosition(savedLeft,savedTop);
      state.tooltip.style.left=pos.left+"px";
      state.tooltip.style.top=pos.top+"px";
      return;
    }
    const r=anchor?.getBoundingClientRect?.();
    if(!r) return;
    const pos=clampTooltipPosition(r.left,r.top-state.tooltip.offsetHeight-10);
    state.tooltip.style.left=pos.left+"px";
    state.tooltip.style.top=pos.top+"px";
  }

  function createTooltip(){
    const el=document.createElement("div");
    el.id="gle-tooltip";
    el.hidden=true;
    el.addEventListener("mouseenter",()=>{
      cancelTooltipHide();
      cancelSubtitleHoverResume();
    });
    el.addEventListener("mouseleave",event=>{
      scheduleTooltipHide(350);
      const next=event.relatedTarget;
      if(next && state.playback.hoverAnchor?.contains?.(next)) return;
      scheduleSubtitleHoverResume();
    });

    let drag=null;
    el.addEventListener("pointerdown",event=>{
      const toolbar=event.target.closest?.(".gle-tooltip-tools");
      if(!toolbar) return;
      if(event.target.closest?.("button,[data-tooltip-hover-mode],[data-tooltip-position-lock],[data-tooltip-persistent]")) return;
      event.preventDefault();
      event.stopPropagation();
      const rect=el.getBoundingClientRect();
      drag={dx:event.clientX-rect.left,dy:event.clientY-rect.top,pointerId:event.pointerId};
      el.classList.add("gle-tooltip-dragging");
      try{ toolbar.setPointerCapture(event.pointerId); }catch(_error){}
    });
    document.addEventListener("pointermove",event=>{
      if(!drag || event.pointerId!==drag.pointerId) return;
      const pos=clampTooltipPosition(event.clientX-drag.dx,event.clientY-drag.dy);
      el.style.left=pos.left+"px";
      el.style.top=pos.top+"px";
      state.settings.tooltipLeft=pos.left;
      state.settings.tooltipTop=pos.top;
    },true);
    document.addEventListener("pointerup",event=>{
      if(!drag || event.pointerId!==drag.pointerId) return;
      drag=null;
      el.classList.remove("gle-tooltip-dragging");
      if(state.settings.tooltipPositionLocked===true){
        chrome.storage.sync.set({tooltipLeft:state.settings.tooltipLeft,tooltipTop:state.settings.tooltipTop});
      }
    },true);

    el.addEventListener("click",event=>{
      const lockButton=event.target.closest?.("[data-tooltip-position-lock]");
      if(lockButton){
        event.preventDefault();
        event.stopPropagation();
        const next=state.settings.tooltipPositionLocked!==true;
        state.settings.tooltipPositionLocked=next;
        if(next){
          const rect=el.getBoundingClientRect();
          const pos=clampTooltipPosition(rect.left,rect.top);
          state.settings.tooltipLeft=pos.left;
          state.settings.tooltipTop=pos.top;
          chrome.storage.sync.set({tooltipPositionLocked:true,tooltipLeft:pos.left,tooltipTop:pos.top});
        }else{
          chrome.storage.sync.set({tooltipPositionLocked:false});
        }
        syncTooltipToolStates();
        return;
      }
      const hoverButton=event.target.closest?.("[data-tooltip-hover-mode]");
      if(hoverButton){
        event.preventDefault();
        event.stopPropagation();
        const next=state.settings.tooltipHoverMode!==true;
        state.settings.tooltipHoverMode=next;
        chrome.storage.sync.set({tooltipHoverMode:next});
        clearTimeout(state.web.hoverTimer);
        state.web.hoverKey="";
        syncTooltipToolStates();
        return;
      }
      const persistentButton=event.target.closest?.("[data-tooltip-persistent]");
      if(persistentButton){
        event.preventDefault();
        event.stopPropagation();
        const next=state.settings.tooltipPersistent!==true;
        state.settings.tooltipPersistent=next;
        chrome.storage.sync.set({tooltipPersistent:next});
        if(next) cancelTooltipHide();
        syncTooltipToolStates();
      }
    });

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

  function normalizeLearningIdentity(value){
    return sanitizeLearningText(value)
      .toLocaleLowerCase("de-DE")
      .replace(/[(){}\[\],;:!?]/g," ")
      .replace(/\s+/g," ")
      .trim();
  }

  function expressionIdentitySet(value){
    const out=new Set();
    if(!value) return out;
    for(const candidate of [
      value.patternId,value.pattern_id,value.key,value.canonical,value.label,
      value.expressionEntry?.patternId,value.expressionEntry?.canonical
    ]){
      const normalized=normalizeLearningIdentity(candidate);
      if(!normalized) continue;
      out.add(normalized);
      const pipe=normalized.indexOf("|");
      if(pipe>=0 && pipe<normalized.length-1) out.add(normalized.slice(pipe+1));
    }
    return out;
  }

  function expressionIdentityMatches(a,b){
    const left=expressionIdentitySet(a);
    const right=expressionIdentitySet(b);
    for(const key of left) if(right.has(key)) return true;
    return false;
  }

  function learningItemForExpression(entry){
    return state.learningItems.find(item=>item.kind==="expression" && expressionIdentityMatches(item,entry));
  }

  function panelWordLabel(entry){
    const lemma=sanitizeLearningText(entry?.lemma||"");
    if(!lemma) return "";
    const pos=String(entry?.pos||"").toUpperCase();
    const singular=sanitizeLearningText(entry?.singular||lemma);
    const article=sanitizeLearningText(entry?.article||"");
    const plural=sanitizeLearningText(entry?.plural||"");
    const base=(pos==="NOUN" || pos==="PROPN")
      ? singular.charAt(0).toLocaleUpperCase("de-DE")+singular.slice(1)
      : lemma;
    return pos==="NOUN" && article
      ? article+" "+base+(plural?" · Pl. "+plural:"")
      : base;
  }

  async function announceLearningStateChange(){
    try{ await chrome.storage.local.set({gleLearningRevision:Date.now()}); }catch(_error){}
  }

  function scheduleRemoteLearningReload(){
    clearTimeout(state.web.learningSyncTimer);
    state.web.learningSyncTimer=setTimeout(()=>{
      loadLearningItems().catch(error=>console.warn("Cross-tab learning sync failed",error));
    },120);
  }

  function isLearning(kind,key){
    const wanted=learningKey(kind,key);
    return state.learningItems.some(item=>learningKey(item.kind,item.key)===wanted);
  }

  async function platformApiBase(){
    const {platformApiUrl="http://127.0.0.1:8000"}=await chrome.storage.sync.get("platformApiUrl");
    return platformApiUrl.replace(/\/$/,"");
  }

  async function platformFetch(url,options={}){
    const result=await chrome.runtime.sendMessage({type:"gle-platform-fetch",url,options});
    if(!result) throw new Error("platform-fetch-no-response");
    if(result.error && !result.status) throw new Error(result.error);
    return {
      ok:Boolean(result.ok),
      status:Number(result.status||0),
      statusText:result.statusText||"",
      text:async()=>result.body||"",
      json:async()=>JSON.parse(result.body||"null"),
    };
  }

  const LEARNING_ITEM_ALIASES=[
    {
      oldKeys:["prepared:widerstand regt sich"],
      oldLabels:["Widerstand regt sich"],
      newKey:"prepared:sich regen",
      newLabel:"sich regen",
      meaningTr:"ortaya çıkmak, baş göstermek; burada: itiraz / direnç oluşmak",
    },
    {
      oldKeys:["prepared:jemandem fällt etwas auf"],
      oldLabels:["jemandem fällt etwas auf"],
      newKey:"prepared:jemandem auffallen",
      newLabel:"jemandem auffallen",
      meaningTr:"birinin dikkatini çekmek",
    },
    {
      oldKeys:["prepared:viel vorhaben"],
      oldLabels:["viel vorhaben"],
      newKey:"prepared:vorhaben",
      newLabel:"vorhaben",
      meaningTr:"planlamak, niyetinde olmak",
    },
  ];

  function learningAliasForRawItem(item){
    const key=normalizeLearningIdentity(item?.canonical_key||"");
    const label=normalizeLearningIdentity(item?.canonical_form||"");
    return LEARNING_ITEM_ALIASES.find(alias=>
      alias.oldKeys.some(value=>normalizeLearningIdentity(value)===key) ||
      alias.oldLabels.some(value=>normalizeLearningIdentity(value)===label)
    ) || null;
  }

  async function migrateLearningItemAliases(rawItems,profileId,apiBase){
    let changed=false;
    const items=Array.isArray(rawItems)?rawItems:[];
    for(const oldItem of items){
      if(oldItem?.category!=="expression") continue;
      const alias=learningAliasForRawItem(oldItem);
      if(!alias || !oldItem.id) continue;

      const existingTarget=items.find(item=>
        item?.category==="expression" &&
        normalizeLearningIdentity(item.canonical_key)===normalizeLearningIdentity(alias.newKey)
      );

      let targetId=existingTarget?.id||null;
      if(!targetId){
        const create=await platformFetch(apiBase+"/api/v1/learning-items",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            profile_id:profileId,
            canonical_form:alias.newLabel,
            canonical_key:alias.newKey,
            category:"expression",
            status:oldItem.status||"learning",
            meaning:alias.meaningTr||((oldItem.translations||[]).find(entry=>entry.language==="tr")?.meaning)||null,
            meaning_language:"tr",
            metadata:{...(oldItem.metadata||{}),migrated_from_canonical:oldItem.canonical_key||oldItem.canonical_form||""},
          }),
        });
        if(!create.ok) continue;
        try{ targetId=(await create.json())?.id||null; }catch(_error){}
      }

      if(targetId){
        for(const encounter of oldItem.encounters||[]){
          const body={
            learning_item_id:targetId,
            surface_form:encounter.surface_form||alias.newLabel,
            sentence:encounter.sentence||"",
            provider:encounter.provider||"",
            source_type:encounter.source_type||"",
            external_id:encounter.external_id||"",
            url:encounter.url||"",
            title:encounter.title||null,
            media_timestamp_ms:encounter.media_timestamp_ms??null,
            media_end_timestamp_ms:encounter.media_end_timestamp_ms??null,
            context:encounter.context||{},
          };
          if(!body.sentence) continue;
          await platformFetch(apiBase+"/api/v1/encounters",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(body),
          }).catch(()=>{});
        }
      }

      const remove=await platformFetch(apiBase+"/api/v1/learning-items/"+encodeURIComponent(oldItem.id),{method:"DELETE"});
      if(remove.ok || remove.status===404) changed=true;
    }
    return changed;
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
      metadata:item.metadata||{},
    };
  }

  function refreshLearningHighlights(){
    if(adapter.id==="web"){
      if(state.panel.element) renderSharedPanel();
      scheduleWebLearningAnnotations();
      return;
    }
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
    const response=await platformFetch(apiBase+"/api/v1/profiles/ensure",{
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
        await platformFetch(apiBase+"/api/v1/learning-items",{
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
    let response=await platformFetch(apiBase+"/api/v1/learning-items?profile_id="+encodeURIComponent(profileId));
    if(!response.ok) throw new Error("Platform API learning items "+response.status);
    let payload=await response.json();

    if(await migrateLearningItemAliases(payload.items||[],profileId,apiBase)){
      response=await platformFetch(apiBase+"/api/v1/learning-items?profile_id="+encodeURIComponent(profileId));
      if(!response.ok) throw new Error("Platform API learning items "+response.status);
      payload=await response.json();
    }

    state.learningItems=(payload.items||[]).map(normalizeApiLearningItem);
    refreshLearningHighlights();
    if(["youtube","zdf","web"].includes(adapter.id) && state.panel.element && !state.panel.element.hidden){
      renderSharedPanel();
    }
  }

  async function saveLearningItem(item, encounterSnapshot=null){
    const normalized={...item,key:String(item.key||"").toLocaleLowerCase("de-DE")};
    const id=learningKey(normalized.kind,normalized.key);
    if(state.learningItems.some(existing=>learningKey(existing.kind,existing.key)===id)) return;
    const profileId=state.learningProfileId || await ensureLearningProfile();
    const apiBase=await platformApiBase();
    const response=await platformFetch(apiBase+"/api/v1/learning-items",{
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
        metadata:{source:"chrome-extension",content_source:currentContentDescriptor()},
      }),
    });
    if(!response.ok) throw new Error("Platform API learning item "+response.status);
    const created=await response.json();
    await captureCurrentEncounter(created.id,normalized.surface||normalized.label||normalized.key,encounterSnapshot);
    await loadLearningItems();
    await announceLearningStateChange();
    return created;
  }

  function currentContentDescriptor(){
    if(adapter.id==="youtube"){
      const videoId=state.youtube.videoId || new URL(location.href).searchParams.get("v") || "";
      return {provider:"youtube",sourceType:"video",externalId:videoId,url:"https://www.youtube.com/watch?v="+encodeURIComponent(videoId)};
    }
    if(adapter.id==="zdf"){
      return {provider:"zdf",sourceType:"video",externalId:state.zdf.videoId||location.href,url:location.href};
    }
    if(adapter.id==="web"){
      return {provider:"web",sourceType:"article",externalId:location.href,url:location.href};
    }
    return {provider:adapter.id||"web",sourceType:"page",externalId:location.href,url:location.href};
  }

  function webEncounterForAnchor(anchor,surfaceForm,contextualMeaning=""){
    if(adapter.id!=="web") return null;
    const normalizedSurface=normalizeLearningIdentity(surfaceForm);
    const anchorNode=anchor instanceof Node ? anchor : null;
    const candidates=(state.web.segments||[]).filter(segment=>{
      const text=normalizeLearningIdentity(segment?.text||"");
      return !normalizedSurface || text.includes(normalizedSurface);
    });
    const segment=candidates.find(candidate=>{
      const element=candidate?.sourceElement;
      if(!element?.isConnected || !anchorNode) return false;
      return element===anchorNode || element.contains(anchorNode) || (
        anchorNode.parentElement && element.contains(anchorNode.parentElement)
      );
    }) || candidates[0];
    if(!segment?.text) return null;

    const descriptor=currentContentDescriptor();
    return {
      surface_form:surfaceForm,
      sentence:segment.text,
      provider:descriptor.provider,
      source_type:descriptor.sourceType,
      external_id:descriptor.externalId,
      url:descriptor.url,
      title:document.title.trim()||null,
      media_timestamp_ms:null,
      media_end_timestamp_ms:null,
      context:{
        segment_index:segment.index,
        page_url:location.href,
        source:"web-hover",
        contextual_meaning_tr:contextualMeaning||"",
      },
    };
  }

  function currentContentEncounter(surfaceForm){
    const descriptor=currentContentDescriptor();
    if(!descriptor.externalId) return null;
    const cue=state.youtube.cues?.[state.youtube.cueIndex] || state.zdf.cues?.[state.zdf.cueIndex] || null;
    const video=adapter.id==="youtube"
      ? (state.youtube.video || document.querySelector("video.html5-main-video") || document.querySelector("video"))
      : adapter.id==="zdf"
        ? (state.zdf.video || document.querySelector("video"))
        : null;
    const fallbackStart=Math.max(0,Math.round((video?.currentTime||0)*1000));
    const startMs=Number.isFinite(cue?.startMs) ? Math.round(cue.startMs) : fallbackStart;
    const endMs=Number.isFinite(cue?.endMs) && cue.endMs>startMs ? Math.round(cue.endMs) : startMs+5000;
    const sentence=cue?.text || state.youtube.germanLine?.dataset.gleText || state.zdf.germanLine?.dataset.gleText || "";
    return {
      surface_form:surfaceForm,
      sentence,
      provider:descriptor.provider,
      source_type:descriptor.sourceType,
      external_id:descriptor.externalId,
      url:descriptor.url,
      title:(adapter.id==="youtube" ? document.title.replace(/\s*-\s*YouTube\s*$/u,"").trim() : document.title.trim()) || null,
      media_timestamp_ms:video ? startMs : null,
      media_end_timestamp_ms:video ? endMs : null,
      context:{cue_index:cue?.index ?? null,page_url:location.href},
    };
  }

  async function captureCurrentEncounter(learningItemId,surfaceForm,encounterSnapshot=null){
    const encounter=encounterSnapshot || currentContentEncounter(surfaceForm);
    if(!encounter || !encounter.sentence) return;
    const apiBase=await platformApiBase();
    const response=await platformFetch(apiBase+"/api/v1/encounters",{
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

    const snapshot=currentContentEncounter(surfaceForm);
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
    const response=await platformFetch(apiBase+"/api/v1/learning-items/"+encodeURIComponent(item.id),{method:"DELETE"});
    if(!response.ok && response.status!==404) throw new Error("Platform API learning item "+response.status);
    await loadLearningItems();
    await announceLearningStateChange();
  }

  function itemStatus(item){
    return item?.status==="learned" || item?.status==="known" ? "learned" : "learning";
  }

  async function setLearningStatus(payload,status,encounterSnapshot=null){
    const kind=payload.kind||"word";
    const key=String(payload.key||"").toLocaleLowerCase("de-DE");
    if(!key) return;
    const existing=state.learningItems.find(item=>learningKey(item.kind,item.key)===learningKey(kind,key));
    if(existing && itemStatus(existing)===status){
      await removeLearningItem(kind,key);
      return;
    }
    const profileId=state.learningProfileId || await ensureLearningProfile();
    const apiBase=await platformApiBase();
    const metadata={
      ...(existing?.metadata||{}),
      source:"chrome-extension",
      saved:status==="learning",
      content_source:existing?.metadata?.content_source||currentContentDescriptor(),
    };
    const response=await platformFetch(apiBase+"/api/v1/learning-items",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        profile_id:profileId,
        canonical_form:payload.label||existing?.label||key,
        canonical_key:key,
        category:kind,
        status,
        meaning:payload.meaning_tr||existing?.meaning_tr||null,
        meaning_language:(payload.meaning_tr||existing?.meaning_tr)?"tr":null,
        metadata,
      }),
    });
    if(!response.ok) throw new Error("learning status "+response.status);
    let updated=null;
    try{ updated=await response.json(); }catch(_error){}
    const targetId=updated?.id||existing?.id;
    if(targetId) await captureCurrentEncounter(
      targetId,
      payload.surface||payload.label||existing?.label||key,
      encounterSnapshot
    ).catch(()=>{});
    await loadLearningItems();
    await announceLearningStateChange();
  }

  async function setSavedFlag(item,saved){
    if(!item?.id) return;
    if(saved){
      await setLearningStatus({
        kind:item.kind,key:item.key,label:item.label,meaning_tr:item.meaning_tr
      },itemStatus(item));
      return;
    }
    await removeLearningItem(item.kind,item.key);
  }


  function meaningValues(value){
    if(Array.isArray(value)) return value.map(item=>sanitizeLearningText(item)).filter(Boolean);
    const cleaned=sanitizeLearningText(value||"");
    return cleaned?[cleaned]:[];
  }

  function firstMeaning(...values){
    for(const value of values){
      const items=meaningValues(value);
      if(items.length) return items[0];
    }
    return "";
  }

  async function enrichTooltipWithLexicalFallback(data,token,hit){
    if(!data || !token || tooltipHasMeaning(data,token.i)) return {data,token};
    const lexicalText=sanitizeLearningText(token.lemma||token.text||hit?.word||"");
    if(!lexicalText) return {data,token};
    try{
      const lexicalData=await analyzePlatform(lexicalText);
      const lexicalToken=(lexicalData.tokens||[]).find(item=>
        normalizeLearningIdentity(item.lemma||item.text)===normalizeLearningIdentity(lexicalText)
      ) || lexicalData.tokens?.[0];
      if(!lexicalToken) return {data,token};
      data=mergeTooltipMeaningData(data,token,lexicalData,lexicalToken);
    }catch(_error){}
    return {data,token};
  }

  function tooltipHasMeaning(data,tokenIndex){
    const h=data?.hover?.[String(tokenIndex)]||data?.hover?.[tokenIndex]||{};
    const expressions=h.primary_expressions||[];
    if(firstMeaning(h.contextual_word_meaning_tr,h.dictionary_meanings_tr)) return true;
    return expressions.some(expr=>firstMeaning(expr.contextual_meaning_tr,expr.meaning_tr));
  }

  function mergeTooltipMeaningData(primary,primaryToken,fallback,fallbackToken){
    if(!primary || !primaryToken || !fallback || !fallbackToken) return primary;
    const primaryKey=String(primaryToken.i);
    const fallbackHover=fallback.hover?.[String(fallbackToken.i)]||fallback.hover?.[fallbackToken.i]||{};
    const primaryHover=primary.hover?.[primaryKey]||primary.hover?.[primaryToken.i]||{};
    if(!primary.hover) primary.hover={};

    const merged={...primaryHover};
    if(!firstMeaning(merged.contextual_word_meaning_tr) && firstMeaning(fallbackHover.contextual_word_meaning_tr)){
      merged.contextual_word_meaning_tr=fallbackHover.contextual_word_meaning_tr;
    }
    if(!meaningValues(merged.dictionary_meanings_tr).length && meaningValues(fallbackHover.dictionary_meanings_tr).length){
      merged.dictionary_meanings_tr=fallbackHover.dictionary_meanings_tr;
    }
    if(!merged.lexical_form && fallbackHover.lexical_form) merged.lexical_form=fallbackHover.lexical_form;
    if(!(merged.usage_notes||[]).length && (fallbackHover.usage_notes||[]).length) merged.usage_notes=fallbackHover.usage_notes;

    const fallbackExpressions=fallbackHover.primary_expressions||[];
    if((merged.primary_expressions||[]).length){
      merged.primary_expressions=merged.primary_expressions.map(expr=>{
        if(firstMeaning(expr.contextual_meaning_tr,expr.meaning_tr)) return expr;
        const match=fallbackExpressions.find(candidate=>
          normalizeLearningIdentity(candidate.pattern_id||candidate.canonical||candidate.surface||"")===
          normalizeLearningIdentity(expr.pattern_id||expr.canonical||expr.surface||"")
        ) || fallbackExpressions[0];
        if(!match) return expr;
        return {
          ...expr,
          contextual_meaning_tr:firstMeaning(expr.contextual_meaning_tr,match.contextual_meaning_tr,match.meaning_tr),
          meaning_tr:meaningValues(expr.meaning_tr).length?expr.meaning_tr:match.meaning_tr,
          grammar_hint:expr.grammar_hint||match.grammar_hint||"",
          highlight_parts:[...(expr.highlight_parts||expr.highlightParts||match.highlight_parts||match.highlightParts||[])],
          highlight_exclude_parts:[...(expr.highlight_exclude_parts||expr.highlightExcludeParts||match.highlight_exclude_parts||match.highlightExcludeParts||[])],
        };
      });
    }else if(fallbackExpressions.length){
      merged.primary_expressions=fallbackExpressions;
    }

    primary.hover[primaryKey]=merged;
    return primary;
  }

  function renderCard(data, tokenIndex, anchor){
    cancelTooltipHide();
    const h=data.hover?.[String(tokenIndex)]||data.hover?.[tokenIndex]||{};
    const expressions=[...(h.primary_expressions||[])].sort((a,b)=>{
      const aTokens=(a.token_indices||[]).length;
      const bTokens=(b.token_indices||[]).length;
      if(aTokens!==bTokens) return bTokens-aTokens;
      return String(b.surface||b.canonical||"").length-String(a.surface||a.canonical||"").length;
    });
    const expr=expressions[0]||null;
    const lexical=h.lexical_form;
    const notes=h.usage_notes||[];
    const dictionaryMeanings=meaningValues(h.dictionary_meanings_tr);
    const sourceToken=(data.tokens||[]).find(token=>token.i===tokenIndex);
    const lemma=sourceToken?.lemma||sourceToken?.text||"";
    const nounLabel=lexical?.article
      ? sanitizeLearningText(lexical.article+" "+(lexical.singular||lemma))
      : lemma;
    const wordMeaning=firstMeaning(h.contextual_word_meaning_tr,dictionaryMeanings);
    const exprMeaning=expr
      ? firstMeaning(expr.contextual_meaning_tr,expr.meaning_tr)
      : "";

    if(lexical?.article){
      const entry=(state.youtube.transcriptAnalysis||[]).find(item=>
        String(item.lemma||"").toLocaleLowerCase("de-DE")===String(lemma||"").toLocaleLowerCase("de-DE")
      );
      if(entry){
        entry.article=sanitizeLearningText(lexical.article||entry.article||"");
        entry.singular=sanitizeLearningText(lexical.singular||entry.singular||lemma);
        entry.plural=sanitizeLearningText(lexical.plural||entry.plural||"");
      }
    }

    const aiBadge=data?.analysis_source==="ai"
      ? '<span class="gle-ai-source-badge" title="AI analizi">AI</span>'
      : "";
    const header=nounLabel
      ? '<div class="gle-hover-head"><b>'+esc(nounLabel)+'</b><span>'+esc(posLabel(sourceToken?.pos))+'</span>'+aiBadge+'</div>'
      : "";
    const contextual=wordMeaning
      ? '<div class="gle-context gle-context-primary">'+esc(wordMeaning)+'</div>'
      : '<div class="gle-note">Türkçe anlam bulunamadı.</div>';

    const plural=lexical?.article && lexical?.plural
      ? '<div class="gle-note"><b>Çoğul:</b> '+esc(lexical.article==="der"||lexical.article==="das"||lexical.article==="die"?"die ":"")+esc(lexical.plural)+'</div>'
      : "";

    const exprSurface=expr ? sanitizeLearningText(expr.surface||expr.canonical||"") : "";
    const exprCanonical=expr ? sanitizeLearningText(expr.canonical||"") : "";
    const expressionBlock=expr
      ? '<div class="gle-note"><b>Bağlı ifade:</b> '+esc(exprSurface)+'</div>'+
        (exprMeaning?'<div class="gle-context">'+esc(exprMeaning)+'</div>':'')+
        (exprCanonical && normalizeLearningIdentity(exprCanonical)!==normalizeLearningIdentity(exprSurface)
          ? '<div class="gle-note"><b>Yapı:</b> '+esc(exprCanonical)+'</div>'
          : '')+
        (expr.grammar_hint?'<div class="gle-note"><b>Gramer:</b> '+esc(expr.grammar_hint)+'</div>':'')
      : "";

    const otherMeanings=dictionaryMeanings.filter(value=>
      normalizeLearningIdentity(value)!==normalizeLearningIdentity(wordMeaning)
    );
    const standalone=otherMeanings.length
      ? '<div class="gle-standalone"><b>Diğer yaygın anlam:</b> '+esc(otherMeanings.join(", "))+'</div>'
      : "";

    const usage=notes.filter(note=>note.kind!=="GRAMMAR_ROLE")
      .map(note=>'<div class="gle-note"><b>'+esc(note.label)+'</b> · '+esc(note.explanation_tr)+'</div>')
      .join("");

    const learnTarget=expr ? {
      kind:"expression",
      key:expr.pattern_id||expr.canonical,
      label:expr.canonical||expr.surface,
      meaning:exprMeaning||wordMeaning,
      surface:expr.surface||expr.canonical||sourceToken?.text||lemma,
    } : {
      kind:"word",
      key:lemma,
      label:nounLabel,
      meaning:wordMeaning,
      surface:sourceToken?.text||lemma,
    };
    const encounterSnapshot=webEncounterForAnchor(anchor,learnTarget.surface,learnTarget.meaning) || currentContentEncounter(learnTarget.surface);
    const existingLearningItem=learnTarget.key
      ? state.learningItems.find(item=>learningKey(item.kind,item.key)===learningKey(learnTarget.kind,learnTarget.key))
      : null;
    const currentStatus=existingLearningItem ? itemStatus(existingLearningItem) : "";
    const learnAction=learnTarget.key
      ? '<div class="gle-learn-actions">'+
          '<button type="button" class="gle-learn-button gle-learn-star '+(currentStatus==="learning"?"active":"")+'" title="Öğreniyorum" data-kind="'+escAttr(learnTarget.kind)+'" data-key="'+escAttr(learnTarget.key)+'" data-label="'+escAttr(learnTarget.label)+'" data-meaning="'+escAttr(learnTarget.meaning)+'" data-surface="'+escAttr(learnTarget.surface)+'">'+(currentStatus==="learning"?"★":"☆")+'</button>'+
          '<button type="button" class="gle-learn-button gle-learn-known '+(currentStatus==="learned"?"active":"")+'" title="Biliyorum" data-kind="'+escAttr(learnTarget.kind)+'" data-key="'+escAttr(learnTarget.key)+'" data-label="'+escAttr(learnTarget.label)+'" data-meaning="'+escAttr(learnTarget.meaning)+'" data-surface="'+escAttr(learnTarget.surface)+'">✓</button>'+
        '</div>'
      : "";

    state.tooltip.innerHTML=tooltipToolbarHtml()+(header+contextual+plural+expressionBlock+standalone+usage+learnAction || "<div>Henüz analiz yok.</div>");
    const bindTooltipStatus=(selector,status)=>state.tooltip.querySelector(selector)?.addEventListener("click",async event=>{
      event.stopPropagation();
      const button=event.currentTarget;
      button.disabled=true;
      try{
        const payload={kind:button.dataset.kind,key:button.dataset.key,label:button.dataset.label,meaning_tr:button.dataset.meaning,surface:button.dataset.surface};
        await setLearningStatus(payload,status,encounterSnapshot);
        if(adapter.id==="web"){
          scheduleWebLearningAnnotations();
          renderCard(data,tokenIndex,anchor);
        }else{
          state.tooltip.hidden=true;
        }
      }catch(error){
        console.warn("Learning item sync failed",error);
      }finally{
        button.disabled=false;
      }
    });
    bindTooltipStatus(".gle-learn-star","learning");
    bindTooltipStatus(".gle-learn-known","learned");

    state.tooltip.hidden=false;
    syncTooltipToolStates();
    applyTooltipPosition(anchor);
  }

  function activePreparedBenchmark(){ return null; }

  function preparedNormalize(value){
    return String(value||"").replace(/\s+/g," ").trim().toLocaleLowerCase("de-DE");
  }

  function preparedTranslationForText(fixture,text){
    const normalized=preparedNormalize(text);
    if(!fixture || !normalized) return "";
    const rule=(fixture.translations||[]).find(item=>normalized.includes(preparedNormalize(item.match)));
    return rule?.tr||"";
  }

  function preparedItemOccurrences(forms){
    const needles=(forms||[]).map(preparedNormalize).filter(Boolean);
    const occurrences=[];
    (state.web.segments||[]).forEach((segment,index)=>{
      const text=preparedNormalize(segment.text);
      if(needles.some(needle=>text.includes(needle))) occurrences.push(index);
    });
    return occurrences;
  }

  function preparedWordAnalysis(fixture){
    return (fixture?.words||[]).map(item=>{
      const occurrences=preparedItemOccurrences(item.occurrenceForms||item.forms);
      return {
        lemma:item.lemma,
        pos:item.pos||"",
        count:occurrences.length,
        forms:[...(item.forms||[])],
        occurrences,
        article:"",
        singular:"",
        plural:"",
        meaningTr:item.meaningTr||""
      };
    }).filter(item=>item.count>0);
  }

  function preparedExpressionAnalysis(fixture){
    return (fixture?.expressions||[]).map(item=>{
      const occurrences=preparedItemOccurrences(item.forms);
      return {
        key:(item.type||"FIXED_CONSTRUCTION")+"|"+preparedNormalize(item.canonical),
        type:item.type||"FIXED_CONSTRUCTION",
        patternId:"prepared:"+preparedNormalize(item.canonical),
        canonical:item.canonical,
        count:occurrences.length,
        forms:[...(item.forms||[])],
        occurrences,
        meaningTr:item.meaningTr||"",
        grammarHint:item.grammarHint||"",
        highlightParts:[...(item.highlightParts||[])],
        highlightExcludeParts:[...(item.highlightExcludeParts||[])]
      };
    }).filter(item=>item.count>0);
  }

  function buildPreparedSentenceAnalysis(fixture,text){
    const source=String(text||"");
    const tokenMatches=[...source.matchAll(/[\p{L}\p{M}ßÄÖÜäöü]+|[^\s]/gu)];
    const words=fixture?.words||[];
    const expressions=fixture?.expressions||[];
    const tokens=tokenMatches.map((match,i)=>{
      const surface=match[0];
      const normalized=preparedNormalize(surface);
      const word=words.find(item=>(item.forms||[]).some(form=>preparedNormalize(form)===normalized) || preparedNormalize(item.lemma)===normalized);
      return {i,text:surface,lemma:word?.lemma||normalized,pos:word?.pos||(/[\p{L}]/u.test(surface)?"X":"PUNCT"),_start:match.index,_end:match.index+surface.length};
    });
    const foundExpressions=[];
    for(const expression of expressions){
      for(const form of expression.forms||[]){
        const at=source.toLocaleLowerCase("de-DE").indexOf(String(form).toLocaleLowerCase("de-DE"));
        if(at<0) continue;
        const end=at+String(form).length;
        const wantedParts=(expression.highlightParts||[]).map(preparedNormalize).filter(Boolean);
        const tokenIndices=tokens.filter(token=>{
          if(!(token._end>at && token._start<end)) return false;
          if(!wantedParts.length) return true;
          return wantedParts.includes(preparedNormalize(token.text));
        }).map(token=>token.i);
        foundExpressions.push({
          canonical:expression.canonical,
          surface:source.slice(at,end),
          type:expression.type||"FIXED_CONSTRUCTION",
          pattern_id:"prepared:"+preparedNormalize(expression.canonical),
          contextual_meaning_tr:expression.meaningTr||"",
          meaning_tr:expression.meaningTr?[expression.meaningTr]:[],
          grammar_hint:expression.grammarHint||"",
          token_indices:tokenIndices,
          highlight_parts:[...(expression.highlightParts||[])],
          highlight_exclude_parts:[...(expression.highlightExcludeParts||[])]
        });
        break;
      }
    }
    const hover={};
    for(const token of tokens){
      const normalized=preparedNormalize(token.text);
      const word=words.find(item=>(item.forms||[]).some(form=>preparedNormalize(form)===normalized) || preparedNormalize(item.lemma)===preparedNormalize(token.lemma));
      const related=foundExpressions
        .filter(expr=>(expr.token_indices||[]).includes(token.i))
        .sort((a,b)=>{
          const tokenDiff=(b.token_indices||[]).length-(a.token_indices||[]).length;
          if(tokenDiff) return tokenDiff;
          return String(b.canonical||"").length-String(a.canonical||"").length;
        });
      if(word || related.length){
        hover[String(token.i)]={
          contextual_word_meaning_tr:word?.meaningTr||"",
          dictionary_meanings_tr:word?.meaningTr?[word.meaningTr]:[],
          primary_expressions:related,
          usage_notes:[]
        };
      }
    }
    return {
      sentence_meaning_tr:preparedTranslationForText(fixture,source),
      tokens:tokens.map(({_start,_end,...token})=>token),
      hover,
      expressions:foundExpressions
    };
  }

  function preparedRangesForForms(forms){
    const ranges=[];
    for(const segment of state.web.segments||[]){
      const element=segment?.sourceElement;
      if(!element?.isConnected) continue;
      const fullText=String(element.textContent||"");
      const lower=fullText.toLocaleLowerCase("de-DE");
      for(const form of forms||[]){
        const needle=String(form||"");
        const needleLower=needle.toLocaleLowerCase("de-DE");
        let start=0;
        while(needleLower && (start=lower.indexOf(needleLower,start))!==-1){
          const range=webRangeFromOffsets(element,start,start+needle.length);
          if(range) ranges.push(range);
          start+=Math.max(1,needle.length);
        }
      }
    }
    return ranges;
  }

  function refreshPreparedBenchmarkHighlights(fixture){
    if(adapter.id!=="web" || !fixture || !CSS?.highlights) return;
    // Curated benchmark analysis still powers words, expressions and the PDF
    // review data, but the article itself stays visually quiet. Only the
    // user's own "Öğreniyorum" items are highlighted persistently in yellow.
    CSS.highlights.delete("gle-benchmark-word");
    CSS.highlights.delete("gle-benchmark-expression");
  }

  function indexedSegmentToAnalysis(segment){
    const tokens=(segment?.tokens||[]).map((token,index)=>({
      i:Number.isInteger(token?.i)?token.i:index,
      text:String(token?.surface||token?.text||""),
      lemma:String(token?.lemma||token?.surface||token?.text||""),
      pos:String(token?.pos||"X"),
      morphology:token?.morphology||{},
    }));
    const expressions=(segment?.expressions||[]).map(expression=>({
      canonical:String(expression?.canonical||expression?.surface||""),
      surface:String(expression?.surface||expression?.canonical||""),
      type:String(expression?.type||"FIXED_CONSTRUCTION"),
      pattern_id:String(expression?.pattern_id||("ai:"+String(expression?.type||"FIXED_CONSTRUCTION").toLowerCase()+":"+String(expression?.canonical||expression?.surface||"").toLocaleLowerCase("de-DE"))),
      contextual_meaning_tr:String(expression?.contextual_meaning_tr||""),
      meaning_tr:expression?.contextual_meaning_tr?[String(expression.contextual_meaning_tr)]:[],
      grammar_hint:String(expression?.grammar_hint||""),
      token_indices:[...(expression?.token_indices||[])],
      highlight_parts:[...(expression?.highlight_parts||[])],
      highlight_exclude_parts:[...(expression?.highlight_exclude_parts||[])],
    }));
    const hover={};
    for(const token of segment?.tokens||[]){
      const i=Number.isInteger(token?.i)?token.i:(segment.tokens||[]).indexOf(token);
      hover[String(i)]={
        contextual_word_meaning_tr:String(token?.contextual_meaning_tr||""),
        dictionary_meanings_tr:[...(token?.dictionary_meanings_tr||[])],
        lexical_form:token?.lexical_form||null,
        primary_expressions:expressions.filter(expr=>(expr.token_indices||[]).includes(i)),
        usage_notes:[...(token?.usage_notes||[])],
      };
    }
    return {
      sentence_meaning_tr:String(segment?.sentence_translation||""),
      tokens,
      expressions,
      hover,
      analysis_source:segment.analysis_source==="local"?"local":"ai",
    };
  }

  function applyIndexedContentPayload(payload,cues,contentId){
    if(!payload?.segments?.length) return false;
    const cueByIndex=new Map((cues||[]).map((cue,index)=>[Number.isInteger(cue.index)?cue.index:index,cue]));
    const words=new Map();
    const expressions=new Map();

    for(const segment of payload.segments){
      const cue=cueByIndex.get(segment.index);
      const text=String(cue?.text||segment.text||"").trim();
      if(!text) continue;
      const analysis=indexedSegmentToAnalysis(segment);
      setAnalysisCache(text,analysis);

      for(const token of analysis.tokens||[]){
        const lemma=String(token.lemma||token.text||"").trim();
        if(!lemma) continue;
        const key=lemma.toLocaleLowerCase("de-DE");
        let entry=words.get(key);
        if(!entry){
          entry={lemma,pos:token.pos||"",count:0,forms:new Set(),occurrences:[],article:"",singular:"",plural:"",meaningTr:""};
          words.set(key,entry);
        }
        entry.count+=1;
        entry.forms.add(token.text||lemma);
        if(!entry.occurrences.includes(segment.index)) entry.occurrences.push(segment.index);
        const h=analysis.hover?.[String(token.i)]||{};
        if(!entry.meaningTr && h.contextual_word_meaning_tr) entry.meaningTr=h.contextual_word_meaning_tr;
      }

      for(const expr of analysis.expressions||[]){
        const canonical=String(expr.canonical||expr.surface||"").trim();
        if(!canonical) continue;
        const key=String(expr.type||"FIXED_CONSTRUCTION")+"|"+canonical.toLocaleLowerCase("de-DE");
        let entry=expressions.get(key);
        if(!entry){
          entry={
            key,
            type:expr.type||"FIXED_CONSTRUCTION",
            patternId:expr.pattern_id||"",
            canonical,
            count:0,
            forms:new Set(),
            occurrences:[],
            meaningTr:expr.contextual_meaning_tr||"",
            grammarHint:expr.grammar_hint||"",
          };
          expressions.set(key,entry);
        }
        entry.count+=1;
        if(expr.surface) entry.forms.add(expr.surface);
        if(!entry.occurrences.includes(segment.index)) entry.occurrences.push(segment.index);
        if(!entry.meaningTr && expr.contextual_meaning_tr) entry.meaningTr=expr.contextual_meaning_tr;
      }
    }

    state.youtube.transcriptAnalysis=[...words.values()]
      .map(entry=>({...entry,forms:[...entry.forms]}))
      .sort((a,b)=>b.count-a.count || a.lemma.localeCompare(b.lemma,"de"));
    state.youtube.transcriptAnalysisVideoId=contentId;
    state.youtube.expressionGroupsAnalysis=[...expressions.values()]
      .map(entry=>({...entry,forms:[...entry.forms]}))
      .sort((a,b)=>b.count-a.count || a.canonical.localeCompare(b.canonical,"de"));
    state.youtube.expressionGroupsVideoId=contentId;
    renderSharedPanel();
    updateSharedPanelUi();
    refreshLearningHighlights();
    if(adapter.id==="web") scheduleWebLearningAnnotations();
    return true;
  }


  function currentAiIndexRequest(){
    if(adapter.id==="web"){
      let pageUrl;
      try{ pageUrl=new URL(location.href); pageUrl.hash=""; }catch(_error){ pageUrl=null; }
      const stableUrl=pageUrl?.toString()||location.href;
      return {
        provider:"web",
        sourceType:"article",
        externalId:stableUrl,
        title:document.title||null,
        url:stableUrl,
        cues:state.web.segments||[],
        contentId:"web:"+location.href,
      };
    }
    if(adapter.id==="youtube"){
      const videoId=state.youtube.videoId||currentYouTubeVideoId();
      return {
        provider:"youtube",
        sourceType:"video",
        externalId:videoId,
        title:currentYouTubeTitle(),
        url:location.href,
        cues:state.youtube.cues||[],
        contentId:videoId,
      };
    }
    if(adapter.id==="zdf"){
      const videoId=state.zdf.videoId||state.youtube.videoId;
      return {
        provider:"zdf",
        sourceType:"video",
        externalId:videoId,
        title:document.title||null,
        url:location.href,
        cues:state.zdf.cues||state.youtube.cues||[],
        contentId:videoId,
      };
    }
    return null;
  }

  function aiLabStats(diagnostic=state.aiIndexDiagnostic){
    const segments=diagnostic?.response?.segments||[];
    return {
      segments:segments.length,
      translated:segments.filter(item=>String(item.sentence_translation||"").trim()).length,
      tokens:segments.reduce((sum,item)=>sum+(item.tokens||[]).length,0),
      expressions:segments.reduce((sum,item)=>sum+(item.expressions||[]).length,0),
    };
  }

  function aiLabSourceLabel(diagnostic=state.aiIndexDiagnostic){
    if(diagnostic?.source==="database") return "Veritabanından geldi";
    if(diagnostic?.source==="ai") return "Yeni AI analizi";
    if(diagnostic?.status==="running") return "AI analizi çalışıyor";
    if(diagnostic?.status==="error") return "Analiz başarısız";
    if(diagnostic?.status==="missing") return "İçerik hazır değil";
    return "Henüz analiz yapılmadı";
  }

  function aiLabStatusLabel(status){
    return ({ready:"Hazır",partial:"Kısmi hazır",running:"Çalışıyor",error:"Hata",missing:"Eksik içerik",idle:"Bekliyor"})[status]||"Bekliyor";
  }

  function renderGeminiQuotaRows(summary){
    const quota=summary?.official_quota;
    if(!quota) return '<div><span>Resmî Google kotası</span><b>Yüklenmedi</b></div>';
    if(quota.status!=="available" || !Array.isArray(quota.limits) || !quota.limits.length){
      const statusLabel=quota.status==="not_configured"
        ? "Cloud proje ayarı yok"
        : quota.status==="not_authorized"
          ? "Cloud Monitoring yetkisi yok"
          : "Kota verisi alınamadı";
      return '<div><span>Resmî Google kotası</span><b>'+esc(statusLabel)+'</b></div>'+
        (quota.note?'<small class="gle-ai-quota-note">'+esc(String(quota.note))+'</small>':"");
    }
    const rows=quota.limits.map(item=>{
      const name=String(item.limit_name||"").toLowerCase();
      const windowLabel=name.includes("day")?"günlük":name.includes("minute")?"dakikalık":name.includes("hour")?"saatlik":"kota";
      const kindLabel=item.kind==="input_tokens"?"Input token":"İstek";
      return '<div><span>'+esc(kindLabel+" · "+windowLabel)+'</span><b>'+
        esc(String(item.used??0))+' / '+esc(String(item.limit??0))+
        ' · '+esc(String(item.remaining??0))+' kaldı</b></div>';
    }).join("");
    return '<div class="gle-ai-quota-title"><span>Google Cloud kota</span><b>'+esc(String(quota.model||summary?.latest_model||""))+'</b></div>'+
      rows+
      (quota.note?'<small class="gle-ai-quota-note">'+esc(String(quota.note))+'</small>':"");
  }

  function buildAiAnalysisExport(){
    const diagnostic=state.aiIndexDiagnostic||{
      status:"idle",
      source:"",
      request:null,
      response:null,
      error:"",
    };
    return {
      ai_analysis_export_version:1,
      generated_at:new Date().toISOString(),
      page:{
        title:document.title||"",
        url:location.href,
        adapter:adapter.id,
      },
      result_source:diagnostic.source||"",
      result_source_label:aiLabSourceLabel(diagnostic),
      status:diagnostic.status||"idle",
      started_at:diagnostic.started_at||null,
      completed_at:diagnostic.completed_at||null,
      error:diagnostic.error||"",
      request:diagnostic.request||null,
      stats:aiLabStats(diagnostic),
      indexed_content:diagnostic.response||null,
    };
  }

  function downloadAiAnalysisExport(){
    const filename=safeExportName("AI_Analysis")+".json";
    downloadTextFile(filename,"application/json;charset=utf-8",JSON.stringify(buildAiAnalysisExport(),null,2));
  }

  function renderAiLabDialog(){
    const dialog=state.aiLabDialog;
    if(!dialog?.isConnected) return;
    syncSystemMonitorVisibility();
    if(state.settings.systemMonitorEnabled===false) return;

    dialog.classList.toggle("collapsed",state.aiLabCollapsed===true);
    const toggle=dialog.querySelector(".gle-ai-lab-toggle");
    if(toggle){
      toggle.textContent="‹";
      toggle.title="Sistem İzleme panelini gizle";
      toggle.setAttribute("aria-label",toggle.title);
      toggle.setAttribute("aria-expanded",state.aiLabCollapsed?"false":"true");
    }
    dialog.querySelectorAll("[data-monitor-main]").forEach(button=>
      button.classList.toggle("active",button.dataset.monitorMain===state.monitorMainTab)
    );
    dialog.querySelectorAll("[data-monitor-translation]").forEach(button=>
      button.classList.toggle("active",button.dataset.monitorTranslation===state.monitorTranslationTab)
    );

    const body=dialog.querySelector(".gle-ai-lab-body");
    const toolbar=dialog.querySelector(".gle-ai-lab-toolbar");
    if(!body || !toolbar) return;

    if(state.monitorTranslationTab==="ge"){
      const local=state.localDiagnostic||{};
      const response=local.response||{};
      const matched=Number(response.matched_segments||0);
      const total=Number(response.total_segments||currentAiIndexRequest()?.cues?.length||0);
      const missing=Array.isArray(response.missing_indexes)?response.missing_indexes.length:Math.max(0,total-matched);
      const sourceKinds=[...new Set((response.segments||[]).map(item=>item.source_kind).filter(Boolean))];
      toolbar.innerHTML='<button type="button" class="gle-monitor-refresh-ge">German Engine durumunu yenile</button>';
      toolbar.querySelector(".gle-monitor-refresh-ge")?.addEventListener("click",()=>{
        state.localLookupSignature="";
        lookupCachedLocalForCurrentContent();
      });
      body.innerHTML=
        '<section class="gle-ai-lab-summary">'+
          '<div class="gle-ai-lab-status-line"><span class="gle-ai-lab-status database">German Engine / Local DB</span><b>'+esc(state.localCoverage==="full"?"Hazır":state.localCoverage==="partial"?"Kısmi":"Bekliyor")+'</b></div>'+
          '<dl>'+
            '<div><dt>Kapsam</dt><dd>'+esc(String(matched))+' / '+esc(String(total))+' cümle</dd></div>'+
            '<div><dt>Eksik</dt><dd>'+esc(String(missing))+' cümle</dd></div>'+
            '<div><dt>Kaynak türü</dt><dd>'+esc(sourceKinds.length?sourceKinds.join(", "):"german-engine / local")+'</dd></div>'+
            '<div><dt>Son kontrol</dt><dd>'+esc(local.completed_at||"—")+'</dd></div>'+
          '</dl>'+
          '<div class="gle-ai-lab-counts"><span><b>'+matched+'</b>Local</span><span><b>'+missing+'</b>Eksik</span><span><b>'+esc(state.localCoverage==="full"?"100%":total?Math.round(matched/total*100)+"%":"0%")+'</b>Kapsam</span><span><b>GE</b>Motor</span></div>'+
          (local.error?'<pre class="gle-ai-lab-error">'+esc(local.error)+'</pre>':"")+
        '</section>'+
        '<section class="gle-ai-lab-results"><h3>German Engine / local analiz kayıtları</h3>'+
          ((response.segments||[]).length
            ? (response.segments||[]).map(item=>'<article class="gle-ai-lab-segment"><div class="gle-ai-lab-segment-head"><b>#'+esc(String(Number(item.index)+1))+'</b><span>'+esc(item.source_kind||"local")+'</span></div><div class="gle-ai-lab-source">'+esc(item.text||"")+'</div><div class="gle-ai-lab-translation">'+esc(item.analysis?.sentence_meaning_tr||"Çeviri yok")+'</div></article>').join("")
            : '<div class="gle-ai-lab-empty">Henüz bu içerik için kalıcı German Engine/local kayıt yok.</div>')+
        '</section>';
      return;
    }

    const diagnostic=state.aiIndexDiagnostic||{status:"idle",source:"",request:null,response:null,error:""};
    const stats=aiLabStats(diagnostic);
    const response=diagnostic.response||{};
    const request=diagnostic.request||currentAiIndexRequest()||{};
    const sourceClass=diagnostic.source==="database"?"database":diagnostic.source==="ai"?"ai":"neutral";
    const sourceLabel=aiLabSourceLabel(diagnostic);
    const model=response.analyzer_model||"—";
    const provider=response.analyzer_provider||"—";
    const segments=response.segments||[];
    const progress=response.progress||diagnostic.progress||{};
    const rows=segments.length
      ? segments.map((segment,index)=>{
          const expressions=(segment.expressions||[]).map(expr=>'<span class="gle-ai-lab-expression">'+esc(expr.canonical||expr.surface||"")+'</span>').join("");
          return '<article class="gle-ai-lab-segment"><div class="gle-ai-lab-segment-head"><b>#'+esc(String(Number.isInteger(segment.index)?segment.index+1:index+1))+'</b><span>'+(segment.tokens||[]).length+' kelime · '+(segment.expressions||[]).length+' yapı</span></div><div class="gle-ai-lab-source">'+esc(segment.text||"")+'</div><div class="gle-ai-lab-translation">'+esc(segment.sentence_translation||"Çeviri yok")+'</div>'+(expressions?'<div class="gle-ai-lab-expressions">'+expressions+'</div>':"")+'</article>';
        }).join("")
      : '<div class="gle-ai-lab-empty">Henüz AI/DB analiz sonucu yok.</div>';

    toolbar.innerHTML='<button type="button" class="gle-ai-lab-run">AI Analizi Başlat</button><button type="button" class="gle-ai-lab-export">JSON Dışa Aktar</button>';
    toolbar.querySelector(".gle-ai-lab-run")?.addEventListener("click",()=>runCurrentContentAiIndex());
    toolbar.querySelector(".gle-ai-lab-export")?.addEventListener("click",()=>downloadAiAnalysisExport());

    body.innerHTML=
      '<section class="gle-ai-lab-summary">'+
        '<div class="gle-ai-lab-status-line"><span class="gle-ai-lab-status '+sourceClass+'">'+esc(sourceLabel)+'</span><b>'+esc(aiLabStatusLabel(diagnostic.status||"idle"))+'</b></div>'+
        '<dl>'+
          '<div><dt>İçerik</dt><dd>'+esc(request.title||document.title||"—")+'</dd></div>'+
          '<div><dt>Kaynak</dt><dd>'+esc(request.provider||adapter.id||"—")+'</dd></div>'+
          '<div><dt>İstek cümlesi</dt><dd>'+esc(String(request.segment_count??request.cues?.length??0))+'</dd></div>'+
          '<div><dt>Sonuç nereden?</dt><dd>'+esc(sourceLabel)+'</dd></div>'+
          '<div><dt>AI sağlayıcı</dt><dd>'+esc(provider)+'</dd></div>'+
          '<div><dt>Model</dt><dd>'+esc(model)+'</dd></div>'+
          '<div><dt>Content ID</dt><dd class="mono">'+esc(String(response.content_id||"—"))+'</dd></div>'+
          '<div><dt>Content hash</dt><dd class="mono">'+esc(String(response.content_hash||"—"))+'</dd></div>'+
          '<div><dt>Şema</dt><dd>'+esc(String(response.analysis_schema_version||"—"))+'</dd></div>'+
          '<div><dt>İlerleme</dt><dd>'+esc(String(progress.completed_segments??segments.length))+' / '+esc(String(progress.total_segments??request.segment_count??segments.length))+' cümle · '+esc(String(progress.completed_batches??0))+' / '+esc(String(progress.total_batches??0))+' batch</dd></div>'+
        '</dl>'+
        '<div class="gle-ai-lab-counts"><span><b>'+stats.segments+'</b>Cümle</span><span><b>'+stats.translated+'</b>Çeviri</span><span><b>'+stats.tokens+'</b>Kelime</span><span><b>'+stats.expressions+'</b>Yapı</span></div>'+
        (state.aiUsageSummary
          ? '<div class="gle-ai-usage"><strong>Gemini kullanımı</strong>'+
              '<div><span>Google günü</span><b>'+esc(String(state.aiUsageSummary.google_day?.requests||0))+' istek · '+esc(String(state.aiUsageSummary.google_day?.total_tokens||0))+' token</b></div>'+
              '<div><span>Son 7 gün</span><b>'+esc(String(state.aiUsageSummary.last_7_days?.requests||0))+' istek · '+esc(String(state.aiUsageSummary.last_7_days?.total_tokens||0))+' token</b></div>'+
              '<div><span>Bu ay</span><b>'+esc(String(state.aiUsageSummary.month_to_date?.requests||0))+' istek · '+esc(String(state.aiUsageSummary.month_to_date?.total_tokens||0))+' token</b></div>'+
              renderGeminiQuotaRows(state.aiUsageSummary)+
            '</div>'
          : '<div class="gle-ai-usage gle-ai-usage-empty">Gemini kullanım sayacı yükleniyor…</div>')+
        (diagnostic.error?'<pre class="gle-ai-lab-error">'+esc(diagnostic.error)+'</pre>':"")+
      '</section>'+
      '<section class="gle-ai-lab-results"><h3>AI çeviri ve dil analizi</h3>'+rows+'</section>';

    const run=toolbar.querySelector(".gle-ai-lab-run");
    if(run){
      run.disabled=state.aiIndexBusy===true;
      run.classList.remove("ai-full","ai-partial","ai-none","ai-running","ge-full");
      const coverage=state.aiCoverage||"unknown";
      if(state.aiIndexBusy){run.classList.add("ai-running");run.textContent="Analiz sürüyor…";}
      else if(coverage==="full"){run.classList.add("ai-full");run.textContent="AI hazır ✓";}
      else if(coverage==="partial"){run.classList.add("ai-partial");run.textContent="Eksikleri AI ile tamamla";}
      else{run.classList.add("ai-none");run.textContent="AI Analizi Başlat";}
    }
    const exportButton=toolbar.querySelector(".gle-ai-lab-export");
    if(exportButton) exportButton.disabled=!state.aiIndexDiagnostic;
  }

  function syncSystemMonitorVisibility(){
    const enabled=state.settings.systemMonitorEnabled!==false;
    const dialog=state.aiLabDialog;
    if(dialog){
      const hidden=!enabled || state.aiLabCollapsed===true;
      dialog.classList.toggle("system-monitor-disabled",!enabled);
      dialog.classList.toggle("collapsed",state.aiLabCollapsed===true);
      dialog.style.display=hidden?"none":"block";
    }
    if(state.aiLabHandle) state.aiLabHandle.hidden=!enabled || !state.aiLabCollapsed;
  }

  function setAiLabCollapsed(collapsed){
    state.aiLabCollapsed=Boolean(collapsed);
    state.settings.systemMonitorCollapsed=state.aiLabCollapsed;
    chrome.storage.sync.set({systemMonitorCollapsed:state.aiLabCollapsed});
    const dialog=state.aiLabDialog;
    if(dialog) dialog.classList.toggle("collapsed",state.aiLabCollapsed);
    syncSystemMonitorVisibility();
    renderAiLabDialog();
  }

  function openSystemMonitor(tab="ai"){
    if(state.settings.systemMonitorEnabled===false) return;
    state.monitorMainTab="translation";
    state.monitorTranslationTab=tab==="ge"?"ge":"ai";
    setAiLabCollapsed(false);
    renderAiLabDialog();
  }

  function ensureAiLabDialog(){
    let dialog=document.getElementById("gle-ai-lab-dialog");
    if(dialog){
      state.aiLabDialog=dialog;
      dialog.classList.toggle("collapsed",state.aiLabCollapsed===true);
      dialog.classList.toggle("system-monitor-disabled",state.settings.systemMonitorEnabled===false);
      renderAiLabDialog();
      return dialog;
    }
    dialog=document.createElement("div");
    dialog.id="gle-ai-lab-dialog";
    dialog.style.width=state.aiLabWidth+"px";
    const monitorInitiallyHidden=state.settings.systemMonitorEnabled===false || state.aiLabCollapsed===true;
    dialog.style.display=monitorInitiallyHidden?"none":"block";
    dialog.classList.toggle("collapsed",state.aiLabCollapsed===true);
    dialog.classList.toggle("system-monitor-disabled",state.settings.systemMonitorEnabled===false);
    dialog.innerHTML='<div class="gle-ai-lab-resizer" role="separator" aria-orientation="vertical" title="Sistem İzleme genişliğini ayarla"></div><div class="gle-ai-lab-card" role="complementary" aria-labelledby="gle-ai-lab-title"><header><div><strong id="gle-ai-lab-title">Sistem İzleme</strong><small>Çeviri motorları, kullanım ve sistem durumları</small></div><div class="gle-ai-lab-head-actions"><button type="button" class="gle-ai-lab-reset" title="Genişliği sıfırla">↔</button><button type="button" class="gle-ai-lab-toggle" aria-label="Sistem İzleme panelini gizle" aria-expanded="true" title="Sistem İzleme panelini gizle">‹</button></div></header><div class="gle-monitor-main-tabs"><button type="button" class="active" data-monitor-main="translation">Çeviri</button></div><div class="gle-monitor-subtabs"><button type="button" class="active" data-monitor-translation="ai">AI</button><button type="button" data-monitor-translation="ge">German Engine</button></div><div class="gle-ai-lab-toolbar"></div><div class="gle-ai-lab-body"></div></div>';
    dialog.querySelector(".gle-ai-lab-toggle").addEventListener("click",()=>setAiLabCollapsed(true));
    dialog.querySelectorAll("[data-monitor-main]").forEach(button=>button.addEventListener("click",()=>{
      state.monitorMainTab=button.dataset.monitorMain||"translation";
      renderAiLabDialog();
    }));
    dialog.querySelectorAll("[data-monitor-translation]").forEach(button=>button.addEventListener("click",()=>{
      state.monitorTranslationTab=button.dataset.monitorTranslation||"ai";
      renderAiLabDialog();
    }));
    dialog.querySelector(".gle-ai-lab-reset").addEventListener("click",()=>{
      state.aiLabWidth=350;
      state.settings.systemMonitorWidth=350;
      dialog.style.width="350px";
      chrome.storage.sync.set({systemMonitorWidth:350});
    });
    const resizer=dialog.querySelector(".gle-ai-lab-resizer");
    resizer?.addEventListener("pointerdown",event=>{
      if(event.button!==0 || state.aiLabCollapsed) return;
      event.preventDefault();
      const startX=event.clientX;
      const startWidth=dialog.getBoundingClientRect().width;
      resizer.setPointerCapture?.(event.pointerId);
      const move=moveEvent=>{
        state.aiLabWidth=Math.max(250,Math.min(560,startWidth+(moveEvent.clientX-startX)));
        dialog.style.width=state.aiLabWidth+"px";
      };
      const finish=()=>{
        state.settings.systemMonitorWidth=state.aiLabWidth;
        chrome.storage.sync.set({systemMonitorWidth:state.aiLabWidth});
        resizer.removeEventListener("pointermove",move);
        resizer.removeEventListener("pointerup",finish);
        resizer.removeEventListener("pointercancel",finish);
      };
      resizer.addEventListener("pointermove",move);
      resizer.addEventListener("pointerup",finish);
      resizer.addEventListener("pointercancel",finish);
    });
    document.documentElement.appendChild(dialog);
    let handle=document.getElementById("gle-ai-lab-edge-handle");
    if(!handle){
      handle=document.createElement("button");
      handle.id="gle-ai-lab-edge-handle";
      handle.type="button";
      handle.textContent="İzle";
      handle.title="Sistem İzleme panelini aç";
      handle.addEventListener("click",()=>setAiLabCollapsed(false));
      handle.hidden=state.settings.systemMonitorEnabled===false || state.aiLabCollapsed!==true;
      document.documentElement.appendChild(handle);
    }else{
      handle.hidden=state.settings.systemMonitorEnabled===false || state.aiLabCollapsed!==true;
    }
    state.aiLabHandle=handle;
    state.aiLabDialog=dialog;
    syncSystemMonitorVisibility();
    renderAiLabDialog();
    refreshAiUsageSummary();
    return dialog;
  }

  function scheduleCachedLocalLookup(){
    setTimeout(()=>lookupCachedLocalForCurrentContent(),80);
  }

  async function lookupCachedLocalForCurrentContent(){
    const request=currentAiIndexRequest();
    const signature=aiLookupSignatureFor(request);
    if(!signature || signature===state.localLookupSignature) return false;
    state.localLookupSignature=signature;
    try{
      const apiBase=await platformApiBase();
      const segments=request.cues.map((cue,index)=>({
        index:Number.isInteger(cue.index)?cue.index:index,
        text:String(cue.text||"").trim(),
        start_ms:Number.isFinite(cue.startMs)?Math.round(cue.startMs):null,
        end_ms:Number.isFinite(cue.endMs)?Math.round(cue.endMs):null,
      })).filter(item=>item.text);
      if(!segments.length) return false;
      const response=await platformFetch(apiBase+"/api/v1/local-analysis/lookup-batch",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          provider:request.provider,
          source_type:request.sourceType,
          external_id:String(request.externalId),
          url:request.url||null,
          title:request.title||null,
          source_language:"de",
          target_language:"tr",
          segments,
          metadata:{lookup_only:true},
        }),
      });
      if(!response.ok) return false;
      const payload=await response.json();
      state.localCoverage=payload.coverage||"none";
      state.localDiagnostic={
        completed_at:new Date().toISOString(),
        request:{provider:request.provider,external_id:String(request.externalId),title:request.title||"",segment_count:segments.length},
        response:payload,
      };
      for(const segment of payload.segments||[]){
        const analysis={...(segment.analysis||{}),analysis_source:"local"};
        setAnalysisCache(String(segment.text||""),analysis);
      }
      updateSharedPanelUi();
      if((payload.segments||[]).length) renderSharedPanel();
      return (payload.segments||[]).length>0;
    }catch(error){
      console.warn("Local analysis lookup failed",error);
      state.localCoverage="none";
      state.localDiagnostic={completed_at:new Date().toISOString(),error:String(error?.message||error),response:null};
      updateSharedPanelUi();
      return false;
    }
  }

  async function refreshAiUsageSummary(){
    if(state.aiUsageBusy) return;
    state.aiUsageBusy=true;
    try{
      const apiBase=await platformApiBase();
      const response=await platformFetch(apiBase+"/api/v1/ai-usage/summary");
      if(response.ok) state.aiUsageSummary=await response.json();
    }catch(error){
      console.warn("AI usage summary unavailable",error);
    }finally{
      state.aiUsageBusy=false;
      renderAiLabDialog();
    }
  }

  function aiLookupSignatureFor(request){
    if(!request?.externalId || !Array.isArray(request.cues) || !request.cues.length) return "";
    return [
      request.provider,
      String(request.externalId),
      request.cues.map(cue=>String(cue?.text||"").trim()).join("\u241e"),
    ].join("\u241f");
  }

  function scheduleCachedAiLookup(){
    clearTimeout(state.aiLookupTimer);
    state.aiLookupTimer=setTimeout(()=>lookupCachedAiForCurrentContent(),120);
  }

  async function lookupCachedAiForCurrentContent(){
    if(state.aiIndexBusy || state.aiLookupBusy) return false;
    const request=currentAiIndexRequest();
    const signature=aiLookupSignatureFor(request);
    if(!signature || signature===state.aiLookupSignature) return false;
    state.aiLookupSignature=signature;
    state.aiLookupBusy=true;
    updateSharedPanelUi();
    try{
      const {platformApiUrl="http://127.0.0.1:8000"}=await chrome.storage.sync.get("platformApiUrl");
      const segments=request.cues.map((cue,index)=>({
        index:Number.isInteger(cue.index)?cue.index:index,
        text:String(cue.text||"").trim(),
        start_ms:Number.isFinite(cue.startMs)?Math.round(cue.startMs):null,
        end_ms:Number.isFinite(cue.endMs)?Math.round(cue.endMs):null,
      })).filter(item=>item.text);
      if(!segments.length) return false;
      const response=await platformFetch(platformApiUrl.replace(/\/$/,"")+"/api/v1/content-index/lookup",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          provider:request.provider,
          source_type:request.sourceType,
          external_id:String(request.externalId),
          url:request.url||null,
          title:request.title||null,
          source_language:"de",
          target_language:"tr",
          segments,
          metadata:{indexed_by:"browser-extension",lookup_only:true},
        }),
      });
      if(!response.ok) throw new Error("content-index lookup "+response.status);
      const payload=await response.json();
      state.aiCoverage=payload.coverage||"none";
      const matched=Number(payload.matched_segments||0);
      const applied=matched>0
        ? applyIndexedContentPayload(payload,request.cues,request.contentId||String(request.externalId))
        : false;
      state.aiIndexLastStatus=state.aiCoverage==="full"?"ready":state.aiCoverage==="partial"?"partial":"";
      state.aiIndexDiagnostic={
        status:state.aiCoverage==="full"?"ready":state.aiCoverage==="partial"?"partial":"idle",
        source:matched>0?"database":"",
        started_at:new Date().toISOString(),
        completed_at:new Date().toISOString(),
        request:{
          provider:request.provider,
          source_type:request.sourceType,
          external_id:String(request.externalId),
          title:request.title||"",
          url:request.url||"",
          segment_count:segments.length,
        },
        response:payload,
        error:"",
      };
      if(applied) renderSharedPanel();
      renderAiLabDialog();
      return matched>0;
    }catch(error){
      console.warn("Cached AI lookup unavailable; keeping local fallback",error);
      state.aiCoverage="none";
      return false;
    }finally{
      state.aiLookupBusy=false;
      updateSharedPanelUi();
    }
  }

  async function runCurrentContentAiIndex(){
    if(state.aiIndexBusy) return;
    const request=currentAiIndexRequest();

    if(!request?.externalId || !request?.cues?.length){
      state.aiIndexLastStatus="missing";
      state.aiIndexDiagnostic={
        status:"missing",
        source:"",
        started_at:new Date().toISOString(),
        completed_at:new Date().toISOString(),
        request:request?{
          provider:request.provider,
          source_type:request.sourceType,
          external_id:request.externalId||"",
          title:request.title||"",
          url:request.url||"",
          segment_count:Array.isArray(request.cues)?request.cues.length:0,
        }:null,
        response:null,
        error:"Analiz için içerik/cümle verisi henüz hazır değil.",
      };
      updateSharedPanelUi();
      renderAiLabDialog();
      return;
    }

    state.aiIndexBusy=true;
    state.aiIndexLastStatus="";
    state.aiIndexDiagnostic={
      status:"running",
      source:"",
      started_at:new Date().toISOString(),
      completed_at:null,
      request:{
        provider:request.provider,
        source_type:request.sourceType,
        external_id:String(request.externalId),
        title:request.title||"",
        url:request.url||"",
        segment_count:request.cues.length,
      },
      response:null,
      error:"",
    };
    updateSharedPanelUi();
    renderAiLabDialog();
    pollAiProgress(request);
    try{
      const indexed=await resolveIndexedContent(request);
      state.aiIndexLastStatus=indexed?"ready":"error";
    }catch(error){
      console.warn("Manual AI content analysis failed",error);
      state.aiIndexLastStatus="error";
      state.aiIndexDiagnostic={
        ...(state.aiIndexDiagnostic||{}),
        status:"error",
        completed_at:new Date().toISOString(),
        error:String(error?.message||error),
      };
    }finally{
      state.aiIndexBusy=false;
      clearTimeout(state.aiProgressTimer);
      state.aiProgressTimer=null;
      updateSharedPanelUi();
      renderSharedPanel();
      renderAiLabDialog();
      refreshAiUsageSummary();
    }
  }

  async function resolveIndexedContent({provider,sourceType,externalId,title,url,cues,contentId}){
    if(!Array.isArray(cues) || !cues.length || !externalId) return false;
    try{
      const {platformApiUrl="http://127.0.0.1:8000"}=await chrome.storage.sync.get("platformApiUrl");
      const segments=cues.map((cue,index)=>({
        index:Number.isInteger(cue.index)?cue.index:index,
        text:String(cue.text||"").trim(),
        start_ms:Number.isFinite(cue.startMs)?Math.round(cue.startMs):null,
        end_ms:Number.isFinite(cue.endMs)?Math.round(cue.endMs):null,
      })).filter(item=>item.text);
      if(!segments.length) return false;
      const response=await platformFetch(platformApiUrl.replace(/\/$/,"")+"/api/v1/content-index/resolve",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          provider,
          source_type:sourceType,
          external_id:String(externalId),
          url:url||null,
          title:title||null,
          source_language:"de",
          target_language:"tr",
          segments,
          metadata:{indexed_by:"browser-extension"},
        }),
      });
      if(response.status===409){
        state.aiIndexDiagnostic={
          ...(state.aiIndexDiagnostic||{}),
          status:"error",
          completed_at:new Date().toISOString(),
          error:"Bu içerik için başka bir analiz işlemi zaten devam ediyor (409).",
        };
        renderAiLabDialog();
        return false;
      }
      if(!response.ok){
        const detail=(await response.text().catch(()=>"")).trim();
        throw new Error("content-index "+response.status+(detail?": "+detail.slice(0,1600):""));
      }
      const payload=await response.json();
      const applied=applyIndexedContentPayload(payload,cues,contentId||String(externalId));
      state.aiCoverage=applied?"full":"none";
      state.aiLookupSignature=aiLookupSignatureFor(currentAiIndexRequest());
      state.aiIndexDiagnostic={
        ...(state.aiIndexDiagnostic||{}),
        status:applied?"ready":"error",
        source:payload.cached===true?"database":"ai",
        completed_at:new Date().toISOString(),
        response:payload,
        error:applied?"":"AI/DB sonucu alındı fakat panel analiz durumuna uygulanamadı.",
      };
      renderAiLabDialog();
      return applied;
    }catch(error){
      console.warn("Persistent AI content index unavailable; using local analysis fallback",error);
      state.aiIndexDiagnostic={
        ...(state.aiIndexDiagnostic||{}),
        status:"error",
        completed_at:new Date().toISOString(),
        response:null,
        error:String(error?.message||error),
      };
      renderAiLabDialog();
      return false;
    }
  }

  function currentLocalAnalysisContext(){
    const request=currentAiIndexRequest();
    return {
      provider:request?.provider||adapter.id||"web",
      externalId:String(request?.externalId||location.href),
    };
  }

  async function lookupLocalAnalysis(text){
    const context=currentLocalAnalysisContext();
    const apiBase=await platformApiBase();
    const response=await platformFetch(apiBase+"/api/v1/local-analysis/lookup",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        provider:context.provider,
        external_id:context.externalId,
        source_language:"de",
        target_language:"tr",
        text,
      }),
    });
    if(!response.ok) return null;
    const payload=await response.json();
    return payload?.found ? payload.analysis : null;
  }

  async function persistLocalAnalysis(text,analysis,sourceKind="german-engine"){
    if(!text || !analysis || analysis.analysis_source==="ai") return;
    const context=currentLocalAnalysisContext();
    const apiBase=await platformApiBase();
    const local={...analysis,analysis_source:"local"};
    try{
      const response=await platformFetch(apiBase+"/api/v1/local-analysis/upsert-batch",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          provider:context.provider,
          external_id:context.externalId,
          source_language:"de",
          target_language:"tr",
          items:[{text,analysis:local,source_kind:sourceKind}],
        }),
      });
      if(response.ok){
        state.localLookupSignature="";
        scheduleCachedLocalLookup();
      }
    }catch(error){
      console.warn("Local analysis persistence failed",error);
    }
  }

  async function pollAiProgress(request){
    clearTimeout(state.aiProgressTimer);
    if(!state.aiIndexBusy || !request?.externalId) return;
    try{
      const apiBase=await platformApiBase();
      const params=new URLSearchParams({
        provider:request.provider,
        external_id:String(request.externalId),
        source_language:"de",
        target_language:"tr",
      });
      const response=await platformFetch(apiBase+"/api/v1/content-index/status?"+params.toString());
      if(response.ok){
        const payload=await response.json();
        if(Array.isArray(payload.segments) && payload.segments.length){
          applyIndexedContentPayload(payload,request.cues,request.contentId||String(request.externalId));
          state.aiIndexDiagnostic={
            ...(state.aiIndexDiagnostic||{}),
            status:payload.status==="ready"?"ready":"running",
            source:"ai",
            response:payload,
            progress:payload.progress||{},
          };
          renderSharedPanel();
          renderAiLabDialog();
        }
      }
    }catch(_error){}
    if(state.aiIndexBusy) state.aiProgressTimer=setTimeout(()=>pollAiProgress(request),1000);
  }

  async function analyzePlatform(text){
    if(state.cache.has(text)) return state.cache.get(text);
    if(state.analysisInflight.has(text)) return state.analysisInflight.get(text);

    const request=(async()=>{
      const stored=await lookupLocalAnalysis(text).catch(()=>null);
      if(stored){
        stored.analysis_source="local";
        return setAnalysisCache(text,stored);
      }

      const apiBase=await platformApiBase();
      const response=await platformFetch(apiBase+"/api/v1/analyze",{
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
      const localData={...data,analysis_source:"local"};
      const chosen=setAnalysisCache(text,localData);
      persistLocalAnalysis(text,localData,"german-engine").catch(()=>{});
      return chosen;
    })();

    state.analysisInflight.set(text,request);
    try{
      return await request;
    }finally{
      if(state.analysisInflight.get(text)===request) state.analysisInflight.delete(text);
    }
  }

  function mergePreparedContextualAnalysis(prepared,platform){
    if(!prepared || !platform) return prepared||platform;
    const merged={
      ...prepared,
      sentence_meaning_tr:firstMeaning(prepared.sentence_meaning_tr,platform.sentence_meaning_tr),
      hover:{...(prepared.hover||{})},
    };
    const preparedTokens=prepared.tokens||[];
    const platformTokens=platform.tokens||[];
    const used=new Set();

    const matchPlatformToken=(preparedToken,index)=>{
      const sameIndex=platformTokens[index];
      if(sameIndex && normalizedTokenText(sameIndex)===normalizedTokenText(preparedToken) && !used.has(sameIndex.i)){
        used.add(sameIndex.i);
        return sameIndex;
      }
      const wantedText=normalizeLearningIdentity(preparedToken?.text||"");
      const wantedLemma=normalizeLearningIdentity(preparedToken?.lemma||"");
      const candidate=platformTokens.find(token=>{
        if(used.has(token.i)) return false;
        const text=normalizeLearningIdentity(token.text||"");
        const lemma=normalizeLearningIdentity(token.lemma||"");
        return (wantedText && text===wantedText) || (wantedLemma && lemma===wantedLemma);
      });
      if(candidate) used.add(candidate.i);
      return candidate||null;
    };

    merged.tokens=preparedTokens.map((token,index)=>{
      const fallbackToken=matchPlatformToken(token,index);
      if(!fallbackToken) return token;
      const preparedLooksGeneric=!token.lemma || normalizeLearningIdentity(token.lemma)===normalizeLearningIdentity(token.text) || token.pos==="X";
      return {
        ...fallbackToken,
        ...token,
        lemma:preparedLooksGeneric?(fallbackToken.lemma||token.lemma):token.lemma,
        pos:token.pos==="X"?(fallbackToken.pos||token.pos):token.pos,
      };
    });

    const fallbackByPreparedIndex=new Map();
    used.clear();
    for(let index=0;index<preparedTokens.length;index++){
      const fallbackToken=matchPlatformToken(preparedTokens[index],index);
      if(fallbackToken) fallbackByPreparedIndex.set(preparedTokens[index].i,fallbackToken);
    }

    for(const preparedToken of preparedTokens){
      const fallbackToken=fallbackByPreparedIndex.get(preparedToken.i);
      if(!fallbackToken) continue;
      const primaryKey=String(preparedToken.i);
      const primaryHover=merged.hover[primaryKey]||merged.hover[preparedToken.i]||{};
      const fallbackHover=platform.hover?.[String(fallbackToken.i)]||platform.hover?.[fallbackToken.i]||{};
      merged.hover[primaryKey]={
        ...fallbackHover,
        ...primaryHover,
        contextual_word_meaning_tr:firstMeaning(
          primaryHover.contextual_word_meaning_tr,
          fallbackHover.contextual_word_meaning_tr,
          fallbackHover.dictionary_meanings_tr
        ),
        dictionary_meanings_tr:meaningValues(primaryHover.dictionary_meanings_tr).length
          ? primaryHover.dictionary_meanings_tr
          : fallbackHover.dictionary_meanings_tr,
        lexical_form:primaryHover.lexical_form||fallbackHover.lexical_form,
        usage_notes:(primaryHover.usage_notes||[]).length?primaryHover.usage_notes:(fallbackHover.usage_notes||[]),
        primary_expressions:(primaryHover.primary_expressions||[]).length
          ? primaryHover.primary_expressions
          : (fallbackHover.primary_expressions||[]),
      };
    }
    return merged;
  }

  async function warmPreparedContextualMeanings(){
    if(adapter.id!=="web" || !activePreparedBenchmark()) return;
    const texts=(state.web.segments||[]).map(item=>item.text).filter(Boolean);
    if(!texts.length) return;
    let cursor=0;
    const worker=async()=>{
      while(cursor<texts.length){
        const index=cursor++;
        const text=texts[index];
        try{ await analyze(text); }catch(_error){}
      }
    };
    await Promise.all([worker(),worker(),worker()]);
  }

  async function analyze(text){
    const preparedFixture=activePreparedBenchmark();
    if(preparedFixture){
      const prepared=buildPreparedSentenceAnalysis(preparedFixture,text);
      try{
        const platform=await analyzePlatform(text);
        // Once persistent AI analysis is loaded for this exact sentence, it is
        // authoritative. Do not let benchmark/prepared data overwrite AI
        // meanings, structures, token membership, or provenance.
        if(platform?.analysis_source==="ai") return platform;
        const merged={...mergePreparedContextualAnalysis(prepared,platform),analysis_source:"local"};
        setAnalysisCache(text,merged);
        persistLocalAnalysis(text,merged,"prepared+german-engine").catch(()=>{});
        return merged;
      }catch(_error){
        if(prepared.sentence_meaning_tr || prepared.expressions.length || Object.keys(prepared.hover||{}).length){
          const localPrepared={...prepared,analysis_source:"local"};
          setAnalysisCache(text,localPrepared);
          persistLocalAnalysis(text,localPrepared,"prepared").catch(()=>{});
          return localPrepared;
        }
      }
    }
    return analyzePlatform(text);
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
        translationText=state.youtube.cues[state.youtube.cueIndex]?.text || node.dataset.gleText;
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

  function mediaForSubtitleNode(node){
    if(node===state.youtube.germanLine) return state.youtube.video || document.querySelector("video.html5-main-video") || document.querySelector("video");
    if(node===state.zdf.germanLine) return state.zdf.video || document.querySelector("video");
    return null;
  }

  function cancelSubtitleHoverResume(){
    clearTimeout(state.playback.hoverResumeTimer);
    state.playback.hoverResumeTimer=null;
  }

  function beginSubtitleHoverPause(node){
    if(state.settings.pauseOnWordHover!==true) return;
    const video=mediaForSubtitleNode(node);
    if(!video) return;
    cancelSubtitleHoverResume();
    state.playback.hoverAnchor=node;
    if(state.playback.hoverVideo===video) return;
    state.playback.hoverVideo=video;
    state.playback.hoverResume=!video.paused;
    if(!video.paused) video.pause();
  }

  function finishSubtitleHoverPause(){
    cancelSubtitleHoverResume();
    const video=state.playback.hoverVideo;
    const shouldResume=Boolean(video && state.playback.hoverResume);
    state.playback.hoverVideo=null;
    state.playback.hoverAnchor=null;
    state.playback.hoverResume=false;
    if(shouldResume && video.paused) video.play().catch(()=>{});
  }

  function scheduleSubtitleHoverResume(delay=180){
    if(!state.playback.hoverVideo) return;
    cancelSubtitleHoverResume();
    state.playback.hoverResumeTimer=setTimeout(()=>{
      state.playback.hoverResumeTimer=null;
      const anchor=state.playback.hoverAnchor;
      const tooltip=state.tooltip;
      if(anchor?.matches?.(":hover") || tooltip?.matches?.(":hover")) return;
      finishSubtitleHoverPause();
    },delay);
  }

  function installSubtitleHoverPause(node){
    if(!node || node.dataset.glePauseHoverBound==="1") return;
    node.dataset.glePauseHoverBound="1";
    node.addEventListener("mouseenter",()=>beginSubtitleHoverPause(node));
    node.addEventListener("mouseleave",event=>{
      const next=event.relatedTarget;
      if(next && state.tooltip?.contains(next)) return;
      scheduleSubtitleHoverResume();
    });
  }

  function autoPauseCueKey(provider,cue){
    return provider+":"+String(cue?.index ?? "");
  }

  function noteAutoPausePlaybackResume(provider,video,cues){
    if(state.settings.autoPauseAfterSentence!==true || !video || !state.playback.autoPausedCueKey) return;
    const cue=cueAtTime(cues,video.currentTime*1000);
    const key=cue ? autoPauseCueKey(provider,cue) : "";
    if(key && key===state.playback.autoPausedCueKey){
      state.playback.autoPauseReleasedCueKey=key;
    }
  }

  function clearAutoPauseTimer(){
    clearTimeout(state.playback.autoPauseTimer);
    state.playback.autoPauseTimer=null;
    state.playback.autoPauseScheduledKey="";
  }

  function maybeAutoPausePreviousCueAtTransition(video,cues,currentCue,provider){
    if(state.settings.autoPauseAfterSentence!==true || !video || video.paused || video.seeking) return false;
    const previousIndex=state.youtube.cueIndex;
    if(previousIndex<0 || previousIndex===currentCue?.index) return false;
    const previous=cues?.[previousIndex];
    if(!previous) return false;
    const previousKey=autoPauseCueKey(provider,previous);
    if(state.playback.autoPausedCueKey===previousKey || state.playback.autoPauseReleasedCueKey===previousKey) return false;
    const nowMs=video.currentTime*1000;
    const drift=nowMs-Number(previous.endMs||0);
    if(drift < -40 || drift > 750) return false;
    clearAutoPauseTimer();
    state.playback.autoPausedCueKey=previousKey;
    video.pause();
    return true;
  }

  function maybeAutoPauseCue(video,cue,provider){
    if(state.settings.autoPauseAfterSentence!==true || !video || !cue || video.paused) return;
    const key=autoPauseCueKey(provider,cue);
    if(state.playback.autoPausedCueKey===key || state.playback.autoPauseReleasedCueKey===key) return;
    if(state.playback.autoPauseReleasedCueKey && state.playback.autoPauseReleasedCueKey!==key){
      state.playback.autoPauseReleasedCueKey="";
      state.playback.autoPausedCueKey="";
    }
    if(state.playback.autoPauseScheduledKey===key) return;

    clearAutoPauseTimer();
    const remainingMs=Math.max(0,cue.endMs-(video.currentTime*1000));
    const playbackRate=Math.max(0.1,Number(video.playbackRate)||1);
    state.playback.autoPauseScheduledKey=key;
    state.playback.autoPauseTimer=setTimeout(()=>{
      state.playback.autoPauseTimer=null;
      state.playback.autoPauseScheduledKey="";
      if(state.settings.autoPauseAfterSentence!==true || video.paused) return;
      if(state.playback.autoPausedCueKey===key || state.playback.autoPauseReleasedCueKey===key) return;
      if((video.currentTime*1000)+8<cue.endMs){
        maybeAutoPauseCue(video,cue,provider);
        return;
      }
      state.playback.autoPausedCueKey=key;
      video.pause();
    },Math.ceil(remainingMs/playbackRate)+8);
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

  function createSentenceNavigationControls(overlay){
    const controls=document.createElement("div");
    controls.className="gle-sentence-nav";
    controls.setAttribute("role","group");
    controls.setAttribute("aria-label","Altyazı cümlesi oynatma kontrolleri");

    const items=[
      {action:"previous",label:"‹",title:"Önceki cümle (A)"},
      {action:"replay",label:"↻",title:"Cümleyi tekrar oynat (S)"},
      {action:"next",label:"›",title:"Sonraki cümle (D)"},
    ];
    for(const item of items){
      const button=document.createElement("button");
      button.type="button";
      button.dataset.sentenceNav=item.action;
      button.textContent=item.label;
      button.title=item.title;
      button.setAttribute("aria-label",item.title);
      controls.appendChild(button);
    }

    controls.addEventListener("pointerdown",event=>{
      event.stopPropagation();
    });
    controls.addEventListener("click",event=>{
      const button=event.target.closest?.("[data-sentence-nav]");
      if(!button) return;
      event.preventDefault();
      event.stopPropagation();

      const context=keyboardSentencePlaybackContext();
      if(!context) return;
      const current=context.index<0 ? 0 : context.index;
      let target=current;
      if(button.dataset.sentenceNav==="previous") target=Math.max(0,current-1);
      if(button.dataset.sentenceNav==="next") target=Math.min(context.cues.length-1,current+1);
      playSentenceFromKeyboard(target);
    });

    overlay.appendChild(controls);
    return controls;
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
      installSubtitleHoverPause(germanLine);
      createSentenceNavigationControls(overlay);
      player.appendChild(overlay);
      installYouTubeDragHandle(player,overlay,handle);
    }

    state.youtube.overlay=overlay;
    state.youtube.germanLine=overlay.querySelector(".gle-youtube-german");
    installSubtitleHoverPause(state.youtube.germanLine);
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
    state.aiIndexLastStatus="";
    state.aiIndexBusy=false;
    state.aiIndexDiagnostic=null;
    renderAiLabDialog();
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
    if(adapter.id==="web"){
      focusWebSegment(index);
      return;
    }
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

  function keyboardSentencePlaybackContext(){
    if(state.settings.extensionEnabled===false) return null;
    if(adapter.id!=="youtube" && adapter.id!=="zdf") return null;

    const cues=adapter.id==="zdf" ? state.zdf.cues : state.youtube.cues;
    if(!Array.isArray(cues) || !cues.length) return null;

    const video=adapter.id==="zdf" ? bindZdfVideo() : bindYouTubeVideo();
    if(!video) return null;

    const nowMs=video.currentTime*1000;
    const current=cueAtTime(cues,nowMs);
    let index=Number.isInteger(current?.index)
      ? current.index
      : (adapter.id==="zdf" ? state.zdf.cueIndex : state.youtube.cueIndex);

    if(!Number.isInteger(index) || index<0 || index>=cues.length){
      index=cues.findLastIndex?.(cue=>Number(cue?.startMs||0)<=nowMs) ?? -1;
      if(index<0){
        index=cues.findIndex(cue=>Number(cue?.startMs||0)>nowMs);
      }
    }

    return {video,cues,index};
  }

  function playSentenceFromKeyboard(targetIndex){
    const context=keyboardSentencePlaybackContext();
    if(!context) return false;

    const {video,cues}=context;
    const index=Math.max(0,Math.min(Number(targetIndex),cues.length-1));
    const cue=cues[index];
    if(!cue) return false;

    stopYouTubePreview();
    clearAutoPauseTimer();
    state.playback.autoPausedCueKey="";
    state.playback.autoPauseReleasedCueKey="";
    state.playback.autoPauseScheduledKey="";

    // Do not pre-set cueIndex before rendering. renderZdfCue/renderTimedCue
    // use an index change as the signal to replace the visible subtitle text.
    // Pre-setting it caused A/S/D and the subtitle buttons to seek/play the
    // right audio while leaving the previous German/Turkish subtitle on screen.
    if(adapter.id==="zdf"){
      state.zdf.cueIndex=-1;
      state.youtube.cueIndex=-1;
    }else{
      state.youtube.cueIndex=-1;
    }

    video.currentTime=Math.max(0,Number(cue.startMs||0)/1000);

    if(adapter.id==="zdf"){
      renderZdfCue(Number(cue.startMs||0)/1000);
    }else{
      renderTimedCue(Number(cue.startMs||0)/1000,5);
    }
    focusPanelSentence(index);
    video.play().catch(()=>{});
    return true;
  }

  function isEditableKeyboardTarget(target){
    if(!target) return false;
    const element=target.nodeType===Node.ELEMENT_NODE ? target : target.parentElement;
    return Boolean(element?.closest?.("input,textarea,select,[contenteditable=true],[contenteditable=''],[role=textbox]"));
  }

  function installSentencePlaybackShortcuts(){
    document.addEventListener("keydown",event=>{
      if(event.defaultPrevented || event.repeat) return;
      if(event.metaKey || event.ctrlKey || event.altKey) return;
      if(isEditableKeyboardTarget(event.target)) return;

      const code=event.code;
      if(code!=="KeyA" && code!=="KeyS" && code!=="KeyD") return;

      const context=keyboardSentencePlaybackContext();
      if(!context) return;

      let target=context.index;
      if(code==="KeyA") target=Math.max(0,(context.index<0?0:context.index)-1);
      if(code==="KeyD") target=Math.min(context.cues.length-1,(context.index<0?-1:context.index)+1);
      if(code==="KeyS" && target<0) target=0;

      event.preventDefault();
      event.stopPropagation();
      if(typeof event.stopImmediatePropagation==="function") event.stopImmediatePropagation();
      playSentenceFromKeyboard(target);
    },true);
  }

  installSentencePlaybackShortcuts();

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
    // Anchor the shared handle to the panel's actual rendered left edge.
    // This avoids provider-specific right insets making ZDF overlap the handle.
    const centerY=Math.max(52,Math.min(innerHeight-52,Math.min(120,rect.height*0.22)));
    document.documentElement.style.setProperty("--gle-panel-handle-top",centerY+"px");
    document.documentElement.style.setProperty("--gle-panel-handle-left",rect.left+"px");
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
    if(adapter.id==="web"){
      if(!panel) return;
      if(panel.parentElement!==document.documentElement) document.documentElement.appendChild(panel);
      const handle=state.panel.handle;
      if(handle && handle.parentElement!==document.documentElement) document.documentElement.appendChild(handle);
      state.panel.docked=false;
      panel.classList.remove("docked","gle-provider-panel-layout","gle-youtube-fullscreen-panel");
      panel.classList.add("gle-youtube-external-panel","gle-web-page-panel");
      const viewportWidth=window.innerWidth || document.documentElement.clientWidth || 1;
      const viewportHeight=window.innerHeight || document.documentElement.clientHeight || 1;
      const basePanelWidth=Math.min(408,Math.max(320,viewportWidth*0.30));
      const factor=clamp(Number(state.settings.panelWidthFactor)||1,0.6,1.1);
      const panelWidth=Math.min(viewportWidth*0.45,Math.max(220,basePanelWidth*factor));
      const open=!state.panel.collapsed;
      const left=Math.max(0,viewportWidth-panelWidth);
      document.documentElement.style.setProperty("--gle-panel-base-width",basePanelWidth+"px");
      document.documentElement.style.setProperty("--gle-youtube-panel-left",left+"px");
      document.documentElement.style.setProperty("--gle-youtube-panel-top","0px");
      document.documentElement.style.setProperty("--gle-youtube-panel-width",panelWidth+"px");
      document.documentElement.style.setProperty("--gle-youtube-panel-height",viewportHeight+"px");
      document.documentElement.style.setProperty("--gle-panel-current-width",panelWidth+"px");
      document.documentElement.style.setProperty("--gle-web-panel-space",open?panelWidth+"px":"0px");
      document.documentElement.classList.toggle("gle-web-panel-open",open);
      requestAnimationFrame(()=>{syncPanelHandleGeometry(panel);scheduleWebLearningAnnotations();});
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
    if(!["youtube","zdf","web"].includes(adapter.id)) return null;
    if(state.panel.element?.isConnected){
      syncSharedPanelHost();
      return state.panel.element;
    }

    const panel=document.createElement("aside");
    panel.id="gle-shared-panel";
    panel.className="gle-shared-panel";
    panel.innerHTML='<div class="gle-panel-resizer" role="separator" aria-orientation="vertical" title="Panel genişliğini ayarla"></div><button type="button" class="gle-panel-size-reset" aria-label="Panel genişliğini varsayılana getir" title="Panel genişliğini varsayılana getir"><span aria-hidden="true"></span></button><div class="gle-panel-productbar"><strong>Language Learning</strong><div class="gle-panel-actions"><label class="gle-master-switch" title="Language Learning"><input class="gle-header-main-toggle" type="checkbox"><span></span><em>'+esc(uiText("active"))+'</em></label><button type="button" class="gle-header-ai-analyze" aria-label="Bu içeriği AI ile analiz et" title="Bu içeriği AI ile analiz et">AI</button><button type="button" class="gle-header-ge-status" aria-label="German Engine durumu" title="German Engine durumu">GE</button><button type="button" class="gle-header-export" aria-label="'+escAttr(uiText("exportData"))+'" title="'+escAttr(uiText("exportData"))+'">⇩</button><button type="button" class="gle-header-settings" aria-label="'+escAttr(uiText("settings"))+'" title="'+escAttr(uiText("settings"))+'">⚙</button></div></div><div class="gle-panel-head"><div class="gle-panel-tabs"><button type="button" data-tab="subtitles">'+esc(uiText("subtitles"))+'</button><button type="button" data-tab="words">'+esc(uiText("words"))+'</button><button type="button" data-tab="saved">'+esc(uiText("saved"))+'</button></div></div><div class="gle-panel-body"></div>';

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
    panel.querySelector(".gle-header-ai-analyze").addEventListener("click",()=>runCurrentContentAiIndex());
    panel.querySelector(".gle-header-ge-status").addEventListener("click",()=>openSystemMonitor("ge"));
    panel.querySelector(".gle-header-export").addEventListener("click",()=>ensureExportDialog());
    panel.querySelector(".gle-panel-size-reset").addEventListener("click",async()=>{
      state.settings.panelWidthFactor=1;
      await chrome.storage.sync.set({panelWidthFactor:1});
      setSharedPanelCollapsed(false);
      syncSharedPanelHost();
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
    ensureAiLabDialog();
    syncSystemMonitorVisibility();

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

  function focusPanelSentence(index){
    if(!Number.isInteger(index) || index<0) return;
    const changed=state.youtube.cueIndex!==index;
    state.youtube.cueIndex=index;
    const panel=state.panel.element;
    if(!panel || state.panel.collapsed) return;

    if(state.panel.tab!=="subtitles"){
      state.panel.tab="subtitles";
      state.panel.selectedLemma="";
      state.panel.selectedGroupKey="";
      renderSharedPanel();
    }else if(changed){
      updatePanelActiveCue();
    }

    const alignCurrentToTop=()=>{
      const current=state.panel.element?.querySelector('[data-cue-index="'+index+'"]');
      if(!current) return;
      state.panel.element?.querySelectorAll(".gle-transcript-row.active").forEach(row=>{
        if(row!==current) row.classList.remove("active");
      });
      current.classList.add("active");
      const body=current.closest(".gle-panel-body");
      if(body){
        const controls=body.querySelector(".gle-transcript-controls");
        const stickyOffset=controls?.getBoundingClientRect().height||0;
        const delta=current.getBoundingClientRect().top-body.getBoundingClientRect().top-stickyOffset;
        body.scrollTop=Math.max(0,body.scrollTop+delta-2);
      }else{
        current.scrollIntoView({block:"start"});
      }
    };
    requestAnimationFrame(()=>{
      alignCurrentToTop();
      // Rendering/translation insertion can move rows after the first frame.
      // Align once more so hover focus consistently lands at the panel top.
      requestAnimationFrame(alignCurrentToTop);
    });
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
    return "gleExpressionGroups:v4:"+state.youtube.videoId+":"+cues.length+":"+Math.round(first?.startMs||0)+":"+Math.round(last?.endMs||0);
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
          const response=await platformFetch(apiBase+"/api/v1/expression-groups-batch",{
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
            const canonical=String(expression.canonical||expression.surface||"").trim();
            const type=String(expression.type||"");
            const key=type+"|"+canonical.toLocaleLowerCase("de-DE");
            let entry=grouped.get(key);
            if(!entry){
              entry={
                key,
                type,
                patternId:String(expression.pattern_id||""),
                canonical,
                count:0,
                forms:new Set(),
                occurrences:[],
                meaningTr:expression.contextual_meaning_tr || (expression.meaning_tr||[])[0] || "",
                grammarHint:expression.grammar_hint || "",
              };
              grouped.set(key,entry);
            }else{
              if(!entry.patternId && expression.pattern_id) entry.patternId=String(expression.pattern_id);
              if(!entry.meaningTr) entry.meaningTr=expression.contextual_meaning_tr || (expression.meaning_tr||[])[0] || "";
              if(!entry.grammarHint && expression.grammar_hint) entry.grammarHint=expression.grammar_hint;
            }
            if(expression.surface) entry.forms.add(String(expression.surface));
            if(!entry.occurrences.includes(cueIndex)){
              entry.occurrences.push(cueIndex);
              entry.count+=1;
            }
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
    return "gleTranscriptAnalysis:v4:"+state.youtube.videoId+":"+cues.length+":"+Math.round(first?.startMs||0)+":"+Math.round(last?.endMs||0);
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
          if(adapter.id==="web") scheduleWebLearningAnnotations();
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
          const response=await platformFetch(apiBase+"/api/v1/tokens-batch",{
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
            const lemma=sanitizeLearningText(token.lemma).toLocaleLowerCase("de-DE");
            if(!lemma || !/[\p{L}]/u.test(lemma)) continue;
            let entry=words.get(lemma);
            if(!entry){
              entry={lemma,pos,count:0,forms:new Set(),occurrences:[],
                article:sanitizeLearningText(token.article||token.lexical_form?.article||""),
                singular:sanitizeLearningText(token.singular||token.lexical_form?.singular||""),
                plural:sanitizeLearningText(token.plural||token.lexical_form?.plural||"")};
              words.set(lemma,entry);
            }
            entry.count+=1;
            if(!entry.article) entry.article=sanitizeLearningText(token.article||token.lexical_form?.article||"");
            if(!entry.singular) entry.singular=sanitizeLearningText(token.singular||token.lexical_form?.singular||"");
            if(!entry.plural) entry.plural=sanitizeLearningText(token.plural||token.lexical_form?.plural||"");
            const surface=sanitizeLearningText(token.text||lemma);
            if(surface && /[\p{L}]/u.test(surface)) entry.forms.add(surface);
            if(!entry.occurrences.includes(index)) entry.occurrences.push(index);
          }
        });

        const analysis=[...words.values()]
          .map(entry=>({lemma:entry.lemma,pos:entry.pos,count:entry.count,forms:[...entry.forms],occurrences:entry.occurrences,article:entry.article||"",singular:entry.singular||"",plural:entry.plural||""}))
          .sort((a,b)=>b.count-a.count || a.lemma.localeCompare(b.lemma,"de"));

        state.youtube.transcriptAnalysis=analysis;
        chrome.storage.local.set({[cacheKey]:analysis}).catch(()=>{});
        analyzeWholeYouTubeExpressionGroups();
        if(state.panel.element) renderSharedPanel();
        if(adapter.id==="web") scheduleWebLearningAnnotations();
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
    controls.innerHTML=(adapter.id==="web"
      ? '<span>'+esc(uiText("translation"))+'</span><div class="gle-transcript-switches"><label class="gle-translation-switch"><em>'+esc(uiText("panelTranslation"))+'</em><input type="checkbox" data-setting="showPanelTranslation" '+(state.settings.showPanelTranslation!==false?"checked":"")+'><span></span></label></div>'
      : '<span>'+esc(uiText("translation"))+'</span><div class="gle-transcript-switches"><label class="gle-translation-switch"><em>'+esc(uiText("videoTranslation"))+'</em><input type="checkbox" data-setting="showVideoTranslation" '+(state.settings.showVideoTranslation!==false?"checked":"")+'><span></span></label><label class="gle-translation-switch"><em>'+esc(uiText("panelTranslation"))+'</em><input type="checkbox" data-setting="showPanelTranslation" '+(state.settings.showPanelTranslation!==false?"checked":"")+'><span></span></label></div>')+
      '<label class="gle-panel-search gle-sentence-search"><span>⌕</span><input type="search" data-subtitle-search placeholder="Cümlelerde ara…" value="'+escAttr(state.panel.subtitleSearch||"")+'"></label>';
    controls.querySelectorAll("input[data-setting]").forEach(input=>input.addEventListener("change",async event=>{
      const name=event.target.dataset.setting;
      state.settings[name]=event.target.checked;
      await chrome.storage.sync.set({[name]:event.target.checked});
      if(name==="showVideoTranslation") refreshVideoTranslations();
      if(name==="showPanelTranslation") renderSharedPanel();
    }));
    const subtitleSearch=controls.querySelector("[data-subtitle-search]");
    subtitleSearch?.addEventListener("input",()=>{
      state.panel.subtitleSearch=subtitleSearch.value;
      const cursor=subtitleSearch.selectionStart;
      renderSharedPanel();
      requestAnimationFrame(()=>{
        const next=state.panel.element?.querySelector("[data-subtitle-search]");
        next?.focus();
        try{next?.setSelectionRange(cursor,cursor);}catch(_error){}
      });
    });
    const list=document.createElement("div");
    list.className="gle-transcript-list";
    const subtitleQuery=String(state.panel.subtitleSearch||"").trim().toLocaleLowerCase("de-DE");
    cues.forEach((cue,index)=>{
      if(subtitleQuery && !String(cue.text||"").toLocaleLowerCase("de-DE").includes(subtitleQuery)) return;
      const row=document.createElement("button");
      row.type="button";
      row.className="gle-transcript-row"+(index===state.youtube.cueIndex?" active":"");
      row.dataset.cueIndex=String(index);
      const cached=state.panelTranslationCache.get(cue.text)||"";
      row.innerHTML=(adapter.id==="web"
        ? '<span class="gle-row-time gle-row-web-index">'+String(index+1)+'</span>'
        : '<span class="gle-row-time">'+panelClock(cue.startMs)+'</span>')+
        '<span class="gle-row-text"><span class="gle-row-source">'+esc(cue.text)+'</span>'+(state.settings.showPanelTranslation!==false?'<span class="gle-row-translation" data-translation-index="'+index+'">'+esc(cached)+'</span>':"")+'</span><span class="gle-row-play">'+(adapter.id==="web"?"↗":"▶")+'</span>';
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
      const item=learningItemForLemma(entry.lemma);
      const status=item ? itemStatus(item) : "";
      return '<div class="gle-word-chip-wrap">'+
        '<button type="button" class="gle-word-chip'+(status==="learning"?" learning":"")+'" data-lemma="'+escAttr(entry.lemma)+'"><span>'+esc(panelWordLabel(entry))+'</span><b>'+entry.count+'×</b></button>'+
        '<button type="button" class="gle-word-status gle-word-star '+(status==="learning"?"active":"")+'" data-word-learning="'+escAttr(entry.lemma)+'" title="Öğreniyorum">'+(status==="learning"?"★":"☆")+'</button>'+
        '<button type="button" class="gle-word-status '+(status==="learned"?"active":"")+'" data-word-known="'+escAttr(entry.lemma)+'" title="Biliyorum">✓</button>'+
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
    body.innerHTML='<div class="gle-word-detail-head"><button type="button" class="gle-word-back">← Kelimeler</button><div><strong>'+esc(panelWordLabel(entry))+'</strong><span>'+entry.count+' kez'+(learning?" · ★ Öğreniyorum":"")+'</span></div></div>'+(entry.meaningTr?'<div class="gle-context gle-context-primary"><b>Bu içerikte:</b> '+esc(entry.meaningTr)+'</div>':'')+'<div class="gle-word-forms">İçerikteki biçimler: '+esc(entry.forms.join(", "))+'</div><div class="gle-word-occurrences">'+rows+'</div>';
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
    if(!entries?.length) return '<section class="gle-expression-groups"><h3>Kelime grupları</h3><div class="gle-groups-empty">Bu içerikte desteklenen kelime grubu bulunamadı.</div></section>';
    const order=["IDIOM","NOMEN_VERB","FUNCTION_VERB","FIXED_CONSTRUCTION","COLLOCATION","VERB_PREPOSITION","REFLEXIVE_VERB_PREPOSITION","REFLEXIVE_VERB","NOUN_PREPOSITION","ADJECTIVE_PREPOSITION","PARTICLE_VERB","COPULAR_CONSTRUCTION","CONNECTOR","GRAMMAR_CONSTRUCTION"];
    const sections=order.map(type=>{
      const items=entries.filter(entry=>entry.type===type);
      if(!items.length) return "";
      const chips=items.map(entry=>{
        const savedItem=learningItemForExpression(entry);
        const status=savedItem ? itemStatus(savedItem) : "";
        return '<div class="gle-expression-chip-wrap">'+
          '<button type="button" class="gle-expression-chip'+(status==="learning"?" learning":"")+'" data-group-key="'+escAttr(entry.key)+'"><span>'+esc(entry.canonical)+'</span><b>'+entry.count+'×</b></button>'+
          '<button type="button" class="gle-expression-status gle-expression-star '+(status==="learning"?"active":"")+'" data-expression-learning="'+escAttr(entry.key)+'" title="Öğreniyorum">'+(status==="learning"?"★":"☆")+'</button>'+
          '<button type="button" class="gle-expression-status '+(status==="learned"?"active":"")+'" data-expression-known="'+escAttr(entry.key)+'" title="Biliyorum">✓</button>'+
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
      '<div class="gle-word-forms">İçerikteki biçimler: '+esc(entry.forms.join(", "))+'</div>'+
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
      '<label class="gle-word-search"><span>⌕</span><input type="search" placeholder="Bu içerikte kelime ara…" value="'+escAttr(q)+'" aria-label="Bu içerikte kelime ara"></label>'+
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

  function sanitizeLearningText(value){
    return String(value||"")
      .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/gu,"")
      .replace(/\s+/g," ")
      .trim();
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
        const fixture=activePreparedBenchmark();
        if(fixture){
          state.panel.senseRows=preparedWordAnalysis(fixture).map(entry=>({
            key:"prepared-word:"+normalizeLearningIdentity(entry.lemma),
            lemma:entry.lemma,
            canonical:entry.lemma,
            meaningTr:entry.meaningTr||"",
            unitType:posLabel(entry.pos||""),
            senseId:"",
            patternId:"",
            cueIndex:entry.occurrences?.[0]??0,
            surface:entry.forms?.[0]||entry.lemma,
            occurrences:[...(entry.occurrences||[])],
            wordEntry:entry,
          }));
          return;
        }

        const apiBase=await platformApiBase();
        const rows=new Map();
        const batchSize=120;
        for(let offset=0;offset<cues.length;offset+=batchSize){
          const chunk=cues.slice(offset,offset+batchSize);
          const response=await platformFetch(apiBase+"/api/v1/learning-units-batch",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({source_language:"de",texts:chunk.map(cue=>cue.text)}),
          });
          if(!response.ok) throw new Error("learning unit analysis "+response.status);
          const payload=await response.json();
          (payload.items||[]).forEach((item,index)=>{
            const cueIndex=offset+index;
            for(const unit of item.learning_units||[]){
              const canonical=sanitizeLearningText(unit.canonical||unit.lemma||"");
              const lemma=sanitizeLearningText(unit.lemma||canonical);
              const surface=sanitizeLearningText(unit.surface||canonical);
              if(!canonical || !/[\p{L}]/u.test(canonical)) continue;
              const key=String(unit.id||"");
              if(!key) continue;
              let row=rows.get(key);
              if(!row){
                row={
                  key,lemma,canonical,
                  meaningTr:sanitizeLearningText(unit.meaning_tr||""),
                  unitType:sanitizeLearningText(unit.unit_type||"Kelime"),
                  senseId:String(unit.sense_id||""),
                  patternId:String(unit.pattern_id||""),
                  cueIndex,surface,occurrences:[],
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

  function senseRowsWithExpressions(){
    const rows=[...(state.panel.senseRows||[])];
    for(const entry of state.youtube.expressionGroupsAnalysis||[]){
      const existing=rows.find(row=>expressionIdentityMatches(row,entry));
      if(existing){
        existing.expressionEntry=entry;
        existing.patternId=entry.patternId||existing.patternId||"";
        existing.canonical=entry.canonical||existing.canonical;
        existing.lemma=entry.canonical||existing.lemma;
        existing.meaningTr=entry.meaningTr||existing.meaningTr||"";
        existing.unitType=expressionGroupLabel(entry.type);
        existing.surface=entry.forms?.[0]||existing.surface||entry.canonical;
        existing.occurrences=[...new Set([...(existing.occurrences||[]),...(entry.occurrences||[])])].sort((a,b)=>a-b);
        existing.cueIndex=existing.occurrences[0]??existing.cueIndex??0;
        continue;
      }
      const exprKey=normalizeLearningIdentity(entry.patternId||entry.canonical);
      if(!exprKey) continue;
      rows.push({
        key:"expression:"+exprKey,
        lemma:entry.canonical,
        canonical:entry.canonical,
        meaningTr:entry.meaningTr||"",
        unitType:expressionGroupLabel(entry.type),
        senseId:"",
        patternId:entry.patternId||"",
        cueIndex:entry.occurrences?.[0]??0,
        surface:entry.forms?.[0]||entry.canonical,
        occurrences:[...(entry.occurrences||[])],
        expressionEntry:entry,
      });
    }
    return rows.sort((a,b)=>String(a.canonical||"").localeCompare(String(b.canonical||""),"de") || String(a.meaningTr||"").localeCompare(String(b.meaningTr||""),"tr"));
  }

  async function setSenseStatus(row,status){
    if(row?.wordEntry){
      await setLearningStatus({
        kind:"word",
        key:row.lemma,
        label:panelWordLabel(row.wordEntry)||row.lemma,
        meaning_tr:row.meaningTr,
        surface:row.surface||row.lemma,
      },status);
      return;
    }
    await setLearningStatus({
      kind:"learning-unit",
      key:row.key,
      label:row.canonical,
      meaning_tr:row.meaningTr,
    },status);
  }

  function renderWordSenseTable(body){
    if(state.panel.senseRowsVideoId!==state.youtube.videoId || !state.panel.senseRows){
      body.innerHTML='<div class="gle-panel-summary"><strong>'+(state.youtube.transcriptAnalysis?.length||0)+'</strong><span>farklı lemma</span><strong>'+(state.youtube.cues||[]).length+'</strong><span>cümle</span></div>'+wordsToolbar(state.youtube.transcriptAnalysis||[])+'<div class="gle-panel-empty"><b>Anlamlar hazırlanıyor…</b><span>Her kullanım cümle bağlamında analiz ediliyor.</span></div>';
      bindPanelWordControls(body,state.youtube.transcriptAnalysis||[]);
      Promise.all([analyzePanelWordSenses(),analyzeWholeYouTubeExpressionGroups()]).catch(()=>{});
      return;
    }
    const q=String(state.panel.wordsSearch||"").trim().toLocaleLowerCase("de-DE");
    const rows=senseRowsWithExpressions().filter(row=>!q || String(row.lemma||"").toLocaleLowerCase("de-DE").includes(q) || String(row.meaningTr||"").toLocaleLowerCase("tr-TR").includes(q));
    const table='<div class="gle-sense-table"><div class="gle-sense-head"><span>Öğrenme birimi</span><span>Bu kullanımdaki anlam</span><span>Tür</span><span>Durum</span></div>'+rows.map(row=>{
      const item=row.expressionEntry
        ? learningItemForExpression(row.expressionEntry)
        : row.wordEntry
          ? learningItemForLemma(row.lemma)
          : learningItemForSense(row);
      const learning=item && itemStatus(item)==="learning";
      const known=item && itemStatus(item)==="learned";
      return '<div class="gle-sense-row" data-sense-key="'+escAttr(row.key)+'"><button type="button" class="gle-sense-word" data-sense-jump="'+escAttr(row.key)+'">'+esc(row.canonical)+'</button><span class="gle-sense-meaning">'+esc(row.meaningTr)+'</span><span class="gle-sense-type">'+esc(row.unitType)+'</span><span class="gle-sense-actions"><button type="button" data-sense-learn="'+escAttr(row.key)+'" class="'+(learning?"active":"")+'" title="Öğreniyorum">'+(learning?"★":"☆")+'</button><button type="button" data-sense-known="'+escAttr(row.key)+'" class="'+(known?"active":"")+'" title="Biliyorum">✓</button></span></div>';
    }).join("")+'</div>';
    body.innerHTML='<div class="gle-panel-summary"><strong>'+rows.length+'</strong><span>anlam/kullanım</span><strong>'+(state.youtube.cues||[]).length+'</strong><span>cümle</span></div>'+wordsToolbar(state.youtube.transcriptAnalysis||[])+(rows.length?table:'<div class="gle-panel-empty">Sonuç bulunamadı.</div>');
    bindPanelWordControls(body,state.youtube.transcriptAnalysis||[]);
    body.querySelectorAll("[data-sense-jump]").forEach(button=>button.addEventListener("click",()=>{
      const row=senseRowsWithExpressions().find(item=>item.key===button.dataset.senseJump);
      if(row) playYouTubeCue(row.cueIndex);
    }));
    const bindStatus=(selector,status)=>body.querySelectorAll(selector).forEach(button=>button.addEventListener("click",async()=>{
      const key=button.dataset.senseLearn||button.dataset.senseKnown;
      const row=senseRowsWithExpressions().find(item=>item.key===key);
      if(!row) return;
      button.disabled=true;
      try{
        if(row.expressionEntry){
          await setLearningStatus({kind:"expression",key:row.expressionEntry.patternId||row.expressionEntry.canonical,label:row.expressionEntry.canonical,meaning_tr:row.expressionEntry.meaningTr||"",surface:row.surface},status);
        }else{
          await setSenseStatus(row,status);
        }
        renderSharedPanel();
      }catch(error){console.warn("Word sense status failed",error);button.disabled=false;}
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
      button.addEventListener("click",event=>{
        event.preventDefault();
        event.stopPropagation();
        showPanelWordTooltip(button,entry);
      });
      button.addEventListener("dblclick",event=>{
        event.preventDefault();
        event.stopPropagation();
        if(adapter.id!=="web" || !entry?.occurrences?.length) return;
        const item={kind:"word",key:entry.lemma,label:entry.lemma,meaning_tr:entry.meaningTr||""};
        focusSavedOccurrence(item,entry.occurrences[0]);
      });
    });

    body.querySelectorAll(".gle-expression-chip").forEach(button=>{
      const entry=(state.youtube.expressionGroupsAnalysis||[]).find(item=>item.key===button.dataset.groupKey);
      button.addEventListener("click",event=>{
        event.preventDefault();
        event.stopPropagation();
        showPanelExpressionTooltip(button,entry);
      });
      button.addEventListener("dblclick",event=>{
        event.preventDefault();
        event.stopPropagation();
        if(adapter.id!=="web" || !entry?.occurrences?.length) return;
        const item={kind:"expression",key:entry.patternId||entry.canonical,label:entry.canonical,meaning_tr:entry.meaningTr||""};
        focusSavedOccurrence(item,entry.occurrences[0]);
      });
    });

    const bindExpressionStatus=(selector,status,dataKey)=>body.querySelectorAll(selector).forEach(button=>{
      button.addEventListener("click",async event=>{
        event.stopPropagation();
        const entry=(state.youtube.expressionGroupsAnalysis||[]).find(item=>item.key===button.dataset[dataKey]);
        if(!entry) return;
        button.disabled=true;
        try{
          await setLearningStatus({
            kind:"expression",
            key:entry.patternId||entry.canonical,
            label:entry.canonical,
            meaning_tr:entry.meaningTr||"",
          },status);
          renderSharedPanel();
        }catch(error){
          console.warn("Expression status failed",error);
          button.disabled=false;
        }
      });
    });
    bindExpressionStatus("[data-expression-learning]","learning","expressionLearning");
    bindExpressionStatus("[data-expression-known]","learned","expressionKnown");

    const bindWordStatus=(selector,status,dataKey)=>body.querySelectorAll(selector).forEach(button=>{
      button.addEventListener("click",async event=>{
        event.stopPropagation();
        const lemma=button.dataset[dataKey];
        if(!lemma) return;
        button.disabled=true;
        try{
          await setLearningStatus({kind:"word",key:lemma,label:lemma},status);
          renderSharedPanel();
        }catch(error){
          console.warn("Word status failed",error);
          button.disabled=false;
        }
      });
    });
    bindWordStatus("[data-word-learning]","learning","wordLearning");
    bindWordStatus("[data-word-known]","learned","wordKnown");

  }

  function renderPanelWords(body){
    const analysis=state.youtube.transcriptAnalysis;
    if(!analysis){
      body.innerHTML='<div class="gle-panel-empty"><b>İçerikteki kelimeler analiz ediliyor…</b><span>Altyazıdaki kelimeler lemma bazında gruplanıyor.</span></div>';
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
        wordGroup("★ Bu içerikte geçen öğrendiğim kelimeler",learning)+
        wordGroup("Bu içerikte sık geçenler",frequent)+
        wordGroup("Diğer kelimeler",others);
    }

    if(!content){
      content='<div class="gle-panel-empty"><b>Sonuç bulunamadı.</b><span>Arama kelimesini değiştir.</span></div>';
    }

    body.innerHTML='<div class="gle-panel-summary"><strong>'+analysis.length+'</strong><span>farklı lemma</span><strong>'+(state.youtube.cues||[]).length+'</strong><span>cümle</span></div>'+
      wordsToolbar(analysis)+content;
    bindPanelWordControls(body,analysis);
  }

  function currentContentLearningKeys(){
    const keys=new Set();
    const words=state.youtube.transcriptAnalysis||[];
    const expressions=state.youtube.expressionGroupsAnalysis||[];
    for(const entry of words) keys.add(learningKey("word",entry.lemma));
    for(const entry of expressions){
      if(entry.patternId) keys.add(learningKey("expression",entry.patternId));
      if(entry.canonical) keys.add(learningKey("expression",entry.canonical));
    }
    for(const row of state.panel.senseRows||[]) keys.add(learningKey("learning-unit",row.key));
    for(const item of state.learningItems){
      if(item.kind!=="learning-unit") continue;
      const label=String(item.label||"").toLocaleLowerCase("de-DE");
      if(words.some(entry=>String(entry.lemma||"").toLocaleLowerCase("de-DE")===label) ||
         expressions.some(entry=>String(entry.canonical||"").toLocaleLowerCase("de-DE")===label)){
        keys.add(learningKey(item.kind,item.key));
      }
    }
    return keys;
  }

  function learningItemSavedFromCurrentContent(item){
    const descriptor=currentContentDescriptor();
    const source=item?.metadata?.content_source||{};
    if(String(source.provider||"")===descriptor.provider &&
       String(source.externalId||source.external_id||"")===String(descriptor.externalId||"")) return true;
    if(String(source.url||"") && String(source.url)===String(descriptor.url||"")) return true;
    const encounters=Array.isArray(item?.encounters)?item.encounters:[];
    if(encounters.some(encounter=>{
      const provider=String(encounter.provider||"");
      const external=String(encounter.external_id||"");
      const url=String(encounter.url||encounter.context?.page_url||"");
      if(provider && provider===descriptor.provider && external && external===descriptor.externalId) return true;
      return Boolean(url && (url===descriptor.url || url===location.href));
    })) return true;
    const hasSource=Boolean(source.provider||source.url||encounters.length);
    return !hasSource && contentOccurrencesForLearningItem(item).length>0;
  }

  function filteredSavedItems(){
    const all=[...state.learningItems].sort((a,b)=>String(a.label||a.key||"").localeCompare(String(b.label||b.key||""),"de"));
    if(state.panel.savedView==="from-content") return all.filter(learningItemSavedFromCurrentContent);
    if(state.panel.savedView==="present-content") return all.filter(item=>contentOccurrencesForLearningItem(item).length>0);
    if(state.panel.savedView==="known") return all.filter(item=>itemStatus(item)==="learned");
    return all.filter(item=>itemStatus(item)==="learning");
  }

  function contentOccurrencesForLearningItem(item){
    const wantedKey=String(item?.key||"").toLocaleLowerCase("de-DE");
    const wantedLabel=String(item?.label||"").toLocaleLowerCase("de-DE");
    const word=(state.youtube.transcriptAnalysis||[]).find(entry=>{
      const lemma=String(entry.lemma||"").toLocaleLowerCase("de-DE");
      return lemma===wantedKey || lemma===wantedLabel;
    });
    const expression=(state.youtube.expressionGroupsAnalysis||[]).find(entry=>
      expressionIdentityMatches(item,entry) ||
      normalizeLearningIdentity(entry.patternId)===wantedKey ||
      normalizeLearningIdentity(entry.canonical)===wantedKey ||
      normalizeLearningIdentity(entry.canonical)===wantedLabel
    );
    const sense=(state.panel.senseRows||[]).find(row=>
      String(row.key||"").toLocaleLowerCase("de-DE")===wantedKey ||
      String(row.canonical||"").toLocaleLowerCase("de-DE")===wantedLabel ||
      String(row.lemma||"").toLocaleLowerCase("de-DE")===wantedLabel
    );
    return [...new Set([
      ...(expression?.occurrences||[]),
      ...(word?.occurrences||[]),
      ...(sense?.occurrences||[]),
    ])].sort((a,b)=>a-b);
  }

  function webTextNodes(element){
    const nodes=[];
    if(!element) return nodes;
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        const parent=node.parentElement;
        if(!parent || parent.closest("#gle-shared-panel,#gle-tooltip,#gle-export-dialog,#gle-settings-dialog,.gle-web-learning-layer")) return NodeFilter.FILTER_REJECT;
        return node.nodeValue ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    while(walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function webRangeFromOffsets(element,start,end){
    if(!element || end<=start) return null;
    const nodes=webTextNodes(element);
    let cursor=0,startNode=null,endNode=null,startOffset=0,endOffset=0;
    for(const node of nodes){
      const length=String(node.nodeValue||"").length;
      if(!startNode && start>=cursor && start<=cursor+length){
        startNode=node;
        startOffset=Math.min(length,Math.max(0,start-cursor));
      }
      if(!endNode && end>=cursor && end<=cursor+length){
        endNode=node;
        endOffset=Math.min(length,Math.max(0,end-cursor));
        break;
      }
      cursor+=length;
    }
    if(!startNode || !endNode) return null;
    const range=document.createRange();
    try{ range.setStart(startNode,startOffset); range.setEnd(endNode,endOffset); return range; }
    catch(_error){ return null; }
  }

  function tokenOffsetsInText(text,tokens){
    const offsets=new Map();
    let cursor=0;
    for(const token of tokens||[]){
      const surface=String(token.text||"");
      if(!surface) continue;
      let at=text.indexOf(surface,cursor);
      if(at<0) at=text.toLocaleLowerCase("de-DE").indexOf(surface.toLocaleLowerCase("de-DE"),cursor);
      if(at<0) continue;
      offsets.set(token.i,{start:at,end:at+surface.length});
      cursor=at+surface.length;
    }
    return offsets;
  }

  function fixedExpressionTerms(canonical){
    const placeholders=new Set(["etwas","jemand","jemanden","jemandem","jemandes","jdn","jdm","jds","sich","man","wer","was","wen","wem","wessen"]);
    return normalizeLearningIdentity(canonical)
      .replace(/[\/|]/g," ")
      .split(/\s+/)
      .filter(Boolean)
      .filter(term=>!placeholders.has(term));
  }

  function expressionEntryForItem(item){
    return (state.youtube.expressionGroupsAnalysis||[]).find(entry=>expressionIdentityMatches(item,entry))||null;
  }

  function findExpressionMatch(data,item,entry){
    const expressions=data?.expressions||[];
    let match=expressions.find(expr=>expressionIdentityMatches(item,expr) || (entry && expressionIdentityMatches(entry,expr)));
    if(match) return match;
    const wantedTerms=fixedExpressionTerms(entry?.canonical||item?.label||"");
    let best=null,bestScore=0;
    for(const expr of expressions){
      const terms=fixedExpressionTerms(expr.canonical||expr.surface||"");
      const score=wantedTerms.filter(term=>terms.includes(term)).length;
      if(score>bestScore){best=expr;bestScore=score;}
    }
    return wantedTerms.length && bestScore>=Math.min(2,wantedTerms.length)?best:null;
  }

  function daPronounRepresentsPreposition(value,preposition){
    const token=normalizeLearningIdentity(value);
    const prep=normalizeLearningIdentity(preposition);
    const map={
      an:["daran"],auf:["darauf"],aus:["daraus"],bei:["dabei"],für:["dafür"],
      gegen:["dagegen"],hinter:["dahinter"],in:["darin"],mit:["damit"],nach:["danach"],
      neben:["daneben"],über:["darüber"],um:["darum"],unter:["darunter"],von:["davon"],
      vor:["davor"],zu:["dazu"],zwischen:["dazwischen"]
    };
    return (map[prep]||[]).includes(token);
  }

  function supplementalExpressionTokenIndices(tokens,canonical,existingIndices=[]){
    const normalizedCanonical=normalizeLearningIdentity(canonical);
    const terms=fixedExpressionTerms(canonical);
    const tokenByIndex=new Map((tokens||[]).map(token=>[token.i,token]));
    const matchesFixedTerm=token=>{
      if(!token) return false;
      const text=normalizeLearningIdentity(token.text);
      const lemma=normalizeLearningIdentity(token.lemma);
      return terms.some(term=>
        text===term || lemma===term ||
        daPronounRepresentsPreposition(text,term) ||
        daPronounRepresentsPreposition(lemma,term)
      );
    };
    // Existing engine spans can include slot fillers such as "diese Reformen"
    // for canonical "über etwas diskutieren". Keep only fixed lexical parts;
    // placeholders/arguments must not become clickable structure members.
    const indices=new Set((existingIndices||[]).filter(index=>matchesFixedTerm(tokenByIndex.get(index))));
    if(/(^|\\s)sich(\\s|$)/u.test(normalizedCanonical)){
      const reflexiveForms=new Set(["mich","dich","sich","uns","euch"]);
      const alreadyHasReflexive=[...indices].some(index=>{
        const token=(tokens||[]).find(t=>t.i===index);
        return reflexiveForms.has(normalizeLearningIdentity(token?.text));
      });
      if(!alreadyHasReflexive){
        const reflexive=(tokens||[]).find(t=>reflexiveForms.has(normalizeLearningIdentity(t.text)));
        if(reflexive) indices.add(reflexive.i);
      }
    }
    for(const term of terms){
      const represented=[...indices].some(index=>{
        const token=(tokens||[]).find(t=>t.i===index);
        const text=normalizeLearningIdentity(token?.text);
        const lemma=normalizeLearningIdentity(token?.lemma);
        return text===term || lemma===term ||
          daPronounRepresentsPreposition(text,term) ||
          daPronounRepresentsPreposition(lemma,term);
      });
      if(represented) continue;
      const token=(tokens||[]).find(t=>normalizeLearningIdentity(t.text)===term || normalizeLearningIdentity(t.lemma)===term);
      if(token) indices.add(token.i);
    }
    const joined=normalizeLearningIdentity(canonical).replace(/\s+/g,"");
    const prefixes=["zurück","zusammen","weiter","statt","teil","fest","fort","nach","nieder","vor","weg","ab","an","auf","aus","bei","ein","her","hin","los","mit","zu"];
    const prefix=prefixes.find(value=>joined.startsWith(value) && joined.length>value.length+2);
    if(prefix){
      const particle=(tokens||[]).find(t=>normalizeLearningIdentity(t.text)===prefix || normalizeLearningIdentity(t.lemma)===prefix);
      if(particle) indices.add(particle.i);
      const mainLemma=joined.slice(prefix.length);
      if(mainLemma){
        const main=(tokens||[]).find(t=>normalizeLearningIdentity(t.lemma)===mainLemma || normalizeLearningIdentity(t.text)===mainLemma);
        if(main) indices.add(main.i);
      }
    }
    return [...indices];
  }

  function normalizedTextOffsetMap(value){
    const raw=String(value||"");
    let normalized="",pendingSpace=false;
    const map=[];
    for(let i=0;i<raw.length;i++){
      const ch=raw[i];
      if(/\s/u.test(ch)){
        if(normalized && !pendingSpace) pendingSpace=true;
        continue;
      }
      if(pendingSpace){
        normalized+=" ";
        map.push(i);
        pendingSpace=false;
      }
      normalized+=ch;
      map.push(i);
    }
    return {normalized:normalized.trim(),map,raw};
  }

  function preparedExpressionTokenRanges(expression,data,segment,element){
    if(!expression || !data || !segment?.text || !element) return [];
    const prepared=String(expression.pattern_id||expression.patternId||"").startsWith("prepared:");
    if(!prepared && !(expression.highlight_parts||expression.highlightParts||[]).length) return [];
    const tokenIndices=[...(expression.token_indices||[])];
    if(!tokenIndices.length) return [];

    const mapped=normalizedTextOffsetMap(element.textContent||"");
    const normalizedElement=mapped.normalized;
    const normalizedSegment=String(segment.text||"").replace(/\s+/g," ").trim();
    const segmentStart=normalizedElement.toLocaleLowerCase("de-DE").indexOf(normalizedSegment.toLocaleLowerCase("de-DE"));
    if(segmentStart<0) return [];

    const offsets=tokenOffsetsInText(normalizedSegment,data.tokens||[]);
    const ranges=[];
    for(const tokenIndex of tokenIndices){
      const off=offsets.get(tokenIndex);
      if(!off) continue;
      const normalizedStart=segmentStart+off.start;
      const normalizedEnd=segmentStart+off.end-1;
      const rawStart=mapped.map[normalizedStart];
      const rawEndInclusive=mapped.map[normalizedEnd];
      if(!Number.isInteger(rawStart) || !Number.isInteger(rawEndInclusive)) continue;
      const range=webRangeFromOffsets(element,rawStart,rawEndInclusive+1);
      if(range) ranges.push(range);
    }
    return ranges;
  }

  function expressionSemanticRanges(expression,element){
    if(!expression || !element) return [];
    const parts=(expression.highlight_parts||expression.highlightParts||[]).map(value=>String(value||"").replace(/\s+/g," ").trim()).filter(Boolean);
    if(!parts.length) return [];
    const excluded=new Set((expression.highlight_exclude_parts||expression.highlightExcludeParts||[]).map(part=>preparedNormalize(part)));
    const surface=String(expression.surface||"").replace(/\s+/g," ").trim();
    if(!surface) return [];

    const mapped=normalizedTextOffsetMap(element.textContent||"");
    const normalizedElement=mapped.normalized.toLocaleLowerCase("de-DE");
    const surfaceLower=surface.toLocaleLowerCase("de-DE");
    const surfaceStart=normalizedElement.indexOf(surfaceLower);
    if(surfaceStart<0) return [];

    const spanText=mapped.normalized.slice(surfaceStart,surfaceStart+surface.length);
    const spanLower=spanText.toLocaleLowerCase("de-DE");
    const ranges=[];
    const used=[];
    for(const part of parts){
      const normalizedPart=preparedNormalize(part);
      if(!normalizedPart || excluded.has(normalizedPart)) continue;
      const needle=part.toLocaleLowerCase("de-DE");
      let searchFrom=0;
      let at=-1;
      while((at=spanLower.indexOf(needle,searchFrom))>=0){
        const end=at+part.length;
        const overlaps=used.some(([a,b])=>at<b && end>a);
        if(!overlaps){
          used.push([at,end]);
          const normalizedStart=surfaceStart+at;
          const normalizedEnd=surfaceStart+end-1;
          const rawStart=mapped.map[normalizedStart];
          const rawEndInclusive=mapped.map[normalizedEnd];
          if(Number.isInteger(rawStart) && Number.isInteger(rawEndInclusive)){
            const range=webRangeFromOffsets(element,rawStart,rawEndInclusive+1);
            if(range) ranges.push(range);
          }
          break;
        }
        searchFrom=at+Math.max(1,part.length);
      }
    }
    return ranges;
  }

  function preparedExpressionEntryForValue(value){
    const fixture=activePreparedBenchmark();
    if(!fixture || !value) return null;
    const identities=expressionIdentitySet(value);
    return (fixture.expressions||[]).find(entry=>{
      const canonical=normalizeLearningIdentity(entry.canonical);
      const pattern=normalizeLearningIdentity("prepared:"+preparedNormalize(entry.canonical));
      return identities.has(canonical) || identities.has(pattern);
    }) || null;
  }

  function preparedExpressionRangesForValue(value,segment,element){
    const expression=preparedExpressionEntryForValue(value);
    if(!expression || !segment?.text || !element) return [];

    const mapped=normalizedTextOffsetMap(element.textContent||"");
    const normalizedElement=mapped.normalized.toLocaleLowerCase("de-DE");
    const forms=(expression.forms||[]).map(item=>String(item||"").replace(/\s+/g," ").trim()).filter(Boolean);
    let form=null,formStart=-1;
    for(const candidate of forms){
      const at=normalizedElement.indexOf(candidate.toLocaleLowerCase("de-DE"));
      if(at>=0){ form=candidate; formStart=at; break; }
    }
    if(formStart<0) return [];

    const spanText=mapped.normalized.slice(formStart,formStart+form.length);
    const spanLower=spanText.toLocaleLowerCase("de-DE");
    const parts=(expression.highlightParts||[]).map(item=>String(item||"").replace(/\s+/g," ").trim()).filter(Boolean);
    const excluded=new Set((expression.highlightExcludeParts||[]).map(part=>preparedNormalize(part)));
    const ranges=[];
    const used=[];
    for(const part of parts){
      const normalizedPart=preparedNormalize(part);
      if(!normalizedPart || excluded.has(normalizedPart)) continue;
      const needle=part.toLocaleLowerCase("de-DE");
      let searchFrom=0;
      let at=-1;
      while((at=spanLower.indexOf(needle,searchFrom))>=0){
        const end=at+part.length;
        const overlaps=used.some(([a,b])=>at<b && end>a);
        if(!overlaps){
          used.push([at,end]);
          const normalizedStart=formStart+at;
          const normalizedEnd=formStart+end-1;
          const rawStart=mapped.map[normalizedStart];
          const rawEndInclusive=mapped.map[normalizedEnd];
          if(Number.isInteger(rawStart) && Number.isInteger(rawEndInclusive)){
            const range=webRangeFromOffsets(element,rawStart,rawEndInclusive+1);
            if(range) ranges.push(range);
          }
          break;
        }
        searchFrom=at+Math.max(1,part.length);
      }
    }
    return ranges;
  }

  function preparedExpressionRangesForLearningItem(item,segment,element,sentenceStart){
    const fixture=activePreparedBenchmark();
    if(!fixture || item?.kind!=="expression" || !segment?.text || !element) return [];
    const itemKey=normalizeLearningIdentity(item.key);
    const itemLabel=normalizeLearningIdentity(item.label);
    const expression=(fixture.expressions||[]).find(entry=>{
      const canonical=normalizeLearningIdentity(entry.canonical);
      const pattern=normalizeLearningIdentity("prepared:"+preparedNormalize(entry.canonical));
      return itemKey===canonical || itemLabel===canonical || itemKey===pattern;
    });
    if(!expression) return [];

    // Work against the element's real DOM text, but search in a whitespace-
    // normalized view. Segment text is normalized during extraction, so using
    // its character offsets directly against textContent can drift whenever
    // the page contains line breaks or repeated whitespace.
    const mapped=normalizedTextOffsetMap(element.textContent||"");
    const normalizedElement=mapped.normalized.toLocaleLowerCase("de-DE");
    const forms=(expression.forms||[]).map(value=>String(value||"").replace(/\s+/g," ").trim()).filter(Boolean);
    let form=null,formStart=-1;
    for(const candidate of forms){
      const at=normalizedElement.indexOf(candidate.toLocaleLowerCase("de-DE"));
      if(at>=0){ form=candidate; formStart=at; break; }
    }
    if(formStart<0) return [];

    const spanText=mapped.normalized.slice(formStart,formStart+form.length);
    const spanLower=spanText.toLocaleLowerCase("de-DE");
    const parts=(expression.highlightParts||[]).map(value=>String(value||"").replace(/\s+/g," ").trim()).filter(Boolean);
    const excluded=new Set((expression.highlightExcludeParts||[]).map(part=>preparedNormalize(part)));
    const ranges=[];
    const used=[];
    for(const part of parts){
      const normalizedPart=preparedNormalize(part);
      if(!normalizedPart || excluded.has(normalizedPart)) continue;
      const needle=part.toLocaleLowerCase("de-DE");
      let searchFrom=0;
      let at=-1;
      while((at=spanLower.indexOf(needle,searchFrom))>=0){
        const end=at+part.length;
        const overlaps=used.some(([a,b])=>at<b && end>a);
        if(!overlaps){
          used.push([at,end]);
          const normalizedStart=formStart+at;
          const normalizedEnd=formStart+end-1;
          const rawStart=mapped.map[normalizedStart];
          const rawEndInclusive=mapped.map[normalizedEnd];
          if(Number.isInteger(rawStart) && Number.isInteger(rawEndInclusive)){
            const range=webRangeFromOffsets(element,rawStart,rawEndInclusive+1);
            if(range) ranges.push(range);
          }
          break;
        }
        searchFrom=at+Math.max(1,part.length);
      }
    }
    return ranges;
  }

  async function webRangesForLearningItem(item,cueIndex){
    if(adapter.id!=="web") return {ranges:[],meaning:item?.meaning_tr||""};
    const segment=state.web.segments?.[cueIndex];
    const element=segment?.sourceElement;
    if(!segment?.text || !element?.isConnected) return {ranges:[],meaning:item?.meaning_tr||""};
    const fullText=String(element.textContent||"");
    let sentenceStart=fullText.indexOf(segment.text);
    if(sentenceStart<0) sentenceStart=fullText.toLocaleLowerCase("de-DE").indexOf(segment.text.toLocaleLowerCase("de-DE"));
    if(sentenceStart<0) return {ranges:[],meaning:item?.meaning_tr||""};

    let data=null;
    try{ data=await analyze(segment.text); }catch(_error){}
    const tokens=data?.tokens||[];
    const offsets=tokenOffsetsInText(segment.text,tokens);
    const ranges=[];
    let meaning=item?.meaning_tr||"";

    if(item?.kind==="expression"){
      const entry=expressionEntryForItem(item);
      const match=findExpressionMatch(data,item,entry);
      if(match) meaning=match.contextual_meaning_tr||(match.meaning_tr||[])[0]||entry?.meaningTr||meaning;

      // Prepared benchmark expressions carry explicit semantic highlightParts.
      // Prefer those exact parts for persistent learning highlights so slot
      // fillers and infinitive markers cannot shift or pollute the ranges.
      const preparedRanges=preparedExpressionRangesForLearningItem(item,segment,element,sentenceStart);
      if(preparedRanges.length){
        ranges.push(...preparedRanges);
      }else{
        const canonical=match?.canonical||entry?.canonical||item?.label||item?.key||"";
        const tokenIndices=supplementalExpressionTokenIndices(tokens,canonical,match?.token_indices||[]);
        for(const tokenIndex of tokenIndices){
          const off=offsets.get(tokenIndex);
          if(!off) continue;
          const range=webRangeFromOffsets(element,sentenceStart+off.start,sentenceStart+off.end);
          if(range) ranges.push(range);
        }
      }
    }else{
      const wanted=String(item?.key||item?.label||"").toLocaleLowerCase("de-DE");
      for(const token of tokens){
        if(String(token.lemma||token.text||"").toLocaleLowerCase("de-DE")!==wanted) continue;
        const off=offsets.get(token.i);
        if(!off) continue;
        const hover=data?.hover?.[String(token.i)]||data?.hover?.[token.i]||{};
        meaning=hover.contextual_word_meaning_tr||(hover.dictionary_meanings_tr||[])[0]||meaning;
        const range=webRangeFromOffsets(element,sentenceStart+off.start,sentenceStart+off.end);
        if(range) ranges.push(range);
      }
      if(!ranges.length){
        const forms=(state.youtube.transcriptAnalysis||[]).find(entry=>String(entry.lemma||"").toLocaleLowerCase("de-DE")===wanted)?.forms||[];
        for(const form of [item?.label,item?.key,...forms].filter(Boolean).sort((a,b)=>String(b).length-String(a).length)){
          const needle=String(form);
          const at=segment.text.toLocaleLowerCase("de-DE").indexOf(needle.toLocaleLowerCase("de-DE"));
          if(at<0) continue;
          const range=webRangeFromOffsets(element,sentenceStart+at,sentenceStart+at+needle.length);
          if(range) ranges.push(range);
        }
      }
    }
    return {ranges,meaning:cleanTranslationText(meaning)};
  }

  async function highlightWebLearningItem(item,cueIndex,highlightName="gle-saved-target"){
    if(!CSS?.highlights || typeof Highlight==="undefined") return;
    const result=await webRangesForLearningItem(item,cueIndex);
    CSS.highlights.delete(highlightName);
    if(result.ranges.length) CSS.highlights.set(highlightName,new Highlight(...result.ranges));
  }

  function focusSavedOccurrence(item,cueIndex){
    if(adapter.id==="web"){
      const segment=state.web.segments?.[cueIndex];
      if(segment?.sourceElement?.isConnected){
        state.youtube.cueIndex=cueIndex;
        segment.sourceElement.scrollIntoView({behavior:"smooth",block:"center"});
        updatePanelActiveCue();
        requestAnimationFrame(()=>highlightWebLearningItem(item,cueIndex,"gle-saved-target"));
      }
      return;
    }
    playYouTubeCue(cueIndex);
  }

  function highlightWebTarget(cueIndex,forms){
    if(adapter.id!=="web" || !CSS?.highlights || typeof Highlight==="undefined") return;
    const segment=state.web.segments?.[cueIndex];
    const element=segment?.sourceElement;
    if(!element?.isConnected) return;
    const fullText=String(element.textContent||"");
    const ranges=[];
    for(const form of (forms||[]).map(v=>String(v||"").trim()).filter(Boolean)){
      const lower=fullText.toLocaleLowerCase("de-DE");
      const needle=form.toLocaleLowerCase("de-DE");
      let start=0;
      while(needle && (start=lower.indexOf(needle,start))!==-1){
        const range=webRangeFromOffsets(element,start,start+form.length);
        if(range) ranges.push(range);
        start+=Math.max(1,form.length);
      }
    }
    CSS.highlights.delete("gle-saved-target");
    if(ranges.length) CSS.highlights.set("gle-saved-target",new Highlight(...ranges));
  }

  function ensureWebAnnotationLayer(){
    if(state.web.annotationLayer?.isConnected) return state.web.annotationLayer;
    const layer=document.createElement("div");
    layer.className="gle-web-learning-layer";
    document.documentElement.appendChild(layer);
    state.web.annotationLayer=layer;
    return layer;
  }

  function positionWebAnnotationLabel(label,range){
    const rect=range.getBoundingClientRect();
    if(!rect.width || !rect.height) return false;
    label.style.left=Math.max(4,rect.left)+"px";
    label.style.top=Math.max(2,rect.top-22)+"px";
    return true;
  }

  function preparedLearningItemAllowed(fixture,item){
    if(!fixture || !item) return true;
    const key=normalizeLearningIdentity(item.key);
    const label=normalizeLearningIdentity(item.label);
    if(item.kind==="expression"){
      return (fixture.expressions||[]).some(expression=>{
        const canonical=normalizeLearningIdentity(expression.canonical);
        const pattern=normalizeLearningIdentity("prepared:"+preparedNormalize(expression.canonical));
        return key===canonical || label===canonical || key===pattern;
      });
    }
    if(item.kind==="word"){
      return (fixture.words||[]).some(word=>{
        const lemma=normalizeLearningIdentity(word.lemma);
        return key===lemma || label===lemma;
      });
    }
    return false;
  }

  async function refreshWebLearningAnnotations(){
    if(adapter.id!=="web") return;
    const run=++state.web.annotationRun;
    const layer=ensureWebAnnotationLayer();
    layer.textContent="";
    state.web.annotationLabels=[];
    if(CSS?.highlights) CSS.highlights.delete("gle-learning-web");
    const preparedFixture=activePreparedBenchmark();
    const learningItems=state.learningItems.filter(item=>
      itemStatus(item)==="learning" && preparedLearningItemAllowed(preparedFixture,item)
    );
    if(!learningItems.length) return;
    const allRanges=[];
    for(const item of learningItems){
      const occurrences=contentOccurrencesForLearningItem(item);
      for(const cueIndex of occurrences){
        if(run!==state.web.annotationRun) return;
        const result=await webRangesForLearningItem(item,cueIndex);
        if(run!==state.web.annotationRun) return;
        if(result.ranges.length) allRanges.push(...result.ranges);
      }
    }
    if(run!==state.web.annotationRun) return;
    if(allRanges.length && CSS?.highlights && typeof Highlight!=="undefined") CSS.highlights.set("gle-learning-web",new Highlight(...allRanges));
  }

  function scheduleWebLearningAnnotations(){
    if(adapter.id!=="web") return;
    clearTimeout(state.web.annotationTimer);
    state.web.annotationTimer=setTimeout(()=>refreshWebLearningAnnotations().catch(()=>{}),80);
  }

  function webCaretAtPoint(x,y){
    if(document.caretPositionFromPoint){
      const pos=document.caretPositionFromPoint(x,y);
      return pos ? {node:pos.offsetNode,offset:pos.offset} : null;
    }
    if(document.caretRangeFromPoint){
      const range=document.caretRangeFromPoint(x,y);
      return range ? {node:range.startContainer,offset:range.startOffset} : null;
    }
    return null;
  }

  function textNodeOffsetWithinElement(element,node,localOffset){
    let total=0;
    for(const current of webTextNodes(element)){
      if(current===node) return total+Math.max(0,Math.min(localOffset,String(current.nodeValue||"").length));
      total+=String(current.nodeValue||"").length;
    }
    return -1;
  }

  function webWordHitAtPoint(x,y,{allowLinks=false}={}){
    const caret=webCaretAtPoint(x,y);
    const node=caret?.node;
    if(!node || node.nodeType!==Node.TEXT_NODE) return null;
    const parent=node.parentElement;
    if(!parent) return null;
    const blockedSelector=allowLinks
      ? "#gle-shared-panel,#gle-tooltip,#gle-export-dialog,#gle-settings-dialog,.gle-web-learning-layer,button,input,textarea,select,[contenteditable=true]"
      : "#gle-shared-panel,#gle-tooltip,#gle-export-dialog,#gle-settings-dialog,.gle-web-learning-layer,a,button,input,textarea,select,[contenteditable=true]";
    if(parent.closest(blockedSelector)) return null;
    const candidates=state.web.segments.map((segment,index)=>({segment,index})).filter(item=>item.segment.sourceElement?.contains(node));
    if(!candidates.length) return null;
    const element=candidates[0].segment.sourceElement;
    const absoluteCaret=textNodeOffsetWithinElement(element,node,caret.offset);
    const fullText=String(element.textContent||"");
    let segmentIndex=-1;
    for(const item of candidates){
      let at=fullText.indexOf(item.segment.text);
      if(at<0) at=fullText.toLocaleLowerCase("de-DE").indexOf(String(item.segment.text||"").toLocaleLowerCase("de-DE"));
      if(at>=0 && absoluteCaret>=at && absoluteCaret<=at+String(item.segment.text||"").length){segmentIndex=item.index;break;}
    }
    if(segmentIndex<0) segmentIndex=candidates[0].index;
    const text=String(node.nodeValue||"");
    const isWord=ch=>/[\p{L}\p{M}ßÄÖÜäöü]/u.test(ch||"");
    let start=Math.min(caret.offset,text.length),end=start;
    if(start===text.length || !isWord(text[start])){
      if(start>0 && isWord(text[start-1])) start-=1;
      else return null;
    }
    end=start+1;
    while(start>0 && isWord(text[start-1])) start--;
    while(end<text.length && isWord(text[end])) end++;
    const word=text.slice(start,end);
    if(!word) return null;
    const range=document.createRange();
    range.setStart(node,start);
    range.setEnd(node,end);

    // caretPositionFromPoint/caretRangeFromPoint may snap an empty-space click
    // to the nearest text node. Only accept the hit when the pointer is
    // physically inside the rendered word bounds.
    const rects=[...range.getClientRects()];
    const tolerance=2;
    const insideWord=rects.some(rect=>
      rect.width>0 && rect.height>0 &&
      x>=rect.left-tolerance && x<=rect.right+tolerance &&
      y>=rect.top-tolerance && y<=rect.bottom+tolerance
    );
    if(!insideWord) return null;

    return {word,segmentIndex,range,rect:range.getBoundingClientRect(),start,absoluteStart:textNodeOffsetWithinElement(element,node,start)};
  }

  async function showWebSentenceTooltip(text,range){
    if(adapter.id!=="web" || !text || !range) return;
    const cleaned=sanitizeLearningText(text);
    if(!cleaned || cleaned.split(/\s+/).length<2) return;
    state.web.tooltipPinnedKey="sentence:"+cleaned;
    cancelTooltipHide();
    try{
      const data=await analyze(cleaned);
      const meaning=cleanTranslationText(data?.sentence_meaning_tr||"");
      const rect=range.getBoundingClientRect();
      const aiBadge=data?.analysis_source==="ai"
        ? '<span class="gle-ai-source-badge" title="AI analizi">AI</span>'
        : "";
      state.tooltip.innerHTML=
        tooltipToolbarHtml()+
        '<div class="gle-hover-head"><b>Cümle</b><span>Seçili metin</span>'+aiBadge+'</div>'+
        '<div class="gle-context gle-context-primary"><b>Almanca:</b> '+esc(cleaned)+'</div>'+
        (meaning?'<div class="gle-context"><b>Türkçe:</b> '+esc(meaning)+'</div>':'<div class="gle-note">Çeviri bulunamadı.</div>');
      state.tooltip.hidden=false;
      syncTooltipToolStates();
      applyTooltipPosition({getBoundingClientRect:()=>rect});
    }catch(_error){}
  }

  function webTokenForHit(data,hit){
    const segment=state.web.segments?.[hit?.segmentIndex];
    if(!segment?.text || !hit) return null;
    const tokens=data?.tokens||[];
    const element=segment.sourceElement;
    const fullText=String(element?.textContent||"");
    let sentenceStart=fullText.indexOf(segment.text);
    if(sentenceStart<0) sentenceStart=fullText.toLocaleLowerCase("de-DE").indexOf(String(segment.text).toLocaleLowerCase("de-DE"));
    const localStart=sentenceStart>=0 ? hit.absoluteStart-sentenceStart : -1;
    if(localStart>=0){
      const offsets=tokenOffsetsInText(segment.text,tokens);
      for(const token of tokens){
        const off=offsets.get(token.i);
        if(off && localStart>=off.start && localStart<off.end) return token;
      }
    }
    const wanted=String(hit.word||"").toLocaleLowerCase("de-DE");
    return tokens.find(t=>String(t.text||"").toLocaleLowerCase("de-DE")===wanted) ||
      tokens.find(t=>String(t.lemma||"").toLocaleLowerCase("de-DE")===wanted) || null;
  }

  function webExpressionCandidatesForToken(data,tokenIndex){
    const tokenHover=data?.hover?.[String(tokenIndex)]||data?.hover?.[tokenIndex]||{};
    const candidates=[];
    const seen=new Set();
    const add=expr=>{
      if(!expr) return;
      const prepared=String(expr.pattern_id||expr.patternId||"").startsWith("prepared:");
      const semanticParts=expr.highlight_parts||expr.highlightParts||[];
      const indices=(prepared || semanticParts.length)
        ? [...(expr.token_indices||[])]
        : supplementalExpressionTokenIndices(
            data?.tokens||[],
            expr.canonical||expr.surface||"",
            expr.token_indices||[]
          );
      // Prepared benchmark analysis already resolved the exact semantic token
      // membership from highlightParts. Do not re-filter conjugated/separable
      // forms against the canonical lemma (e.g. droht vs drohen,
      // steht ... gegenüber vs gegenüberstehen).
      if(!indices.includes(tokenIndex)) return;
      const normalized={
        ...expr,
        token_indices:indices,
        highlight_parts:[...(expr.highlight_parts||expr.highlightParts||[])],
        highlight_exclude_parts:[...(expr.highlight_exclude_parts||expr.highlightExcludeParts||[])]
      };
      const identity=normalizeLearningIdentity(normalized.pattern_id||normalized.canonical||normalized.surface||"");
      if(identity && seen.has(identity)) return;
      if(identity) seen.add(identity);
      candidates.push(normalized);
    };
    for(const expr of tokenHover.primary_expressions||[]) add(expr);
    for(const expr of data?.expressions||[]) add(expr);
    return candidates.sort((a,b)=>{
      const resolvedCount=expr=>{
        const prepared=String(expr.pattern_id||expr.patternId||"").startsWith("prepared:");
        const semanticParts=expr.highlight_parts||expr.highlightParts||[];
        return (prepared || semanticParts.length)
          ? (expr.token_indices||[]).length
          : supplementalExpressionTokenIndices(data?.tokens||[],expr.canonical||expr.surface||"",expr.token_indices||[]).length;
      };
      const aTokens=resolvedCount(a);
      const bTokens=resolvedCount(b);
      if(aTokens!==bTokens) return bTokens-aTokens;
      const aSpecific=(String(a.canonical||"").match(/\\betwas\\b/gu)||[]).length;
      const bSpecific=(String(b.canonical||"").match(/\\betwas\\b/gu)||[]).length;
      if(aSpecific!==bSpecific) return bSpecific-aSpecific;
      return String(b.canonical||"").length-String(a.canonical||"").length;
    });
  }

  function ensureWebExpressionHover(data,token){
    if(!data || !token) return [];
    const candidates=webExpressionCandidatesForToken(data,token.i);
    if(!candidates.length) return candidates;
    if(!data.hover) data.hover={};
    const key=String(token.i);
    const hover=data.hover[key]||data.hover[token.i]||{};
    data.hover[key]={...hover,primary_expressions:candidates};
    return candidates;
  }

  function clearWebStructureHighlight(){
    if(CSS?.highlights) CSS.highlights.delete("gle-web-active-structure");
  }

  async function showWebStructureForHit(hit){
    if(adapter.id!=="web" || !hit) return;
    const segment=state.web.segments?.[hit.segmentIndex];
    const element=segment?.sourceElement;
    if(!segment?.text || !element?.isConnected) return;
    try{
      let data=await analyze(segment.text);
      let token=webTokenForHit(data,hit);
      if(!token) return;
      let expressions=ensureWebExpressionHover(data,token);

      // Prepared/fixture analysis may know the structure but still lack a
      // Turkish meaning. Ask the normal analyzer whenever either the structure
      // or the tooltip meaning is incomplete, then enrich rather than blindly
      // discarding the curated structure.
      if(activePreparedBenchmark() && (!expressions.length || !tooltipHasMeaning(data,token.i))){
        const fallback=await analyzePlatform(segment.text);
        const fallbackToken=webTokenForHit(fallback,hit);
        if(fallbackToken){
          const fallbackExpressions=ensureWebExpressionHover(fallback,fallbackToken);
          if(!expressions.length && fallbackExpressions.length){
            data=fallback;
            token=fallbackToken;
            expressions=fallbackExpressions;
          }else{
            data=mergeTooltipMeaningData(data,token,fallback,fallbackToken);
            expressions=ensureWebExpressionHover(data,token);
          }
        }
      }

      // Final lexical safety net: if the clicked token still has no Turkish
      // meaning, analyze only its lemma/surface so LibreTranslate-backed
      // lexical resolution can fill common words such as adjectives.
      if(!tooltipHasMeaning(data,token.i)){
        const enriched=await enrichTooltipWithLexicalFallback(data,token,hit);
        data=enriched.data;
        token=enriched.token;
        expressions=ensureWebExpressionHover(data,token);
      }

      const offsets=tokenOffsetsInText(segment.text,data.tokens||[]);
      const fullText=String(element.textContent||"");
      let sentenceStart=fullText.indexOf(segment.text);
      if(sentenceStart<0) sentenceStart=fullText.toLocaleLowerCase("de-DE").indexOf(String(segment.text).toLocaleLowerCase("de-DE"));
      const ranges=[];
      const expression=expressions[0]||null;

      // Single source of truth: the selected popup expression carries its own
      // semantic highlight parts. If any member selects this expression, use
      // those exact parts for the active blue highlight.
      const preparedTokenRanges=expression
        ? preparedExpressionTokenRanges(expression,data,segment,element)
        : [];
      const semanticRanges=!preparedTokenRanges.length && expression
        ? expressionSemanticRanges(expression,element)
        : [];
      if(preparedTokenRanges.length){
        ranges.push(...preparedTokenRanges);
      }else if(semanticRanges.length){
        ranges.push(...semanticRanges);
      }else{
        const tokenIndices=expression
          ? supplementalExpressionTokenIndices(data.tokens||[],expression.canonical||expression.surface||"",expression.token_indices||[])
          : [token.i];
        if(sentenceStart>=0){
          for(const tokenIndex of tokenIndices){
            const off=offsets.get(tokenIndex);
            if(!off) continue;
            const range=webRangeFromOffsets(element,sentenceStart+off.start,sentenceStart+off.end);
            if(range) ranges.push(range);
          }
        }
      }
      if(!ranges.length && hit.range) ranges.push(hit.range);

      clearWebStructureHighlight();
      if(ranges.length && CSS?.highlights && typeof Highlight!=="undefined"){
        const highlight=new Highlight(...ranges);
        try{ highlight.priority=100; }catch(_error){}
        CSS.highlights.set("gle-web-active-structure",highlight);
      }

      state.web.tooltipPinnedKey="structure:"+hit.segmentIndex+":"+token.i;
      cancelTooltipHide();
      focusPanelSentence(hit.segmentIndex);
      renderCard(data,token.i,{getBoundingClientRect:()=>hit.rect,contains:()=>false});
    }catch(_error){}
  }

  async function webLearningItemForHit(hit){
    if(adapter.id!=="web" || !hit) return null;
    const segment=state.web.segments?.[hit.segmentIndex];
    if(!segment?.text) return null;
    let data=null;
    try{ data=await analyze(segment.text); }catch(_error){ return null; }
    const wanted=hit.word.toLocaleLowerCase("de-DE");
    const token=(data.tokens||[]).find(t=>String(t.text||"").toLocaleLowerCase("de-DE")===wanted) ||
      (data.tokens||[]).find(t=>String(t.lemma||"").toLocaleLowerCase("de-DE")===wanted);
    if(!token) return null;

    const related=(data.hover?.[String(token.i)]||data.hover?.[token.i]||{}).primary_expressions||[];
    for(const expr of related){
      const key=expr.pattern_id||expr.canonical;
      const item=state.learningItems.find(existing=>
        itemStatus(existing)==="learning" &&
        existing.kind==="expression" &&
        (normalizeLearningIdentity(existing.key)===normalizeLearningIdentity(key) ||
         normalizeLearningIdentity(existing.label)===normalizeLearningIdentity(expr.canonical))
      );
      if(item) return item;
    }

    const lemma=String(token.lemma||token.text||"").toLocaleLowerCase("de-DE");
    return state.learningItems.find(existing=>
      itemStatus(existing)==="learning" &&
      existing.kind==="word" &&
      (String(existing.key||"").toLocaleLowerCase("de-DE")===lemma ||
       String(existing.label||"").toLocaleLowerCase("de-DE")===lemma)
    ) || null;
  }

  async function showWebWordTooltip(hit,pinned=false){
    if(adapter.id!=="web" || !hit) return;
    const pinKey=hit.segmentIndex+":"+hit.word+":"+hit.absoluteStart;
    if(pinned){
      state.web.tooltipPinnedKey=pinKey;
      cancelTooltipHide();
    }else if(state.web.tooltipPinnedKey){
      return;
    }
    const segment=state.web.segments[hit.segmentIndex];
    if(!segment?.text) return;
    focusPanelSentence(hit.segmentIndex);
    try{
      let data=await analyze(segment.text);
      let token=webTokenForHit(data,hit);
      if(!token) return;
      ensureWebExpressionHover(data,token);

      const hasMeaning=tooltipHasMeaning(data,token.i);

      // The prepared benchmark intentionally overrides only curated items.
      // For any clicked word without prepared lexical meaning, fall back to
      // the normal platform analyzer so the popup never becomes an empty shell.
      if(activePreparedBenchmark() && !hasMeaning){
        const fallback=await analyzePlatform(segment.text);
        const fallbackToken=webTokenForHit(fallback,hit);
        if(fallbackToken){
          data=mergeTooltipMeaningData(data,token,fallback,fallbackToken);
          if(!tooltipHasMeaning(data,token.i)){
            data=fallback;
            token=fallbackToken;
          }
          ensureWebExpressionHover(data,token);
        }
      }

      renderCard(data,token.i,{getBoundingClientRect:()=>hit.rect,contains:()=>false});
    }catch(_error){}
  }

  function installWebTextInteraction(){
    if(adapter.id!=="web" || state.web.interactionReady) return;
    state.web.interactionReady=true;
    // A single click is the only word interaction on web text:
    // resolve the clicked learning unit, highlight the word/full structure in blue,
    // and open/update the popup. Hover and double-click have no word action.
    document.addEventListener("click",event=>{
      if(event.target?.closest?.("#gle-shared-panel,#gle-tooltip,#gle-export-dialog,#gle-settings-dialog,.gle-web-learning-layer")) return;
      const selection=window.getSelection();
      if(selection && !selection.isCollapsed){
        const selected=sanitizeLearningText(selection.toString());
        if(selected.split(/\s+/).length>=2) return;
      }
      const hit=webWordHitAtPoint(event.clientX,event.clientY);
      if(hit){
        clearTimeout(state.web.hoverTimer);
        state.web.hoverKey="";
        try{ window.getSelection()?.removeAllRanges(); }catch(_error){}
        showWebStructureForHit(hit);
        return;
      }
      clearWebStructureHighlight();
      if(!tooltipPersistent()){
        state.web.tooltipPinnedKey="";
        state.web.hoverKey="";
        cancelTooltipHide();
        if(state.tooltip) state.tooltip.hidden=true;
      }
    },true);
    document.addEventListener("mousemove",event=>{
      if(state.settings.tooltipHoverMode!==true) return;
      if(event.target?.closest?.("#gle-shared-panel,#gle-tooltip,#gle-export-dialog,#gle-settings-dialog,.gle-web-learning-layer")) return;
      const hit=webWordHitAtPoint(event.clientX,event.clientY,{allowLinks:true});
      if(!hit){
        clearTimeout(state.web.hoverTimer);
        state.web.hoverKey="";
        return;
      }
      const key=hit.segmentIndex+":"+hit.absoluteStart+":"+hit.word;
      if(state.web.hoverKey===key) return;
      state.web.hoverKey=key;
      clearTimeout(state.web.hoverTimer);
      state.web.hoverTimer=setTimeout(()=>{
        if(state.settings.tooltipHoverMode!==true || state.web.hoverKey!==key) return;
        showWebStructureForHit(hit);
      },140);
    },true);
    document.addEventListener("mouseleave",()=>{
      clearTimeout(state.web.hoverTimer);
      state.web.hoverKey="";
    },true);
    document.addEventListener("mouseup",event=>{
      if(event.target?.closest?.("#gle-shared-panel,#gle-tooltip,#gle-export-dialog,#gle-settings-dialog,.gle-web-learning-layer")) return;
      const selection=window.getSelection();
      if(!selection || selection.isCollapsed || !selection.rangeCount) return;
      const text=sanitizeLearningText(selection.toString());
      if(text.split(/\s+/).length<2) return;
      const range=selection.getRangeAt(0);
      const common=range.commonAncestorContainer.nodeType===Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
      if(!common || !state.web.segments.some(segment=>segment.sourceElement?.contains(common) || common.contains?.(segment.sourceElement))) return;
      showWebSentenceTooltip(text,range);
    },true);
    window.addEventListener("resize",()=>{ syncSharedPanelHost(); scheduleWebLearningAnnotations(); },{passive:true});
  }

  function navigateSavedItem(item,direction=0){
    const id=learningKey(item.kind,item.key);
    const occurrences=contentOccurrencesForLearningItem(item);
    if(!occurrences.length) return;
    let position=Number(state.panel.savedOccurrencePositions[id]||0);
    if(direction>0) position=(position+1)%occurrences.length;
    if(direction<0) position=(position-1+occurrences.length)%occurrences.length;
    position=Math.max(0,Math.min(position,occurrences.length-1));
    state.panel.savedOccurrencePositions[id]=position;
    focusSavedOccurrence(item,occurrences[position]);
    renderSharedPanel();
  }

  function renderPanelSaved(body){
    if(state.panel.savedView==="all") state.panel.savedView="learning";
    if(adapter.id==="web" && (!state.panel.senseRows || state.panel.senseRowsVideoId!==state.youtube.videoId)) analyzePanelWordSenses().catch(()=>{});
    const q=String(state.panel.savedSearch||"").trim().toLocaleLowerCase("de-DE");
    const items=filteredSavedItems().filter(item=>!q ||
      String(item.label||item.key||"").toLocaleLowerCase("de-DE").includes(q) ||
      String(item.meaning_tr||"").toLocaleLowerCase("tr-TR").includes(q));
    const tabs=[["learning","Öğreniyorum"],["from-content","Bu İçerikten Kaydedilenler"],["present-content","Bu İçerikte Geçenler"],["known","Biliyorum"]];
    const toolbar='<div class="gle-saved-toolbar"><div class="gle-saved-filters">'+tabs.map(([id,label])=>'<button type="button" data-saved-view="'+id+'" class="'+(state.panel.savedView===id?"active":"")+'">'+esc(label)+'</button>').join("")+'</div><label class="gle-panel-search"><span>⌕</span><input type="search" data-saved-search placeholder="Kaydedilenlerde ara…" value="'+escAttr(state.panel.savedSearch||"")+'"></label></div>';
    if(!items.length){
      body.innerHTML=toolbar+'<div class="gle-panel-empty"><b>Bu görünümde kayıt yok.</b><span>Filtreyi değiştir veya bu içerikten yeni bir öğe işaretle.</span></div>';
    }else{
      body.innerHTML=toolbar+'<div class="gle-panel-summary"><strong>'+items.length+'</strong><span>kayıt</span></div><div class="gle-saved-list">'+items.map(item=>{
        const itemKey=learningKey(item.kind,item.key);
        const fromHere=learningItemSavedFromCurrentContent(item);
        const present=contentOccurrencesForLearningItem(item).length>0;
        const type=item.kind==="expression"?"İfade":item.kind==="learning-unit"?"Anlam/Kullanım":"Kelime";
        const status=itemStatus(item);
        const flags=[type,status==="learned"?"Biliyorum":"Öğreniyorum"];
        if(fromHere) flags.push("Bu içerikten");
        if(present) flags.push("Bu içerikte");
        const occurrences=contentOccurrencesForLearningItem(item);
        const pos=Math.min(Number(state.panel.savedOccurrencePositions[itemKey]||0),Math.max(0,occurrences.length-1));
        return '<div class="gle-saved-word gle-saved-global" data-saved-key="'+escAttr(itemKey)+'">'+
          '<button type="button" class="gle-saved-main" data-saved-open="'+escAttr(itemKey)+'"><strong>'+esc(item.label||item.key)+'</strong><small>'+esc(item.meaning_tr||"")+'</small><em>'+esc(flags.join(" · "))+'</em></button>'+
          '<div class="gle-saved-row-actions">'+
          (occurrences.length?'<div class="gle-saved-nav"><button type="button" data-saved-prev="'+escAttr(itemKey)+'">‹</button><span>'+(pos+1)+'/'+occurrences.length+'</span><button type="button" data-saved-next="'+escAttr(itemKey)+'">›</button></div>':'')+
          '<button type="button" class="gle-saved-star '+(status==="learning"?"active":"")+'" data-saved-learning="'+escAttr(itemKey)+'" title="Öğreniyorum">'+(status==="learning"?"★":"☆")+'</button>'+
          '<button type="button" class="gle-saved-status '+(status==="learned"?"active":"")+'" data-saved-known="'+escAttr(itemKey)+'" title="Biliyorum">✓</button></div></div>';
      }).join("")+'</div>';
    }
    body.querySelectorAll("[data-saved-view]").forEach(button=>button.addEventListener("click",()=>{state.panel.savedView=button.dataset.savedView||"learning";renderSharedPanel();}));
    const savedSearch=body.querySelector("[data-saved-search]");
    savedSearch?.addEventListener("input",()=>{
      state.panel.savedSearch=savedSearch.value;
      const cursor=savedSearch.selectionStart;
      renderSharedPanel();
      requestAnimationFrame(()=>{
        const next=state.panel.element?.querySelector("[data-saved-search]");
        next?.focus();
        try{next?.setSelectionRange(cursor,cursor);}catch(_error){}
      });
    });
    const findItem=key=>state.learningItems.find(item=>learningKey(item.kind,item.key)===key);
    body.querySelectorAll("[data-saved-open]").forEach(button=>button.addEventListener("click",()=>{const item=findItem(button.dataset.savedOpen);if(item)navigateSavedItem(item,0);}));
    body.querySelectorAll("[data-saved-prev]").forEach(button=>button.addEventListener("click",event=>{event.stopPropagation();const item=findItem(button.dataset.savedPrev);if(item)navigateSavedItem(item,-1);}));
    body.querySelectorAll("[data-saved-next]").forEach(button=>button.addEventListener("click",event=>{event.stopPropagation();const item=findItem(button.dataset.savedNext);if(item)navigateSavedItem(item,1);}));
    const bindSavedStatus=(selector,status,dataKey)=>body.querySelectorAll(selector).forEach(button=>button.addEventListener("click",async()=>{
      const item=findItem(button.dataset[dataKey]);if(!item)return;button.disabled=true;
      try{await setLearningStatus({kind:item.kind,key:item.key,label:item.label,meaning_tr:item.meaning_tr,surface:item.label},status);renderSharedPanel();}
      catch(error){console.warn("Saved status failed",error);button.disabled=false;}
    }));
    bindSavedStatus("[data-saved-learning]","learning","savedLearning");
    bindSavedStatus("[data-saved-known]","learned","savedKnown");
  }

  function csvCell(value){
    const text=String(value??"");
    return '"'+text.replace(/"/g,'""')+'"';
  }

  function exportTimestamp(){
    const now=new Date();
    const pad=value=>String(value).padStart(2,"0");
    return now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate())+"_"+pad(now.getHours())+"-"+pad(now.getMinutes());
  }

  function exportSectionName(){
    if(state.panel.tab==="saved"){
      return ({
        all:"Kaydedilenler",
        "from-content":"Bu_Icerikten_Kaydedilenler",
        "present-content":"Bu_Icerikte_Gecenler",
        learning:"Ogreniyorum",
        known:"Biliyorum",
      })[state.panel.savedView] || "Kaydedilenler";
    }
    if(state.panel.tab==="words"){
      return ({
        overview:"Kelimeler",
        alphabetical:"Kelimeler_A-Z",
        frequency:"Kelimeler_Siklik",
        groups:"Kelime_Gruplari",
        senses:"Anlamlar",
      })[state.panel.wordsView] || "Kelimeler";
    }
    return "Cumleler";
  }

  function safeExportName(sectionOverride=""){
    const raw=(adapter.id==="youtube" ? currentYouTubeTitle() : document.title || "language-learning")
      .replace(/\s+/g," ").trim()
      .replace(/[\\/:*?"<>|]+/g,"-")
      .slice(0,72);
    const section=(sectionOverride||exportSectionName()).replace(/[\\/:*?"<>|\s]+/g,"_");
    return (raw || "language-learning")+"-"+section+"-"+exportTimestamp();
  }

  async function translationForCue(cue){
    let value=state.panelTranslationCache.get(cue.text)||"";
    if(value) return value;
    try{
      const data=await analyze(cue.text);
      value=cleanTranslationText(data?.sentence_meaning_tr||"");
      if(value) state.panelTranslationCache.set(cue.text,value);
    }catch(_error){}
    return value;
  }

  async function exportItemsForWordsView(view){
    if(view==="senses"){
      if(state.panel.senseRowsVideoId!==state.youtube.videoId || !state.panel.senseRows) await analyzePanelWordSenses();
      if(!state.youtube.expressionGroupsAnalysis) await analyzeWholeYouTubeExpressionGroups();
      return senseRowsWithExpressions().map((row,index)=>({
        id:"senses:item:"+index,section:"Anlamlar",sectionId:"senses",
        label:row.canonical+(row.meaningTr?" — "+row.meaningTr:""),
        kind:row.expressionEntry?"group":"sense",row,entry:row.expressionEntry||null,
      }));
    }
    if(view==="groups"){
      if(!state.youtube.expressionGroupsAnalysis) await analyzeWholeYouTubeExpressionGroups();
      return (state.youtube.expressionGroupsAnalysis||[]).map((entry,index)=>({
        id:"groups:item:"+index,section:"Kelime grupları",sectionId:"groups",label:entry.canonical,kind:"group",entry,
      }));
    }
    let words=filterPanelWords(state.youtube.transcriptAnalysis||[]);
    if(view==="alphabetical") words=[...words].sort((a,b)=>a.lemma.localeCompare(b.lemma,"de"));
    else words=[...words].sort((a,b)=>b.count-a.count || a.lemma.localeCompare(b.lemma,"de"));
    const labels={overview:"Genel",alphabetical:"A-Z",frequency:"Sıklık"};
    return words.map((entry,index)=>({
      id:view+":item:"+index,section:labels[view]||"Kelimeler",sectionId:view,label:entry.lemma+" · "+entry.count+"×",kind:"word",entry,
    }));
  }

  async function exportItemsForCurrentTab(){
    if(state.panel.tab==="subtitles"){
      return (state.youtube.cues||[]).map((cue,index)=>({
        id:"sentence:"+index,label:(index+1)+". "+cue.text.slice(0,90),kind:"sentence",cue,index,
      }));
    }
    if(state.panel.tab==="saved"){
      return filteredSavedItems().map((item,index)=>({
        id:"saved:"+index,label:item.label||item.key||("Kayıt "+(index+1)),kind:"saved",item,
      }));
    }
    const result=[];
    for(const view of ["overview","alphabetical","frequency","groups","senses"]) result.push(...await exportItemsForWordsView(view));
    return result;
  }

  function exportRecordForItem(exportItem,sentenceMode="bilingual"){
    const withSection=record=>exportItem.section ? {"Bölüm":exportItem.section,...record} : record;
    if(exportItem.kind==="saved"){
      const item=exportItem.item;
      const type=item.kind==="expression"?"İfade":item.kind==="learning-unit"?"Anlam/Kullanım":"Kelime";
      return withSection({
        "Kelime / İfade":item.label||item.key||"",
        "Türkçe anlam":item.meaning_tr||"",
        "Tür":type,
        "Durum":itemStatus(item)==="learned"?"Biliyorum":"Öğreniyorum",
      });
    }
    if(exportItem.kind==="sense"){
      const row=exportItem.row;
      return withSection({
        "Kelime / İfade":row.canonical||row.lemma||"",
        "Türkçe anlam":row.meaningTr||"",
        "Tür":row.unitType||"Anlam/Kullanım",
        "İçerikteki biçim":row.surface||"",
        "Geçiş sayısı":(row.occurrences||[]).length,
      });
    }
    if(exportItem.kind==="group"){
      const entry=exportItem.entry;
      return withSection({
        "İfade":entry.canonical||"",
        "Tür":expressionGroupLabel(entry.type),
        "Türkçe anlam":entry.meaningTr||"",
        "İçerikteki biçimler":(entry.forms||[]).join(", "),
        "Sıklık":entry.count||0,
      });
    }
    if(exportItem.kind==="word"){
      const entry=exportItem.entry;
      const learning=learningItemForLemma(entry.lemma);
      return withSection({
        "Kelime":entry.lemma||"",
        "Kelime türü":posLabel(entry.pos||""),
        "İçerikteki biçimler":(entry.forms||[]).join(", "),
        "Sıklık":entry.count||0,
        "Türkçe anlam":learning?.meaning_tr||"",
        "Durum":learning?(itemStatus(learning)==="learned"?"Biliyorum":"Öğreniyorum"):"",
      });
    }
    const cue=exportItem.cue;
    return {
      "Sıra":exportItem.index+1,
      "Almanca":sentenceMode==="translation"?"":cue.text,
      "Türkçe":"",
      "Konum":adapter.id==="web" ? String(exportItem.index+1) : panelClock(cue.startMs),
    };
  }

  function downloadTextFile(filename,mime,text){
    const blob=new Blob([text],{type:mime});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;
    link.download=filename;
    link.style.display="none";
    document.documentElement.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  function diagnosticResolvedExpressionIndices(data,expr){
    const tokens=data?.tokens||[];
    const prepared=String(expr?.pattern_id||expr?.patternId||"").startsWith("prepared:");
    const semanticParts=expr?.highlight_parts||expr?.highlightParts||[];
    const indices=(prepared || semanticParts.length)
      ? [...(expr?.token_indices||[])]
      : supplementalExpressionTokenIndices(
          tokens,
          expr?.canonical||expr?.surface||"",
          expr?.token_indices||[]
        );
    return [...new Set(indices.filter(index=>Number.isInteger(index)))];
  }

  function diagnosticExpressionPriority(data,expressions){
    return [...(expressions||[])].sort((a,b)=>{
      const aTokens=diagnosticResolvedExpressionIndices(data,a).length;
      const bTokens=diagnosticResolvedExpressionIndices(data,b).length;
      if(aTokens!==bTokens) return bTokens-aTokens;
      const aSpecific=(String(a?.canonical||"").match(/\betwas\b/gu)||[]).length;
      const bSpecific=(String(b?.canonical||"").match(/\betwas\b/gu)||[]).length;
      if(aSpecific!==bSpecific) return bSpecific-aSpecific;
      return String(b?.canonical||"").length-String(a?.canonical||"").length;
    });
  }

  function diagnosticGroupRecord(data,expr){
    const tokens=data?.tokens||[];
    const rawIndices=[...(expr?.token_indices||[])];
    const resolvedIndices=diagnosticResolvedExpressionIndices(data,expr);
    const tokenRecord=index=>{
      const token=tokens.find(item=>item?.i===index) || tokens[index] || {};
      return {
        i:index,
        text:token.text||"",
        lemma:token.lemma||"",
        pos:token.pos||"",
      };
    };
    return {
      canonical:expr?.canonical||"",
      surface:expr?.surface||"",
      type:expr?.type||"",
      pattern_id:expr?.pattern_id||expr?.patternId||"",
      contextual_meaning_tr:expr?.contextual_meaning_tr||"",
      meaning_tr:firstMeaning(expr?.contextual_meaning_tr,expr?.meaning_tr)||"",
      grammar_hint:expr?.grammar_hint||"",
      raw_token_indices:rawIndices,
      resolved_highlight_token_indices:resolvedIndices,
      members:resolvedIndices.map(tokenRecord),
      highlight_parts:[...(expr?.highlight_parts||expr?.highlightParts||[])],
      highlight_exclude_parts:[...(expr?.highlight_exclude_parts||expr?.highlightExcludeParts||[])],
    };
  }

  function diagnosticHoverTargets(data){
    const tokens=data?.tokens||[];
    return tokens.map(token=>{
      const hover=data?.hover?.[String(token.i)]||data?.hover?.[token.i]||{};
      const seen=new Set();
      const candidates=[];
      const add=expr=>{
        if(!expr) return;
        const indices=diagnosticResolvedExpressionIndices(data,expr);
        if(!indices.includes(token.i)) return;
        const key=normalizeLearningIdentity(expr.pattern_id||expr.patternId||expr.canonical||expr.surface||"");
        if(key && seen.has(key)) return;
        if(key) seen.add(key);
        candidates.push(expr);
      };
      for(const expr of hover.primary_expressions||[]) add(expr);
      for(const expr of data?.expressions||[]) add(expr);
      const ordered=diagnosticExpressionPriority(data,candidates);
      const primary=ordered[0]||null;
      const primaryRecord=primary?diagnosticGroupRecord(data,primary):null;
      return {
        token_index:token.i,
        token:token.text||"",
        lemma:token.lemma||"",
        primary_group:primaryRecord,
        candidate_groups:ordered.map(expr=>diagnosticGroupRecord(data,expr)),
        highlight_token_indices:primaryRecord?.resolved_highlight_token_indices||[token.i],
        highlight_tokens:primaryRecord?.members?.map(member=>member.text).filter(Boolean)||[token.text||""],
      };
    }).filter(item=>item.primary_group);
  }

  async function buildPanelDiagnosticExport(){
    if(!state.youtube.transcriptAnalysis) await analyzeWholeYouTubeTranscript().catch(()=>{});
    if(!state.youtube.expressionGroupsAnalysis) await analyzeWholeYouTubeExpressionGroups().catch(()=>{});
    if(adapter.id==="web" && (!state.panel.senseRows || state.panel.senseRowsVideoId!==state.youtube.videoId)){
      await analyzePanelWordSenses().catch(()=>{});
    }

    const cues=state.youtube.cues||[];
    const sentences=[];
    const hoverWordGroups=[];
    for(let index=0;index<cues.length;index++){
      const cue=cues[index];
      let analysis=null;
      try{ analysis=await analyze(cue.text); }catch(_error){}
      const linkedWordGroups=(analysis?.expressions||[]).map(expr=>diagnosticGroupRecord(analysis,expr));
      const hoverTargets=analysis?diagnosticHoverTargets(analysis):[];
      for(const target of hoverTargets){
        hoverWordGroups.push({
          sentence_index:index+1,
          source:cue.text||"",
          ...target,
        });
      }
      sentences.push({
        index:index+1,
        start_ms:Number.isFinite(cue.startMs)?cue.startMs:null,
        end_ms:Number.isFinite(cue.endMs)?cue.endMs:null,
        source:cue.text||"",
        translation_tr:cleanTranslationText(analysis?.sentence_meaning_tr||"") || await translationForCue(cue),
        linked_word_groups:linkedWordGroups,
        hover_targets:hoverTargets,
      });
    }

    const words=(state.youtube.transcriptAnalysis||[]).map(entry=>({
      lemma:entry.lemma||"",
      pos:entry.pos||"",
      pos_label:posLabel(entry.pos||""),
      count:entry.count||0,
      forms:[...(entry.forms||[])],
      occurrences:[...(entry.occurrences||[])].map(i=>i+1),
      meaning_tr:entry.meaningTr||"",
      article:entry.article||"",
      singular:entry.singular||"",
      plural:entry.plural||"",
      status:(()=>{const item=learningItemForLemma(entry.lemma);return item?itemStatus(item):"";})(),
    }));

    const groups=(state.youtube.expressionGroupsAnalysis||[]).map(entry=>({
      canonical:entry.canonical||"",
      type:entry.type||"",
      type_label:expressionGroupLabel(entry.type||""),
      pattern_id:entry.patternId||"",
      count:entry.count||0,
      forms:[...(entry.forms||[])],
      occurrences:[...(entry.occurrences||[])].map(i=>i+1),
      meaning_tr:entry.meaningTr||"",
      grammar_hint:entry.grammarHint||"",
      status:(()=>{const item=learningItemForExpression(entry);return item?itemStatus(item):"";})(),
    }));

    const senses=senseRowsWithExpressions().map(row=>({
      key:row.key||"",
      lemma:row.lemma||"",
      canonical:row.canonical||"",
      meaning_tr:row.meaningTr||"",
      unit_type:row.unitType||"",
      sense_id:row.senseId||"",
      pattern_id:row.patternId||"",
      surface:row.surface||"",
      occurrences:[...(row.occurrences||[])].map(i=>i+1),
    }));

    const saved=[...state.learningItems].map(item=>({
      id:item.id||null,
      kind:item.kind||"",
      key:item.key||"",
      label:item.label||"",
      meaning_tr:item.meaning_tr||"",
      status:itemStatus(item),
      present_in_current_content:contentOccurrencesForLearningItem(item).length>0,
      saved_from_current_content:learningItemSavedFromCurrentContent(item),
      occurrences:contentOccurrencesForLearningItem(item).map(i=>i+1),
      metadata:item.metadata||{},
      encounters:(item.encounters||[]).map(encounter=>({
        surface_form:encounter.surface_form||"",
        sentence:encounter.sentence||"",
        provider:encounter.provider||"",
        source_type:encounter.source_type||"",
        external_id:encounter.external_id||"",
        url:encounter.url||"",
        media_timestamp_ms:encounter.media_timestamp_ms??null,
        media_end_timestamp_ms:encounter.media_end_timestamp_ms??null,
      })),
    }));

    const settings={
      extensionEnabled:state.settings.extensionEnabled!==false,
      showVideoTranslation:state.settings.showVideoTranslation!==false,
      showPanelTranslation:state.settings.showPanelTranslation!==false,
      followActiveSubtitle:state.settings.followActiveSubtitle!==false,
      pauseOnWordHover:state.settings.pauseOnWordHover===true,
      autoPauseAfterSentence:state.settings.autoPauseAfterSentence===true,
      interfaceLanguage:state.settings.interfaceLanguage||"tr",
      theme:state.settings.theme||"system",
      panelWidthFactor:Number(state.settings.panelWidthFactor||1),
      germanFontSize:Number(state.settings.germanFontSize||100),
      translationFontSize:Number(state.settings.translationFontSize||100),
      youtubeSubtitlePositionY:Number(state.settings.youtubeSubtitlePositionY||82),
      zdfSubtitlePositionY:Number(state.settings.zdfSubtitlePositionY||88),
    };

    return {
      diagnostic_version:2,
      generated_at:new Date().toISOString(),
      ai_analysis:buildAiAnalysisExport(),
      extension:{
        version:chrome.runtime.getManifest()?.version||"",
        adapter:adapter.id,
      },
      page:{
        title:document.title||"",
        url:location.href,
        provider:currentContentDescriptor().provider,
        source_type:currentContentDescriptor().sourceType,
        external_id:currentContentDescriptor().externalId,
      },
      panel:{
        current_tab:state.panel.tab,
        collapsed:Boolean(state.panel.collapsed),
        docked:Boolean(state.panel.docked),
        words_view:state.panel.wordsView,
        saved_view:state.panel.savedView,
        selected_lemma:state.panel.selectedLemma||"",
        selected_group_key:state.panel.selectedGroupKey||"",
        searches:{
          words:state.panel.wordsSearch||"",
          saved:state.panel.savedSearch||"",
          subtitles:state.panel.subtitleSearch||"",
        },
        menus:{
          tabs:[
            {id:"subtitles",label:uiText("subtitles")},
            {id:"words",label:uiText("words")},
            {id:"saved",label:uiText("saved")},
          ],
          word_views:[
            {id:"overview",label:"Genel"},
            {id:"alphabetical",label:"A-Z"},
            {id:"frequency",label:"Sıklık"},
            {id:"groups",label:"Kelime grupları"},
            {id:"senses",label:"Anlamlar"},
          ],
          saved_views:[
            {id:"learning",label:"Öğreniyorum"},
            {id:"from-content",label:"Bu İçerikten Kaydedilenler"},
            {id:"present-content",label:"Bu İçerikte Geçenler"},
            {id:"known",label:"Biliyorum"},
          ],
          export_formats:["TXT","CSV","JSON","PDF / Print","Highlight PDF","Panel Diagnostic JSON"],
          settings_sections:[
            {id:"general",label:uiText("general"),items:["interfaceLanguage","theme","extensionEnabled"]},
            {id:"translation",label:uiText("translationView"),items:["showVideoTranslation","showPanelTranslation","followActiveSubtitle"]},
            {id:"playback",label:uiText("playbackBehavior"),items:["pauseOnWordHover","autoPauseAfterSentence"]},
            {id:"text-size",label:uiText("textSize"),items:["germanFontSize","translationFontSize"]},
          ],
        },
      },
      settings,
      counts:{
        sentences:sentences.length,
        words:words.length,
        groups:groups.length,
        senses:senses.length,
        saved:saved.length,
        hover_word_groups:hoverWordGroups.length,
      },
      sentences,
      words,
      word_views:{
        overview:words,
        alphabetical:[...words].sort((a,b)=>String(a.lemma).localeCompare(String(b.lemma),"de")),
        frequency:[...words].sort((a,b)=>b.count-a.count || String(a.lemma).localeCompare(String(b.lemma),"de")),
      },
      groups,
      senses,
      saved:{
        all:saved,
        learning:saved.filter(item=>item.status==="learning"),
        known:saved.filter(item=>item.status==="learned"),
        from_current_content:saved.filter(item=>item.saved_from_current_content),
        present_in_current_content:saved.filter(item=>item.present_in_current_content),
      },
      hover_word_groups:hoverWordGroups,
    };
  }

  async function downloadPanelDiagnosticExport(){
    const payload=await buildPanelDiagnosticExport();
    const filename=safeExportName("Panel_Diagnostic")+".json";
    downloadTextFile(filename,"application/json;charset=utf-8",JSON.stringify(payload,null,2));
  }

  function exportExpressionPriority(expressions){
    return [...(expressions||[])].sort((a,b)=>{
      const tokenDiff=(b.token_indices||[]).length-(a.token_indices||[]).length;
      if(tokenDiff) return tokenDiff;
      return String(b.canonical||"").length-String(a.canonical||"").length;
    });
  }

  function exportLearningExpression(expr){
    const pattern=normalizeLearningIdentity(expr?.pattern_id||"");
    const canonical=normalizeLearningIdentity(expr?.canonical||"");
    return state.learningItems.some(item=>
      itemStatus(item)==="learning" &&
      item.kind==="expression" &&
      (normalizeLearningIdentity(item.key)===pattern ||
       normalizeLearningIdentity(item.key)===canonical ||
       normalizeLearningIdentity(item.label)===canonical)
    );
  }

  function exportLearningWord(token){
    const lemma=normalizeLearningIdentity(token?.lemma||token?.text||"");
    return state.learningItems.some(item=>
      itemStatus(item)==="learning" &&
      item.kind==="word" &&
      (normalizeLearningIdentity(item.key)===lemma || normalizeLearningIdentity(item.label)===lemma)
    );
  }

  async function highlightedWebExportRows(){
    if(adapter.id!=="web") return [];
    const preparedFixture=activePreparedBenchmark();
    const rows=[];
    for(let index=0;index<(state.web.segments||[]).length;index++){
      const segment=state.web.segments[index];
      if(!segment?.text) continue;
      let data=null;
      try{ data=await analyze(segment.text); }catch(_error){}
      const tokens=data?.tokens||[];
      const expressions=exportExpressionPriority(data?.expressions||[]);
      const expressionByToken=new Map();
      for(const expr of expressions){
        for(const tokenIndex of expr.token_indices||[]){
          if(!expressionByToken.has(tokenIndex)) expressionByToken.set(tokenIndex,expr);
        }
      }

      let html="";
      for(let i=0;i<tokens.length;i++){
        const token=tokens[i];
        const expr=expressionByToken.get(token.i);
        const learningExpr=expr && exportLearningExpression(expr);
        const learningWord=exportLearningWord(token);
        let cls="";
        let title="";
        if(learningExpr || learningWord){
          cls="learning";
          title=expr?.canonical||token.lemma||token.text||"";
        }else if(expr){
          cls="expression";
          title=expr.canonical||"";
        }
        const piece=cls
          ? '<mark class="'+cls+'" title="'+escAttr(title)+'">'+esc(token.text)+'</mark>'
          : esc(token.text);
        html+=piece;
        if(shouldInsertSpace(token,tokens[i+1])) html+=" ";
      }
      if(!tokens.length) html=esc(segment.text);
      rows.push({index:index+1,html});
    }
    return rows;
  }

  async function printHighlightedWebExport(){
    if(adapter.id!=="web") throw new Error("Highlight PDF yalnız web sayfalarında kullanılabilir");
    const rows=await highlightedWebExportRows();
    if(!rows.length) throw new Error("PDF için web metni bulunamadı");
    const title=safeExportName("Highlight_Metin");
    const iframe=document.createElement("iframe");
    iframe.setAttribute("aria-hidden","true");
    iframe.style.position="fixed";
    iframe.style.right="0";
    iframe.style.bottom="0";
    iframe.style.width="1px";
    iframe.style.height="1px";
    iframe.style.border="0";
    iframe.style.opacity="0";
    document.documentElement.appendChild(iframe);
    const doc=iframe.contentDocument;
    if(!doc){iframe.remove();throw new Error("Highlight PDF belgesi oluşturulamadı");}
    const body=rows.map(row=>'<p><span class="index">'+row.index+'</span>'+row.html+'</p>').join("");
    doc.open();
    doc.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>'+
      '@page{size:A4;margin:14mm 15mm}*{box-sizing:border-box}body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111827;margin:0;font-size:13px;line-height:1.65}'+
      'h1{font-size:20px;line-height:1.2;margin:0 0 4px}.meta{font-size:10px;color:#64748b;margin-bottom:14px;overflow-wrap:anywhere}.legend{display:flex;gap:12px;flex-wrap:wrap;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:14px;font-size:10px}.legend i{display:inline-block;width:18px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}.le{background:rgba(168,85,247,.30)}.ll{background:rgba(250,204,21,.55)}'+
      'p{margin:0 0 9px;break-inside:avoid}.index{display:inline-block;color:#94a3b8;font-size:9px;width:24px;vertical-align:2px}mark{color:inherit;padding:1px 2px;border-radius:2px;-webkit-print-color-adjust:exact;print-color-adjust:exact}mark.expression{background:rgba(168,85,247,.30)}mark.learning{background:rgba(250,204,21,.55)}'+
      '</style></head><body><h1>'+esc(document.title||"Web Highlight Export")+'</h1><div class="meta">'+esc(location.href)+'</div>'+
      '<div class="legend"><span><i class="le"></i>Kelime grubu / yapı</span><span><i class="ll"></i>Öğreniyorum</span></div>'+body+'</body></html>');
    doc.close();
    try{doc.title=title;}catch(_error){}
    setTimeout(()=>{
      try{iframe.contentWindow?.focus();iframe.contentWindow?.print();}
      finally{setTimeout(()=>iframe.remove(),1800);}
    },350);
  }

  function printExport(records,title){
    const rows=records.map(record=>
      '<div class="r">'+Object.entries(record).filter(([,v])=>String(v??"")!=="").map(([k,v])=>
        '<div><b>'+esc(k)+'</b><span>'+esc(String(v??""))+'</span></div>'
      ).join("")+'</div>'
    ).join("");
    const iframe=document.createElement("iframe");
    iframe.setAttribute("aria-hidden","true");
    iframe.style.position="fixed";
    iframe.style.right="0";
    iframe.style.bottom="0";
    iframe.style.width="1px";
    iframe.style.height="1px";
    iframe.style.border="0";
    iframe.style.opacity="0";
    document.documentElement.appendChild(iframe);
    const doc=iframe.contentDocument;
    if(!doc){iframe.remove();throw new Error("PDF/Print belgesi oluşturulamadı");}
    doc.open();
    doc.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>@page{margin:16mm}body{font-family:system-ui,-apple-system,sans-serif;margin:0;color:#111}h1{font-size:22px}.r{padding:12px 0;border-bottom:1px solid #ddd;break-inside:avoid}.r div{display:grid;grid-template-columns:150px 1fr;gap:12px;margin:4px 0}.r b{font-size:12px;text-transform:uppercase;color:#666}.r span{white-space:pre-wrap}</style></head><body><h1>'+esc(title)+'</h1>'+rows+'</body></html>');
    doc.close();
    try{doc.title=title;}catch(_error){}
    const previousTitle=document.title;
    document.title=title;
    setTimeout(()=>{
      try{iframe.contentWindow?.focus();iframe.contentWindow?.print();}
      finally{setTimeout(()=>{document.title=previousTitle;iframe.remove();},1800);}
    },300);
  }

  async function performExport(selected,format,sentenceMode,sectionOverride=""){
    const records=[];
    for(const item of selected){
      const record=exportRecordForItem(item,sentenceMode);
      if(item.kind==="sentence" && sentenceMode!=="original") record["Türkçe"]=await translationForCue(item.cue);
      if(item.kind==="sentence" && sentenceMode==="translation") delete record["Almanca"];
      else if(item.kind==="sentence" && sentenceMode==="original") delete record["Türkçe"];
      records.push(record);
    }
    const base=safeExportName(sectionOverride);
    if(format==="json"){
      downloadTextFile(base+".json","application/json;charset=utf-8",JSON.stringify(records,null,2));
      return;
    }
    if(format==="csv"){
      const keys=[...new Set(records.flatMap(record=>Object.keys(record)))];
      const csv=[keys.map(csvCell).join(","),...records.map(record=>keys.map(key=>csvCell(record[key]??"")).join(","))].join("\n");
      downloadTextFile(base+".csv","text/csv;charset=utf-8",csv);
      return;
    }
    if(format==="pdf"){printExport(records,base);return;}
    const txt=records.map(record=>Object.entries(record)
      .filter(([,value])=>String(value??"")!=="")
      .map(([key,value])=>key+": "+value).join("\n")).join("\n\n");
    downloadTextFile(base+".txt","text/plain;charset=utf-8",txt);
  }

  async function ensureExportDialog(){
    document.getElementById("gle-export-dialog")?.remove();
    const items=await exportItemsForCurrentTab();
    const dialog=document.createElement("div");
    dialog.id="gle-export-dialog";
    const sentenceOptions=state.panel.tab==="subtitles"
      ? '<label>'+esc(uiText("exportContent"))+'<select name="sentenceMode"><option value="bilingual">'+esc(uiText("exportBilingual"))+'</option><option value="original">'+esc(uiText("exportOriginal"))+'</option><option value="translation">'+esc(uiText("exportTranslationOnly"))+'</option></select></label>'
      : "";
    const wordSections=state.panel.tab==="words"
      ? '<div class="gle-export-sections">'+[
          ["overview","Genel"],["alphabetical","A-Z"],["frequency","Sıklık"],["groups","Kelime grupları"],["senses","Anlamlar"]
        ].map(([id,label])=>'<label><input type="checkbox" data-export-section="'+id+'" '+(id===state.panel.wordsView?"checked":"")+'><span>'+label+'</span></label>').join("")+'</div>'
      : "";
    dialog.innerHTML='<div class="gle-export-card" role="dialog" aria-modal="true"><header><strong>'+esc(uiText("exportTitle"))+'</strong><button type="button" class="gle-export-close">×</button></header>'+
      '<div class="gle-export-options">'+sentenceOptions+
      '<label>'+esc(uiText("exportFormat"))+'<select name="format"><option value="txt">TXT</option><option value="csv">CSV</option><option value="json">JSON</option><option value="pdf">PDF / Print</option></select></label></div>'+
      wordSections+
      '<div class="gle-export-selectbar"><label><input type="checkbox" class="gle-export-all"> '+esc(uiText("exportSelectAll"))+'</label><span class="gle-export-count">0</span></div>'+
      '<div class="gle-export-items"></div>'+
      '<footer>'+(adapter.id==="web"?'<button type="button" class="gle-export-highlight-pdf">Highlight PDF</button>':"")+'<button type="button" class="gle-export-panel-diagnostic">Panel Diagnostic JSON</button><button type="button" class="gle-export-cancel">'+esc(uiText("exportCancel"))+'</button><button type="button" class="gle-export-go">'+esc(uiText("exportDownload"))+'</button></footer></div>';
    document.documentElement.appendChild(dialog);
    const close=()=>dialog.remove();
    dialog.querySelector(".gle-export-close").addEventListener("click",close);
    dialog.querySelector(".gle-export-cancel").addEventListener("click",close);
    dialog.querySelector(".gle-export-highlight-pdf")?.addEventListener("click",async event=>{
      const button=event.currentTarget;
      button.disabled=true;
      button.textContent="Hazırlanıyor…";
      try{
        await printHighlightedWebExport();
        close();
      }catch(error){
        console.warn("Highlight PDF export failed",error);
        button.disabled=false;
        button.textContent="Highlight PDF";
      }
    });
    dialog.querySelector(".gle-export-panel-diagnostic")?.addEventListener("click",async event=>{
      const button=event.currentTarget;
      button.disabled=true;
      button.textContent="Panel hazırlanıyor…";
      try{
        await downloadPanelDiagnosticExport();
        close();
      }catch(error){
        console.warn("Panel diagnostic export failed",error);
        button.disabled=false;
        button.textContent="Panel Diagnostic JSON";
      }
    });
    dialog.addEventListener("click",event=>{if(event.target===dialog)close();});
    const itemBox=dialog.querySelector(".gle-export-items");
    const all=dialog.querySelector(".gle-export-all");
    const count=dialog.querySelector(".gle-export-count");
    const visibleItems=()=>state.panel.tab!=="words"
      ? items
      : items.filter(item=>dialog.querySelector('[data-export-section="'+item.sectionId+'"]')?.checked);
    const renderItems=()=>{
      const list=visibleItems();
      itemBox.innerHTML=list.map(item=>'<label><input type="checkbox" data-export-id="'+escAttr(item.id)+'" checked><span>'+(item.section?'<b>'+esc(item.section)+'</b> · ':"")+esc(item.label)+'</span></label>').join("");
      all.checked=list.length>0;
      all.indeterminate=false;
      count.textContent=String(list.length);
      itemBox.querySelectorAll("[data-export-id]").forEach(input=>input.addEventListener("change",()=>{
        const boxes=[...itemBox.querySelectorAll("[data-export-id]")];
        all.checked=boxes.length>0&&boxes.every(box=>box.checked);
        all.indeterminate=!all.checked&&boxes.some(box=>box.checked);
        count.textContent=String(boxes.filter(box=>box.checked).length)+"/"+boxes.length;
      }));
    };
    dialog.querySelectorAll("[data-export-section]").forEach(input=>input.addEventListener("change",renderItems));
    all.addEventListener("change",()=>{
      itemBox.querySelectorAll("[data-export-id]").forEach(input=>{input.checked=all.checked;});
      const boxes=[...itemBox.querySelectorAll("[data-export-id]")];
      count.textContent=String(boxes.filter(box=>box.checked).length)+"/"+boxes.length;
    });
    renderItems();
    dialog.querySelector(".gle-export-go").addEventListener("click",async()=>{
      const selectedIds=new Set([...itemBox.querySelectorAll("[data-export-id]:checked")].map(input=>input.dataset.exportId));
      const selected=visibleItems().filter(item=>selectedIds.has(item.id));
      if(!selected.length)return;
      const sectionIds=[...new Set(selected.map(item=>item.sectionId).filter(Boolean))];
      const sectionOverride=state.panel.tab==="words"
        ? (sectionIds.length===1
          ? ({overview:"Kelimeler",alphabetical:"Kelimeler_A-Z",frequency:"Kelimeler_Siklik",groups:"Kelime_Gruplari",senses:"Anlamlar"})[sectionIds[0]]
          : "Kelimeler_Coklu")
        : "";
      const button=dialog.querySelector(".gle-export-go");
      button.disabled=true;
      try{
        await performExport(
          selected,
          dialog.querySelector('[name="format"]').value,
          dialog.querySelector('[name="sentenceMode"]')?.value||"bilingual",
          sectionOverride
        );
        close();
      }catch(error){
        console.warn("Export failed",error);
        button.disabled=false;
      }
    });
    return dialog;
  }

  function renderSharedPanel(){
    const panel=ensureSharedPanel();
    if(!panel) return;
    panel.querySelectorAll("[data-tab]").forEach(button=>button.classList.toggle("active",button.dataset.tab===state.panel.tab));
    const body=panel.querySelector(".gle-panel-body");
    if(state.panel.tab==="words") renderPanelWords(body);
    else if(state.panel.tab==="saved") renderPanelSaved(body);
    else renderPanelSubtitles(body);
    scheduleCachedLocalLookup();
    scheduleCachedAiLookup();
  }

  async function indexPreparedCorpusFromYouTube(cues){
    const videoId=state.youtube.videoId || new URL(location.href).searchParams.get("v");
    if(!videoId || state.youtube.corpusIndexing.has(videoId) || !cues?.length) return;

    state.youtube.corpusIndexing.add(videoId);
    try{
      const apiBase=await platformApiBase();
      const targetsResponse=await platformFetch(apiBase+"/api/v1/example-corpus/index-targets");
      if(!targetsResponse.ok) throw new Error("index targets "+targetsResponse.status);
      const targetsPayload=await targetsResponse.json();
      const targetLemmas=targetsPayload.targets?.[videoId];
      if(!Array.isArray(targetLemmas) || !targetLemmas.length) return;

      const response=await platformFetch(apiBase+"/api/v1/example-corpus/index-cues",{
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
    const response=await platformFetch(apiBase+"/api/v1/example-corpus/index-video",{
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

      // The visible translation is intentionally scoped to the current cue.
      // Hover analysis may still use wider context, but neighboring cue text
      // must not leak into the Turkish subtitle shown on the video.
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
    if(maybeAutoPausePreviousCueAtTransition(video,cues,cue,"youtube")) return true;
    maybeAutoPauseCue(video,cue,"youtube");

    if(state.youtube.cueIndex!==cue.index){
      state.youtube.cueIndex=cue.index;
      if(!state.playback.autoPausedCueKey.endsWith(":"+String(cue.index))) state.playback.autoPausedCueKey="";
      const translationText=cue.text;
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
      if(event?.type==="play"){
        noteAutoPausePlaybackResume("youtube",video,state.youtube.cues);
      }
      if(event?.type==="seeking") clearAutoPauseTimer();
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
      analyzeWholeYouTubeExpressionGroups();
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
      createSentenceNavigationControls(overlay);
      host.appendChild(overlay);
      installZdfDragHandle(video,overlay,handle);
    }
    state.zdf.overlay=overlay;
    state.zdf.germanLine=overlay.querySelector(".gle-youtube-german");
    installSubtitleHoverPause(state.zdf.germanLine);
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
    let cue=cueAtTime(cues,seconds*1000);
    if(!cue){
      const holdKey=state.playback.autoPausedCueKey.startsWith("zdf:")
        ? state.playback.autoPausedCueKey
        : state.playback.autoPauseScheduledKey.startsWith("zdf:")
          ? state.playback.autoPauseScheduledKey
          : "";
      const heldIndex=holdKey ? Number(holdKey.slice(4)) : NaN;
      const heldCue=Number.isInteger(heldIndex) ? cues[heldIndex] : null;
      if(heldCue && seconds*1000<=Number(heldCue.endMs||0)+850) cue=heldCue;
    }
    if(!cue){
      ui.overlay.hidden=true;
      state.zdf.cueIndex=-1;
      state.youtube.cueIndex=-1;
      updatePanelActiveCue();
      return true;
    }
    ui.overlay.hidden=false;
    maybeAutoPauseCue(ui.video,cue,"zdf");
    if(state.zdf.cueIndex!==cue.index){
      state.zdf.cueIndex=cue.index;
      if(!state.playback.autoPausedCueKey.endsWith(":"+String(cue.index))) state.playback.autoPausedCueKey="";
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
    state.zdf.videoListeners=event=>{
      if(event?.type==="play"){
        noteAutoPausePlaybackResume("zdf",video,state.zdf.cues);
      }
      if(event?.type==="seeking") clearAutoPauseTimer();
      renderZdfCue();
    };
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

  function splitWebSentences(text){
    const normalized=String(text||"").replace(/\s+/g," ").trim();
    if(!normalized) return [];
    if("Segmenter" in Intl){
      try{
        return [...new Intl.Segmenter("de",{granularity:"sentence"}).segment(normalized)]
          .map(part=>part.segment.trim())
          .filter(Boolean);
      }catch(_error){}
    }
    return normalized.match(/[^.!?…]+(?:[.!?…]+|$)/g)?.map(part=>part.trim()).filter(Boolean) || [normalized];
  }

  function webElementVisible(element){
    if(!element?.isConnected) return false;
    if(element.closest("#gle-shared-panel,#gle-tooltip,#gle-settings-dialog")) return false;
    if(element.closest("nav,footer,aside,form,script,style,noscript,template,pre,code")) return false;
    const style=getComputedStyle(element);
    if(style.display==="none" || style.visibility==="hidden") return false;
    const rect=element.getBoundingClientRect();
    return rect.width>0 && rect.height>0;
  }

  function webCandidateText(element){
    const isHeaderMeta=element.matches?.("article header [class*=category],article header [class*=kicker]");
    if(isHeaderMeta){
      const parts=[...element.querySelectorAll(":scope > a,:scope > span")]
        .map(node=>String(node.innerText||node.textContent||"").replace(/\s+/g," ").trim())
        .filter(Boolean);
      if(parts.length>1) return [...new Set(parts)].join(" | ");
    }
    return String(element.innerText||element.textContent||"").replace(/\s+/g," ").trim();
  }

  function collectWebSegments(){
    const root=document.querySelector("article") || document.querySelector("main") || document.querySelector('[role="main"]') || document.body;
    if(!root) return [];
    const candidates=[...root.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,article header time,article header [class*=category],article header [class*=kicker]")];
    const segments=[];
    const seen=new Set();

    for(const element of candidates){
      if(segments.length>=500) break;
      if(!webElementVisible(element)) continue;
      const raw=webCandidateText(element);
      if(raw.length<12 || raw.length>2400) continue;
      for(const sentence of splitWebSentences(raw)){
        if(segments.length>=500) break;
        const text=sentence.replace(/\s+/g," ").trim();
        if(text.length<8 || text.length>900 || !/[\p{L}]/u.test(text)) continue;
        const dedupe=text.toLocaleLowerCase("de-DE");
        if(seen.has(dedupe)) continue;
        seen.add(dedupe);
        segments.push({
          index:segments.length,
          text,
          startMs:segments.length*1000,
          endMs:segments.length*1000+900,
          sourceElement:element,
        });
      }
    }
    return segments;
  }

  function resetSharedContentAnalysis(contentId){
    if(state.youtube.videoId===contentId) return;
    state.aiIndexLastStatus="";
    state.aiIndexBusy=false;
    state.aiIndexDiagnostic=null;
    renderAiLabDialog();
    state.youtube.videoId=contentId;
    state.youtube.cueIndex=-1;
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
    state.panel.senseRows=null;
    state.panel.senseRowsVideoId="";
    state.panel.senseRowsPromise=null;
    state.youtube.videoUnknownLemmas=new Set();
    state.youtube.videoUnknownExpressions=new Set();
  }

  function focusWebSegment(index){
    const segment=state.web.segments[index];
    const element=segment?.sourceElement;
    if(!element?.isConnected) return;
    state.youtube.cueIndex=index;
    element.scrollIntoView({behavior:"smooth",block:"center"});
    document.querySelectorAll(".gle-web-source-highlight").forEach(node=>node.classList.remove("gle-web-source-highlight"));
    if(CSS?.highlights) CSS.highlights.delete("gle-sentence-target");
    const fullText=String(element.textContent||"");
    let sentenceStart=fullText.indexOf(segment.text);
    if(sentenceStart<0) sentenceStart=fullText.toLocaleLowerCase("de-DE").indexOf(String(segment.text||"").toLocaleLowerCase("de-DE"));
    if(sentenceStart>=0 && CSS?.highlights && typeof Highlight!=="undefined"){
      const range=webRangeFromOffsets(element,sentenceStart,sentenceStart+String(segment.text||"").length);
      if(range) CSS.highlights.set("gle-sentence-target",new Highlight(range));
      clearTimeout(state.web.highlightTimer);
      state.web.highlightTimer=setTimeout(()=>CSS.highlights.delete("gle-sentence-target"),2200);
    }
    updatePanelActiveCue();
  }

  function scanWebPage(){
    ensureSharedPanel();
    syncSharedPanelHost();
    const segments=collectWebSegments();
    const signature=segments.map(item=>item.text).join("\n").slice(0,60000);
    if(signature===state.web.signature && state.web.url===location.href) return;

    state.web.signature=signature;
    state.web.url=location.href;
    state.web.segments=segments;
    const contentId="web:"+location.href;
    resetSharedContentAnalysis(contentId);
    state.youtube.cues=segments;
    state.youtube.timedAvailable=false;
    state.youtube.cueIndex=-1;

    loadVideoUnknownLemmas().catch(()=>{});
    loadVideoUnknownExpressions().catch(()=>{});
    installWebTextInteraction();
    const preparedFixture=activePreparedBenchmark();
    if(preparedFixture){
      for(const segment of segments){
        const translation=preparedTranslationForText(preparedFixture,segment.text);
        if(translation) state.panelTranslationCache.set(segment.text,translation);
      }
      state.youtube.transcriptAnalysis=preparedWordAnalysis(preparedFixture);
      state.youtube.transcriptAnalysisVideoId=contentId;
      state.youtube.expressionGroupsAnalysis=preparedExpressionAnalysis(preparedFixture);
      state.youtube.expressionGroupsVideoId=contentId;
      requestAnimationFrame(()=>refreshPreparedBenchmarkHighlights(preparedFixture));
    }
    if(segments.length){
      if(preparedFixture){
        warmPreparedContextualMeanings().catch(()=>{});
      }else{
        Promise.all([analyzeWholeYouTubeTranscript(),analyzeWholeYouTubeExpressionGroups()])
          .finally(()=>scheduleWebLearningAnnotations());
      }
    }
    renderSharedPanel();
    scheduleWebLearningAnnotations();
    if(preparedFixture) requestAnimationFrame(()=>refreshPreparedBenchmarkHighlights(preparedFixture));
  }

  function scan(){
    if(!state.settingsHydrated) return;
    if(adapter.id==="web"){
      scanWebPage();
      return;
    }
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
    systemMonitorEnabled:true,
    systemMonitorCollapsed:false,
    systemMonitorWidth:350,
    showSentenceTranslation:null,
    showVideoTranslation:null,
    showPanelTranslation:null,
    followActiveSubtitle:true,
    pauseOnWordHover:false,
    autoPauseAfterSentence:false,
    interfaceLanguage:"tr",
    theme:"dark",
    panelWidthFactor:1,
    germanFontSize:100,
    translationFontSize:100,
    youtubeSubtitlePositionY:82,
    zdfSubtitlePositionY:88,
    tooltipPositionLocked:false,
    tooltipPersistent:false,
    tooltipHoverMode:false,
    tooltipLeft:null,
    tooltipTop:null
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
    state.settingsHydrated=true;
    state.aiLabCollapsed=settings.systemMonitorCollapsed===true;
    state.aiLabWidth=Math.max(250,Math.min(560,Number(settings.systemMonitorWidth)||350));
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
    if(area==="local"){
      if(changes.gleLearningRevision) scheduleRemoteLearningReload();
      return;
    }
    if(area!=="sync") return;
    if(changes.extensionEnabled) state.settings.extensionEnabled=changes.extensionEnabled.newValue;
    if(changes.systemMonitorEnabled){
      state.settings.systemMonitorEnabled=changes.systemMonitorEnabled.newValue!==false;
      syncSystemMonitorVisibility();
    }
    if(changes.systemMonitorCollapsed){
      state.settings.systemMonitorCollapsed=changes.systemMonitorCollapsed.newValue===true;
      state.aiLabCollapsed=state.settings.systemMonitorCollapsed;
      syncSystemMonitorVisibility();
    }
    if(changes.systemMonitorWidth){
      state.settings.systemMonitorWidth=Math.max(250,Math.min(560,Number(changes.systemMonitorWidth.newValue)||350));
      state.aiLabWidth=state.settings.systemMonitorWidth;
      if(state.aiLabDialog) state.aiLabDialog.style.width=state.aiLabWidth+"px";
    }
    if(changes.showVideoTranslation) state.settings.showVideoTranslation=changes.showVideoTranslation.newValue;
    if(changes.showPanelTranslation) state.settings.showPanelTranslation=changes.showPanelTranslation.newValue;
    if(changes.followActiveSubtitle) state.settings.followActiveSubtitle=changes.followActiveSubtitle.newValue;
    if(changes.pauseOnWordHover){
      state.settings.pauseOnWordHover=changes.pauseOnWordHover.newValue;
      if(changes.pauseOnWordHover.newValue!==true) finishSubtitleHoverPause();
    }
    if(changes.autoPauseAfterSentence){ state.settings.autoPauseAfterSentence=changes.autoPauseAfterSentence.newValue; state.playback.autoPausedCueKey=""; state.playback.autoPauseReleasedCueKey=""; if(changes.autoPauseAfterSentence.newValue!==true) clearAutoPauseTimer(); }
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
    if(changes.tooltipPositionLocked) state.settings.tooltipPositionLocked=changes.tooltipPositionLocked.newValue===true;
    if(changes.tooltipPersistent) state.settings.tooltipPersistent=changes.tooltipPersistent.newValue===true;
    if(changes.tooltipHoverMode) state.settings.tooltipHoverMode=changes.tooltipHoverMode.newValue===true;
    if(changes.tooltipLeft) state.settings.tooltipLeft=changes.tooltipLeft.newValue;
    if(changes.tooltipTop) state.settings.tooltipTop=changes.tooltipTop.newValue;
    syncTooltipToolStates();
    applySharedAppearance();
    if(changes.showPanelTranslation && state.panel.tab==="subtitles") renderSharedPanel();
    if(changes.showVideoTranslation) refreshVideoTranslations();
  });

  document.addEventListener("mousemove",event=>{
    if(adapter.id==="web" && state.web.tooltipPinnedKey) return;
    const overTooltip=state.tooltip?.contains(event.target);
    const overTooltipAnchor=event.target.closest?.(".gle-word,.gle-word-chip,.gle-expression-chip");
    if(overTooltip || overTooltipAnchor){
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
