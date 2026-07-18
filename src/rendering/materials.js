/* ---------------- pixel texture helpers ---------------- */
function pixTex(w,h,draw,opt){
  const cv=document.createElement("canvas");cv.width=w;cv.height=h;
  draw(cv.getContext("2d"),w,h);
  const t=new THREE.CanvasTexture(cv);
  const smooth=opt&&opt.smooth;
  t.magFilter=smooth?THREE.LinearFilter:THREE.NearestFilter;
  const mipmaps=!!(opt&&opt.mipmaps);
  t.minFilter=mipmaps?THREE.LinearMipmapLinearFilter:(smooth?THREE.LinearFilter:THREE.NearestFilter);
  t.generateMipmaps=mipmaps;
  if(smooth&&renderer.capabilities&&renderer.capabilities.getMaxAnisotropy){
    t.anisotropy=Math.min((opt&&opt.anisotropy)||4,renderer.capabilities.getMaxAnisotropy());
  }
  if(THREE.sRGBEncoding&&!(opt&&opt.linear))t.encoding=THREE.sRGBEncoding;
  return t;
}

function ballTextureRng(seed){
  let s=seed>>>0;
  return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
}

function ballUvPoint(x,y,z){
  let u=Math.atan2(z,-x)/(Math.PI*2);if(u<0)u+=1;
  return [u,Math.acos(Math.max(-1,Math.min(1,y)))/Math.PI];
}

// Three orthogonal great circles form the base panels; the sphere curve completes the molded channel layout.
function spaldingPanelCurve(samples){
  const pts=[],radius=1.5;
  for(let i=0;i<=samples;i++){
    const a=i/samples*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
    let lo=0,hi=2;
    for(let n=0;n<24;n++){
      const r=(lo+hi)*.5,u=r*c,v=r*s;
      const x=u-u*u*u/3+u*v*v;
      const y=v-v*v*v/3+v*u*u;
      const z=u*u-v*v;
      if(Math.hypot(x,y,z)<radius)lo=r;else hi=r;
    }
    const r=(lo+hi)*.5,u=r*c,v=r*s;
    const x=(u-u*u*u/3+u*v*v)/radius;
    const y=(v-v*v*v/3+v*u*u)/radius;
    const z=(u*u-v*v)/radius;
    pts.push(ballUvPoint(x,y,z));
  }
  return pts;
}

let basketballChannelPathCache=null;
function basketballChannelPaths(){
  if(basketballChannelPathCache)return basketballChannelPathCache;
  const equator=[],meridianA=[],meridianB=[],centerMeridianA=[],centerMeridianB=[];
  for(let i=0;i<=256;i++){
    const k=i/256;
    equator.push([k,.5]);
    meridianA.push([0,k]);meridianB.push([.5,k]);
    centerMeridianA.push([.25,k]);centerMeridianB.push([.75,k]);
  }
  basketballChannelPathCache=[equator,meridianA,meridianB,centerMeridianA,centerMeridianB,spaldingPanelCurve(720)];
  return basketballChannelPathCache;
}

function strokeWrappedBallPath(g,pts,w,h,width,color){
  const unwrapped=[[pts[0][0],pts[0][1]]];let offset=0,prev=pts[0][0];
  for(let i=1;i<pts.length;i++){
    const u=pts[i][0],d=u-prev;if(d>.5)offset-=1;else if(d<-.5)offset+=1;
    unwrapped.push([u+offset,pts[i][1]]);prev=u;
  }
  g.strokeStyle=color;g.lineWidth=width;g.lineCap="round";g.lineJoin="round";
  for(let shift=-2;shift<=2;shift++){
    g.beginPath();g.moveTo((unwrapped[0][0]+shift)*w,unwrapped[0][1]*h);
    for(let i=1;i<unwrapped.length;i++)g.lineTo((unwrapped[i][0]+shift)*w,unwrapped[i][1]*h);
    g.stroke();
  }
}

function paintBasketballChannels(g,w,h,relief){
  const scale=h/256,paths=basketballChannelPaths();
  for(const p of paths)strokeWrappedBallPath(g,p,w,h,8*scale,relief?"#303030":"#54250e");
  for(const p of paths)strokeWrappedBallPath(g,p,w,h,4.4*scale,relief?"#090909":"#130905");
}

function paintBallLeather(g,w,h,base,dark,palette){
  if(palette){
    for(let panel=0;panel<8;panel++){
      g.fillStyle=palette[panel%palette.length];
      g.fillRect(Math.floor(panel*w/8),0,Math.ceil(w/8)+1,h);
    }
  }else{g.fillStyle=base;g.fillRect(0,0,w,h);}
  const rnd=ballTextureRng(palette?0x51f15e:0xba11c0de);
  g.fillStyle=dark;g.globalAlpha=palette ? 0.15 : 0.24;
  for(let y=2,row=0;y<h-1;y+=3,row++){
    for(let x=2+(row&1)*1.5;x<w-1;x+=3){
      const px=x+(rnd()-.5)*1.2,py=y+(rnd()-.5)*1.2,r=rnd()>.82?1.15:.72;
      g.beginPath();g.arc(px,py,r,0,Math.PI*2);g.fill();
    }
  }
  g.globalAlpha=1;paintBasketballChannels(g,w,h,false);
}

function realBallTex(base,dark){
  return pixTex(512,256,(g,w,h)=>paintBallLeather(g,w,h,base,dark,null),{smooth:true,mipmaps:true,anisotropy:8});
}

function triBallTex(){
  return pixTex(512,256,(g,w,h)=>paintBallLeather(g,w,h,"#e8771e","#1b1110",["#1f4fd8","#f2f2f2","#d8262e"]),{smooth:true,mipmaps:true,anisotropy:8});
}

function ballReliefTex(){
  return pixTex(512,256,(g,w,h)=>{
    g.fillStyle="#787878";g.fillRect(0,0,w,h);
    const rnd=ballTextureRng(0x8badf00d);g.fillStyle="#a8a8a8";
    for(let y=2,row=0;y<h-1;y+=3,row++)for(let x=2+(row&1)*1.5;x<w-1;x+=3){
      const px=x+(rnd()-.5),py=y+(rnd()-.5);g.fillRect(px,py,1.4,1.4);
    }
    paintBasketballChannels(g,w,h,true);
  },{smooth:true,mipmaps:true,anisotropy:8,linear:true});
}

const texBall=realBallTex("#d66032","#77351c");
const texGold=triBallTex();
const texDeep=realBallTex("#54e05a","#1f7a26");
const texBallRelief=ballReliefTex();
const matBall=new THREE.MeshPhongMaterial({map:texBall,bumpMap:texBallRelief,bumpScale:.0018,shininess:5,specular:0x4a2a18});
const matGold=new THREE.MeshPhongMaterial({map:texGold,bumpMap:texBallRelief,bumpScale:.0018,shininess:5,specular:0x303030});
const matDeep=new THREE.MeshPhongMaterial({map:texDeep,bumpMap:texBallRelief,bumpScale:.0018,shininess:5,specular:0x183f1b});
const ballGeo=new THREE.SphereGeometry(0.16,32,20);

window.AIBA.runtime.register("rendering:materials",Object.freeze({
  pixTex,realBallTex,triBallTex,texBall,texGold,texDeep,texBallRelief,matBall,matGold,matDeep,ballGeo
}));
