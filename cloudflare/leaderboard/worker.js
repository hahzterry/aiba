const CORS={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Methods":"GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type, Authorization, X-AIBA-Player-ID",
  "Access-Control-Max-Age":"86400"
};
const RULE_VERSION="2026-07-04-v1";

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{...CORS,"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
  });
}
function bad(error,status=400,extra={}){
  return json({ok:false,error,...extra},status);
}
async function sha256(text){
  const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(text||"")));
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
function token(){
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  let s="";for(const b of bytes)s+=String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function cleanKey(v,max=64){
  return String(v==null?"":v).replace(/[^a-zA-Z0-9_:\-.]/g,"").slice(0,max);
}
function tagFrom(id){
  return String(id||"").replace(/-/g,"").slice(-5).toUpperCase();
}
function cleanName(name,tag){
  const s=String(name||"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,18);
  return s||("Rookie "+tag);
}
async function readBody(req){
  try{return await req.json();}catch(e){return {};}
}
async function auth(req,env){
  const playerId=req.headers.get("X-AIBA-Player-ID")||"";
  const match=(req.headers.get("Authorization")||"").match(/^Bearer\s+(.+)$/i);
  if(!playerId||!match)return null;
  const tokenHash=await sha256(match[1]);
  const player=await env.DB.prepare("SELECT * FROM players WHERE id=?").bind(playerId).first();
  return player&&player.token_hash===tokenHash?player:null;
}
function asInt(value,min,max,fallback=0){
  const n=Number(value);
  return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):fallback;
}
async function createPlayer(req,env){
  const input=await readBody(req);
  const installId=String(input.install_id||input.installId||"").slice(0,160);
  if(installId.length<12)return bad("install_id_required");
  const installHash=await sha256(installId);
  const playerToken=token();
  const tokenHash=await sha256(playerToken);
  const existing=await env.DB.prepare("SELECT id,display_name,player_tag FROM players WHERE install_id_hash=?").bind(installHash).first();
  if(existing){
    const displayName=cleanName(input.display_name||input.nickname||existing.display_name,existing.player_tag);
    await env.DB.prepare("UPDATE players SET token_hash=?,display_name=?,last_seen_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
      .bind(tokenHash,displayName,existing.id).run();
    return json({ok:true,player_id:existing.id,player_token:playerToken,display_name:displayName,player_tag:existing.player_tag,reused:true});
  }
  const id=crypto.randomUUID();
  const tag=tagFrom(id);
  const displayName=cleanName(input.display_name||input.nickname,tag);
  const uaHash=await sha256((req.headers.get("User-Agent")||"").slice(0,240));
  await env.DB.prepare("INSERT INTO players (id,install_id_hash,display_name,player_tag,token_hash,created_version,country_hint,user_agent_hash) VALUES (?,?,?,?,?,?,?,?)")
    .bind(id,installHash,displayName,tag,tokenHash,cleanKey(input.game_version||input.version,50),req.cf&&req.cf.country||"",uaHash).run();
  return json({ok:true,player_id:id,player_token:playerToken,display_name:displayName,player_tag:tag,reused:false});
}
async function updateMe(req,env){
  const player=await auth(req,env);
  if(!player)return bad("unauthorized",401);
  const input=await readBody(req);
  const displayName=cleanName(input.display_name||input.nickname,player.player_tag);
  await env.DB.prepare("UPDATE players SET display_name=? WHERE id=?").bind(displayName,player.id).run();
  return json({ok:true,player_id:player.id,display_name:displayName,player_tag:player.player_tag});
}
function validateRun(input){
  const mode=cleanKey(input.mode,40);
  if(!mode)return {error:"mode_required"};
  const variant=cleanKey(input.variant||"",40);
  const score=asInt(input.score??input.total,0,10000);
  const elapsed=input.elapsed_ms==null&&input.elapsedMs==null?null:asInt(input.elapsed_ms??input.elapsedMs,0,86400000);
  const attempts=input.attempts==null?null:asInt(input.attempts,0,2000);
  const makes=input.makes==null?null:asInt(input.makes,0,2000);
  const accuracy=attempts?Math.max(0,Math.min(1,(makes||0)/attempts)):(input.accuracy==null?null:Number(input.accuracy));
  let eligible=input.eligible===false?0:1;
  let validationStatus="valid";
  if(attempts!=null&&makes!=null&&makes>attempts){eligible=0;validationStatus="suspicious";}
  if((mode==="rack-rush-speed100"||variant==="speed100")&&(score<100||!elapsed||elapsed<15000)){eligible=0;validationStatus="suspicious";}
  if(mode==="percent-battle"&&input.won&&(!elapsed||elapsed<20000)){eligible=0;validationStatus="suspicious";}
  return {
    mode,variant,score,elapsed,attempts,makes,accuracy,eligible,validationStatus,
    bestStreak:asInt(input.best_streak??input.bestStreak,0,2000,null),
    won:input.won?1:0,completed:input.completed?1:0,
    difficulty:cleanKey(input.difficulty,30),control:cleanKey(input.control,30),
    starId:cleanKey(input.star_id??input.playerId,50),starName:String(input.star_name??input.playerName??"").slice(0,40),
    opponentId:cleanKey(input.opponent_id??input.opponentId,50),opponentName:String(input.opponent_name??input.opponentName??"").slice(0,40),
    scene:cleanKey(input.scene,40),weather:cleanKey(input.weather,40),seed:cleanKey(input.seed,80),
    gameVersion:cleanKey(input.game_version??input.version,50),clientCreatedAt:String(input.completedAt||input.client_created_at||"").slice(0,40)
  };
}
async function submitRun(req,env){
  const player=await auth(req,env);
  if(!player)return bad("unauthorized",401);
  const run=validateRun(await readBody(req));
  if(run.error)return bad(run.error);
  const id=crypto.randomUUID();
  await env.DB.prepare("INSERT INTO runs (id,player_id,display_name,player_tag,mode,variant,score,elapsed_ms,attempts,makes,accuracy,best_streak,won,completed,eligible,difficulty,control,star_id,star_name,opponent_id,opponent_name,scene,weather,seed,game_version,rule_version,validation_status,meta_json,client_created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(id,player.id,player.display_name,player.player_tag,run.mode,run.variant,run.score,run.elapsed,run.attempts,run.makes,run.accuracy,run.bestStreak,run.won,run.completed,run.eligible,run.difficulty,run.control,run.starId,run.starName,run.opponentId,run.opponentName,run.scene,run.weather,run.seed,run.gameVersion,RULE_VERSION,run.validationStatus,JSON.stringify({}),run.clientCreatedAt).run();
  return json({ok:true,run_id:id,validation_status:run.validationStatus,eligible:!!run.eligible});
}
async function leaderboard(req,env){
  const url=new URL(req.url);
  const mode=cleanKey(url.searchParams.get("mode"),40);
  if(!mode)return bad("mode_required");
  const variant=cleanKey(url.searchParams.get("variant")||"",40);
  const difficulty=cleanKey(url.searchParams.get("difficulty")||"",30);
  const control=cleanKey(url.searchParams.get("control")||"",30);
  const seed=cleanKey(url.searchParams.get("seed")||"",80);
  const limit=Math.max(1,Math.min(50,Number(url.searchParams.get("limit")||20)));
  const where=["mode=?","validation_status='valid'","eligible=1"];
  const params=[mode];
  if(variant){where.push("variant=?");params.push(variant);}
  if(difficulty){where.push("difficulty=?");params.push(difficulty);}
  if(control){where.push("control=?");params.push(control);}
  if(seed){where.push("seed=?");params.push(seed);}
  params.push(limit);
  const speed=mode==="rack-rush-speed100"||variant==="speed100"||mode==="percent-battle";
  const order=speed?"elapsed_ms ASC,score DESC,accuracy DESC,created_at ASC":"score DESC,elapsed_ms ASC,accuracy DESC,created_at ASC";
  const query="SELECT id,player_id,display_name,player_tag,mode,variant,score,elapsed_ms,attempts,makes,accuracy,best_streak,won,completed,difficulty,control,star_id,star_name,opponent_id,scene,seed,game_version,created_at FROM runs WHERE "+where.join(" AND ")+" ORDER BY "+order+" LIMIT ?";
  const rows=await env.DB.prepare(query).bind(...params).all();
  return json({ok:true,rows:(rows.results||[]).map((row,i)=>({rank:i+1,...row}))});
}

export default {
  async fetch(req,env){
    if(req.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
    const url=new URL(req.url);
    try{
      if(req.method==="GET"&&url.pathname==="/health")return json({ok:true,service:"aiba-leaderboard-api",rule_version:RULE_VERSION});
      if(req.method==="POST"&&url.pathname==="/v1/players")return createPlayer(req,env);
      if(req.method==="PATCH"&&url.pathname==="/v1/players/me")return updateMe(req,env);
      if(req.method==="POST"&&url.pathname==="/v1/runs")return submitRun(req,env);
      if(req.method==="GET"&&url.pathname==="/v1/leaderboards")return leaderboard(req,env);
      return bad("not_found",404);
    }catch(err){
      return bad("server_error",500,{detail:String(err&&err.message||err).slice(0,200)});
    }
  }
};
