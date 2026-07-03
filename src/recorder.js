/* ---------------- vertical highlight recorder ---------------- */
(function(global){
  "use strict";
  const W=720,H=1280,POST_MS=5200,FPS=24;
  const state={
    canvas:null,ctx:null,stream:null,rec:null,chunks:[],lastBlob:null,lastUrl:"",
    lastDraw:0,capturing:false,saveWhenReady:false,lastLabel:"精彩时刻",startedAt:0,stopTimer:0,canvasTrack:null,audioTracks:[]
  };
  function supported(){
    return !!(global.MediaRecorder&&HTMLCanvasElement.prototype.captureStream);
  }
  function mimeType(){
    const types=[
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4;codecs=avc1.42001f,mp4a.40.2",
      "video/mp4;codecs=h264,aac",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm"
    ];
    return types.find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||"";
  }
  function wantsMp4(){
    return /mp4/i.test(mimeType());
  }
  function canvas(){
    if(state.canvas)return state.canvas;
    const c=document.createElement("canvas");c.width=W;c.height=H;c.style.display="none";c.setAttribute("aria-hidden","true");
    document.body.appendChild(c);state.canvas=c;state.ctx=c.getContext("2d");return c;
  }
  function gameActive(){
    try{return ["round","tiebreak","battle","rackrush","wincine","victorycine","replay"].includes(G.state)||state.capturing;}catch(e){return state.capturing;}
  }
  function gameLabel(){
    try{
      if(G.mode==="battle")return "PERCENT BATTLE";
      if(G.mode==="rackrush")return G.rush&&G.rush.variant==="speed100"?"SPEED 100":"RACK RUSH";
      return G.stage==="final"?"FINAL":"THREE POINT";
    }catch(e){return "aiBA HIGHLIGHT";}
  }
  function scoreText(){
    try{
      if(G.mode==="battle")return Math.min(G.score||0,100)+" : "+Math.min(G.battleOppScore||0,100);
      if(G.mode==="rackrush"){
        if(G.rush&&G.rush.variant==="speed100")return (G.rush.total||0)+" / 100";
        return String(G.rush?G.rush.total||0:G.score||0);
      }
      return (G.score||G.finalScore||G.semiScore||0)+" PTS";
    }catch(e){return "";}
  }
  function drawCover(ctx,img,x,y,w,h){
    const sw=img.videoWidth||img.naturalWidth||img.width,sh=img.videoHeight||img.naturalHeight||img.height;
    if(!sw||!sh)return;
    const s=Math.max(w/sw,h/sh),dw=sw*s,dh=sh*s;
    ctx.drawImage(img,x+(w-dw)*.5,y+(h-dh)*.5,dw,dh);
  }
  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  }
  function drawHud(ctx){
    ctx.save();
    const grd=ctx.createLinearGradient(0,0,0,260);grd.addColorStop(0,"rgba(3,6,14,.72)");grd.addColorStop(1,"rgba(3,6,14,0)");
    ctx.fillStyle=grd;ctx.fillRect(0,0,W,300);
    ctx.fillStyle="#7ee7ff";ctx.font="700 22px Orbitron, monospace";ctx.letterSpacing="0px";ctx.fillText("aiBA HIGHLIGHT",34,54);
    ctx.fillStyle="#ffd23f";ctx.font="900 58px Orbitron, monospace";ctx.fillText(scoreText(),34,118);
    ctx.fillStyle="rgba(255,255,255,.88)";ctx.font="700 20px Orbitron, monospace";ctx.fillText(gameLabel(),34,154);
    ctx.fillStyle="rgba(255,255,255,.65)";ctx.font="700 16px Orbitron, monospace";ctx.fillText(state.lastLabel||"LAST SHOT",34,184);
    ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(0,H-136,W,136);
    ctx.fillStyle="#fff";ctx.font="900 36px Orbitron, monospace";ctx.fillText("PULL UP. LOCK IN. SHARE IT.",34,H-78);
    ctx.fillStyle="#9ab2c5";ctx.font="700 16px Orbitron, monospace";ctx.fillText("opstiger.github.io/aiba-percent-battle",34,H-44);
    ctx.restore();
  }
  function drawVisionPip(ctx){
    const v=document.getElementById("visionVideo");
    if(!v||v.readyState<2||!v.videoWidth)return;
    const x=34,y=H-386,w=196,h=148;
    ctx.save();ctx.fillStyle="rgba(0,0,0,.62)";roundRect(ctx,x-7,y-28,w+14,h+35,8);ctx.fill();
    ctx.strokeStyle="#70e8ff";ctx.lineWidth=3;roundRect(ctx,x-7,y-28,w+14,h+35,8);ctx.stroke();
    ctx.fillStyle="#70e8ff";ctx.font="700 13px Orbitron, monospace";ctx.fillText("LOCAL POSE",x,y-9);
    ctx.beginPath();roundRect(ctx,x,y,w,h,6);ctx.clip();drawCover(ctx,v,x,y,w,h);
    ctx.restore();
  }
  function draw(ctxObj){
    const c=canvas(),ctx=state.ctx,source=(ctxObj&&ctxObj.canvas)||document.getElementById("c");
    if(!source)return;
    ctx.fillStyle="#05060c";ctx.fillRect(0,0,W,H);
    ctx.save();drawCover(ctx,source,0,0,W,H);ctx.restore();
    ctx.fillStyle="rgba(3,6,12,.2)";ctx.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=6){ctx.fillStyle="rgba(255,255,255,.025)";ctx.fillRect(0,y,W,1);}
    drawHud(ctx);drawVisionPip(ctx);
    return c;
  }
  function updateStatus(txt){
    const el=document.getElementById("clipStatus");if(el)el.textContent=txt||statusText();
    const btn=document.getElementById("clipSaveBtn");if(btn)btn.disabled=!supported();
  }
  function statusText(){
    if(!supported())return "当前浏览器不支持录制";
    if(state.capturing)return "精彩视频生成中...";
    if(state.lastBlob)return /mp4/i.test(state.lastBlob.type)?"精彩MP4已就绪":"精彩视频已就绪(WebM)";
    return "命中关键球后自动生成";
  }
  function audioTracks(){
    try{
      const s=global.AIBAAudioCaptureStream&&global.AIBAAudioCaptureStream();
      return s?[...s.getAudioTracks()].filter(t=>t.readyState==="live"):[];
    }catch(e){return [];}
  }
  function freshStream(){
    const c=canvas(),stream=c.captureStream(FPS);
    state.canvasTrack=stream.getVideoTracks()[0]||null;
    state.audioTracks=audioTracks();
    state.audioTracks.forEach(t=>{try{stream.addTrack(t);}catch(e){}});
    return stream;
  }
  function onData(e){
    if(!e.data||!e.data.size)return;
    state.chunks.push(e.data);
  }
  function tick(ctxObj){
    if(!supported())return;
    const now=performance.now();
    if(now-state.lastDraw<1000/FPS)return;
    state.lastDraw=now;draw(ctxObj);
  }
  function mark(label,opts){
    if(!supported())return false;
    opts=opts||{};state.lastLabel=label||"精彩时刻";state.lastBlob=null;
    if(state.capturing){clearTimeout(state.stopTimer);state.stopTimer=setTimeout(stopRecording,opts.postMs||POST_MS);updateStatus("精彩视频延长录制中...");return true;}
    try{
      draw({canvas:document.getElementById("c")});
      state.chunks=[];state.stream=freshStream();
      const mt=mimeType(),optsRec={videoBitsPerSecond:3200000,audioBitsPerSecond:160000};if(mt)optsRec.mimeType=mt;
      state.rec=new MediaRecorder(state.stream,optsRec);
      state.rec.ondataavailable=onData;
      state.rec.onstop=finalizeClip;
      state.rec.onerror=()=>{state.capturing=false;updateStatus("精彩视频生成失败");};
      state.rec.start(250);
      state.capturing=true;state.startedAt=performance.now();
      clearTimeout(state.stopTimer);state.stopTimer=setTimeout(stopRecording,opts.postMs||POST_MS);
      const fmt=/mp4/i.test(mt)?"MP4":"WebM";
      updateStatus(state.audioTracks.length?`精彩${fmt}生成中...含现场音频`:`精彩${fmt}生成中...音频未接入`);
      return true;
    }catch(e){state.capturing=false;updateStatus("精彩视频生成失败");return false;}
  }
  function stopRecording(){
    try{if(state.rec&&state.rec.state==="recording")state.rec.requestData();}catch(e){}
    try{if(state.rec&&state.rec.state!=="inactive")state.rec.stop();}catch(e){finalizeClip();}
  }
  function finalizeClip(){
    if(!state.capturing&&!state.rec)return;
    state.capturing=false;
    const parts=state.chunks.filter(Boolean);
    if(!parts.length){updateStatus("暂无可保存片段");return;}
    const recType=(state.rec&&state.rec.mimeType)||(parts[0]&&parts[0].type)||mimeType()||"video/webm";
    state.lastBlob=new Blob(parts,{type:recType});
    if(state.lastUrl)URL.revokeObjectURL(state.lastUrl);
    state.lastUrl=URL.createObjectURL(state.lastBlob);
    try{if(state.canvasTrack)state.canvasTrack.stop();}catch(e){}
    state.stream=null;state.rec=null;state.canvasTrack=null;state.audioTracks=[];state.chunks=[];
    updateStatus(statusText());
    try{if(typeof toast==="function")toast(/mp4/i.test(state.lastBlob.type)?"精彩MP4已生成":"精彩视频已生成(WebM)","#7CFC6B");}catch(e){}
    if(state.saveWhenReady){state.saveWhenReady=false;save();}
  }
  function filename(){
    let seed="highlight";try{seed=GAME_SEED||seed;}catch(e){}
    const ext=state.lastBlob&&/mp4/i.test(state.lastBlob.type)?"mp4":"webm";
    return "aiba-"+seed+"-"+Date.now()+"."+ext;
  }
  function save(){
    if(!supported()){try{toast("当前浏览器不支持录制","#ff8d7a");}catch(e){}return false;}
    if(!state.lastBlob){state.saveWhenReady=true;updateStatus("生成完成后自动保存");try{toast("精彩视频还在生成,稍等一下","#ffd23f");}catch(e){}return false;}
    const a=document.createElement("a");a.href=state.lastUrl||URL.createObjectURL(state.lastBlob);a.download=filename();
    document.body.appendChild(a);a.click();a.remove();
    try{toast("精彩视频已保存","#7CFC6B");}catch(e){}
    return true;
  }
  function resultMarkup(){
    if(!supported())return "";
    return `<div class="clipExport"><button id="clipSaveBtn" class="btn sm" onclick="AIBARecorder.save()">🎞 保存MP4视频</button><small id="clipStatus">${wantsMp4()?statusText():"当前浏览器不支持MP4录制,将降级WebM"}</small></div>`;
  }
  global.AIBARecorder=Object.freeze({tick,mark,save,resultMarkup,statusText,supported});
})(window);
