# aiBA Architecture

This document describes the current runtime contract before modularization. It is intentionally descriptive: changing a boundary requires updating this file and the verification checks in the same commit.

## Current Shape

- `index.html` is both the application shell and the owner of most game logic.
- The page contains about 5,500 lines of inline JavaScript.
- Files under `src/` are classic browser scripts. They publish APIs through `window.AIBA*` and depend on load order rather than imports.
- There is no bundler or framework. The production build is served as static files.
- `scripts/check.js` is the regression gate and freezes growth of inline JavaScript.

## Boot Order

The production page currently boots in five phases. This order is a compatibility contract.

1. **Engine and data**
   - local Three.js, then CDN fallbacks
   - `assets-manifest.js`
   - `config.js`
2. **Early services and UI helpers**
   - player selection, identity, leaderboard, share, recorder
   - shot physics, face overlays, haptics, visual director
3. **Inline core state**
   - constants, seeded random, `G`, audio cue arbitration
4. **Runtime services and scene/game implementation**
   - vision, audio, NBA DNA
   - renderer, scene, camera, court, players, modes, results, main loop
5. **Late compatibility hooks**
   - game flow, navigation, scene lifecycle, result stats, gear
   - avatar/roster/shot motion, hero moments, hot hand, performance settings

Late hooks load after `animate()` is declared because several modules wrap or patch functions owned by the inline core.

## Current Ownership

| Area | Current owner | Public/implicit contract |
|---|---|---|
| App state and mode transitions | `index.html` | lexical `G`, `PAUSE`, `goHome`, `goDiff` |
| Three.js world and main loop | `index.html` | lexical `scene`, `renderer`, `camera`, `animate` |
| Shot lifecycle | `index.html` + `shot-motion.js` + `shot-physics.js` | patched `startCharge`, `releaseShot`, `shotCurves` |
| Vision input | `vision.js` | reads core functions/state; exports `AIBAVisionFrame` |
| Audio | `audio.js` + inline cue arbitration | global playback helpers and `AIBAAudio` |
| Recording | `recorder.js` | `AIBARecorder`, called once per rendered frame |
| Leaderboards | identity/API/UI modules | `AIBAIdentity`, `AIBALeaderboard`, `AIBALeaderboardUI` |
| Modes | mostly `index.html` | contest, battle and Rack Rush share `G` and scene objects |
| Scene progression | `index.html` + `scene-lifecycle.js` | flower/beach reset hooks |

## Known Coupling Risks

- A classic script can see globals on `window`, but not every top-level lexical binding is a stable API.
- Several late modules monkey-patch core functions. Moving a declaration can silently change which implementation runs.
- Audio, vision and recording are tied to browser user gestures and frame timing.
- The seeded match logic and non-seeded presentation logic deliberately use different random sources.
- The leaderboard and local settings use production storage keys and must not be touched by experimental entry points.
- A syntactically valid refactor can still alter shot feel, animation timing, camera framing or final-video capture.

## Target Boundaries

The target remains a static browser game. A framework or bundler is not required for the first migration.

```text
app shell
  -> core/runtime        explicit state, services and events
  -> core/game-loop      frame orchestration only
  -> rendering/*         scene, court, players, camera, effects
  -> modes/*             lifecycle: enter/start/update/finish/exit
  -> services/*          audio, vision, recorder, leaderboard, share
  -> ui/*                menus, HUD, results, player selection
  -> data/*              config, roster, scenes, audio manifest
```

## Runtime Rules

1. New features must not add inline JavaScript to `index.html`.
2. New modules access shared state through `window.AIBA.runtime`, not through new loose globals.
3. A module owns its state or receives it through an explicit context object.
4. Mode modules implement `enter`, `start`, `update`, `finish` and `exit` where applicable.
5. The main loop calls modules; modules do not start additional animation loops.
6. Production and experimental entries use different storage namespaces.
7. Behavior migration and behavior redesign are separate commits.

## Experimental Migration Status

- `src/modes/rack-rush.js` owns Rack Rush setup, timers, rules, records and results under `/next/`.
- `src/modes/contest.js` owns contest drawing order, rounds, bracket, finals, tiebreak and championship results under `/next/`.
- Contest replay remains in the legacy core because its camera, ball ghost and render-loop integration are shared rendering concerns.
- `src/modes/percent-battle/` owns battle state and clock, spot stocks and cooldowns, opponent decisions and animation, and result construction under `/next/`.
- Percent Battle ball collision, final-shot cinematic and camera updates remain in the shared core because other rendering systems call them directly.
- `src/modes/practice.js` owns the three-shot warmup lifecycle and completion detection; it deliberately calls the shared shot lifecycle instead of duplicating it.
- `src/ui/panels.js`, `loading.js`, `menu.js`, `setup.js`, `pregame.js` and `pause.js` own shared overlays, the loading gate, the home cover/mode information, difficulty/court selection, pregame roster drawing/matchups, and pause/return-home flow under `/next/`.
- Route parity is verified for Rack Rush, Percent Battle, Three-Point Contest and NBA DNA, including return-home paths without a refresh.
- `src/rendering/core.js` owns the WebGL renderer, root scene/camera, environment roots, adaptive render scale, resize handling and base lights under `/next/`.
- `src/rendering/materials.js` owns pixel-canvas textures, basketball skins, shared basketball materials and the ball geometry under `/next/`.
- `src/rendering/court.js` owns indoor/outdoor court textures, the full-court floor mesh and the active shooting-spot ring under `/next/`.
- Desktop and portrait scene captures are verified nonblank after the rendering-core, materials and court-floor migrations.
- The generated experimental entry is now about 4,000 lines, down from roughly 5,600 in the production entry.

## Acceptance Matrix

Every ownership migration must run the script gate and manually cover the affected rows.

| Flow | Required evidence |
|---|---|
| Boot | loading gate dismisses once; cover video and menu BGM start after gesture |
| Navigation | every mode can enter setup, switch courts and return home without refresh |
| Touch shot | charge, jump, release, rim/backboard collision and landing feel unchanged |
| Vision shot | camera starts once; charge and fast release are recognized |
| Contest | complete a round, hero moment, result card and replay |
| Percent Battle | opponent, spot cooldown, score calls and final celebration work |
| Rack Rush | challenge and Speed 100 timers, scoring, result and ranking work |
| NBA DNA | upload, animated comparison and result poster work |
| Recording | final shots, celebration, result and mixed audio are present |
| Replay/reset | second run does not retain flowers, scores, hot hand or stale scene state |

## Rollback Rule

Before each ownership migration, keep a named backup tag. Each migration is one focused commit. A failed migration must be reversible without reverting unrelated game content.
