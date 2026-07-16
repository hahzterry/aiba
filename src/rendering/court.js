/* ---------------- court floor ---------------- */
let courtFloor=null,courtIndoorTexture=null,courtOutdoorTexture=null;

function makeCourtTexture(theme){
  const PXM=48,W=32,D=COURT.floorMaxZ-COURT.floorMinZ;
  const outdoor=theme==="outdoorSunny";
  return pixTex(W*PXM,D*PXM,(g)=>{
    const u=x=>(x+W/2)*PXM,v=z=>(z-COURT.floorMinZ)*PXM;
    if(outdoor){
      g.fillStyle="#43535c";g.fillRect(0,0,W*PXM,D*PXM);
      for(let i=0;i<1800;i++){
        const c=70+((Math.random()*45)|0);g.fillStyle="rgba("+c+","+(c+5)+","+(c+8)+","+rnd(.08,.2)+")";
        const s=Math.random()<.86?1:2;g.fillRect((Math.random()*W*PXM)|0,(Math.random()*D*PXM)|0,s,s);
      }
    }else{
      for(let x=0;x<W;x++)for(let z=0;z<D;z++){
        const odd=(x+z)%2===0;
        g.fillStyle=odd?"#98683a":"#7f542d";
        g.fillRect(x*PXM,z*PXM,PXM,PXM);
        g.fillStyle="rgba(0,0,0,.12)";
        if(Math.random()<.5)g.fillRect(x*PXM,z*PXM,PXM,4);
        g.fillStyle="rgba(255,255,255,.05)";g.fillRect(x*PXM,z*PXM,4,PXM);
      }
    }
    g.fillStyle=outdoor?"rgba(20,68,62,.72)":"rgba(20,45,91,.68)";
    g.fillRect(0,0,u(-7.9),D*PXM);g.fillRect(u(7.9),0,W*PXM,D*PXM);
    g.fillRect(0,0,W*PXM,v(COURT.nearBaseline-.32));
    g.fillRect(0,v(COURT.farBaseline+.32),W*PXM,D*PXM-v(COURT.farBaseline+.32));
    g.lineWidth=8;g.strokeStyle="#f2f2f2";
    g.strokeRect(u(-COURT.halfWidth),v(COURT.nearBaseline),COURT.width*PXM,COURT.length*PXM);
    g.strokeStyle="rgba(242,242,242,.8)";g.lineWidth=7;g.lineCap="round";
    g.beginPath();g.moveTo(u(-COURT.halfWidth),v(COURT.midZ));g.lineTo(u(COURT.halfWidth),v(COURT.midZ));g.stroke();
    g.beginPath();g.arc(u(0),v(COURT.midZ),1.8*PXM,0,Math.PI*2);g.stroke();

    const nearFreeThrowZ=COURT.nearBaseline+5.79;
    const farFreeThrowZ=COURT.farBaseline-5.79;
    g.fillStyle=outdoor?"rgba(23,92,88,.26)":"rgba(25,55,108,.28)";
    g.fillRect(u(-2.45),v(COURT.nearBaseline),4.9*PXM,5.79*PXM);
    g.strokeRect(u(-2.45),v(COURT.nearBaseline),4.9*PXM,5.79*PXM);
    g.beginPath();g.arc(u(0),v(nearFreeThrowZ),1.8*PXM,0,Math.PI*2);g.stroke();

    g.strokeStyle="#d8dde2";g.lineWidth=10;g.lineCap="round";
    const arcR=7.24,cx=0,cz=HOOP.z,sideX=6.71;
    const zJoin=cz+Math.sqrt(arcR*arcR-sideX*sideX);
    g.beginPath();g.moveTo(u(-sideX),v(COURT.nearBaseline));g.lineTo(u(-sideX),v(zJoin));g.stroke();
    g.beginPath();g.moveTo(u(sideX),v(COURT.nearBaseline));g.lineTo(u(sideX),v(zJoin));g.stroke();
    const aL=Math.atan2(zJoin-cz,-sideX),aR=Math.atan2(zJoin-cz,sideX);
    g.beginPath();
    const N=64;
    for(let i=0;i<=N;i++){
      const a=aL+(aR-aL)*(i/N);
      const px=cx+Math.cos(a)*arcR,pz=cz+Math.sin(a)*arcR;
      if(i===0)g.moveTo(u(px),v(pz));else g.lineTo(u(px),v(pz));
    }
    g.stroke();

    g.strokeStyle="rgba(216,221,226,.62)";g.lineWidth=7;g.lineCap="round";
    g.strokeRect(u(-2.45),v(farFreeThrowZ),4.9*PXM,5.79*PXM);
    g.beginPath();g.arc(u(0),v(farFreeThrowZ),1.8*PXM,0,Math.PI*2);g.stroke();
    const farCz=COURT.farHoopZ,farJoin=farCz-Math.sqrt(arcR*arcR-sideX*sideX);
    g.beginPath();g.moveTo(u(-sideX),v(COURT.farBaseline));g.lineTo(u(-sideX),v(farJoin));g.stroke();
    g.beginPath();g.moveTo(u(sideX),v(COURT.farBaseline));g.lineTo(u(sideX),v(farJoin));g.stroke();
    const faL=Math.atan2(farJoin-farCz,-sideX),faR=Math.atan2(farJoin-farCz,sideX);
    g.beginPath();
    for(let i=0;i<=N;i++){
      const a=faL+(faR-faL)*(i/N);
      const px=cx+Math.cos(a)*arcR,pz=farCz+Math.sin(a)*arcR;
      if(i===0)g.moveTo(u(px),v(pz));else g.lineTo(u(px),v(pz));
    }
    g.stroke();

    g.fillStyle=outdoor?"#176b66":"#1d428a";g.beginPath();g.arc(u(0),v(COURT.midZ),2.1*PXM,0,7);g.fill();
    g.fillStyle=outdoor?"#f4e7b0":"#ffd23f";g.font="bold 56px Orbitron, monospace";g.textAlign="center";
    g.fillText("aiBA",u(0),v(COURT.midZ-.15));
    g.font="bold 34px Orbitron, monospace";g.fillText("★ RACE 100 ★",u(0),v(COURT.midZ+.8));

    function spotDecal(x,z,r,fill,line,lw,txt,txtCol,fs){
      g.fillStyle=fill;g.beginPath();g.arc(u(x),v(z),r*PXM,0,7);g.fill();
      if(line){g.strokeStyle=line;g.lineWidth=lw;g.beginPath();g.arc(u(x),v(z),r*PXM,0,7);g.stroke();}
      if(txt){g.fillStyle=txtCol;g.font="bold "+fs+"px Orbitron, monospace";g.textAlign="center";g.fillText(txt,u(x),v(z)+fs*0.36);}
    }
    for(const rk of RACKS)spotDecal(rk.p.x,rk.p.z,0.42,"rgba(124,252,107,0.06)","rgba(150,230,140,0.42)",4,null);
    for(const dp of DEEPS)spotDecal(dp.p.x,dp.p.z,0.46,"rgba(80,190,255,0.07)","rgba(120,205,255,0.45)",4,"5","rgba(190,235,255,0.7)",24);
    spotDecal(HALFCOURT.p.x,HALFCOURT.p.z,0.58,"rgba(255,210,63,0.08)","rgba(255,210,63,0.5)",4,"10","rgba(255,225,130,0.7)",27);
  },{smooth:true});
}

