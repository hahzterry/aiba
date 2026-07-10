/* ---------------- gameplay visual direction ---------------- */
(function(global){
  "use strict";

  const SKY_LOOKS=Object.freeze({
    outdoorSunny:{top:0x1e6091,horizon:0x7fb8c9,lower:0xc4d2c3},
    flowerCourt:{top:0x2779a2,horizon:0x8bc6cc,lower:0xc9d8c3},
    rainyCourt:{top:0x304658,horizon:0x788b93,lower:0x596b63},
    beachSunset:{top:0x443a61,horizon:0xe38862,lower:0xf2bd86}
  });

  function makeSkyDome(THREE,name,centerZ){
    const look=SKY_LOOKS[name]||SKY_LOOKS.outdoorSunny;
    const radius=86,geo=new THREE.SphereGeometry(radius,20,12),pos=geo.getAttribute("position");
    const colors=new Float32Array(pos.count*3),top=new THREE.Color(look.top),horizon=new THREE.Color(look.horizon),lower=new THREE.Color(look.lower),c=new THREE.Color();
    for(let i=0;i<pos.count;i++){
      const y=pos.getY(i)/radius;
      if(y>=0)c.copy(horizon).lerp(top,Math.min(1,Math.pow(y*1.8,.72)));
      else c.copy(horizon).lerp(lower,Math.min(1,-y*3.2));
      colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
    }
    geo.setAttribute("color",new THREE.BufferAttribute(colors,3));
    const mat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,depthWrite:false,fog:false});
    const mesh=new THREE.Mesh(geo,mat);mesh.name="aibaSkyDome";mesh.position.set(0,0,centerZ||0);mesh.renderOrder=-1000;mesh.frustumCulled=false;
    return mesh;
  }

  function tuneCourt(court,name){
    if(!court||!court.material)return;
    const mat=court.material;
    if(name==="indoor"){
      mat.color.setHex(0xf4eadc);mat.specular&&mat.specular.setHex(0x6f5337);mat.shininess=22;
    }else if(name==="rainyCourt"){
      mat.color.setHex(0xa9b7bb);mat.specular&&mat.specular.setHex(0x9ec7d1);mat.shininess=52;
    }else if(name==="beachSunset"){
      mat.color.setHex(0xc7b0a4);mat.specular&&mat.specular.setHex(0x6c5246);mat.shininess=9;
    }else{
      mat.color.setHex(0xd8e0dc);mat.specular&&mat.specular.setHex(0x384b52);mat.shininess=6;
    }
    mat.needsUpdate=true;
  }

  global.AIBAVisual=Object.freeze({makeSkyDome,tuneCourt});
})(window);
