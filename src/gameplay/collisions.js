/* ---- 空中球碰撞:撞击改变结果(原本进的被撞歪→不进) ---- */
function checkBallCollisions(){
  for(let i=0;i<balls.length;i++){
    const a=balls[i];if(a.phase!=="fly")continue;
    for(let j=i+1;j<balls.length;j++){
      const b=balls[j];if(b.phase!=="fly")continue;
      if(a.collided&&b.collided)continue;
      // 只有玩家球 vs 对手球之间才判定(同一人的球不互撞)
      if(!!a.opp===!!b.opp)continue;
      const dx=a.mesh.position.x-b.mesh.position.x;
      const dy=a.mesh.position.y-b.mesh.position.y;
      const dz=a.mesh.position.z-b.mesh.position.z;
      const d2=dx*dx+dy*dy+dz*dz;
      if(d2<0.34*0.34){ // 球半径~0.17,两球接触
        ballCollide(a,b);
      }
    }
  }
}
function ballCollide(a,b){
  a.collided=b.collided=true;
  // 互相弹开:沿连线方向给一个横向偏移速度
  const n=V3(a.mesh.position.x-b.mesh.position.x,a.mesh.position.y-b.mesh.position.y,a.mesh.position.z-b.mesh.position.z);
  if(n.length()<0.001)n.set(rnd(-1,1),0.4,rnd(-1,1));
  n.normalize();
  // 原本要进的球被撞 → 改判不进(转 free 落体飞出)
  [[a,1],[b,-1]].forEach(([ball,sgn])=>{
    const wasSwish=ball.outcome==="swish";
    sClank();
    ball.phase="free";
    const vy=ball.v0.y-9.8*ball.t;
    ball.vel.set(ball.v0.x+sgn*n.x*2.6,Math.max(vy,1.2)+1.0,ball.v0.z+sgn*n.z*2.6);
    ball.outcome="rimout";
    ball.life=1.4;
    if(wasSwish){
      if(ball.opp){toast("💥 空中相撞!对手没进!","#7CFC6B");}
      else{toast("💥 空中相撞!你的球被打飞!","#ff8d7a");if(!ball.silent)missBall();}
    }
  });
  // 撞击反馈
  cheerSound(false);if(navigator.vibrate)navigator.vibrate([15,30,15]);
  popScore("💥","#fff");
}

window.AIBA.runtime.register("gameplay:collisions",Object.freeze({
  checkBallCollisions,ballCollide
}));

