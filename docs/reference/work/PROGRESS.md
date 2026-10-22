# Mutator Party — Implementation Progress & Roadmap

> **Last Updated**: October 2026  
> **Overall Status**:  
> - **Shared Engine (`packages/shared`)**: ✅ **100% Functional & Verified** (67/67 tests passing, clean TypeScript build; purity leak resolved and settings wired into sim).  
> - **Backend Server (`apps/server`)**: 🟢 **Step 3 Complete & Passing** (26/26 tests passing; `src/index.ts` bootstrap created, `/healthz` route mounted, lobby auth, room codes, and immediate empty disposal implemented).  
> - **Frontend Client (`apps/client`)**: ⚪ **0% Not Started** (Directory empty; awaits scaffold & mock server).  
> - **Audit & Gap Analysis**: 📋 Comprehensive breakdown and resolution log available in [`gaps.md`](./gaps.md).

---

## 🎯 High-Level Overview

Mutator Party is an authoritative multiplayer 2D party brawler (2–12 players per room) built with:
- **`packages/shared`**: Pure TypeScript game rules, deterministic simulation, arena generator, settings schemas, 13 twists, 3 modes, 4 power-up items, scoring/respawn, and bot AI (zero external engine dependencies).
- **`apps/server`**: Authoritative game server using Node 20+, Colyseus 0.18.x, Zod 3.23.x, and Pino.
- **`apps/client`**: Frontend client using Phaser + DOM/Preact for UI & menus.

---

## 📊 Current Milestone & Step Progress

| Step | Scope | Target Package | Status | Completion | Notes |
|---|---|---|:---:|:---:|---|
| **Step 1** | Repo, Tooling & Shared Foundation | Monorepo / `shared` | ✅ Complete | 100% | Constants, RNG, procedural arena, settings, themes done. Root `test` script now tests all workspaces. |
| **Step 2** | Fixed-Step Simulation Loop | `packages/shared` | ✅ Complete | 100% | Pure 30 Hz loop, physics, platforms, shove, collisions done. Respawn config & roundTime wired into `step()`. |
| **Step 3** | Server Skeleton & Lobby | `apps/server` | ✅ Complete | 100% | `src/index.ts` bootstrap, `/healthz` endpoint, `roomCode.ts`, `names.ts`, `GameRoom.ts` lobby auth, and disposal done. |
| **Step 4** | Match Flow & Phase Controller | `apps/server` | ⚪ Not Started | 0% | Phase machine (`phases.ts`), twist pickers (`pickers.ts`), input queue, `ackSeq` sync pending. |
| **Step 5** | Modes, Twists & Items | `packages/shared` | ✅ Complete | 100% | 3 modes, 13 twists, 4 items. `nextCrateId` purity leak fixed; `allowed` twists/items and `firstTouch` wired. |
| **Step 6** | Bots, Reconnect, AFK & Host Migration | `shared` / `server` | 🟡 In Progress | 40% | Bot AI done in shared with `botSkill` support. Server bot takeover, 30s `allowReconnection`, and AFK detection pending. |
| **Step 7** | Hardening & Observability | `apps/server` | ⚪ Not Started | 0% | Rate limiting, origin check, 1 KB cap, pino logger, Prometheus metrics pending. |
| **Step 8** | Balance Tuning & Load Test | All | ⚪ Not Started | 0% | Load testing script, bot round duration tuning, `bannedCombos` pending. |
| **Step 9** | Scale-out & Multi-process | `apps/server` | ⚪ Not Started | 0% | Redis presence and multi-instance scaling. |
| **Client** | Frontend Client & UI | `apps/client` | ⚪ Not Started | 0% | Client scaffold, mock server, Preact UI, Phaser scene pending. |

---

## ✅ Completed Modules

### **1. Shared Foundation (`packages/shared/src/`)**

