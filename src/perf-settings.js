/* ---------------- perf settings: 玩家可切的性能清单 + 实时 FPS ----------------
   目的:让玩家(尤其 iOS)在真机上逐项开关性能选项,配合实时 FPS/draw call 读数
   自己 A/B 出哪项有效。全部即时生效、存 localStorage。放在主脚本之后加载,
   靠共享全局词法作用域访问 RENDER_QUALITY / renderer / scene / firePts 等。
   注意:iOS 上"Chrome"其实是 WebKit,卡顿主要来自填充率/draw call,这些开关正是冲它去的。 */
(function(global){
  "use strict";

  const LS_KEY="aiba_perf_settings_v1";
  const DEFAULTS={lowRes:false,hideCones:false,crowd:"full",hideParticles:false,fpsMeter:false};
  let S=load();
  function load(){
    try{return Object.assign({},DEFAULTS,JSON.parse(localStorage.getItem(LS_KEY)||"{}"));}
    catch(e){return Object.assign({},DEFAULTS);}
  }
  function save(){try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){}}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

  /* ---------- 分辨率下限:省电时放开自适应降档空间 ---------- */
  let rqOrig=null;
  function applyLowRes(on){
    if(typeof RENDER_QUALITY==="undefined")return;
    const q=RENDER_QUALITY;
    if(!rqOrig)rqOrig={min:q.min,target:q.target,scale:q.scale};
    if(on){
      q.min=Math.min(rqOrig.min,0.6);
      q.target=Math.min(rqOrig.target,0.9);
      q.scale=Math.min(q.scale,0.72);
    }else{
      q.min=rqOrig.min;q.target=rqOrig.target;q.scale=rqOrig.scale;
    }
    if(typeof applyRenderScale==="function")applyRenderScale(true);
  }

  /* ---------- 透明灯光光锥:遍历 indoorRoot 找 ConeGeometry ---------- */
  function coneMeshes(){
    const out=[];
    if(typeof indoorRoot==="undefined"||!indoorRoot.traverse)return out;
    indoorRoot.traverse(o=>{
      if(o.isMesh&&o.geometry&&o.geometry.type==="ConeGeometry")out.push(o);
    });
    return out;
  }
  function applyCones(hide){coneMeshes().forEach(m=>{m.visible=!hide;});}

  /* ---------- 观众密度:全部 / 精简(复用 perf 的 2/5) / 关闭 ---------- */
  function nearPeople(){
    return (typeof nearCourtCrowd!=="undefined"&&nearCourtCrowd&&Array.isArray(nearCourtCrowd.people))?nearCourtCrowd.people:[];
  }
  function applyCrowd(level){
    const arr=nearPeople();
    if(level==="off"){arr.forEach(p=>{if(p&&p.g)p.g.visible=false;});return;}
    if(level==="thin"){
      // 先全显再交给 perf 模块的均匀瘦身逻辑
      arr.forEach(p=>{if(p&&p.g)p.g.visible=true;});
      if(global.AIBAPerf&&global.AIBAPerf.setThin)global.AIBAPerf.setThin(true);
      return;
    }
    arr.forEach(p=>{if(p&&p.g)p.g.visible=true;}); // full
    if(global.AIBAPerf&&global.AIBAPerf.setThin)global.AIBAPerf.setThin(false);
  }

  /* ---------- 火焰轨迹 / 纸屑粒子 ----------
     firePts 常显(靠位置生灭),可直接控 visible;confPts 默认隐藏、由 startConfetti
     触发,所以隐藏时才强制 false,取消隐藏时不主动点亮(交回事件控制)。 */
  function applyParticles(hide){
    if(typeof firePts!=="undefined"&&firePts)firePts.visible=!hide;
    if(hide&&typeof confPts!=="undefined"&&confPts)confPts.visible=false;
  }
  // 隐藏纸屑时,拦住庆祝纸屑重新点亮
  function wrapConfetti(){
    const orig=global.startConfetti;
    if(typeof orig!=="function"||orig.__perfSet)return;
    const fn=function(){
      const r=orig.apply(this,arguments);
      if(S.hideParticles&&typeof confPts!=="undefined"&&confPts)confPts.visible=false;
      return r;
    };
    fn.__perfSet=true;global.startConfetti=fn;
  }

  function applyAll(){
    applyLowRes(S.lowRes);
    applyCones(S.hideCones);
    applyCrowd(S.crowd);
    applyParticles(S.hideParticles);
    updateMeter(S.fpsMeter);
  }

  /* ---------- 实时 FPS / draw call / 分辨率 读数 ---------- */
  let meterEl=null,meterOn=false,acc=0,frames=0,lastT=0,shownFps=0;
  function ensureMeter(){
    if(meterEl)return meterEl;
    meterEl=document.createElement("div");
    meterEl.id="perfMeter";
    meterEl.innerHTML='<b id="pmFps">--</b><span id="pmSub">draw -- · x--</span>';
    document.body.appendChild(meterEl);
    return meterEl;
  }
  function updateMeter(on){
    meterOn=!!on;
    const el=ensureMeter();
    el.classList.toggle("on",meterOn);
    if(meterOn){lastT=performance.now();acc=0;frames=0;}
  }
  function meterTick(now){
    requestAnimationFrame(meterTick);
    if(!meterOn)return;
    frames++;
    acc+=now-(lastT||now);lastT=now;
    if(acc>=500){
      shownFps=Math.round(frames*1000/acc);
      const f=document.getElementById("pmFps");
      if(f){f.textContent=shownFps;f.dataset.tier=shownFps>=50?"good":(shownFps>=35?"ok":"bad");}
      const sub=document.getElementById("pmSub");
      if(sub){
        let calls="--",scale="--";
        try{if(typeof renderer!=="undefined"&&renderer.info)calls=renderer.info.render.calls;}catch(e){}
        try{if(typeof RENDER_QUALITY!=="undefined")scale=(RENDER_QUALITY.scale||1).toFixed(2);}catch(e){}
        sub.textContent="draw "+calls+" · x"+scale;
      }
      acc=0;frames=0;
    }
  }

  /* ---------- 面板 UI ---------- */
  function toggleRow(key,label,desc){
    const on=!!S[key];
    return `<button class="perfRow ${on?"on":""}" type="button" onclick="AIBAPerfToggle('${key}')" aria-pressed="${on}">
      <span class="perfRowMain"><b>${esc(label)}</b><em>${esc(desc)}</em></span>
      <span class="perfSwitch"><i></i></span></button>`;
  }
  function crowdRow(){
    const opts=[["full","全部"],["thin","精简"],["off","关闭"]];
    return `<div class="perfRow perfSeg"><span class="perfRowMain"><b>观众密度</b><em>近场观众是 draw call 大头,关掉最省</em></span>
      <span class="perfSegBtns">${opts.map(o=>`<button type="button" class="${S.crowd===o[0]?"on":""}" onclick="AIBAPerfCrowd('${o[0]}')">${o[1]}</button>`).join("")}</span></div>`;
  }
  function panelMarkup(){
    return `<div class="perfPanel">
      <div class="perfHead"><small>PERFORMANCE LAB</small><h1>性能设置</h1><p>逐项开关,配合右上角 FPS 读数,在你的手机上试出哪项最有效。iOS 卡顿多半来自填充率与 draw call,下面这些正是冲它去的。</p></div>
      ${toggleRow("lowRes","省电分辨率","压低渲染分辨率下限,最直接的提帧手段(画面会略糊)")}
      ${toggleRow("hideCones","关灯光光锥","关掉体育馆透明光柱,iOS 填充率大头")}
      ${crowdRow()}
      ${toggleRow("hideParticles","关火焰/纸屑特效","关掉热手火焰轨迹与庆祝纸屑粒子")}
      ${toggleRow("fpsMeter","显示 FPS 读数","右上角常显 帧率 / draw call / 分辨率倍率")}
      <div class="perfActions">
        <button class="btn sm" type="button" onclick="AIBAPerfReset()">全部恢复默认</button>
        <button class="btn" type="button" onclick="AIBAPerfClose()">完成</button>
      </div>
    </div>`;
  }
  function openPanel(ev){
    if(ev&&ev.stopPropagation)ev.stopPropagation();
    if(typeof global.showPanel!=="function")return;
    global.showPanel(panelMarkup());
    const box=document.getElementById("ovBox");
    if(box)box.classList.add("perfPanelBox");
  }
  function rerender(){
    const p=document.querySelector(".perfPanel");
    if(p)p.outerHTML=panelMarkup();
  }
  function toggle(key){
    S[key]=!S[key];save();applyAll();rerender();
  }
  function setCrowd(level){
    S.crowd=level;save();applyCrowd(level);rerender();
  }
  function reset(){
    S=Object.assign({},DEFAULTS);save();applyAll();rerender();
  }
  function close(){
    const g=(typeof G!=="undefined")?G:null;
    const playing=g&&/^(round|tiebreak|battle|rackrush|pregame)$/.test(g.state);
    if(playing&&typeof global.hidePanel==="function")global.hidePanel();      // 恢复对局
    else if(g&&g.state==="diff"&&typeof global.goDiff==="function")global.goDiff(g.mode,true);
    else if(typeof global.showMenu==="function")global.showMenu();
    else if(typeof global.hidePanel==="function")global.hidePanel();
  }

  /* ---------- 常驻入口按钮 ---------- */
  function mountButton(){
    if(document.getElementById("perfBtn"))return;
    const b=document.createElement("button");
    b.id="perfBtn";b.type="button";b.title="性能设置";b.textContent="⚙";
    const stop=e=>{e.stopPropagation();};
    b.addEventListener("pointerdown",stop);
    b.addEventListener("touchstart",stop,{passive:true});
    b.addEventListener("click",e=>{e.stopPropagation();openPanel(e);});
    document.body.appendChild(b);
  }

  function boot(){
    mountButton();
    wrapConfetti();
    // 场景需已构建;主脚本在本模块前已 boot,直接应用
    applyAll();
    requestAnimationFrame(meterTick);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();

  global.AIBAPerfToggle=toggle;
  global.AIBAPerfCrowd=setCrowd;
  global.AIBAPerfReset=reset;
  global.AIBAPerfClose=close;
  global.AIBAPerfSettings={open:openPanel,get:()=>Object.assign({},S),applyAll,fps:()=>shownFps};
})(window);
