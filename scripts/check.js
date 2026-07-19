#!/usr/bin/env node
"use strict";

const fs=require("fs");
const path=require("path");
const vm=require("vm");
const childProcess=require("child_process");
const {generate:generateNext}=require("./build-next");

const root=path.resolve(__dirname,"..");
const entry="index.html";
const nextEntry="next/index.html";
const snapshot="block-3pt-kingv1.94-portrait-lock.html";
const requiredFiles=[
  entry,
  nextEntry,
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
  "src/core/runtime.js",
  "src/core/error-boundary.js",
  "src/core/foundation.js",
  "src/core/state.js",
  "src/core/player-id-sandbox.js",
  "src/core/leaderboard-sandbox.js",
  "src/core/legacy-adapter.js",
  "src/core/bootstrap-next.js",
  "src/data/game-config.js",
  "src/data/dialogue.js",
  "src/services/audio-cues.js",
  "src/rendering/core.js",
  "src/modes/rack-rush.js",
  "src/modes/contest.js",
  "src/modes/practice.js",
  "src/modes/percent-battle/state.js",
  "src/modes/percent-battle/spots.js",
  "src/modes/percent-battle/opponent.js",
  "src/modes/percent-battle/results.js",
  "src/modes/percent-battle/index.js",
  "src/ui/panels.js",
  "src/ui/loading.js",
  "src/ui/menu.js",
  "src/ui/setup.js",
  "src/ui/pregame.js",
  "src/ui/pause.js",
  "src/ui/result-copy.js",
  "scripts/build-next.js",
  "docs/ARCHITECTURE.md",
  "docs/MODULAR_REFACTOR_PLAN.md",
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
const nextHtml=read(nextEntry);
const snapshotHtml=read(snapshot);
if(entryHtml!==snapshotHtml)fail(entry+" and "+snapshot+" differ");
if(nextHtml!==generateNext(entryHtml))fail(nextEntry+" is stale; run node scripts/build-next.js");
if(!nextHtml.includes('<base href="../">'))fail("next entry base href missing");
if(!nextHtml.includes("window.__AIBA_NEXT__=true;window.__AIBA_DISABLE_PRODUCTION_WRITES__=true"))fail("next entry flags missing");
if(!nextHtml.includes("data-aiba-early-errors"))fail("next early error diagnostics missing");
if(!nextHtml.includes('<script src="src/core/runtime.js?v=refactor7"></script>'))fail("next runtime bridge missing");
if(!nextHtml.includes('<script src="src/core/player-id-sandbox.js"></script>'))fail("next identity sandbox missing");
if(!nextHtml.includes('<script src="src/core/leaderboard-sandbox.js"></script>'))fail("next leaderboard sandbox missing");
if(!nextHtml.includes('<script src="src/recorder.js?v=refactor9"></script>'))fail("next recorder cache version missing");
if(!nextHtml.includes('<script src="src/vision.js?v=2.01"></script>'))fail("next vision cache version missing");
if(!nextHtml.includes('<script src="src/rendering/core.js?v=refactor16"></script>'))fail("next rendering core missing");
for(const file of ["core/error-boundary","core/foundation","data/dialogue","core/state","services/audio-cues","ui/result-copy"]){
  if(!nextHtml.includes(`<script src="src/${file}.js?v=refactor39"></script>`))fail(`next shell module missing ${file}`);
}
if(!nextHtml.includes('<script src="src/data/game-config.js?v=refactor40"></script>'))fail("next game config cache version missing");
if(nextHtml.includes('<script src="src/player-id.js"></script>'))fail("next entry must not load production identity");
if(nextHtml.includes('<script src="src/leaderboard-api.js"></script>'))fail("next entry must not load production leaderboard API");
if(nextHtml.indexOf('src/core/runtime.js')>nextHtml.indexOf('src/config.js'))fail("next runtime must load before config");
if(nextHtml.indexOf('<script src="src/rendering/core.js?v=refactor16"></script>')>nextHtml.indexOf('<script src="src/core/scene-init.js?v=refactor38"></script>'))fail("rendering core must load before scene construction");
if(!nextHtml.includes('<script src="src/core/legacy-adapter.js?v=refactor15"></script>'))fail("next legacy adapter missing");
if(!nextHtml.includes('<script src="src/modes/rack-rush.js"></script>'))fail("next Rack Rush module missing");
if(!nextHtml.includes('<script src="src/modes/contest.js"></script>'))fail("next contest module missing");
if(!nextHtml.includes('<script src="src/modes/practice.js?v=refactor5"></script>'))fail("next practice module missing");
if(!nextHtml.includes('<script src="src/ui/panels.js?v=refactor7"></script>'))fail("next panels module missing");
if(!nextHtml.includes('<script src="src/ui/loading.js?v=refactor7"></script>'))fail("next loading module missing");
if(!nextHtml.includes('<script src="src/ui/menu.js?v=refactor12a"></script>'))fail("next menu module missing");
if(!nextHtml.includes('<script src="src/ui/setup.js?v=refactor13"></script>'))fail("next setup module missing");
if(!nextHtml.includes('<script src="src/ui/pregame.js?v=refactor15"></script>'))fail("next pregame module missing");
if(!nextHtml.includes('<script src="src/ui/pause.js?v=1.97"></script>'))fail("next pause module missing");
if(!nextHtml.includes('<script src="src/core/bootstrap-next.js?v=refactor12"></script>'))fail("next bootstrap module missing");
for(const file of ["state","spots","opponent","results","index"]){
  if(!nextHtml.includes(`<script src="src/modes/percent-battle/${file}.js?v=refactor4"></script>`))fail(`next Percent Battle ${file} module missing`);
}
if(nextHtml.includes("function startRackRush("))fail("next entry still contains inline Rack Rush implementation");
if(nextHtml.includes("function beginStage(")||nextHtml.includes("function champion("))fail("next entry still contains inline contest implementation");
if(nextHtml.includes("function startPractice(")||nextHtml.includes("function endPractice("))fail("next entry still contains inline practice implementation");
if(nextHtml.includes("function bootGame(")||nextHtml.includes("function showPanel(")||nextHtml.includes("function toast("))fail("next entry still contains inline panels/loading implementation");
if(nextHtml.includes("function pauseableState(")||nextHtml.includes("function restartPausedMode("))fail("next entry still contains inline pause implementation");
if(nextHtml.includes("function showMenu(")||nextHtml.includes("function showModeInfo("))fail("next entry still contains inline home menu implementation");
if(nextHtml.includes("function sceneSelectMarkup(")||nextHtml.includes("function showScenePicker(")||nextHtml.includes("function goDiff("))fail("next entry still contains inline difficulty setup implementation");
if(nextHtml.includes("function pickDiff(")||nextHtml.includes("function showBattleIntro("))fail("next entry still contains inline pregame implementation");
if(nextHtml.includes("const renderer=new THREE.WebGLRenderer")||nextHtml.includes("function updateRenderQuality(")||nextHtml.includes("const ambient=new THREE.AmbientLight"))fail("next entry still contains inline rendering core implementation");
if(nextHtml.includes("bootGame();\nanimate();"))fail("next entry still starts boot and loop inline");
if(nextHtml.includes("function startBattle(")||nextHtml.includes("function battleRefreshSpot(")||nextHtml.includes("function startOppShooter(")||nextHtml.includes("function finishBattle("))fail("next entry still contains inline Percent Battle implementation");
for(const token of ["const GAME_VERSION=","const G={","function triggerMakeRunVoice(","const COVER_QUOTES="]){
  if(nextHtml.includes(token))fail("next entry still contains inline shell ownership "+token);
}
if(nextHtml.includes("/* Renderer, camera, adaptive quality and base lights are owned"))fail("next entry still contains generated ownership placeholders");
if(nextHtml.indexOf('src/core/foundation.js?v=refactor39')>nextHtml.indexOf('src/data/game-config.js?v=refactor40'))fail("foundation must load before game config");
if(nextHtml.indexOf('src/data/game-config.js?v=refactor40')>nextHtml.indexOf('src/core/state.js?v=refactor39'))fail("game config must load before runtime state");
if(nextHtml.indexOf('src/core/state.js?v=refactor39')>nextHtml.indexOf('src/services/audio-cues.js?v=refactor39'))fail("runtime state must load before audio cues");
if(nextHtml.indexOf('src/services/audio-cues.js?v=refactor39')>nextHtml.indexOf('src/audio.js?v=1.88'))fail("audio cues must load before audio engine");
if(nextHtml.indexOf('<script src="src/core/legacy-adapter.js?v=refactor15"></script>')>nextHtml.indexOf('<script src="src/modes/rack-rush.js"></script>'))fail("legacy adapter must load before Rack Rush module");
if(nextHtml.indexOf('<script src="src/modes/rack-rush.js"></script>')>nextHtml.indexOf('<script src="src/game-flow.js?v=1.93"></script>'))fail("Rack Rush module must load before late hooks");
if(nextHtml.indexOf('<script src="src/modes/contest.js"></script>')>nextHtml.indexOf('<script src="src/game-flow.js?v=1.93"></script>'))fail("contest module must load before late hooks");
if(nextHtml.indexOf('<script src="src/modes/contest.js"></script>')>nextHtml.indexOf('<script src="src/modes/practice.js?v=refactor5"></script>'))fail("contest module must load before practice module");
if(nextHtml.indexOf('<script src="src/ui/panels.js?v=refactor7"></script>')>nextHtml.indexOf('<script src="src/ui/loading.js?v=refactor7"></script>'))fail("panels must load before loading module");
if(nextHtml.indexOf('<script src="src/ui/loading.js?v=refactor7"></script>')>nextHtml.indexOf('<script src="src/ui/menu.js?v=refactor12a"></script>'))fail("loading must load before menu module");
if(nextHtml.indexOf('<script src="src/ui/menu.js?v=refactor12a"></script>')>nextHtml.indexOf('<script src="src/ui/setup.js?v=refactor13"></script>'))fail("menu must load before setup module");
if(nextHtml.indexOf('<script src="src/ui/setup.js?v=refactor13"></script>')>nextHtml.indexOf('<script src="src/ui/pregame.js?v=refactor15"></script>'))fail("setup must load before pregame module");
if(nextHtml.indexOf('<script src="src/ui/pregame.js?v=refactor15"></script>')>nextHtml.indexOf('<script src="src/ui/pause.js?v=1.97"></script>'))fail("pregame must load before pause module");
if(nextHtml.indexOf('<script src="src/ui/pause.js?v=1.97"></script>')>nextHtml.indexOf('<script src="src/core/bootstrap-next.js?v=refactor12"></script>'))fail("pause module must load before bootstrap");
if(!nextHtml.includes('<script src="src/navigation.js?v=1.97"></script>'))fail("next navigation cache version missing");
if(nextHtml.indexOf('<script src="src/core/bootstrap-next.js?v=refactor12"></script>')>nextHtml.indexOf('<script src="src/navigation.js?v=1.97"></script>'))fail("boot must begin before navigation rewires the loading gate");
if(nextHtml.indexOf('<script src="src/modes/contest.js"></script>')>nextHtml.indexOf('<script src="src/modes/percent-battle/state.js?v=refactor4"></script>'))fail("contest module must load before Percent Battle modules");
for(const pair of [["state","spots"],["spots","opponent"],["opponent","results"],["results","index"]]){
  if(nextHtml.indexOf(`src/modes/percent-battle/${pair[0]}.js`)>nextHtml.indexOf(`src/modes/percent-battle/${pair[1]}.js`))fail(`Percent Battle ${pair[0]} must load before ${pair[1]}`);
}
if(nextHtml.indexOf('<script src="src/modes/percent-battle/index.js?v=refactor4"></script>')>nextHtml.indexOf('<script src="src/game-flow.js?v=1.93"></script>'))fail("Percent Battle module must load before late hooks");
if(/^(<<<<<<<|=======|>>>>>>>)$/m.test(entryHtml))fail("conflict marker in html");
for(const token of ["v1.94 PORTRAIT LOCK","PORTRAIT LOCK / v1.94","v1.94-portrait-lock"])
  if(!entryHtml.includes(token))fail("visible/game version token missing "+token);
if(!entryHtml.includes('<link rel="stylesheet" href="styles.css?v=2.05">'))fail("stylesheet link missing");
if(!entryHtml.includes('<script src="src/nba-dna/NBADNA.js?v=20260718-coming-soon"></script>'))fail("NBA DNA gate cache version missing");
const menuScript=read("src/ui/menu.js");
const nbaDnaScript=read("src/nba-dna/NBADNA.js");
for(const source of [entryHtml,menuScript]){
  if(!source.includes('class="quickMode dna comingSoon"'))fail("NBA DNA coming-soon mode card missing");
  if(!source.includes('class="quickPlay" disabled aria-disabled="true"'))fail("NBA DNA mode card is not disabled");
  if(!source.includes("【即将上线】"))fail("NBA DNA coming-soon label missing");
  if(/onclick="[^"]*startNBADNA\(\)/.test(source))fail("NBA DNA menu still exposes a launch action");
}
for(const token of ["const NBA_DNA_ENABLED=false","if(!NBA_DNA_ENABLED)","return false"])
  if(!nbaDnaScript.includes(token))fail("NBA DNA runtime gate missing "+token);
