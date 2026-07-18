(function trailerCapture(global){
  "use strict";

  const params=new URLSearchParams(location.search);
  if(params.get("trailer")!=="1"||!global.AIBA||!global.AIBA.runtime)return;

  document.documentElement.dataset.trailerCapture="true";
  const style=document.createElement("style");
  style.textContent=`
    html[data-trailer-capture="true"],html[data-trailer-capture="true"] body{background:#020307!important;overflow:hidden!important}
    html[data-trailer-capture="true"] canvas{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important}
    html[data-trailer-capture="true"] body>*:not(canvas):not(script):not(style){display:none!important}
    html[data-trailer-capture="true"] body::before,html[data-trailer-capture="true"] body::after{display:none!important}
  `;
  document.head.appendChild(style);

  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
  let recorder=null,recordedChunks=[];

  function forceCaptureQuality(){
    RENDER_QUALITY.locked=true;
    RENDER_QUALITY.min=2.5;
    RENDER_QUALITY.max=2.5;
    RENDER_QUALITY.target=2.5;
    RENDER_QUALITY.scale=2.5;
    RENDER_QUALITY.w=innerWidth;
    RENDER_QUALITY.h=innerHeight;
    applyRenderScale(true);
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
  }

  async function beginRecording(options){
    if(recorder&&recorder.state!=="inactive")throw new Error("Trailer recording already active");
    forceCaptureQuality();
    const opts=options||{},stream=renderer.domElement.captureStream(opts.fps||60);
    const mimeTypes=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
    const mimeType=mimeTypes.find(type=>MediaRecorder.isTypeSupported(type))||"";
    recordedChunks=[];
    recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:opts.bitrate||24000000});
    recorder.ondataavailable=event=>{if(event.data&&event.data.size)recordedChunks.push(event.data);};
    recorder.start(500);
    await wait(120);
    return {width:renderer.domElement.width,height:renderer.domElement.height,mimeType};
  }

  async function endRecording(){
    if(!recorder||recorder.state==="inactive")throw new Error("Trailer recording is not active");
    const current=recorder;
    await new Promise((resolve,reject)=>{
      current.addEventListener("stop",resolve,{once:true});
      current.addEventListener("error",event=>reject(event.error||new Error("MediaRecorder failed")),{once:true});
      current.stop();
    });
    const blob=new Blob(recordedChunks,{type:current.mimeType||"video/webm"});
    const data=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result).split(",")[1]);
      reader.onerror=()=>reject(reader.error);
      reader.readAsDataURL(blob);
    });
    recorder=null;recordedChunks=[];
    return {base64:data,size:blob.size,type:blob.type};
  }

  function legend(id){
    return LEGENDS.find(item=>item.id===id||item.n===id)||LEGENDS[0];
  }

  function clearBalls(){
    while(balls.length){
      const ball=balls.pop();
      if(ball&&ball.mesh)scene.remove(ball.mesh);
    }
  }

  function clearTransient(){
    PAUSE.on=false;
    hidePregameChalk();
    clearBalls();
    G.charging=false;
    G.canShoot=false;
    G.moving=false;
    G.glideCam=false;
    G.cutAway=null;
    G.battleCut=null;
    G.power=0;
    G.apexed=false;
    G.shotIdx=0;
    G.seq=[];
    if(handBall)handBall.visible=false;
    if(pBall)pBall.visible=false;
  }

  function shotFor(kind){
    if(kind==="super")return {deep:0,super:true,rack:null,ball:0,val:10,money:false,p:HALFCOURT.p};
    if(kind==="deep-left")return {deep:0,rack:null,ball:0,val:3,money:false};
    if(kind==="deep-right")return {deep:1,rack:null,ball:0,val:3,money:false};
    if(kind==="money")return {rack:1,deep:null,ball:4,val:2,money:true};
    if(kind==="corner")return {rack:4,deep:null,ball:0,val:1,money:false};
    return {rack:2,deep:null,ball:0,val:1,money:false};
  }

  function setActor(id){
    const star=legend(id);
    G.myStar=star;
    applyStarStyle(player,star);
    return star;
  }

  async function prepare(options){
    const opts=options||{};
    clearTransient();
    G.state="round";
    G.mode=opts.mode||"contest";
    G.practice=false;
    G.running=false;
    G.diff="normal";
    G.tNow=0;
    G.timer=70;
    const sceneName=opts.scene||"indoor";
    const sceneProgress=opts.progress!=null?Number(opts.progress):(sceneName==="flowerCourt"?.92:(sceneName==="beachSunset"?.55:0));
    G.score=Math.round(Math.max(0,Math.min(1,sceneProgress))*40);
    G.streak=0;
    G.cheer=0;
    G.shots=[];
    G.posted=[];
    G.cutQ=[];
    G.stats={best:0,moneyM:0,moneyT:0,deepM:0,deepT:0};
    G.canShoot=true;
    forceCaptureQuality();
    applyScenePreset(sceneName,{silent:true});
    const star=setActor(opts.player||"k24");
    const shot=shotFor(opts.shot||"arc");
    G.seq=[shot];
    G.shotIdx=0;
    const base=shotBase(shot);
    P.pos.copy(base);
    P.face=faceTo(base,HOOP);
    P.walking=false;
    P.jump=0;
    P.eyeDip=0;
    CAM.mode=Math.max(0,Math.min(2,Number(opts.camera)||0));
    applyCamMode();
    setHandBall();
    await wait(sceneProgress>0?850:250);
    for(let i=0;i<3;i++)await nextFrame();
    return {star:star.id||star.n,shot:opts.shot||"arc",camera:CAM.mode};
  }

  function actionActor(){
    return {guy:player,name:G.myStar&&G.myStar.n||"YOU",role:"hero",base:P.pos.clone(),face:P.face};
  }

  async function runAction(options){
    const opts=options||{};
    await prepare({...opts,camera:1});
    const actor=actionActor(),action=opts.action||"wave";
    const seg={start:0,dur:(opts.durationMs||3600)/1000,actor,action,cam:opts.track||"push",side:opts.side||1,seed:opts.seed||1.7,group:false,_justStarted:true};
    PREGAME.actors=[actor];PREGAME.t=0;
    G.state="pregame";G.glideCam=true;G.canShoot=false;
    hands.visible=false;player.g.visible=true;handBall.visible=false;pBall.visible=false;
    PAUSE.on=true;
    await wait(opts.leadMs||450);
    const start=performance.now(),duration=opts.durationMs||3600;
    while(performance.now()-start<duration){
      const elapsed=performance.now()-start,u=clamp(elapsed/duration,0,1),dt=1/60;
      PREGAME.t=elapsed/1000;
      hidePregameChalk();
      pregameAnimate(actor,action,u,seg);
      pregameUpdateCamera(seg,u,dt);
      await nextFrame();
    }
    await wait(opts.tailMs||350);
    PAUSE.on=false;hidePregameChalk();PREGAME.actors=[];
    return status();
  }

  function shotTrackPose(track,u){
    const focus=P.pos.clone().lerp(HOOP,.38);focus.y=1.48+P.jump*.42;
    const toward=HOOP.clone().sub(P.pos);toward.y=0;toward.normalize();
    const side=V3(toward.z,0,-toward.x),back=toward.clone().negate();
    const pos=focus.clone(),look=focus.clone().lerp(HOOP,.28);
    if(track==="low")pos.addScaledVector(back,3.1-u*.65).addScaledVector(side,1.05).setY(.58+u*.25);
    else if(track==="pan")pos.addScaledVector(back,2.85).addScaledVector(side,-2.4+u*4.8).setY(1.45);
    else if(track==="pull")pos.addScaledVector(back,2.2+u*3.7).addScaledVector(side,.8).setY(1.2+u*1.1);
    else if(track==="overhead")pos.addScaledVector(back,1.2+u*.8).addScaledVector(side,1.5).setY(6.2-u*2.8);
    else if(track==="orbit"){
      const a=-.75+u*1.6,r=3.15-u*.4;pos.set(focus.x+Math.cos(a)*r,1.1+u*.9,focus.z+Math.sin(a)*r);
    }else pos.addScaledVector(back,4.5-u*1.8).addScaledVector(side,.75).setY(1.2+u*.7);
    return {pos,look};
  }

  async function driveShotCamera(options,duration){
    const opts=options||{},track=opts.track;
    if(!track)return;
    G.glideCam=true;
    const start=performance.now();
    while(performance.now()-start<duration){
      const u=clamp((performance.now()-start)/duration,0,1);
      if(track==="ball"&&balls[0]){
        const center=balls[0].mesh.position,angle=-.5+u*1.1;
        rig.pos.set(center.x+Math.cos(angle)*2.55,center.y+.55,center.z+Math.sin(angle)*2.55);rig.look.copy(center);
      }else{
        const target=shotTrackPose(track,u);rig.pos.copy(target.pos);rig.look.copy(target.look);
      }
      await nextFrame();
    }
    G.glideCam=false;
  }

  function idealFor(shot){
    let ideal=shotIdeal(shot);
    const legacy=global.AIBA.runtime.service("legacy");
    const weather=legacy&&legacy.getWeather?legacy.getWeather():"clear";
    if(weather==="rain")ideal+=3.5;
    return ideal;
  }

  async function chargeAndRelease(){
    const shot=curShot();
    const ideal=idealFor(shot);
    G.canShoot=true;
    if(!startCharge())throw new Error("Trailer shot could not start charging");
    const deadline=performance.now()+3500;
    while(G.charging&&G.power<ideal&&performance.now()<deadline)await nextFrame();
    if(!G.charging)throw new Error("Trailer charge ended before release");
    doRelease();
  }

  async function bulletOrbit(duration){
    const deadline=performance.now()+2200;
    while((!balls[0]||balls[0].t<0.42)&&performance.now()<deadline)await nextFrame();
    const live=balls[0];
    if(!live)return;
    PAUSE.on=true;
    const start=performance.now();
    while(performance.now()-start<duration){
      const t=(performance.now()-start)/duration;
      const center=live.mesh.position;
      const angle=-0.65+t*1.45;
      rig.pos.set(center.x+Math.cos(angle)*2.1,center.y+0.48,center.z+Math.sin(angle)*2.1);
      rig.look.copy(center);
      await nextFrame();
    }
    PAUSE.on=false;
  }

  async function runShot(options){
    const opts=options||{};
    await prepare(opts);
    await wait(opts.leadMs||550);
    const cameraRun=driveShotCamera(opts,opts.trackMs||4600);
    await chargeAndRelease();
    if(opts.bullet)await bulletOrbit(opts.bulletMs||1000);
    const deadline=performance.now()+(opts.tailMs||2600);
    while(performance.now()<deadline&&(balls.length||P.jump>0.01))await nextFrame();
    await cameraRun;
    await wait(450);
    return status();
  }

  async function runBurst(options){
    const opts=options||{};
    await prepare({...opts,mode:"contest"});
    const template=shotFor(opts.shot||"arc"),count=opts.count||3;
    G.seq=Array.from({length:count},(_,ball)=>({...template,ball}));G.shotIdx=0;
    await wait(opts.leadMs||450);
    const cameraRun=driveShotCamera(opts,opts.trackMs||6200);
    for(let i=0;i<count;i++){
      const readyDeadline=performance.now()+2600;
      while((!G.canShoot||G.charging||G.moving)&&performance.now()<readyDeadline)await nextFrame();
      G.canShoot=true;
      await chargeAndRelease();
      await wait(opts.feedMs||620);
    }
    await cameraRun;
    await wait(opts.tailMs||900);
    return status();
  }

  function status(){
    const legacy=global.AIBA.runtime.service("legacy");
    return {
      ready:true,
      state:G.state,
      camera:CAM.mode,
      balls:balls.length,
      scene:legacy&&legacy.getScenePreset?legacy.getScenePreset():null,
      player:G.myStar&&(G.myStar.id||G.myStar.n)
    };
  }

  global.AIBATrailer=Object.freeze({prepare,runShot,runBurst,runAction,beginRecording,endRecording,status,clear:clearTransient});
})(window);