function buildCourt(){
  const W=32,D=COURT.floorMaxZ-COURT.floorMinZ;
  courtIndoorTexture=makeCourtTexture("indoor");
  courtFloor=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshPhongMaterial({map:courtIndoorTexture,color:0xf4eadc,specular:0x6f5337,shininess:22}));
  courtFloor.rotation.x=-Math.PI/2;
  courtFloor.position.set(0,0,(COURT.floorMinZ+COURT.floorMaxZ)/2);
  scene.add(courtFloor);
  const ringTex=pixTex(128,128,(g)=>{
    g.clearRect(0,0,128,128);
    g.strokeStyle="#fff";g.lineWidth=11;g.beginPath();g.arc(64,64,50,0,Math.PI*2);g.stroke();
    g.globalAlpha=0.45;g.lineWidth=4;g.beginPath();g.arc(64,64,38,0,Math.PI*2);g.stroke();
  });
  ringTex.magFilter=THREE.LinearFilter;ringTex.minFilter=THREE.LinearFilter;
  curSpotRing=new THREE.Mesh(new THREE.CircleGeometry(0.7,40),
    new THREE.MeshBasicMaterial({map:ringTex,color:0xffd23f,transparent:true,opacity:0.55,side:THREE.DoubleSide,depthWrite:false}));
  curSpotRing.rotation.x=-Math.PI/2;curSpotRing.position.y=0.03;curSpotRing.visible=false;scene.add(curSpotRing);
}

window.AIBA.runtime.register("rendering:court",Object.freeze({
  makeCourtTexture,buildCourt,
  getFloor:()=>courtFloor,
  getTextures:()=>({indoor:courtIndoorTexture,outdoor:courtOutdoorTexture})
}));
