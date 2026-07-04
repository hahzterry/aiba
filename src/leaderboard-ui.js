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
  function labelControl(v){
    return v==="vision"?"视觉体感":"触屏 / 键盘";
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
  function showNicknameEditor(){
    const p=profile(),name=displayName(p);
    if(typeof showPanel!=="function")return;
    showPanel(`<h1 class="title" style="font-size:22px">取个球场名</h1><div class="note">用于成绩单、精彩视频和全球排行榜。下次打开会自动记住。</div><div class="playerNameEditor"><input id="playerNameInput" maxlength="18" autocomplete="nickname" placeholder="输入你的昵称" value="${esc(name)}"><button class="btn gold" onclick="savePlayerNameFromInput(document.getElementById('playerNameInput').value)">保存昵称</button></div><button class="btn sm" onclick="goDiff(G.mode||'rackrush')">返回选择难度</button><button class="btn sm" onclick="showMenu()">返回封面</button>`);
    setTimeout(()=>{const el=document.getElementById("playerNameInput");if(el)el.focus();},0);
  }
  function clamp(v,min,max){
    return Math.max(min,Math.min(max,v));
  }
  function metricsFor(record){
    const attempts=Number(record&&record.attempts)||0,makes=Number(record&&record.makes)||0;
    const accuracy=attempts?clamp(makes/attempts*100,0,100):0;
    const streak=clamp((Number(record&&record.bestStreak)||Number(record&&record.best_streak)||0)*14,0,100);
    const elapsed=Number(record&&record.elapsedMs)||Number(record&&record.elapsed_ms)||0;
    const total=Number(record&&record.total)||Number(record&&record.score)||0;
    const pace=elapsed&&attempts?clamp(attempts/(elapsed/60000)*6,24,100):60;
    const diff=record&&record.difficulty==="hard"?92:(record&&record.difficulty==="normal"?76:58);
    let clutch=clamp(total,30,100);
    if(record&&record.mode==="percent-battle")clutch=record.won?88:58;
    if(record&&(record.variant==="speed100"||record.mode==="rack-rush-speed100"))clutch=clamp(112-((elapsed/1000)-85)*.36,38,100);
    const score=clamp(Math.round(accuracy*.34+streak*.17+pace*.16+clutch*.23+diff*.1),0,100);
    return {accuracy,streak,pace,clutch,diff,score,attempts,makes,total,elapsed};
  }
  function tierFor(score){
    if(score>=92)return {cls:"legend",title:"传奇手感",line:"这一局已经有点像球馆传说。"};
    if(score>=84)return {cls:"elite",title:"百分狠人",line:"敢投关键球的人,排行榜会记住。"};
    if(score>=74)return {cls:"captain",title:"球馆小队长",line:"节奏能带起来,手也够硬。"};
    if(score>=64)return {cls:"spark",title:"有点东西",line:"不是路人,这手感值得再冲一把。"};
    if(score>=52)return {cls:"rookie",title:"新兵蛋子",line:"姿势已经上路,下一局先把节奏稳住。"};
    if(score>=38)return {cls:"granny",title:"老奶奶水平",line:"别慌,球馆也需要一点喜剧效果。"};
    return {cls:"kid",title:"小学三年级水平",line:"先别急着发朋友圈,回去加练两组。"};
  }
  function radarMarkup(m){
    const vals=[["命中",m.accuracy],["连中",m.streak],["节奏",m.pace],["关键",m.clutch],["难度",m.diff]];
    const cx=62,cy=62,r=42;
    const pts=vals.map((x,i)=>{const a=-Math.PI/2+i*Math.PI*2/5,rr=r*clamp(x[1],0,100)/100;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr];}).map(p=>p.map(n=>n.toFixed(1)).join(",")).join(" ");
    const grid=[.33,.66,1].map(k=>vals.map((x,i)=>{const a=-Math.PI/2+i*Math.PI*2/5,rr=r*k;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr].map(n=>n.toFixed(1)).join(",");}).join(" ")).map(p=>`<polygon points="${p}"></polygon>`).join("");
    const labels=vals.map((x,i)=>{const a=-Math.PI/2+i*Math.PI*2/5,rr=r+14;return `<text x="${(cx+Math.cos(a)*rr).toFixed(1)}" y="${(cy+Math.sin(a)*rr+4).toFixed(1)}">${esc(x[0])}</text>`;}).join("");
    return `<svg class="resultRadar" viewBox="0 0 124 124" aria-label="表现雷达图"><g class="grid">${grid}</g><polygon class="shape" points="${pts}"></polygon><g class="labels">${labels}</g></svg>`;
  }
  function statMarkup(record,m){
    if(record&&record.mode==="percent-battle")return `<span><b>${record.score||0}:${record.opponentScore||0}</b><small>最终比分</small></span><span><b>${timeText(m.elapsed)}</b><small>百分耗时</small></span><span><b>${record.deepMakes||0}/${record.deepAttempts||0}</b><small>中场球</small></span>`;
    if(record&&(record.variant==="speed100"||record.mode==="rack-rush-speed100"))return `<span><b>${timeText(m.elapsed)}</b><small>冲线时间</small></span><span><b>${m.makes}/${m.attempts}</b><small>命中</small></span><span><b>${Math.round(m.accuracy)}%</b><small>命中率</small></span>`;
    return `<span><b>${m.total}</b><small>总分</small></span><span><b>${m.makes}/${m.attempts}</b><small>命中</small></span><span><b>x${record&&record.bestStreak||0}</b><small>最高连中</small></span>`;
  }
  function resultBadgeMarkup(record){
    if(!record)return"";
    const m=metricsFor(record),tier=tierFor(m.score),p=profile(),name=displayName(p)||"aiBA PLAYER";
    return `<section class="resultHeroCard ${tier.cls}"><div class="resultIdentity"><small>POSTGAME TITLE</small><b>${esc(tier.title)}</b><span>${esc(name)} · ${m.score} DNA</span><em>${esc(tier.line)}</em></div><div class="resultRadarWrap">${radarMarkup(m)}</div><div class="resultStatGrid">${statMarkup(record,m)}</div></section>`;
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
  function updateRank(record){
    if(!record)return;
    const key=keyFor(record),el=document.getElementById(key);
    const line=rankLine(record);
    global.__aibaLastCloudRankText=line.main;
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
  async function showOnlineLeaderboardForRecord(record){
    if(!record||!global.AIBALeaderboard||!global.AIBALeaderboard.leaderboard){
      if(typeof toast==="function")toast("全球排行榜暂不可用","#ff8d7a");
      return;
    }
    if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">${modeTitle(record)}</h1><div class="note">正在读取全球排行榜...</div>`);
    try{
      const data=await global.AIBALeaderboard.leaderboard(paramsFor(record,10));
      const rows=data&&data.rows||[];
      const body=rows.length?rows.map(row=>`<tr class="${record.cloudResult&&row.id===record.cloudResult.run_id?"me":""}"><td>${row.rank}</td><td>${esc(row.display_name||"未命名球员")}</td><td>${rowScoreText(row,record)}</td><td>${row.makes==null?"-":row.makes+"/"+row.attempts}</td></tr>`).join(""):`<tr><td colspan="4">暂无全球记录</td></tr>`;
      if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">${modeTitle(record)}</h1><div class="note">${scopeText(record)} · 全球实时记录</div><table class="std onlineBoard"><tr><td>#</td><td>玩家</td><td>${record.mode==="percent-battle"||record.variant==="speed100"?"用时":"分数"}</td><td>命中</td></tr>${body}</table><button class="btn sm" onclick="showMenu()">返回封面</button>`);
    }catch(e){
      if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">${modeTitle(record)}</h1><div class="note">全球排行榜读取失败,稍后再试。</div><button class="btn sm" onclick="showMenu()">返回封面</button>`);
    }
  }

  global.AIBAProfileBarMarkup=profileMarkup;
  global.AIBAProfileMiniMarkup=miniMarkup;
  global.savePlayerNameFromInput=savePlayerNameFromInput;
  global.showNicknameEditor=showNicknameEditor;
  global.AIBACloudRankMarkup=rankMarkup;
  global.AIBAResultBadgeMarkup=resultBadgeMarkup;
  global.showOnlineLeaderboardForRecord=showOnlineLeaderboardForRecord;
  global.AIBALeaderboardUI=Object.freeze({submitRecord,rankMarkup,showOnlineLeaderboardForRecord,refreshProfileUI,resultBadgeMarkup});
  setTimeout(refreshProfileUI,0);
})(window);
