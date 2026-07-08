(function(global){
  "use strict";

  const cache=new Map();
  const W=300,H=330;

  function starKey(star){return star&&(star.id||star.n)||"";}
  function allStars(){
    const cfg=global.AIBA_CONFIG||{},assets=global.AIBA_ASSETS||{};
    const custom=global.AIBACustomizer&&typeof global.AIBACustomizer.listStars==="function"?global.AIBACustomizer.listStars():[];
    return [...(cfg.CLASSIC_LEGENDS||[]),...(assets.coverStars||[]),...custom];
  }
  function findStar(id){
    if(!id)return null;
    return allStars().find(star=>starKey(star)===id)||null;
  }
  function dressPreview(guy,star){
    if(!guy)return;
    // 有球星就统一走 applyStarStyle:女性发型/体型档案/经典星随机造型全部生效
    if(star&&star.col&&typeof global.applyStarStyle==="function")global.applyStarStyle(guy,star);
    else{
      if(typeof global.randomizeOutfit==="function")global.randomizeOutfit(guy);
      if(typeof global.dressGuy==="function")global.dressGuy(guy,0x202832,0x77e7ff,"?");
    }
  }
  function idlePose(guy){
    if(!guy)return;
    guy.g.position.set(0,-.06,0);
    guy.g.rotation.y=-.22;
    if(guy.arms){
      guy.arms[0].rotation.set(-.08,0,.08);
      guy.arms[1].rotation.set(-.08,0,-.08);
    }
    if(guy.elbows){
      guy.elbows[0].rotation.x=-.06;
      guy.elbows[1].rotation.x=-.06;
    }
  }
  function featuredPose(guy,id){
    idlePose(guy);
    const flip=(Array.from(id||"random").reduce((n,c)=>n+c.charCodeAt(0),0)%2)?1:-1;
    guy.g.position.set(-.03*flip,-.03,.02);
    guy.g.rotation.y=.18*flip;
    guy.g.rotation.z=-.035*flip;
    if(guy.arms){
      const wave=flip>0?guy.arms[1]:guy.arms[0],pump=flip>0?guy.arms[0]:guy.arms[1];
      const waveElbow=flip>0?guy.elbows[1]:guy.elbows[0],pumpElbow=flip>0?guy.elbows[0]:guy.elbows[1];
      wave.rotation.set(-.1,0,2.48*flip);
      waveElbow.rotation.x=-.62;
      waveElbow.rotation.z=.18*flip;
      pump.rotation.set(-.52,0,-.5*flip);
      pumpElbow.rotation.x=-.78;
    }
    if(guy.legs&&guy.knees&&guy.ankles){
      const lead=flip>0?0:1,trail=flip>0?1:0;
      guy.legs[lead].rotation.x=-.28;
      guy.knees[lead].rotation.x=.42;
      guy.ankles[lead].rotation.x=-.14;
      guy.legs[trail].rotation.x=.22;
      guy.knees[trail].rotation.x=.62;
      guy.ankles[trail].rotation.x=-.34;
    }
  }
  function clearGroup(group){
    while(group.children.length){
      const child=group.children.pop();
      child.traverse&&child.traverse(obj=>{
        if(obj.geometry&&obj.geometry.dispose)obj.geometry.dispose();
        const mats=Array.isArray(obj.material)?obj.material:[obj.material];
        mats.filter(Boolean).forEach(mat=>mat.dispose&&mat.dispose());
      });
    }
  }
  function buildScene(){
    const canvas=document.createElement("canvas");
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(global.devicePixelRatio||1,1.5));
    renderer.setSize(W,H,false);
    renderer.setClearColor(0x000000,0);
    const scene=new THREE.Scene();
    const rig=new THREE.Group();scene.add(rig);
    const hemi=new THREE.HemisphereLight(0xdff7ff,0x101010,1.25);scene.add(hemi);
    const key=new THREE.DirectionalLight(0xffffff,1.25);key.position.set(2.8,4,3.5);scene.add(key);
    const rim=new THREE.DirectionalLight(0x77e7ff,.82);rim.position.set(-2.5,2.2,-2.6);scene.add(rim);
    const floor=new THREE.Mesh(new THREE.BoxGeometry(1.42,.055,1.04),new THREE.MeshLambertMaterial({color:0x17202b}));
    floor.position.set(0,-.08,0);scene.add(floor);
    const camera=new THREE.PerspectiveCamera(31,W/H,.1,20);
    camera.position.set(.18,1.07,4.25);
    camera.lookAt(new THREE.Vector3(0,.94,0));
    return {canvas,renderer,scene,rig,camera};
  }
  function renderStar(ctx,id,featured){
    if(!global.THREE||typeof global.voxelGuy!=="function")return "";
    clearGroup(ctx.rig);
    const star=findStar(id);
    const key=(id||"__random")+":"+(star&&star.updatedAt||0)+(featured?":pose":":stand");
    if(cache.has(key))return cache.get(key);
    const guy=global.voxelGuy();
    dressPreview(guy,star);
    if(featured)featuredPose(guy,id);
    else idlePose(guy);
    ctx.rig.add(guy.g);
    ctx.renderer.render(ctx.scene,ctx.camera);
    const url=ctx.canvas.toDataURL("image/png");
    cache.set(key,url);
    return url;
  }
  function render(root){
    const slots=[...root.querySelectorAll("[data-locker-avatar]")];
    if(!slots.length||!global.THREE)return;
    requestAnimationFrame(()=>{
      const ctx=buildScene();
      slots.forEach(slot=>{
        try{
          const card=slot.closest(".lockerCard");
          const url=renderStar(ctx,slot.getAttribute("data-locker-avatar")||"",!!(card&&card.classList.contains("selected")));
          if(url)slot.innerHTML=`<img alt="" src="${url}">`;
          slot.classList.toggle("ready",!!url);
        }catch(e){
          slot.classList.add("failed");
          slot.innerHTML="<i>3D</i><b>OFFLINE</b>";
        }
      });
      ctx.renderer.dispose();
    });
  }

  global.AIBALockerPreview={render};
})(window);
