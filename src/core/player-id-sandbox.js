(function(global){
  "use strict";

  const INSTALL_KEY="aiba_install_id_v1";
  const PROFILE_KEY="aiba_player_profile_v1";

  function uuid(){
    if(global.crypto&&crypto.randomUUID)return crypto.randomUUID();
    return "aiba_next_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,12);
  }
  function read(key,fallback){
    try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback;}
    catch(e){return fallback;}
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
  function cleanName(name){
    return String(name||"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,18);
  }
  function profile(){return read(PROFILE_KEY,null);}
  function hasNickname(value){return !!cleanName(value&&value.display_name);}
  function saveProfile(value){
    return write(PROFILE_KEY,Object.assign({},value,{sandbox:true,updated_at:new Date().toISOString()}));
  }
  function setLocalName(name){
    const clean=cleanName(name),current=profile()||{};
    return saveProfile(Object.assign({},current,{display_name:clean,nickname_set:!!clean}));
  }
  function publicProfile(){
    const value=profile()||{};
    return {
      install_id:installId(),
      player_id:value.player_id||"next-sandbox",
      display_name:value.display_name||"",
      player_tag:"NEXT",
      online:false,
      sandbox:true,
      has_nickname:hasNickname(value)
    };
  }
  async function ensure(){
    const value=profile()||saveProfile({player_id:"next-sandbox",player_token:"",display_name:"",nickname_set:false});
    return value;
  }
  async function updateName(name){return setLocalName(name);}
  function authHeaders(){return null;}

  global.AIBAIdentity=Object.freeze({installId,profile,publicProfile,ensure,updateName,setLocalName,authHeaders,hasNickname});
})(window);
