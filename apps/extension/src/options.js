const url=document.querySelector("#url");
const interfaceLanguage=document.querySelector("#interfaceLanguage");
const showVideoTranslation=document.querySelector("#showVideoTranslation");
const showPanelTranslation=document.querySelector("#showPanelTranslation");
const followActiveSubtitle=document.querySelector("#followActiveSubtitle");
const germanSize=document.querySelector("#germanSize");
const germanSizeValue=document.querySelector("#germanSizeValue");
const translationSize=document.querySelector("#translationSize");
const sizeValue=document.querySelector("#sizeValue");
const status=document.querySelector("#status");
const learningList=document.querySelector("#learningList");
let learningItems=[];
let learningProfileId="";

const defaults={platformApiUrl:"http://127.0.0.1:8000",interfaceLanguage:"tr",showVideoTranslation:true,showPanelTranslation:true,followActiveSubtitle:true,germanFontSize:100,translationFontSize:100};
chrome.storage.sync.get(defaults,async x=>{
  url.value=x.platformApiUrl;
  interfaceLanguage.value=x.interfaceLanguage;
  showVideoTranslation.checked=x.showVideoTranslation;
  showPanelTranslation.checked=x.showPanelTranslation;
  followActiveSubtitle.checked=x.followActiveSubtitle;
  germanSize.value=x.germanFontSize;
  germanSizeValue.value=x.germanFontSize+"%";
  translationSize.value=x.translationFontSize;
  sizeValue.value=x.translationFontSize+"%";
  try{
    await ensureLearningProfile();
    await loadLearningItems();
  }catch(error){
    status.textContent="Öğrenme listesi yüklenemedi.";
    console.warn("Learning state bootstrap failed",error);
  }
});
germanSize.addEventListener("input",()=>germanSizeValue.value=germanSize.value+"%");
translationSize.addEventListener("input",()=>sizeValue.value=translationSize.value+"%");
document.querySelector("#save").onclick=()=>chrome.storage.sync.set({
  platformApiUrl:url.value.trim(),
  interfaceLanguage:interfaceLanguage.value,
  showVideoTranslation:showVideoTranslation.checked,
  showPanelTranslation:showPanelTranslation.checked,
  followActiveSubtitle:followActiveSubtitle.checked,
  germanFontSize:Number(germanSize.value),
  translationFontSize:Number(translationSize.value)
},()=>{status.textContent="Kaydedildi.";setTimeout(()=>status.textContent="",1500);});

function apiBase(){
  return (url.value.trim()||"http://127.0.0.1:8000").replace(/\/$/,"");
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

  const response=await fetch(apiBase()+"/api/v1/profiles/ensure",{
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
  learningProfileId=profile.id;
  await chrome.storage.sync.set({learningProfileId});

  if(!stored.learningItemsMigratedToApi && Array.isArray(stored.learningItems) && stored.learningItems.length){
    for(const legacy of stored.learningItems){
      const migration=await fetch(apiBase()+"/api/v1/learning-items",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          profile_id:learningProfileId,
          canonical_form:legacy.label||legacy.key,
          canonical_key:String(legacy.key||"").toLocaleLowerCase("de-DE"),
          category:legacy.kind||"word",
          status:"learning",
          meaning:legacy.meaning_tr||null,
          meaning_language:legacy.meaning_tr?"tr":null,
          metadata:{migrated_from:"chrome.storage.sync"},
        }),
      });
      if(!migration.ok) throw new Error("Legacy learning item migration "+migration.status);
    }
    await chrome.storage.sync.set({learningItemsMigratedToApi:true});
    await chrome.storage.sync.remove("learningItems");
  }
}

async function loadLearningItems(){
  if(!learningProfileId) await ensureLearningProfile();
  const response=await fetch(apiBase()+"/api/v1/learning-items?profile_id="+encodeURIComponent(learningProfileId));
  if(!response.ok) throw new Error("Platform API learning items "+response.status);
  const payload=await response.json();
  learningItems=(payload.items||[]).map(item=>{
    const translation=(item.translations||[]).find(entry=>entry.language==="tr") || item.translations?.[0];
    return {
      id:item.id,
      kind:item.category,
      key:item.canonical_key,
      label:item.canonical_form,
      meaning_tr:translation?.meaning||"",
    };
  });
  renderLearningItems();
}

function renderLearningItems(){
  learningList.textContent="";
  if(!learningItems.length){
    const empty=document.createElement("li");
    empty.textContent="Henüz işaretlenmiş öğe yok.";
    learningList.appendChild(empty);
    return;
  }

  learningItems.forEach(item=>{
    const li=document.createElement("li");
    const text=document.createElement("div");
    const strong=document.createElement("strong");
    strong.textContent=item.label||item.key;
    const meta=document.createElement("span");
    meta.className="learning-meta";
    meta.textContent=(item.kind==="expression"?"Kalıp":"Kelime")+(item.meaning_tr?" · "+item.meaning_tr:"");
    text.append(strong,meta);

    const remove=document.createElement("button");
    remove.type="button";
    remove.textContent="Kaldır";
    remove.onclick=async()=>{
      remove.disabled=true;
      try{
        const response=await fetch(apiBase()+"/api/v1/learning-items/"+encodeURIComponent(item.id),{method:"DELETE"});
        if(!response.ok && response.status!==404) throw new Error("Platform API learning item "+response.status);
        await loadLearningItems();
      }catch(error){
        status.textContent="Öğe kaldırılamadı.";
        console.warn("Learning item delete failed",error);
        remove.disabled=false;
      }
    };

    li.append(text,remove);
    learningList.appendChild(li);
  });
}
