(function(global){
  "use strict";

  const QUEUE_KEY="aiba_leaderboard_queue_v1";
  const BOARD_CACHE_KEY="aiba_leaderboard_cache_v1";
  const API=(global.AIBA_CONFIG&&global.AIBA_CONFIG.LEADERBOARD_API)||"";
  const SUBMIT_TIMEOUT=6500;
  const BOARD_TIMEOUT=7500;

  function readQueue(){
    try{const q=JSON.parse(localStorage.getItem(QUEUE_KEY)||"[]");return Array.isArray(q)?q:[];}catch(e){return [];}
  }
  function writeQueue(q){
    try{localStorage.setItem(QUEUE_KEY,JSON.stringify(q.slice(-30)));}catch(e){}
  }
  function recordKey(record){
    record=record||{};
    return [record.mode||"",record.variant||"",record.completedAt||record.client_created_at||"",record.elapsed_ms||record.elapsedMs||"",record.score==null?record.total:record.score].join("|");
  }
  function enqueue(record){
    const key=recordKey(record);
    const q=readQueue().filter(item=>item&&item.key!==key&&recordKey(item.record)!==key);
    q.push({key,record,queued_at:new Date().toISOString()});writeQueue(q);
  }
  function cacheKey(params){
    return Object.keys(params||{}).sort().map(k=>k+"="+String(params[k])).join("&");
  }
  function readBoardCache(key){
    try{const all=JSON.parse(localStorage.getItem(BOARD_CACHE_KEY)||"{}");return all&&all[key]&&all[key].data?{...all[key].data,cached:true,cached_at:all[key].at}:null;}catch(e){return null;}
  }
  function writeBoardCache(key,data){
    if(!data||data.ok===false)return;
    try{
      const all=JSON.parse(localStorage.getItem(BOARD_CACHE_KEY)||"{}")||{};
      all[key]={at:new Date().toISOString(),data};
      const keys=Object.keys(all).sort((a,b)=>String(all[b].at).localeCompare(String(all[a].at)));
      keys.slice(24).forEach(k=>delete all[k]);
      localStorage.setItem(BOARD_CACHE_KEY,JSON.stringify(all));
    }catch(e){}
  }
  function modeOf(record){
    if(record.mode)return record.mode;
    if(record.variant==="speed100")return"rack-rush-speed100";
    return"unknown";
  }
  function normalize(record){
    const mode=modeOf(record),speed=record.variant==="speed100"||mode==="rack-rush-speed100";
    return {
      ...record,
      mode,
      score:record.score==null?record.total:record.score,
      elapsed_ms:record.elapsed_ms==null?record.elapsedMs:record.elapsed_ms,
      best_streak:record.best_streak==null?record.bestStreak:record.best_streak,
      game_version:record.game_version||record.version,
      star_id:record.star_id||record.playerId,
      star_name:record.star_name||record.playerName,
      opponent_id:record.opponent_id||record.opponentId,
      opponent_name:record.opponent_name||record.opponentName,
      eligible:record.eligible!==false&&(speed?((record.total||record.score)>=100):true)
    };
  }
  async function fetchJson(url,opts,timeoutMs){
    const ctrl=typeof AbortController!=="undefined"?new AbortController():null;
    const timer=ctrl?setTimeout(()=>ctrl.abort(),timeoutMs||SUBMIT_TIMEOUT):0;
    try{
      const res=await fetch(url,{...(opts||{}),signal:ctrl?ctrl.signal:opts&&opts.signal});
      if(!res.ok)throw new Error("http_"+res.status);
      const data=await res.json();
      if(data&&data.ok===false)throw new Error(data.error||"api_failed");
      return data;
    }catch(e){
      const msg=e&&e.name==="AbortError"?"timeout":String(e&&e.message||e);
      throw new Error(msg);
    }finally{
      if(timer)clearTimeout(timer);
    }
  }
  async function submit(record,opts){
    if(!API||!global.AIBAIdentity)return {ok:false,queued:true,error:"leaderboard_unavailable"};
    let payload=normalize(record||{});
    try{
      const identity=await global.AIBAIdentity.ensure({game_version:record&&record.version});
      const headers=global.AIBAIdentity.authHeaders();
      if(!headers)throw new Error("identity_missing");
      payload=normalize({...record,nickname:identity.display_name,cloud_player_id:identity.player_id});
      return await fetchJson(API+"/v1/runs",{method:"POST",headers:{"Content-Type":"application/json",...headers},body:JSON.stringify(payload)},SUBMIT_TIMEOUT);
    }catch(e){
      if(!opts||opts.queue!==false)enqueue(payload);
      return {ok:false,queued:true,error:String(e&&e.message||e)};
    }
  }
  async function flush(){
    const q=readQueue();if(!q.length)return {ok:true,flushed:0};
    const left=[];let ok=0;
    for(const item of q){
      const res=await submit(item.record,{queue:false});
      if(res&&res.ok)ok++;else left.push(item);
    }
    writeQueue(left);
    return {ok:true,flushed:ok,left:left.length};
  }
  async function leaderboard(params){
    if(!API)return {ok:false,rows:[],error:"leaderboard_unavailable"};
    const u=new URL(API+"/v1/leaderboards");
    Object.entries(params||{}).forEach(([k,v])=>{if(v!=null&&v!=="")u.searchParams.set(k,v);});
    const key=cacheKey(params||{});
    try{
      const data=await fetchJson(u.toString(),{},BOARD_TIMEOUT);
      writeBoardCache(key,data);
      return data;
    }catch(e){
      // A short retry masks transient Worker cold starts or mobile radio stalls.
      await new Promise(r=>setTimeout(r,450));
      try{
        const data=await fetchJson(u.toString(),{},BOARD_TIMEOUT);
        writeBoardCache(key,data);
        return data;
      }catch(err){
        const cached=readBoardCache(key);
        if(cached)return cached;
        throw err;
      }
    }
  }
  function attach(record){
    const p=global.AIBAIdentity&&global.AIBAIdentity.publicProfile?global.AIBAIdentity.publicProfile():null;
    return p?{...record,cloudPlayerId:p.player_id||"",nickname:p.display_name||""}:record;
  }

  global.AIBALeaderboard=Object.freeze({submit,flush,leaderboard,attach,queueSize:()=>readQueue().length});
  setTimeout(()=>flush().catch(()=>{}),900);
  addEventListener("online",()=>flush().catch(()=>{}));
})(window);
