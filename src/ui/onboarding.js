/* Onboarding: First-time welcome card + one-time scene-based coach marks + help entry.
   Observer pattern: Polling state triggers, doesn't change core logic; returning players (with flags) are completely unaffected. */
(function(global){
  "use strict";
  const KEY="aiba_onboard_v2";
  let seen={};
  try{seen=JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch(e){}
  function mark(k){seen[k]=1;try{localStorage.setItem(KEY,JSON.stringify(seen));}catch(e){}}
  const GG=()=>{try{return typeof G==="undefined"?null:G;}catch(e){return null;}};
  const playing=()=>{const g=GG();return g&&/^(round|tiebreak|battle|rackrush)$/.test(g.state);};

  /* ---------- Lightweight tooltip bubble ---------- */
  let tipEl=null,tipTimer=0;
  function tip(html,ms){
    if(!tipEl){
      tipEl=document.createElement("div");
      tipEl.id="obTip";
      document.body.appendChild(tipEl);
    }
    tipEl.innerHTML=html;
    tipEl.classList.add("on");
    clearTimeout(tipTimer);
    tipTimer=setTimeout(()=>tipEl.classList.remove("on"),ms||4200);
  }

  /* ---------- First-time welcome card ---------- */
  function showWelcome(){
    if(document.getElementById("obWelcome"))return;
    const el=document.createElement("div");
    el.id="obWelcome";
    el.innerHTML=
      '<div class="obCard">'+
      '<small>WELCOME TO</small><h1>3BALL.fun</h1>'+
      '<div class="obSteps">'+
      '<span><b>1</b><i data-aiba-icon="hand-pointer" data-aiba-label=""></i>Hold screen to charge</span>'+
      '<span><b>2</b><i data-aiba-icon="play" data-aiba-label=""></i>Release to shoot</span>'+
      '<span><b>3</b><i data-aiba-icon="target" data-aiba-label=""></i>Stop power in the <span style="color:#7CFC6B">green sweet spot</span><br>= swish three-pointer</span>'+
      "</div>"+
      '<button class="obBtn gold" id="obGoPractice" data-aiba-icon="play" data-aiba-label="Enter interactive court tutorial">Enter Interactive Court Tutorial</button>'+
      '<button class="obBtn" id="obGoFree">Explore Freely</button>'+
      '<button class="obLink" id="obGoHelp">View Full Game Guide ›</button>'+
      "</div>";
    document.body.appendChild(el);
    document.getElementById("obGoPractice").onclick=()=>{
      mark("welcome");el.remove();
      try{
        global.ensureAudio&&ensureAudio(true,true);
        if(global.AIBAInteractiveTutorial)global.AIBAInteractiveTutorial.start();
        else{
          global.goDiff("contest",true);global.pickDiff("normal");global.startPractice();
        }
      }catch(e){}
    };
    document.getElementById("obGoFree").onclick=()=>{mark("welcome");el.remove();};
    document.getElementById("obGoHelp").onclick=()=>{mark("welcome");el.remove();showHelp();};
  }

  /* ---------- Help page ---------- */
  let helpReturn="panel";
  function showHelp(returnTo){
    if(typeof global.showPanel!=="function")return;
    helpReturn=returnTo||"panel";
    document.documentElement.dataset.aibaHelp="1";
    global.AIBAPerfSettings&&global.AIBAPerfSettings.syncButton&&global.AIBAPerfSettings.syncButton();
    global.showPanel(
      '<h1 class="title" style="font-size:22px">Game Guide</h1>'+
      '<div class="card"><b>Basics</b><br>Hold screen to charge → release to shoot. Stop in the green sweet spot for a swish. Shooting is harder when stamina is low—rest up!</div>'+
      '<div class="card"><b>Percent Battle</b><br>Face off against AI, first to 100 wins. Tap glow spots on court (or ←→ keys) to switch positions; regular spots = 3pts, colored balls = 5pts, center LOGO ball = 10pts.</div>'+
      '<div class="card"><b>RACK RUSH</b><br>Continuous balls from the top of the arc: beat each level to reach FINAL RUSH; or play Percent Speedrun—first to 100 wins, with your time on the leaderboard.</div>'+
      '<div class="card"><b>Three-Point Contest</b><br>70 seconds to clear 5 racks + 2 deep colored balls. Money balls and deep shots score higher.</div>'+
      '<div class="card"><b>Motion Control</b><br>Switch to "Motion Control" on the difficulty page to shoot with your camera: frame both hands in the box → raise to charge → cross the line to shoot. Video is processed locally and never uploaded.</div>'+
      '<button class="btn green" data-aiba-icon="rotate-ccw" data-aiba-label="Replay onboarding" onclick="AIBAOnboard.replay()">Replay Onboarding</button>'+
      '<button class="btn" data-aiba-icon="video" data-aiba-label="Interactive court tutorial" onclick="AIBAOnboard.startTutorial()">Interactive Court Tutorial</button>'+
      '<button class="btn gold" data-aiba-icon="arrow-left" data-aiba-label="Back" onclick="AIBAOnboard.closeHelp()">Back</button>'
    );
  }
  function clearHelpState(){
    delete document.documentElement.dataset.aibaHelp;
    global.AIBAPerfSettings&&global.AIBAPerfSettings.syncButton&&global.AIBAPerfSettings.syncButton();
  }
  function closeHelp(){
    clearHelpState();
    if(helpReturn==="settings"&&global.AIBAPerfSettings&&global.AIBAPerfSettings.reopen){global.AIBAPerfSettings.reopen();return;}
    if(typeof global.hidePanel==="function")global.hidePanel();
  }

  /* ---------- Scene-based coach marks (polling trigger, each once) ---------- */
  let holdShownAt=0;
  function poll(){
    const G=GG();
    if(!G)return;
    if(G.interactiveTutorial)return;
    // Welcome card: first time at main menu
    const bl=document.getElementById("bootLoad");
    if(!seen.welcome&&G.state==="menu"&&(!bl||!bl.offsetParent)){
      showWelcome();
    }
    if(document.getElementById("obWelcome")&&G.state!=="menu"){
      document.getElementById("obWelcome").remove();mark("welcome");
    }
    // First time able to shoot: hold-to-charge prompt
    if(!seen.hold&&playing()&&G.canShoot&&!G.charging){
      if(!holdShownAt){holdShownAt=Date.now();tip('<i class="obFinger" data-aiba-icon="hand-pointer" data-aiba-label=""></i> Hold screen to charge · Release to shoot',6000);}
    }
    if(!seen.hold&&G.charging){mark("hold");tipEl&&tipEl.classList.remove("on");}
    // After first shot: sweet spot prompt
    if(!seen.sweet&&seen.hold&&G.shots&&(G.shots.length>0||G.shotIdx>0)){
      mark("sweet");setTimeout(()=>tip("<i data-aiba-icon='target' data-aiba-label=''></i> Stop in the <b style='color:#7CFC6B'>green sweet spot</b> for a swish",4200),700);
    }
    // First entry to each mode
    if(!seen.battle&&G.state==="battle"){mark("battle");setTimeout(()=>tip("<i data-aiba-icon='target' data-aiba-label=''></i> Tap glow spots to move (or ←→) · First to 100 wins",5200),1400);}
    if(!seen.rush&&G.state==="rackrush"){mark("rush");setTimeout(()=>tip("<i data-aiba-icon='play' data-aiba-label=''></i> Continuous feeds from the top · Keep up the rhythm",4600),1400);}
    // First time exhausted
    if(!seen.tired&&global.AIBAGear&&playing()){
      try{if(AIBAGear.stamina().out){mark("tired");tip("😮‍💨 Exhausted! Rest up—stamina must recover to 28% before you can shoot again.",5200);}}catch(e){}
    }
  }
  setInterval(poll,350);

  global.AIBAOnboard={
    help:showHelp,closeHelp,
    startTutorial(){clearHelpState();global.AIBAInteractiveTutorial&&global.AIBAInteractiveTutorial.start();},
    replay(){clearHelpState();delete seen.welcome;delete seen.hold;delete seen.sweet;
      try{localStorage.setItem(KEY,JSON.stringify(seen));}catch(e){}
      if(typeof global.hidePanel==="function")global.hidePanel();
      const g=GG();if(g&&g.state==="menu")showWelcome();
      else if(typeof global.location!=="undefined")location.reload();
    }
  };
})(window);