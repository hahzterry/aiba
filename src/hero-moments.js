/* ---------------- hero moments: 百分大战 / 投篮机 的最后一球特写 ----------------
   三分大赛(contest)的英雄时刻在内联 releaseShot 里已有;本模块补齐其他模式:
   - 百分大战:本球命中即到 100 分的制胜球出手 → 英雄运镜
   - 投篮机闯关:FINAL RUSH 最后 3 秒的压哨球 → 英雄运镜
   - 百分竞速:达到 96 分后的冲线球(任意一球都可能终结比赛) → 英雄运镜
   在 gear.js / shot-motion.js 之后加载,保持 releaseShot 包装链。 */
(function(global){
  "use strict";

  const prevReleaseShot=global.releaseShot;
  if(typeof prevReleaseShot!=="function")return;

  function shouldHero(B){
    if(typeof G==="undefined"||G.practice||typeof hero==="undefined"||hero.on)return false;
    if(G.mode==="battle")
      return !G.battleOver&&(G.score||0)+(B.val||2)>=BATTLE_TARGET;
    if(G.mode==="rackrush"&&G.rush){
      const cfg=RACK_RUSH_LEVELS[G.rush.level]||{};
      if(isRackRushSpeed(G.rush))return (G.rush.total||0)>=RACK_RUSH_SPEED_TARGET-4;
      return !!cfg.final&&G.running&&G.timer<=3.2;
    }
    return false;
  }

  const fn=function(power,shot){
    const r=prevReleaseShot.apply(this,arguments);
    try{
      const B=(typeof balls!=="undefined")&&balls[balls.length-1];
      if(B&&!B.opp&&shouldHero(B))startHero(B);
    }catch(e){}
    return r;
  };
  fn.__aibaHero=true;
  global.releaseShot=fn;

  /* 进入胜利短片/庆祝前先收掉英雄黑边,避免运镜被更高优先级镜头打断后黑边残留 */
  ["startVictoryCine","startWinCine","startCelebrate"].forEach(name=>{
    const orig=global[name];
    if(typeof orig!=="function"||orig.__aibaHero)return;
    const wrapped=function(){
      try{if(typeof endHero==="function")endHero();}catch(e){}
      return orig.apply(this,arguments);
    };
    wrapped.__aibaHero=true;
    global[name]=wrapped;
  });

  global.AIBAHeroMoments={shouldHero};
})(window);
