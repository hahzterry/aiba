(function(global){
  "use strict";

  const runtime=global.AIBA&&global.AIBA.runtime,ctx=runtime&&runtime.service("legacy");
  if(!runtime||!ctx||!runtime.service("ui:panels")||!runtime.service("ui:setup"))throw new Error("UI pregame requires panels, setup, and legacy adapter");
  const {
    G,VISION,LEGENDS,TALK_PRE,BATTLE_TARGET,BATTLE_BAR_VISIBLE_SHOTS,passer,player,rivals,
    dressGuy,applyStarStyle,seededRandom,stars,shotProfileText,getSharedRackRush
  }=ctx;

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

    let html=`<h1 class="title" style="font-size:22px">🎤 对位介绍</h1>
      <div class="note">今晚的像素之夜 · ${count+1} 人半决赛 · 前 2 名晋级决赛<br>出手顺序随机抽签 · 对手比赛全程直播</div>`;
    G.opponents.forEach(opponent=>{
      const talk=TALK_PRE[(Math.random()*TALK_PRE.length)|0];
      html+=`<div class="card"><b>${opponent.n}</b> #${opponent.num} <span style="color:#ffb">${stars(opponent.r)}</span><br>
        <span style="color:#9ab;font-size:11px">${opponent.t} · 三分能力 ${opponent.r}</span><br>
        <span style="color:#ff9d8d;font-size:11px">「${talk}」</span></div>`;
    });
    html+=`<div class="card" style="border-color:#3a6"><b style="color:#9dff8d">你 (YOU)</b> #${G.myNum} ${stars(G.myStar.r||88)}<br>
      <span style="color:#9ab;font-size:11px">${G.myStar.n} · ${G.myStar.t||"街球场走出的方块新星"}</span><br>
      <span style="color:#9dff8d;font-size:11px">${shotProfileText(G.myStar)}</span></div>
      <button class="btn green" onclick="startPractice()">🏀 热身练习 (3球)</button>
      <button class="btn gold" onclick="hidePanel();beginStage()">⚡ 直接开赛 →</button>`;
    global.showPanel(html);
  }

  function showBattleIntro(){
    const opponent=G.battleOpp,talk=TALK_PRE[(Math.random()*TALK_PRE.length)|0];
    const myShot=shotProfileText(G.myStar),opponentShot=shotProfileText(opponent);
    global.showPanel(`<h1 class="title" style="font-size:22px">aiBA·百分大战</h1>
      <div class="card"><b style="color:#9dff8d">你 · ${G.myStar.n}</b> #${G.myNum}  VS  <b style="color:#ffd23f">${opponent.n}</b> #${opponent.num}<br>
        <span style="font-size:11px;color:#9ab">${opponent.t} · ${stars(opponent.r)}</span><br>
        <span style="font-size:11px;color:#9dff8d">你: ${myShot}</span> · <span style="font-size:11px;color:#ffd23f">对手: ${opponentShot}</span><br>
        <span style="color:#ff9d8d;font-size:11px">「${talk}」</span></div>
      <div class="card">规则:<br>
        1. 两人同时开始,先到 <b>${BATTLE_TARGET}</b> 分获胜。<br>
        2. 五个常规点命中 <b>3 分</b>,两个彩球点命中 <b style="color:#54e05a">5 分</b>。<br>
        3. 中场 LOGO 超远点命中 <b style="color:#ffd23f">10 分</b>。<br>
        4. 点击场上光圈直接移动到投篮点(或 A/D、方向键)。<br>
        5. ${G.diff==="easy"?"前 <b>70%</b> 显示投篮条,最后 30% 靠手感。":`前 <b>${BATTLE_BAR_VISIBLE_SHOTS}</b> 球显示投篮条,之后进入手感盲投。`}<br>
        6. 普通点每点 5 球,用完 10 秒恢复;两个彩球点各自 10 秒恢复。<br>
        7. 中场 10 分只在任意一方跨过 10/20/30... 分时出现一次。<br>
        8. 对手与你同场竞投,球在空中可能<b style="color:#ff8d7a">相撞改变结果</b>!</div>
      <button class="btn gold" onclick="ensureAudio(false,true);startBattle()">开战!</button>`);
  }

  const api=Object.freeze({pickDiff,showBattleIntro});
  Object.assign(global,api);runtime.register("ui:pregame",api);
})(window);