| File | Status | Description |
|---|:---:|---|
| [`constants.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/constants.ts) | ✅ Complete | Physics (`GRAV=1800`, `RUN=420`, `JUMP=720`), combat (`SHOVE_BASE=620`), bomb/crown timing, item parameters, 13 twist modifiers, input bitflags, and union types. |
| [`rng.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/rng.ts) | ✅ Complete | Deterministic PRNG (`mulberry32`), FNV-1a 32-bit `hashSeed`, round stream generators (`layout`, `spawn`, `power`, `events`), Fisher-Yates `shuffleArray`, and `pickRandom`. |
| [`arena.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/arena.ts) | ✅ Complete | Deterministic procedural arena generator with 40-attempt retry loop, jump reachability checks, symmetric mirroring, floor islands, spawn distribution, classic fallback, and `islandSizeToTiles` helper. |
| [`settings.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/settings.ts) | ✅ Complete | Zod schema for all 8 sections (`room`, `match`, `arena`, `modes`, `twists`, `respawn`, `items`, `theme`), auto-clamping utilities, `DEFAULTS`, and safe `sanitize(input, base)` merging function. |
| [`input.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/input.ts) | ✅ Complete | Compact 4-bit input bitmask pack/unpack (`encodeBits`, `decodeBits`, `hasInput`), and RFC 1982 wrap-aware 16-bit sequence comparison (`seqNewer`). |
| [`theme.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/theme.ts) | ✅ Complete | Definitions for all 7 themes (`sunny`, `neon`, `candy`, `frozen`, `desert`, `space`, `diwali`) with palette colors, `#1B1B3A` ink outline, and `linkedTwist` mapping. |
| [`types.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/types.ts) | ✅ Complete | Pure models for `SimState`, `PlayerState`, `BotMemory`, `RespawnConfig`, `ItemConfig`, `TileState`, `CrateState`, `BombState`, `CrownState`, and full `SimEvent` union. |
| [`index.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/index.ts) | ✅ Complete | Public library barrel export for all simulation, twist, item, mode, scoring, and bot modules. |

### **2. Simulation & Gameplay Systems (`packages/shared/src/sim/`)**

