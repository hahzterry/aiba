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
    G.mode="contest";
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

  function idealFor(shot){
    let ideal=shotIdeal(shot);
    const legacy=global.AIBA.runtime.service("legacy");
    const weather=legacy&&legacy.getWeather?legacy.getWeather():"clear";
    if(weather==="rain")ideal+=3.5;
    return ideal;
  }

  async function chargeAndRelease(){
    const shot=G.seq[0];
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
    await chargeAndRelease();
    if(opts.bullet)await bulletOrbit(opts.bulletMs||1000);
    const deadline=performance.now()+(opts.tailMs||2600);
    while(performance.now()<deadline&&(balls.length||P.jump>0.01))await nextFrame();
    await wait(450);
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

  global.AIBATrailer=Object.freeze({prepare,runShot,status,clear:clearTransient});
})(window);
