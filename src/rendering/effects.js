/* shadow blob */
const blobGeo=new THREE.CircleGeometry(0.18,8);
const blobMat=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.35});

/* particles: fire trail + confetti */
const fireN=90;
const firePos=new Float32Array(fireN*3), fireLife=new Float32Array(fireN);
const fireGeoB=new THREE.BufferGeometry();
fireGeoB.setAttribute("position",new THREE.BufferAttribute(firePos,3));
const firePts=new THREE.Points(fireGeoB,new THREE.PointsMaterial({color:0xff7b1c,size:0.22,transparent:true,opacity:0.9}));
firePts.frustumCulled=false;scene.add(firePts);
let fireIdx=0;
function emitFire(p){
  firePos[fireIdx*3]=p.x+rnd(-.05,.05);firePos[fireIdx*3+1]=p.y+rnd(-.05,.05);firePos[fireIdx*3+2]=p.z+rnd(-.05,.05);
  fireLife[fireIdx]=0.5;fireIdx=(fireIdx+1)%fireN;
}
function updFire(dt){
  let alive=false;
  for(let i=0;i<fireN;i++){
    if(fireLife[i]>0){alive=true;fireLife[i]-=dt;firePos[i*3+1]+=dt*0.7;
      if(fireLife[i]<=0)firePos[i*3+1]=-99;}
  }
  if(alive)fireGeoB.attributes.position.needsUpdate=true;
}
const confN=260;
const confPos=new Float32Array(confN*3),confVel=[];
const confGeo=new THREE.BufferGeometry();
confGeo.setAttribute("position",new THREE.BufferAttribute(confPos,3));
const confPts=new THREE.Points(confGeo,new THREE.PointsMaterial({size:0.18,vertexColors:true}));
const confCol=new Float32Array(confN*3);
confGeo.setAttribute("color",new THREE.BufferAttribute(confCol,3));
confPts.frustumCulled=false;confPts.visible=false;scene.add(confPts);
function startConfetti(){
  confPts.visible=true;
  const cols=[[1,.82,.25],[.3,.9,.4],[.4,.6,1],[1,.4,.4],[1,1,1]];
  for(let i=0;i<confN;i++){
    confPos[i*3]=rnd(-8,8);confPos[i*3+1]=rnd(8,16);confPos[i*3+2]=rnd(-12,2);
    confVel[i]=V3(rnd(-.4,.4),rnd(-2.4,-1.2),rnd(-.4,.4));
    const c=cols[(Math.random()*cols.length)|0];
    confCol[i*3]=c[0];confCol[i*3+1]=c[1];confCol[i*3+2]=c[2];
  }
}
let _confAcc=0;
function updConf(dt){
  if(!confPts.visible)return;
  _confAcc+=dt;if(_confAcc<1/20)return;
  const step=Math.min(.1,_confAcc);_confAcc=0;
  for(let i=0;i<confN;i++){
    confPos[i*3]+=confVel[i].x*step+Math.sin(G.tNow*3+i)*0.01;
    confPos[i*3+1]+=confVel[i].y*step;
    confPos[i*3+2]+=confVel[i].z*step;
    if(confPos[i*3+1]<0.05)confPos[i*3+1]=rnd(10,15);
  }
  confGeo.attributes.position.needsUpdate=true;
}

/* ---------------- tween helper ---------------- */
const tweens=[];
const ease=k=>k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
function tween(dur,fn,done){tweens.push({t:0,dur,fn,done});}
function updTweens(dt){
  for(let i=tweens.length-1;i>=0;i--){
    const w=tweens[i];w.t+=dt;
    const k=Math.min(1,w.t/w.dur);w.fn(ease(k));
    if(k>=1){tweens.splice(i,1);if(w.done)w.done();}
  }
}
function glideTo(p,l,dur,cb){
  const p0=rig.pos.clone(),l0=rig.look.clone(),pt=p.clone(),lt=l.clone();
  G.moving=true;G.glideCam=true;
  tween(dur,k=>{
    rig.pos.lerpVectors(p0,pt,k);
    rig.pos.y+=Math.sin(k*Math.PI)*0.35;
    rig.look.lerpVectors(l0,lt,k);
  },()=>{G.moving=false;G.glideCam=false;if(cb)cb();});
}
function shotEye(shot){
  const base=shotBase(shot);
  const dir=HOOP.clone().sub(base);dir.y=0;dir.normalize();
  return base.clone().addScaledVector(dir,-0.25).setY(EYE);
}

/* ---------------- shooting & balls ---------------- */

window.AIBA.runtime.register("rendering:effects",Object.freeze({
  blobGeo,blobMat,firePts,confPts,emitFire,updFire,startConfetti,updConf,
  tween,updTweens,glideTo,shotEye
}));