if(!nextHtml.includes('<script src="src/nba-dna/NBADNA.js?v=20260718-coming-soon"></script>'))fail("next NBA DNA gate cache version missing");
if(!read("styles.css").includes(".quickMode.comingSoon"))fail("NBA DNA coming-soon style missing");
if(!entryHtml.includes('<script src="src/assets-manifest.js"></script>'))fail("assets manifest script missing");
if(!entryHtml.includes('<script src="src/config.js?v=1.92"></script>'))fail("config script missing");
if(!entryHtml.includes('<script src="src/player-select.js?v=1.76"></script>'))fail("player select script missing");
if(!entryHtml.includes('<script src="src/player-locker-preview.js?v=1.76"></script>'))fail("player locker preview script missing");
if(!entryHtml.includes('<script src="src/player-id.js"></script>'))fail("player id script missing");
if(!entryHtml.includes('<script src="src/leaderboard-api.js"></script>'))fail("leaderboard api script missing");
if(!entryHtml.includes('<script src="src/leaderboard-ui.js?v=1.92"></script>'))fail("leaderboard ui script missing");
if(!entryHtml.includes('<script src="src/share.js"></script>'))fail("share script missing");
if(!entryHtml.includes('<script src="src/recorder.js?v=1.94"></script>'))fail("recorder script missing");
if(!entryHtml.includes('<script src="src/shot-physics.js?v=1.99"></script>'))fail("shot physics script missing");
if(!entryHtml.includes('<script src="src/result-stats.js?v=1.78"></script>'))fail("result stats script missing");
if(entryHtml.indexOf('<script src="src/result-stats.js?v=1.78"></script>')<entryHtml.lastIndexOf("animate();"))fail("result stats should load after the main inline script");
if(!entryHtml.includes('<script src="src/gear.js?v=1.81"></script>'))fail("gear script missing");
if(entryHtml.indexOf('<script src="src/gear.js?v=1.81"></script>')<entryHtml.indexOf('<script src="src/result-stats.js?v=1.78"></script>'))fail("gear script should load after result stats");
if(entryHtml.indexOf('<script src="src/gear.js?v=1.81"></script>')<entryHtml.lastIndexOf("animate();"))fail("gear script should load after the main inline script");
if(!entryHtml.includes('<script src="src/avatar-customizer.js?v=1.79"></script>'))fail("avatar customizer script missing");
if(entryHtml.indexOf('<script src="src/avatar-customizer.js?v=1.79"></script>')<entryHtml.lastIndexOf("animate();"))fail("avatar customizer should load after the main inline script");
if(!entryHtml.includes('<script src="src/shot-motion.js?v=1.99"></script>'))fail("shot motion script missing");
if(entryHtml.indexOf('<script src="src/shot-motion.js?v=1.99"></script>')<entryHtml.indexOf('<script src="src/gear.js?v=1.81"></script>'))fail("shot motion should load after gear");
if(!entryHtml.includes('<script src="src/roster-style.js?v=1.79"></script>'))fail("roster style script missing");
if(entryHtml.indexOf('<script src="src/roster-style.js?v=1.79"></script>')<entryHtml.indexOf('<script src="src/avatar-customizer.js?v=1.79"></script>'))fail("roster style should load after avatar customizer");
if(!entryHtml.includes('<script src="src/hero-moments.js?v=1.79"></script>'))fail("hero moments script missing");
if(entryHtml.indexOf('<script src="src/hero-moments.js?v=1.79"></script>')<entryHtml.indexOf('<script src="src/shot-motion.js?v=1.99"></script>'))fail("hero moments should load after shot motion");
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
if(!entryHtml.includes('<script src="src/vision.js?v=2.01"></script>'))fail("vision script missing");
if(!entryHtml.includes('<script src="src/ui/interactive-tutorial.js?v=2.04"></script>'))fail("interactive tutorial script missing");
if(!entryHtml.includes('<script src="src/navigation.js?v=1.97"></script>'))fail("navigation script missing");
if(!entryHtml.includes('<script src="src/game-flow.js?v=1.93"></script>'))fail("game flow script missing");
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

