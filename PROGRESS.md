# Mutator Party — Implementation Progress & Roadmap

> **Current Status**: 
> - **Step 1 (Repo & Shared Foundation)**: ✅ **100% Complete & Passing**.
> - **Step 2 (Fixed-Step Simulation)**: 🟡 **Core Implemented & Passing (31/31 Tests)**; [GAPS_AND_FIXES.md](./GAPS_AND_FIXES.md) audit ready for resolution before Step 3.
> - **Test Suite**: 5 test files, **31/31 tests passing** in Vitest (`packages/shared`).

---

## 🎯 High-Level Overview

Mutator Party is an authoritative multiplayer 2D party brawler (2–12 players per room) built with:
- **`packages/shared`**: Pure TypeScript game rules, deterministic simulation, arena generator, and settings schemas (zero external engine dependencies).
- **`apps/server`**: Authoritative game server using Node 20+, Colyseus 0.17.x, Zod, and Pino.
- **`apps/client`**: Frontend client using Phaser + DOM/Preact for UI & menus.

---

## ✅ What We Have Completed

### **Step 1: Shared Foundation (`packages/shared/src/`)**

| File | Status | Description |
|---|:---:|---|
| [`constants.ts`](./packages/shared/src/constants.ts) | ✅ Complete | Physics constants (`GRAV=1800`, `RUN=420`, `JUMP=720`), combat (`SHOVE_BASE=620`), mode round times, phase durations, input bitflags, and union types. |
| [`rng.ts`](./packages/shared/src/rng.ts) | ✅ Complete | Deterministic PRNG (`mulberry32`), FNV-1a 32-bit `hashSeed`, round stream generators (`layout`, `spawn`, `power`, `events`), Fisher-Yates `shuffleArray`, and `pickRandom`. |
| [`arena.ts`](./packages/shared/src/arena.ts) | ✅ Complete | Deterministic procedural arena generator with 40-attempt retry loop, jump reachability checks, symmetric mirroring, floor islands, spawn distribution, and classic fallback. |
| [`settings.ts`](./packages/shared/src/settings.ts) | ✅ Complete | Zod schema for all 8 sections (`room`, `match`, `arena`, `modes`, `twists`, `respawn`, `items`, `theme`), auto-clamping utilities, `DEFAULTS`, and safe `sanitize(input, base)` merging function. |
| [`input.ts`](./packages/shared/src/input.ts) | ✅ Complete | Compact 4-bit input bitmask pack/unpack (`encodeBits`, `decodeBits`, `hasInput`), and RFC 1982 wrap-aware 16-bit sequence comparison (`seqNewer`). |
| [`theme.ts`](./packages/shared/src/theme.ts) | ✅ Complete | Definitions for all 7 themes (`sunny`, `neon`, `candy`, `frozen`, `desert`, `space`, `diwali`) with palette colors, `#1B1B3A` ink outline, and `linkedTwist` mapping. |
| [`index.ts`](./packages/shared/src/index.ts) | ✅ Complete | Public library barrel export. |

### **Step 2: Fixed-Step Simulation (`packages/shared/src/sim/`)**

| File | Status | Description |
|---|:---:|---|
| [`types.ts`](./packages/shared/src/types.ts) | ✅ Complete | State models: `SimState`, `PlayerState`, `TileState`, `CrateState`, `BombState`, `CrownState`, and `SimEvent` (`ko`, `shove_hit`). |
| [`sim/movement.ts`](./packages/shared/src/sim/movement.ts) | ✅ Complete | Pure physics: gravity 1800, run 420, jump 720, air-jump x0.88, coyote time 0.09s, jump buffer 0.12s, kill zone checks (`y>630`, `x<-90`, `x>1050`), twists (`flap`, `speed`, `ice`). |
| [`sim/platforms.ts`](./packages/shared/src/sim/platforms.ts) | 🟡 Needs Polish | One-way landing logic ported from demo. Floor island X-bounds check and crumbling tile support to be finalized per [GAPS_AND_FIXES.md](./GAPS_AND_FIXES.md). |
| [`sim/shove.ts`](./packages/shared/src/sim/shove.ts) | 🟡 Needs Polish | Combat: range 62px × scale, cooldown 0.85s, knockback formula `(620 + 70×hits) × sqrt(scaleRatio)`, popup 260px/s, stun 0.22s. Attacker lunge to be added per [GAPS_AND_FIXES.md](./GAPS_AND_FIXES.md). |
| [`sim/step.ts`](./packages/shared/src/sim/step.ts) | ✅ Complete | Pure 30 Hz fixed-step loop `step(state, inputs, dt)`. Input decoding, `reverse` twist swapping for all players & bots, movement integration, platform collisions, shove checks, and event emission. |

