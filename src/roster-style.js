/* ---------------- roster style: 女性发型 + 球员体型差异 ----------------
   在主内联脚本与 avatar-customizer 之后加载:
   1) setHair 扩展 ponytail/bun/long 三种发型(女性球员用),未知发型回退原函数。
   2) applyStarStyle 追加体型缩放:按 AIBA_CONFIG.BODY_PROFILES 的 h(身高)/w(体格)
      缩放整个体素小人;球(pBall)做反向补偿保持标准尺寸不变形。
   3) randomizeOutfit 单独调用时重置缩放,避免上一位球员的体型残留。 */
(function(global){
  "use strict";

  function cfg(){return global.AIBA_CONFIG||{};}

  /* ---------- 女性发型 ---------- */
  const FEMALE_STYLES={ponytail:1,bun:1,long:1};
  function buildFemaleHair(o,style){
    const G=o.hairGrp,m=o.hairMat;
    while(G.children.length)G.remove(G.children[0]);
    o.hairStyle=style;
    const box=(w,h,d,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);G.add(b);return b;};
    /* 共用发冠:顶部+前发际+两鬓+后脑,比男款略厚 */
    box(0.36,0.1,0.36,0,1.835,0);
    box(0.34,0.055,0.08,0,1.8,0.16);
    box(0.09,0.09,0.37,-0.17,1.785,0);
    box(0.09,0.09,0.37,0.17,1.785,0);
    box(0.37,0.09,0.16,0,1.79,-0.17);
    if(style==="ponytail"){
      box(0.1,0.05,0.1,0,1.79,-0.235);                 // 发圈位置
      const t1=box(0.11,0.22,0.1,0,1.66,-0.265);t1.rotation.x=0.16;
      const t2=box(0.09,0.2,0.08,0,1.49,-0.29);t2.rotation.x=0.08;
      box(0.06,0.11,0.06,0,1.37,-0.3);                 // 发梢
      return;
    }
    if(style==="bun"){
      box(0.18,0.15,0.18,0,1.9,-0.12);                 // 丸子
      box(0.21,0.045,0.21,0,1.82,-0.12);               // 发圈
      return;
    }
    /* long:披肩长发 */
    box(0.095,0.44,0.31,-0.195,1.6,-0.03);
    box(0.095,0.44,0.31,0.195,1.6,-0.03);
    box(0.37,0.42,0.1,0,1.58,-0.205);
    box(0.3,0.12,0.08,0,1.36,-0.21);                   // 发尾
  }
  const origSetHair=global.setHair;
  if(typeof origSetHair==="function"&&!origSetHair.__aibaRoster){
    const fn=function(o,style,colorHex){
      if(FEMALE_STYLES[style]){
        if(colorHex!=null)o.hairMat.color.setHex(colorHex);
        buildFemaleHair(o,style);
        return;
      }
      return origSetHair.apply(this,arguments);
    };
    fn.__aibaRoster=true;
    global.setHair=fn;
  }

  /* ---------- 体型缩放 ---------- */
  function applyBody(guy,star){
    if(!guy||!guy.g)return;
    const bp=(cfg().bodyProfileFor?cfg().bodyProfileFor(star):null)||{h:1,w:1};
    guy.g.scale.set(bp.w,bp.h,bp.w);
    // 主角的球挂在体素层级里,反向补偿保持球为标准圆球
    if(typeof player!=="undefined"&&guy===player&&typeof pBall!=="undefined")
      pBall.scale.set(1/bp.w,1/bp.h,1/bp.w);
  }
  function resetBody(guy){
    if(!guy||!guy.g)return;
    guy.g.scale.set(1,1,1);
    if(typeof player!=="undefined"&&guy===player&&typeof pBall!=="undefined")
      pBall.scale.set(1,1,1);
  }

  /* 通用经典球星(无专属肤色/发型档案)现在统一走 applyStarStyle,
     原函数会把发型固定成 short——这里补回原随机造型池,保留赛前多样性 */
  const RAND_HAIR_COLORS=[0x222222,0x4a2c12,0x101010,0x5c4a1e,0x3a2410];
  const RAND_HAIR_STYLES=["short","short","fade","fade","buzz","afro","cornrows","flattop"];
  function restyleGenericLegend(guy,star){
    if(!star||star.custom||star.hairStyle||star.skin!=null||star.sex==="f")return;
    const hc=RAND_HAIR_COLORS[(Math.random()*RAND_HAIR_COLORS.length)|0];
    if(typeof setHair==="function")setHair(guy,RAND_HAIR_STYLES[(Math.random()*RAND_HAIR_STYLES.length)|0],hc);
    if(typeof setBeard==="function")setBeard(guy,Math.random()<0.3,hc);
  }

  const origApplyStar=global.applyStarStyle;
  if(typeof origApplyStar==="function"&&!origApplyStar.__aibaRosterBody){
    const fn=function(guy,star){
      const r=origApplyStar.apply(this,arguments);
      restyleGenericLegend(guy,star);
      applyBody(guy,star);
      return r;
    };
    fn.__aibaRosterBody=true;
    global.applyStarStyle=fn;
  }
  const origRandomize=global.randomizeOutfit;
  if(typeof origRandomize==="function"&&!origRandomize.__aibaRosterBody){
    const fn=function(o){
      const r=origRandomize.apply(this,arguments);
      resetBody(o); // applyStarStyle 内部会随后重新按球员档案缩放
      return r;
    };
    fn.__aibaRosterBody=true;
    global.randomizeOutfit=fn;
  }

  global.AIBARosterStyle={applyBody,resetBody,femaleStyles:Object.keys(FEMALE_STYLES)};
})(window);
