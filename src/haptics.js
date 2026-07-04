"use strict";

let lastRimHapticAt=0;

function phoneHaptic(pattern){
  try{return !!(navigator.vibrate&&navigator.vibrate(pattern));}
  catch(e){return false;}
}

function playerRimHaptic(ball){
  if(!ball||ball.opp||ball.silent||ball.rimHaptic)return false;
  ball.rimHaptic=true;
  const now=(typeof performance!=="undefined"&&performance.now)?performance.now():Date.now();
  if(now-lastRimHapticAt<120)return false;
  lastRimHapticAt=now;
  return phoneHaptic(16);
}
