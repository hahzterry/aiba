(function(global){
  "use strict";

  const runtime=global.AIBA&&global.AIBA.runtime,ctx=runtime&&runtime.service("legacy");
  if(!runtime||!ctx||!runtime.service("ui:panels")||!runtime.service("ui:setup"))throw new Error("UI pregame requires panels, setup, and legacy adapter");
  const {
    G,VISION,LEGENDS,TALK_PRE,BATTLE_TARGET,BATTLE_BAR_VISIBLE_SHOTS,passer,player,rivals,
    dressGuy,applyStarStyle,seededRandom,stars,shotProfileFor,shotProfileText,getSharedRackRush
  }=ctx;

  function esc(value){
    return String(value==null?"":value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  }
  function translate(value){
    return global.AIBAI18N&&global.AIBAI18N.t?global.AIBAI18N.t(value):value;
  }
  function color(value,fallback){
    const n=Number(value==null?fallback:value);
    return "#"+(Number.isFinite(n)?n:fallback).toString(16).padStart(6,"0").slice(-6);
  }
  function metricValue(value){return Math.max(12,Math.min(99,Math.round(value)));}
  function metricRow(label,myValue,opponentValue){
    const me=metricValue(myValue),opp=metricValue(opponentValue);
    return `<div class="battleMetric">
      <span class="battleMetricSide me"><strong>${me}</strong><i><em style="width:${me}%"></em></i></span>
      <b>${esc(label)}</b>
      <span class="battleMetricSide opp"><i><em style="width:${opp}%"></em></i><strong>${opp}</strong></span>
    </div>`;
  }
  function fighterMarkup(star,role,tag){
    const id=star&&(star.id||star.n)||"",profile=shotProfileFor(star)||{},palette=star&&star.col||[0x263b57,0x77e7ff];
    return `<article class="battleFighter ${role}" style="--team:${color(palette[0],0x263b57)};--trim:${color(palette[1],0x77e7ff)}">
      <small>${tag}</small>
      <span class="lockerAvatar" data-locker-avatar="${esc(id)}"><i>3D</i><b>LOADING</b></span>
      <div class="battleFighterName"><b>${esc(star&&star.n||"PLAYER")}</b><span>#${esc(star&&star.num||"0")}</span></div>
      <em>${esc(profile.label||"Standard Shot")} · ${esc(profile.arcLabel||"Standard Arc")}</em>
    </article>`;
  }

  function pickDiff(key){
    G.diff=key;
    global.resetVisionGesture(VISION.machine);global.cancelVisionOwnedCharge();global.askTiltPerm();
    dressGuy(passer,0x6a727c,0x333a42,"");

    const shared=getSharedRackRush();
    const sharedStar=G.mode==="rackrush"&&shared&&shared.star?LEGENDS.find(star=>(star.id||star.n)===shared.star):null;
    const selectedStar=global.AIBASelectedStar?global.AIBASelectedStar(LEGENDS,null):null;
    G.myStar=selectedStar||sharedStar||LEGENDS[(Math.random()*LEGENDS.length)|0];
    G.myNum=G.myStar.num;
    applyStarStyle(player,G.myStar);

    const pool=LEGENDS.filter(star=>star!==G.myStar).map(star=>({...star}));
    for(let i=pool.length-1;i>0;i--){
      const j=(seededRandom()*(i+1))|0;
      [pool[i],pool[j]]=[pool[j],pool[i]];
    }

    if(G.mode==="rackrush"){
      G.opponents=[];global.showRackRushIntro();return;
    }
    if(G.mode==="battle"){
      G.battleOpp=pool[0];G.opponents=[G.battleOpp];applyStarStyle(rivals[0],G.battleOpp);showBattleIntro();return;
    }

    const count=seededRandom()<.5?2:3;
    G.opponents=pool.slice(0,count);
    G.opponents.forEach((opponent,index)=>applyStarStyle(rivals[index],opponent));
    G.stage="semi";G.stats={best:0,moneyM:0,moneyT:0,deepM:0,deepT:0};G.semiDone=false;G.finalDone=false;

    let html=`<h1 class="title" style="font-size:22px">Matchup Introduction</h1>
      <div class="note">Tonight's Pixel Night · ${count+1}-Player Semifinal · Top 2 Advance to Final<br>Shooting order randomly drawn · Opponent matches live-streamed</div>`;
    G.opponents.forEach(opponent=>{
      const rawTalk=TALK_PRE[(Math.random()*TALK_PRE.length)|0],talk=translate(rawTalk);
      html+=`<div class="card"><b>${opponent.n}</b> #${opponent.num} <span style="color:#ffb">${stars(opponent.r)}</span><br>
        <span style="color:#9ab;font-size:11px">3PT Ability ${opponent.r}</span><br>
        <span style="color:#ff9d8d;font-size:11px">「${talk}」</span></div>`;
    });
    html+=`<div class="card" style="border-color:#3a6"><b style="color:#9dff8d">You (YOU)</b> #${G.myNum} ${stars(G.myStar.r||88)}<br>
      <span style="color:#9ab;font-size:11px">${G.myStar.n} · 3PT ${G.myStar.r||88}</span><br>
      <span style="color:#9dff8d;font-size:11px">${shotProfileText(G.myStar)}</span></div>
      <button class="btn green" data-aiba-icon="target" data-aiba-label="Warm-up Practice (3 Balls)" onclick="startPractice()">Warm-up Practice (3 Balls)</button>
      <button class="btn gold" data-aiba-icon="play" data-aiba-label="Start Match →" onclick="hidePanel();beginStage()">Start Match →</button>`;
    global.showPanel(html);
  }

  function showBattleIntro(){
    const opponent=G.battleOpp,rawTalk=TALK_PRE[(Math.random()*TALK_PRE.length)|0],talk=translate(rawTalk);
    const myProfile=shotProfileFor(G.myStar)||{},opponentProfile=shotProfileFor(opponent)||{};
    global.showPanel(`<section class="battleIntro">
      <header class="battleIntroHead"><small>PERCENT BATTLE · MATCHUP</small><h1>First to ${BATTLE_TARGET} Wins</h1></header>
      <div class="battleLineup">
        ${fighterMarkup(G.myStar,"me","YOU")}
        <div class="battleVs"><b>VS</b><span>FIRST TO<br>${BATTLE_TARGET}</span></div>
        ${fighterMarkup(opponent,"opp","RIVAL")}
      </div>
      <div class="battleMetrics">
        ${metricRow("3PT Ability",G.myStar.r||88,opponent.r||88)}
        ${metricRow("Shot Speed",(myProfile.speed||1)*86,(opponentProfile.speed||1)*86)}
        ${metricRow("Sweet Spot",(myProfile.window||1)*82,(opponentProfile.window||1)*82)}
      </div>
      <div class="battleRuleChips"><span>Regular Spot <b>3</b></span><span>Money Spot <b>5</b></span><span>Half-Court <b>10</b></span><span>Basketballs can collide</span></div>
      <details class="battleRules"><summary>View Full Rules</summary><div>
        <p>Both shoot simultaneously. First to ${BATTLE_TARGET} wins.</p>
        <p>Tap the glowing rings on the court to switch spots. Regular and money spots recharge after use.</p>
        <p>${G.diff==="easy"?"Shot meter visible for the first 70%, then rely on feel for the last 30%.":`Shot meter visible for the first ${BATTLE_BAR_VISIBLE_SHOTS} shots, then pure feel.`}</p>
        <p>Your opponent shoots on the same court. Airborne basketballs may collide and alter results.</p>
      </div></details>
      <div class="battleTalk">“${esc(talk)}”</div>
      <button class="btn gold battleStart" onclick="ensureAudio(false,true);startBattle()">BATTLE!</button>
    </section>`);
    const box=document.getElementById("ovBox");if(box)box.classList.add("battleIntroBox");
    setTimeout(()=>{
      const root=document.querySelector(".battleIntro");
      if(root&&global.AIBALockerPreview)global.AIBALockerPreview.render(root);
    },0);
  }

  const api=Object.freeze({pickDiff,showBattleIntro});
  Object.assign(global,api);runtime.register("ui:pregame",api);
})(window);