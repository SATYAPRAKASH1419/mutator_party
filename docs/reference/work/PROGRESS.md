# Mutator Party — Implementation Progress & Roadmap

> **Current Status**: 
> - **Step 1 (Repo & Shared Foundation)**: ✅ **100% Complete & Passing**.
> - **Step 2 (Fixed-Step Simulation)**: ✅ **100% Complete & Passing**.
> - **Step 5 (Shared Modes, Twists, Items, Respawn, Scoring)**: ✅ **100% Complete & Passing**.
> - **Step 6 (Shared Deterministic Bot AI)**: ✅ **100% Complete & Passing**.
> - **Test Suite**: 10 test files, **62/62 tests passing** in Vitest (`packages/shared`), strict TypeScript build passes with zero errors.

---

## 🎯 High-Level Overview

Mutator Party is an authoritative multiplayer 2D party brawler (2–12 players per room) built with:
- **`packages/shared`**: Pure TypeScript game rules, deterministic simulation, arena generator, settings schemas, 13 twists, 3 modes, 4 power-up items, scoring/respawn, and bot AI (zero external engine dependencies).
- **`apps/server`**: Authoritative game server using Node 20+, Colyseus 0.17.x, Zod, and Pino.
- **`apps/client`**: Frontend client using Phaser + DOM/Preact for UI & menus.

---

## ✅ What We Have Completed in `packages/shared`

### **1. Shared Foundation (`packages/shared/src/`)**

| File | Status | Description |
|---|:---:|---|
| [`constants.ts`](./packages/shared/src/constants.ts) | ✅ Complete | Physics constants (`GRAV=1800`, `RUN=420`, `JUMP=720`), combat (`SHOVE_BASE=620`), bomb/crown timing, item parameters, 13 twist modifiers, input bitflags, and union types. |
| [`rng.ts`](./packages/shared/src/rng.ts) | ✅ Complete | Deterministic PRNG (`mulberry32`), FNV-1a 32-bit `hashSeed`, round stream generators (`layout`, `spawn`, `power`, `events`), Fisher-Yates `shuffleArray`, and `pickRandom`. |
| [`arena.ts`](./packages/shared/src/arena.ts) | ✅ Complete | Deterministic procedural arena generator with 40-attempt retry loop, jump reachability checks, symmetric mirroring, floor islands, spawn distribution, and classic fallback. |
| [`settings.ts`](./packages/shared/src/settings.ts) | ✅ Complete | Zod schema for all 8 sections (`room`, `match`, `arena`, `modes`, `twists`, `respawn`, `items`, `theme`), auto-clamping utilities, `DEFAULTS`, and safe `sanitize(input, base)` merging function. |
| [`input.ts`](./packages/shared/src/input.ts) | ✅ Complete | Compact 4-bit input bitmask pack/unpack (`encodeBits`, `decodeBits`, `hasInput`), and RFC 1982 wrap-aware 16-bit sequence comparison (`seqNewer`). |
| [`theme.ts`](./packages/shared/src/theme.ts) | ✅ Complete | Definitions for all 7 themes (`sunny`, `neon`, `candy`, `frozen`, `desert`, `space`, `diwali`) with palette colors, `#1B1B3A` ink outline, and `linkedTwist` mapping. |
| [`types.ts`](./packages/shared/src/types.ts) | ✅ Complete | Pure models for `SimState`, `PlayerState`, `BotMemory`, `TileState`, `CrateState`, `BombState`, `CrownState`, and full `SimEvent` union (`ko`, `shove_hit`, `bomb_pass`, `bomb_explode`, `crown_steal`, `crown_drop`, `crown_pickup`, `pickup`, `item_use`, `toast`, `crate_spawn`, `respawn`). |
| [`index.ts`](./packages/shared/src/index.ts) | ✅ Complete | Public library barrel export for all simulation, twist, item, mode, scoring, and bot modules. |

### **2. Fixed-Step Simulation & Gameplay Systems (`packages/shared/src/sim/`)**

