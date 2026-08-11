/* Motion Control "Shadow Shot Rehearsal" Interactive Tutorial
   - First time opening motion control: show intro card (privacy notice + action preview), request camera only after confirmation
   - After authorization and before playing: full‑screen camera preview, use real gestures to complete four steps:
       hands in frame → lock → raise to charge → cross line to release, complete 2 valid shots to graduate
   - Fallback during actual game: if gesture not started within 8 seconds, show large text hint (once only)
   No changes to recognition layer: only subscribe to VISION.machine state to render tutorial UI. */
(function(global){
  "use strict";
  const KEY="aiba_vision_tut_v1";
  const GG=()=>{try{return typeof G==="undefined"?null:G;}catch(e){return null;}};
  const VV=()=>{try{return typeof VISION==="undefined"?null:VISION;}catch(e){return null;}};
  let seen={};
  try{seen=JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch(e){}
  function mark(k){seen[k]=1;try{localStorage.setItem(KEY,JSON.stringify(seen));}catch(e){}}

  let overlay=null,raf=0,stepIdx=0,reps=0,lastPhase="idle",stepEnterAt=0,startAt=0,closed=false;
  const STEPS=[
    {t:"Put both hands in the blue box below",tip:"Whole upper body in frame, hands naturally placed below chest area"},
    {t:"Stay still · Locking",tip:"Hold steady for half a second, when lock ring fills, start charging"},
    {t:"Raise like shooting to charge",tip:"Raise both hands evenly, power bar rises"},
    {t:"Hands cross the white line — release!",tip:"Release as you cross the line · Power between 55‑90% counts as a good shot"}
  ];

  /* ---------- Intro card (before authorization) ---------- */
  const origEnable=global.enableVisionControl;
  global.enableVisionControl=function(ev){
    if(!seen.intro&&typeof origEnable==="function"){
      showIntro(ev);
      return;
    }
    return typeof origEnable==="function"?origEnable(ev):undefined;
  };
  function showIntro(ev){
    if(document.getElementById("vtIntro"))return;
    const el=document.createElement("div");
    el.id="vtIntro";
    el.innerHTML='<div class="obCard">'+
      "<small>MOTION CONTROL</small><h1>🎥 Shoot with your body</h1>"+
      '<div class="obSteps"><span><b>1</b><i>🙌</i>Hands in frame, lock</span><span><b>2</b><i>💪</i>Raise to charge</span><span><b>3</b><i>🏀</i>Cross line to release</span></div>'+
      '<p class="vtPriv">🔒 Camera feed is processed locally for pose recognition, not uploaded or stored.</p>'+
      '<button class="obBtn gold" id="vtGo">Turn on camera, step onto the court</button>'+
      '<button class="obBtn" id="vtNo">Use touch screen instead</button></div>';
    document.body.appendChild(el);
    document.getElementById("vtGo").onclick=()=>{
      mark("intro");el.remove();
      try{
        const enabled=typeof origEnable==="function"?origEnable(ev):null;
        Promise.resolve(enabled).then(()=>{
          const V=VV();
          if(V&&V.enabled&&global.AIBAInteractiveTutorial)global.AIBAInteractiveTutorial.start({skipVisionIntro:true});
        });
      }catch(e){}
    };
    document.getElementById("vtNo").onclick=()=>{el.remove();};
  }

  /* ---------- Shadow rehearsal ---------- */
  function start(force){
    if(overlay)return;
    if(!force&&seen.done)return;
    if(typeof global.hidePanel==="function"&&force)try{hidePanel();}catch(e){}
    closed=false;stepIdx=0;reps=0;lastPhase="idle";startAt=Date.now();stepEnterAt=Date.now();
    overlay=document.createElement("div");
    overlay.id="vtOverlay";
    overlay.innerHTML=
      '<div class="vtHead"><span>Shadow Shot Rehearsal · SHADOW SHOT</span><button id="vtSkip" type="button">Skip >></button></div>'+
      '<div class="vtStepsBar">'+STEPS.map((s,i)=>'<i id="vtS'+i+'"></i>').join("")+"</div>"+
      '<canvas id="vtCanvas"></canvas>'+
      '<div class="vtPower"><i id="vtPowerFill"></i><em></em></div>'+
      '<div class="vtStatus"><b id="vtTitle"></b><span id="vtTip"></span><span id="vtReps"></span></div>';
    document.body.appendChild(overlay);
    document.getElementById("vtSkip").onclick=()=>finish(false);
    loop();
  }
  function finish(completed){
    closed=true;cancelAnimationFrame(raf);
    if(!overlay)return;
    if(completed){
      overlay.innerHTML='<div class="obCard"><small>REHEARSAL CLEAR</small><h1>🎉 You\'re ready!</h1>'+
        "<p class='vtPriv'>You've mastered the moves. This is exactly the routine on the court.</p>"+
        '<button class="obBtn gold" id="vtDone">Let\'s play!</button></div>';
      document.getElementById("vtDone").onclick=()=>{overlay.remove();overlay=null;};
    }else{overlay.remove();overlay=null;}
    mark("done");
  }
  function setStep(i){
    if(i!==stepIdx)stepEnterAt=Date.now();
    stepIdx=i;
  }
  function loop(){
    if(closed||!overlay)return;
    raf=requestAnimationFrame(loop);
    const V=VV(),m=V&&V.machine;
    const video=document.getElementById("visionVideo");
    const cv=document.getElementById("vtCanvas");
    if(!m||!cv)return;
    // ---- Draw mirrored video + skeleton + guide zones ----
    const ctx=cv.getContext("2d");
    const W=cv.width=cv.clientWidth*(devicePixelRatio||1);
    const H=cv.height=cv.clientHeight*(devicePixelRatio||1);
    ctx.clearRect(0,0,W,H);
    ctx.save();ctx.scale(-1,1);ctx.translate(-W,0);
    if(video&&video.videoWidth){
      const vr=video.videoWidth/video.videoHeight,cr=W/H;
      let dw=W,dh=H,dx=0,dy=0;
      if(vr>cr){dh=H;dw=H*vr;dx=(W-dw)/2;}else{dw=W;dh=W/vr;dy=(H-dh)/2;}
      ctx.drawImage(video,dx,dy,dw,dh);
      const skel=document.getElementById("visionCanvas");
      if(skel&&skel.width)ctx.drawImage(skel,dx,dy,dw,dh);
    }
    ctx.restore();
    // Charging box (bottom)
    const armed=m.phase==="armed"||m.phase==="charging";
    ctx.strokeStyle=armed?"#7CFC6B":"#70e8ff";
    ctx.setLineDash(armed?[]:[12,9]);ctx.lineWidth=4;
    ctx.strokeRect(W*0.08,H*0.6,W*0.84,H*0.32);
    // Release line (top)
    const lineY=(m.releaseLineY||0.32)*H;
    ctx.strokeStyle=m.phase==="charging"?"#fff":"rgba(255,255,255,0.55)";
    ctx.setLineDash(m.phase==="charging"?[]:[14,10]);ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(0,lineY);ctx.lineTo(W,lineY);ctx.stroke();
    ctx.setLineDash([]);
    // ---- State machine → step progression ----
    const phase=m.phase;
    if(phase==="armed"&&stepIdx<1)setStep(1);
    if(phase==="charging"&&stepIdx<2)setStep(2);
    if(phase==="charging"&&(m.power||0)>18&&stepIdx<3)setStep(3);
    if(phase==="release"&&lastPhase!=="release"){
      const p=m.power||0;
      if(p>=55&&p<=92){reps++;flashMsg("✅ Good shot! Power "+Math.round(p)+"%");}
      else flashMsg("Try again · Power "+Math.round(p)+"%, keep it between 55‑90% before crossing");
      if(reps>=2){finish(true);return;}
      setStep(0);
    }
    if((phase==="idle"||phase==="cooldown")&&stepIdx>0&&lastPhase!=="release"&&phase!==lastPhase)setStep(0);
    lastPhase=phase;
    // ---- UI labels ----
    const title=document.getElementById("vtTitle"),tipEl=document.getElementById("vtTip"),repsEl=document.getElementById("vtReps");
    if(title)title.textContent=STEPS[stepIdx].t;
    if(tipEl&&!tipEl.dataset.flash)tipEl.textContent=STEPS[stepIdx].tip;
    if(repsEl)repsEl.textContent="Valid shots "+reps+" / 2";
    STEPS.forEach((s,i)=>{
      const dot=document.getElementById("vtS"+i);
      if(dot)dot.className=i<stepIdx?"ok":(i===stepIdx?"cur":"");
    });
    const fill=document.getElementById("vtPowerFill");
    if(fill)fill.style.width=(phase==="charging"?Math.min(100,m.power||0):0)+"%";
    // ---- Stuck hint / timeout fallback ----
    const stuck=Date.now()-stepEnterAt;
    if(stuck>20000&&tipEl&&!tipEl.dataset.flash){
      tipEl.textContent=stepIdx===0?"Step back a little, let your whole upper body be in frame":STEPS[stepIdx].tip+" (You can slow down)";
    }
    if(Date.now()-startAt>60000){
      finish(false);
      if(typeof global.toast==="function")toast("You can re‑enable motion control on the difficulty page anytime. Use touch to warm up for now.","#9fd1ff");
    }
  }
  let flashTimer=0;
  function flashMsg(text){
    const tipEl=document.getElementById("vtTip");
    if(!tipEl)return;
    tipEl.textContent=text;tipEl.dataset.flash="1";
    clearTimeout(flashTimer);
    flashTimer=setTimeout(()=>{delete tipEl.dataset.flash;},1600);
  }

  /* ---------- Trigger: auto‑start rehearsal after authorization (only during setup phase) ---------- */
  let coachShownAt=0;
  setInterval(()=>{
    const V=VV(),G=GG();
    if(global.AIBAInteractiveTutorial&&global.AIBAInteractiveTutorial.prefersCourtTutorial)return;
    if(!V||!G)return;
    if(V.enabled&&!seen.done&&!overlay&&(G.state==="diff"||G.state==="menu")){
      const p=document.getElementById("visionPreview");
      if(p&&p.offsetWidth>4)start();
    }
    // In‑game fallback: if gesture hasn't started within 8 seconds, show large hint once
    if(!seen.coach&&V.enabled&&V.liveControl&&G.canShoot&&/^(round|tiebreak|battle|rackrush)$/.test(G.state)){
      if(!coachShownAt)coachShownAt=Date.now();
      const idle=V.machine&&(V.machine.phase==="idle");
      if(idle&&Date.now()-coachShownAt>8000){
        mark("coach");
        if(typeof global.toast==="function")toast("🙌 Put both hands in the blue box below the preview window to start motion control release","#ffd23f");
      }
      if(!idle)mark("coach");
    }
  },400);

  global.AIBAVisionTutorial={start:function(force){
    if(global.AIBAInteractiveTutorial&&global.AIBAInteractiveTutorial.prefersCourtTutorial){
      return global.AIBAInteractiveTutorial.start({force:!!force});
    }
    return start(force);
  }};
})(window);