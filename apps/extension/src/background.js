const ALLOWED_ZDF_HOSTS = [
  /(^|\\.)zdf\\.de$/i,
  /(^|\\.)akamaized\\.net$/i,
];

function allowedUrl(value){
  try { return ALLOWED_ZDF_HOSTS.some(pattern=>pattern.test(new URL(value).hostname)); }
  catch (_error) { return false; }
}

chrome.runtime.onMessage.addListener((message,_sender,sendResponse)=>{
  if(message?.type!=="gle-zdf-fetch") return;
  if(!allowedUrl(message.url)){
    sendResponse({ok:false,error:"blocked-zdf-fetch-host"});
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
