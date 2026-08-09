(function(global){
  "use strict";

  const DIFFS = Object.freeze({
    easy: { n: "Rookie", zone: 11, fill: 80, ai: -0.085, hideBar: 99, latK: 0.012, d: "Sweet spot is very large · Shot meter visible for first 70% · Last 30% relies on feel" },
    normal: { n: "All-Star", zone: 5.5, fill: 95, ai: 0, hideBar: 1, latK: 0.02, d: "Sweet spot narrowed · Shot meter hidden starting from the 2nd rack" },
    hard: { n: "Hall of Fame", zone: 3.2, fill: 110, ai: 0.055, hideBar: 1, latK: 0.028, d: "Sweet spot is extremely narrow · Blind shooting from the 2nd rack · Phone tilt is more sensitive" }
  });

  const RACK_RUSH_LEVELS = Object.freeze([
    { name: "Warm-up Start", time: 30, feed: 1.35, targets: { easy: 18, normal: 20, hard: 22 }, bar: "all" },
    { name: "Rhythm Acceleration", time: 35, feed: 1.25, targets: { easy: 26, normal: 30, hard: 34 }, bar: "all" },
    { name: "Pressure Test", time: 40, feed: 1.15, targets: { easy: 36, normal: 42, hard: 48 }, bar: "time10" },
    { name: "Full Firepower", time: 40, feed: 1.05, targets: { easy: 48, normal: 56, hard: 64 }, bar: "shots5" },
    { name: "Extreme Blind Shot", time: 45, feed: .95, targets: { easy: 62, normal: 72, hard: 80 }, bar: "none" },
    { name: "FINAL RUSH", time: 30, feed: .9, targets: null, bar: "none", final: true }
  ]);

  const SCENE_PRESETS = Object.freeze({
    indoor: { name: "Indoor Classic", type: "indoor", weather: "none", progression: "none", desc: "Wood floor, stands, and arena lighting" },
    outdoorSunny: { name: "Sunny Street", type: "outdoor", weather: "sunny", progression: "none", desc: "Blue sky, fences, and city park" },
    rainyCourt: { name: "Rainy Street", type: "outdoor", weather: "rain", progression: "none", desc: "Wet court, overcast sky, and light rain" },
    flowerCourt: { name: "Flower Court", type: "outdoor", weather: "sunny", progression: "flowerBloom", desc: "Grows from weeds to a sea of flowers, with permanent growth on every score" },
    beachSunset: { name: "West Coast Sunset", type: "outdoor", weather: "sunny", progression: "sunsetToNight", desc: "Seaside dusk transitions into night as the score progresses" }
  });

  const WEATHER_SHOT_MODIFIERS = Object.freeze({
    none: { idealBias: 0, noiseMin: 0, noiseMax: 0 },
    sunny: { idealBias: 0, noiseMin: 0, noiseMax: 0 },
    rain: { idealBias: 3.5, noiseMin: -1, noiseMax: 1.5 }
  });

  const CLASSIC_LEGENDS = Object.freeze([
    { id: "curry", n: "Stephen Curry", t: "4x Champion · All-Time 3PT Leader", r: 97, col: [0x1d428a, 0xffc72c], num: 30 },
    { id: "thompson", n: "Klay Thompson", t: "4x Champion · 37 pts in a quarter", r: 93, col: [0xffc72c, 0x1d428a], num: 11 },
    { id: "allen", n: "Ray Allen", t: "2x Champion · Deadly Corner", r: 91, col: [0x007a33, 0xffffff], num: 20 },
    { id: "bird", n: "Larry Bird", t: "3x Champion · 3x MVP", r: 89, col: [0x007a33, 0x111111], num: 33 },
    { id: "miller", n: "Reggie Miller", t: "5x All-Star · Clutch 3PT", r: 88, col: [0xfdbb30, 0x002d62], num: 31 },
    { id: "lillard", n: "Damian Lillard", t: "8x All-Star · Deep 3PT", r: 90, col: [0xe03a3e, 0x111111], num: 0 },
    { id: "korver", n: "Kyle Korver", t: "All-Star Shooter · Catch & Shoot", r: 86, col: [0xc8102e, 0x26282a], num: 26 },
    { id: "stojakovic", n: "Peja Stojakovic", t: "2x 3PT Contest Champion", r: 87, col: [0x5a2d81, 0x8a8d8f], num: 16 },
    { id: "ionescu", n: "Sabrina Ionescu", t: "WNBA All-Star · 3PT Contest Record", r: 91, col: [0x6eceb2, 0x101820], num: 20, sex: "f", hairStyle: "ponytail", hair: 0x3a2410, skin: 0xf4c89c },
    { id: "taurasi", n: "Diana Taurasi", t: "3x WNBA Champion · All-Time Scoring Leader", r: 92, col: [0x2b1a4e, 0xe56020], num: 3, sex: "f", hairStyle: "bun", hair: 0x1a1210, skin: 0xe8c39a },
    { id: "sue-bird", n: "Sue Bird", t: "4x WNBA Champion · Legendary PG", r: 89, col: [0x2c5234, 0xffc600], num: 10, sex: "f", hairStyle: "ponytail", hair: 0x4a2c12, skin: 0xf4c89c }
  ]);

  const DEFAULT_SHOT_PROFILE = Object.freeze({ speed: 1, window: 1, arc: 1, arcLabel: "Standard Arc", label: "Standard Release" });
  const SHOT_PROFILES = Object.freeze({
    curry: { speed: 1.13, window: 1.1, arc: 1.1, arcLabel: "High Arc Quick Release", label: "Extreme Speed Release" },
    thompson: { speed: 1.09, window: 1.08, arc: .98, arcLabel: "Flat & Fast Spot-Up", label: "Quick Spot-Up" },
    allen: { speed: 1.02, window: 1.09, arc: .94, arcLabel: "Low & Fast Arc", label: "Standard Quick Release" },
    bird: { speed: .88, window: 1.1, arc: 1.12, arcLabel: "Slow Tempo High Lob", label: "Calm High Release" },
    miller: { speed: 1, window: 1.02, arc: 1, arcLabel: "Standard Arc", label: "Standard Release" },
    lillard: { speed: 1.07, window: .98, arc: 1.08, arcLabel: "Deep Shot High Arc", label: "Quick Deep Shot" },
    korver: { speed: 1.1, window: 1.12, arc: 1.02, arcLabel: "Catch & Shoot Quick Arc", label: "Extreme Speed Catch & Shoot" },
    stojakovic: { speed: .94, window: 1.07, arc: 1.11, arcLabel: "Smooth High Arc", label: "Smooth Release" },
    k24: { speed: .89, window: .97, arc: 1.06, arcLabel: "Fadeaway Mid-High Arc", label: "Calm Fadeaway" },
    j23: { speed: .84, window: .94, arc: 1.13, arcLabel: "Hang-Time High Arc", label: "Hang-Time Release" },
    a03: { speed: 1.04, window: .99, arc: .96, arcLabel: "Low & Fast Pull-Up", label: "Quick Pull-Up" },
    v15: { speed: .87, window: .92, arc: 1.15, arcLabel: "High Point Big Arc", label: "High Point Release" },
    t01: { speed: .92, window: .97, arc: .90, arcLabel: "Extremely Low Flat Arc", label: "Smooth Deep Shot" },
    ionescu: { speed: 1.08, window: 1.06, arc: 1.05, arcLabel: "High Arc Quick Release", label: "Quick Release" },
    taurasi: { speed: 1, window: 1.05, arc: 1.03, arcLabel: "Standard High Arc", label: "Cold-Blooded Release" },
    "sue-bird": { speed: .99, window: 1.04, arc: 1, arcLabel: "Smooth Arc", label: "Rhythmic Release" }
  });

  /* Body profiles: h=height scale, w=width scale, roughly adjusted based on real player builds
     (Curry 1.88m lean / Bird 2.06m / Miller lean & tall / AI 1.83m small / KD tall & lean / Female players overall smaller) */
  const DEFAULT_BODY = Object.freeze({ h: 1, w: 1 });
  const BODY_PROFILES = Object.freeze({
    curry: { h: .97, w: .96 },
    thompson: { h: 1.01, w: 1.02 },
    allen: { h: 1, w: .99 },
    bird: { h: 1.05, w: 1.03 },
    miller: { h: 1.02, w: .92 },
    lillard: { h: .97, w: 1.04 },
    korver: { h: 1.02, w: 1 },
    stojakovic: { h: 1.05, w: 1.01 },
    k24: { h: 1.01, w: 1 },
    j23: { h: 1.01, w: 1.02 },
    a03: { h: .93, w: .94 },
    v15: { h: 1.01, w: 1.03 },
    t01: { h: 1.07, w: .93 },
    ionescu: { h: .94, w: .9 },
    taurasi: { h: .95, w: .93 },
    "sue-bird": { h: .92, w: .88 }
  });

  function bodyProfileFor(star) {
    if (star && star.body) return star.body;
    return BODY_PROFILES[star && (star.id || star.n)] || DEFAULT_BODY;
  }

  function shotProfileFor(star) {
    if (star && star.shotProfile) return star.shotProfile;
    return SHOT_PROFILES[star && (star.id || star.n)] || DEFAULT_SHOT_PROFILE;
  }

  function shotFlightTime(baseTf, star, opts) {
    const p = shotProfileFor(star);
    const deep = opts && opts.deep;
    const arc = Number(p.arc) || 1;
    const scaled = 1 + (arc - 1) * (deep ? 0.72 : 1);
    return baseTf * Math.max(.9, Math.min(1.16, scaled));
  }

  global.AIBA_CONFIG = Object.freeze({
    LEADERBOARD_API: "https://aiba-leaderboard-api.tiger-seeker.workers.dev",
    DIFFS,
    RACK_RUSH_LEVELS,
    SCENE_PRESETS,
    WEATHER_SHOT_MODIFIERS,
    CLASSIC_LEGENDS,
    DEFAULT_SHOT_PROFILE,
    SHOT_PROFILES,
    DEFAULT_BODY,
    BODY_PROFILES,
    shotProfileFor,
    shotFlightTime,
    bodyProfileFor
  });
})(window);