# Mutator Party: Performance & Benchmark Report

This document records the empirical performance benchmarks, load test data, and balance tuning numbers for the Mutator Party backend as required by `backend-spec.md` (section 2.2) and `backend-implementation-plan.md` (Step 8).

---

## 1. Test Environment

- **Operating System**: Windows 11 (x64)
- **Node.js Version**: v22.18.0 (LTS)
- **Runtime**: TypeScript via `tsx` (ESM mode)
- **Simulation Frequency**: Fixed 30 Hz loop (`dt = 1/30` s = 33.33 ms budget)
- **Target Architecture**: 8 players per room, procedural arena, active collisions, bot AI

---

## 2. Load Test Results (Target N8: >= 100 concurrent rooms / vCPU)

Benchmark script executed: `scripts/loadtest.ts` across escalating concurrent room counts running full 8-bot authoritative simulations.

| Concurrent Rooms | Total Active Bots | Tick Time p50 (ms) | Tick Time p95 (ms) | Tick Time p99 (ms) | Per-Room Tick (ms) | Heap Used (MB) | Status (< 33.3ms) |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **10** | 80 | 0.438 | 1.913 | 5.031 | 0.0438 | 16.3 | ✅ PASS |
| **25** | 200 | 0.444 | 1.417 | 2.459 | 0.0177 | 20.6 | ✅ PASS |
| **50** | 400 | 0.732 | 2.415 | 3.346 | 0.0146 | 19.3 | ✅ PASS |
| **75** | 600 | 0.886 | 1.454 | 1.561 | 0.0118 | 16.5 | ✅ PASS |
| **100** | 800 | 2.085 | 3.041 | 3.764 | 0.0209 | 17.9 | ✅ **PASS (Target N8 Met)** |
| **125** | 1000 | 2.675 | 3.884 | 4.457 | 0.0214 | 22.9 | ✅ PASS |

### Analysis
- **Target N3 (< 4 ms tick time for 8 players)**: Exceeded by an order of magnitude. At 100 concurrent rooms, the *entire batch* of 100 rooms processes within **3.764 ms (p99)**, yielding an average execution time of **~0.021 ms per room**.
- **Target N8 (>= 100 rooms per vCPU)**: Fully validated. At 100 concurrent rooms (800 bots running pure step and AI), p99 tick time stays under 4 ms, leaving > 88% idle margin inside the 33.3 ms frame budget.
- **Memory Footprint**: Heap memory remains exceptionally lean (< 25 MB across 125 rooms) due to zero object allocations in hot simulation paths.

---

## 3. Round Length Balance Tuning (Target Step 8.2)

Evaluated via `apps/server/test/balance.test.ts` (30 deterministic rounds per mode with 8 bots, seeded, all rounds verified > 10 s):

| Mode | Format / Rules | Demo Benchmark | Current Server Average | Target Window | Outcome |
|:---|:---|:---:|:---:|:---:|:---:|
| **Crown Rush** | Hold to score (45 s cap) | 46.5 s | **45.0 s** | ~45 s | ✅ Met |
| **Brawl** | 1 Life Sudden Death | 11.8 s | **22.2 s** | > 20 s | ✅ 88% improvement over demo |
| **Brawl** | Standard Tournament (3 Lives) | - | **48.6 s** | 40 to 60 s | ✅ Met (Center of target) |
| **Bomb Tag** | Hot Potato Tag (75 s cap) | 9.8 s | **38.4 s** | 30 to 75 s | ✅ ~4x improvement over demo |

### Twist Pair Stability Matrix
Verified no pathological infinite loops or immediate round ends across extreme twist pairings:
- `low` gravity + `wind`: Duration > 10 s, stable physics.
- `heavy` gravity + `speed`: Duration > 10 s, reachability intact.
- `tiny` scale + `bounce`: Trampoline rebounds properly bounded.
- `giant` scale + `ice`: Low friction sliding bounded within island edges.
- `flap` multi-jump + `crumble`: Fall mechanics handle mid-air players cleanly.

