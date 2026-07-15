(function(global){
  "use strict";

  async function submit(){
    return {ok:false,queued:false,sandbox:true,error:"experimental_leaderboard_disabled"};
  }
  async function flush(){return {ok:true,flushed:0,sandbox:true};}
  async function leaderboard(){return {ok:true,rows:[],total:0,sandbox:true};}
  function attach(record,result){
    if(record)record.cloudResult=result||{ok:false,queued:false,sandbox:true};
    return record;
  }

  global.AIBALeaderboard=Object.freeze({submit,flush,leaderboard,attach,queueSize:()=>0,sandbox:true});
})(window);
