# Mutator Party — Comprehensive Audit & Gap Analysis (`gaps.md`)

> **Updated**: October 2026  
> **Scope**: Comparison of `mutator-party-spec.md` (product spec), `backend-spec.md`, `backend-implementation-plan.md`, `frontend-spec.md`, `frontend-implementation-plan.md`, and the reference demo `Mutator Party 2 (demo).html` against current source code in `packages/shared`, `apps/server`, and `apps/client`.

---

## Executive Summary

| Subsystem | Planned Status | Current Implementation Status | Health | Key Blockers / Next Steps |
|---|---|---|:---:|---|
| **Repository & Tooling** | Monorepo CI, unified test & build | Root `package.json` tests all packages via `pnpm -r test`; `zod@^4.6.7` and Colyseus 0.18.x aligned | ✅ Healthy | All 93/93 tests passing cleanly across workspace |
| **`packages/shared`** | 100% complete deterministic rules & sim | **Locked & Complete**: 10/10 test files, 67/67 tests passing. Determinism verified, all settings wired | ✅ Locked | Ready for Server Step 4 and Client consumption |
| **`apps/server`** | Steps 3 & 4 (Skeleton, Lobby, Phases, Sim Loop) | **Step 3 Complete**: Entrypoint `src/index.ts`, `/healthz`, `GameRoom` lobby, 26/26 tests passing | ⚠️ In Progress | Step 4: Sim loop (30 Hz), input handler, phase controller, pickers |
| **`apps/client`** | Steps 1–4 (Scaffold, Tokens, Mock Server, Landing) | 0% complete (Empty directory, no `package.json`) | ❌ Unstarted | Needs scaffolding, Phaser 4 setup, mock server, and UI tokens |

---

## 1. `packages/shared` — Status & Audit (Locked & Verified)

`packages/shared` has been audited, patched, and locked down with 100% test coverage (67/67 unit tests). All determinism leaks, rule disconnects, and spec mismatches have been resolved:

### 1.1 Correctness & Determinism Fixes [ALL RESOLVED]

1. **Determinism & Purity Leak: Mutable Global `nextCrateId` [RESOLVED]**
   - **Location**: [`packages/shared/src/sim/items.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/items.ts)
   - **Fix**: Removed module-level `let nextCrateId = 1`. Crate IDs are now stored and incremented deterministically on `SimState.nextCrateId`, adhering strictly to **Rule R2** (pure state simulation).

2. **Respawn Config Disconnect in `step()` [RESOLVED]**
   - **Location**: [`packages/shared/src/sim/step.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/step.ts)
   - **Fix**: Added `respawnConfig?: RespawnConfig` to `SimState`. `queueRespawn` and `stepRespawns` now faithfully honor `respawn.mode` (`off`, `lives`, `unlimited`), `respawn.where`, `delaySec`, and `shieldSec`.

3. **Brawl Round End Condition Ignores Respawn / Lives [RESOLVED]**
   - **Location**: [`packages/shared/src/sim/modes/brawl.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/modes/brawl.ts)
   - **Fix**: `stepBrawl` checks `player.lives > 0` and pending respawns (`player.respawnTimer > 0`) before declaring round end when only one player is actively alive.

4. **Hardcoded Mode Round Timers [RESOLVED]**
   - **Location**: [`packages/shared/src/sim/modes/brawl.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/modes/brawl.ts), [`bomb.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/modes/bomb.ts), [`crown.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/modes/crown.ts)
   - **Fix**: `initBrawl`, `initBomb`, and `initCrown` now accept an optional `roundTime?: number` parameter, honoring host room configuration.

5. **Twist Selection Ignores `twists.allowed` [RESOLVED]**
   - **Location**: [`packages/shared/src/sim/twists/index.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/twists/index.ts)
   - **Fix**: `pickMutators(n, forced, rng, allowedTwists)` filters twist sampling by the host's `settings.twists.allowed` list.

6. **Power-Up Items Ignore `items.allowed` and `items.firstTouch` [RESOLVED]**
   - **Location**: [`packages/shared/src/sim/items.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/items.ts)
   - **Fix**: `stepCrates` filters spawned items by `allowedItems`. `handleCratePickups` respects `firstTouch` (random assignment among overlappers when false, lowest-score tie-breaking when true).

7. **Bot Skill Setting Ignored by `step()` [RESOLVED]**
   - **Location**: [`packages/shared/src/sim/step.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/step.ts), [`bots/bot.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/bots/bot.ts)
   - **Fix**: `state.botSkill` is stored on `SimState` and passed into `computeBotInput`, modulating bot reaction delays and mistake probabilities (`easy`, `normal`, `hard`).

8. **Unused `BOMB_PASS_KICK` Constant [RESOLVED]**
   - **Location**: [`packages/shared/src/sim/step.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/step.ts)
   - **Fix**: Body contact bomb passes now apply `BOMB_PASS_KICK = 260` impulse to both players.

9. **Scoring Engine Incomplete [RESOLVED]**
   - **Location**: [`packages/shared/src/sim/scoring.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/scoring.ts)
   - **Fix**: `calculateRoundScores` supports `winner_plus` and clear-lead Crown bonuses with deterministic tie-breaking.

