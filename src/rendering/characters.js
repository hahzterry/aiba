/* ---------------- voxel characters: player avatar & passer ---------------- */
/* 高精度体素球员:在保留原动画 pivot 偏移(髋0.78/大腿0.34/小腿0.32/肩1.36...)的前提下细分方块 */
function voxelGuy(){
  const g=new THREE.Group();
  const mS=new THREE.MeshLambertMaterial({color:0xf4c89c});  // 皮肤
  const mJ=new THREE.MeshLambertMaterial({color:0x2fae4a});  // 球衣
  const mP=new THREE.MeshLambertMaterial({color:0x1c1c1c});  // 短裤/配色
  const mSole=new THREE.MeshLambertMaterial({color:0xf3f3f3});// 鞋底
  const mSock=new THREE.MeshLambertMaterial({color:0xf3f3f3});// 袜/鞋舌
  const mLace=new THREE.MeshLambertMaterial({color:0x1a1a1a});// 鞋带
  const hairMat=new THREE.MeshLambertMaterial({color:0x222222});
  const beardMat=new THREE.MeshLambertMaterial({color:0x222222});
  const mk=(w,h,d,m)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
  const add=(p,w,h,d,m,x,y,z)=>{const b=mk(w,h,d,m);b.position.set(x,y,z);p.add(b);return b;};
  const legs=[],knees=[],ankles=[],arms=[],elbows=[],shoes=[],wrists=[],sleeves=[];
  // ---- 腿 ----
  [-0.115,0.115].forEach(x=>{
    const lg=new THREE.Group();lg.position.set(x,0.78,0);     // 髋 pivot
    add(lg,0.195,0.20,0.225,mP, 0,-0.095,0);                  // 短裤包住的大腿上段
    add(lg,0.035,0.16,0.23,mJ, -Math.sign(x||1)*0.098,-0.12,0.004); // 球裤侧边队色条
    add(lg,0.18,0.035,0.225,mJ, 0,-0.205,0);                  // 球裤裤脚滚边
    add(lg,0.155,0.16,0.18,mS,  0,-0.255,0);                  // 大腿皮肤下段
    const kn=new THREE.Group();kn.position.y=-0.34;           // 膝 pivot
    add(kn,0.17,0.10,0.19,mS,  0,-0.045,0.006);               // 膝盖
    add(kn,0.105,0.044,0.045,mS, 0,-0.03,0.11);               // 膝盖前凸小块
    add(kn,0.15,0.19,0.165,mS, 0,-0.185,0);                   // 小腿
    add(kn,0.165,0.095,0.18,mSock, 0,-0.295,0.006);           // 袜子
    add(kn,0.17,0.024,0.185,mJ, 0,-0.252,0.006);              // 袜口队色细条
    add(kn,0.165,0.018,0.18,mP, 0,-0.322,0.008);              // 袜底暗线
    const ank=new THREE.Group();ank.position.y=-0.32;         // 踝 pivot
    add(ank,0.205,0.055,0.34,mSole, 0,-0.085,0.045);          // 鞋底(白)
    const sh=mk(0.19,0.11,0.255,new THREE.MeshLambertMaterial({color:0xffffff})); // 鞋面(可染色,shoes[])
    sh.position.set(0,-0.02,0.03);ank.add(sh);
    add(ank,0.188,0.075,0.10,sh.material, 0,-0.045,0.175);    // 鞋头(随鞋面色)
    add(ank,0.178,0.12,0.10,sh.material,  0,-0.005,-0.115);   // 鞋跟(随鞋面色)
    add(ank,0.045,0.082,0.185,mLace, -0.078,-0.01,0.03);      // 外侧鞋身暗条
    add(ank,0.045,0.082,0.185,mLace,  0.078,-0.01,0.03);      // 内侧鞋身暗条
    add(ank,0.14,0.024,0.12,mSole, 0,-0.006,0.19);            // 鞋头高光边
    add(ank,0.12,0.10,0.075,mSock, 0,0.03,-0.015);            // 鞋舌
    add(ank,0.10,0.04,0.11,mLace, 0,0.052,0.04);              // 鞋带
    add(ank,0.12,0.022,0.028,mLace, 0,0.078,0.09);            // 鞋带 2
    add(ank,0.21,0.028,0.30,mSole, 0,-0.052,0.045);           // 中底白条
    add(ank,0.16,0.10,0.135,mSock, 0,0.05,-0.075);            // 脚踝领
    kn.add(ank);lg.add(kn);
    g.add(lg);legs.push(lg);knees.push(kn);ankles.push(ank);shoes.push(sh);
  });
  // ---- 盆骨/短裤腰(填补躯干与腿之间) ----
  add(g,0.46,0.18,0.25,mP, 0,0.85,0);
  add(g,0.50,0.045,0.265,mJ, 0,0.945,0);                     // 球裤腰部队色条
  add(g,0.39,0.035,0.28,mP, 0,0.765,0);                      // 球裤下摆暗线
  // ---- 躯干 ----
  const bodyF=new THREE.MeshLambertMaterial({color:0xffffff});
  const bodyB=new THREE.MeshLambertMaterial({color:0xffffff});
  const body=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.6,0.27),[mJ,mJ,mJ,mJ,bodyF,bodyB]);
  body.position.y=1.10;g.add(body);
  add(g,0.045,0.5,0.21,mP, -0.255,1.10,0);                   // 左侧条纹(短裤色)
  add(g,0.045,0.5,0.21,mP,  0.255,1.10,0);                   // 右侧条纹
  add(g,0.035,0.44,0.285,mJ, -0.285,1.09,0);                 // 外侧球衣薄边
  add(g,0.035,0.44,0.285,mJ,  0.285,1.09,0);                 // 外侧球衣薄边
  add(g,0.30,0.07,0.21,mJ, 0,1.40,0);                        // 领口
  add(g,0.19,0.05,0.29,mP, -0.105,1.34,0.006);               // V领左边
  add(g,0.19,0.05,0.29,mP,  0.105,1.34,0.006);               // V领右边
  add(g,0.12,0.055,0.215,mP, -0.19,1.385,0);                 // 左肩滚边
  add(g,0.12,0.055,0.215,mP,  0.19,1.385,0);                 // 右肩滚边
  add(g,0.50,0.035,0.285,mP, 0,0.81,0);                      // 球衣下摆压线
  // ---- 脖子 + 头 ----
  add(g,0.155,0.10,0.155,mS, 0,1.45,0);                      // 脖子
  const mFace=new THREE.MeshLambertMaterial({color:0xffffff});
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.34,0.34),[mS,mS,mS,mS,mFace,mS]);
  head.position.y=1.62;g.add(head);
  add(g,0.05,0.10,0.085,mS, -0.185,1.605,0.01);              // 左耳
  add(g,0.05,0.10,0.085,mS,  0.185,1.605,0.01);              // 右耳
  add(g,0.07,0.08,0.05,mS, 0,1.598,0.18);                    // 鼻
  add(g,0.09,0.026,0.035,hairMat, -0.085,1.67,0.19);         // 立体左眉
  add(g,0.09,0.026,0.035,hairMat,  0.085,1.67,0.19);         // 立体右眉
  add(g,0.055,0.045,0.055,mS, -0.197,1.56,0.032);            // 耳垂
  add(g,0.055,0.045,0.055,mS,  0.197,1.56,0.032);            // 耳垂
  const hairGrp=new THREE.Group();g.add(hairGrp);            // 头发(按 setHair 重建)
  const beardGrp=new THREE.Group();beardGrp.visible=false;g.add(beardGrp); // 胡子
  const headband=mk(0.37,0.075,0.37,new THREE.MeshLambertMaterial({color:0xff4040}));
  headband.position.y=1.70;headband.visible=false;g.add(headband);
  // ---- 手臂 ----
  [-0.33,0.33].forEach(x=>{
    const sh2=new THREE.Group();sh2.position.set(x,1.36,0);  // 肩 pivot
    add(sh2,0.17,0.12,0.19,mJ, 0,-0.04,0);                   // 三角肌(球衣)
    add(sh2,0.15,0.035,0.2,mP, 0,-0.105,0);                  // 袖口滚边
    const up=mk(0.135,0.22,0.155,mS);up.position.y=-0.20;sh2.add(up); // 上臂
    const sl=mk(0.17,0.34,0.19,new THREE.MeshLambertMaterial({color:0x111111}));
    sl.position.y=-0.18;sl.visible=false;sh2.add(sl);        // 护臂(默认隐藏)
    const el=new THREE.Group();el.position.y=-0.32;          // 肘 pivot
    const fo=mk(0.125,0.26,0.145,mS);fo.position.y=-0.14;el.add(fo); // 前臂
    add(el,0.13,0.035,0.15,mS, 0,-0.012,0.008);              // 肘部前凸小块
    const wr=mk(0.155,0.07,0.165,new THREE.MeshLambertMaterial({color:0xffffff}));
    wr.position.y=-0.27;wr.visible=false;el.add(wr);          // 护腕(默认隐藏)
    add(el,0.13,0.115,0.145,mS, 0,-0.335,0.008);             // 手掌
    const hsx=x<0?1:-1;
    add(el,0.045,0.075,0.08,mS, hsx*0.075,-0.305,0.02);      // 拇指
    add(el,0.12,0.035,0.05,mS, 0,-0.30,0.075);               // 指节
    [-1.5,-.5,.5,1.5].forEach(i=>add(el,0.026,0.075,0.042,mS, i*0.031,-0.385,0.065)); // 四指
    sh2.add(el);g.add(sh2);
    arms.push(sh2);elbows.push(el);wrists.push(wr);sleeves.push(sl);
  });
  const o={g,legs,knees,ankles,arms,elbows,shoes,wrists,sleeves,headband,
    hair:hairGrp,hairGrp,hairMat,beardGrp,beardMat,mJ,mP,mS,bodyF,bodyB,mFace,hairStyle:"short"};
  setHair(o,"short");
  return o;
}
/* 发型:清空 hairGrp 重建,所有发块共享 hairMat */
function setHair(o,style,colorHex){
  if(colorHex!=null)o.hairMat.color.setHex(colorHex);
  const G=o.hairGrp,m=o.hairMat;
  while(G.children.length)G.remove(G.children[0]);
  o.hairStyle=style;
  const box=(w,h,d,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);G.add(b);};
  if(style==="bald")return;
  if(style==="buzz"){
    box(0.345,0.052,0.345,0,1.805,0);box(0.355,0.052,0.10,0,1.795,-0.16);
    box(0.07,0.08,0.28,-0.165,1.765,0.005);box(0.07,0.08,0.28,0.165,1.765,0.005);
    box(0.24,0.028,0.065,0,1.772,0.17);return;
  }
  if(style==="afro"){
    box(0.48,0.30,0.48,0,1.92,0);box(0.40,0.14,0.40,0,2.07,0);
    box(0.22,0.18,0.45,-0.24,1.91,0);box(0.22,0.18,0.45,0.24,1.91,0);
    box(0.36,0.16,0.18,0,1.88,0.24);box(0.36,0.16,0.18,0,1.88,-0.24);return;
  }
  if(style==="cornrows"){
    for(let i=-2;i<=2;i++)box(0.05,0.10,0.40,i*0.075,1.83,0);
    for(let i=-2;i<=2;i++)box(0.036,0.035,0.06,i*0.075,1.885,0.19);
    box(0.37,0.08,0.12,0,1.82,-0.17);box(0.08,0.07,0.11,-0.17,1.77,-0.08);box(0.08,0.07,0.11,0.17,1.77,-0.08);return;
  }
  if(style==="flattop"){
    box(0.355,0.18,0.355,0,1.88,0);box(0.37,0.10,0.12,0,1.80,-0.165);
    box(0.34,0.035,0.34,0,1.99,0);box(0.085,0.12,0.33,-0.17,1.83,0);box(0.085,0.12,0.33,0.17,1.83,0);return;
  }
  // 默认 short / fade
  box(0.355,0.10,0.36,0,1.83,0);            // 顶
  box(0.37,0.075,0.16,0,1.80,-0.17);        // 后脑
  box(0.085,0.07,0.37,-0.165,1.79,0);       // 左鬓
  box(0.085,0.07,0.37, 0.165,1.79,0);       // 右鬓
  box(0.34,0.05,0.07,0,1.80,0.165);         // 前发际
  box(0.08,0.045,0.08,-0.12,1.77,0.18);      // 前额碎发
  box(0.08,0.045,0.08, 0.12,1.77,0.18);
  box(0.055,0.07,0.16,-0.19,1.72,0.02);      // 鬓角层次
  box(0.055,0.07,0.16, 0.19,1.72,0.02);
}
/* 胡子:首次开启时构建,之后只切显隐 */
function setBeard(o,on,colorHex){
  o.beardGrp.visible=!!on;
  if(colorHex!=null)o.beardMat.color.setHex(colorHex);
  const G=o.beardGrp;
  if(!on||G.children.length)return;
  const m=o.beardMat;
  const box=(w,h,d,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);G.add(b);};
  box(0.30,0.07,0.05,0,1.515,0.165);        // 下巴
  box(0.07,0.13,0.05,-0.15,1.555,0.165);    // 左颊
  box(0.07,0.13,0.05, 0.15,1.555,0.165);    // 右颊
  box(0.12,0.045,0.05,0,1.575,0.17);        // 上唇
  box(0.08,0.035,0.052,-0.06,1.542,0.17);   // 下唇左
  box(0.08,0.035,0.052, 0.06,1.542,0.17);   // 下唇右
}
function faceTex(skinHex){
  const c="#"+skinHex.toString(16).padStart(6,"0");
  return pixTex(48,48,(g)=>{
    g.fillStyle=c;g.fillRect(0,0,48,48);
    g.fillStyle="rgba(0,0,0,.07)";g.fillRect(0,34,48,14);     // 下颌轻微暗部
    g.fillStyle="#1b120a";g.fillRect(9,16,10,3);g.fillRect(29,16,10,3);   // 眉
    g.fillStyle="#ffffff";g.fillRect(10,21,10,5);g.fillRect(28,21,10,5);   // 眼白
    g.fillStyle="#241308";g.fillRect(15,21,5,5);g.fillRect(33,21,5,5);  // 瞳
    g.fillStyle="rgba(0,0,0,.15)";g.fillRect(23,27,4,7);    // 鼻
    g.fillStyle="rgba(70,25,12,.7)";g.fillRect(17,39,15,3); // 嘴
  });
}
function jerseyTex(hex,num,big){
  const c="#"+hex.toString(16).padStart(6,"0");
  return pixTex(72,72,(g)=>{
    g.fillStyle=c;g.fillRect(0,0,72,72);
    g.fillStyle="rgba(255,255,255,.08)";g.fillRect(0,0,72,5);
    g.fillStyle="rgba(0,0,0,.12)";g.fillRect(0,62,72,10);
    if(num===""||num==null)return;
    g.font="bold "+(big?42:34)+"px Orbitron, monospace";g.textAlign="center";
    g.lineWidth=5;g.strokeStyle="rgba(0,0,0,.85)";
    g.strokeText(num,36,big?53:50);
    g.fillStyle="#fff";g.fillText(num,36,big?53:50);
  });
}
function dressGuy(o,jersey,shorts,num){
  o.mJ.color.setHex(jersey);o.mP.color.setHex(shorts);
  o.bodyF.map=jerseyTex(jersey,num,false);o.bodyF.color.setHex(0xffffff);o.bodyF.needsUpdate=true;
  o.bodyB.map=jerseyTex(jersey,num,true);o.bodyB.color.setHex(0xffffff);o.bodyB.needsUpdate=true;
}
function applyStarStyle(guy,star){
  randomizeOutfit(guy);
  dressGuy(guy,star.col[0],star.col[1],star.num);
  if(star.skin!=null){
    guy.mS.color.setHex(star.skin);
    guy.mFace.map=faceTex(star.skin);guy.mFace.color.setHex(0xffffff);guy.mFace.needsUpdate=true;
  }
  if(star.shoe!=null)guy.shoes.forEach(s=>s.material.color.setHex(star.shoe));
  if(star.headband){guy.headband.visible=true;guy.headband.material.color.setHex(star.headband);}
  else guy.headband.visible=false;
  if(star.wrist!=null)guy.wrists.forEach(w=>{w.visible=true;w.material.color.setHex(star.wrist);});
  if(star.sleeve!=null)guy.sleeves.forEach((s,i)=>{s.visible=i===1||star.id==="a03";s.material.color.setHex(star.sleeve);});
  const hc=star.hair!=null?star.hair:0x141414;
  setHair(guy, star.hairStyle||"short", hc);
  setBeard(guy, !!star.beard, (typeof star.beard==="number")?star.beard:hc);
  if(window.AIBAFaceOverlays)AIBAFaceOverlays.apply(guy,star);
}
function randomizeOutfit(o){
  const pick=a=>a[(Math.random()*a.length)|0];
  const SC=[0xff4040,0xffffff,0x111111,0x00d0ff,0xffd23f,0xff8df0,0x7CFC6B];
  const BC=[0xff4040,0xffffff,0x111111,0xffd23f,0x00d0ff,0x9b59ff];
  const SK=[0xf4c89c,0xd9a878,0x9c6b43,0x6b4a2c];
  const skin=pick(SK);o.mS.color.setHex(skin);
  o.mFace.map=faceTex(skin);o.mFace.color.setHex(0xffffff);o.mFace.needsUpdate=true;
  const sc=pick(SC);o.shoes.forEach(s=>s.material.color.setHex(sc));
  o.headband.visible=Math.random()<0.6;o.headband.material.color.setHex(pick(BC));
  o.wrists.forEach(w=>{w.visible=Math.random()<0.5;w.material.color.setHex(pick(BC));});
  o.sleeves.forEach((s,i)=>{s.visible=(i===1&&Math.random()<0.5)||(i===0&&Math.random()<0.12);
    s.material.color.setHex(pick([0x111111,0xeeeeee,0xce1141,0x1d428a]));});
  const hc=pick([0x222222,0x4a2c12,0x101010,0x5c4a1e,0x3a2410]);
  // 随机不出现光头(光头只留给指定明星如卡特),避免库里等被随机成光头
  const HS=["short","short","fade","fade","buzz","afro","cornrows","flattop"];
  setHair(o, pick(HS), hc);
  setBeard(o, Math.random()<0.3, hc);
}
const BENCH=[V3(-9.3,0,-5),V3(-9.3,0,-2.5),V3(-9.3,0,0)];
let player,pBall,passer,passerBall,rivals=[];
function buildCharacters(){
  player=voxelGuy();
  player.g.visible=false;scene.add(player.g);
  pBall=new THREE.Mesh(ballGeo,matBall);pBall.visible=false;player.g.add(pBall);
  passer=voxelGuy();
  passer.g.position.set(1.75,0,-6.85);passer.g.visible=false;scene.add(passer.g);
  passerBall=new THREE.Mesh(ballGeo,matBall);
  passerBall.position.set(0,1.12,0.32);passer.g.add(passerBall);
  for(let i=0;i<3;i++){
    const rv=voxelGuy();rv.g.visible=false;rv.active=false;scene.add(rv.g);
    rv.ball=new THREE.Mesh(ballGeo,matBall);rv.ball.visible=false;rv.g.add(rv.ball);
    rivals.push(rv);
  }
  randomizeOutfit(player);randomizeOutfit(passer);
  dressGuy(passer,0x6a727c,0x333a42,"");
}
function rivalFor(o){const i=G.opponents.indexOf(o);return rivals[i>=0?i:0];}
function benchSetup(){
  rivals.forEach((rv,i)=>{
    const o=G.stage==="final"?(i===0?G.finalist:null):G.opponents[i];
    rv.active=!!o;rv.o=o;
    if(!o)return;
    rv.g.position.copy(BENCH[i]);
    rv.g.rotation.y=faceTo(BENCH[i],V3(0,0,-4));
    rv.arms.forEach(a=>a.rotation.x=-0.3);rv.elbows.forEach(e=>e.rotation.x=-0.3);
    rv.legs.forEach(l=>l.rotation.x=0);
    rv.knees.forEach(k=>k.rotation.x=0);
    rv.ankles.forEach(a=>a.rotation.x=0);
    rv.shoes.forEach(s=>s.rotation.x=0);
    rv.g.rotation.x=0;
    rv.ball.visible=false;
  });
  benchVis();
}
function benchVis(){
  const act=(G.state==="round"||G.state==="tiebreak"||G.state==="aishow"||G.state==="battle"||G.state==="pregame"||G.state==="victorycine");
  rivals.forEach(rv=>{rv.g.visible=act&&rv.active;});
}

/* player world state */

window.AIBA.runtime.register("rendering:characters",Object.freeze({
  voxelGuy,setHair,setBeard,faceTex,jerseyTex,dressGuy,applyStarStyle,randomizeOutfit,
  buildCharacters,rivalFor,benchSetup,benchVis,
  getActors:()=>({player,playerBall:pBall,passer,passerBall,rivals})
}));