const inlineScriptCounts={};
for(const [label,html] of [["main",entryHtml],["next",nextHtml]]){
  const inlineScripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(m=>m[1]).filter(s=>s.trim());
  inlineScriptCounts[label]=inlineScripts.length;
  for(const [i,script] of inlineScripts.entries()){
    try{new vm.Script(script,{filename:`${label}-inline-${i}.js`});}
    catch(e){fail(`${label} inline script ${i} syntax error: ${e.message}`);}
  }
}

const manifest=read("src/assets-manifest.js");
const configScript=read("src/config.js");
const gameConfigScript=read("src/data/game-config.js");
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
try{new Function(gameConfigScript);}
catch(e){fail("game config script syntax error: "+e.message);}
for(const source of [entryHtml,gameConfigScript]){
  if(!source.includes("G.practice||G.tutorial||G.interactiveTutorial")||!source.includes("?1.5:1"))fail("training sweet zone multiplier missing");
}
try{new Function(playerSelectScript);}
catch(e){fail("player select script syntax error: "+e.message);}
try{new Function(playerLockerPreviewScript);}
catch(e){fail("player locker preview script syntax error: "+e.message);}
for(const token of ["appearanceKey","lockerStage","lockerWorkbench"])
  if(!(playerLockerPreviewScript+playerSelectScript+styles).includes(token))fail("fixed gear preview token missing "+token);
