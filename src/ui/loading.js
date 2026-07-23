(function(global){
  "use strict";

  const runtime=global.AIBA&&global.AIBA.runtime,ctx=runtime&&runtime.service("legacy");
  if(!runtime||!ctx||!runtime.service("ui:panels"))throw new Error("UI loading requires panels and legacy adapter");
  const {$,clamp,COVER_STARS,EXT_AUDIO,ensureAudio}=ctx;
  let coverVideoTimer=null,bootFailed=0;
  global.BOOT_GATE_ACTIVE=true;global.BOOT_READY=false;global.BOOT_COVER=null;

  function setBootProgress(done,total,finished,count){
    const percent=Math.round(clamp(done/Math.max(1,total),0,1)*100);
    $("bootBar").style.width=percent+"%";$("bootPercent").textContent=percent+"%";$("bootFile").textContent=finished+"/"+count+" 核心资源";
  }
  async function preloadBootAsset(asset,total,state){
    let ok=true;
    try{
      const controller=typeof AbortController!=="undefined"?new AbortController():null;
      const timer=controller?setTimeout(()=>controller.abort(),12000):null;
      const response=await fetch(asset.url,{cache:"force-cache",signal:controller?controller.signal:undefined});
      if(timer)clearTimeout(timer);if(!response.ok)throw new Error("HTTP "+response.status);await response.arrayBuffer();
    }catch(error){ok=false;bootFailed++;}
    state.done+=asset.weight;state.finished++;setBootProgress(state.done,total,state.finished,state.count);return ok;
  }
  async function ensureUIFontReady(){
    if(!document.fonts||!document.fonts.load)return;
    try{await Promise.race([document.fonts.load("700 16px Orbitron"),new Promise(resolve=>setTimeout(resolve,1000))]);}catch(error){}
  }
  async function bootGame(){
    global.BOOT_COVER=COVER_STARS[(Math.random()*COVER_STARS.length)|0];
    $("bootLoad").addEventListener("pointerdown",unlockBoot,{passive:false});global.showMenu();
    const assets=[
      {url:global.BOOT_COVER.cover,weight:100000},{url:"assets/fonts/orbitron/Orbitron-VariableFont_wght.ttf",weight:38576},
      {url:EXT_AUDIO.bgm,weight:807227},{url:EXT_AUDIO.crowd,weight:1119164},{url:EXT_AUDIO.crowdCheer,weight:300975},
      {url:EXT_AUDIO.rain,weight:731204},{url:EXT_AUDIO.ocean,weight:32684},{url:EXT_AUDIO.gull,weight:32108}
    ];
    const usable=assets.filter(asset=>asset.url),total=usable.reduce((sum,asset)=>sum+asset.weight,0);
    const state={done:0,finished:0,count:usable.length};$("bootStatus").textContent="正在同步画面与球馆声音";
    await Promise.all([Promise.all(usable.map(asset=>preloadBootAsset(asset,total,state))),new Promise(resolve=>setTimeout(resolve,1100))]);
    await ensureUIFontReady();setBootProgress(total,total,usable.length,usable.length);global.BOOT_READY=true;
    const gate=$("bootLoad");gate.classList.add("ready");gate.setAttribute("aria-busy","false");
    $("bootStatus").textContent=bootFailed?"基础资源就绪":"赛场资源就绪";document.documentElement.dataset.bootReady="1";
  }
  function unlockBoot(event){
    if(!global.BOOT_GATE_ACTIVE)return false;
    if(event&&event.preventDefault)event.preventDefault();if(!global.BOOT_READY)return true;
    global.BOOT_GATE_ACTIVE=false;ensureAudio(true,true);startCoverVideo();
    const gate=$("bootLoad");gate.classList.add("leaving");gate.setAttribute("aria-hidden","true");document.documentElement.dataset.bootStarted="1";
    setTimeout(()=>{
      gate.style.display="none";const shared=ctx.getSharedRackRush();
      if(shared&&!shared.opened){shared.opened=true;ctx.G.mode="rackrush";ctx.pickDiff(shared.diff);}
    },460);return true;
  }
  function stopCoverVideo(){
    clearTimeout(coverVideoTimer);coverVideoTimer=null;const video=document.querySelector(".coverVideo");
    if(video){try{video.classList.remove("ready");video.closest(".coverHero")?.classList.remove("video-active");video.pause();video.removeAttribute("src");video.load();}catch(error){}}
  }
  function startCoverVideo(){
    const video=document.querySelector(".coverVideo");if(!video||!video.dataset.src)return;
    const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    if(matchMedia("(prefers-reduced-motion: reduce)").matches||(connection&&(connection.saveData||/^(slow-)?2g$/.test(connection.effectiveType||""))))return;
    let failed=false;
    const fallback=()=>{failed=true;clearTimeout(coverVideoTimer);coverVideoTimer=null;try{video.classList.remove("ready");video.closest(".coverHero")?.classList.remove("video-active");video.pause();video.removeAttribute("src");video.load();}catch(error){}};
    const reveal=()=>{if(failed)return;clearTimeout(coverVideoTimer);coverVideoTimer=null;video.classList.add("ready");video.closest(".coverHero")?.classList.add("video-active");};
    video.addEventListener("playing",reveal,{once:true});video.addEventListener("error",fallback,{once:true});video.src=video.dataset.src;video.load();
    try{const promise=video.play();if(promise&&promise.catch)promise.catch(fallback);}catch(error){fallback();return;}
    coverVideoTimer=setTimeout(()=>{if(video.readyState<2)fallback();},3500);
  }
  function scheduleCoverVideo(){
    if(global.BOOT_GATE_ACTIVE)return;
    coverVideoTimer=setTimeout(()=>{coverVideoTimer=null;if("requestIdleCallback" in global)requestIdleCallback(startCoverVideo,{timeout:1600});else startCoverVideo();},900);
  }

  const api=Object.freeze({setBootProgress,preloadBootAsset,ensureUIFontReady,bootGame,unlockBoot,stopCoverVideo,startCoverVideo,scheduleCoverVideo});
  Object.assign(global,api);runtime.register("ui:loading",api);
})(window);
