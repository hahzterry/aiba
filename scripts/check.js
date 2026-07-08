#!/usr/bin/env node
"use strict";

const fs=require("fs");
const path=require("path");
const vm=require("vm");
const childProcess=require("child_process");

const root=path.resolve(__dirname,"..");
const entry="index.html";
const snapshot="block-3pt-kingv1.78-result-radar.html";
const requiredFiles=[
  entry,
  snapshot,
  "styles.css",
  "src/assets-manifest.js",
  "src/config.js",
  "src/player-select.js",
  "src/player-locker-preview.js",
  "src/avatar-customizer.js",
  "src/player-id.js",
  "src/leaderboard-api.js",
  "src/leaderboard-ui.js",
  "src/share.js",
  "src/recorder.js",
  "src/shot-physics.js",
  "src/shot-motion.js",
  "src/result-stats.js",
  "src/gear.js",
  "src/perf.js",
  "src/face-overlays.js",
  "src/haptics.js",
  "src/audio.js",
  "src/vision.js",
  "assets/aiba-faces/curry-smile-pixel-128.png",
  "vendor/three.min.r128.js",
  "assets/aiba-vision/pose_landmarker_lite.task"
];

function read(rel){return fs.readFileSync(path.join(root,rel),"utf8");}
function exists(rel){return fs.existsSync(path.join(root,rel));}
function fail(msg){console.error("check failed:",msg);process.exit(1);}

for(const file of requiredFiles){
  if(!exists(file))fail("missing required file "+file);
}

