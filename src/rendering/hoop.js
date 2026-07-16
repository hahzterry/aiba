/* hoop & net */
let netMesh,netPulse=0;
function buildHoop(){
  const grp=new THREE.Group();
  // stanchion
  const polM=new THREE.MeshLambertMaterial({color:0x33333f});
  const pole=new THREE.Mesh(new THREE.BoxGeometry(0.3,3.4,0.3),polM);
  pole.position.set(0,1.7,-10.2);grp.add(pole);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(0.24,0.24,1.6),polM);
  arm.position.set(0,3.45,-9.4);grp.add(arm);
  // backboard
  const bTex=pixTex(128,80,(g)=>{
    g.fillStyle="#e8e8f2";g.fillRect(0,0,128,80);
    g.fillStyle="rgba(130,180,220,.13)";
    for(let y=0;y<80;y+=8)g.fillRect(0,y,128,2);
    g.strokeStyle="#cf4a1e";g.lineWidth=7;g.strokeRect(6,5,116,70);
    g.lineWidth=5;g.strokeRect(48,40,32,28);
  },{smooth:true});
  const board=new THREE.Mesh(new THREE.BoxGeometry(1.9,1.1,0.12),
    new THREE.MeshLambertMaterial({map:bTex}));
  board.position.set(0,3.5,-8.62);grp.add(board);
  // blocky rim (octagon of boxes)
  const rimM=new THREE.MeshLambertMaterial({color:0xd6451c});
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    const seg=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.07,0.09),rimM);
    seg.position.set(HOOP.x+Math.cos(a)*0.3,HOOP.y,HOOP.z+Math.sin(a)*0.3);
    seg.rotation.y=-a+Math.PI/2;grp.add(seg);
  }
  const conn=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.07,0.32),rimM);
  conn.position.set(0,3.05,-8.42);grp.add(conn);
  // net
  netMesh=new THREE.Mesh(
    new THREE.CylinderGeometry(0.28,0.16,0.45,8,3,true),
    new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:0.75}));
  netMesh.position.set(HOOP.x,HOOP.y-0.26,HOOP.z);grp.add(netMesh);
  scene.add(grp);

  // 远端装饰篮筐：让场馆在俯拍/回放里真正读成一块全场。
  const farGrp=new THREE.Group();
  const farPole=new THREE.Mesh(new THREE.BoxGeometry(0.3,3.4,0.3),polM);
  farPole.position.set(0,1.7,COURT.farBaseline+.62);farGrp.add(farPole);
  const farArm=new THREE.Mesh(new THREE.BoxGeometry(0.24,0.24,1.6),polM);
  farArm.position.set(0,3.45,COURT.farBaseline-.18);farGrp.add(farArm);
  const farBoard=new THREE.Mesh(new THREE.BoxGeometry(1.9,1.1,0.12),
    new THREE.MeshLambertMaterial({map:bTex}));
  farBoard.position.set(0,3.5,COURT.farBaseline-.96);farGrp.add(farBoard);
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    const seg=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.07,0.09),rimM);
    seg.position.set(Math.cos(a)*.3,HOOP.y,COURT.farHoopZ+Math.sin(a)*.3);
    seg.rotation.y=-a+Math.PI/2;farGrp.add(seg);
  }
  const farConn=new THREE.Mesh(new THREE.BoxGeometry(.12,.07,.32),rimM);
  farConn.position.set(0,HOOP.y,COURT.farHoopZ+.42);farGrp.add(farConn);
  const farNet=new THREE.Mesh(
    new THREE.CylinderGeometry(.28,.16,.45,8,3,true),
    new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.6}));
  farNet.position.set(0,HOOP.y-.26,COURT.farHoopZ);farGrp.add(farNet);
  scene.add(farGrp);
}
/* light cones + jumbotron */
let jumboCv,jumboTex;
function buildAtmos(){
  const coneM=new THREE.MeshBasicMaterial({color:0xaaccff,transparent:true,opacity:0.055,
    blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  [[-8,COURT.nearBaseline+.8],[8,COURT.nearBaseline+.8],[-8,COURT.midZ],[8,COURT.midZ],[-8,COURT.farBaseline-.8],[8,COURT.farBaseline-.8]].forEach(p=>{
    const c=new THREE.Mesh(new THREE.ConeGeometry(3.4,12,6,1,true),coneM);
    c.position.set(p[0],6.5,p[1]);indoorRoot.add(c);
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.4,0.8),
      new THREE.MeshBasicMaterial({color:0xfff7d0}));
    lamp.position.set(p[0],12.6,p[1]);indoorRoot.add(lamp);
  });
  jumboCv=document.createElement("canvas");jumboCv.width=256;jumboCv.height=128;
  jumboTex=new THREE.CanvasTexture(jumboCv);
  jumboTex.magFilter=THREE.NearestFilter;jumboTex.minFilter=THREE.NearestFilter;
  const jm=new THREE.MeshBasicMaterial({map:jumboTex});
  const dark=new THREE.MeshLambertMaterial({color:0x15151f});
  const jumbo=new THREE.Mesh(new THREE.BoxGeometry(3.6,1.9,3.6),[jm,jm,dark,dark,jm,jm]);
  jumbo.position.set(0,9.5,COURT.midZ);indoorRoot.add(jumbo);
  const hang=new THREE.Mesh(new THREE.BoxGeometry(0.2,3,0.2),dark);
  hang.position.set(0,12,COURT.midZ);indoorRoot.add(hang);
  updJumbo();
}
function updJumbo(){
  if(!jumboCv)return;
  const g=jumboCv.getContext("2d");
  g.fillStyle="#0a0a14";g.fillRect(0,0,256,128);
  g.strokeStyle="#33334a";g.lineWidth=6;g.strokeRect(3,3,250,122);
  g.textAlign="center";g.font="bold 26px Orbitron, monospace";
  const battle=G.mode==="battle"&&(G.state==="battle"||G.state==="battleend");
  const rush=G.mode==="rackrush"&&G.rush;
  g.fillStyle="#ffd23f";g.fillText(battle?"RACE TO 100":(rush?"RACK RUSH":"3PT CONTEST"),128,34);
  g.font="bold 40px Orbitron, monospace";
  g.fillStyle=G.timer<=10&&G.running?"#ff4040":"#7CFC6B";
  g.fillText(battle?Math.min(G.score,BATTLE_TARGET)+"-"+Math.min(G.battleOppScore||0,BATTLE_TARGET):(rush?(G.running?Math.max(0,G.timer).toFixed(0)+'"  '+G.rush.total+"分":"READY"):(G.running?G.timer.toFixed(0)+'"  '+G.score+"分":"BLOCK KING")),128,84);
  g.font="bold 16px Orbitron, monospace";g.fillStyle="#8fd0ff";
  g.fillText(battle?"PERCENT BATTLE":(rush?(RACK_RUSH_LEVELS[G.rush.level]||RACK_RUSH_LEVELS[0]).name:(G.running?(G.stage==="final"?"决赛 FINAL":"半决赛 SEMI"):"PIXEL NIGHT")),128,114);
  jumboTex.needsUpdate=true;
}


window.AIBA.runtime.register("rendering:hoop",Object.freeze({
  buildHoop,buildAtmos,updJumbo,
  getNet:()=>netMesh,
  getJumbotron:()=>({canvas:jumboCv,texture:jumboTex})
}));

