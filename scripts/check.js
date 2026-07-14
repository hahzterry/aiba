#!/usr/bin/env node
"use strict";

const fs=require("fs");
const path=require("path");
const vm=require("vm");
const childProcess=require("child_process");

const root=path.resolve(__dirname,"..");
const entry="index.html";
const snapshot="block-3pt-kingv1.92-rookie-pregame.html";
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
  "src/roster-style.js",
  "src/hero-moments.js",
  "src/hot-hand.js",
  "src/result-stats.js",
  "src/gear.js",
  "src/perf.js",
  "src/perf-settings.js",
  "src/game-flow.js",
  "src/navigation.js",
  "src/scene-lifecycle.js",
  "src/visual-director.js",
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
for(const token of ["v1.92 GAME FLOW","GAME FLOW / v1.92","v1.92-rookie-pregame"])
  if(!entryHtml.includes(token))fail("visible/game version token missing "+token);
if(!entryHtml.includes('<link rel="stylesheet" href="styles.css?v=1.92">'))fail("stylesheet link missing");
if(!entryHtml.includes('<script src="src/assets-manifest.js"></script>'))fail("assets manifest script missing");
if(!entryHtml.includes('<script src="src/config.js?v=1.92"></script>'))fail("config script missing");
if(!entryHtml.includes('<script src="src/player-select.js?v=1.76"></script>'))fail("player select script missing");
if(!entryHtml.includes('<script src="src/player-locker-preview.js?v=1.76"></script>'))fail("player locker preview script missing");
if(!entryHtml.includes('<script src="src/player-id.js"></script>'))fail("player id script missing");
if(!entryHtml.includes('<script src="src/leaderboard-api.js"></script>'))fail("leaderboard api script missing");
if(!entryHtml.includes('<script src="src/leaderboard-ui.js?v=1.92"></script>'))fail("leaderboard ui script missing");
if(!entryHtml.includes('<script src="src/share.js"></script>'))fail("share script missing");
if(!entryHtml.includes('<script src="src/recorder.js?v=1.91"></script>'))fail("recorder script missing");
if(!entryHtml.includes('<script src="src/shot-physics.js"></script>'))fail("shot physics script missing");
if(!entryHtml.includes('<script src="src/result-stats.js?v=1.78"></script>'))fail("result stats script missing");
if(entryHtml.indexOf('<script src="src/result-stats.js?v=1.78"></script>')<entryHtml.lastIndexOf("animate();"))fail("result stats should load after the main inline script");
if(!entryHtml.includes('<script src="src/gear.js?v=1.81"></script>'))fail("gear script missing");
if(entryHtml.indexOf('<script src="src/gear.js?v=1.81"></script>')<entryHtml.indexOf('<script src="src/result-stats.js?v=1.78"></script>'))fail("gear script should load after result stats");
if(entryHtml.indexOf('<script src="src/gear.js?v=1.81"></script>')<entryHtml.lastIndexOf("animate();"))fail("gear script should load after the main inline script");
if(!entryHtml.includes('<script src="src/avatar-customizer.js?v=1.79"></script>'))fail("avatar customizer script missing");
if(entryHtml.indexOf('<script src="src/avatar-customizer.js?v=1.79"></script>')<entryHtml.lastIndexOf("animate();"))fail("avatar customizer should load after the main inline script");
if(!entryHtml.includes('<script src="src/shot-motion.js?v=1.80"></script>'))fail("shot motion script missing");
if(entryHtml.indexOf('<script src="src/shot-motion.js?v=1.80"></script>')<entryHtml.indexOf('<script src="src/gear.js?v=1.81"></script>'))fail("shot motion should load after gear");
if(!entryHtml.includes('<script src="src/roster-style.js?v=1.79"></script>'))fail("roster style script missing");
if(entryHtml.indexOf('<script src="src/roster-style.js?v=1.79"></script>')<entryHtml.indexOf('<script src="src/avatar-customizer.js?v=1.79"></script>'))fail("roster style should load after avatar customizer");
if(!entryHtml.includes('<script src="src/hero-moments.js?v=1.79"></script>'))fail("hero moments script missing");
if(entryHtml.indexOf('<script src="src/hero-moments.js?v=1.79"></script>')<entryHtml.indexOf('<script src="src/shot-motion.js?v=1.80"></script>'))fail("hero moments should load after shot motion");
if(!entryHtml.includes('<script src="src/hot-hand.js?v=1.81"></script>'))fail("hot hand script missing");
if(entryHtml.indexOf('<script src="src/hot-hand.js?v=1.81"></script>')<entryHtml.indexOf('<script src="src/hero-moments.js?v=1.79"></script>'))fail("hot hand should load after hero moments");
if(!entryHtml.includes('<script src="src/perf.js?v=1.72"></script>'))fail("perf script missing");
if(entryHtml.indexOf('<script src="src/perf.js?v=1.72"></script>')<entryHtml.indexOf('<script src="src/hot-hand.js?v=1.81"></script>'))fail("perf script should load after hot hand");
if(!entryHtml.includes('<script src="src/perf-settings.js?v=1.92"></script>'))fail("perf settings script missing");
if(entryHtml.indexOf('<script src="src/perf-settings.js?v=1.92"></script>')<entryHtml.indexOf('<script src="src/perf.js?v=1.72"></script>'))fail("perf settings should load after perf");
if(!entryHtml.includes('<script src="src/face-overlays.js"></script>'))fail("face overlays script missing");
if(!entryHtml.includes('<script src="src/haptics.js?v=1.80"></script>'))fail("haptics script missing");
if(!entryHtml.includes('<script src="src/visual-director.js?v=1.85"></script>'))fail("visual director script missing");
if(!entryHtml.includes('<script src="src/audio.js?v=1.88"></script>'))fail("audio script missing");
if(!entryHtml.includes('<script src="src/vision.js?v=1.91"></script>'))fail("vision script missing");
if(!entryHtml.includes('<script src="src/navigation.js?v=1.90"></script>'))fail("navigation script missing");
if(!entryHtml.includes('<script src="src/game-flow.js?v=1.92"></script>'))fail("game flow script missing");
if(/<style>[\s\S]*?<\/style>/.test(entryHtml))fail("inline style block should stay split out");
if(/const COVER_STARS=\[/.test(entryHtml)||/const EXT_AUDIO=\{/.test(entryHtml))fail("asset manifest data leaked back into html");
if(/assets\/aiba-covers\/[^"')]+\.png/.test(entryHtml))fail("runtime should not reference png cover assets");
function functionSource(name){
  const start=entryHtml.indexOf("function "+name+"(");
  if(start<0)return "";
  const end=entryHtml.indexOf("\nfunction ",start+10);
  return entryHtml.slice(start,end<0?entryHtml.length:end);
}
if(!entryHtml.includes('<script src="src/scene-lifecycle.js?v=1.88"></script>'))fail("scene lifecycle script missing");
if(!/function resetProgressiveSceneForRun\(\).*AIBASceneLifecycle\.resetForRun\(\).*applyScenePreset\(currentScenePreset,\{persist:false\}\)/.test(entryHtml))fail("progressive scene reset helper missing");
for(const name of ["startPractice","startRackRush","startBattle","startRound"]){
  if(!functionSource(name).includes("resetProgressiveSceneForRun()"))fail(name+" must reset progressive scene before a new run");
}
for(const token of ['dataset.flowerCount="0"','dataset.environmentPhase=progress<.25?"golden"'])
  if(!entryHtml.includes(token))fail("progressive scene initialization missing "+token);
for(const token of ['rush.total>=88','G.timer<=12&&window.AIBARecorder','>=85&&window.AIBARecorder'])
  if(!entryHtml.includes(token))fail("last-three-shot recorder arming missing "+token);

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
const hotHandScript=read("src/hot-hand.js");
const faceOverlaysScript=read("src/face-overlays.js");
const hapticsScript=read("src/haptics.js");
const audioScript=read("src/audio.js");
const visualDirectorScript=read("src/visual-director.js");
const sceneLifecycleScript=read("src/scene-lifecycle.js");
const styles=read("styles.css");
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
if(!leaderboardUiScript.includes("AIBARecorder.rankUpdated"))fail("leaderboard result should notify recorder when global rank arrives");
try{new Function(shareScript);}
catch(e){fail("share script syntax error: "+e.message);}
try{new Function(recorderScript);}
catch(e){fail("recorder script syntax error: "+e.message);}
if(!recorderScript.includes("AIBAAudioCaptureStream"))fail("recorder should attach audio capture stream");
if(!/function tick\(ctxObj\)\{\s*if\(!supported\(\)\|\|!state\.capturing\)return;/.test(recorderScript))fail("recorder tick must stay idle until capture starts");
for(const token of ["MOBILE?540:720","MOBILE?15:24","MOBILE?1800000:3600000"])
  if(!recorderScript.includes(token))fail("recorder mobile profile missing "+token);
for(const token of ["MAX_CLIP_MS=18000","MIN_RESULT_MS=4800","rankUpdated","最后三球已捕捉"])
  if(!recorderScript.includes(token))fail("recorder highlight window missing "+token);
for(const token of ["function drawContain","AIBAVisionFrame","portrait?(MOBILE?142:170)"])
  if(!recorderScript.includes(token))fail("portrait recorder pip missing "+token);
const firstMp4=recorderScript.indexOf("video/mp4"),firstWebm=recorderScript.indexOf("video/webm");
if(firstMp4<0||firstWebm<0||firstMp4>firstWebm)fail("recorder should prefer mp4 before webm");
try{new Function(shotPhysicsScript);}
catch(e){fail("shot physics script syntax error: "+e.message);}
try{new Function(shotMotionScript);}
catch(e){fail("shot motion script syntax error: "+e.message);}
for(const key of ["AIBAMotion","restoreLegacy","installMotionHooks","boardHit","attachBall","STANCE_YAW","tuneGuideHand"])
  if(!shotMotionScript.includes(key))fail("shot motion script missing "+key);
const rosterStyleScript=read("src/roster-style.js");
try{new Function(rosterStyleScript);}
catch(e){fail("roster style script syntax error: "+e.message);}
for(const key of ["AIBARosterStyle","ponytail","bodyProfileFor","resetBody"])
  if(!rosterStyleScript.includes(key))fail("roster style script missing "+key);
const heroMomentsScript=read("src/hero-moments.js");
try{new Function(heroMomentsScript);}
catch(e){fail("hero moments script syntax error: "+e.message);}
for(const key of ["AIBAHeroMoments","shouldHero","startHero","BATTLE_TARGET","RACK_RUSH_SPEED_TARGET"])
  if(!heroMomentsScript.includes(key))fail("hero moments script missing "+key);
if(!configScript.includes("BODY_PROFILES")||!configScript.includes("bodyProfileFor"))fail("config missing body profiles");
if(!configScript.includes("萨布丽娜")||!configScript.includes("苏·伯德"))fail("config missing female legends");
try{new Function(resultStatsScript);}
catch(e){fail("result stats script syntax error: "+e.message);}
for(const key of ["noteResultAttempt","noteResultMake","summarizeResultStats"])
  if(!resultStatsScript.includes(key))fail("result stats script missing "+key);
try{new Function(gearScript);}
catch(e){fail("gear script syntax error: "+e.message);}
if(!gearScript.includes("AIBAGear")||!gearScript.includes("aiba_gear_v1"))fail("gear script missing AIBAGear exports");
for(const key of ["staRing","staArc","positionHud","CAM.mode"])
  if(!gearScript.includes(key))fail("gear script missing stamina ring "+key);
for(const key of ["黑面具","太阳镜","连帽衫","奇葩头套","mods"])
  if(!gearScript.includes(key))fail("gear script missing head gear "+key);
for(const name of ["playerSweetZone","playerChargeRate","startCharge","releaseShot"])
  if(!gearScript.includes('"'+name+'"'))fail("gear script no longer hooks "+name);
try{new Function(hotHandScript);}
catch(e){fail("hot hand script syntax error: "+e.message);}
for(const key of ["AIBAHotHand","levelFor","tagLastShotHot","setCrowdHeat","hotHandWrap"])
  if(!hotHandScript.includes(key))fail("hot hand script missing "+key);
const perfScript=read("src/perf.js");
try{new Function(perfScript);}
catch(e){fail("perf script syntax error: "+e.message);}
if(!perfScript.includes("AIBAPerf")||!perfScript.includes("freezeStatic"))fail("perf script missing AIBAPerf exports");
if(/HandLandmarker|minPoseDetectionConfidence|detectForVideo/.test(perfScript))fail("perf script must not touch pose detection");
const perfSettingsScript=read("src/perf-settings.js");
try{new Function(perfSettingsScript);}
catch(e){fail("perf settings script syntax error: "+e.message);}
for(const key of ["AIBAPerfSettings","aiba_perf_settings_v1","meterTick","applyLowRes","autoSample","recorderBusy","autoPerfTier"])
  if(!perfSettingsScript.includes(key))fail("perf settings script missing "+key);
if(/HandLandmarker|minPoseDetectionConfidence|detectForVideo/.test(perfSettingsScript))fail("perf settings must not touch pose detection");
try{new Function(faceOverlaysScript);}
catch(e){fail("face overlays script syntax error: "+e.message);}
try{new Function(hapticsScript);}
catch(e){fail("haptics script syntax error: "+e.message);}
for(const key of ["HAPTIC_PATTERNS","clutchMake","heroShot","victory","wireHapticMoments","playerRimHaptic"])
  if(!hapticsScript.includes(key))fail("haptics script missing "+key);
if(!faceOverlaysScript.includes("curry-smile-pixel-128.png"))fail("curry face overlay asset not referenced");
const configSandbox={window:{}};
vm.createContext(configSandbox);
try{vm.runInContext(configScript,configSandbox,{filename:"src/config.js"});}
catch(e){fail("config script runtime error: "+e.message);}
if(!configSandbox.window.AIBA_CONFIG||!configSandbox.window.AIBA_CONFIG.DIFFS)fail("AIBA_CONFIG missing required data");
try{new Function(audioScript);}
catch(e){fail("audio script syntax error: "+e.message);}
try{new Function(visualDirectorScript);}
catch(e){fail("visual director script syntax error: "+e.message);}
for(const key of ["AIBAVisual","makeSkyDome","tuneCourt"])
  if(!visualDirectorScript.includes(key))fail("visual director missing "+key);
try{new Function(sceneLifecycleScript);}
catch(e){fail("scene lifecycle script syntax error: "+e.message);}
for(const key of ["AIBASceneLifecycle","resetForRun","resetFlowerLayer","resetBeach"])
  if(!sceneLifecycleScript.includes(key))fail("scene lifecycle missing "+key);
if(/\bglobal\./.test(audioScript))fail("audio script must use browser globals, not bare global");
if(!audioScript.includes("AIBAAudioCaptureStream"))fail("audio capture stream hook missing");
if(/\n\s*preloadVoiceClips\(\);/.test(audioScript))fail("audio startup must not preload the full voice library");
for(const key of ['dataset.audioVoices="on-demand"',"noteAudioIssue","AC.resume()"])
  if(!audioScript.includes(key))fail("audio lazy startup missing "+key);
const earlyExtInit=audioScript.indexOf("\nextInit();"),audioInitFn=audioScript.indexOf("function audioInit()");
if(earlyExtInit<0||earlyExtInit>audioInitFn)fail("external BGM must be prepared before first user gesture");
if(!/function ensureAudio\(menuMusic,forcePrime\)\{[\s\S]{0,180}extPlay\("bgm"\);[\s\S]{0,80}audioInit\(\);/.test(audioScript))fail("menu BGM must start before heavy WebAudio initialization");
if(!audioScript.includes("mediaRetryAt[k]=Date.now()+2500"))fail("failed media playback should use retry cooldown");
for(const key of ["crowdHeat","setCrowdHeat","AIBAAudio"])
  if(!audioScript.includes(key))fail("audio script missing crowd heat "+key);
const voiceFiles=new Set([...audioScript.matchAll(/voiceUrl\("([^"]+\.wav)"\)/g)].map(m=>m[1]));
if(!voiceFiles.size)fail("no voiceUrl wav references found in audio script");
for(const file of voiceFiles){
  const rel=path.posix.join("assets/aiba-audio/voices",file);
  if(!exists(rel))fail("missing referenced voice clip "+rel);
}
const audioEventsBlock=(audioScript.match(/const AUDIO_EVENTS = \{([\s\S]*?)\n\};/)||[])[1]||"";
const audioEvents=[...audioEventsBlock.matchAll(/\n\s*([A-Za-z0-9_]+):\s*\[([^\]]*)\]/g)].map(m=>({id:m[1],files:[...m[2].matchAll(/"([^"]+)"/g)].map(x=>x[1])}));
if(audioEvents.length<30)fail("AUDIO_EVENTS unexpectedly small: "+audioEvents.length);
const allCode=entryHtml+"\n"+audioScript+"\n"+read("src/vision.js")+"\n"+playerSelectScript+"\n"+leaderboardUiScript+"\n"+recorderScript+"\n"+gearScript+"\n"+read("src/nba-dna/NBADNA.js");
for(const ev of audioEvents){
  if(!new RegExp('playAudioEvent\\(\\s*["\\\']'+ev.id+'["\\\']').test(allCode))fail("AUDIO_EVENTS entry has no direct trigger "+ev.id);
  for(const name of ev.files){
    const rel=path.posix.join("assets/aiba-audio/voices",name+".wav");
    if(!exists(rel))fail("missing AUDIO_EVENTS clip "+rel);
  }
}
for(const name of new Set([...allCode.matchAll(/playSFX\(\s*["']([^"']+)["']/g)].map(m=>m[1]))){
  const rel=path.posix.join("assets/aiba-audio/voices",name+".wav");
  if(!exists(rel))fail("missing SFX clip "+rel);
}
const vision=read("src/vision.js");
try{new Function(vision);}
catch(e){fail("vision script syntax error: "+e.message);}
for(const token of ["aiba_shot_control_v1","触屏控制","体感控制","controlRecommend","restoreVisionControlPreference"])
  if(!vision.includes(token))fail("motion control preference token missing "+token);
for(const token of ["VISION_INFERENCE_MAX_PIXELS=288*512","visionCaptureConstraints","aspectRatio:{ideal:portrait?9/16:4/3}","visionInferenceSource","AIBAVisionFrame","请保持手机竖屏"])
  if(!vision.includes(token))fail("portrait vision token missing "+token);
for(const token of ['aspect-ratio:var(--vision-aspect,9/16)','data-orientation="portrait"'])
  if(!styles.includes(token))fail("portrait vision style missing "+token);
if(vision.includes("视觉实验"))fail("legacy vision experiment label remains");
if(vision.includes('import("./vendor/'))fail("vision module import path should be relative from src/");
if(/HandLandmarker|hand_landmarker\.task/.test(vision))fail("game vision path should not load hand landmarker");
const navigation=read("src/navigation.js");
try{new Function(navigation);}
catch(e){fail("navigation script syntax error: "+e.message);}
for(const token of ["homeBtn","requestHome","cleanup","removeEventListener(\"pointerdown\",unlockBoot)","addEventListener(\"pointerup\""])
  if(!navigation.includes(token))fail("navigation flow token missing "+token);
for(const token of ["function cancel()",",cancel,resultMarkup"])
  if(!recorderScript.includes(token))fail("recorder cancellation missing "+token);
const gameFlow=read("src/game-flow.js");
try{new Function(gameFlow);}
catch(e){fail("game flow script syntax error: "+e.message);}
for(const token of ["rookieMeterProgress","G.diff===\"easy\"","updatePregameWarmupShot","updatePregameChalk"])
  if(!gameFlow.includes(token))fail("game flow token missing "+token);

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
