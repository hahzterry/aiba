/* ---------------- postgame result stats ---------------- */
(function(global){
  "use strict";

  const EMPTY_MIX={standard:0,money:0,special:0,super:0,deep:0};

  function mix(){
    return {standard:0,money:0,special:0,super:0,deep:0};
  }
  function resultClockMs(){
    if(G.mode==="rackrush"&&G.rush)return Math.round((G.rush.elapsed||0)*1000);
    if(G.mode==="battle")return battleElapsedMs();
    if(G.running&&typeof G.timer==="number")return Math.round(Math.max(0,70-G.timer)*1000);
    return Math.round(performance.now());
  }
  function resultShotKind(shotLike){
    if(shotLike&&shotLike.super)return "super";
    if(shotLike&&shotLike.deep===true)return G.mode==="battle"?"special":"deep";
    if(shotLike&&typeof shotLike.deep==="number")return G.mode==="battle"?"special":"deep";
    if(shotLike&&shotLike.money)return "money";
    return "standard";
  }
  function resultStatsBucket(){
    if(!G.stats)G.stats={best:0,moneyM:0,moneyT:0,deepM:0,deepT:0};
    return G.stats;
  }
  function resultClutchAttempt(shot){
    if(G.mode==="battle"){
      const me=G.score||0,opp=G.battleOppScore||0,val=shot&&shot.val||0;
      return me>=80||opp>=80||me+val>=BATTLE_TARGET||(Math.max(me,opp)>=70&&Math.abs(me-opp)<=6);
    }
    if(G.mode==="rackrush"&&G.rush){
      if(isRackRushSpeed(G.rush))return G.rush.total>=72||G.rush.total+(shot&&shot.val||0)>=RACK_RUSH_SPEED_TARGET;
      return !!G.rush.finalTen||G.timer<=10||(RACK_RUSH_LEVELS[G.rush.level]&&RACK_RUSH_LEVELS[G.rush.level].final);
    }
    return G.timer<=10||G.shotIdx>=Math.max(0,(G.seq&&G.seq.length||1)-3);
  }
  function noteResultAttempt(shot){
    if(G.practice)return false;
    const s=resultStatsBucket(),now=resultClockMs();
    if(typeof s._lastAttemptMs==="number"){
      const gap=now-s._lastAttemptMs;
      if(gap>250&&gap<20000){
        if(!Array.isArray(s.shotGaps))s.shotGaps=[];
        s.shotGaps.push(gap);
        if(s.shotGaps.length>80)s.shotGaps.shift();
      }
    }
    s._lastAttemptMs=now;
    s.attempts=(s.attempts||0)+1;
    const kind=resultShotKind(shot);
    s.shotMix=s.shotMix||mix();
    s.shotMix[kind]=(s.shotMix[kind]||0)+1;
    const clutch=resultClutchAttempt(shot);
    if(clutch){
      s.clutchStats=s.clutchStats||{attempts:0,makes:0,points:0,lastMade:false};
      s.clutchStats.attempts++;
      s.clutchStats.lastMade=false;
    }
    return clutch;
  }
  function noteResultMake(ball){
    if(G.practice)return;
    const s=resultStatsBucket();
    s.makes=(s.makes||0)+1;
    s.pointsMade=(s.pointsMade||0)+(ball&&ball.val||0);
    const kind=resultShotKind(ball);
    s.makeMix=s.makeMix||mix();
    s.makeMix[kind]=(s.makeMix[kind]||0)+1;
    if(ball&&ball.resultClutch){
      s.clutchStats=s.clutchStats||{attempts:0,makes:0,points:0,lastMade:false};
      s.clutchStats.makes++;
      s.clutchStats.points+=(ball.val||0);
      s.clutchStats.lastMade=true;
    }
  }
  function noteResultMissRun(){
    if(G.practice)return;
    const s=resultStatsBucket();
    s.maxMissRun=Math.max(s.maxMissRun||0,G.missRun||0);
  }
  function summarizeResultStats(){
    const s=G.stats||{},gaps=Array.isArray(s.shotGaps)?s.shotGaps:[];
    const avg=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:0;
    const variance=avg&&gaps.length?gaps.reduce((a,b)=>a+Math.pow(b-avg,2),0)/gaps.length:0;
    const gear=global.AIBAGear&&AIBAGear.staminaMetrics?AIBAGear.staminaMetrics():{lowMs:0,outCount:0};
    const elapsed=G.mode==="battle"?battleElapsedMs():(G.mode==="rackrush"&&G.rush?(G.rush.elapsed||0)*1000:resultClockMs());
    return {
      shotMix:s.shotMix||EMPTY_MIX,
      makeMix:s.makeMix||EMPTY_MIX,
      rhythmStats:{avgGapMs:avg,gapCv:avg?Math.sqrt(variance)/avg:0,lowStaminaRatio:elapsed?Math.min(1,(gear.lowMs||0)/elapsed):0,staminaOutCount:gear.outCount||0},
      clutchStats:s.clutchStats||{attempts:0,makes:0,points:0,lastMade:false},
      stabilityStats:{attempts:s.attempts||0,makes:s.makes||0,maxMissRun:s.maxMissRun||0}
    };
  }

  global.noteResultAttempt=noteResultAttempt;
  global.noteResultMake=noteResultMake;
  global.noteResultMissRun=noteResultMissRun;
  global.summarizeResultStats=summarizeResultStats;
})(window);
