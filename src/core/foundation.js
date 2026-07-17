"use strict";

const $=id=>document.getElementById(id);
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

