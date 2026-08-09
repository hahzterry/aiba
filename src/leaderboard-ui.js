(function(global){
  "use strict";

  let seq=0;
  function esc(v){
    return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }
  function profile(){
    return global.AIBAIdentity&&global.AIBAIdentity.publicProfile?global.AIBAIdentity.publicProfile():{display_name:"",player_tag:"",online:false,has_nickname:false};
  }
  function hasNickname(p){
    return !!(p&&p.has_nickname&&String(p.display_name||"").trim());
  }
  function displayName(p){
    return hasNickname(p)?String(p.display_name||"").trim():"";
  }
  function isDefaultName(name){
    return /^Rookie\s+[A-Z0-9]{4,8}$/i.test(String(name||"").trim());
  }
  function rowName(row){
    const name=String(row&&row.display_name||"").trim();
    return name&&!isDefaultName(name)?name:"Unnamed player";
  }
  function labelControl(v){
    return v==="vision"?"Motion":"Touch";
  }
  function diffName(k){
    try{return DIFFS[k]&&DIFFS[k].n||k||"";}catch(e){return k||"";}
  }
  function modeTitle(record){
    if(!record)return"Global leaderboard";
    if(record.mode==="percent-battle")return"Percent Battle time board";
    if(record.variant==="speed100"||record.mode==="rack-rush-speed100")return"Speed 100 board";
    if(record.mode==="rack-rush")return"Machine total board";
    return"Global leaderboard";
  }
  function scopeText(record){
    if(!record)return"Worldwide";
    const parts=[diffName(record.difficulty),labelControl(record.control)].filter(Boolean);
    return parts.length?parts.join(" · "):"Worldwide";
  }
  function timeText(ms){
    try{
      if(typeof formatBattleTime==="function"&&(ms||0)>=60000)return formatBattleTime(ms);
      if(typeof formatRackRushClock==="function")return formatRackRushClock((ms||0)/1000);
    }catch(e){}
    return ((ms||0)/1000).toFixed(1)+"s";
  }
  function recordScoreText(record){
    if(!record)return"-";
    if(record.mode==="percent-battle")return (record.score||0)+" : "+(record.opponentScore||0);
    if(record.variant==="speed100"||record.mode==="rack-rush-speed100")return timeText(record.elapsedMs||record.elapsed_ms);
    return String(record.total==null?record.score:record.total);
  }
  function rowScoreText(row,record){
    const speed=record&&(record.variant==="speed100"||record.mode==="rack-rush-speed100"||record.mode==="percent-battle");
    if(speed)return timeText(row.elapsed_ms);
    return String(row.score||0);
  }
  function paramsFor(record,limit){
    const mode=record&&record.mode||"rack-rush";
    const params={mode,limit:limit||10};
    if(record&&record.variant)params.variant=record.variant;
    if(record&&record.difficulty)params.difficulty=record.difficulty;
    if(record&&record.control)params.control=record.control;
    if(record&&record.date)params.date=record.date;
    if(record&&record.period)params.period=record.period;
    return params;
  }
  function profileMarkup(){
    const p=profile(),name=displayName(p);
    if(name)return "";
    return `<div class="playerProfile playerProfileOnboard" id="playerProfileBox"><div><small>PLAYER</small><b>Drop your court name</b></div><label><span>Nickname</span><input id="playerNameInput" maxlength="18" autocomplete="nickname" placeholder="e.g. Wizard of Hahz" value="" onchange="savePlayerNameFromInput(this.value)" onblur="savePlayerNameFromInput(this.value)"></label><button type="button" onclick="savePlayerNameFromInput(document.getElementById('playerNameInput').value)">GO</button></div>`;
  }
  function miniMarkup(){
    const p=profile(),name=displayName(p);
    if(!name)return `<div class="playerProfile mini needName" id="playerProfileMini"><span>PLAYER</span><b>Pick a name first</b><button type="button" onclick="showNicknameEditor()">Name</button></div>`;
    return `<div class="playerProfile mini readyName" id="playerProfileMini"><span>PLAYER</span><b>${esc(name)}</b><button type="button" onclick="showNicknameEditor()">Rename</button></div>`;
  }
  function homeMarkup(){
    return `<div class="leaderboardDock" aria-label="Leaderboards">
      <button type="button" onclick="showLeaderboardHub('all')"><small>GLOBAL</small><b>Global leaderboard</b><span>›</span></button>
    </div>`;
  }
  function modeMarkup(mode){
    const focus=mode==="battle"?"battle":(mode==="rackrush"?"rackrush":(mode==="contest"?"contest":""));
    if(!focus)return "";
    return `<nav class="modeUtilityBar" aria-label="Mode shortcuts">
      <button type="button" onclick="showModeUtility('${focus}')">Leaderboard</button>
      <button type="button" onclick="AIBAPerfSettings.open()">Game settings</button>
    </nav>`;
  }
  function showModeUtility(focus){
    focus=focus==="battle"||focus==="rackrush"||focus==="contest"?focus:"speed100";
    const label=focus==="battle"?"Percent Battle":(focus==="rackrush"?"Rack Rush":"3PT Contest");
    if(typeof showPanel!=="function")return;
    showPanel(`<h1 class="title" style="font-size:22px">Leaderboards</h1><div class="note">${esc(label)} · Global records</div>
      <div class="modeUtilityMenu"><button class="btn gold" type="button" onclick="showLeaderboardHub('all','${focus}')">All-time</button><button class="btn sm" type="button" onclick="showLeaderboardHub('today','${focus}')">Today</button></div>
      <button class="btn sm" type="button" onclick="goDiff(G.mode,true)">Back to difficulty</button>`);
  }
  function refreshProfileUI(){
    const p=profile();
    const box=document.getElementById("playerProfileBox");
    if(box){
      const next=profileMarkup();
      if(next)box.outerHTML=next;else box.remove();
    }
    const input=document.getElementById("playerNameInput");
    if(input&&document.activeElement!==input)input.value=displayName(p);
    const mini=document.getElementById("playerProfileMini");
    if(mini)mini.outerHTML=miniMarkup();
  }
  async function savePlayerNameFromInput(value){
    const clean=String(value||"").trim().slice(0,18);
    if(global.AIBAIdentity&&global.AIBAIdentity.setLocalName)global.AIBAIdentity.setLocalName(clean);
    refreshProfileUI();
    try{
      if(global.AIBAIdentity&&global.AIBAIdentity.updateName){
        await global.AIBAIdentity.updateName(clean);
        refreshProfileUI();
        if(typeof toast==="function")toast(clean?"Nickname saved":"You can rename later","#7CFC6B");
      }
    }catch(e){
      if(typeof toast==="function")toast("Saved locally — will sync later","#ffd23f");
    }
  }
  function showNicknameEditor(returnTo){
    const p=profile(),name=displayName(p);
    if(typeof showPanel!=="function")return;
    const back=returnTo==="settings"?"AIBAPerfSettings.open()":"goDiff(G.mode||'rackrush')";
    showPanel(`<h1 class="title" style="font-size:22px">Drop your court name</h1><div class="note">Used on result cards, highlight videos & the global board. Remembered next time.</div><div class="playerNameEditor"><input id="playerNameInput" maxlength="18" autocomplete="nickname" placeholder="Enter your nickname" value="${esc(name)}"><button class="btn gold" onclick="savePlayerNameFromInput(document.getElementById('playerNameInput').value)">Save nickname</button></div><button class="btn sm" onclick="${back}">Back</button>`);
    setTimeout(()=>{const el=document.getElementById("playerNameInput");if(el)el.focus();},0);
  }
  function clamp(v,min,max){
    return Math.max(min,Math.min(max,v));
  }
  function num(v,fb){
    v=Number(v);
    return Number.isFinite(v)?v:(fb||0);
  }
  function nested(record,key,prop){
    return record&&record[key]&&record[key][prop]!=null?record[key][prop]:null;
  }
  function modeKind(record){
    if(!record)return "";
    if(record.mode==="percent-battle")return "battle";
    if(record.variant==="speed100"||record.mode==="rack-rush-speed100")return "speed100";
    if(record.mode==="rack-rush")return "rackrush";
    return record.mode||"";
  }
  function difficultyBase(record){
    const d=record&&record.difficulty;
    return d==="hard"?68:(d==="normal"?52:36);
  }
  function targetGap(record){
    const k=modeKind(record);
    if(k==="speed100")return 1.28;
    if(k==="battle")return 2.25;
    if(k==="rackrush")return 1.85;
    return 2.15;
  }
  function rhythmScore(record,attempts,elapsed){
    const rhythm=record&&record.rhythmStats||{};
    const gapSec=num(rhythm.avgGapMs,0)/1000||num(rhythm.avgGapSec,0);
    const fallback=elapsed&&attempts>1?elapsed/1000/attempts:0;
    const g=gapSec||fallback;
    if(!g)return 46;
    const target=targetGap(record);
    let score=100-Math.abs(g-target)/target*62;
    if(g<target*.62)score-=18;
    if(g>target*2.25)score-=14;
    const lowRatio=num(rhythm.lowStaminaRatio,0);
    const outCount=num(rhythm.staminaOutCount,0);
    const jitter=num(rhythm.gapCv,0);
    score-=lowRatio*34+outCount*11+Math.max(0,jitter-.45)*24;
    return clamp(score,12,96);
  }
  function clutchScore(record,total,attempts,makes){
    const c=record&&record.clutchStats||{};
    const ca=num(c.attempts,0),cm=num(c.makes,0),cp=num(c.points,0);
    if(ca>0){
      const rate=cm/ca;
      return clamp(34+rate*44+Math.min(18,cp*1.3)+(c.lastMade?6:0),18,98);
    }
    const k=modeKind(record);
    if(k==="battle"){
      const me=num(record&&record.score,0),opp=num(record&&record.opponentScore,0);
      const margin=me-opp,close=Math.max(0,14-Math.abs(margin))*1.1;
      return record&&record.won?clamp(56+me*.16+Math.max(0,opp-70)*.24+close,42,94):clamp(34+me*.18-Math.max(0,opp-me)*.18+close*.4,18,66);
    }
    if(k==="speed100"){
      const sec=(num(record&&record.elapsedMs,0)||num(record&&record.elapsed_ms,0))/1000;
      return total>=100?clamp(96-Math.max(0,sec-78)*.5,40,96):clamp(24+total*.45,18,72);
    }
    if(k==="rackrush"){
      const level=num(record&&record.highestLevel,0);
      return record&&record.completed?90:clamp(30+level*8+total*.08+(makes>attempts*.55?6:0),22,82);
    }
    return clamp(total,24,82);
  }
  function difficultyScore(record,attempts){
    const mix=record&&record.shotMix||{};
    const madeMix=record&&record.makeMix||{};
    const hasMix=Object.keys(mix).length>0;
    const highAttempts=num(mix.money,0)+num(mix.special,0)*1.25+num(mix.super,0)*2.1+(hasMix?0:num(record&&record.deepAttempts,0)*1.6);
    const highMakes=num(madeMix.money,0)+num(madeMix.special,0)*1.35+num(madeMix.super,0)*2.4+(hasMix?0:num(record&&record.deepMakes,0)*1.8);
    const spot=attempts?clamp(highAttempts/attempts*55+highMakes*2.8,0,28):0;
    const sweet=num(record&&record.sweetWindow,1);
    const sweetScore=sweet?clamp((1.12-sweet)*82,-10,24):0;
    const arc=num(record&&record.shotArc,1);
    const arcScore=arc?clamp(Math.abs(arc-1)*14,0,8):0;
    const control=record&&record.control==="vision"?7:0;
    return clamp(difficultyBase(record)+spot+sweetScore+arcScore+control,20,100);
  }
  function metricsFor(record){
    const attempts=num(record&&record.attempts,nested(record,"stabilityStats","attempts")||0);
    const makes=num(record&&record.makes,nested(record,"stabilityStats","makes")||0);
    const elapsed=num(record&&record.elapsedMs,record&&record.elapsed_ms);
    const total=num(record&&record.total,record&&record.score);
    const rate=attempts?clamp(makes/attempts,0,1):clamp(num(record&&record.accuracy,0),0,1);
    const valuePerMake=makes?total/makes:0;
    const baseValue=modeKind(record)==="rackrush"?2.25:3;
    const accuracy=clamp((rate-.24)/.5*100+clamp((valuePerMake-baseValue)*7,-7,10),6,100);
    const best=num(record&&record.bestStreak,record&&record.best_streak);
    const maxMiss=num(nested(record,"stabilityStats","maxMissRun"),record&&record.maxMissRun);
    const stability=clamp(best*10+rate*26-Math.max(0,maxMiss-1)*9-(attempts<5?14:0),8,100);
    const pace=rhythmScore(record,attempts,elapsed);
    const clutch=clutchScore(record,total,attempts,makes);
    const diff=difficultyScore(record,attempts);
    const score=clamp(Math.round(accuracy*.30+stability*.20+pace*.15+clutch*.25+diff*.10),0,100);
    return {accuracy,rawAccuracy:rate*100,stability,pace,clutch,diff,score,attempts,makes,total,elapsed};
  }
  function tierFor(score){
    if(score>=92)return {cls:"legend",title:"Legendary touch",stamp:"LEGENDARY",line:"That run belongs in arena folklore."};
    if(score>=84)return {cls:"silver",title:"Elite shooter",stamp:"SILVER / Elite",line:"Touch solid enough to make the leaderboard nervous."};
    if(score>=74)return {cls:"bronze",title:"Steady firepower",stamp:"BRONZE / Steady",line:"The rhythm is there — push harder next run."};
    if(score>=64)return {cls:"copper",title:"Got something",stamp:"COPPER / Warm",line:"Not a random — that touch deserves another run."};
    if(score>=52)return {cls:"steel",title:"Rookie on the road",stamp:"STEEL / Rookie",line:"The form is coming — lock in the rhythm first."};
    if(score>=38)return {cls:"slate",title:"Bench thoughts",stamp:"SLATE / Extra reps",line:"No panic — every arena needs some comedy."};
    return {cls:"ash",title:"Grayscale touch",stamp:"Gray zone",line:"Maybe don't post this one — two more practice sets first."};
  }
  function radarMarkup(m){
    const vals=[["FG%",m.accuracy],["Stability",m.stability],["Rhythm",m.pace],["Clutch",m.clutch],["Difficulty",m.diff]];
    const cx=62,cy=62,r=42;
    const pts=vals.map((x,i)=>{const a=-Math.PI/2+i*Math.PI*2/5,rr=r*clamp(x[1],0,100)/100;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr];}).map(p=>p.map(n=>n.toFixed(1)).join(",")).join(" ");
    const grid=[.33,.66,1].map(k=>vals.map((x,i)=>{const a=-Math.PI/2+i*Math.PI*2/5,rr=r*k;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr].map(n=>n.toFixed(1)).join(",");}).join(" ")).map(p=>`<polygon points="${p}"></polygon>`).join("");
    const labels=vals.map((x,i)=>{const a=-Math.PI/2+i*Math.PI*2/5,rr=r+14;return `<text x="${(cx+Math.cos(a)*rr).toFixed(1)}" y="${(cy+Math.sin(a)*rr+4).toFixed(1)}">${esc(x[0])}</text>`;}).join("");
    return `<svg class="resultRadar" viewBox="0 0 124 124" aria-label="Performance radar"><g class="grid">${grid}</g><polygon class="shape" points="${pts}"></polygon><g class="labels">${labels}</g></svg>`;
  }
  function statMarkup(record,m){
    if(record&&record.mode==="percent-battle")return `<span><b>${record.score||0}:${record.opponentScore||0}</b><small>Final score</small></span><span><b>${timeText(m.elapsed)}</b><small>Time to 100</small></span><span><b>${record.deepMakes||0}/${record.deepAttempts||0}</b><small>Halfcourt balls</small></span>`;
    if(record&&(record.variant==="speed100"||record.mode==="rack-rush-speed100"))return `<span><b>${timeText(m.elapsed)}</b><small>Finish time</small></span><span><b>${m.makes}/${m.attempts}</b><small>Makes</small></span><span><b>${Math.round(m.rawAccuracy)}%</b><small>FG%</small></span>`;
    return `<span><b>${m.total}</b><small>Total</small></span><span><b>${m.makes}/${m.attempts}</b><small>Makes</small></span><span><b>x${record&&record.bestStreak||0}</b><small>Best streak</small></span>`;
  }
  function resultBadgeMarkup(record){
    if(!record)return"";
    const m=metricsFor(record),tier=tierFor(m.score),p=profile(),name=displayName(p)||"aiBA PLAYER";
    return `<section class="resultHeroCard resultTier-${tier.cls} ${tier.cls}"><i class="resultCorner tl"></i><i class="resultCorner tr"></i><i class="resultCorner bl"></i><i class="resultCorner br"></i><div class="resultIdentity"><small>POSTGAME TITLE</small><b>${esc(tier.title)}</b><span>${esc(name)} · ${m.score} DNA</span><em>${esc(tier.line)}</em></div><div class="resultRadarWrap">${radarMarkup(m)}</div><div class="resultStatGrid">${statMarkup(record,m)}</div></section>`;
  }
  function resultHeaderMarkup(record,opts){
    opts=opts||{};const m=metricsFor(record),tier=tierFor(m.score);
    return `<section class="resultScoreHero resultTier-${tier.cls}"><div class="resultModeLine"><b>${esc(opts.headline||"Challenge complete")}</b><span>${esc(opts.mode||"POSTGAME COMPLETE")}</span></div><div class="resultScoreValue">${esc(opts.score||recordScoreText(record))}</div><div class="resultStamp">${esc(tier.stamp)}</div><div class="resultScoreLabel">${esc(opts.label||"FINAL RESULT")}</div></section>`;
  }
  function keyFor(record){
    if(!record._cloudKey)record._cloudKey="cloudRank"+(++seq);
    return record._cloudKey;
  }
  function rankLine(record){
    const res=record&&record.cloudResult;
    if(record&&record.cloudStatus==="syncing")return {cls:"pending",main:"Syncing global rank",sub:scopeText(record)};
    if(res&&res.ok&&res.rank)return {cls:"ok",main:"Global rank #"+res.rank+" / "+(res.total||"?"),sub:scopeText(record)+" · "+recordScoreText(record)};
    if(res&&res.queued)return {cls:"queued",main:"Queued offline",sub:"Auto‑submits when back online"};
    if(res&&!res.ok)return {cls:"queued",main:"Saved locally",sub:"Global rank unavailable"};
    return {cls:"pending",main:"Waiting for global rank",sub:scopeText(record)};
  }
  function recordRankText(record){
    const line=rankLine(record);
    return line&&line.cls==="ok"?line.main:"Syncing global rank";
  }
  function updateRank(record){
    if(!record)return;
    const key=keyFor(record),el=document.getElementById(key);
    const line=rankLine(record);
    global.__aibaLastCloudRankText=line.main;
    if(line.cls==="ok"&&global.AIBARecorder&&global.AIBARecorder.rankUpdated)global.AIBARecorder.rankUpdated();
    if(!el)return;
    el.className="cloudRankBox "+line.cls;
    el.innerHTML=`<small>GLOBAL RANK</small><b>${esc(line.main)}</b><span>${esc(line.sub)}</span>`;
  }
  function submitRecord(record){
    if(!record)return Promise.resolve({ok:false,error:"missing_record"});
    if(record._cloudPromise)return record._cloudPromise;
    record.cloudStatus="syncing";updateRank(record);
    if(!global.AIBALeaderboard||!global.AIBALeaderboard.submit){
      record.cloudResult={ok:false,queued:true,error:"leaderboard_unavailable"};record.cloudStatus="queued";updateRank(record);
      return Promise.resolve(record.cloudResult);
    }
    record._cloudPromise=global.AIBALeaderboard.submit(record).then(res=>{
      record.cloudResult=res;record.cloudStatus=res&&res.ok?"done":(res&&res.queued?"queued":"error");updateRank(record);return res;
    }).catch(err=>{
      record.cloudResult={ok:false,queued:true,error:String(err&&err.message||err)};record.cloudStatus="queued";updateRank(record);return record.cloudResult;
    });
    return record._cloudPromise;
  }
  function rankMarkup(record){
    if(!record)return"";
    const key=keyFor(record);
    setTimeout(()=>{if(!record._cloudPromise&&!record.cloudResult)submitRecord(record);else updateRank(record);},0);
    const line=rankLine(record);
    return `<div id="${key}" class="cloudRankBox ${line.cls}"><small>GLOBAL RANK</small><b>${esc(line.main)}</b><span>${esc(line.sub)}</span></div>`;
  }
  const BOARD_DEFS=[
    {key:"speed100",title:"Speed 100",mode:"rack-rush-speed100",variant:"speed100",hint:"Race to 100",scoreLabel:"Time"},
    {key:"battle",title:"Percent Battle",mode:"percent-battle",variant:"",hint:"First to 100",scoreLabel:"Time"},
    {key:"rackrush",title:"Rack Rush",mode:"rack-rush",variant:"classic",hint:"Best total",scoreLabel:"Score"},
    {key:"contest",title:"3PT Contest",mode:"three-point-contest",variant:"classic",hint:"Classic 70s",scoreLabel:"Score",soon:true}
  ];
  function todayDate(){
    const d=new Date();
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }
  function boardDefsFor(focus){
    if(focus==="battle")return BOARD_DEFS.filter(d=>d.key==="battle");
    if(focus==="rackrush")return BOARD_DEFS.filter(d=>d.key==="speed100"||d.key==="rackrush");
    if(focus==="contest")return BOARD_DEFS.filter(d=>d.key==="contest");
    if(focus)return BOARD_DEFS.filter(d=>d.key===focus);
    return BOARD_DEFS.filter(d=>!d.soon);
  }
  function boardParams(def,period,limit,scoped){
    const params={mode:def.mode,limit:limit||8};
    if(def.variant)params.variant=def.variant;
    try{
      if(scoped&&typeof G!=="undefined"){
        if(G.diff)params.difficulty=G.diff;
        const control=G.mode==="battle"?(G.battleControl||"touch"):(G.rush&&G.rush.control)||(VISION&&VISION.enabled?"vision":"touch");
        if(control)params.control=control;
      }
    }catch(e){}
    if(period==="today")params.date=todayDate();
    return params;
  }
  function boardScopeLabel(period,data){
    const cached=data&&data.cached?" · cached":"";
    if(period==="today"){
      if(data&&data.period==="date")return "Today's global records"+cached;
      return "Today's board"+cached;
    }
    return "All-time"+cached;
  }
  function boardRowsMarkup(def,rows){
    if(def.soon)return `<tr><td colspan="4">3PT cloud board coming soon</td></tr>`;
    if(!rows||!rows.length)return `<tr><td colspan="4">No global records yet</td></tr>`;
    const record={mode:def.mode,variant:def.variant};
    return rows.slice(0,8).map(row=>`<tr><td>${row.rank}</td><td>${esc(rowName(row))}</td><td>${rowScoreText(row,record)}</td><td>${row.makes==null?"-":row.makes+"/"+row.attempts}</td></tr>`).join("");
  }
  function boardCardMarkup(def,data,period){
    if(data&&data.ok===false){
      const err=String(data.error||"leaderboard_failed").replace(/^Error:\s*/,"");
      return `<section class="leaderboardCard error"><div class="leaderboardCardHead"><span><small>${period==="today"?"Today's board":"All-time"}</small><b>${esc(def.title)}</b></span><em>${esc(def.hint)}</em></div>
        <div class="note">Load failed: ${esc(err)}<br>Scores resubmit when you're back online.</div>
        <button class="btn sm" onclick="showLeaderboardHub('${esc(period)}','${esc(def.key)}')">Retry</button></section>`;
    }
    const pendingDaily=period==="today"&&data&&!data.soon&&data.period!=="date";
    const rows=pendingDaily?[]:(data&&data.rows||[]);
    return `<section class="leaderboardCard"><div class="leaderboardCardHead"><span><small>${esc(boardScopeLabel(period,data))}</small><b>${esc(def.title)}</b></span><em>${esc(def.hint)}</em></div>
      <table class="std onlineBoard"><tr><td>#</td><td>Player</td><td>${esc(def.scoreLabel)}</td><td>Makes</td></tr>${pendingDaily?`<tr><td colspan="4">Today's board is upgrading — check all‑time for now</td></tr>`:boardRowsMarkup(def,rows)}</table></section>`;
  }
  async function showLeaderboardHub(period,focus){
    if(typeof global.playSFX==="function")global.playSFX("ui_leaderboard_open_01");
    period=period==="all"?"all":"today";
    const defs=boardDefsFor(focus);
    if(!global.AIBALeaderboard||!global.AIBALeaderboard.leaderboard){
      if(typeof toast==="function")toast("Global board unavailable","#ff8d7a");
      return;
    }
    if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">Global leaderboard</h1>
      <div class="leaderboardTabs"><button class="${period==="all"?"on":""}" onclick="showLeaderboardHub('all','${esc(focus||"")}')">All-time</button><button class="${period==="today"?"on":""}" onclick="showLeaderboardHub('today','${esc(focus||"")}')">Today</button></div>
      <div id="leaderboardHubRows" class="leaderboardCards"><div class="note">Loading global records...</div></div><button class="btn sm" onclick="${focus?"goDiff(G.mode,true)":"showMenu()"}">Back</button>`);
    try{
      if(global.AIBALeaderboard&&global.AIBALeaderboard.flush)global.AIBALeaderboard.flush().catch(()=>{});
      const results=await Promise.all(defs.map(def=>def.soon?Promise.resolve({ok:true,rows:[],soon:true}):global.AIBALeaderboard.leaderboard(boardParams(def,period,8,!!focus)).catch(e=>({ok:false,rows:[],error:String(e&&e.message||e)}))));
      const el=document.getElementById("leaderboardHubRows");
      if(el)el.innerHTML=defs.map((def,i)=>boardCardMarkup(def,results[i],period)).join("");
    }catch(e){
      const el=document.getElementById("leaderboardHubRows");
      if(el)el.innerHTML=`<div class="note">Couldn't load the global board — try again later.</div>`;
    }
  }
  async function showOnlineLeaderboardForRecord(record){
    if(typeof global.playSFX==="function")global.playSFX("ui_leaderboard_open_01");
    if(!record||!global.AIBALeaderboard||!global.AIBALeaderboard.leaderboard){
      if(typeof toast==="function")toast("Global board unavailable","#ff8d7a");
      return;
    }
    if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">${modeTitle(record)}</h1><div class="note">Loading the global leaderboard...</div>`);
    try{
      const data=await global.AIBALeaderboard.leaderboard(paramsFor(record,10));
      const rows=data&&data.rows||[];
      const body=rows.length?rows.map(row=>`<tr class="${record.cloudResult&&row.id===record.cloudResult.run_id?"me":""}"><td>${row.rank}</td><td>${esc(rowName(row))}</td><td>${rowScoreText(row,record)}</td><td>${row.makes==null?"-":row.makes+"/"+row.attempts}</td></tr>`).join(""):`<tr><td colspan="4">No global records yet</td></tr>`;
      if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">${modeTitle(record)}</h1><div class="note">${scopeText(record)} · Live global records</div><table class="std onlineBoard"><tr><td>#</td><td>Player</td><td>${record.mode==="percent-battle"||record.variant==="speed100"?"Time":"Score"}</td><td>Makes</td></tr>${body}</table><button class="btn sm" onclick="showMenu()">Back to home</button>`);
    }catch(e){
      if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">${modeTitle(record)}</h1><div class="note">Couldn't load the global board — try again later.</div><button class="btn sm" onclick="showMenu()">Back to home</button>`);
    }
  }

  global.AIBAProfileBarMarkup=profileMarkup;
  global.AIBAProfileMiniMarkup=miniMarkup;
  global.AIBALeaderboardHomeMarkup=homeMarkup;
  global.AIBAModeLeaderboardMarkup=modeMarkup;
  global.showModeUtility=showModeUtility;
  global.savePlayerNameFromInput=savePlayerNameFromInput;
  global.showNicknameEditor=showNicknameEditor;
  global.showLeaderboardHub=showLeaderboardHub;
  global.AIBARecordRankText=recordRankText;
  global.AIBACloudRankMarkup=rankMarkup;
  global.AIBAResultBadgeMarkup=resultBadgeMarkup;
  global.AIBAResultHeaderMarkup=resultHeaderMarkup;
  global.AIBAResultMetricsFor=metricsFor;
  global.showOnlineLeaderboardForRecord=showOnlineLeaderboardForRecord;
  global.AIBALeaderboardUI=Object.freeze({submitRecord,rankMarkup,showOnlineLeaderboardForRecord,refreshProfileUI,resultBadgeMarkup,resultHeaderMarkup,showLeaderboardHub,showModeUtility,homeMarkup,modeMarkup,recordRankText});
  setTimeout(refreshProfileUI,0);
})(window);