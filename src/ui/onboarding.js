/* 新手引导:首次欢迎卡 + 分场景一次性提示(coach marks)+ 帮助入口。
   观察者模式:轮询状态触发,不改核心逻辑;老玩家(有标记)完全无感。 */
(function(global){
  "use strict";
  const KEY="aiba_onboard_v2";
  let seen={};
  try{seen=JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch(e){}
  function mark(k){seen[k]=1;try{localStorage.setItem(KEY,JSON.stringify(seen));}catch(e){}}
  const GG=()=>{try{return typeof G==="undefined"?null:G;}catch(e){return null;}};
  const playing=()=>{const g=GG();return g&&/^(round|tiebreak|battle|rackrush)$/.test(g.state);};

  /* ---------- 轻提示气泡 ---------- */
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

  /* ---------- 首次欢迎卡 ---------- */
  function showWelcome(){
    if(document.getElementById("obWelcome"))return;
    const el=document.createElement("div");
    el.id="obWelcome";
    el.innerHTML=
      '<div class="obCard">'+
      '<small>WELCOME TO</small><h1>aiBA · 百分大战</h1>'+
      '<div class="obSteps">'+
      '<span><b>1</b><i>👆</i>按住屏幕蓄力</span>'+
      '<span><b>2</b><i>🖐️</i>松开手出手</span>'+
      '<span><b>3</b><i>🎯</i>力量停在绿色甜区<br>= 空心三分</span>'+
      "</div>"+
      '<button class="obBtn gold" id="obGoPractice">🏀 先来 3 球热身(15秒)</button>'+
      '<button class="obBtn" id="obGoFree">直接开逛</button>'+
      '<button class="obLink" id="obGoHelp">查看完整玩法说明 ›</button>'+
      "</div>";
    document.body.appendChild(el);
    document.getElementById("obGoPractice").onclick=()=>{
      mark("welcome");el.remove();
      try{
        global.ensureAudio&&ensureAudio(true,true);
        global.goDiff("contest",true);global.pickDiff("normal");global.startPractice();
      }catch(e){}
    };
    document.getElementById("obGoFree").onclick=()=>{mark("welcome");el.remove();};
    document.getElementById("obGoHelp").onclick=()=>{mark("welcome");el.remove();showHelp();};
  }

  /* ---------- 帮助页 ---------- */
  function showHelp(){
    if(typeof global.showPanel!=="function")return;
    global.showPanel(
      '<h1 class="title" style="font-size:22px">📖 玩法说明</h1>'+
      '<div class="card"><b>基本操作</b><br>按住屏幕蓄力 → 松开出手,力量条停在绿色甜区就是空心。低精力时出手更难,记得停手休息。</div>'+
      '<div class="card"><b>百分大战</b><br>与 AI 同场对投,先到 100 分获胜。点击场上光圈(或 ←→ 键)换点位;普通点 3 分、彩球点 5 分、中场 LOGO 球 10 分。</div>'+
      '<div class="card"><b>投篮机 RACK RUSH</b><br>弧顶连续供球:闯关挑战逐关达标冲 FINAL RUSH;百分竞速比谁先到 100 分,用时上榜。</div>'+
      '<div class="card"><b>三分大赛</b><br>70 秒投完 5 个球架+2 个深远彩球,顶部进度条实时显示每球命中。</div>'+
      '<div class="card"><b>体感控制</b><br>难度页切"体感控制"用摄像头投篮:双手入框锁定 → 举高蓄力 → 越线出手。画面只在本机处理,不上传。</div>'+
      '<button class="btn green" onclick="AIBAOnboard.replay()">🔄 重看新手引导</button>'+
      '<button class="btn" onclick="AIBAVisionTutorial&&AIBAVisionTutorial.start(true)">🎥 体感教学排练</button>'+
      '<button class="btn gold" onclick="hidePanel()">返回</button>'
    );
  }

  /* ---------- 帮助入口按钮(⚙ 旁) ---------- */
  function mountHelpBtn(){
    if(document.getElementById("obHelpBtn"))return;
    const b=document.createElement("button");
    b.id="obHelpBtn";b.type="button";b.title="帮助与引导";b.textContent="?";
    b.onclick=e=>{e.stopPropagation();showHelp();};
    document.body.appendChild(b);
  }

  /* ---------- 分场景 coach marks(轮询触发,各一次) ---------- */
  let holdShownAt=0;
  function poll(){
    const G=GG();
    if(!G)return;
    mountHelpBtn();
    // 欢迎卡:首次到主菜单
    const bl=document.getElementById("bootLoad");
    if(!seen.welcome&&G.state==="menu"&&(!bl||!bl.offsetParent)){
      showWelcome();
    }
    if(document.getElementById("obWelcome")&&G.state!=="menu"){
      document.getElementById("obWelcome").remove();mark("welcome");
    }
    // 第一次可出手:按住蓄力提示
    if(!seen.hold&&playing()&&G.canShoot&&!G.charging){
      if(!holdShownAt){holdShownAt=Date.now();tip('<i class="obFinger">👆</i> 按住屏幕蓄力 · 松开出手',6000);}
    }
    if(!seen.hold&&G.charging){mark("hold");tipEl&&tipEl.classList.remove("on");}
    // 第一次出手后:甜区提示
    if(!seen.sweet&&seen.hold&&G.shots&&(G.shots.length>0||G.shotIdx>0)){
      mark("sweet");setTimeout(()=>tip("🎯 力量条停在<b style='color:#7CFC6B'>绿色甜区</b>就是空心",4200),700);
    }
    // 首次进各模式
    if(!seen.battle&&G.state==="battle"){mark("battle");setTimeout(()=>tip("📍 点击场上光圈移动点位(或 ←→ 键)· 先到 100 分",5200),1400);}
    if(!seen.rush&&G.state==="rackrush"){mark("rush");setTimeout(()=>tip("🏀 投篮机连续供球 · 跟上节奏连续出手",4600),1400);}
    // 首次力竭
    if(!seen.tired&&global.AIBAGear&&playing()){
      try{if(AIBAGear.stamina().out){mark("tired");tip("😮‍💨 力竭了!停手休息,精力回到 28% 才能继续投",5200);}}catch(e){}
    }
  }
  setInterval(poll,350);

  global.AIBAOnboard={
    help:showHelp,
    replay(){delete seen.welcome;delete seen.hold;delete seen.sweet;
      try{localStorage.setItem(KEY,JSON.stringify(seen));}catch(e){}
      if(typeof global.hidePanel==="function")global.hidePanel();
      const g=GG();if(g&&g.state==="menu")showWelcome();
      else if(typeof global.location!=="undefined")location.reload();
    }
  };
})(window);
