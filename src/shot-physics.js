/* ---------------- shot jump timing physics ---------------- */
(function(global){
  "use strict";
  const S={t:0,lastCharging:false,apexed:false,late:0};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  function params(ideal,rate){
    const peak=clamp(ideal/Math.max(1,rate)+.08,.72,1.12);
    const land=peak+.48;
    return {peak,land,auto:land-.07};
  }
  function reset(){S.t=0;S.lastCharging=false;S.apexed=false;S.late=0;}
  function update(opts){
    opts=opts||{};
    const charging=!!opts.charging,dt=Math.max(0,Math.min(.08,opts.dt||0)),ideal=opts.ideal||74,rate=opts.rate||95;
    if(charging){if(!S.lastCharging)S.t=0;S.t+=dt;}
    else S.t=Math.max(0,S.t-dt*4);
    S.lastCharging=charging;
    const base=opts.curve||{};
    const p=params(ideal,rate),fallSpan=Math.max(.12,p.land-p.peak),afterPeak=S.t>p.peak,fall=ease((S.t-p.peak)/fallSpan);
    const late=clamp((S.t-p.peak-.08)/Math.max(.12,p.auto-p.peak-.08),0,1);
    S.late=afterPeak?late:0;
    const jump=afterPeak?Math.max(0,Math.max(base.jmp||0,1)*(1-fall)):(base.jmp||0);
    const curve={dip:base.dip||0,lift:base.lift||0,rise:base.rise||0,jmp:jump,over:afterPeak?Math.max(base.over||0,late*.85):(base.over||0),late:S.late,jumpT:S.t};
    const apexCue=charging&&!S.apexed&&S.t>=p.peak;
    if(apexCue)S.apexed=true;
    return {curve,jump,late,apexCue,autoRelease:charging&&S.t>=p.auto,t:S.t,params:p};
  }
  function releasePower(power,ideal){
    const late=S.late||0;
    if(late<=0)return power;
    const short=10+late*28;
    return Math.max(0,Math.min(power-short,ideal-short*.72));
  }
  global.AIBAShotPhysics=Object.freeze({reset,update,releasePower});
})(window);