try{new Function(avatarCustomizerScript);}
catch(e){fail("avatar customizer script syntax error: "+e.message);}
for(const key of ["AIBACustomizer","customStar","saveUse","applyCustomHead","customHead"])
  if(!avatarCustomizerScript.includes(key))fail("avatar customizer script missing "+key);
for(const token of ["function applyVisual","function applyGearHead","appearanceKey","refreshGearPreview"])
  if(!gearScript.includes(token))fail("gear visual preview token missing "+token);
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
try{
  const sandbox={};new Function("window",shotPhysicsScript)(sandbox);
  const physics=sandbox.AIBAShotPhysics;physics.reset();
  let held=physics.update({charging:true,dt:.4,ideal:74,rate:95,curve:{jmp:1}});
  const heldAt=held.t;
  for(let i=0;i<20;i++)held=physics.update({charging:true,paused:true,dt:.08,ideal:74,rate:95,curve:{jmp:1}});
  if(held.t!==heldAt||held.autoRelease)fail("shot physics tutorial pause must freeze time and auto release");
}catch(e){fail("shot physics pause check failed: "+e.message);}
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
if(configSandbox.window.AIBA_CONFIG.SHOT_PROFILES.t01.arc!==.9)fail("T-Mac should have the lowest supported shot arc");
if(configSandbox.window.AIBA_CONFIG.SHOT_PROFILES["雷·阿伦"].arc!==.94)fail("Ray Allen shot arc should be second-lowest");
if(configSandbox.window.AIBA_CONFIG.SHOT_PROFILES.t01.arc>=configSandbox.window.AIBA_CONFIG.SHOT_PROFILES["雷·阿伦"].arc)fail("T-Mac arc should stay lower than Ray Allen");
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
const interactiveTutorial=read("src/ui/interactive-tutorial.js");
try{new Function(interactiveTutorial);}
catch(e){fail("interactive tutorial script syntax error: "+e.message);}
for(const token of ["acceptVisionRelease","guidedReleaseCompleted","releaseArmed","step&&step.auto","isHoldingRelease","teardown({stopVision:true})","suspendVisionControl","任意一只手越过白线"])
  if(!interactiveTutorial.includes(token))fail("interactive tutorial release gate missing "+token);
