(function(global){
  "use strict";

  let seq=0;
  function esc(v){
    return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }
  function profile(){
    return global.AIBAIdentity&&global.AIBAIdentity.publicProfile?global.AIBAIdentity.publicProfile():{display_name:"",player_tag:"",online:false};
  }
  function labelControl(v){
    return v==="vision"?"视觉体感":"触屏 / 键盘";
  }
  function diffName(k){
    try{return DIFFS[k]&&DIFFS[k].n||k||"";}catch(e){return k||"";}
  }
  function modeTitle(record){
    if(!record)return"在线排行榜";
    if(record.mode==="percent-battle")return"百分大战耗时榜";
    if(record.variant==="speed100"||record.mode==="rack-rush-speed100")return"百分竞速榜";
    if(record.mode==="rack-rush")return"RACK RUSH 总分榜";
    return"在线排行榜";
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
    const p=profile(),name=p.display_name||"";
    return `<div class="playerProfile" id="playerProfileBox"><div><small>PLAYER ID</small><b id="playerProfileTag">${p.player_tag?"#"+esc(p.player_tag):(p.online?"ONLINE":"LOCAL")}</b></div><label><span>昵称</span><input id="playerNameInput" maxlength="18" autocomplete="nickname" placeholder="输入你的昵称" value="${esc(name)}" onchange="savePlayerNameFromInput(this.value)" onblur="savePlayerNameFromInput(this.value)"></label><button type="button" onclick="savePlayerNameFromInput(document.getElementById('playerNameInput').value)">保存</button></div>`;
  }
  function miniMarkup(){
    const p=profile();
    return `<div class="playerProfile mini" id="playerProfileMini"><span>PLAYER</span><b>${esc(p.display_name||"未命名球员")}</b><em>${p.player_tag?"#"+esc(p.player_tag):"本机缓存"}</em></div>`;
  }
  function refreshProfileUI(){
    const p=profile();
    const tag=document.getElementById("playerProfileTag");
    if(tag)tag.textContent=p.player_tag?"#"+p.player_tag:(p.online?"ONLINE":"LOCAL");
    const input=document.getElementById("playerNameInput");
    if(input&&document.activeElement!==input)input.value=p.display_name||"";
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
        if(typeof toast==="function")toast(clean?"昵称已保存":"已使用默认 Rookie ID","#7CFC6B");
      }
    }catch(e){
      if(typeof toast==="function")toast("昵称已保存在本机,稍后同步","#ffd23f");
    }
  }
  function keyFor(record){
    if(!record._cloudKey)record._cloudKey="cloudRank"+(++seq);
    return record._cloudKey;
  }
  function rankLine(record){
    const res=record&&record.cloudResult;
    if(record&&record.cloudStatus==="syncing")return {cls:"pending",main:"同步云端排名中...",sub:scopeText(record)};
    if(res&&res.ok&&res.rank)return {cls:"ok",main:"云端第 "+res.rank+" / "+(res.total||"?")+" 名",sub:scopeText(record)+" · "+recordScoreText(record)};
    if(res&&res.queued)return {cls:"queued",main:"已进入离线队列",sub:"网络恢复后自动补交"};
    if(res&&!res.ok)return {cls:"queued",main:"本机成绩已保存",sub:"云端暂时不可用"};
    return {cls:"pending",main:"等待云端排名",sub:scopeText(record)};
  }
  function updateRank(record){
    if(!record)return;
    const key=keyFor(record),el=document.getElementById(key);
    const line=rankLine(record);
    global.__aibaLastCloudRankText=line.main;
    if(!el)return;
    el.className="cloudRankBox "+line.cls;
    el.innerHTML=`<small>ONLINE RANK</small><b>${esc(line.main)}</b><span>${esc(line.sub)}</span>`;
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
    return `<div id="${key}" class="cloudRankBox ${line.cls}"><small>ONLINE RANK</small><b>${esc(line.main)}</b><span>${esc(line.sub)}</span></div>`;
  }
  async function showOnlineLeaderboardForRecord(record){
    if(!record||!global.AIBALeaderboard||!global.AIBALeaderboard.leaderboard){
      if(typeof toast==="function")toast("在线排行榜暂不可用","#ff8d7a");
      return;
    }
    if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">${modeTitle(record)}</h1><div class="note">正在读取云端排行榜...</div>`);
    try{
      const data=await global.AIBALeaderboard.leaderboard(paramsFor(record,10));
      const rows=data&&data.rows||[];
      const body=rows.length?rows.map(row=>`<tr class="${record.cloudResult&&row.id===record.cloudResult.run_id?"me":""}"><td>${row.rank}</td><td>${esc(row.display_name||"Rookie")}<br><small>#${esc(row.player_tag||"")}</small></td><td>${rowScoreText(row,record)}</td><td>${row.makes==null?"-":row.makes+"/"+row.attempts}</td></tr>`).join(""):`<tr><td colspan="4">暂无云端记录</td></tr>`;
      if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">${modeTitle(record)}</h1><div class="note">${scopeText(record)} · 云端实时记录</div><table class="std onlineBoard"><tr><td>#</td><td>玩家</td><td>${record.mode==="percent-battle"||record.variant==="speed100"?"用时":"分数"}</td><td>命中</td></tr>${body}</table><button class="btn sm" onclick="showMenu()">返回封面</button>`);
    }catch(e){
      if(typeof showPanel==="function")showPanel(`<h1 class="title" style="font-size:22px">${modeTitle(record)}</h1><div class="note">云端排行榜读取失败,稍后再试。</div><button class="btn sm" onclick="showMenu()">返回封面</button>`);
    }
  }

  global.AIBAProfileBarMarkup=profileMarkup;
  global.AIBAProfileMiniMarkup=miniMarkup;
  global.savePlayerNameFromInput=savePlayerNameFromInput;
  global.AIBACloudRankMarkup=rankMarkup;
  global.showOnlineLeaderboardForRecord=showOnlineLeaderboardForRecord;
  global.AIBALeaderboardUI=Object.freeze({submitRecord,rankMarkup,showOnlineLeaderboardForRecord,refreshProfileUI});
  setTimeout(refreshProfileUI,0);
})(window);