| File | Status | Description |
|---|:---:|---|
| [`sim/step.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/step.ts) | ✅ Complete | 30 Hz fixed-step loop `step(state, inputs, dt)`. Coordinates inputs, `botSkill`, reverse controls, item/shove combat, body collisions with `BOMB_PASS_KICK`, movement, platforms, mode logic, twists, crate pool filtering, respawn config, and events. |
| [`sim/movement.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/movement.ts) | ✅ Complete | Gravity 1800, run 420, jump 720, air-jump x0.88, coyote 0.09s, jump buffer 0.12s, kill zones (`y>630`, `x<-90`, `x>1050`), twists (`flap`, `speed`, `ice`, `low`, `heavy`, `wind`), and freeze/stun friction. |
| [`sim/platforms.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/platforms.ts) | ✅ Complete | One-way landing logic with island x-bounds, active crumbling-tile checks, and `bounce` twist trampoline rebound physics. |
| [`sim/shove.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/shove.ts) | ✅ Complete | Combat with scale-aware range/force, attacker lunge (`±140 px/s`), additive knockback, popup kick, stun, hit scaling, mega item multiplier, shield deflection, and combat callbacks. |
| [`sim/twists/index.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/twists/index.ts) | ✅ Complete | 13 twists, category exclusion validator (`validateTwistExclusion`), deterministic `pickMutators` (supporting `allowedTwists` filter), wind direction timer, and crumbling floor tile fall physics. |
| [`sim/modes/brawl.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/modes/brawl.ts) | ✅ Complete | Last One Standing win condition (accounting for pending respawns / remaining lives), elimination tracking, placement resolution, and configurable `roundTime`. |
| [`sim/modes/bomb.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/modes/bomb.ts) | ✅ Complete | Bomb Tag hot potato with dynamic fuse, 1.12x holder speed, pass with `BOMB_PASS_KICK` velocity adjustment, shield blocking, 260px radius explosion blast knockback, and configurable `roundTime`. |
| [`sim/modes/crown.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/modes/crown.ts) | ✅ Complete | Crown Rush with 1 pt/s hold score, 0.9x holder speed, steal on shove/touch with 1.0s victim protection, crown drop on KO/freeze with rebound velocity, offscreen recovery, and configurable `roundTime`. |
| [`sim/items.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/items.ts) | ✅ Complete | Power spots spawning, deterministic `nextCrateId` on state (no global leaks), `allowed` item pool filtering, `firstTouch` flag support, 3s beacon warning, Mega shove x2.6, Freeze burst 170px AoE, Swap position/velocity (460px), and Shield 5s. |
| [`sim/respawn.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/respawn.ts) | ✅ Complete | Respawn configurations (`off`, `lives`, `unlimited`), countdown timers, 1.8s shield grant, and platform spawn selection. |
| [`sim/scoring.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/sim/scoring.ts) | ✅ Complete | Placement points, clear-lead bonus (+2 pts for crown rush leader), and cumulative score calculation. |
| [`bots/bot.ts`](file:///c:/Users/satya/Desktop/mutator-party/packages/shared/src/bots/bot.ts) | ✅ Complete | Deterministic bot AI generating 4-bit bitmasks with edge safety lookahead, target evaluation, mode-specific goals, and skill scaling (`easy`, `normal`, `hard`) connected to `PlayerState` / `SimState`. |

### **3. Backend Server (`apps/server/src/`)**

| File | Status | Description |
|---|:---:|---|
| [`src/index.ts`](file:///c:/Users/satya/Desktop/mutator-party/apps/server/src/index.ts) | ✅ Complete | Server bootstrap with Colyseus `listen`, Express integration, `GameRoom` definition, and `GET /healthz` endpoint. |
| [`config.ts`](file:///c:/Users/satya/Desktop/mutator-party/apps/server/src/config.ts) | ✅ Complete | Zod environment configuration parsing (`PORT`, `ALLOWED_ORIGINS`, `TICK_HZ`, `PATCH_HZ`, `LOG_LEVEL`, etc.). |
| [`security/roomCode.ts`](file:///c:/Users/satya/Desktop/mutator-party/apps/server/src/security/roomCode.ts) | ✅ Complete | Crypto-random 5-character non-lookalike alphabet (`31` symbols) code generator, normalizer, and error responses. |
| [`security/names.ts`](file:///c:/Users/satya/Desktop/mutator-party/apps/server/src/security/names.ts) | ✅ Complete | Player name sanitization, length/character rules, anti-spam/URL/email/phone regex, reserved name list, and `#2`, `#3` de-duplication. |
| [`rooms/schema.ts`](file:///c:/Users/satya/Desktop/mutator-party/apps/server/src/rooms/schema.ts) | ✅ Complete | Colyseus schema (`RoomState`, `PlayerSchema`, `CrateSchema`, `BombSchema` with `fuse`, `CrownSchema`). |
| [`rooms/GameRoom.ts`](file:///c:/Users/satya/Desktop/mutator-party/apps/server/src/rooms/GameRoom.ts) | ✅ Step 3 Complete | Lobby lifecycle, options authentication, color assignment, ready flag toggle, settings update handler, and immediate disposal when human count drops to 0 (spec s7). |

---

## 🧪 Test Suite Status

Current test execution across packages:

- **`packages/shared`**: **10 / 10 test files passed (67 / 67 tests)**
  - `rng.test.ts` (5 tests)
  - `scoring.test.ts` (3 tests — including `winner_plus` and clear-lead bonus)
  - `arena.test.ts` (6 tests — including `islandSizeToTiles`)
  - `twists.test.ts` (7 tests — including `allowedTwists` filter)
  - `input.test.ts` (7 tests)
  - `settings.test.ts` (5 tests)
  - `bot.test.ts` (5 tests)
  - `items.test.ts` (9 tests — including `allowed` item filtering and deterministic crate IDs)
  - `modes.test.ts` (9 tests)
  - `sim.test.ts` (11 tests — including 60s determinism gate and perf benchmarks)

- **`apps/server`**: **6 / 6 test files passed (26 / 26 tests)**
  - `roomCode.test.ts` (5 tests)
  - `names.test.ts` (9 tests)
  - `schema.test.ts` (3 tests)
  - `config.test.ts` (2 tests)
  - `health.test.ts` (2 tests — verifying entrypoint & `/healthz` route)
  - `room.test.ts` (5 tests)

**Total Workspace Tests Passing**: **93 / 93 tests** (0 failing).