10. **Crown Mechanics Semantic Alignment [RESOLVED]**
    - Instant steal on contact shove verified as conforming to Backend Spec F7 (`stealCrown(state, atk, target)`).

11. **Missing Utility to Map `islandSize` to `islandTiles` [RESOLVED]**
    - **Location**: [`packages/shared/src/arena.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/arena.ts)
    - **Fix**: Exported `islandSizeToTiles(size: 'S' | 'M' | 'L'): number` (`'S' => 4`, `'M' => 6`, `'L' => 8`).

---

## 2. `apps/server` — Gaps, Bugs & Spec Mismatches

### 2.1 Completed in Step 3
- [x] **Bootstrap Entry Point (`src/index.ts`)**: HTTP server, Colyseus WebSocket transport, `GameRoom` registration, and clean shutdown handling.
- [x] **Health Check Endpoint (`/healthz`)**: Mounted on express app returning `{ ok: true, rooms: 0, uptime: ... }` with 200 OK.
- [x] **Room Disposal Rule**: Conforms to spec s7; rooms with 0 humans disconnect/dispose immediately.
- [x] **Schema Alignment**: `BombSchema` updated with `fuse: number` matching `SimState.bomb.fuse`.

### 2.2 Pending Step 4 (Game Loop & Match Flow)
1. **Simulation Loop in `GameRoom`**
   - **Requirement**: Backend spec s2.2 (N1: 30 Hz fixed sim tick), s3.
   - **Action**: Implement `this.setSimulationInterval((dt) => this.tick(dt), 1000 / 30)`. Execute `step()` from `@mutator-party/shared`.

2. **Client Input Processing Pipeline (`inputQueue.ts`)**
   - **Requirement**: Backend spec s3, s4 (`input { seq, bits }`), Plan s3.3.
   - **Action**: Message handler for `"input"`, wrap-aware sequence validation (`seqNewer`), 60 msg/s rate limiter per client, and `ackSeq` echo in `PlayerSchema`.

3. **Phase Controller Machine (`phases.ts`)**
   - **Requirement**: Backend spec s3, Plan s3.5 & s4 (Step 4 task 3).
   - **Action**: Implement `PhaseController` driving `lobby` → `intro` (4s) → `pick` (10s) → `play` → `results` (6s) → `intro` ... → `final`.

4. **Twist Selection Pickers (`pickers.ts`)**
   - **Requirement**: Backend spec s3.
   - **Action**: Implement `pickNextPicker(mode, state, roundIndex, rng)` supporting `last_place`, `vote`, `host`, `random`, and `round_robin`.

5. **Match Control Handlers**
   - Handlers for `"start"`, `"pick"`, `"emote"`, `"kick"`, and `"rematch"`.

### 2.3 Pending Step 6 & 7 (Presence, Reconnection, Security & Observability)
1. **Reconnection & AFK Bot Takeover**
   - Backend spec F9, F10: `await this.allowReconnection(client, 30)` to preserve slot/score, pilot disconnected player via shared bot. Demote AFK players after 30s.
2. **Prometheus Metrics (`/metrics`)**
   - Mount Prometheus scrape endpoint reporting active rooms, CCU, tick duration, and packet counts.
3. **Security & Abuse Protection**
   - Token bucket rate limiting (`rateLimit.ts`), origin validation (`origin.ts`), 1 KB message payload cap, and bad message dropping.

---

## 3. `apps/client` — Complete Absence

`apps/client` currently contains zero source files or configurations. All items from `frontend-spec.md` and `frontend-implementation-plan.md` remain to be created:

1. **Build & Tooling**: No `package.json`, `vite.config.ts`, `tsconfig.json`, or `@shared` alias.
2. **Mock Server**: `mockServer.ts` (specified in Step 1–4 to decouple frontend development from backend completion) is unbuilt.
3. **Design System & CSS**: No `tokens.css`, Bagel Fat One / Nunito font integration, or UI components (Pills, Panels, Steppers, Sliders).
4. **Phaser 4 Engine**: No `GameScene`, `ArenaView`, `PlayerView`, effects (particles, hit-stop, screen shake), or Lights Out overlay.
5. **DOM UI Screens**: Landing (`/`), Join link (`/r/:code`), Create Room, Lobby, HUD, Pick Twist overlay, Results, and Final screens.
6. **Netcode & Client Prediction**: No input sender (60 Hz cap + 100 ms heartbeat), client prediction buffer, snapshot interpolation (100 ms render delay), or server event listeners.

---

## 4. Tooling, Dependencies & Monorepo Gaps

1. **Root `package.json` Test Script [RESOLVED]**
   - Updated `"test": "pnpm -r test"`. Runs Vitest across all workspace packages in one command.

2. **Missing `vitest.workspace.ts`**
   - Optional convenience; individual workspace packages run cleanly via `pnpm -r test`.

3. **Zod Version Standardization [RESOLVED]**
   - Standardized on `zod@^4.6.7` across `packages/shared` and `apps/server`.
   - *Technical Note*: Colyseus 0.18.x includes `@colyseus/auth@0.18.4`, which requires Zod 4's top-level `z.email()` function (calling this on Zod 3 throws `TypeError: z.email is not a function`). `packages/shared/src/settings.ts` was updated with Zod 4-compatible default schemas (`.default(DEFAULTS.section)`).

4. **Colyseus Version Divergence [RESOLVED]**
   - Formally aligned on **Colyseus 0.18.x LTS** across the repository (using `@colyseus/tools`, `@colyseus/ws-transport`, and `@colyseus/schema v5`). All specification and implementation plan documents have been updated to target Colyseus 0.18.x.

---

## 5. Specification & Documentation Inconsistencies

1. **Message Protocol: `vote` vs `pick`**
   - `mutator-party-spec.md` s9.3 mentions a `vote` message.
   - `backend-spec.md` s4 and `backend-implementation-plan.md` s5 consolidate both into `pick { index: 0..2 }`.
   - *Resolution*: Follow backend-spec; use `pick` for both single picker and group voting.

2. **Screen Transitions: Direct Messages vs Event Types**
   - `mutator-party-spec.md` mentions `round:end` and `match:end` messages.
   - `backend-spec.md` s4 specifies generic `event { type: string, ... }`.
   - *Resolution*: Use `event { type: 'round_end', ranking, points }` and `event { type: 'match_end', standings }`.

3. **Pick Countdown Timer**
   - Demo screenshot shows 7s countdown; `backend-spec.md` mandates 10s.
   - *Resolution*: Adopt 10s (with 8s for vote mode) per backend spec.

4. **AFK Spectator Escalation**
   - Product spec s3.3 requires converting a player to a spectator after 2 consecutive AFK rounds.
   - Backend spec F10 stops at bot takeover.
   - *Resolution*: Implement bot takeover at 30s AFK, then demote to spectator after 2 missed rounds.

---

## 6. Actionable Remediation Checklist & Priority Matrix

### Priority 0: Immediate Fixes (Unblocking & Correctness)
- [x] **Fix `nextCrateId` in `items.ts`**: Moved crate ID tracking into `SimState.nextCrateId` to guarantee simulation determinism.
- [x] **Create `apps/server/src/index.ts`**: Bootstrapped HTTP server, Colyseus transport, registered `GameRoom`, and mounted `/healthz`.
- [x] **Fix root `package.json`**: Updated `"test"` script to run tests across all workspaces (`pnpm -r test`).
- [x] **Align Zod versions**: Standardized on `zod@^4.6.7` across `packages/shared` and `apps/server` (resolving `@colyseus/auth` requirements).
- [x] **Clarify Colyseus version**: Formally aligned on Colyseus 0.18.x LTS (with `@colyseus/tools`, `@colyseus/schema v5`) and updated documentation.

### Priority 1: `packages/shared` Wiring & Polish (Locked)
- [x] **Connect `RespawnConfig` in `step()`**: Stored respawn configuration in `SimState` so `lives`, `unlimited`, `where`, and `delaySec` take effect.
- [x] **Fix `stepBrawl` round-end check**: Accounts for players with pending respawns/lives before ending round.
- [x] **Pass `roundTime` into mode initializers**: Honors host setting `match.roundTime`.
- [x] **Pass `allowed` twists into `pickMutators`**: Honors `settings.twists.allowed`.
- [x] **Pass `allowed` items into `stepCrates`**: Honors `settings.items.allowed`.
- [x] **Support `firstTouch` in `handleCratePickups`**: Honors `settings.items.firstTouch`.
- [x] **Connect `botSkill` in `computeBotInput`**: Honors `settings.match.botSkill`.
- [x] **Wire `BOMB_PASS_KICK`**: Applies knockback kick on contact pass.
- [x] **Add `islandSizeToTiles` helper**: Exported mapping from `'S' | 'M' | 'L'` to `4 | 6 | 8`.
- [x] **Complete Scoring Engine**: Supported `winner_plus` and clear-lead bonuses with deterministic tie-breaking.

### Priority 2: `apps/server` Game Loop & Match Flow (Step 4)
- [ ] **Implement `PhaseController` (`phases.ts`)**: Drive `lobby` → `intro` → `pick` → `play` → `results` → `final`.
- [ ] **Set simulation interval in `GameRoom`**: Run `step()` at 30 Hz.
- [ ] **Implement `inputQueue.ts`**: Handle client `input` messages, edge detection, rate limiting, and `ackSeq`.
- [ ] **Implement twist pickers (`pickers.ts`)**: Support `last_place`, `vote`, `host`, `random`, and `round_robin`.
- [ ] **Implement Reconnection & AFK**: Wire `allowReconnection(client, 30)` and bot substitution.
- [ ] **Implement event broadcasting**: Drain `state.events` and broadcast to clients.

### Priority 3: `apps/client` Bootstrapping
- [ ] **Scaffold `apps/client`**: Setup Vite, TypeScript, Preact, Phaser, and workspace links.
- [ ] **Build `mockServer.ts`**: Enable local headless play against shared bots before server completion.
- [ ] **Implement Design System Tokens**: Set up `tokens.css` and base UI components.
