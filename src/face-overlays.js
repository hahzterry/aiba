/* ---------------- optional cartoon face overlays ---------------- */
(function(global){
  "use strict";
  const FACE_BY_NAME=Object.freeze({
    curry:"assets/aiba-faces/curry-smile-pixel-128.png"
  });
  const cache=Object.create(null);
  function texture(path){
    if(cache[path])return cache[path];
    const tex=new THREE.TextureLoader().load(path,()=>{tex.needsUpdate=true;});
    tex.magFilter=THREE.NearestFilter;
    tex.minFilter=THREE.NearestMipMapNearestFilter;
    tex.generateMipmaps=true;
    if(THREE.sRGBEncoding)tex.encoding=THREE.sRGBEncoding;
    cache[path]=tex;
    return tex;
  }
  function pathFor(star){
    if(!star)return "";
    return star.faceOverlay||FACE_BY_NAME[star.n]||FACE_BY_NAME[star.id]||"";
  }
  function apply(guy,star){
    const path=pathFor(star);
    if(!path||!guy||!guy.mFace||typeof THREE==="undefined")return false;
    guy.mFace.map=texture(path);
    guy.mFace.color.setHex(0xffffff);
    guy.mFace.needsUpdate=true;
    if(guy.beardGrp)guy.beardGrp.visible=false;
    guy._faceOverlay=path;
    return true;
  }
  global.AIBAFaceOverlays=Object.freeze({apply,pathFor});
})(window);
