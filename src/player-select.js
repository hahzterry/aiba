(function(global){
  "use strict";

  const STORAGE_KEY="aiba_selected_star_v1";
  const RANDOM_LABEL="Random Starter";
  let activeMode="contest";
  let pendingId="";

  function esc(v){
    return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function starKey(star){return star&&(star.id||star.n)||"";}
  function allStars(list){
    const custom=global.AIBACustomizer&&typeof global.AIBACustomizer.listStars==="function"?global.AIBACustomizer.listStars():[];
    if(Array.isArray(list)&&list.length)return [...list,...custom.filter(star=>!list.some(item=>starKey(item)===starKey(star)))];
    const cfg=global.AIBA_CONFIG||{},assets=global.AIBA_ASSETS||{};
    return [...(cfg.CLASSIC_LEGENDS||[]),...(assets.coverStars||[]),...custom];
  }
  function profileFor(star){
    const cfg=global.AIBA_CONFIG||{};
    return cfg.shotProfileFor?cfg.shotProfileFor(star):((cfg.SHOT_PROFILES||{})[starKey(star)]||cfg.DEFAULT_SHOT_PROFILE||{speed:1,window:1,label:"Standard Release",arcLabel:"Standard Arc"});
  }
  function selectedId(){
    try{return localStorage.getItem(STORAGE_KEY)||"";}catch(e){return "";}
  }
  function saveSelectedId(id){
    try{
      if(id)localStorage.setItem(STORAGE_KEY,id);
      else localStorage.removeItem(STORAGE_KEY);
    }catch(e){}
  }
  function findStar(list,id){
    if(!id)return null;
    return allStars(list).find(star=>starKey(star)===id)||null;
  }
  function selectedStar(list,fallback){
    return findStar(list,selectedId())||fallback||null;
  }
  function setMode(mode){
    if(mode==="battle"||mode==="rackrush"||mode==="contest")activeMode=mode;
  }
  function modeArg(){
    return JSON.stringify(activeMode).replace(/"/g,"&quot;");
  }
  function safeArg(v){
    return JSON.stringify(v||"").replace(/"/g,"&quot;");
  }
  function hex(v,fallback){
    const n=Number(v==null?fallback:v);
    return "#"+(Number.isFinite(n)?n:0).toString(16).padStart(6,"0").slice(-6);
  }
  function swatches(star){
    const col=star&&star.col||[0x222222,0xdddddd];
    return `<i style="--c:#${Number(col[0]||0).toString(16).padStart(6,"0")}"></i><i style="--c:#${Number(col[1]||0xffffff).toString(16).padStart(6,"0")}"></i>`;
  }
  function rating(star){
    const r=Math.max(0,Math.min(99,Number(star&&star.r)||88));
    return "★".repeat(Math.round(r/20)).padEnd(5,"☆");
  }
  function profileText(star){
    const p=profileFor(star);
    return `${p.label||"Standard Release"} · ${p.arcLabel||"Standard Arc"} · Sweet Spot ${Math.round((p.window||1)*100)}%`;
  }
  function stat(label,value,copy){
    const pct=Math.max(8,Math.min(96,Math.round(value)));
    return `<span><b>${esc(label)}</b><i style="--v:${pct}%"></i><em>${esc(copy)}</em></span>`;
  }
  function cardStyle(star){
    const col=star&&star.col||[0x202832,0x77e7ff],jersey=hex(col[0],0x202832),trim=hex(col[1],0x77e7ff);
    return `--jersey:${jersey};--trim:${trim}`;
  }
  function avatarSlot(id){
    return `<span class="lockerAvatar" data-locker-avatar="${esc(id||"")}"><i>3D</i><b>LOADING</b></span>`;
  }
  function metrics(star){
    const p=profileFor(star);
    return `<div class="lockerMetrics">
      ${stat("Release",((p.speed||1)-.78)*190,p.label||"Standard Release")}
      ${stat("Arc",((p.arc||1)-.86)*260,p.arcLabel||"Standard Arc")}
      ${stat("Sweet Spot",(p.window||1)*74,`Window ${Math.round((p.window||1)*100)}%`)}
    </div>`;
  }
  function randomCard(current){
    const star={col:[0x202832,0x77e7ff],num:"?"};
    return `<button class="lockerCard lockerRandom ${current?"":"selected"}" type="button" data-aiba-player="" style="${cardStyle(star)}" onclick="previewAIBAPlayer('')" aria-pressed="${current?"false":"true"}">
      <span class="lockerPlate"><small>LOCKER</small><b>RND</b></span>
      ${avatarSlot("")}
      <span class="lockerCardCopy"><small>EVERY GAME</small><b>${RANDOM_LABEL}</b><em>Drawn from the star pool each match, keeping a touch of mystery before tip-off.</em></span>
      <span class="lockerRibbon">SHUFFLE</span>
    </button>`;
  }
  function choiceButton(star,current){
    const id=starKey(star),p=profileFor(star),isOn=id===current;
    return `<button class="lockerCard ${isOn?"selected":""}" type="button" data-aiba-player="${esc(id)}" style="${cardStyle(star)}" onclick="previewAIBAPlayer(${safeArg(id)})" aria-pressed="${isOn}">
      <span class="lockerPlate"><small>${esc((p.label||"SHOOTER").toUpperCase())}</small><b>#${esc(star.num)}</b></span>
      ${avatarSlot(id)}
      <span class="lockerCardCopy"><small>${esc(rating(star))}</small><b>${esc(star.n)}</b><em>${esc(star.t||"A blocky new star from the street court.")}</em></span>
      <span class="lockerRibbon">${esc(p.arcLabel||"Standard Arc")}</span>
    </button>`;
  }
  function currentMarkup(id){
    const star=findStar(allStars(),id);
    if(!star)return `<div class="lockerCurrentMain"><small>NEXT STARTER</small><b>${RANDOM_LABEL}</b><em>After confirming, a random character is drawn from the full player pool at the start of each game.</em></div>
      <div class="lockerCurrentMeta"><span>Unknown Release</span><span>Unknown Arc</span><span>Random Sweet Spot</span></div>`;
    const p=profileFor(star);
    return `<div class="lockerCurrentMain"><small>NEXT STARTER</small><b>${esc(star.n)} <i>#${esc(star.num)}</i></b><em>${esc(star.t||"A blocky new star from the street court.")}</em></div>
      ${metrics(star)}
      <div class="lockerCurrentMeta"><span>${esc(p.label||"Standard Release")}</span><span>${esc(p.arcLabel||"Standard Arc")}</span><span>Sweet Spot ${Math.round((p.window||1)*100)}%</span></div>`;
  }
  function stageMarkup(id){
    const star=findStar(allStars(),id);
    return `<div id="lockerStage" class="lockerStage" style="${cardStyle(star)}">
      <div class="lockerStageVisual">${avatarSlot(id||"")}<span>LIVE FIT PREVIEW</span></div>
      <div id="lockerCurrent" class="lockerStageCurrent">${currentMarkup(id||"")}</div>
    </div>`;
  }
  function setCardState(id){
    const workbench=document.querySelector(".lockerWorkbench"),scrollTop=workbench?workbench.scrollTop:0;
    const cards=[...document.querySelectorAll(".lockerCard[data-aiba-player]")];
    cards.forEach(card=>{
      const on=card.getAttribute("data-aiba-player")===(id||"");
      card.classList.toggle("selected",on);
      card.setAttribute("aria-pressed",on?"true":"false");
    });
    const stage=document.getElementById("lockerStage");
    if(stage)stage.outerHTML=stageMarkup(id||"");
    else{
      const current=document.getElementById("lockerCurrent");
      if(current)current.innerHTML=currentMarkup(id||"");
    }
    hydrateAvatars();
    if(workbench){
      workbench.scrollTop=scrollTop;
      requestAnimationFrame(()=>{workbench.scrollTop=scrollTop;});
    }
  }
  function scrollCardIntoView(id){
    const card=[...document.querySelectorAll(".lockerCard[data-aiba-player]")].find(el=>el.getAttribute("data-aiba-player")===(id||""));
    const deck=card&&card.closest(".lockerDeck");if(!card||!deck)return;
    const left=Math.max(0,card.offsetLeft-(deck.clientWidth-card.offsetWidth)*.5);
    if(deck.scrollTo)deck.scrollTo({left,behavior:"smooth"});
    else deck.scrollLeft=left;
  }
  function hydrateAvatars(){
    const root=document.querySelector(".playerLocker");
    if(!root)return;
    if(global.AIBALockerPreview&&typeof global.AIBALockerPreview.render==="function")global.AIBALockerPreview.render(root);
    else setTimeout(hydrateAvatars,80);
  }
  function selectMarkup(list,mode){
    setMode(mode);
    const stars=allStars(list),current=selectedId(),star=findStar(stars,current);
    const p=star?profileFor(star):null;
    const gear=global.AIBAGear?global.AIBAGear.activeSummary():"";
    const desc=(star?(p.label||"Standard Release")+" · "+(p.arcLabel||"Standard Arc"):"Randomly drawn from the star pool each game")+(gear?" · "+gear:"");
    return `<button class="playerSelectDock" type="button" onclick="showAIBAPlayerSelect()" aria-label="Select Player">
      <span class="playerSelectBadge">${star?("#"+esc(star.num)):"RND"}</span>
      <span class="playerSelectInfo"><small>PLAYER LOCKER</small><b>${star?esc(star.n):RANDOM_LABEL}</b><em>${esc(desc)}</em></span>
      <span class="playerSelectAction">Switch Player ›</span>
    </button>`;
  }
  function showPanelForSelect(mode){
    setMode(mode);
    const stars=allStars(),current=selectedId();
    pendingId=current;
    if(typeof global.showPanel!=="function")return;
    const gearSection=global.AIBAGear?global.AIBAGear.sectionMarkup(findStar(stars,current)):"";
    const motionSection=global.AIBAMotion?global.AIBAMotion.toggleMarkup():"";
    global.showPanel(`<div class="playerLocker">
      <div class="lockerHead"><small>PLAYER LOCKER</small><h1>Locker Room</h1><p>Swipe to browse players. Tap a card to preview; they won't lock in until confirmed.</p></div>
      ${stageMarkup(current)}
      <div class="lockerWorkbench">
        <div class="lockerDeck" aria-label="Swipe to select players">${global.AIBACustomizer?global.AIBACustomizer.cardMarkup(current):""}${randomCard(current)}${stars.filter(star=>starKey(star)!=="custom-player").map(star=>choiceButton(star,current)).join("")}</div>
        ${gearSection}
        ${motionSection}
      </div>
      <div class="lockerActions">
        <button class="btn" type="button" onclick="confirmAIBAPlayer()">Lock In</button>
        <button class="btn sm" type="button" onclick="goDiff(${modeArg()},true)">Back to Settings</button>
      </div>
    </div>`);
    const box=document.getElementById("ovBox");
    if(box)box.classList.add("playerLockerBox");
    setTimeout(()=>{scrollCardIntoView(current);hydrateAvatars();},0);
  }
  function preview(id){
    pendingId=id||"";
    setCardState(pendingId);
    scrollCardIntoView(pendingId);
    if(global.AIBAGear)global.AIBAGear.onStarPreview(findStar(allStars(),pendingId));
  }
  function choose(id){
    saveSelectedId(id||"");
    pendingId=id||"";
    if(typeof global.toast==="function")global.toast(id?"Player locked in":"Switched back to Random Starter",id?"#7CFC6B":"#ffd23f");
  }
  function confirm(){
    choose(pendingId);
    if(typeof global.playSFX==="function")global.playSFX("ui_roster_lock_01");
    if(typeof global.goDiff==="function")global.goDiff(activeMode,true);
  }

  global.AIBASelectedStar=selectedStar;
  global.AIBAPlayerSelectMarkup=selectMarkup;
  global.showAIBAPlayerSelect=showPanelForSelect;
  global.previewAIBAPlayer=preview;
  global.confirmAIBAPlayer=confirm;
  global.chooseAIBAPlayer=choose;
})(window);