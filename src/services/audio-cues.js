"use strict";

function resetAudioCueMemory(){
  G.audioCueLast=Object.create(null);
  G.audioEventLock={pri:0,until:0};
}
function pickCue(pool){return pool[(Math.random()*pool.length)|0];}
const AUDIO_PRI={normal:1,momentum:2,special:3,score:4,final:5};
function audioEventAllowed(priority,dur,force){
  if(!G.audioEventLock)G.audioEventLock={pri:0,until:0};
  const pri=typeof priority==="number"?priority:(AUDIO_PRI[priority]||AUDIO_PRI.normal);
  const now=G.tNow||0,lock=G.audioEventLock;
  if(!force&&now<lock.until&&pri<=lock.pri)return false;
  lock.pri=pri;
  lock.until=now+(dur||1.8);
  return true;
}
function beginFinalAudioWindow(){audioEventAllowed("final",5,true);}
function gamePaSay(t,priority,dur,priFlag,force){
  if(!audioEventAllowed(priority,dur,force))return false;
  paSay(t,!!priFlag);
  return true;
}
function gameDjSay(t,priority,dur,priFlag,force){
  if(!audioEventAllowed(priority,dur,force))return false;
  djSay(t,!!priFlag);
  return true;
}
function gameRivalSay(o,t,emo,priority,dur){
  if(!audioEventAllowed(priority,dur,false))return false;
  rivalSay(o,t,emo);
  return true;
}
function audioCueAllowed(key,cooldown){
  if(!G.audioCueLast)resetAudioCueMemory();
  const now=G.tNow||0,last=G.audioCueLast[key]==null?-1e9:G.audioCueLast[key];
  if(now-last<(cooldown||7))return false;
  G.audioCueLast[key]=now;
  return true;
}
function cueOpponent(){
  if(G.mode==="battle"&&G.battleOpp)return G.battleOpp;
  const list=G.opponents||[];
  return list.length?list[(Math.random()*list.length)|0]:null;
}
function playMomentumCue(cue,color){
  if(!cue)return false;
  const t=cue.t||cue,o=cueOpponent();
  if(cue.role==="rival"&&o){
    toast(o.n+":「"+t+"」",color||"#ff8d7a");
    return gameRivalSay(o,t,cue.emo||"taunt","momentum",1.8);
  }
  if(cue.role==="dj"){
    toast(t,color||"#ffd23f");
    return gameDjSay(t,"momentum",1.8);
  }
  toast(t,color||"#9fd1ff");
  return gamePaSay(t,"momentum",1.8);
}
function suppressMomentumCue(){
  if(G.practice)return true;
  if(G.mode==="battle"&&(G.battleOver||G.score>=BATTLE_TARGET))return true;
  if(G.mode==="rackrush"&&G.rush&&isRackRushSpeed(G.rush)&&G.rush.total>=RACK_RUSH_SPEED_TARGET)return true;
  if((G.state==="round"||G.state==="tiebreak")&&G.seq&&G.shotIdx>=G.seq.length-1)return true;
  return false;
}
function triggerMakeRunVoice(){
  if(suppressMomentumCue())return false;
  const n=G.streak||0;
  let pool=null,key="",color="#7CFC6B",cooldown=7.5;
  if(n===3){pool=TALK_STREAK_THREE;key="make3";}
  else if(n===5){pool=TALK_STREAK_FIVE;key="make5";color="#ffd23f";cooldown=8.5;}
  else if(n===8){pool=TALK_STREAK_EIGHT;key="make8";color="#ffd23f";cooldown=10;}
  else return false;
  if(!audioCueAllowed(key,cooldown))return false;
  if(n>=5)airhorn();
  return playMomentumCue(pickCue(pool),color);
}
function triggerMissRunVoice(){
  if(suppressMomentumCue())return false;
  const n=G.missRun||0;
  let pool=null,key="",cooldown=9;
  if(n===5){pool=TALK_MISS_FIVE;key="miss5";}
  else if(n===8){pool=TALK_MISS_EIGHT;key="miss8";cooldown=11;}
  else return false;
  if(!audioCueAllowed(key,cooldown))return false;
  return playMomentumCue(pickCue(pool),"#ff8d7a");
}

