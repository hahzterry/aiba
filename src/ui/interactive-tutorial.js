/* Real-court, step-by-step onboarding for touch and local-pose controls. */
(function(global){
  "use strict";

  const state={
    active:false,phase:"idle",guided:0,freeMakes:0,awaitingResult:false,
    holdingSweet:false,releaseArmed:false,releaseAccepted:false,guidedReleaseCompleted:false,
    holdStartedAt:0,releaseHintAt:0,raf:0,saved:Object.create(null),spectators:[]
  };

  const game=()=>{try{return typeof G==="undefined"?null:G;}catch(e){return null;}};
  const vision=()=>{try{return typeof VISION==="undefined"?null:VISION;}catch(e){return null;}};
  const byId=id=>document.getElementById(id);
  const call=(name,...args)=>typeof global[name]==="function"?global[name](...args):undefined;

  function shotList(){
    const rack=typeof RACKS!=="undefined"&&RACKS[1]?RACKS[1]:null;
    if(!rack)return [];
    return Array.from({length:80},(_,i)=>({
      rack:1,ball:i%5,val:3,baseVal:3,money:false,deep:null,p:rack.p,label:"左侧 45°"
    }));
  }

  function idealPower(){
    try{
      if(typeof weatherAdjustedIdeal==="function"&&typeof curShot==="function")return weatherAdjustedIdeal(curShot(),false);
      if(typeof shotIdeal==="function"&&typeof curShot==="function")return shotIdeal(curShot());
    }catch(e){}
    return 74;
  }

  function saveVisibility(object){
    if(!object||state.spectators.some(item=>item.object===object))return;
    state.spectators.push({object,visible:object.visible});
    object.visible=false;
  }

  function hideSpectators(){
    try{
      if(typeof crowd!=="undefined"&&crowd.groups)crowd.groups.forEach(group=>{
        saveVisibility(group.body);saveVisibility(group.head);
      });
      if(typeof nearCourtCrowd!=="undefined")saveVisibility(nearCourtCrowd.root);
      if(typeof streetCrowd!=="undefined")saveVisibility(streetCrowd.root);
      if(typeof showCrew!=="undefined")showCrew.forEach(member=>saveVisibility(member.g));
    }catch(e){}
  }

  function restoreSpectators(){
    state.spectators.forEach(item=>{if(item.object)item.object.visible=item.visible;});
    state.spectators.length=0;
  }

  function replace(name,factory){
    if(state.saved[name]||typeof global[name]!=="function")return;
    state.saved[name]=global[name];
    global[name]=factory(state.saved[name]);
  }

  function result(made){
    if(!state.active||!state.awaitingResult)return;
    state.awaitingResult=false;
    const guided=state.phase==="guidedFlight";
    const free=state.phase==="freeFlight";
    if(guided){
      if(!state.guidedReleaseCompleted)return;
      state.guidedReleaseCompleted=false;
      state.guided++;
      state.holdingSweet=false;
      state.releaseArmed=false;
      state.releaseAccepted=false;
      if(state.guided>=2){
        state.phase="freeReady";
        call("toast","跟练完成。现在自己投进 3 球!","#7CFC6B");
      }else{
        state.phase="guidedReady";
        call("toast",made?"命中。再跟练一次!":"没关系，再按步骤完成一次。",made?"#7CFC6B":"#ffd23f");
      }
      return;
    }
    if(free){
      if(made)state.freeMakes++;
      if(state.freeMakes>=3){
        state.phase="complete";
        const g=game();if(g)g.canShoot=false;
        setTimeout(complete,650);
      }else{
        state.phase="freeReady";
        call("toast",made?"命中! 还差 "+(3-state.freeMakes)+" 球":"调整节奏，继续。",made?"#7CFC6B":"#ffd23f");
      }
    }
  }

  function installWrappers(){
    replace("playerChargeRate",original=>function(){
      return state.active&&state.holdingSweet?0:original.apply(this,arguments);
    });
    replace("startCharge",original=>function(){
      if(!state.active)return original.apply(this,arguments);
      if(state.phase!=="guidedReady"&&state.phase!=="freeReady")return false;
      const started=original.apply(this,arguments);
      if(started){
        state.holdingSweet=false;
        state.releaseArmed=false;
        state.releaseAccepted=false;
        state.guidedReleaseCompleted=false;
        state.holdStartedAt=0;
        state.phase=state.guided<2?"guidedCharge":"freeCharge";
      }
      return started;
    });
    replace("doRelease",original=>function(){
      if(!state.active)return original.apply(this,arguments);
      const g=game();
      if(!g||!g.charging)return original.apply(this,arguments);
      if(state.phase==="guidedCharge")return false;
      if(state.phase==="guidedHold"){
        if(!state.releaseAccepted)return false;
        state.releaseAccepted=false;state.guidedReleaseCompleted=true;
        state.phase="guidedFlight";state.awaitingResult=true;state.holdingSweet=false;
      }else if(state.phase==="freeCharge"){
        state.phase="freeFlight";state.awaitingResult=true;
      }else return false;
      return original.apply(this,arguments);
    });
    replace("madeBall",original=>function(ball){
      const value=original.apply(this,arguments);result(true);return value;
    });
    replace("missBall",original=>function(){
      const value=original.apply(this,arguments);result(false);return value;
    });
    ["updCrowd","updBackcourtShow","updNearCourtCrowd","updStreetCrowd"].forEach(name=>{
      replace(name,original=>function(){if(!state.active)return original.apply(this,arguments);});
    });
    ["triggerStreetCrowdReaction","triggerNearCourtCrowdReaction","crowdSwell","cheerSound"].forEach(name=>{
      replace(name,original=>function(){if(!state.active)return original.apply(this,arguments);});
    });
    replace("extPlay",original=>function(key){
      if(state.active&&/^crowd/i.test(String(key||"")))return;
      return original.apply(this,arguments);
    });
  }

  function restoreWrappers(){
    Object.keys(state.saved).forEach(name=>{global[name]=state.saved[name];});
    state.saved=Object.create(null);
  }

  function clearLiveBallObjects(){
    try{
      if(typeof passing!=="undefined"&&passing){scene.remove(passing.mesh);passing=null;}
      if(typeof balls!=="undefined"){
        balls.slice().forEach(ball=>{scene.remove(ball.mesh);scene.remove(ball.blob);});
        balls.length=0;
      }
      if(typeof walk!=="undefined")walk=null;
    }catch(e){}
  }

  function mountCoach(){
    let el=byId("itCoach");
    if(!el){
      el=document.createElement("section");
      el.id="itCoach";
      el.setAttribute("aria-live","polite");
      el.innerHTML=
        '<div class="itTop"><small id="itStage"></small><button id="itExit" type="button" title="结束教学">×</button></div>'+
        '<div class="itProgress"><i id="itP1"></i><i id="itP2"></i><i id="itP3"></i></div>'+
        '<h2 id="itTitle"></h2><p id="itBody"></p>'+
        '<div class="itActions"><button id="itRestart" type="button">↻ 重头演示</button><button id="itCue" type="button">动作提示</button></div>';
      document.body.appendChild(el);
      byId("itRestart").onclick=restart;
      byId("itCue").onclick=()=>call("toast",cue().body,"#70e8ff");
      byId("itExit").onclick=()=>finish(true);
    }
  }

  function cue(){
    const g=game(),ready=g&&g.canShoot;
    switch(state.phase){
      case "guidedReady":return {stage:"跟练 "+(state.guided+1)+" / 2",title:ready?"双手放入下方蓄力框":"接球准备",body:ready?"双手保持在白线下方。甜点暂停后，任意一只手越过白线即可出手。":"等篮球传到手中，保持身体完整入画。"};
      case "guidedCharge":return {stage:"跟练 "+(state.guided+1)+" / 2",title:"保持低位蓄力",body:"双手保持在白线下方。力量到绿色甜点后会暂停。"};
      case "guidedHold":return state.releaseArmed?
        {stage:"甜点已锁定",title:"任意一只手越线出手",body:"任意一只手快速越过白线，即可完成这次投篮动作。"}:
        {stage:"甜点已暂停",title:"双手先保持在白线下",body:"识别锁定后，任意一只手抬起越过白线即可出手。"};
      case "guidedFlight":return {stage:"跟练 "+(state.guided+1)+" / 2",title:"完整动作已完成",body:"这次不要求命中。等待球结果后继续下一次。"};
      case "freeReady":return {stage:"自主命中 "+state.freeMakes+" / 3",title:ready?"轮到你自己投":"接球准备",body:ready?"这次不暂停力量条。按刚才的节奏，连续投进 3 球。":"准备下一球。"};
      case "freeCharge":return {stage:"自主命中 "+state.freeMakes+" / 3",title:"自己判断甜点",body:"观察绿色甜区，在最顺手的时机出手。"};
      case "freeFlight":return {stage:"自主命中 "+state.freeMakes+" / 3",title:"等待结果",body:"命中才计入毕业进度。"};
      case "complete":return {stage:"训练完成",title:"教学完成",body:"你已经独立命中 3 球。"};
      default:return {stage:"正在准备",title:"进入真实球场",body:"球员和摄像头正在就位。"};
    }
  }

  function renderCoach(){
    const data=cue();
    const stage=byId("itStage"),title=byId("itTitle"),body=byId("itBody");
    if(stage)stage.textContent=data.stage;
    if(title)title.textContent=data.title;
    if(body)body.textContent=data.body;
    const guided=Math.min(2,state.guided)+(state.phase.startsWith("guided")?1:0);
    const p1=byId("itP1"),p2=byId("itP2"),p3=byId("itP3");
    if(p1)p1.className=guided>1?"ok":(guided===1?"on":"");
    if(p2)p2.className=state.guided>=2?"ok":(guided===2?"on":"");
    if(p3)p3.className=state.phase.startsWith("free")||state.phase==="complete"?(state.phase==="complete"?"ok":"on"):"";
  }

  function syncPreview(){
    const preview=byId("visionPreview");
    if(!preview)return;
    preview.dataset.context="game";
    preview.dataset.tutorial="court";
    try{if(typeof visionUpdatePreviewDock==="function")visionUpdatePreviewDock(performance.now());}catch(e){}
    preview.dataset.dock="right-low";
    document.documentElement.dataset.tutorialCameraSide="right";
    preview.style.display="block";
  }

  function tick(){
    if(!state.active)return;
    state.raf=requestAnimationFrame(tick);
    hideSpectators();syncPreview();
    const g=game();
    if(g&&state.phase==="guidedCharge"&&g.charging&&g.power>=idealPower()){
      g.power=idealPower();state.holdingSweet=true;state.releaseArmed=false;
      state.releaseAccepted=false;state.holdStartedAt=performance.now();state.phase="guidedHold";
      const fill=byId("pFill");if(fill)fill.style.height=Math.round(g.power)+"%";
      call("toast","甜点已暂停。双手保持在白线下!","#7CFC6B");
    }
    updateReleaseGate();
    renderCoach();
  }

  function updateReleaseGate(){
    if(state.phase!=="guidedHold"||state.releaseArmed)return;
    const v=vision(),sample=v&&v.lastSample;
    if(!sample||!sample.hasHands||performance.now()-state.holdStartedAt<120)return;
    const lift=sample.liftY,line=sample.releaseLineY;
    if(!Number.isFinite(lift)||!Number.isFinite(line)||lift<=line+.025)return;
    state.releaseArmed=true;
    call("toast","已锁定。任意一只手越过白线即可出手!","#ffd23f");
  }

  function acceptVisionRelease(step){
    if(!state.active)return true;
    if(state.phase==="freeCharge")return true;
    if(state.phase!=="guidedHold"||!state.holdingSweet||!state.releaseArmed||step&&step.auto){
      const now=performance.now();
      if(now-state.releaseHintAt>900){
        state.releaseHintAt=now;
        call("toast",state.phase==="guidedHold"?"双手先回到白线下，再用任意一只手越线出手":"等甜点暂停后，任意一只手越线出手","#ffd23f");
      }
      return false;
    }
    state.releaseAccepted=true;
    return true;
  }

  function setupGame(){
    const g=game();if(!g||typeof RACKS==="undefined"||!RACKS[1])return false;
    ["obWelcome","vtIntro","vtOverlay"].forEach(id=>{const el=byId(id);if(el)el.remove();});
    call("hidePanel");call("ensureAudio",false,true);call("music",false);
    if(typeof clearLiveObjectsForMenu==="function")clearLiveObjectsForMenu({preserveVision:true});
    clearLiveBallObjects();
    if(typeof resetProgressiveSceneForRun==="function")resetProgressiveSceneForRun();
    if(typeof resetAudioCueMemory==="function")resetAudioCueMemory();
    if(typeof resetRackBalls==="function")resetRackBalls();

    state.active=true;state.phase="guidedReady";state.guided=0;state.freeMakes=0;
    state.awaitingResult=false;state.holdingSweet=false;state.releaseArmed=false;
    state.releaseAccepted=false;state.guidedReleaseCompleted=false;state.holdStartedAt=0;state.releaseHintAt=0;
    document.documentElement.dataset.interactiveTutorial="1";
    installWrappers();hideSpectators();mountCoach();

    g.mode="contest";g.diff=(typeof DIFFS!=="undefined"&&DIFFS[g.diff])?g.diff:"normal";
    g.practice=true;g.tutorial=true;g.interactiveTutorial=true;g.seq=shotList();g.shotIdx=0;
    g.shots=[];g.score=0;g.streak=0;g.timer=0;g.running=false;g.buzzed=false;
    g.canShoot=false;g.charging=false;g.power=0;g.moving=false;g.glideCam=false;
    g.cutAway=null;g.battleCut=null;g.blindToasted=false;g.cutQ=[];

    if(typeof CAM!=="undefined")CAM.mode=1;
    const camBtn=byId("camBtn");if(camBtn&&typeof CAM!=="undefined"&&global.AIBASetIcon)global.AIBASetIcon(camBtn,"camera",CAM.names[1]);
    P.pos.copy(RACKS[1].p);P.face=faceTo(RACKS[1].p,HOOP);P.walking=false;P.jump=0;P.eyeDip=0;
    if(typeof rivals!=="undefined")rivals.forEach(rival=>{rival.active=false;rival.g.visible=false;});
    g.state="round";
    const hud=byId("hud");if(hud)hud.style.display="block";
    const round=byId("hudRound");if(round)round.innerHTML="互动教学";
    if(typeof applyCamMode==="function")applyCamMode();
    try{camSnap=true;}catch(e){}
    syncPreview();
    setTimeout(()=>{if(state.active&&typeof readyBall==="function")readyBall();},220);
    cancelAnimationFrame(state.raf);state.raf=requestAnimationFrame(tick);
    return true;
  }

  function start(options){
    options=options||{};
    if(state.active){restart();return true;}
    const v=vision();
    if(!options.demo&&(!v||!v.enabled)){
      if(v&&v.loading){setTimeout(()=>start(options),300);return false;}
      if(typeof global.enableVisionControl==="function"){
        const pending=global.enableVisionControl(options.event);
        if(pending&&typeof pending.then==="function"){
          call("toast","正在启动摄像头和本地体感识别...","#70e8ff");
          Promise.resolve(pending).then(()=>{
            const ready=vision();
            if(!state.active&&ready&&ready.enabled)setupGame();
          }).catch(()=>{});
        }
      }
      return false;
    }
    return setupGame();
  }

  function restart(){
    if(!state.active)return start();
    clearLiveBallObjects();
    state.phase="guidedReady";state.guided=0;state.freeMakes=0;state.awaitingResult=false;
    state.holdingSweet=false;state.releaseArmed=false;state.releaseAccepted=false;
    state.guidedReleaseCompleted=false;state.holdStartedAt=0;state.releaseHintAt=0;
    const g=game();if(!g)return;
    g.seq=shotList();g.shotIdx=0;g.canShoot=false;g.charging=false;g.power=0;g.buzzed=false;
    P.pos.copy(RACKS[1].p);P.face=faceTo(RACKS[1].p,HOOP);P.walking=false;P.jump=0;P.eyeDip=0;
    if(typeof resetRackBalls==="function")resetRackBalls();
    if(typeof applyCamMode==="function")applyCamMode();
    setTimeout(()=>{if(state.active&&typeof readyBall==="function")readyBall();},180);
    call("toast","教学已从第一步重新开始","#70e8ff");
  }

  function stopTutorialVision(){
    if(typeof global.suspendVisionControl==="function")global.suspendVisionControl();
    else{
      const v=vision();
      if(v&&v.stream)v.stream.getTracks().forEach(track=>track.stop());
      const video=byId("visionVideo");if(video)video.srcObject=null;
    }
  }

  function teardown(options){
    options=options||{};
    cancelAnimationFrame(state.raf);state.raf=0;
    const g=game();if(g){g.interactiveTutorial=false;g.tutorial=false;g.practice=false;g.canShoot=false;g.charging=false;}
    state.active=false;state.holdingSweet=false;state.releaseArmed=false;state.releaseAccepted=false;state.awaitingResult=false;
    delete document.documentElement.dataset.interactiveTutorial;
    delete document.documentElement.dataset.tutorialCameraSide;
    const coach=byId("itCoach");if(coach)coach.remove();
    const preview=byId("visionPreview");if(preview){delete preview.dataset.tutorial;preview.style.display="none";}
    restoreWrappers();restoreSpectators();
    if(options.stopVision)stopTutorialVision();
  }

  function returnHome(){
    clearLiveBallObjects();
    if(typeof clearLiveObjectsForMenu==="function")clearLiveObjectsForMenu();
    if(typeof showMenu==="function")showMenu();else location.reload();
  }

  function complete(){
    if(!state.active)return;
    teardown({stopVision:true});
    call("showPanel",'<h1 class="title">教学完成</h1><div class="card"><b style="color:#7CFC6B">跟练 2 次 + 自主命中 3 球</b><br>你已经掌握双手锁定、蓄力甜点和越线出手。</div><button class="btn gold" id="itHome">返回首页</button><button class="btn green" id="itAgain">再练一次</button>');
    setTimeout(()=>{
      const home=byId("itHome"),again=byId("itAgain");
      if(home)home.onclick=returnHome;
      if(again)again.onclick=()=>{call("hidePanel");start();};
    },0);
  }

  function finish(returnToMenu){
    if(!state.active)return;
    teardown({stopVision:true});
    if(returnToMenu)returnHome();
  }

  global.AIBAInteractiveTutorial={
    prefersCourtTutorial:true,start,restart,finish,isActive:()=>state.active,
    isHoldingRelease:()=>state.active&&state.phase==="guidedHold"&&state.holdingSweet,
    acceptVisionRelease,
    state:()=>({phase:state.phase,guided:state.guided,freeMakes:state.freeMakes,releaseArmed:state.releaseArmed})
  };
})(window);
