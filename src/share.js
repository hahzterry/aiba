(function(global){
  "use strict";

  function fallbackSave(blob,opts){
    opts=opts||{};
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=opts.fileName||"aiba-result.png";
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    if(opts.toast)opts.toast(opts.savedText||"战报已保存 · 发到朋友圈吧!","#7CFC6B");
  }

  function seedUrl(seed){
    try{return location.origin+location.pathname+"?seed="+seed;}
    catch(e){return "";}
  }

  function genPoster(champ,ctx){
    ctx=ctx||{};
    const G=ctx.G,DIFFS=ctx.DIFFS||{},GAME_NAME=ctx.GAME_NAME||"aiBA",GAME_SEED=ctx.GAME_SEED||Date.now(),toast=ctx.toast||function(){};
    if(!G)return;
    const W=640,H=960;
    const cv=document.createElement("canvas");cv.width=W;cv.height=H;
    const c=cv.getContext("2d");
    const g=c.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"#0a0c18");g.addColorStop(1,"#101426");
    c.fillStyle=g;c.fillRect(0,0,W,H);
    c.strokeStyle="rgba(255,255,255,0.04)";c.lineWidth=1;
    for(let x=0;x<W;x+=24){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
    for(let y=0;y<H;y+=24){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}

    c.fillStyle="#e8771e";c.beginPath();c.arc(W/2,76,38,0,7);c.fill();
    c.strokeStyle="#1f130a";c.lineWidth=3;
    c.beginPath();c.moveTo(W/2-38,76);c.lineTo(W/2+38,76);c.stroke();
    c.beginPath();c.moveTo(W/2,38);c.lineTo(W/2,114);c.stroke();
    c.beginPath();c.arc(W/2,76,38,0,7);c.stroke();

    c.font="bold 42px Orbitron, sans-serif";c.textAlign="center";
    c.fillStyle="#000";c.fillText(GAME_NAME,W/2+2,164+2);
    c.fillStyle="#ffd23f";c.fillText(GAME_NAME,W/2,164);
    c.font="bold 22px Orbitron, sans-serif";c.fillStyle="#dde";
    c.fillText(champ?"夺冠了!":"挑战结束",W/2,216);
    const sc=champ?G.finalScore:(G.finalScore||G.semiScore||G.score);
    c.font="bold 88px Orbitron, sans-serif";
    c.fillStyle="#000";c.fillText(sc,W/2+3,328+3);
    c.fillStyle="#ffd23f";c.fillText(sc,W/2,328);
    c.font="bold 18px Orbitron, sans-serif";c.fillStyle="#8fa3c8";c.fillText("PTS",W/2+74,328);
    if(G.finalist){
      c.font="bold 20px Orbitron, sans-serif";c.fillStyle="#dde";
      c.fillText((champ?"击败":"惜败")+" "+G.finalist.n+" ("+G.finalist.num+"号)",W/2,380);
    }

    const stats=[
      ["最高连中","x"+((G.stats&&G.stats.best)||0)],
      ["花球命中",((G.stats&&G.stats.moneyM)||0)+"/"+((G.stats&&G.stats.moneyT)||0)],
      ["深远三分",((G.stats&&G.stats.deepM)||0)+"/"+((G.stats&&G.stats.deepT)||0)],
      ["难度",(DIFFS[G.diff]&&DIFFS[G.diff].n)||G.diff||"-"]
    ];
    c.fillStyle="rgba(30,42,70,0.5)";c.fillRect(40,420,W-80,200);
    c.strokeStyle="rgba(255,210,63,0.3)";c.lineWidth=2;c.strokeRect(40,420,W-80,200);
    stats.forEach((st,i)=>{
      const y=455+i*45;
      c.font="18px Orbitron, sans-serif";c.textAlign="left";
      c.fillStyle="#fff";c.fillText(st[0],70,y);
      c.textAlign="right";c.fillStyle="#ffd23f";c.font="bold 22px Orbitron, sans-serif";
      c.fillText(st[1],W-70,y);
    });

    c.textAlign="center";c.font="bold 16px Orbitron, monospace";c.fillStyle="#7ee7ff";
    c.fillText("aiBA CYBER COURT · RACE TO 100",W/2,660);
    c.font="14px Orbitron, sans-serif";c.fillStyle="#9ab";
    const names=(G.opponents||[]).map(o=>o.n+"#"+o.num).join(" · ");
    c.fillText("对阵:"+names,W/2,692);
    c.fillStyle="rgba(20,40,72,0.28)";c.fillRect(40,730,W-80,70);
    c.strokeStyle="#4aa3ff";c.lineWidth=2;c.strokeRect(40,730,W-80,70);
    c.font="bold 20px Orbitron, sans-serif";c.fillStyle="#ffd23f";
    c.fillText("霓虹球场已开灯",W/2,762);
    c.font="13px Orbitron, sans-serif";c.fillStyle="#d9f6ff";
    c.fillText("下一场,换你接管最后一投。",W/2,784);
    c.font="bold 16px Orbitron, sans-serif";c.fillStyle="#dde";
    c.fillText("你能打败库里吗? 点链接挑战同题 →",W/2,850);
    c.font="12px Orbitron, monospace";c.fillStyle="#7a8faa";
    c.fillText(seedUrl(GAME_SEED),W/2,878);

    cv.toBlob(blob=>{
      if(!blob){toast("生成失败","#ff8d7a");return;}
      const fileName="block3pt-"+GAME_SEED+".png";
      if(navigator.share&&navigator.canShare){
        const file=new File([blob],fileName,{type:"image/png"});
        if(navigator.canShare({files:[file]})){
          navigator.share({files:[file],title:GAME_NAME+" #"+GAME_SEED,
            text:champ?"我夺冠了! "+sc+"分":sc+"分 · 你能超过我吗?"
          }).catch(()=>fallbackSave(blob,{fileName,toast}));
          return;
        }
      }
      fallbackSave(blob,{fileName,toast});
    },"image/png");
  }

  global.AIBAShare=Object.freeze({genPoster,fallbackSave,seedUrl});
})(window);
