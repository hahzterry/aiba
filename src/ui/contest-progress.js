/* 三分大赛总进度条:展示全部点位(5球架×5球+2深远彩球)的命中/未中/待投与计数。
   纯观察者模式:轮询游戏状态渲染,不侵入任何核心逻辑,legacy 与 next 入口均可用。 */
(function(global){
  "use strict";
  let root=null,lastKey="";
  const GG=()=>{try{return typeof G==="undefined"?null:G;}catch(e){return null;}};

  function ensureRoot(){
    if(root&&document.body.contains(root))return root;
    root=document.createElement("div");
    root.id="contestProgress";
    root.setAttribute("aria-label","三分大赛进度");
    document.body.appendChild(root);
    return root;
  }
  function shotState(i){
    const G=GG();
    if(i<G.shots.length)return G.shots[i].made?"made":"miss";
    if(i===G.shotIdx&&G.running)return "cur";
    return "todo";
  }
  function render(){
    const G=GG();
    const el=ensureRoot();
    const seq=G.seq||[];
    let made=0,total=seq.length;
    for(const s of G.shots||[])if(s.made)made++;
    // 变化检测,避免每帧重建 DOM
    const key=G.shotIdx+"|"+(G.shots?G.shots.length:0)+"|"+made+"|"+total+"|"+(G.moneyRack||0);
    if(key===lastKey){el.style.display="flex";return;}
    lastKey=key;
    // 按序列顺序分组:连续同球架为一组,深远彩球(rack=null)单独成菱形
    let html="",i=0;
    while(i<seq.length){
      const s=seq[i];
      if(s.rack==null){
        html+='<span class="cpRack cpDeeps"><i class="cpDeep cp-'+shotState(i)+'"></i></span>';
        i++;continue;
      }
      const rack=s.rack,money=rack===G.moneyRack;
      let cells="";
      while(i<seq.length&&seq[i].rack===rack){
        cells+='<i class="cpCell cp-'+shotState(i)+(seq[i].ball===4?" cpLast":"")+'"></i>';
        i++;
      }
      html+='<span class="cpRack'+(money?" cpMoney":"")+'">'+cells+"</span>";
    }
    html+='<b class="cpCount">'+made+"/"+total+"</b>";
    el.innerHTML=html;
    el.style.display="flex";
  }
  function tick(){
    const G=GG();
    const active=G&&G.mode==="contest"&&!G.practice&&(G.state==="round"||G.state==="tiebreak")&&G.seq&&G.seq.length;
    if(!active){
      if(root)root.style.display="none";
      lastKey="";
      return;
    }
    try{render();}catch(e){}
  }
  setInterval(tick,240);
})(window);