if(interactiveTutorial.includes("itPower")||styles.includes(".itPower"))fail("interactive tutorial must use only the player-side power meter");
for(const token of ["tutorial.acceptVisionRelease(step)","sm.phase=\"charging\"","sm.chargeStart=now"])
  if(!vision.includes(token))fail("vision tutorial release gate missing "+token);
for(const token of ['#itCoach{position:fixed','right:max(10px,env(safe-area-inset-right))','bottom:max(0px,env(safe-area-inset-bottom))!important','#itCoach h2{font-size:20px'])
  if(!styles.includes(token))fail("split tutorial coach style missing "+token);
for(const token of ["aiba_shot_control_v1","触屏控制","体感控制","controlRecommend","restoreVisionControlPreference"])
  if(!vision.includes(token))fail("motion control preference token missing "+token);
for(const token of ["VISION_INFERENCE_MAX_PIXELS=288*512","visionCaptureConstraints","resizeMode:{ideal:\"none\"}","visionRecordCaptureSettings","visionInferenceSource","AIBAVisionFrame","displayAspect","cropPortrait","请保持手机竖屏"])
  if(!vision.includes(token))fail("portrait vision token missing "+token);
if(/function visionCaptureConstraints\(\)\{[\s\S]{0,400}aspectRatio\s*:/.test(vision))fail("camera capture must not request a cropped aspect ratio");
if(!vision.includes("frame.cropPortrait=false"))fail("vision preview must preserve the full camera frame");
if(/if\(cropPortrait\).*drawCover/.test(recorderScript))fail("recorded vision preview must not crop the camera frame");
for(const token of ['aspect-ratio:var(--vision-aspect,9/16)','data-orientation="portrait"'])
  if(!styles.includes(token))fail("portrait vision style missing "+token);
if(vision.includes("视觉实验"))fail("legacy vision experiment label remains");
if(vision.includes('import("./vendor/'))fail("vision module import path should be relative from src/");
if(/HandLandmarker|hand_landmarker\.task/.test(vision))fail("game vision path should not load hand landmarker");
const navigation=read("src/navigation.js");
try{new Function(navigation);}
catch(e){fail("navigation script syntax error: "+e.message);}
for(const token of ["homeBtn","requestHome","cleanup","removeEventListener(\"pointerdown\",global.unlockBoot)","addEventListener(\"pointerup\""])
  if(!navigation.includes(token))fail("navigation flow token missing "+token);
for(const token of ["function cancel()",",cancel,resultMarkup"])
  if(!recorderScript.includes(token))fail("recorder cancellation missing "+token);
const gameFlow=read("src/game-flow.js");
try{new Function(gameFlow);}
catch(e){fail("game flow script syntax error: "+e.message);}
for(const token of ["rookieMeterProgress","G.diff===\"easy\"","updatePregameWarmupShot","updatePregameChalk","updatePlayerLockCamera"])
  if(!gameFlow.includes(token))fail("game flow token missing "+token);

for(const rel of ["src/core/runtime.js","src/core/error-boundary.js","src/core/foundation.js","src/core/state.js","src/core/player-id-sandbox.js","src/core/leaderboard-sandbox.js","src/core/input.js","src/core/game-loop.js","src/core/scene-init.js","src/core/legacy-adapter.js","src/core/bootstrap-next.js","src/data/game-config.js","src/data/dialogue.js","src/services/audio-cues.js","src/rendering/core.js","src/rendering/materials.js","src/rendering/court.js","src/rendering/arena.js","src/rendering/spectators.js","src/rendering/hoop.js","src/rendering/environments.js","src/rendering/props.js","src/rendering/characters.js","src/rendering/camera.js","src/rendering/motion.js","src/rendering/effects.js","src/gameplay/shots.js","src/gameplay/collisions.js","src/presentation/cinematics.js","src/presentation/pregame.js","src/presentation/battle.js","src/presentation/replay.js","src/presentation/win-cinematic.js","src/modes/rack-rush.js","src/modes/contest.js","src/modes/practice.js","src/modes/percent-battle/state.js","src/modes/percent-battle/spots.js","src/modes/percent-battle/opponent.js","src/modes/percent-battle/results.js","src/modes/percent-battle/index.js","src/ui/panels.js","src/ui/loading.js","src/ui/menu.js","src/ui/setup.js","src/ui/pregame.js","src/ui/pause.js","src/ui/battle-controls.js","src/ui/result-copy.js"]){
  try{new Function(read(rel));}
  catch(e){fail(rel+" syntax error: "+e.message);}
}
const ownershipModuleFiles=["core","materials","court","arena","spectators","hoop","environments","props","characters","camera","motion","effects"].map(name=>"src/rendering/"+name+".js")
  .concat(["src/core/error-boundary.js","src/core/foundation.js","src/data/game-config.js","src/data/dialogue.js","src/core/state.js","src/services/audio-cues.js","src/ui/result-copy.js","src/gameplay/shots.js","src/gameplay/collisions.js","src/presentation/cinematics.js","src/presentation/pregame.js","src/presentation/battle.js","src/presentation/replay.js","src/presentation/win-cinematic.js","src/ui/battle-controls.js","src/core/input.js","src/core/game-loop.js","src/core/scene-init.js"]);
try{new Function(ownershipModuleFiles.map(read).join("\n;\n"));}
catch(e){fail("ownership modules have conflicting top-level declarations: "+e.message);}
const runtimeScript=read("src/core/runtime.js");
for(const token of ["aiba_next_v1:","scopeLocalStorage","attachLegacy","service:registered"])
  if(!runtimeScript.includes(token))fail("runtime bridge token missing "+token);
const identitySandbox=read("src/core/player-id-sandbox.js");
const leaderboardSandbox=read("src/core/leaderboard-sandbox.js");
if(/\bfetch\s*\(/.test(identitySandbox+leaderboardSandbox))fail("next sandboxes must not access the network");
if(!leaderboardSandbox.includes("experimental_leaderboard_disabled"))fail("leaderboard sandbox marker missing");
const rackRushModule=read("src/modes/rack-rush.js");
for(const token of ['runtime.service("legacy")','runtime.register("mode:rackrush"',"startRackRush","updateRackRush","finishRackRushRun"])
  if(!rackRushModule.includes(token))fail("Rack Rush module token missing "+token);
const contestModule=read("src/modes/contest.js");
for(const token of ['runtime.service("legacy")','runtime.register("mode:contest"',"beginStage","startRound","showBracket","champion"])
  if(!contestModule.includes(token))fail("contest module token missing "+token);
const contestCinematics=read("src/presentation/cinematics.js");
for(const token of ["rackShots.forEach(s=>q.push({type:\"shot\",s}))","it.from.distanceTo(it.to)/4.6","it.s.ball+1"])
  if(!contestCinematics.includes(token))fail("contest AI full-run behavior missing "+token);
if(contestCinematics.includes("每架可视化2球"))fail("contest AI must not use the two-shot montage");
const battleOpponent=read("src/modes/percent-battle/opponent.js");
for(const token of ["function oppRepositionForPlayer","OPP.playerSpotSeen","candidates.sort"])
  if(!battleOpponent.includes(token))fail("Percent Battle overlap guard missing "+token);
const pregameModule=read("src/ui/pregame.js");
for(const token of ['runtime.register("ui:pregame"',"dressGuy","AIBASelectedStar","showRackRushIntro","showBattleIntro"])
  if(!pregameModule.includes(token))fail("pregame module token missing "+token);
if(!read("src/core/legacy-adapter.js").includes("dressGuy"))fail("legacy adapter must expose dressGuy to pregame");
const renderingCore=read("src/rendering/core.js");
for(const token of ['runtime.register("rendering:core"',"WebGLRenderer","RENDER_QUALITY","updateRenderQuality","dampRig","visualViewport","AmbientLight"])
  if(!renderingCore.includes(token))fail("rendering core token missing "+token);
const renderingMaterials=read("src/rendering/materials.js");
for(const token of ['runtime.register("rendering:materials"',"function pixTex","function realBallTex","function triBallTex","function spaldingPanelCurve","function paintBasketballChannels","function paintTriBallPanels","MeshPhongMaterial","bumpMap:texBallRelief","SphereGeometry(0.16,32,20)"])
  if(!renderingMaterials.includes(token))fail("rendering materials token missing "+token);
for(const source of [entryHtml,renderingMaterials]){
  for(const token of ["pixTex(512,256","spaldingPanelCurve(720)","candidateMeridianA.push([.75,k])","candidateMeridianAOpposite.push([.25,k])","paintTriBallPanels","rotatedTriColorIndex","labels.fill(-1)","panelVotes","turn=Math.PI/2","BALL_LINE_DEBUG","full ring 1","full ring A","double curve","Math.hypot(x,y,z)<radius","LinearMipmapLinearFilter","anisotropy:8","ballTextureRng(0x8badf00d)","SphereGeometry(0.16,32,20)"])
    if(!source.includes(token))fail("calculated basketball material missing "+token);
  if(source.includes("centerMeridian")||source.includes("meridianA.push([0,k])")||source.includes("meridianB.push([.5,k])")||source.includes("candidateMeridianB")||source.includes("Math.random()*96")||source.includes("SphereGeometry(0.16,12,10)"))fail("legacy basketball pattern remains");
}
if(!nextHtml.includes('src/rendering/materials.js?v=refactor17h'))fail("next entry must load rendering materials");
if(nextHtml.includes("function realBallTex("))fail("next entry still contains inline ball materials");
const renderingCourt=read("src/rendering/court.js");
for(const token of ['runtime.register("rendering:court"',"function makeCourtTexture","function buildCourt","courtIndoorTexture","curSpotRing=new THREE.Mesh"])
  if(!renderingCourt.includes(token))fail("rendering court token missing "+token);
if(!nextHtml.includes('src/rendering/court.js?v=refactor18'))fail("next entry must load rendering court");
if(nextHtml.includes("function makeCourtTexture("))fail("next entry still contains inline court texture builder");
const renderingArena=read("src/rendering/arena.js");
for(const token of ['runtime.register("rendering:arena"',"function buildStands","function buildBackcourtShow","function buildCrowd","function updCrowd"])
  if(!renderingArena.includes(token))fail("rendering arena token missing "+token);
const renderingSpectators=read("src/rendering/spectators.js");
for(const token of ['runtime.register("rendering:spectators"',"function buildNearCourtCrowd","function buildStreetCrowd","function updStreetCrowd"])
  if(!renderingSpectators.includes(token))fail("rendering spectators token missing "+token);
const renderingHoop=read("src/rendering/hoop.js");
for(const token of ['runtime.register("rendering:hoop"',"function buildHoop","function buildAtmos","function updJumbo"])
  if(!renderingHoop.includes(token))fail("rendering hoop token missing "+token);
const renderingEnvironments=read("src/rendering/environments.js");
for(const token of ['runtime.register("rendering:environments"',"function buildOutdoorPark","function buildFlowerCourt","function buildBeachSunset","function applyScenePreset","function updateEnvironment"])
  if(!renderingEnvironments.includes(token))fail("rendering environments token missing "+token);
if(renderingEnvironments.includes("const rackBalls="))fail("rendering environments must not own gameplay props");
for(const token of ['src/rendering/arena.js?v=refactor19','src/rendering/spectators.js?v=refactor20','src/rendering/hoop.js?v=refactor21','src/rendering/environments.js?v=refactor22a'])
  if(!nextHtml.includes(token))fail("next entry missing court element module "+token);
for(const token of ["function buildStands(","function buildNearCourtCrowd(","function buildHoop(","function applyScenePreset("])
  if(nextHtml.includes(token))fail("next entry still contains inline court element "+token);
const renderingProps=read("src/rendering/props.js");
for(const token of ['runtime.register("rendering:props"',"function buildRacks","function resetRackBalls","function buildHands"])
  if(!renderingProps.includes(token))fail("rendering props token missing "+token);
const renderingCharacters=read("src/rendering/characters.js");
for(const token of ['runtime.register("rendering:characters"',"function voxelGuy","function applyStarStyle","function buildCharacters","function benchSetup"])
  if(!renderingCharacters.includes(token))fail("rendering characters token missing "+token);
const renderingCamera=read("src/rendering/camera.js");
for(const token of ['runtime.register("rendering:camera"',"const P=","const CAM=","function autoFrameCam","function updPlayCam"])
  if(!renderingCamera.includes(token))fail("rendering camera token missing "+token);
const renderingMotion=read("src/rendering/motion.js");
for(const token of ['runtime.register("rendering:motion"',"function shotCurves","function poseGuy","function updPose","function startPass","function updWalk"])
  if(!renderingMotion.includes(token))fail("rendering motion token missing "+token);
for(const token of ['src/rendering/props.js?v=refactor23','src/rendering/characters.js?v=refactor24','src/rendering/camera.js?v=refactor25','src/rendering/motion.js?v=refactor26'])
  if(!nextHtml.includes(token))fail("next entry missing gameplay rendering module "+token);
for(const token of ["function buildRacks(","function voxelGuy(","function autoFrameCam(","function shotCurves(","function updWalk("])
  if(nextHtml.includes(token))fail("next entry still contains inline gameplay rendering "+token);
const renderingEffects=read("src/rendering/effects.js");
for(const token of ['runtime.register("rendering:effects"',"function emitFire","function startConfetti","function tween","function glideTo"])
  if(!renderingEffects.includes(token))fail("rendering effects token missing "+token);
const presentationCinematics=read("src/presentation/cinematics.js");
for(const token of ['runtime.register("presentation:cinematics"',"function startHero","function startAIShow","function battleCutaway","function startVictoryCine"])
  if(!presentationCinematics.includes(token))fail("presentation cinematics token missing "+token);
const presentationPregame=read("src/presentation/pregame.js");
for(const token of ['runtime.register("presentation:pregame"',"const PREGAME=","function startPreGameShow","function updPreGameShow"])
  if(!presentationPregame.includes(token))fail("presentation pregame token missing "+token);
const presentationBattle=read("src/presentation/battle.js");
for(const token of ['runtime.register("presentation:battle"',"function updBattleCut","function checkBattleOvertake","function battleScoreCallout"])
  if(!presentationBattle.includes(token))fail("presentation battle token missing "+token);
for(const token of ['src/rendering/effects.js?v=refactor27','src/presentation/cinematics.js?v=refactor28','src/presentation/pregame.js?v=refactor29','src/presentation/battle.js?v=refactor30'])
  if(!nextHtml.includes(token))fail("next entry missing presentation module "+token);
for(const token of ["function startHero(","function startAIShow(","function startVictoryCine(","function startPreGameShow(","function battleScoreCallout(","function startConfetti("])
  if(nextHtml.includes(token))fail("next entry still contains inline presentation "+token);
const gameplayShots=read("src/gameplay/shots.js");
for(const token of ['runtime.register("gameplay:shots"',"const balls=","function startCharge","function releaseShot","function madeBall","function updBalls"])
  if(!gameplayShots.includes(token))fail("gameplay shots token missing "+token);
const gameplayCollisions=read("src/gameplay/collisions.js");
for(const token of ['runtime.register("gameplay:collisions"',"function checkBallCollisions","function ballCollide"])
  if(!gameplayCollisions.includes(token))fail("gameplay collisions token missing "+token);
const presentationReplay=read("src/presentation/replay.js");
for(const token of ['runtime.register("presentation:replay"',"function startReplay","function updReplay","function aiProb"])
  if(!presentationReplay.includes(token))fail("presentation replay token missing "+token);
const battleControls=read("src/ui/battle-controls.js");
for(const token of ['runtime.register("ui:battle-controls"',"function buildSpotDots","function updatePlayerPowerUI","function updSpotDots"])
  if(!battleControls.includes(token))fail("battle controls token missing "+token);
for(const source of [entryHtml,battleControls]){
  if(!source.includes("training?15:10")||!source.includes("training?68:70")||!source.includes("training?92:90"))fail("training player-side sweet zone display missing");
}
const winCinematic=read("src/presentation/win-cinematic.js");
for(const token of ['runtime.register("presentation:win-cinematic"',"const winCine=","function startWinCine","function updWinCine"])
  if(!winCinematic.includes(token))fail("winning cinematic token missing "+token);
const coreInput=read("src/core/input.js"),coreLoop=read("src/core/game-loop.js"),sceneInit=read("src/core/scene-init.js");
for(const token of ['runtime.register("core:input"',"function onDown","function onUp","const TILT="])
  if(!coreInput.includes(token))fail("core input token missing "+token);
for(const token of ['runtime.register("core:game-loop"',"function animate","window.animate=animate","updatePractice(dt)"])
  if(!coreLoop.includes(token))fail("core game-loop token missing "+token);
for(const token of ['runtime.register("core:scene-init"',"buildCourt();","buildCharacters();","applyScenePreset(currentScenePreset"])
  if(!sceneInit.includes(token))fail("scene init token missing "+token);
for(const token of ['src/gameplay/shots.js?v=refactor31','src/presentation/replay.js?v=refactor32','src/ui/battle-controls.js?v=refactor33a','src/gameplay/collisions.js?v=refactor34','src/presentation/win-cinematic.js?v=refactor35','src/core/input.js?v=refactor36','src/core/game-loop.js?v=refactor37','src/core/scene-init.js?v=refactor38'])
  if(!nextHtml.includes(token))fail("next entry missing runtime-core module "+token);
for(const token of ["function startCharge(","function updBalls(","function startReplay(","function buildSpotDots(","function ballCollide(","function startWinCine(","function onDown(","function animate(","buildCourt();"])
  if(nextHtml.includes(token))fail("next entry still contains inline runtime core "+token);
if(!(nextHtml.indexOf('src/core/input.js?v=refactor36')<nextHtml.indexOf('src/core/legacy-adapter.js?v=refactor15')))fail("input must load before legacy adapter");
if(!(nextHtml.indexOf('src/core/scene-init.js?v=refactor38')<nextHtml.indexOf('src/core/legacy-adapter.js?v=refactor15')))fail("scene init must load before legacy adapter");

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

console.log("check ok:",inlineScriptCounts.main+" main / "+inlineScriptCounts.next+" next inline scripts,",inlineLines+" inline lines,",assets.coverStars.length+" cover stars");