### **Test Suite (`packages/shared/test/`)**

- ✅ **`test/rng.test.ts`** (5 tests): PRNG determinism, FNV-1a hashing, independent streams, seeded shuffle.
- ✅ **`test/input.test.ts`** (7 tests): Bitfield pack/unpack, schema validation, sequence wrap-around across `65535` → `0`.
- ✅ **`test/settings.test.ts`** (5 tests): Default output, hostile input clamping (spec s13.3), partial updates, type fuzzing.
- ✅ **`test/arena.test.ts`** (5 tests): Layout determinism, round variation, symmetry mirroring, zero fallback across seeds.
- ✅ **`test/sim.test.ts`** (9 tests): Determinism gate (60s, 8 players identical serialized hash), jump apex (~144px), air jump (~111px), shove cooldown & scaling, kill zone elimination, perf (<2ms per 12-player tick).

---

## 🛠️ Immediate Next Step: Pre-Step 3 Polish

Before starting Step 3 (Server Skeleton), apply the 4 fixes documented in [`GAPS_AND_FIXES.md`](./GAPS_AND_FIXES.md):
- [ ] **Fix 1**: Restrict floor collision to island X bounds in `platforms.ts`.
- [ ] **Fix 2**: Add attacker forward lunge (`±140 px/s`) and clear `target.grounded = false` in `shove.ts`.
- [ ] **Fix 3**: Re-export sim functions in `packages/shared/src/index.ts`.
- [ ] **Fix 4**: Add the horizontal air distance test (~336px) to `packages/shared/test/sim.test.ts`.

---

## ⏳ What Remains (Upcoming Roadmap)

According to [`backend-implementation-plan.md`](./docs/reference/backend-implementation-plan.md):

### **Step 3: Server Skeleton (`apps/server`)**
- [ ] Colyseus 0.17 server setup with Node HTTP and `GET /healthz`.
- [ ] `roomCode.ts`: 5-character room code generation from 31-character non-lookalike alphabet.
- [ ] `GameRoom.ts`: Room lifecycle, lobby state sync, client join validation, name profanity filter, color assignment, and host assignment.

---

### **Step 4: Settings & Match Flow (`apps/server`)**
- [ ] `settings:update` host-only handling with server-side validation and broadcast.
- [ ] `PhaseController`: Phase state machine (`lobby` → `intro` → `pick` → `play` → `results` → `final`).
- [ ] Mode rotation (`shuffle_bag`, `random`, `fixed`) and Theme rotation.
- [ ] Twist pickers (`last_place`, `vote`, `host`, `random`, `round_robin`).

---

### **Step 5: Modes, Twists & Items (`packages/shared/src/sim/`)**
- [ ] Game modes:
  - `brawl`: Last one standing with survival points.
  - `bomb`: Hot potato bomb passing with expanding fuse.
  - `crown`: Crown Rush with possession timer and steal protection.
- [ ] 13 Twist modifiers (`low`, `heavy`, `tiny`, `giant`, `lotto`, `reverse`, `ice`, `speed`, `flap`, `crumble`, `wind`, `dark`, `bounce`).
- [ ] 4 Power-up Items (`mega`, `freeze`, `swap`, `shield`) with first-touch power spot claim rule.

---

### **Step 6: Bots, Reconnection & AFK**
- [ ] Pure bot AI in `packages/shared/src/bots/` (shared with server and client mock).
- [ ] 30s reconnect window reserving player slots.
- [ ] AFK detection: warn at 15s, bot takeover at 30s.

---

### **Step 7: Hardening & Observability**
- [ ] Rate limiters (60 inputs/s, 10 joins/min).
- [ ] Pino structured logging and `/metrics` endpoint.
- [ ] Room drain & graceful server shutdown.

---

### **Step 8: Tuning & Load Testing**
- [ ] Verify capacity target: ≥ 100 concurrent rooms per vCPU.
- [ ] Tick duration verified < 4 ms for 12 players.

---

### **Frontend Development (`apps/client`)**
- [ ] Set up client repo (Phaser + Preact HUD/DOM).
- [ ] Connect client to shared prediction simulation and server protocol.
