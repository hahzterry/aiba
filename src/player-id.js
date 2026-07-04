(function(global){
  "use strict";

  const INSTALL_KEY="aiba_install_id_v1";
  const PROFILE_KEY="aiba_player_profile_v1";
  const API=(global.AIBA_CONFIG&&global.AIBA_CONFIG.LEADERBOARD_API)||"";
  let pending=null;

  function uuid(){
    if(global.crypto&&crypto.randomUUID)return crypto.randomUUID();
    return "aiba_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,12);
  }
  function read(key,fallback){
    try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch(e){return fallback;}
  }
  function write(key,value){
    try{localStorage.setItem(key,JSON.stringify(value));}catch(e){}
    return value;
  }
  function installId(){
    try{
      let id=localStorage.getItem(INSTALL_KEY);
      if(!id){id=uuid();localStorage.setItem(INSTALL_KEY,id);}
      return id;
    }catch(e){return uuid();}
  }
  function profile(){return read(PROFILE_KEY,null);}
  function publicProfile(){
    const p=profile();
    if(!p)return {install_id:installId(),display_name:"",player_tag:"",online:false};
    return {install_id:installId(),player_id:p.player_id,display_name:p.display_name,player_tag:p.player_tag,online:!!p.player_token};
  }
  function saveProfile(p){
    return write(PROFILE_KEY,{...p,updated_at:new Date().toISOString()});
  }
  function cleanName(name){
    return String(name||"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,18);
  }
  function setLocalName(name){
    const clean=cleanName(name);
    const current=profile()||{};
    return saveProfile({...current,display_name:clean});
  }
  async function ensure(opts){
    const current=profile();
    if(current&&current.player_id&&current.player_token)return current;
    if(pending)return pending;
    pending=(async()=>{
      if(!API)throw new Error("leaderboard_api_missing");
      const res=await fetch(API+"/v1/players",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        install_id:installId(),
        display_name:current&&current.display_name,
        game_version:opts&&opts.game_version
      })});
      if(!res.ok)throw new Error("player_create_failed_"+res.status);
      const data=await res.json();
      if(!data.ok)throw new Error(data.error||"player_create_failed");
      return saveProfile({...current,...data});
    })().finally(()=>{pending=null;});
    return pending;
  }
  async function updateName(name){
    const clean=cleanName(name);
    const local=setLocalName(clean);
    if(!clean)return local;
    let p=local;
    try{p=await ensure();}catch(e){return local;}
    if(!API)return saveProfile({...p,display_name:clean});
    const res=await fetch(API+"/v1/players/me",{method:"PATCH",headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+p.player_token,
      "X-AIBA-Player-ID":p.player_id
    },body:JSON.stringify({display_name:clean})});
    if(!res.ok)throw new Error("player_update_failed_"+res.status);
    const data=await res.json();
    if(!data.ok)throw new Error(data.error||"player_update_failed");
    return saveProfile({...p,...data});
  }
  function authHeaders(){
    const p=profile();
    if(!p||!p.player_id||!p.player_token)return null;
    return {"Authorization":"Bearer "+p.player_token,"X-AIBA-Player-ID":p.player_id};
  }

  global.AIBAIdentity=Object.freeze({installId,profile,publicProfile,ensure,updateName,setLocalName,authHeaders});
})(window);
