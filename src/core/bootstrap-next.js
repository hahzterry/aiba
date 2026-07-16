(function(global){
  "use strict";

  const runtime=global.AIBA&&global.AIBA.runtime;
  if(!runtime||!runtime.experimental)throw new Error("NEXT bootstrap requires experimental runtime");
  if(global.__AIBA_BOOT_STARTED__)return;
  global.__AIBA_BOOT_STARTED__=true;
  Promise.resolve(global.bootGame()).catch(error=>setTimeout(()=>{throw error;},0));
  setTimeout(()=>{
    if(global.__AIBA_LOOP_STARTED__)return;
    global.__AIBA_LOOP_STARTED__=true;global.animate();
  },0);
})(window);
