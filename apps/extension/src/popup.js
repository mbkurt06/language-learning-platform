const button=document.querySelector("#indexVideo");
const status=document.querySelector("#status");

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
