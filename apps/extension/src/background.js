const EXACT_ZDF_HOSTS = new Set([
  "api.zdf.de",
  "zdf-prod-futura.zdf.de",
  "utstreaming.zdf.de",
]);

function allowedUrl(value){
  try {
    const hostname=new URL(value).hostname.toLowerCase();
    return EXACT_ZDF_HOSTS.has(hostname) || hostname.endsWith(".akamaized.net");
  } catch (_error) {
    return false;
  }
}

chrome.runtime.onMessage.addListener((message,_sender,sendResponse)=>{
  if(message?.type!=="gle-zdf-fetch") return;
  if(!allowedUrl(message.url)){
    let hostname="invalid-url";
    try { hostname=new URL(message.url).hostname; } catch (_error) {}
    sendResponse({ok:false,error:"blocked-zdf-fetch-host: "+hostname});
    return;
  }
  (async()=>{
    try{
      const response=await fetch(message.url,message.options||{});
      const body=await response.text();
      sendResponse({ok:response.ok,status:response.status,statusText:response.statusText,body});
    }catch(error){
      sendResponse({ok:false,status:0,error:String(error?.message||error)});
    }
  })();
  return true;
});
