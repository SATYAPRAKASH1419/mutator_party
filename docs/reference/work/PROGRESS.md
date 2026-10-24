# Mutator Party — Implementation Progress & Roadmap

> **Last Updated**: October 2026  
> **Overall Status**:  
> - **Shared Engine (`packages/shared`)**: ✅ **100% Functional & Verified** (67/67 tests passing, clean TypeScript build).  
> - **Backend Server (`apps/server`)**: 🟢 **Steps 1–8 Complete & Verified** (89/89 tests passing, total monorepo 156/156 tests passing; hardened, rate-limited, observability wired, load tested to 100+ rooms/vCPU, balance tuned).  
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
| **Step 4** | Match Flow & Phase Controller | `apps/server` | ✅ Complete | 100% | Phase machine (`phases.ts`), twist pickers (`pickers.ts`), input queue (`inputQueue.ts`), and 30 Hz sim loop in `GameRoom.ts` complete & passing. |
| **Step 5** | Modes, Twists & Items | `packages/shared` | ✅ Complete | 100% | 3 modes, 13 twists, 4 items. `nextCrateId` purity leak fixed; `allowed` twists/items and `firstTouch` wired. |
| **Step 6** | Bots, Reconnect, AFK & Host Migration | `shared` / `server` | ✅ Complete | 100% | Bot AI in shared, server bot takeover on mid-round drop, 30s `allowReconnection`, AFK detection (15s warn / 30s bot takeover), host kick & blacklisting complete & passing. |
| **Step 7** | Hardening & Observability | `apps/server` | ✅ Complete | 100% | IP rate limiting (10 joins/min, 5 creations/min, 3 rooms max), Origin verification, 1 KB cap, profanity & leetspeak filter, structured Pino logging, Prometheus `/metrics`, Sentry hook, and abuse suite passing. |
| **Step 8** | Balance Tuning & Load Test | All | ✅ Complete | 100% | `scripts/loadtest.ts` proves Target N8 (100 rooms / 800 bots @ 3.76ms p99 tick time). 30-round balance simulations verify round length targets. Documented in `docs/perf.md`. |
| **Step 9** | Scale-out & Multi-process | `apps/server` | ⚪ Extension Point | Ready | Redis presence and multi-instance scaling extension points prepared. |
| **Client** | Frontend Client & UI | `apps/client` | ⚪ Not Started | 0% | Client scaffold, mock server, Preact UI, Phaser scene pending. |

---

## 🧪 Test Suite Status

Current test execution across workspaces: **156 / 156 tests passing (100% green)**

- **`packages/shared`**: **10 / 10 test files passed (67 / 67 tests)**
  - `rng.test.ts` (5 tests)
  - `scoring.test.ts` (3 tests)
  - `arena.test.ts` (6 tests)
  - `twists.test.ts` (7 tests)
  - `input.test.ts` (7 tests)
  - `settings.test.ts` (5 tests)
  - `bot.test.ts` (5 tests)
  - `items.test.ts` (9 tests)
  - `modes.test.ts` (9 tests)
  - `sim.test.ts` (11 tests — including 60s determinism gate and perf benchmarks)

- **`apps/server`**: **16 / 16 test files passed (89 / 89 tests)**
  - `roomCode.test.ts` (5 tests)
  - `names.test.ts` (9 tests)
  - `profanity.test.ts` (4 tests)
  - `origin.test.ts` (3 tests)
  - `rateLimit.test.ts` (4 tests)
  - `config.test.ts` (2 tests)
  - `schema.test.ts` (3 tests)
  - `health.test.ts` (2 tests)
  - `metrics.test.ts` (1 test)
  - `abuse.test.ts` (4 tests)
  - `inputQueue.test.ts` (5 tests)
  - `phases.test.ts` (6 tests)
  - `presence.test.ts` (5 tests)
  - `pickers.test.ts` (20 tests — including 10,000-draw category exclusion test gate)
  - `room.test.ts` (11 tests)
  - `balance.test.ts` (5 tests — 30-round balance simulations & twist pair matrix)
