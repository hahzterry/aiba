function bannerTex(txt,bg,fg){
  return pixTex(768,144,(g)=>{
    g.fillStyle=bg;g.fillRect(0,0,768,144);
    g.fillStyle="rgba(255,255,255,.06)";
    for(let i=0;i<768;i+=24)g.fillRect(i,0,12,144);
    g.fillStyle=fg;g.font="bold 66px Orbitron, monospace";g.textAlign="center";g.textBaseline="middle";
    g.fillText(txt,384,75);
  },{smooth:true});
}
function buildStands(){
  const stepGeo=new THREE.BoxGeometry(1,1,1);
  const stepMat=new THREE.MeshLambertMaterial({color:0x2b2b38});
  const seats=[];
  function side(cx,cz,len,axis,inward,rows){
    for(let r=0;r<rows;r++){
      const off=(r*1.25+0.6);
      const m=new THREE.Mesh(stepGeo,stepMat);
      const h=0.85*(r+1);
      if(axis==="x"){m.scale.set(len,h,1.25);m.position.set(cx,h/2,cz-inward*off);}
      else{m.scale.set(1.25,h,len);m.position.set(cx-inward*off,h/2,cz);}
      indoorRoot.add(m);
      const n=Math.floor(len/1.15);
      for(let s=0;s<n;s++){
        if(Math.random()<0.1)continue;
        const t=-len/2+0.6+s*1.15+rnd(-0.1,0.1);
        const px=axis==="x"?cx+t:cx-inward*off;
        const pz=axis==="x"?cz-inward*off:cz+t;
        seats.push({x:px,y:h+0.42,z:pz,ph:Math.random()*7,amp:rnd(.7,1.3)});
      }
    }
  }
  side(0,COURT.nearBaseline-2,26,"x",1,5);       // active basket end
  side(0,COURT.farBaseline+2,26,"x",-1,4);       // far end
  side(-13.4,COURT.midZ,COURT.length+4,"z",1,5); // left sideline
  side(13.4,COURT.midZ,COURT.length+4,"z",-1,5); // right sideline
  // banner walls
  const banners=[["aiBA PERCENT BATTLE","#13213f","#ffd23f"],["MINE-DEW 深远三分区","#0c3a14","#9dff8d"],["像素之夜 PIXEL NIGHT","#3a1240","#ff9df1"]];
  const wallDefs=[
    [0,3.6,COURT.nearBaseline-9.4,0,26],
    [-19.5,3.6,COURT.midZ,Math.PI/2,38],
    [19.5,3.6,COURT.midZ,-Math.PI/2,38],
    [0,3.6,COURT.farBaseline+7.5,Math.PI,26]
  ];
  wallDefs.forEach((w,i)=>{
    const b=banners[i%banners.length];
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w[4],4),
      new THREE.MeshBasicMaterial({map:bannerTex(b[0],b[1],b[2])}));
    m.position.set(w[0],w[1]+4.5,w[2]);m.rotation.y=w[3];indoorRoot.add(m);
  });
  return seats;
}

