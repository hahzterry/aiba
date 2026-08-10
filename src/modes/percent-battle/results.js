/* Percent Battle results */
(function(global){
  "use strict";

  const runtime=global.AIBA&&global.AIBA.runtime,ctx=runtime&&runtime.service("legacy"),battle=global.AIBABattle;
  if(!ctx||!battle)throw new Error("Percent Battle results require battle state");
  const {
    $,G,BATTLE_TARGET,DIFFS,scene,balls,handBall,pBall,leaveArenaAudio,applyCamMode,endHero,airhorn,djSay,
    cheerSound,paSay,boo,scoreQuoteMarkup,showPanel,startWinCine
  }=ctx;
  const OPP=battle.OPP;

  function finishBattle(win,ball){
    const winCine=ctx.getWinCine();
    if(G.battleOver||(winCine&&winCine.on))return;
    startWinCine(win,ball);
  }
  function showBattleResult(win){
    leaveArenaAudio();G.state="battleend";OPP.on=false;if(typeof battle.cancelOppPass==="function")battle.cancelOppPass(true);
    balls.slice().forEach(ball=>{scene.remove(ball.mesh);scene.remove(ball.blob);});balls.length=0;
    $("spotDots").style.display="none";$("edgeArrows").style.display="none";
    $("battleScore").style.display="none";$("midBtn").style.display="none";
    const spotRing=ctx.getCurSpotRing();if(spotRing)spotRing.visible=false;
    handBall.visible=false;pBall.visible=false;$("battleControls").style.display="none";$("hud").style.display="none";
    endHero();applyCamMode();
    if(win){airhorn();djSay("Percent Battle, first to 100!",true);cheerSound(true);G.cheer=1;}
    else{paSay(G.battleOpp.n+" reached 100 points first!",true);boo(1.2);}
    const title=win?"Percent Battle Victory!":"Percent Battle Defeat";
    const record=G.battleResultRecord||battle.makeBattleRecord(win,battle.battleElapsedMs());
    if(global.AIBARecorder&&global.AIBARecorder.result){
      global.AIBARecorder.result(record,{title,score:`${Math.min(G.score,BATTLE_TARGET)} : ${Math.min(G.battleOppScore,BATTLE_TARGET)}`,
        sub:`Time to 100 ${battle.formatBattleTime(record.elapsedMs)} · ${DIFFS[G.diff].n}`,postMs:9000});
    }
    const header=global.AIBAResultHeaderMarkup(record,{headline:title,score:Math.min(G.score,BATTLE_TARGET)+" : "+Math.min(G.battleOppScore,BATTLE_TARGET),label:"FINAL SCORE",mode:"PERCENT BATTLE"});
    showPanel(`${header}
      ${global.AIBAResultBadgeMarkup?global.AIBAResultBadgeMarkup(record):""}<details class="resultDetails"><summary>View Match Data</summary><div class="card">Opponent: <b>${G.battleOpp.n}</b><br>
        Time to 100 <b style="color:#ffd23f">${battle.formatBattleTime(record.elapsedMs)}</b> · ${record.control==="vision"?"Motion Control":"Touch Control"}<br>
        Best Streak <b class="flame">x${G.stats.best}</b> · Deep 10pts <b>${G.stats.deepM}/${G.stats.deepT}</b><br>
        Difficulty: <b>${DIFFS[G.diff].n}</b></div></details>
      ${global.AIBACloudRankMarkup?global.AIBACloudRankMarkup(record):""}${scoreQuoteMarkup()}${global.AIBARecorder?global.AIBARecorder.resultMarkup():""}
      <button class="btn gold" onclick="startBattle()">Play Again</button>
      <button class="btn green" onclick="showOnlineLeaderboardForRecord(G.battleResultRecord)">Global Leaderboard</button><button class="btn green" onclick="location.reload()">Back to Menu</button>`);
  }

  Object.assign(battle,{finishBattle,showBattleResult});
})(window);