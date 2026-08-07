/* ---------------- shot motion V2 (可完全回退) ----------------
   原版动作全部保留在 index.html 内联脚本中作为兜底；本模块在主脚本之后
   加载，通过覆盖全局函数提供 V2 动作，localStorage `aiba_motion_v2`=off
   或更衣室开关即可完整恢复原版（函数、球的挂点、第一人称手全部还原）。

   V2 内容：
   1) 球贴手：第三人称把球挂到投篮手前臂(肘组)掌心处，蓄力/举球/出手全程跟手。
   2) 第一人称粗糙手掌：原手模隐藏(可还原)，新手掌+手指+手腕 pivot 进入视野，
      蓄力压腕、出手甩腕跟随(follow-through)，有真实投篮感。
   3) 顶点即落：接线 AIBAShotPhysics(v1.52 已实现但未接入)——蓄力过顶后
      人物按时间轴自然下落，落地前自动出手并按严重晚释放/短球惩罚。
   4) 实体篮板：飞行段做线段穿越检测，过力平射被篮板正面弹回(算投失)；
      蓄力接近拉满的超远失误会拉高弧线从篮板上方绕过去，永不穿板。 */
(function(global){
  "use strict";

  const LS_KEY="aiba_motion_v2";
  const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));

  /* ---- 篮板实体参数(与内联 free 阶段碰撞常量一致) ---- */
  const BOARD_Z=-8.5,BOARD_HALF_W=0.98,BOARD_Y_MIN=2.9,BOARD_Y_MAX=4.1;
  const BOUNCE_K=0.42;          // 篮板反弹衰减
  const OVER_ERR=19;            // 过力超过该值 → 高弧绕过篮板上方
  const OVER_TOP={y:4.42,z:-9.05,maxX:1.5};

  let on=true;
  try{on=localStorage.getItem(LS_KEY)!=="off";}catch(e){}
  function save(){try{localStorage.setItem(LS_KEY,on?"on":"off");}catch(e){}}

  /* ================= 第一人称 V2 手掌 ================= */
  const FOLLOW_EXTEND=0.105,BALL_RELEASE_AT=0.092,FOLLOW_HOLD=0.24,FOLLOW_FADE=0.38;
  let fpRig=null,fpHidden=[],followAge=0,followActive=false;
  let guideStart={x:-1.3,z:-0.18,elbowX:-0.68};
  let releasePose={shootX:-1.88,shootZ:0.10,shootElX:-1.28,shootElZ:0};
  let releaseCurve={dip:0,lift:1,rise:1,jmp:1,over:0},lastPoseCurve=releaseCurve,pendingRelease=null;
  const ease01=t=>{t=clampN(t,0,1);return t*t*(3-2*t);};
  const mixN=(a,b,k)=>a+(b-a)*k;
  function buildFpRig(){
    if(fpRig||typeof hands==="undefined"||typeof THREE==="undefined")return;
    // 隐藏原第一人称手模(保留引用以便还原)，球(handBall)除外
    fpHidden=hands.children.filter(c=>c!==handBall&&c.visible!==false);
    fpHidden.forEach(c=>{c.visible=false;});
    const skin=new THREE.MeshLambertMaterial({color:0xf0bd90});
    const sleeve=new THREE.MeshLambertMaterial({color:0x1d428a});
    const rig=new THREE.Group();rig.name="fpHandsV2";
    const mk=(w,h,d,m)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
    const side=(sx,shoot)=>{
      const armRoot=new THREE.Group();                       // 从画面下侧探入
      armRoot.position.set(sx*0.21,-0.26,0.1);
      const fore=mk(0.11,0.11,0.34,sleeve);fore.position.set(0,0,0.1);
      fore.rotation.x=0.5;armRoot.add(fore);
      const wrist=new THREE.Group();wrist.position.set(0,0.06,-0.08); // 手腕 pivot
      const palm=mk(0.2,0.05,0.2,skin);palm.position.set(0,0,-0.05);wrist.add(palm);
      for(let i=0;i<4;i++){                                  // 粗糙四指
        const f=mk(0.038,0.04,0.1,skin);
        f.position.set((i-1.5)*0.048,0.005,-0.19);wrist.add(f);
      }
      const thumb=mk(0.045,0.045,0.1,skin);
      thumb.position.set(sx*0.115,0.01,-0.06);thumb.rotation.y=sx*0.6;wrist.add(thumb);
      armRoot.add(wrist);rig.add(armRoot);
      return {root:armRoot,wrist,shoot};
    };
    fpRig={g:rig,r:side(1,true),l:side(-1,false)};
    hands.add(rig);
  }
  function setFpRigVisible(v){
    if(!fpRig)return;
    fpRig.g.visible=v;
    fpHidden.forEach(c=>{c.visible=!v;});
  }
  function beginFollow(){
    followAge=0;followActive=true;
  }
  function followState(dt){
    if(!followActive)return {active:false,extend:0,follow:0,recover:1,age:followAge};
    followAge+=Math.max(0,Math.min(.08,dt||0));
    const extend=ease01(followAge/FOLLOW_EXTEND);
    const recover=ease01((followAge-FOLLOW_EXTEND-FOLLOW_HOLD)/FOLLOW_FADE);
    const follow=extend*(1-recover);
    if(followAge>=FOLLOW_EXTEND+FOLLOW_HOLD+FOLLOW_FADE){
      followActive=false;
      return {active:false,extend:1,follow:0,recover:1,age:followAge};
    }
    return {active:true,extend,follow,recover,age:followAge};
  }
  function captureGuideStart(o){
    if(!o||!o.arms||!o.elbows)return;
    const guide=o.arms[1],guideEl=o.elbows[1];
    if(guide)guideStart={x:guide.rotation.x,z:guide.rotation.z,elbowX:guideEl?guideEl.rotation.x:-.68};
  }
  function captureReleasePose(o){
    if(!o||!o.arms||!o.elbows)return;
    const shoot=o.arms[0],shootEl=o.elbows[0];
    releasePose={
      shootX:shoot?shoot.rotation.x:-1.88,
      shootZ:shoot?shoot.rotation.z:-0.12,
      shootElX:shootEl?shootEl.rotation.x:-1.28,
      shootElZ:shootEl?shootEl.rotation.z:0
    };
    captureGuideStart(o);
  }
  function captureReleaseCurve(){
    releaseCurve={
      dip:lastPoseCurve.dip||0,lift:lastPoseCurve.lift||0,rise:lastPoseCurve.rise||0,
      jmp:lastPoseCurve.jmp||0,over:lastPoseCurve.over||0
    };
  }
  function visualReleaseCurve(c,state){
    if(!state||!state.active)return c;
    const hold=1-state.recover;
    return Object.assign({},c,{
      dip:mixN(c.dip||0,releaseCurve.dip,hold),
      lift:mixN(c.lift||0,releaseCurve.lift,hold),
      rise:mixN(c.rise||0,releaseCurve.rise,hold)
    });
  }
  function applyShotSetPose(o,c){
    if(!o||!o.arms||!o.elbows||!G.charging)return;
    const k=ease01(((c.lift||0)-0.68)/0.32);
    const planeK=ease01(((c.lift||0)-0.40)/0.45);
    if(k<=0&&planeK<=0)return;
    const shoot=o.arms[0],guide=o.arms[1],shootEl=o.elbows[0],guideEl=o.elbows[1];
    // 举球终点:投篮大臂接近水平、前臂向上,把伸肘动作留到真正松手后。
    if(shoot){
      shoot.rotation.x=mixN(shoot.rotation.x,-1.88,k);
      // 右手肩轴用正 Z 轻微内收，让肩、肘、腕留在同一投篮平面。
      shoot.rotation.y=mixN(shoot.rotation.y,0,planeK);
      shoot.rotation.z=mixN(shoot.rotation.z,0.10,planeK);
    }
    if(shootEl){
      shootEl.rotation.x=mixN(shootEl.rotation.x,-1.28,k);
      shootEl.rotation.y=mixN(shootEl.rotation.y,0,planeK);
      shootEl.rotation.z=mixN(shootEl.rotation.z,0,planeK);
    }
    if(guide){guide.rotation.x=mixN(guide.rotation.x,-1.92,k);guide.rotation.z=mixN(guide.rotation.z,-0.50,k);}
    if(guideEl)guideEl.rotation.x=mixN(guideEl.rotation.x,-1.42,k);
  }
  function applyFollowThroughPose(o,state){
    if(!o||!o.arms||!o.elbows||!state||!state.active)return;
    const shoot=o.arms[0],guide=o.arms[1],shootEl=o.elbows[0],guideEl=o.elbows[1];
    // -2.62rad 约等于整条投篮臂与地面成60°,肘部趋近0表示主动伸直。
    const targetShootX=-2.62,targetShootZ=0.06,targetShootElX=-0.08,targetShootElZ=0;
    const targetGuideX=Math.min(guideStart.x-0.14,-2.06),targetGuideZ=guideStart.z+0.14,targetGuideElX=Math.max(guideStart.elbowX,-0.62);
    const guideBlend=state.recover;
    const baseShootX=shoot?shoot.rotation.x:targetShootX;
    const baseShootZ=shoot?shoot.rotation.z:targetShootZ;
    const baseShootElX=shootEl?shootEl.rotation.x:targetShootElX;
    const baseShootElZ=shootEl?shootEl.rotation.z:targetShootElZ;
    const baseGuideX=guide?guide.rotation.x:guideStart.x;
    const baseGuideZ=guide?guide.rotation.z:guideStart.z;
    const baseGuideElX=guideEl?guideEl.rotation.x:guideStart.elbowX;
    if(shoot){
      if(guideBlend>0){
        shoot.rotation.x=targetShootX+(baseShootX-targetShootX)*guideBlend;
        shoot.rotation.z=targetShootZ+(baseShootZ-targetShootZ)*guideBlend;
      }else{
        shoot.rotation.x=releasePose.shootX+(targetShootX-releasePose.shootX)*state.extend;
        shoot.rotation.z=releasePose.shootZ+(targetShootZ-releasePose.shootZ)*state.extend;
      }
    }
    if(shootEl){
      if(guideBlend>0){
        shootEl.rotation.x=mixN(targetShootElX,baseShootElX,guideBlend);
        shootEl.rotation.z=mixN(targetShootElZ,baseShootElZ,guideBlend);
      }else{
        shootEl.rotation.x=mixN(releasePose.shootElX,targetShootElX,state.extend);
        shootEl.rotation.z=mixN(releasePose.shootElZ,targetShootElZ,state.extend);
      }
      shootEl.rotation.y=0;
    }
    // 辅助手随顶肘自然打开,接近落地后再沿基线逐步收回。
    if(guide){
      if(guideBlend>0){
        guide.rotation.x=mixN(targetGuideX,baseGuideX,guideBlend);
        guide.rotation.z=mixN(targetGuideZ,baseGuideZ,guideBlend);
      }else{
        guide.rotation.x=mixN(guideStart.x,targetGuideX,state.extend);
        guide.rotation.z=mixN(guideStart.z,targetGuideZ,state.extend);
      }
    }
    if(guideEl){
      if(guideBlend>0)guideEl.rotation.x=mixN(targetGuideElX,baseGuideElX,guideBlend);
      else guideEl.rotation.x=mixN(guideStart.elbowX,targetGuideElX,state.extend);
    }
  }
  function animFpRig(c,phys,state){
    if(!fpRig)return;
    const lift=c.lift,jmp=c.jmp;
    // 球在 handBall(0,0.08,-0.12)，掌心托在球底部(半径0.16)
    const cock=0.35+0.4*lift;                    // 蓄力压腕(掌心朝上兜住球)
    const followK=state&&state.active?state.follow:0;
    const snap=followK*1.08;                      // 手腕随伸直-保持-回收阶段平滑跟随
    const r=fpRig.r,l=fpRig.l;
    const stance=shotStanceBlend(c,typeof G!=="undefined"&&(G.canShoot||G.charging));
    r.root.position.set(0.16-0.05*lift,-0.25+0.1*lift+0.05*jmp,-0.1);
    // 辅助手贴到球的侧面,第一人称不再像离球很远的单手投篮。
    l.root.position.set(-0.13+0.125*lift,-0.27+0.12*lift+0.03*jmp,-0.13+0.015*lift);
    r.wrist.rotation.x=cock-snap;
    l.wrist.rotation.x=cock*0.8-followK*0.5;
    l.wrist.rotation.z=0.58-0.2*lift;             // 护球手侧扶球,出手时自然打开
    r.root.rotation.z=-0.08*lift+SHOT_STANCE_YAW*0.2*stance;
    l.root.rotation.z=0.18+0.16*lift;
  }

  /* ================= 第三人称球贴手 ================= */
  let ballAttached=false,pBallHome=null;
  function attachBall(){
    if(ballAttached||typeof player==="undefined"||typeof pBall==="undefined")return;
    if(!pBallHome)pBallHome={parent:pBall.parent,pos:pBall.position.clone()};
    // arms[0]/elbows[0] 是投篮手(x=-0.33)；掌心在肘组局部 y≈-0.335,z≈0.1
    player.elbows[0].add(pBall);
    pBall.position.set(0,-0.43,0.12);
    ballAttached=true;
  }
  function detachBall(){
    if(!ballAttached||!pBallHome)return;
    pBallHome.parent.add(pBall);
    pBall.position.copy(pBallHome.pos);
    ballAttached=false;
  }

  /* ================= updPose V2：顶点即落 ================= */
  const origUpdPose=global.updPose;
  function updPoseV2(dt){
    const s=curShot();
    const ideal=s?weatherAdjustedIdeal(s,false):IDEAL;
    poseK=G.charging?G.power/ideal:Math.max(0,poseK-dt*4.5);
    const base=shotCurves(poseK);
    const tutorialHold=!!(global.AIBAInteractiveTutorial&&
      typeof global.AIBAInteractiveTutorial.isHoldingRelease==="function"&&
      global.AIBAInteractiveTutorial.isHoldingRelease());
    // v1.52 物理:顶点前沿用原曲线,顶点后接管自然下落;落地前自动出手
    const phys=AIBAShotPhysics.update({charging:G.charging,paused:tutorialHold,dt,ideal,rate:playerChargeRate(),curve:base});
    const rawCurve=phys.curve;
    if(G.charging)lastPoseCurve={dip:rawCurve.dip,lift:rawCurve.lift,rise:rawCurve.rise,jmp:rawCurve.jmp,over:rawCurve.over};
    if(phys.apexCue&&G.charging&&!G.apexed){
      G.apexed=true;
      if(navigator.vibrate)navigator.vibrate(12);
      blip(960,0.03,"square",0.045);
    }
    if(phys.autoRelease&&G.charging){doRelease();}
    if(phys.justLanded)landT=0.3;
    if(landT>0)landT-=dt;
    const lk=landT>0?Math.sin((0.3-landT)/0.3*Math.PI):0;
    const follow=followState(dt);
    const c=visualReleaseCurve(rawCurve,follow);
    P.jump=phys.airborne?Math.max(0,rawCurve.jmp*0.55):Math.max(-0.06,rawCurve.jmp*0.55-rawCurve.over*0.28);
    P.eyeDip=-0.26*c.dip-0.09*lk;
    // 第一人称手组整体运动沿用原公式,腕部动作由 rig 叠加
    hands.position.x=-0.05*c.lift;
    hands.position.y=-0.5-0.2*c.dip+0.3*c.lift+0.42*c.jmp;
    hands.position.z=-0.62+0.12*c.dip-0.17*c.jmp;
    const stance=shotStanceBlend(c,G.canShoot||G.charging);
    hands.rotation.x=-0.25*c.lift-0.85*c.jmp+Math.min(c.over,0.35)*1.1;
    hands.rotation.y=SHOT_STANCE_YAW*0.38*stance;
    hands.rotation.z=-0.07*c.lift+SHOT_STANCE_YAW*0.18*stance;
    if(follow.active){
      hands.position.y+=0.14*follow.follow;
      hands.position.z-=0.08*follow.follow;
      hands.rotation.x-=0.12*follow.follow;
    }
    animFpRig(c,phys,follow);
    // 第三人称
    player.g.position.set(P.pos.x,0,P.pos.z);
    player.g.rotation.y=P.face+(P.walking?0:SHOT_STANCE_YAW*stance);
    if(P.walking){
      P.walkT+=dt*9;
      const sw=Math.sin(P.walkT);
      player.g.rotation.x=0;
      player.legs[0].rotation.x=sw*0.7;player.legs[1].rotation.x=-sw*0.7;
      player.knees[0].rotation.x=Math.max(0,-sw*0.5+0.25);player.knees[1].rotation.x=Math.max(0,sw*0.5+0.25);
      player.ankles[0].rotation.x=-sw*0.25;player.ankles[1].rotation.x=sw*0.25;
      player.shoes[0].rotation.x=0;player.shoes[1].rotation.x=0;
      player.arms[0].rotation.x=-sw*0.45;player.arms[1].rotation.x=sw*0.45;
      player.elbows[0].rotation.x=-0.4;player.elbows[1].rotation.x=-0.4;
    }else{
      player.g.position.y=poseGuy(player,c,lk)+P.jump;
      tuneGuideHandPose(player,c,G.canShoot||G.charging);
      applyShotSetPose(player,c);
      applyFollowThroughPose(player,follow);
    }
    // 球挂在投篮手肘组上自动跟手,无需 poseBallPos
    if(!ballAttached)poseBallPos(pBall.position,c);
    if(pendingRelease&&followAge>=BALL_RELEASE_AT)completePendingRelease();
  }

  /* ================= releaseShot V2：晚释放惩罚 + 高弧过板 ================= */
  const chainedReleaseShot=global.releaseShot; // 可能已被 gear.js 包装,保持链
  function completePendingRelease(){
    if(!pendingRelease)return false;
    const p=pendingRelease;pendingRelease=null;
    if(player&&player.g)player.g.updateMatrixWorld(true);
    if(typeof hands!=="undefined"&&hands)hands.updateMatrixWorld(true);
    const r=chainedReleaseShot.call(p.ctx,p.power,p.shot);
    // 蓄力接近拉满的超远过力:抬高弧线从篮板上方绕过去(落到板后,正常算投失)
    const b=(typeof balls!=="undefined")&&balls[balls.length-1];
    if(b&&!b.opp&&!b.silent&&b.outcome==="miss"&&(G.lastErr||0)>=OVER_ERR){
      const xT=clampN(b.p0.x+b.v0.x*b.tf,-OVER_TOP.maxX,OVER_TOP.maxX);
      b.v0.set((xT-b.p0.x)/b.tf,(OVER_TOP.y-b.p0.y)/b.tf+4.9*b.tf,(OVER_TOP.z-b.p0.z)/b.tf);
    }
    return r;
  }
  function releaseShotV2(power,shot){
    if(!on)return chainedReleaseShot.apply(this,arguments);
    if(pendingRelease)return false;
    captureReleasePose(player);
    captureReleaseCurve();
    beginFollow();
    const ideal=weatherAdjustedIdeal(shot,true);
    const adj=AIBAShotPhysics.releasePower(power,ideal); // 下落中出手→明显偏短
    pendingRelease={ctx:this,power:adj,shot};
    G.canShoot=false;
    return true;
  }

  /* ================= updBalls V2：实体篮板(线段穿越) ================= */
  const origUpdBalls=global.updBalls;
  function boardHit(px,py,pz,qx,qy,qz){
    // 从篮板前方(-z 方向)穿越正面平面,且穿越点落在板面矩形内
    if(!(pz>BOARD_Z&&qz<=BOARD_Z))return null;
    const k=(pz-BOARD_Z)/Math.max(1e-6,pz-qz);
    const hx=px+(qx-px)*k,hy=py+(qy-py)*k;
    if(Math.abs(hx)>BOARD_HALF_W||hy<BOARD_Y_MIN||hy>BOARD_Y_MAX)return null;
    return {x:hx,y:hy};
  }
  function updBallsV2(dt){
    if(!on){origUpdBalls(dt);return;}
    const prev=[];
    for(const b of balls){
      if((b.phase==="fly"||b.phase==="free"||b.phase==="fall")&&b.mesh.position.z>-9.4)
        prev.push([b,b.mesh.position.x,b.mesh.position.y,b.mesh.position.z]);
    }
    origUpdBalls(dt);
    for(const [b,px,py,pz] of prev){
      if(!balls.includes(b))continue;
      const p=b.mesh.position;
      const hit=(b.phase==="fly"||b.phase==="free"||b.phase==="fall")&&boardHit(px,py,pz,p.x,p.y,p.z);
      if(!hit)continue;
      if(b.phase==="fly"){
        // 飞行段撞板:结算为投失并从板面弹回
        const t=Math.min(b.t,b.tf);
        const vy=b.v0.y-9.8*t;
        b.phase="free";
        b.vel.set(b.v0.x*0.4,vy*0.5,Math.abs(b.v0.z)*BOUNCE_K);
        if(b.opp)triggerStreetCrowdReaction("oppMiss",0);
        else if(!b.silent){missBall();toast("🧱 篮板拒绝!","#ff8d7a");}
      }else{
        b.vel.z=Math.abs(b.vel.z)*BOUNCE_K;
        b.vel.x*=0.8;
      }
      p.set(hit.x,hit.y,BOARD_Z+0.02);
      if(typeof playerRimHaptic==="function")playerRimHaptic(b);
      sBoard();
    }
  }

  /* ================= 开关 / 兜底恢复 ================= */
  function installMotionHooks(){
    global.updPose=updPoseV2;
    global.releaseShot=releaseShotV2;
    global.updBalls=updBallsV2;
  }
  function restoreLegacyMotion(){
    if(pendingRelease)completePendingRelease();
    setFpRigVisible(false);
    detachBall();
    global.updPose=origUpdPose;
    global.releaseShot=chainedReleaseShot;
    global.updBalls=origUpdBalls;
    if(global.AIBAShotPhysics)AIBAShotPhysics.reset();
    followAge=0;followActive=false;pendingRelease=null;
  }
  function apply(){
    if(on){
      buildFpRig();setFpRigVisible(true);attachBall();
      installMotionHooks();
    }else restoreLegacyMotion();
  }
  function setEnabled(v){
    on=!!v;save();apply();
    if(typeof global.toast==="function")global.toast(on?"已启用新版投篮动作":"已恢复经典投篮动作(兜底)",on?"#7CFC6B":"#ffd23f");
  }
  function toggleMarkup(){
    return `<div class="motionToggle"><span><small>SHOT MOTION</small><b>投篮动作引擎</b><em>新版:球贴手+手腕出手+顶点即落+实体篮板;出问题可随时切回经典兜底。</em></span>
      <button type="button" onclick="AIBAMotionToggle()">${on?"V2 新版 · 点击切回经典":"经典兜底 · 点击启用新版"}</button></div>`;
  }
  function toggle(){
    setEnabled(!on);
    const el=document.querySelector(".motionToggle");
    if(el)el.outerHTML=toggleMarkup();
  }

  global.AIBAMotionToggle=toggle;
  global.AIBAMotion={
    enabled:()=>on,
    setEnabled,toggleMarkup,restoreLegacy:restoreLegacyMotion,
    stats:()=>({on,ballAttached,fpRig:!!fpRig,followAge:+followAge.toFixed(2),followActive,pendingRelease:!!pendingRelease})
  };
  apply();
})(window);
