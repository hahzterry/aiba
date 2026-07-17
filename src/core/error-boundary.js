"use strict";

(function(){
  function showErr(msg){
    let d=document.getElementById("bootErr");
    if(!d){
      d=document.createElement("div");
      d.id="bootErr";
      d.style.cssText="position:fixed;inset:0;z-index:99999;background:#0a0e16;color:#ff9b8a;"+
        "font:13px/1.5 Orbitron,monospace;padding:22px;white-space:pre-wrap;overflow:auto";
      (document.body||document.documentElement).appendChild(d);
    }
    d.textContent="⚠ 出错了(请把这段发给开发者):\n\n"+msg;
  }

  window.addEventListener("error",function(e){
    showErr((e.error&&e.error.stack)||e.message||String(e));
  });
  window.addEventListener("unhandledrejection",function(e){
    showErr("Promise: "+((e.reason&&e.reason.stack)||e.reason));
  });
  if(typeof THREE==="undefined"){
    showErr("无法加载 3D 引擎 three.js。\n通常是网络/CDN 被拦截。\n请联网后重试,或在能访问 unpkg/jsdelivr 的网络下打开。");
  }
})();

