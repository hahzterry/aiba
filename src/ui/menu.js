(function(global){
  "use strict";

  const runtime=global.AIBA&&global.AIBA.runtime,ctx=runtime&&runtime.service("legacy");
  if(!runtime||!ctx||!runtime.service("ui:panels")||!runtime.service("ui:loading"))throw new Error("UI menu requires panels, loading, and legacy adapter");
  const {G,COVER_STARS,BATTLE_BAR_VISIBLE_SHOTS,RACK_RUSH_SPEED_TARGET,resetFinalRun,ensureAudio}=ctx;

  function showMenu(){
    G.state="menu";resetFinalRun();
    if(ctx.hasAudioContext()){
      ensureAudio(true);
      if(typeof global.playSFX==="function")global.playSFX("ui_mode_whoosh_01",.42);
    }
    const cover=global.BOOT_GATE_ACTIVE&&global.BOOT_COVER?global.BOOT_COVER:COVER_STARS[(Math.random()*COVER_STARS.length)|0];
    const coverVideo=cover.coverVideo?`<video class="coverVideo" muted loop playsinline preload="none" data-src="${cover.coverVideo}" aria-hidden="true" tabindex="-1"></video>`:"";
    global.showCoverPanel(`
      <div class="coverHero" style="background-image:url('${cover.cover}')">
        ${coverVideo}
        <div class="coverMenu"><div>
          <picture class="coverTitleMark">
          <source
          srcset="/assets/aiba-brand/3ball-logo-v3.webp"
          type="image/webp"
          >
          <img
          class="coverTitleLogo"
          src="/assets/aiba-brand/3ball-logo-v3.png"
          width="768"
          height="425"
          alt="3BALL.fun"
          loading="eager"
          decoding="async"
          >
          </picture>
          <div class="coverSub">Shoot at air? Nah. Shoot at the rim? Kill mode.</div>
          ${global.AIBAProfileBarMarkup?global.AIBAProfileBarMarkup():""}
          <div class="coverActions schemeA">
            <div class="modeTile rush featured">
              <div class="modeCopy"><div class="modeEyebrow">Arcade run</div><div class="modeName">RACK RUSH</div><div class="modeDesc">Nonstop feeds — clear stages, stack the score.</div></div>
              <div class="modeBtns"><button class="modeInfo" onclick="ensureAudio(true,true);showModeInfo('rackrush')">i</button><button class="modePlay" onclick="ensureAudio(true,true);goDiff('rackrush')"><small>RACK RUSH</small>RUN IT »</button></div>
            </div>
            <div class="quickModes" aria-label="Other modes">
              <div class="quickMode primary">
                <button class="quickInfo" onclick="ensureAudio(true,true);showModeInfo('battle')" aria-label="Percent Battle rules">i</button>
                <button class="quickPlay" onclick="ensureAudio(true,true);goDiff('battle')"><small>02 / PERCENT</small><b>Percent Battle</b><span>First to 💯</span></button>
              </div>
              <div class="quickMode">
                <button class="quickInfo" onclick="ensureAudio(true,true);showModeInfo('contest')" aria-label="3PT Challenge rules">i</button>
                <button class="quickPlay" onclick="ensureAudio(true,true);goDiff('contest')"><small>03 / CLASSIC</small><b>3PT Contest</b><span>70‑sec challenge</span></button>
              </div>
            </div>
          </div>${global.AIBALeaderboardHomeMarkup?global.AIBALeaderboardHomeMarkup():""}
        </div></div>
        <div class="coverCredit">3BALL.fun</div>
      </div>
    `);
    if(!global.BOOT_GATE_ACTIVE)global.scheduleCoverVideo();
  }

  function showModeInfo(mode){
    if(mode==="battle"){
      global.showPanel(`<h1 class="title" style="font-size:22px">Percent Battle 100</h1>
        <div class="card">Both shoot live — first to <b>100</b> wins. Each regular‑spot make is <b>3 pts</b>, color‑ball spots are <b>5 pts</b>, halfcourt makes are <b>10 pts</b>.</div>
        <div class="card">Rookie shows the meter for the first <b>70%</b>; higher difficulties only keep it for the first <b>${BATTLE_BAR_VISIBLE_SHOTS}</b> balls. After that, it's all feel.</div>
        <button class="btn green" onclick="ensureAudio(true,true);goDiff('battle')">Start Percent Battle</button>
        <button class="btn sm" onclick="showMenu()">Back to home</button>`);
      return;
    }
    if(mode==="rackrush"){
      global.showPanel(`<h1 class="title" style="font-size:22px">RACK RUSH · Shooting Machine</h1>
        <div class="card">Pick a difficulty first, then a sub‑mode: <b>Level Run</b> or <b>Speed 100</b>.</div>
        <div class="card">Level Run clears stage goals for total score; in Speed 100 normal balls are <b>3 pts</b>, color balls <b>4 pts</b>, hit <b>${RACK_RUSH_SPEED_TARGET}</b> and the clock stops. Fastest time wins.</div>
        <button class="btn gold" onclick="ensureAudio(true,true);goDiff('rackrush')">Choose your machine mode</button>
        <button class="btn sm" onclick="showMenu()">Back to home</button>`);
      return;
    }
    if(mode==="nbadna"){
      global.showPanel(`<h1 class="title" style="font-size:22px">NBA DNA</h1>
        <div class="card"><b>[Coming soon]</b><br>Shot‑pose analysis and NBA star style matching are still in the works — not open in this build yet.</div>
        <button class="btn sm" onclick="showMenu()">Back to home</button>`);
      return;
    }
    global.showPanel(`<h1 class="title" style="font-size:22px">3PT Challenge</h1>
      <div class="card">Classic 3PT contest rules: <b>70 seconds</b>, 5 regular racks plus 2 deep spots. Money balls & deep balls are worth more.</div>
      <div class="card">Hold to charge, release to shoot. Rookie hides the meter for the last 30%; higher difficulties go by feel even earlier.</div>
      <button class="btn gold" onclick="ensureAudio(true,true);goDiff('contest')">Start 3PT Challenge</button>
      <button class="btn sm" onclick="showMenu()">Back to home</button>`);
  }

  const api=Object.freeze({showMenu,showModeInfo});
  Object.assign(global,api);runtime.register("ui:menu",api);
})(window);