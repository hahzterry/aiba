(function(global){
  "use strict";

  const QUEUE_KEY="aiba_leaderboard_queue_v1";
  const API=(global.AIBA_CONFIG&&global.AIBA_CONFIG.LEADERBOARD_API)||"";

  function readQueue(){
    try{const q=JSON.parse(localStorage.getItem(QUEUE_KEY)||"[]");return Array.isArray(q)?q:[];}catch(e){return [];}
  }
  function writeQueue(q){
    try{localStorage.setItem(QUEUE_KEY,JSON.stringify(q.slice(-30)));}catch(e){}
  }
  function enqueue(record){
    const q=readQueue();q.push({record,queued_at:new Date().toISOString()});writeQueue(q);
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
  async function submit(record,opts){
    if(!API||!global.AIBAIdentity)return {ok:false,queued:true,error:"leaderboard_unavailable"};
    let payload=normalize(record||{});
    try{
      const identity=await global.AIBAIdentity.ensure({game_version:record&&record.version});
      const headers=global.AIBAIdentity.authHeaders();
      if(!headers)throw new Error("identity_missing");
      payload=normalize({...record,nickname:identity.display_name,cloud_player_id:identity.player_id});
      const res=await fetch(API+"/v1/runs",{method:"POST",headers:{"Content-Type":"application/json",...headers},body:JSON.stringify(payload)});
      if(!res.ok)throw new Error("run_submit_failed_"+res.status);
      const data=await res.json();
      if(!data.ok)throw new Error(data.error||"run_submit_failed");
      return data;
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
    const res=await fetch(u.toString());
    if(!res.ok)throw new Error("leaderboard_failed_"+res.status);
    return res.json();
  }
  function attach(record){
    const p=global.AIBAIdentity&&global.AIBAIdentity.publicProfile?global.AIBAIdentity.publicProfile():null;
    return p?{...record,cloudPlayerId:p.player_id||"",nickname:p.display_name||"",playerTag:p.player_tag||""}:record;
  }

  global.AIBALeaderboard=Object.freeze({submit,flush,leaderboard,attach,queueSize:()=>readQueue().length});
  setTimeout(()=>flush().catch(()=>{}),2500);
})(window);
