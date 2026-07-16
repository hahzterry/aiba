/* ---------------- boot ---------------- */
buildCourt();
const seatList=buildStands();
buildBackcourtShow();
buildCrowd(seatList);
buildNearCourtCrowd();
buildHoop();
buildAtmos();
buildRacks();
buildHands();
buildCharacters();
buildSpotDots();
applyScenePreset(currentScenePreset,{persist:false});
applyCamMode();
handBall.visible=false;

window.AIBA.runtime.register("core:scene-init",Object.freeze({initialized:true}));