| File | Status | Description |
|---|:---:|---|
| [`sim/step.ts`](./packages/shared/src/sim/step.ts) | ✅ Complete | Pure 30 Hz fixed-step loop `step(state, inputs, dt)`. Coordinates input decoding, bot AI execution, `reverse` twist swapping, item/shove combat, body collisions, movement integration, platform collisions, mode rules, twist updates, crate management, respawns, and event emission. |
| [`sim/movement.ts`](./packages/shared/src/sim/movement.ts) | ✅ Complete | Pure physics: gravity 1800, run 420, jump 720, air-jump x0.88, coyote time 0.09s, jump buffer 0.12s, kill zone checks (`y>630`, `x<-90`, `x>1050`), twists (`flap`, `speed`, `ice`, `low`, `heavy`, `wind`), and freeze/stun friction. |
| [`sim/platforms.ts`](./packages/shared/src/sim/platforms.ts) | ✅ Complete | One-way landing logic with island x-bounds, active crumbling-tile checks, and `bounce` twist trampoline rebound physics. |
| [`sim/shove.ts`](./packages/shared/src/sim/shove.ts) | ✅ Complete | Combat with scale-aware range/force, attacker lunge (`±140 px/s`), additive knockback, popup kick, stun, hit scaling, mega item multiplier, shield deflection, and combat callbacks. |
| [`sim/twists/index.ts`](./packages/shared/src/sim/twists/index.ts) | ✅ Complete | Catalog of all 13 twists, strict category exclusion validator (`validateTwistExclusion`), deterministic `pickMutators`, round setup hooks, wind direction timer, and crumbling floor tile fall physics. |
| [`sim/modes/brawl.ts`](./packages/shared/src/sim/modes/brawl.ts) | ✅ Complete | Last One Standing win condition, elimination tracking, and placement resolution. |
| [`sim/modes/bomb.ts`](./packages/shared/src/sim/modes/bomb.ts) | ✅ Complete | Bomb Tag hot potato with dynamic fuse $4 + 0.6 \times \text{alive}$, 1.12x holder speed, pass on shove or body contact with 0.7s cooldown, shield blocking, and 260px radius explosion blast knockback. |
| [`sim/modes/crown.ts`](./packages/shared/src/sim/modes/crown.ts) | ✅ Complete | Crown Rush with 1 pt/s hold score, 0.9x holder speed, steal on shove/touch with 1.0s victim protection, crown drop on KO/freeze with rebound velocity, and offscreen recovery. |
| [`sim/items.ts`](./packages/shared/src/sim/items.ts) | ✅ Complete | Power spots spawning, 3s beacon warning, first-touch claiming with same-tick lower-score tie break, Mega shove x2.6 force, Freeze burst 170px AoE, Swap position/velocity with nearest rival within 460px, and Shield 5s invulnerability. |
| [`sim/respawn.ts`](./packages/shared/src/sim/respawn.ts) | ✅ Complete | Respawn configurations (`off`, `lives`, `unlimited`), countdown timers, 1.8s shield grant, and platform spawn selection. |
| [`sim/scoring.ts`](./packages/shared/src/sim/scoring.ts) | ✅ Complete | Mode-specific round scoring, placement points, clear-lead bonus (+2 pts for crown rush leader), and cumulative score calculation. |

### **3. Deterministic Bot AI (`packages/shared/src/bots/`)**

| File | Status | Description |
|---|:---:|---|
| [`bots/bot.ts`](./packages/shared/src/bots/bot.ts) | ✅ Complete | Pure deterministic bot AI generating 4-bit bitmasks. Features edge safety lookahead (avoids walking off ledges without ground below), target evaluation, mode-specific goals (Brawl center retreat on damage, Bomb fleeing/chasing, Crown evading/pursuit, crate pickup pathing), and skill scaling (`easy`, `normal`, `hard`). |

---

### **Test Suite Summary (`packages/shared/test/`)**

- ✅ **`test/rng.test.ts`** (5 tests): PRNG determinism, FNV-1a hashing, independent streams, seeded shuffle.
- ✅ **`test/input.test.ts`** (7 tests): Bitfield pack/unpack, schema validation, sequence wrap-around across `65535` → `0`.
- ✅ **`test/settings.test.ts`** (5 tests): Default output, hostile input clamping (spec s13.3), partial updates, type fuzzing.
- ✅ **`test/arena.test.ts`** (5 tests): Layout determinism, round variation, symmetry mirroring, zero fallback across seeds.
- ✅ **`test/twists.test.ts`** (6 tests): Twist catalog, category exclusion validation, forced twist picking, scale setup, wind and crumble tile timers.
- ✅ **`test/modes.test.ts`** (9 tests): Brawl solo winner, Bomb fuse countdown, Bomb pass on contact, Bomb shield block, Bomb explosion blast, Crown hold accumulation, Crown steal & 1.0s protection, Crown drop on KO, Crown offscreen recovery.
- ✅ **`test/items.test.ts`** (7 tests): Beacon to live transition, first-touch priority & tie-break, Shield grant, Mega Shove 2.6x force, Freeze Burst AoE, Swap nearest rival, Shield knockback/stun deflection.
- ✅ **`test/scoring.test.ts`** (2 tests): Brawl placement points and Crown Rush ranking with clear-lead bonus (+2).
- ✅ **`test/bot.test.ts`** (5 tests): Ground check, bitmask determinism, edge safety prevention, Bomb fleeing behavior, Crown pursuit.
- ✅ **`test/sim.test.ts`** (11 tests): 60s human scripted determinism gate, 15s bot-driven twist determinism gate, jump apex (~144px), air jump (~111px), horizontal air distance (~336px), shove cooldown & scaling, kill zone elimination, perf (<2ms per 12-player tick).

**Total: 62 / 62 tests passing.**

---

## ⏳ Next Steps: Backend Server Skeleton (`apps/server`)

With all core game rules, deterministic simulation, modes, twists, items, respawn, scoring, and bot AI completed in `packages/shared`, we are ready to proceed with:

- **Step 3 (Server Skeleton)**: Colyseus 0.17 server setup, `roomCode.ts` (5-character non-lookalike alphabet), `GameRoom.ts` lobby lifecycle and client join validation.
- **Step 4 (Match Flow & Phase Controller)**: Phase machine (`lobby` → `intro` → `pick` → `play` → `results` → `final`), Colyseus schema synchronization mirroring `SimState`.
