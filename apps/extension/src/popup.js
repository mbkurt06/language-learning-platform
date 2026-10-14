const masterButton=document.querySelector("#toggleExtension");
const button=document.querySelector("#indexVideo");
const status=document.querySelector("#status");
let extensionEnabled=true;
function renderMasterButton(){
  document.querySelector("#toggleState").textContent=extensionEnabled?"Açık":"Kapalı";
  masterButton.classList.toggle("is-off",!extensionEnabled);
  masterButton.setAttribute("aria-checked",String(extensionEnabled));
  button.disabled=!extensionEnabled;
}
chrome.storage.sync.get({extensionEnabled:true},settings=>{
  extensionEnabled=settings.extensionEnabled!==false;
  renderMasterButton();
});
masterButton.addEventListener("click",async()=>{
  masterButton.disabled=true;
  const next=!extensionEnabled;
  try{
    await chrome.storage.sync.set({extensionEnabled:next});
    extensionEnabled=next;
    renderMasterButton();
    status.textContent=next?"Language Learning açıldı.":"Language Learning kapatıldı.";
  }catch(error){
    status.textContent="Durum değiştirilemedi. Tekrar dene.";
  }finally{
    masterButton.disabled=false;
  }
});
chrome.storage.onChanged.addListener((changes,area)=>{
  if(area==="sync"&&changes.extensionEnabled){
    extensionEnabled=changes.extensionEnabled.newValue!==false;
    renderMasterButton();
  }
});
button.addEventListener("click",async()=>{
  button.disabled=true;
  status.textContent="Video indexleniyor…";

  try{
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(!tab?.id || !String(tab.url||"").includes("youtube.com/watch")){
      throw new Error("YouTube watch page required");
    }

    const response=await chrome.tabs.sendMessage(tab.id,{type:"gle-index-current-video"});
    if(!response?.ok){
      throw new Error(response?.error||"Indexleme başarısız");
    }

    status.textContent=`${response.uniqueLemmas||0} lemma indexlendi.`;
  }catch(error){
    status.textContent=error?.message==="YouTube watch page required"
      ? "Bir YouTube videosu açık olmalı."
      : "Indexleme başarısız.";
    console.warn("Video corpus indexing failed",error);
  }finally{
    button.disabled=false;
  }
});
