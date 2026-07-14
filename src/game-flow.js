"use strict";

function ensurePregameChalk(){
  if(PREGAME.chalk)return PREGAME.chalk;
  const count=46,pos=new Float32Array(count*3),geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({color:0xf4f3e9,size:0.085,transparent:true,opacity:0,depthWrite:false});
  const points=new THREE.Points(geo,mat);
  points.visible=false;points.frustumCulled=false;scene.add(points);
  PREGAME.chalk={count,pos,geo,mat,points};
  return PREGAME.chalk;
}

function hidePregameChalk(){
  if(PREGAME.chalk)PREGAME.chalk.points.visible=false;
}

function updatePregameChalk(actor,u,t){
  const cloud=ensurePregameChalk(),show=smoothRange(.3,.46,u)*(1-smoothRange(.82,.98,u));
  if(show<=0.01){cloud.points.visible=false;return;}
  const root=actor.guy.g.position,spread=0.12+show*0.42,lift=smoothRange(.38,.76,u);
  for(let i=0;i<cloud.count;i++){
    const j=i*3,a=i*2.399+t*(0.45+(i%5)*0.04),r=spread*(0.18+(i%11)/10);
    cloud.pos[j]=root.x+Math.cos(a)*r;
    cloud.pos[j+1]=root.y+1.78+lift*(0.28+(i%9)*0.055)+Math.sin(a*1.7)*0.055;
    cloud.pos[j+2]=root.z+0.02+Math.sin(a)*r*0.72;
  }
  cloud.geo.attributes.position.needsUpdate=true;
  cloud.mat.opacity=0.22+show*0.68;cloud.points.visible=true;
}

function updatePregameWarmupShot(actor,guy,ball,u){
  const releaseAt=.58;
  const phase=u<releaseAt?clamp(u/releaseAt,0,1):1+clamp((u-releaseAt)/.42,0,1)*.18;
  const curve=shotCurves(phase);
  guy.g.position.y=poseGuy(guy,curve,0)+Math.max(0,curve.jmp*.55-curve.over*.55);
  if(!ball)return;
  ball.visible=true;ball.material=actor.role==="hero"?shotMat(curShot()):matBall;
  if(u<releaseAt){poseBallPos(ball.position,curve);return;}
  const flight=ease01(clamp((u-releaseAt)/.4,0,1));
  const release=poseBallPos(V3(),shotCurves(1));
  guy.g.updateMatrixWorld(true);
  const rimLocal=guy.g.worldToLocal(HOOP.clone());
  ball.position.lerpVectors(release,rimLocal,flight);
  ball.position.y+=Math.sin(flight*Math.PI)*1.12;
}

function rookieMeterProgress(){
  if(G.mode==="battle")return clamp(Math.max(G.score||0,G.battleOppScore||0)/BATTLE_TARGET,0,1);
  if(G.mode==="rackrush"&&G.rush){
    if(isRackRushSpeed(G.rush))return clamp((G.rush.total||0)/RACK_RUSH_SPEED_TARGET,0,1);
    const level=clamp(G.rush.level||0,0,RACK_RUSH_LEVELS.length-1);
    const cfg=RACK_RUSH_LEVELS[level]||RACK_RUSH_LEVELS[0];
    const within=clamp(1-(G.timer==null?cfg.time:G.timer)/Math.max(1,cfg.time),0,1);
    return clamp((level+within)/RACK_RUSH_LEVELS.length,0,1);
  }
  return G.seq&&G.seq.length?clamp((G.shotIdx||0)/G.seq.length,0,1):0;
}

function barHiddenFor(shot){
  if(!shot||G.practice)return false;
  if(G.diff==="easy")return rookieMeterProgress()>=0.7;
  if(G.mode==="battle")return G.shotIdx>=BATTLE_BAR_VISIBLE_SHOTS;
  if(G.mode==="rackrush")return rackRushBarHidden();
  const rack=(shot.deep!=null||shot.super)?5:shot.rack;
  return rack>=DIFFS[G.diff].hideBar;
}
