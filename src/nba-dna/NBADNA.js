(function(global){
  "use strict";

  const NBA_DNA_ENABLED=false;
  const state={file:null,previewUrl:null,result:null,userImg:null,analysis:null,poster:null,busy:false};

  function $(id){return document.getElementById(id);}
  function safeToast(txt,color){if(typeof toast==="function")toast(txt,color||"#ffd23f");}
  function setState(fn){Object.assign(state,fn);}
  function quoteEscape(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}
  function dnaShell(body){
    if(typeof showPanel==="function")showPanel(`<section class="dnaPanel">${body}</section>`);
  }
  function start(){
    if(!NBA_DNA_ENABLED){
      if(typeof showModeInfo==="function")showModeInfo("nbadna");
      else safeToast("3BA DNA [Coming Soon]","#ffd23f");
      return false;
    }
    if(global.G)G.state="nba-dna";
    if(typeof ensureAudio==="function")ensureAudio(true,true);
    if(typeof playAudioEvent==="function")playAudioEvent("dna_intro");
    dnaUpload();
    return true;
  }
  function dnaUpload(){
    dnaShell(`
      <div class="dnaHero">
        <small>3BA DNA</small>
        <h1>Show me your shot.</h1>
        <p>Upload a shooting form photo to match your Mamba DNA.</p>
      </div>
      <div class="dnaCompare">
        <figure class="dnaRef"><img src="${NBADNAPoseAnalyzer.refUrl}" alt="Kobe standard shooting form"><figcaption>KOBE BRYANT · 24</figcaption></figure>
        <label class="dnaDrop" for="nbaDnaFile">
          <input id="nbaDnaFile" type="file" accept="image/*" onchange="nbaDnaPickPhoto(event)">
          <span id="nbaDnaPreview">${state.previewUrl?`<img src="${state.previewUrl}" alt="Your shot photo">`:"<b>Upload Photo</b><em>Full shooting form works best</em>"}</span>
        </label>
      </div>
      <div class="dnaActions">
        <button class="btn gold" onclick="nbaDnaRun()">Generate 3BA DNA</button>
        <button class="btn sm" onclick="showMenu()">Back to Cover</button>
      </div>`);
  }
  function pickPhoto(event){
    const file=event&&event.target&&event.target.files&&event.target.files[0];
    if(!file)return;
    if(state.previewUrl)URL.revokeObjectURL(state.previewUrl);
    const previewUrl=URL.createObjectURL(file);
    state.file=file;state.previewUrl=previewUrl;
    const box=$("nbaDnaPreview");
    if(box)box.innerHTML=`<img src="${previewUrl}" alt="Your shot photo">`;
  }
  function progress(label){
    dnaShell(`
      <div class="dnaScan">
        <small>3BA DNA</small>
        <h1>${label}</h1>
        <div class="dnaScanBar"><i></i></div>
        <p>Matching Mamba DNA, don't blink.</p>
      </div>`);
  }
  function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
  function analysisScoreRows(result){
    if(global.NBADNAPoseVisualizer&&NBADNAPoseVisualizer.scoreRows)return NBADNAPoseVisualizer.scoreRows(result);
    return [
      {name:"Release Point",score:result.parts.shooting},
      {name:"Elbow Angle",score:result.parts.elbow},
      {name:"Body Axis",score:result.parts.balance},
      {name:"Follow-Through",score:result.parts.follow}
    ];
  }
  async function playFallbackAnalysis(result){
    const rows=analysisScoreRows(result);
    dnaShell(`
      <div class="dnaAnalyzer fallback">
        <div class="dnaAnalyzerHead">
          <small>3BA DNA LAB</small>
          <h1>Printing Mamba DNA</h1>
          <p id="nbaDnaStageText">Scanning your release form</p>
        </div>
        <div class="dnaFallbackStage">
          <div class="dnaFallbackPhoto">${state.previewUrl?`<img src="${state.previewUrl}" alt="Your shot photo">`:""}</div>
          <div class="dnaFallbackTrace">
            <i class="bone b1"></i><i class="bone b2"></i><i class="bone b3"></i><i class="bone b4"></i>
            <b class="dot d1"></b><b class="dot d2"></b><b class="dot d3"></b><b class="dot d4"></b>
            <em></em>
          </div>
        </div>
        <div class="dnaTape" id="nbaDnaTape">
          <span data-step="0">Scanning your release form</span>
          <span data-step="1">Sliding into Kobe's standard frame</span>
          <span data-step="2">Overlapping elbow & release point</span>
          <span data-step="3">Printing key node similarities</span>
        </div>
        <div class="dnaNodePrint" id="nbaDnaNodePrint">
          ${rows.map(r=>`<b>${quoteEscape(r.name)}<em>${Math.round(r.score)}%</em></b>`).join("")}
        </div>
      </div>`);
    const stageText=$("nbaDnaStageText");
    const tape=Array.from(document.querySelectorAll("#nbaDnaTape span"));
    const nodes=Array.from(document.querySelectorAll("#nbaDnaNodePrint b"));
    for(let step=0;step<4;step++){
      tape.forEach((el,i)=>el.classList.toggle("active",i<=step));
      nodes.forEach((el,i)=>el.classList.toggle("active",i<step));
      if(stageText&&tape[step])stageText.textContent=tape[step].textContent;
      if (typeof playAudioEvent === "function") {
        if (step === 1) playAudioEvent("dna_metric_elbow");
        else if (step === 2) playAudioEvent("dna_metric_balance");
        else if (step === 3) playAudioEvent("dna_metric_release");
      }
      await sleep(step===0?760:860);
    }
    nodes.forEach(el=>el.classList.add("active"));
    await sleep(520);
  }
  async function playAnalysis(analyzed,result){
    if(!global.NBADNAPoseVisualizer){await playFallbackAnalysis(result);return;}
    const rows=analysisScoreRows(result);
    dnaShell(`
      <div class="dnaAnalyzer">
        <div class="dnaAnalyzerHead">
          <small>3BA DNA LAB</small>
          <h1>Aligning Mamba release curve</h1>
          <p id="nbaDnaStageText">Scanning your release form</p>
        </div>
        <div class="dnaAnalyzerStage">
          <canvas id="nbaDnaAnalysisCanvas" width="640" height="760"></canvas>
        </div>
        <div class="dnaTape" id="nbaDnaTape">
          <span data-step="0">Scanning your release form</span>
          <span data-step="1">Sliding into Kobe's standard frame</span>
          <span data-step="2">Overlapping elbow & release point</span>
          <span data-step="3">Printing key node similarities</span>
        </div>
        <div class="dnaNodePrint" id="nbaDnaNodePrint">
          ${rows.map(r=>`<b>${quoteEscape(r.name)}<em>${Math.round(r.score)}%</em></b>`).join("")}
        </div>
      </div>`);
    const canvas=$("nbaDnaAnalysisCanvas"),stageText=$("nbaDnaStageText");
    const tape=Array.from(document.querySelectorAll("#nbaDnaTape span"));
    const nodes=Array.from(document.querySelectorAll("#nbaDnaNodePrint b"));
    try{
      let voiceTriggered = [false, false, false, false];
      await NBADNAPoseVisualizer.animate(canvas,analyzed,result,p=>{
        const step=p<.25?0:(p<.5?1:(p<.72?2:3));
        tape.forEach((el,i)=>el.classList.toggle("active",i<=step));
        nodes.forEach((el,i)=>{
          const active = p>(.64+i*.075);
          if (active && !voiceTriggered[i]) {
            voiceTriggered[i] = true;
            if (typeof playAudioEvent === "function") {
              if (i === 0) playAudioEvent("dna_metric_release");
              else if (i === 1) playAudioEvent("dna_metric_elbow");
              else if (i === 2) playAudioEvent("dna_metric_balance");
              else if (i === 3) playAudioEvent("dna_metric_follow");
            }
          }
          el.classList.toggle("active",active);
        });
        if(stageText)stageText.textContent=tape[step]?tape[step].textContent:"Printing key node similarities";
      });
    }catch(e){
      await playFallbackAnalysis(result);
      return;
    }
    await sleep(260);
  }
  async function run(){
    if(state.busy)return;
    if(!state.file){safeToast("Give me a shot photo first","#ff8d7a");return;}
    state.busy=true;progress("Reading your court genes");
    if(typeof playAudioEvent==="function")playAudioEvent("dna_scan");
    try{
      const analyzed=await NBADNAPoseAnalyzer.analyzeFile(state.file);
      const seed=state.file.size+(state.file.lastModified||0);
      const result=analyzed.engine==="pose"?NBADNAScoreEngine.score(analyzed.user,analyzed.ref):NBADNAScoreEngine.fallbackScore(seed);
      state.result=result;state.userImg=analyzed.img;state.analysis=analyzed;
      await playAnalysis(analyzed,result);
      showResult(result,analyzed.img);
    }catch(e){
      const result=NBADNAScoreEngine.fallbackScore(state.file.size+(state.file.lastModified||0));
      state.result=result;state.analysis={img:null,refImg:null,user:null,ref:null,engine:"style"};
      await playAnalysis(state.analysis,result);
      showResult(result,null);
    }finally{state.busy=false;}
  }
  function bars(parts){
    return [
      ["Release",parts.shooting],
      ["Elbow Stability",parts.elbow],
      ["Body Balance",parts.balance],
      ["Follow-Through",parts.follow]
    ].map(r=>`<div class="dnaStat"><span>${r[0]}</span><b>${r[1]}%</b><i><em style="width:${r[1]}%"></em></i></div>`).join("");
  }
  function rewardMarkup(result){
    return result.rewards.length?`<div class="dnaRewards"><small>UNLOCKED</small>${result.rewards.map(x=>`<span>${x}</span>`).join("")}</div>`:`<div class="dnaRewards locked"><small>NEXT UNLOCK</small><span>70% unlocks Mamba shooting form</span></div>`;
  }
  function showResult(result,img){
    if(typeof playAudioEvent==="function"){
      if (result.total >= 90) playAudioEvent("dna_result_legend");
      else if (result.total >= 80) playAudioEvent("dna_result_elite");
      else if (result.total >= 65) playAudioEvent("dna_result_solid");
      else playAudioEvent("dna_result_brick");
    }
    const coach=result.coach.map(x=>`<li>${quoteEscape(x)}</li>`).join("");
    dnaShell(`
      <div id="nbaDnaResultVisual" class="dnaResultVisual"></div>
      <div class="dnaCard">
        <small>YOUR 3BA DNA</small>
        <div class="dnaPercent">${result.total}%</div>
        <h1>${result.star}</h1>
        <p>${quoteEscape(result.line)}</p>
      </div>
      <div class="dnaGrid">
        <div class="dnaStats">${bars(result.parts)}</div>
        <div class="dnaCoach"><b>AI Coach's Tip</b><ol>${coach}</ol></div>
      </div>
      ${rewardMarkup(result)}
      <div class="dnaActions">
        <button class="btn gold" onclick="nbaDnaBuildPoster()">Generate Share Poster</button>
        <button class="btn green" onclick="nbaDnaReset()">Test Again</button>
        <button class="btn sm" onclick="showMenu()">Continue Game</button>
      </div>
      <div id="nbaDnaPosterMount" class="dnaPosterMount"></div>`);
    const mount=$("nbaDnaResultVisual");
    if(mount&&global.NBADNAPoseVisualizer){
      const canvas=document.createElement("canvas");
      canvas.width=640;canvas.height=760;
      NBADNAPoseVisualizer.snapshot(canvas,state.analysis||{img,refImg:null,user:null,ref:null},result);
      mount.appendChild(canvas);
    }
    state.poster=null;
  }
  function buildPoster(){
    if(!state.result)return;
    const canvas=NBADNAShareCard.build(state.result,state.userImg,state.analysis);
    state.poster=canvas;
    const mount=$("nbaDnaPosterMount");
    if(mount){
      mount.innerHTML="";
      mount.appendChild(canvas);
      const actions=document.createElement("div");
      actions.className="dnaActions";
      actions.innerHTML='<button class="btn gold" onclick="nbaDnaSavePoster()">Save Image</button><button class="btn sm" onclick="nbaDnaSharePoster()">Share</button>';
      mount.appendChild(actions);
    }
  }
  function savePoster(){if(state.poster)NBADNAShareCard.save(state.poster);}
  async function sharePoster(){
    if(!state.poster)buildPoster();
    if(!state.poster||!state.result)return;
    try{await NBADNAShareCard.share(state.poster,state.result);safeToast("Share panel opened","#7CFC6B");}
    catch(e){safeToast("Poster generated, save and share!","#ffd23f");}
  }
  function reset(){
    state.file=null;state.result=null;state.userImg=null;state.analysis=null;state.poster=null;
    if(state.previewUrl)URL.revokeObjectURL(state.previewUrl);
    state.previewUrl=null;dnaUpload();
  }

  global.startNBADNA=start;
  global.nbaDnaPickPhoto=pickPhoto;
  global.nbaDnaRun=run;
  global.nbaDnaReset=reset;
  global.nbaDnaBuildPoster=buildPoster;
  global.nbaDnaSavePoster=savePoster;
  global.nbaDnaSharePoster=sharePoster;
})(window);