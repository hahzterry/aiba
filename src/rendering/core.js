/* ---------------- three.js setup ---------------- */
const renderer=new THREE.WebGLRenderer({canvas:$("c"),antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(1);
if(THREE.sRGBEncoding)renderer.outputEncoding=THREE.sRGBEncoding;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x05060c);
scene.fog=new THREE.Fog(0x05060c,34,70);
const camera=new THREE.PerspectiveCamera(68,1,0.1,120);
scene.add(camera);
const indoorRoot=new THREE.Group();indoorRoot.name="indoorRoot";
const environmentRoot=new THREE.Group();environmentRoot.name="environmentRoot";
const weatherRoot=new THREE.Group();weatherRoot.name="weatherRoot";
scene.add(indoorRoot);scene.add(environmentRoot);scene.add(weatherRoot);
const rig={pos:V3(0,9,10),look:V3(0,2,-8)};
const camTarget={pos:V3(0,9,10),look:V3(0,2,-8)};
let camSnap=true;
let curSpotRing=null;
const RENDER_QUALITY=(()=>{
  const q=new URLSearchParams(location.search).get("quality")||"auto";
  const hasMatch=typeof matchMedia==="function";
  const coarse=!!(hasMatch&&matchMedia("(pointer:coarse)").matches);
  const reduced=!!(hasMatch&&matchMedia("(prefers-reduced-motion: reduce)").matches);
  const mem=navigator.deviceMemory||4;
  const base=coarse?(mem>=6?1.24:1.12):1.48;
  const max=coarse?(mem>=6?1.42:1.28):1.8;
  const presets={
    low:{scale:.88,min:.78,max:.96,locked:true},
    hd:{scale:base,min:.9,max,locked:true},
    ultra:{scale:coarse?1.48:2,min:1,max:coarse?1.55:2,locked:true}
  };
  const preset=presets[q];
  if(preset)return {mode:q,scale:preset.scale,target:preset.scale,min:preset.min,max:preset.max,locked:preset.locked,low:0,high:0,fps:60,w:1,h:1};
  const start=reduced?Math.min(base,1.05):base;
  return {mode:"auto",scale:start,target:base,min:coarse?.86:.98,max,locked:false,low:0,high:0,fps:60,w:1,h:1};
})();
function renderQualityTarget(){
  let target=RENDER_QUALITY.target;
  if(VISION&&VISION.desired)target-=0.08;
  if(G&&(G.state==="menu"||G.state==="diff"))target-=0.06;
  return clamp(target,RENDER_QUALITY.min,RENDER_QUALITY.max);
}
let lastScanOverlay="";
function updateVisualOverlays(){
  const on=G&&(G.state==="menu"||G.state==="diff"||G.state==="nba-dna");
  const next=on?"menu":"off";
  if(next===lastScanOverlay)return;
  lastScanOverlay=next;
  if(on)document.documentElement.dataset.scanOverlay="menu";
  else delete document.documentElement.dataset.scanOverlay;
}
function applyRenderScale(force){
  const q=RENDER_QUALITY,w=q.w||innerWidth,h=q.h||innerHeight;
  const scale=clamp(q.scale,q.min,q.max);
  const rw=Math.max(1,Math.round(w*scale)),rh=Math.max(1,Math.round(h*scale));
  if(!force&&renderer.domElement.width===rw&&renderer.domElement.height===rh)return;
  q.scale=scale;
  renderer.setSize(rw,rh,false);
  renderer.domElement.style.width=w+"px";renderer.domElement.style.height=h+"px";
  document.documentElement.dataset.renderCrisp=scale<1?"1":"0";
}
function updateRenderQuality(dt){
  const q=RENDER_QUALITY;
  if(q.locked||G.state==="menu"||G.state==="diff")return;
  const fps=1/Math.max(dt,0.001);
  q.fps=q.fps*0.92+fps*0.08;
  const active=G.state==="round"||G.state==="tiebreak"||G.state==="battle"||G.state==="rackrush"||G.state==="pregame";
  if(!active)return;
  const target=renderQualityTarget();
  if(q.fps<43){q.low+=dt;q.high=0;}else if(q.fps>56){q.high+=dt;q.low=0;}else{q.low=Math.max(0,q.low-dt*.5);q.high=Math.max(0,q.high-dt*.5);}
  if(q.low>1.25&&q.scale>q.min+.01){
    q.scale=Math.max(q.min,q.scale-0.08);q.low=0;applyRenderScale(true);
  }else if(q.high>4.5&&q.scale<target-.01){
    q.scale=Math.min(target,q.scale+0.06);q.high=0;applyRenderScale(true);
  }
}
function dampRig(dt,k){
  if(camSnap){rig.pos.copy(camTarget.pos);rig.look.copy(camTarget.look);camSnap=false;return;}
  const a=1-Math.exp(-(k||4.5)*dt);
  rig.pos.lerp(camTarget.pos,a);rig.look.lerp(camTarget.look,a);
}
function resize(){
  const vv=window.visualViewport;
  const w=Math.max(1,Math.round(vv?vv.width:innerWidth));
  const h=Math.max(1,Math.round(vv?vv.height:innerHeight));
  document.documentElement.style.setProperty("--app-height",h+"px");
  RENDER_QUALITY.w=w;RENDER_QUALITY.h=h;applyRenderScale(true);
  camera.aspect=w/h;camera.updateProjectionMatrix();
}
let _resizeT=0;
function debouncedResize(){clearTimeout(_resizeT);_resizeT=setTimeout(resize,120);}
addEventListener("resize",debouncedResize);
if(window.visualViewport)visualViewport.addEventListener("resize",debouncedResize);
resize();

const ambient=new THREE.AmbientLight(0xffffff,0.32);scene.add(ambient);
const hemi=new THREE.HemisphereLight(0x99aaff,0x1a1410,0.34);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1cf,0.8);sun.position.set(7,16,8);scene.add(sun);
const spot=new THREE.SpotLight(0xffffff,1.0,60,0.7,0.5);spot.position.set(0,14,-4);
spot.target.position.set(0,0,-6);indoorRoot.add(spot);indoorRoot.add(spot.target);

window.AIBA.runtime.register("rendering:core",Object.freeze({
  renderer,scene,camera,indoorRoot,environmentRoot,weatherRoot,rig,camTarget,RENDER_QUALITY,
  ambient,hemi,sun,spot,renderQualityTarget,updateVisualOverlays,applyRenderScale,updateRenderQuality,dampRig,resize
}));
