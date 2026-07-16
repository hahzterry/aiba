(function(global){
  "use strict";

  const runtime=global.AIBA&&global.AIBA.runtime,ctx=runtime&&runtime.service("legacy");
  if(!runtime||!ctx)throw new Error("UI panels require AIBA runtime legacy adapter");
  const {$,rnd}=ctx;
  let toastTimer=null;
  const popPool=[];

  function toast(text,color){
    const element=$("toast");element.textContent=text;element.style.color=color||"#fff";element.style.opacity=1;
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.style.opacity=0,900);
  }
  function popScore(text,color){
    let element=popPool.pop();
    if(!element){element=document.createElement("div");element.className="pop";$("pops").appendChild(element);}
    element.textContent=text;element.style.color=color;element.style.left=(45+rnd(0,10))+"%";element.style.top="32%";
    element.style.display="block";element.style.animation="none";element.offsetHeight;element.style.animation="";
    setTimeout(()=>{element.style.display="none";popPool.push(element);},1200);
  }
  function showPanel(html){
    global.stopCoverVideo();$("ov").classList.remove("cover-menu");$("ovBox").className="";$("ovBox").innerHTML=html;$("ov").style.display="flex";
  }
  function showCoverPanel(html){
    global.stopCoverVideo();$("ov").classList.add("cover-menu");$("ovBox").className="";$("ovBox").innerHTML=html;$("ov").style.display="flex";
  }
  function hidePanel(){global.stopCoverVideo();$("ov").style.display="none";}

  const api=Object.freeze({toast,popScore,showPanel,showCoverPanel,hidePanel});
  Object.assign(global,api);runtime.register("ui:panels",api);
})(window);
