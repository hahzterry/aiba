/* ---------------- pixel texture helpers ---------------- */
function pixTex(w,h,draw,opt){
  const cv=document.createElement("canvas");cv.width=w;cv.height=h;
  draw(cv.getContext("2d"),w,h);
  const t=new THREE.CanvasTexture(cv);
  const smooth=opt&&opt.smooth;
  t.magFilter=smooth?THREE.LinearFilter:THREE.NearestFilter;
  t.minFilter=smooth?THREE.LinearFilter:THREE.NearestFilter;
  t.generateMipmaps=false;
  if(smooth&&renderer.capabilities&&renderer.capabilities.getMaxAnisotropy){
    t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  }
  if(THREE.sRGBEncoding)t.encoding=THREE.sRGBEncoding;
  return t;
}

function realBallTex(base,dark){
  return pixTex(96,96,(g)=>{
    g.fillStyle=base;g.fillRect(0,0,96,96);
    g.globalAlpha=0.28;g.fillStyle=dark;
    for(let i=0;i<520;i++)g.fillRect((Math.random()*96)|0,(Math.random()*96)|0,1,1);
    g.globalAlpha=1;g.fillStyle="#1f130a";
    g.fillRect(0,47,96,3);
    g.fillRect(23,0,3,96);
    g.fillRect(70,0,3,96);
    for(let x=0;x<96;x++){
      const y1=48+20*Math.sin((x/96)*Math.PI*2);
      const y2=48+20*Math.sin((x/96)*Math.PI*2+Math.PI);
      g.fillRect(x,(y1|0)-1,1,3);
      g.fillRect(x,(y2|0)-1,1,3);
    }
  });
}

function triBallTex(){
  const cols=["#1f4fd8","#f2f2f2","#d8262e"];
  return pixTex(96,96,(g)=>{
    for(let s=0;s<6;s++){
      g.fillStyle=cols[s%3];
      g.fillRect(s*16,0,16,96);
      g.fillStyle="#15100c";g.fillRect(s*16,0,2,96);
    }
    g.globalAlpha=0.18;g.fillStyle="#000";
    for(let i=0;i<420;i++)g.fillRect((Math.random()*96)|0,(Math.random()*96)|0,1,1);
    g.globalAlpha=1;g.fillStyle="#15100c";
    g.fillRect(0,47,96,3);
  });
}

const texBall=realBallTex("#e8771e","#8a4410");
const texGold=triBallTex();
const texDeep=realBallTex("#54e05a","#1f7a26");
const matBall=new THREE.MeshLambertMaterial({map:texBall});
const matGold=new THREE.MeshLambertMaterial({map:texGold});
const matDeep=new THREE.MeshLambertMaterial({map:texDeep});
const ballGeo=new THREE.SphereGeometry(0.16,12,10);

window.AIBA.runtime.register("rendering:materials",Object.freeze({
  pixTex,realBallTex,triBallTex,texBall,texGold,texDeep,matBall,matGold,matDeep,ballGeo
}));
