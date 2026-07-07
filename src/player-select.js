(function(global){
  "use strict";

  const STORAGE_KEY="aiba_selected_star_v1";
  const RANDOM_LABEL="随机上场";
  let activeMode="contest";

  function esc(v){
    return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function starKey(star){return star&&(star.id||star.n)||"";}
  function allStars(list){
    if(Array.isArray(list)&&list.length)return list;
    const cfg=global.AIBA_CONFIG||{},assets=global.AIBA_ASSETS||{};
    return [...(cfg.CLASSIC_LEGENDS||[]),...(assets.coverStars||[])];
  }
  function profileFor(star){
    const cfg=global.AIBA_CONFIG||{};
    return cfg.shotProfileFor?cfg.shotProfileFor(star):((cfg.SHOT_PROFILES||{})[starKey(star)]||cfg.DEFAULT_SHOT_PROFILE||{speed:1,window:1,label:"标准出手",arcLabel:"标准弧线"});
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
    return `${p.label||"标准出手"} · ${p.arcLabel||"标准弧线"} · 甜区 ${Math.round((p.window||1)*100)}%`;
  }
  function choiceButton(star,current){
    const id=starKey(star),arg=JSON.stringify(id).replace(/"/g,"&quot;");
    return `<button class="playerChoice ${id===current?"selected":""}" type="button" onclick="chooseAIBAPlayer(${arg});goDiff(${modeArg()},true)" aria-pressed="${id===current}">
      <span class="playerChoiceNo">#${esc(star.num)}</span>
      <span class="playerChoiceSwatches">${swatches(star)}</span>
      <b>${esc(star.n)}</b>
      <small>${esc(star.t||"街球场走出的方块新星")}</small>
      <em>${esc(rating(star))} · ${esc(profileText(star))}</em>
    </button>`;
  }
  function selectMarkup(list,mode){
    setMode(mode);
    const stars=allStars(list),current=selectedId(),star=findStar(stars,current);
    const p=star?profileFor(star):null;
    return `<button class="playerSelectDock" type="button" onclick="showAIBAPlayerSelect()" aria-label="选择球员">
      <span class="playerSelectBadge">${star?("#"+esc(star.num)):"RND"}</span>
      <span class="playerSelectInfo"><small>PLAYER LOCKER</small><b>${star?esc(star.n):RANDOM_LABEL}</b><em>${star?esc((p.label||"标准出手")+" · "+(p.arcLabel||"标准弧线")):"每局从球星池随机抽选"}</em></span>
      <span class="playerSelectAction">换球员 ›</span>
    </button>`;
  }
  function showPanelForSelect(mode){
    setMode(mode);
    const stars=allStars(),current=selectedId();
    if(typeof global.showPanel!=="function")return;
    global.showPanel(`<h1 class="title" style="font-size:22px">选择球员</h1>
      <div class="note">不同球员有不同出手速度、甜区宽度和投篮弧线。选择会保存在本机，下次进入仍然使用。</div>
      <div class="playerChoiceToolbar">
        <button class="${current?"":"selected"}" type="button" onclick="chooseAIBAPlayer('');goDiff(${modeArg()},true)"><b>随机上场</b><small>每局抽选</small></button>
      </div>
      <div class="playerChoiceGrid">${stars.map(star=>choiceButton(star,current)).join("")}</div>
      <button class="btn sm" onclick="goDiff(${modeArg()},true)">返回设置</button>`);
  }
  function choose(id){
    saveSelectedId(id||"");
    if(typeof global.toast==="function")global.toast(id?"球员已锁定":"已切回随机上场",id?"#7CFC6B":"#ffd23f");
  }

  global.AIBASelectedStar=selectedStar;
  global.AIBAPlayerSelectMarkup=selectMarkup;
  global.showAIBAPlayerSelect=showPanelForSelect;
  global.chooseAIBAPlayer=choose;
})(window);
