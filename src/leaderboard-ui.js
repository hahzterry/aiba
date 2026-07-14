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
    return name&&!isDefaultName(name)?name:"未命名球员";
  }
  function labelControl(v){
    return v==="vision"?"体感控制":"触屏控制";
  }
  function diffName(k){
    try{return DIFFS[k]&&DIFFS[k].n||k||"";}catch(e){return k||"";}
  }
  function modeTitle(record){
    if(!record)return"全球排行榜";
    if(record.mode==="percent-battle")return"百分大战耗时榜";
    if(record.variant==="speed100"||record.mode==="rack-rush-speed100")return"百分竞速榜";
    if(record.mode==="rack-rush")return"投篮机总分榜";
    return"全球排行榜";
  }
  function scopeText(record){
    if(!record)return"全球榜";
    const parts=[diffName(record.difficulty),labelControl(record.control)].filter(Boolean);
    return parts.length?parts.join(" · "):"全球榜";
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
    return `<div class="playerProfile playerProfileOnboard" id="playerProfileBox"><div><small>PLAYER</small><b>取个球场名</b></div><label><span>昵称</span><input id="playerNameInput" maxlength="18" autocomplete="nickname" placeholder="比如 TigerBro" value="" onchange="savePlayerNameFromInput(this.value)" onblur="savePlayerNameFromInput(this.value)"></label><button type="button" onclick="savePlayerNameFromInput(document.getElementById('playerNameInput').value)">上场</button></div>`;
  }
  function miniMarkup(){
    const p=profile(),name=displayName(p);
    if(!name)return `<div class="playerProfile mini needName" id="playerProfileMini"><span>PLAYER</span><b>先取个名</b><button type="button" onclick="showNicknameEditor()">取名</button></div>`;
    return `<div class="playerProfile mini readyName" id="playerProfileMini"><span>PLAYER</span><b>${esc(name)}</b><button type="button" onclick="showNicknameEditor()">改名</button></div>`;
  }
  function homeMarkup(){
    return `<div class="leaderboardDock" aria-label="排行榜入口">
      <button type="button" onclick="showLeaderboardHub('today')"><small>TODAY</small><b>今日榜</b></button>
      <button type="button" onclick="showLeaderboardHub('all')"><small>GLOBAL</small><b>总榜</b></button>
      <button type="button" onclick="copyAIBAChallenge('speed100')"><small>LINK</small><b>好友挑战</b></button>
    </div>`;
  }
  function modeMarkup(mode){
    const focus=mode==="battle"?"battle":(mode==="rackrush"?"rackrush":(mode==="contest"?"contest":""));
    if(!focus)return "";
    return `<nav class="modeUtilityBar" aria-label="模式辅助入口">
      <button type="button" onclick="showModeUtility('${focus}')">排行与挑战</button>
      <button type="button" onclick="AIBAPerfSettings.open()">游戏设置</button>
    </nav>`;
  }
  function showModeUtility(focus){
    focus=focus==="battle"||focus==="rackrush"||focus==="contest"?focus:"speed100";
    const label=focus==="battle"?"百分大战":(focus==="rackrush"?"投篮机":"三分挑战");
    if(typeof showPanel!=="function")return;
    showPanel(`<h1 class="title" style="font-size:22px">排行与挑战</h1><div class="note">${esc(label)} · 全球记录与好友同题挑战</div>
      <div class="modeUtilityMenu"><button class="btn" type="button" onclick="showLeaderboardHub('today','${focus}')">今日榜</button><button class="btn" type="button" onclick="showLeaderboardHub('all','${focus}')">全球总榜</button><button class="btn gold" type="button" onclick="copyAIBAChallenge('${focus}')">复制挑战链接</button></div>
      <button class="btn sm" type="button" onclick="goDiff(G.mode,true)">返回难度</button>`);
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
        if(typeof toast==="function")toast(clean?"昵称已记住":"下次可再取名","#7CFC6B");
      }
    }catch(e){
      if(typeof toast==="function")toast("昵称已保存在本机,稍后同步","#ffd23f");
    }
  }
  function showNicknameEditor(returnTo){
    const p=profile(),name=displayName(p);
    if(typeof showPanel!=="function")return;
    const back=returnTo==="settings"?"AIBAPerfSettings.open()":"goDiff(G.mode||'rackrush')";
    showPanel(`<h1 class="title" style="font-size:22px">取个球场名</h1><div class="note">用于成绩单、精彩视频和全球排行榜。下次打开会自动记住。</div><div class="playerNameEditor"><input id="playerNameInput" maxlength="18" autocomplete="nickname" placeholder="输入你的昵称" value="${esc(name)}"><button class="btn gold" onclick="savePlayerNameFromInput(document.getElementById('playerNameInput').value)">保存昵称</button></div><button class="btn sm" onclick="${back}">返回</button>`);
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
    if(score>=92)return {cls:"legend",title:"传奇手感",stamp:"LEGENDARY / 传奇",line:"这一局已经有点像球馆传说。"};
    if(score>=84)return {cls:"silver",title:"精英射手",stamp:"SILVER / 精英",line:"手感够硬,已经能让排行榜紧张。"};
    if(score>=74)return {cls:"bronze",title:"稳定火力",stamp:"BRONZE / 稳定",line:"节奏能带起来,下一局可以冲更狠。"};
    if(score>=64)return {cls:"copper",title:"有点东西",stamp:"COPPER / 热手",line:"不是路人,这手感值得再来一把。"};
    if(score>=52)return {cls:"steel",title:"新兵上路",stamp:"STEEL / 新兵",line:"姿势已经上路,先把节奏稳住。"};
    if(score>=38)return {cls:"slate",title:"板凳沉思",stamp:"SLATE / 加练",line:"别慌,球馆也需要一点喜剧效果。"};
    return {cls:"ash",title:"灰阶手感",stamp:"灰色地带",line:"先别急着发朋友圈,回去加练两组。"};
  }
  function radarMarkup(m){
    const vals=[["命中",m.accuracy],["稳定",m.stability],["节奏",m.pace],["关键",m.clutch],["难度",m.diff]];
    const cx=62,cy=62,r=42;
    const pts=vals.map((x,i)=>{const a=-Math.PI/2+i*Math.PI*2/5,rr=r*clamp(x[1],0,100)/100;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr];}).map(p=>p.map(n=>n.toFixed(1)).join(",")).join(" ");
    const grid=[.33,.66,1].map(k=>vals.map((x,i)=>{const a=-Math.PI/2+i*Math.PI*2/5,rr=r*k;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr].map(n=>n.toFixed(1)).join(",");}).join(" ")).map(p=>`<polygon points="${p}"></polygon>`).join("");
    const labels=vals.map((x,i)=>{const a=-Math.PI/2+i*Math.PI*2/5,rr=r+14;return `<text x="${(cx+Math.cos(a)*rr).toFixed(1)}" y="${(cy+Math.sin(a)*rr+4).toFixed(1)}">${esc(x[0])}</text>`;}).join("");
    return `<svg class="resultRadar" viewBox="0 0 124 124" aria-label="表现雷达图"><g class="grid">${grid}</g><polygon class="shape" points="${pts}"></polygon><g class="labels">${labels}</g></svg>`;
  }
  function statMarkup(record,m){
    if(record&&record.mode==="percent-battle")return `<span><b>${record.score||0}:${record.opponentScore||0}</b><small>最终比分</small></span><span><b>${timeText(m.elapsed)}</b><small>百分耗时</small></span><span><b>${record.deepMakes||0}/${record.deepAttempts||0}</b><small>中场球</small></span>`;
    if(record&&(record.variant==="speed100"||record.mode==="rack-rush-speed100"))return `<span><b>${timeText(m.elapsed)}</b><small>冲线时间</small></span><span><b>${m.makes}/${m.attempts}</b><small>命中</small></span><span><b>${Math.round(m.rawAccuracy)}%</b><small>命中率</small></span>`;
    return `<span><b>${m.total}</b><small>总分</small></span><span><b>${m.makes}/${m.attempts}</b><small>命中</small></span><span><b>x${record&&record.bestStreak||0}</b><small>最高连中</small></span>`;
  }
  function resultBadgeMarkup(record){
    if(!record)return"";
    const m=metricsFor(record),tier=tierFor(m.score),p=profile(),name=displayName(p)||"aiBA PLAYER";
    return `<section class="resultHeroCard resultTier-${tier.cls} ${tier.cls}"><i class="resultCorner tl"></i><i class="resultCorner tr"></i><i class="resultCorner bl"></i><i class="resultCorner br"></i><div class="resultIdentity"><small>POSTGAME TITLE</small><b>${esc(tier.title)}</b><span>${esc(name)} · ${m.score} DNA</span><em>${esc(tier.line)}</em></div><div class="resultRadarWrap">${radarMarkup(m)}</div><div class="resultStatGrid">${statMarkup(record,m)}</div></section>`;
  }
  function resultHeaderMarkup(record,opts){
    opts=opts||{};const m=metricsFor(record),tier=tierFor(m.score);
    return `<section class="resultScoreHero resultTier-${tier.cls}"><div class="resultModeLine"><b>${esc(opts.headline||"挑战完成")}</b><span>${esc(opts.mode||"POSTGAME COMPLETE")}</span></div><div class="resultScoreValue">${esc(opts.score||recordScoreText(record))}</div><div class="resultStamp">${esc(tier.stamp)}</div><div class="resultScoreLabel">${esc(opts.label||"FINAL RESULT")}</div></section>`;
  }
  function keyFor(record){
    if(!record._cloudKey)record._cloudKey="cloudRank"+(++seq);
    return record._cloudKey;
  }
  function rankLine(record){
    const res=record&&record.cloudResult;
    if(record&&record.cloudStatus==="syncing")return {cls:"pending",main:"同步全球排名中",sub:scopeText(record)};
    if(res&&res.ok&&res.rank)return {cls:"ok",main:"全球排名 #"+res.rank+" / "+(res.total||"?"),sub:scopeText(record)+" · "+recordScoreText(record)};
    if(res&&res.queued)return {cls:"queued",main:"已进入离线队列",sub:"网络恢复后自动补交"};
    if(res&&!res.ok)return {cls:"queued",main:"本机成绩已保存",sub:"全球排名暂时不可用"};
    return {cls:"pending",main:"等待全球排名",sub:scopeText(record)};
  }
  function recordRankText(record){
    const line=rankLine(record);
    return line&&line.cls==="ok"?line.main:"全球排名同步中";
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
    {key:"speed100",title:"百分竞速",mode:"rack-rush-speed100",variant:"speed100",hint:"100 分冲线",scoreLabel:"用时"},
    {key:"battle",title:"百分大战",mode:"percent-battle",variant:"",hint:"先到 100",scoreLabel:"用时"},
    {key:"rackrush",title:"投篮机闯关",mode:"rack-rush",variant:"classic",hint:"最高总分",scoreLabel:"分数"},
    {key:"contest",title:"三分大赛",mode:"three-point-contest",variant:"classic",hint:"经典 70 秒",scoreLabel:"分数",soon:true}
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
    const cached=data&&data.cached?" · 缓存":"";
    if(period==="today"){
      if(data&&data.period==="date")return "今日全球记录"+cached;
      return "今日榜"+cached;
    }
    return "全球总榜"+cached;
  }
  function boardRowsMarkup(def,rows){
    if(def.soon)return `<tr><td colspan="4">三分大赛云端榜稍后接入</td></tr>`;
    if(!rows||!rows.length)return `<tr><td colspan="4">暂无全球记录</td></tr>`;
    const record={mode:def.mode,variant:def.variant};
    return rows.slice(0,8).map(row=>`<tr><td>${row.rank}</td><td>${esc(rowName(row))}</td><td>${rowScoreText(row,record)}</td><td>${row.makes==null?"-":row.makes+"/"+row.attempts}</td></tr>`).join("");
  }
  function boardCardMarkup(def,data,period){
    if(data&&data.ok===false){
      const err=String(data.error||"leaderboard_failed").replace(/^Error:\s*/,"");
      return `<section class="leaderboardCard error"><div class="leaderboardCardHead"><span><small>${period==="today"?"今日榜":"全球总榜"}</small><b>${esc(def.title)}</b></span><em>${esc(def.hint)}</em></div>
        <div class="note">读取失败：${esc(err)}<br>网络恢复后成绩会继续补交。</div>
        <button class="btn sm" onclick="showLeaderboardHub('${esc(period)}','${esc(def.key)}')">重试</button></section>`;
    }
    const pendingDaily=period==="today"&&data&&!data.soon&&data.period!=="date";
    const rows=pendingDaily?[]:(data&&data.rows||[]);
    return `<section class="leaderboardCard"><div class="leaderboardCardHead"><span><small>${esc(boardScopeLabel(period,data))}</small><b>${esc(def.title)}</b></span><em>${esc(def.hint)}</em></div>
      <table class="std onlineBoard"><tr><td>#</td><td>玩家</td><td>${esc(def.scoreLabel)}</td><td>命中</td></tr>${pendingDaily?`<tr><td colspan="4">今日榜服务升级中,可先查看总榜</td></tr>`:boardRowsMarkup(def,rows)}</table>
      <button class="btn sm" onclick="copyAIBAChallenge('${def.key}')">复制同题挑战</button></section>`;
  }
  async function showLeaderboardHub(period,focus){
    if(typeof global.playSFX==="function")global.playSFX("ui_leaderboard_open_01");
    period=period==="all"?"all":"today";
    const defs=boardDefsFor(focus);
    if(!global.AIBALeaderboard||!global.AIBALeaderboard.leaderboard){
      if(typeof toast==="function")toast("全球排行榜暂不可用","#ff8d7a");
      return;
    }
    if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">全球排行榜</h1>
      <div class="leaderboardTabs"><button class="${period==="today"?"on":""}" onclick="showLeaderboardHub('today','${esc(focus||"")}')">今日榜</button><button class="${period==="all"?"on":""}" onclick="showLeaderboardHub('all','${esc(focus||"")}')">总榜</button><button onclick="copyAIBAChallenge('${esc(focus||"speed100")}')">好友挑战</button></div>
      <div id="leaderboardHubRows" class="leaderboardCards"><div class="note">正在读取全球记录...</div></div><button class="btn sm" onclick="${focus?"goDiff(G.mode,true)":"showMenu()"}">返回</button>`);
    try{
      if(global.AIBALeaderboard&&global.AIBALeaderboard.flush)global.AIBALeaderboard.flush().catch(()=>{});
      const results=await Promise.all(defs.map(def=>def.soon?Promise.resolve({ok:true,rows:[],soon:true}):global.AIBALeaderboard.leaderboard(boardParams(def,period,8,!!focus)).catch(e=>({ok:false,rows:[],error:String(e&&e.message||e)}))));
      const el=document.getElementById("leaderboardHubRows");
      if(el)el.innerHTML=defs.map((def,i)=>boardCardMarkup(def,results[i],period)).join("");
    }catch(e){
      const el=document.getElementById("leaderboardHubRows");
      if(el)el.innerHTML=`<div class="note">全球排行榜读取失败,稍后再试。</div>`;
    }
  }
  function challengeUrlFor(key){
    let url=location.href;
    try{
      const u=new URL(location.href);
      u.searchParams.delete("player_id");u.searchParams.delete("player_tag");
      if(key==="battle"){u.searchParams.set("mode","battle");u.searchParams.delete("submode");}
      else if(key==="contest"){u.searchParams.set("mode","contest");u.searchParams.delete("submode");}
      else if(key==="rackrush"){u.searchParams.set("mode","rackrush");u.searchParams.delete("submode");}
      else{u.searchParams.set("mode","rackrush");u.searchParams.set("submode","speed100");}
      try{if(typeof G!=="undefined"&&G.diff)u.searchParams.set("diff",G.diff);}catch(e){}
      try{if(typeof GAME_SEED!=="undefined")u.searchParams.set("seed",GAME_SEED);}catch(e){}
      url=u.toString();
    }catch(e){}
    return url;
  }
  async function copyChallenge(key){
    key=key==="battle"||key==="rackrush"||key==="contest"||key==="speed100"?key:"speed100";
    const def=BOARD_DEFS.find(d=>d.key===key)||(key==="battle"?BOARD_DEFS[1]:BOARD_DEFS[0]);
    const text=`来挑战我的 aiBA 赛道: ${def.title}\n${def.hint} · 打完自动进全球榜\n${challengeUrlFor(key)}`;
    try{if(navigator.share){await navigator.share({title:"aiBA "+def.title,text,url:challengeUrlFor(key)});return;}}catch(e){if(e&&e.name==="AbortError")return;}
    try{await navigator.clipboard.writeText(text);if(typeof toast==="function")toast("好友挑战链接已复制","#7CFC6B");}
    catch(e){if(typeof toast==="function")toast("复制失败,可以手动分享当前链接","#ffd23f");}
  }
  async function showOnlineLeaderboardForRecord(record){
    if(typeof global.playSFX==="function")global.playSFX("ui_leaderboard_open_01");
    if(!record||!global.AIBALeaderboard||!global.AIBALeaderboard.leaderboard){
      if(typeof toast==="function")toast("全球排行榜暂不可用","#ff8d7a");
      return;
    }
    if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">${modeTitle(record)}</h1><div class="note">正在读取全球排行榜...</div>`);
    try{
      const data=await global.AIBALeaderboard.leaderboard(paramsFor(record,10));
      const rows=data&&data.rows||[];
      const body=rows.length?rows.map(row=>`<tr class="${record.cloudResult&&row.id===record.cloudResult.run_id?"me":""}"><td>${row.rank}</td><td>${esc(rowName(row))}</td><td>${rowScoreText(row,record)}</td><td>${row.makes==null?"-":row.makes+"/"+row.attempts}</td></tr>`).join(""):`<tr><td colspan="4">暂无全球记录</td></tr>`;
      if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">${modeTitle(record)}</h1><div class="note">${scopeText(record)} · 全球实时记录</div><table class="std onlineBoard"><tr><td>#</td><td>玩家</td><td>${record.mode==="percent-battle"||record.variant==="speed100"?"用时":"分数"}</td><td>命中</td></tr>${body}</table><button class="btn sm" onclick="showMenu()">返回封面</button>`);
    }catch(e){
      if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">${modeTitle(record)}</h1><div class="note">全球排行榜读取失败,稍后再试。</div><button class="btn sm" onclick="showMenu()">返回封面</button>`);
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
  global.copyAIBAChallenge=copyChallenge;
  global.AIBARecordRankText=recordRankText;
  global.AIBACloudRankMarkup=rankMarkup;
  global.AIBAResultBadgeMarkup=resultBadgeMarkup;
  global.AIBAResultHeaderMarkup=resultHeaderMarkup;
  global.AIBAResultMetricsFor=metricsFor;
  global.showOnlineLeaderboardForRecord=showOnlineLeaderboardForRecord;
  global.AIBALeaderboardUI=Object.freeze({submitRecord,rankMarkup,showOnlineLeaderboardForRecord,refreshProfileUI,resultBadgeMarkup,resultHeaderMarkup,showLeaderboardHub,showModeUtility,copyChallenge,homeMarkup,modeMarkup,recordRankText});
  setTimeout(refreshProfileUI,0);
})(window);