/* backcourt show: the far half is atmosphere only, shooting stays on the same half */
const showCrew=[];
function showBox(parent,geo,mat,x,y,z,sx,sy,sz){
  const m=new THREE.Mesh(geo,mat);
  m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);
  return m;
}
function makeAdBoard(txt,bg,fg,x,z,rot,w=2.7){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,0.72),
    new THREE.MeshBasicMaterial({map:bannerTex(txt,bg,fg),side:THREE.DoubleSide}));
  m.position.set(x,0.66,z);m.rotation.y=rot;indoorRoot.add(m);
  return m;
}
function makeCheerleader(x,z,jersey,pom){
  const g=new THREE.Group();
  const cube=new THREE.BoxGeometry(1,1,1);
  const skin=new THREE.MeshLambertMaterial({color:0xf4c89c});
  const hair=new THREE.MeshLambertMaterial({color:0x2b1710});
  const shirt=new THREE.MeshLambertMaterial({color:jersey});
  const dark=new THREE.MeshLambertMaterial({color:0x202431});
  const pomMat=new THREE.MeshLambertMaterial({color:pom,emissive:pom,emissiveIntensity:.18});
  showBox(g,cube,shirt,0,0.82,0,0.34,0.62,0.22);
  showBox(g,cube,skin,0,1.32,0,0.26,0.26,0.24);
  showBox(g,cube,hair,0,1.48,-0.02,0.3,0.12,0.26);
  showBox(g,cube,dark,-0.12,0.34,0,0.11,0.5,0.12);
  showBox(g,cube,dark,0.12,0.34,0,0.11,0.5,0.12);
  const leftArm=showBox(g,cube,skin,-0.33,1.0,0,0.09,0.42,0.1);
  const rightArm=showBox(g,cube,skin,0.33,1.0,0,0.09,0.42,0.1);
  const leftPom=showBox(g,cube,pomMat,-0.43,1.24,0,0.22,0.22,0.22);
  const rightPom=showBox(g,cube,pomMat,0.43,1.24,0,0.22,0.22,0.22);
  g.position.set(x,0,z);
  g.rotation.y=x<0?0.35:-0.35;
  indoorRoot.add(g);
  showCrew.push({type:"cheer",g,arms:[leftArm,rightArm],poms:[leftPom,rightPom],phase:Math.random()*7});
}
function makeMascot(x,z){
  const g=new THREE.Group();
  const cube=new THREE.BoxGeometry(1,1,1);
  const orange=new THREE.MeshLambertMaterial({color:0xf28b22});
  const cream=new THREE.MeshLambertMaterial({color:0xffd2a1});
  const dark=new THREE.MeshLambertMaterial({color:0x1e1210});
  showBox(g,cube,orange,0,0.82,0,0.56,0.82,0.42);
  showBox(g,cube,orange,0,1.55,0,0.64,0.54,0.48);
  showBox(g,cube,cream,0,1.45,-0.26,0.42,0.24,0.08);
  showBox(g,cube,dark,-0.18,1.62,-0.3,0.07,0.07,0.04);
  showBox(g,cube,dark,0.18,1.62,-0.3,0.07,0.07,0.04);
  showBox(g,cube,orange,-0.28,1.9,0,0.18,0.18,0.12).rotation.z=0.45;
  showBox(g,cube,orange,0.28,1.9,0,0.18,0.18,0.12).rotation.z=-0.45;
  const stripes=[-0.25,0,0.25].map(px=>showBox(g,cube,dark,px,1.57,-0.33,0.04,0.24,0.03));
  const armL=showBox(g,cube,orange,-0.52,1.15,0,0.15,0.62,0.16);
  const armR=showBox(g,cube,orange,0.52,1.15,0,0.15,0.62,0.16);
  showBox(g,cube,dark,-0.18,0.18,0,0.15,0.34,0.14);
  showBox(g,cube,dark,0.18,0.18,0,0.15,0.34,0.14);
  g.position.set(x,0,z);g.rotation.y=-0.55;indoorRoot.add(g);
  showCrew.push({type:"mascot",g,arms:[armL,armR],stripes,phase:Math.random()*7});
}
function buildBackcourtShow(){
  makeAdBoard("N1KE AIR","#11131a","#f7f7f7",-8.05,COURT.midZ+4.2,Math.PI/2,2.6);
  makeAdBoard("ADI-DASH","#f7f7f7","#11131a",-8.05,COURT.midZ+7.5,Math.PI/2,2.6);
  makeAdBoard("PIXEL SPORT","#182f61","#ffd23f",8.05,COURT.midZ+4.2,-Math.PI/2,2.8);
  makeAdBoard("BLOCKADE","#3b132f","#ffb7ec",8.05,COURT.midZ+7.5,-Math.PI/2,2.8);
  makeAdBoard("MINE-DEW","#0c3a14","#9dff8d",-4.6,COURT.farBaseline-.2,Math.PI,3.0);
  makeAdBoard("COURT CAM","#27212f","#9fd1ff",0,COURT.farBaseline-.2,Math.PI,3.0);
  makeAdBoard("3PT KING","#5b1212","#ffd23f",4.6,COURT.farBaseline-.2,Math.PI,3.0);
  const cheerPos=[[-5.8,COURT.midZ+6.1],[-4.7,COURT.midZ+7.4],[-3.6,COURT.midZ+6.3],[3.6,COURT.midZ+6.3],[4.7,COURT.midZ+7.4],[5.8,COURT.midZ+6.1]];
  cheerPos.forEach((p,i)=>makeCheerleader(p[0],p[1],i%2?0xffc72c:0x1d428a,i%2?0x7CFC6B:0xff4fd8));
  makeMascot(6.35,COURT.midZ+8.2);
}
function updBackcourtShow(t){
  if(!indoorRoot.visible)return;
  showCrew.forEach((c,i)=>{
    const s=Math.sin(t*5+c.phase), c2=Math.cos(t*4.2+c.phase);
    if(c.type==="mascot"){
      c.g.position.y=Math.max(0,s)*0.08;
      c.g.rotation.y=-0.55+Math.sin(t*2+c.phase)*0.08;
      c.arms[0].rotation.z=0.5+Math.sin(t*4+c.phase)*0.35;
      c.arms[1].rotation.z=-0.9+Math.sin(t*5+c.phase)*0.45;
    }else{
      c.g.position.y=Math.max(0,s)*0.05;
      c.g.rotation.y+=(c2*0.0015);
      c.arms[0].rotation.z=-0.75+s*0.55;
      c.arms[1].rotation.z=0.75-s*0.55;
      c.poms[0].position.y=1.24+Math.max(0,s)*0.18;
      c.poms[1].position.y=1.24+Math.max(0,-s)*0.18;
    }
  });
}
/* crowd: grouped instanced meshes (no per-instance color needed) */
const crowd={groups:[],dummy:new THREE.Object3D()};
function buildCrowd(seats){
  const bodyCols=[0x1d428a,0xffc72c,0xce1141,0xf5f5f5,0x007a33,0xe56020];
  const headCols=[0xf4c89c,0xd9a066,0x8d5524];
  const bodyGeo=new THREE.BoxGeometry(0.55,0.75,0.4);
  const headGeo=new THREE.BoxGeometry(0.38,0.38,0.38);
  const buckets=bodyCols.map(()=>[]);
  seats.forEach(s=>buckets[(Math.random()*bodyCols.length)|0].push(s));
  buckets.forEach((arr,i)=>{
    if(!arr.length)return;
    const body=new THREE.InstancedMesh(bodyGeo,new THREE.MeshLambertMaterial({color:bodyCols[i]}),arr.length);
    const head=new THREE.InstancedMesh(headGeo,new THREE.MeshLambertMaterial({color:headCols[i%3]}),arr.length);
    indoorRoot.add(body);indoorRoot.add(head);
    crowd.groups.push({body,head,seats:arr});
  });
}
function updCrowd(t){
  if(!indoorRoot.visible)return;
  const d=crowd.dummy;
  for(const g of crowd.groups){
    for(let i=0;i<g.seats.length;i++){
      const s=g.seats[i];
      const jump=Math.max(0,Math.sin(t*9+s.ph))*0.4*G.cheer*s.amp;
      const sway=Math.sin(t*1.4+s.ph)*0.035;
      d.position.set(s.x,s.y+jump+sway,s.z);
      d.rotation.y=Math.sin(s.ph)*0.4;
      d.updateMatrix();g.body.setMatrixAt(i,d.matrix);
      d.position.y+=0.58;d.updateMatrix();g.head.setMatrixAt(i,d.matrix);
    }
    g.body.instanceMatrix.needsUpdate=true;
    g.head.instanceMatrix.needsUpdate=true;
  }
}


window.AIBA.runtime.register("rendering:arena",Object.freeze({
  bannerTex,buildStands,showBox,makeAdBoard,buildBackcourtShow,updBackcourtShow,buildCrowd,updCrowd
}));

