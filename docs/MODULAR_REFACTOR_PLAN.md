# aiBA Modular Refactor Plan

## Goal

Reduce `index.html` to an application shell while preserving the current game, controls, visuals, timing and static deployment model.

This is a strangler migration, not a rewrite. Production remains on the legacy entry until the experimental entry passes the same flow matrix.

## Isolation

| Layer | Stable path | Experimental path | Rollback |
|---|---|---|---|
| Git | `main` | `refactor/modular-core-v2` in a separate worktree | delete worktree/branch |
| Runtime | `/index.html` | `/next/index.html` | keep legacy route |
| Deploy | production Vercel domain | branch Preview Deployment | promote nothing |
| Storage | existing `aiba_*` keys | `aiba_next_*` keys | clear next namespace only |
| Ranking | production records | disabled/mock/test-tagged records | no production cleanup needed |

## Phase 0: Freeze And Measure

**Deliverables**

- `backup-v1.94-before-modular-refactor` tag
- independent worktree and branch
- architecture map and this plan
- automated inventory of entry scripts, globals and inline line count

**Forbidden**

- no gameplay changes
- no version bump
- no production deployment

**Exit gate**

- existing `node scripts/check.js` passes unchanged
- production `index.html` has no content diff

## Phase 1: Experimental Shell And Runtime Bridge

**Deliverables**

- generated `/next/index.html` based on the production entry
- `src/core/runtime.js`
- explicit `AIBA.runtime` namespace with storage and event services
- experimental banner/debug metadata available only on `/next/`

**Runtime bridge v1**

- exposes metadata, namespaced storage, events and service registration
- does not own `G`, `scene`, `renderer`, camera or animation timing
- does not start a second app, camera stream, audio graph or render loop

**Exit gate**

- legacy and next entries both boot
- next storage writes do not alter existing settings
- next entry cannot submit production leaderboard data

## Phase 2: Rack Rush Ownership Migration

**Why first**

Rack Rush has its own timer, run record and ranking variant. It is the clearest complete mode boundary even though it still calls shared shot and rendering functions.

**Deliverables**

- `src/modes/rack-rush.js`
- lifecycle API: `enter`, `start`, `update`, `finish`, `exit`
- mode-owned timer, scoring, level progression and result-record construction
- compatibility adapter for shared renderer, shot and UI functions

**Forbidden**

- no shot-motion tuning
- no camera redesign
- no score/rule changes
- no visual redesign

**Exit gate**

- fixed-seed legacy/next runs create equivalent sequences and records
- challenge and Speed 100 complete normally
- second run resets all mode state

## Phase 3: Remaining Modes

Migrate one mode per commit:

1. contest: experimental flow migration complete and manually accepted; replay intentionally remains shared
2. percent battle: state, spots, opponent and results migrated; shot collision and hero camera intentionally remain shared
3. practice: start, finish and three-shot completion detection migrated; shared shot lifecycle remains core-owned
4. NBA DNA flow only if it still depends on the core shell

Do not create a universal mode abstraction until two real mode migrations prove the shared contract.

## Phase 4: Rendering And Game Loop

Move ownership only after modes use explicit contexts.

1. scene/court construction
2. player and ball factories
3. camera director
4. effects and progressive scenes
5. one authoritative game loop

The main loop remains the last large extraction because audio, vision, recording, camera and every mode meet there.

## UI Migration Checkpoint

- complete: shared panels, loading gate, home cover, mode information, difficulty/scene selection, pregame roster drawing/matchup panels, pause and return-home
- complete: route parity checks for all four modes and their return-home paths
- complete: renderer/camera foundations, adaptive quality, resize handling and base lights
- complete: pixel textures, basketball materials, full-court floor construction and active spot marker
- complete: indoor arena, spectators, advertising, hoops, nets, arena lights and jumbotron
- complete: outdoor presets, street crowds, rain, progressive flowers and beach sunset
- next: racks and gameplay props, player factories, shooting/camera/effects, then the main loop/input boundary
- keep player selection and NBA DNA as their existing standalone modules until the shared navigation flow no longer depends on inline globals

## Phase 5: Cutover

- run the full acceptance matrix on desktop and iPhone
- publish a Preview URL for side-by-side manual testing
- preserve `?engine=legacy` for at least one production release
- promote the modular entry only after no critical regression is found
- keep the last legacy deployment and backup tag available

## Commit Discipline

Each commit must be one of:

- inventory/checking
- move-only migration
- compatibility adapter
- cleanup after parity
- behavior change after migration

Never combine a move-only migration with gameplay tuning. Every commit runs `node scripts/check.js` and records which manual matrix rows were exercised.
