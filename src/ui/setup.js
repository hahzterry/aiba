(function(global){
  "use strict";

  const runtime=global.AIBA&&global.AIBA.runtime,ctx=runtime&&runtime.service("legacy");
  if(!runtime||!ctx||!runtime.service("ui:panels")||!runtime.service("ui:menu"))throw new Error("UI setup requires panels, menu, and legacy adapter");
  const {G,SCENE_PRESETS,DIFFS,LEGENDS,VISION,ensureAudio,airhorn,paSay,getScenePreset,applyScenePreset}=ctx;

  function sceneSelectMarkup(){
    const key=getScenePreset(),preset=SCENE_PRESETS[key]||SCENE_PRESETS.indoor;
    return `<button class="sceneSelect" onclick="showScenePicker()" aria-label="Select arena, currently ${preset.name}">
      <span class="sceneSwatch ${key}"></span><span><small>ARENA</small><strong>${preset.name}</strong></span><span class="sceneSelectMark">›</span></button>`;
  }

  function showScenePicker(){
    const selected=getScenePreset();
    const rows=Object.keys(SCENE_PRESETS).map(key=>{
      const preset=SCENE_PRESETS[key],active=key===selected;
      return `<button class="sceneOption ${active?"selected":""}" onclick="chooseScenePreset('${key}')" aria-pressed="${active}">
        <span class="sceneSwatch ${key}"></span><span><b>${preset.name}</b><small>${preset.desc}</small></span><em>${active?"Current":"Select"}</em></button>`;
    }).join("");
    global.showPanel(`<h1 class="title" style="font-size:24px">Select Arena</h1><div class="note">The scene only changes the environment and lighting, not shooting or scoring.</div>
      <div class="sceneList">${rows}</div><button class="btn sm" onclick="returnToDifficulty()">Back to Difficulty</button>`);
  }

  function returnToDifficulty(){goDiff(G.mode,true);}

  function chooseScenePreset(name){
    applyScenePreset(name,{announce:true});
    goDiff(G.mode,true);
  }

  function goDiff(mode,quiet){
    G.mode=mode||"contest";G.state="diff";ensureAudio(true);
    if(!quiet&&typeof global.playSFX==="function")global.playSFX("ui_mode_whoosh_01",.52);
    if(!quiet){
      airhorn();
      const preset=SCENE_PRESETS[getScenePreset()]||SCENE_PRESETS.indoor;
      paSay("Welcome to aiBA " + preset.name + ". Lights are ready, countdown to tip-off.", true);
    }
    let html=(global.AIBAModeLeaderboardMarkup?global.AIBAModeLeaderboardMarkup(G.mode):"")+
      '<h1 class="title" style="font-size:24px">Select Difficulty</h1>'+
      (global.AIBAPlayerSelectMarkup?global.AIBAPlayerSelectMarkup(LEGENDS,G.mode):"");
    html+=sceneSelectMarkup();
    html+=global.visionModeMarkup();
    if(G.mode==="battle")html+='<div class="note">In Percent Battle, difficulty affects your sweet spot size and opponent scoring tempo.</div>';
    if(G.mode==="rackrush")html+='<div class="note">Difficulty determines stage targets and shot sweet spot. Feed speed increases progressively.</div>';
    for(const key in DIFFS){
      const diff=DIFFS[key];
      html+=`<button class="btn ${key==="easy"?"green":key==="hard"?"red":""}" style="display:block;width:88%;margin:10px auto"
        onclick="pickDiff('${key}')">${diff.n}<div style="font-size:10px;font-weight:normal;margin-top:4px">${diff.d}</div></button>`;
    }
    global.showPanel(html);
    if(VISION.desired&&typeof global.prewarmVisionControl==="function")global.prewarmVisionControl("diff");
  }

  const api=Object.freeze({sceneSelectMarkup,showScenePicker,returnToDifficulty,chooseScenePreset,goDiff});
  Object.assign(global,api);runtime.register("ui:setup",api);
})(window);