const entryHtml=read(entry);
const snapshotHtml=read(snapshot);
if(entryHtml!==snapshotHtml)fail(entry+" and "+snapshot+" differ");
if(/^(<<<<<<<|=======|>>>>>>>)$/m.test(entryHtml))fail("conflict marker in html");
if(!entryHtml.includes('<link rel="stylesheet" href="styles.css">'))fail("stylesheet link missing");
if(!entryHtml.includes('<script src="src/assets-manifest.js"></script>'))fail("assets manifest script missing");
if(!entryHtml.includes('<script src="src/config.js"></script>'))fail("config script missing");
if(!entryHtml.includes('<script src="src/player-select.js?v=1.76"></script>'))fail("player select script missing");
if(!entryHtml.includes('<script src="src/player-locker-preview.js?v=1.76"></script>'))fail("player locker preview script missing");
if(!entryHtml.includes('<script src="src/player-id.js"></script>'))fail("player id script missing");
if(!entryHtml.includes('<script src="src/leaderboard-api.js"></script>'))fail("leaderboard api script missing");
if(!entryHtml.includes('<script src="src/leaderboard-ui.js?v=1.78"></script>'))fail("leaderboard ui script missing");
if(!entryHtml.includes('<script src="src/share.js"></script>'))fail("share script missing");
if(!entryHtml.includes('<script src="src/recorder.js?v=1.78"></script>'))fail("recorder script missing");
if(!entryHtml.includes('<script src="src/shot-physics.js"></script>'))fail("shot physics script missing");
if(!entryHtml.includes('<script src="src/result-stats.js?v=1.78"></script>'))fail("result stats script missing");
if(entryHtml.indexOf('<script src="src/result-stats.js?v=1.78"></script>')<entryHtml.lastIndexOf("animate();"))fail("result stats should load after the main inline script");
if(!entryHtml.includes('<script src="src/gear.js?v=1.78"></script>'))fail("gear script missing");
if(entryHtml.indexOf('<script src="src/gear.js?v=1.78"></script>')<entryHtml.indexOf('<script src="src/result-stats.js?v=1.78"></script>'))fail("gear script should load after result stats");
if(entryHtml.indexOf('<script src="src/gear.js?v=1.78"></script>')<entryHtml.lastIndexOf("animate();"))fail("gear script should load after the main inline script");
if(!entryHtml.includes('<script src="src/avatar-customizer.js?v=1.76"></script>'))fail("avatar customizer script missing");
if(entryHtml.indexOf('<script src="src/avatar-customizer.js?v=1.76"></script>')<entryHtml.lastIndexOf("animate();"))fail("avatar customizer should load after the main inline script");
if(!entryHtml.includes('<script src="src/shot-motion.js?v=1.77"></script>'))fail("shot motion script missing");
if(entryHtml.indexOf('<script src="src/shot-motion.js?v=1.77"></script>')<entryHtml.indexOf('<script src="src/gear.js?v=1.78"></script>'))fail("shot motion should load after gear");
if(!entryHtml.includes('<script src="src/perf.js?v=1.72"></script>'))fail("perf script missing");
if(entryHtml.indexOf('<script src="src/perf.js?v=1.72"></script>')<entryHtml.lastIndexOf("animate();"))fail("perf script should load after the main inline script");
if(!entryHtml.includes('<script src="src/face-overlays.js"></script>'))fail("face overlays script missing");
if(!entryHtml.includes('<script src="src/haptics.js"></script>'))fail("haptics script missing");
if(!entryHtml.includes('<script src="src/audio.js"></script>'))fail("audio script missing");
if(!entryHtml.includes('<script src="src/vision.js"></script>'))fail("vision script missing");
if(/<style>[\s\S]*?<\/style>/.test(entryHtml))fail("inline style block should stay split out");
if(/const COVER_STARS=\[/.test(entryHtml)||/const EXT_AUDIO=\{/.test(entryHtml))fail("asset manifest data leaked back into html");
if(/assets\/aiba-covers\/[^"')]+\.png/.test(entryHtml))fail("runtime should not reference png cover assets");

function inlineScriptLineCount(html){
  return [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(m=>m[1]).filter(s=>s.trim()).reduce((n,s)=>n+s.replace(/\s+$/,"").split(/\r?\n/).length,0);
}
const inlineLines=inlineScriptLineCount(entryHtml);
try{
  const baseHtml=childProcess.execFileSync("git",["show","HEAD:index.html"],{cwd:root,encoding:"utf8",stdio:["ignore","pipe","ignore"]});
  const baseLines=inlineScriptLineCount(baseHtml);
  if(inlineLines>baseLines)fail("inline script line count grew "+inlineLines+" > "+baseLines);
}catch(e){}

const inlineScripts=[...entryHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(m=>m[1]).filter(s=>s.trim());
for(const [i,script] of inlineScripts.entries()){
  try{new Function(script);}
  catch(e){fail("inline script "+i+" syntax error: "+e.message);}
}

const manifest=read("src/assets-manifest.js");
const configScript=read("src/config.js");
const playerSelectScript=read("src/player-select.js");
const playerLockerPreviewScript=read("src/player-locker-preview.js");
const avatarCustomizerScript=read("src/avatar-customizer.js");
const playerIdScript=read("src/player-id.js");
const leaderboardApiScript=read("src/leaderboard-api.js");
const leaderboardUiScript=read("src/leaderboard-ui.js");
const shareScript=read("src/share.js");
const recorderScript=read("src/recorder.js");
const shotPhysicsScript=read("src/shot-physics.js");
const shotMotionScript=read("src/shot-motion.js");
const resultStatsScript=read("src/result-stats.js");
const gearScript=read("src/gear.js");
const faceOverlaysScript=read("src/face-overlays.js");
const audioScript=read("src/audio.js");
try{new Function(configScript);}
catch(e){fail("config script syntax error: "+e.message);}
try{new Function(playerSelectScript);}
catch(e){fail("player select script syntax error: "+e.message);}
try{new Function(playerLockerPreviewScript);}
catch(e){fail("player locker preview script syntax error: "+e.message);}
try{new Function(avatarCustomizerScript);}
catch(e){fail("avatar customizer script syntax error: "+e.message);}
for(const key of ["AIBACustomizer","customStar","saveUse","applyCustomHead","customHead"])
  if(!avatarCustomizerScript.includes(key))fail("avatar customizer script missing "+key);
try{new Function(playerIdScript);}
catch(e){fail("player id script syntax error: "+e.message);}
try{new Function(leaderboardApiScript);}
catch(e){fail("leaderboard api script syntax error: "+e.message);}
try{new Function(leaderboardUiScript);}
catch(e){fail("leaderboard ui script syntax error: "+e.message);}
try{new Function(shareScript);}
catch(e){fail("share script syntax error: "+e.message);}
try{new Function(recorderScript);}
catch(e){fail("recorder script syntax error: "+e.message);}
if(!recorderScript.includes("AIBAAudioCaptureStream"))fail("recorder should attach audio capture stream");
const firstMp4=recorderScript.indexOf("video/mp4"),firstWebm=recorderScript.indexOf("video/webm");
if(firstMp4<0||firstWebm<0||firstMp4>firstWebm)fail("recorder should prefer mp4 before webm");
try{new Function(shotPhysicsScript);}
catch(e){fail("shot physics script syntax error: "+e.message);}
try{new Function(shotMotionScript);}
catch(e){fail("shot motion script syntax error: "+e.message);}
for(const key of ["AIBAMotion","restoreLegacy","installMotionHooks","boardHit","attachBall","STANCE_YAW","tuneGuideHand"])
  if(!shotMotionScript.includes(key))fail("shot motion script missing "+key);
try{new Function(resultStatsScript);}
catch(e){fail("result stats script syntax error: "+e.message);}
for(const key of ["noteResultAttempt","noteResultMake","summarizeResultStats"])
  if(!resultStatsScript.includes(key))fail("result stats script missing "+key);
try{new Function(gearScript);}
catch(e){fail("gear script syntax error: "+e.message);}
if(!gearScript.includes("AIBAGear")||!gearScript.includes("aiba_gear_v1"))fail("gear script missing AIBAGear exports");
for(const key of ["黑面具","太阳镜","连帽衫","奇葩头套","mods"])
  if(!gearScript.includes(key))fail("gear script missing head gear "+key);
for(const name of ["playerSweetZone","playerChargeRate","startCharge","releaseShot"])
  if(!gearScript.includes('"'+name+'"'))fail("gear script no longer hooks "+name);
const perfScript=read("src/perf.js");
try{new Function(perfScript);}
catch(e){fail("perf script syntax error: "+e.message);}
if(!perfScript.includes("AIBAPerf")||!perfScript.includes("freezeStatic"))fail("perf script missing AIBAPerf exports");
if(/HandLandmarker|minPoseDetectionConfidence|detectForVideo/.test(perfScript))fail("perf script must not touch pose detection");
try{new Function(faceOverlaysScript);}
catch(e){fail("face overlays script syntax error: "+e.message);}
if(!faceOverlaysScript.includes("curry-smile-pixel-128.png"))fail("curry face overlay asset not referenced");
const configSandbox={window:{}};
vm.createContext(configSandbox);
try{vm.runInContext(configScript,configSandbox,{filename:"src/config.js"});}
catch(e){fail("config script runtime error: "+e.message);}
if(!configSandbox.window.AIBA_CONFIG||!configSandbox.window.AIBA_CONFIG.DIFFS)fail("AIBA_CONFIG missing required data");
try{new Function(audioScript);}
catch(e){fail("audio script syntax error: "+e.message);}
if(!audioScript.includes("AIBAAudioCaptureStream"))fail("audio capture stream hook missing");
const voiceFiles=new Set([...audioScript.matchAll(/voiceUrl\("([^"]+\.wav)"\)/g)].map(m=>m[1]));
if(!voiceFiles.size)fail("no voiceUrl wav references found in audio script");
for(const file of voiceFiles){
  const rel=path.posix.join("assets/aiba-audio/voices",file);
  if(!exists(rel))fail("missing referenced voice clip "+rel);
}
const vision=read("src/vision.js");
try{new Function(vision);}
catch(e){fail("vision script syntax error: "+e.message);}
if(vision.includes('import("./vendor/'))fail("vision module import path should be relative from src/");
if(/HandLandmarker|hand_landmarker\.task/.test(vision))fail("game vision path should not load hand landmarker");

const sandbox={window:{}};
vm.createContext(sandbox);
try{vm.runInContext(manifest,sandbox,{filename:"src/assets-manifest.js"});}
catch(e){fail("assets manifest syntax error: "+e.message);}
const assets=sandbox.window.AIBA_ASSETS;
if(!assets)fail("AIBA_ASSETS missing");
if(!Array.isArray(assets.coverStars)||assets.coverStars.length!==5)fail("coverStars should have 5 entries");
for(const star of assets.coverStars){
  if(!star.id||!star.cover||!star.coverVideo)fail("cover star missing fields");
  if(!/\.webp$/.test(star.cover))fail("cover image should be webp for "+star.id);
  if(!/-lite\.mp4$/.test(star.coverVideo))fail("cover video should use lite mp4 for "+star.id);
  if(!exists(star.cover))fail("missing cover image "+star.cover);
  if(!exists(star.coverVideo))fail("missing cover video "+star.coverVideo);
}
for(const key of ["bgm","crowd","crowdCheer","rain","ocean","gull"]){
  const rel=assets.audio&&assets.audio[key];
  if(!rel)fail("audio key missing "+key);
  if(!exists(rel))fail("missing audio file "+rel);
}

console.log("check ok:",inlineScripts.length+" inline scripts,",inlineLines+" inline lines,",assets.coverStars.length+" cover stars");
