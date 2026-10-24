// ─── scripts/loadtest.ts ──────────────────────────────────────────────────────
// Load test script for Mutator Party Authoritative Game Server.
// Measures simulation loop tick latency (p50/p95/p99), CPU and memory usage
// across N concurrent rooms x 8 bots per room.
// Reference: backend-spec s2.2 (N8 >= 100 rooms/vCPU) & backend-implementation-plan Step 8.1.
// ─────────────────────────────────────────────────────────────────────────────

import {
  generateArena,
  step,
  TICK_HZ,
  type SimState,
  type PlayerState,
} from "../packages/shared/src/index.js";
import { performance } from "node:perf_hooks";

interface RoomInstance {
  id: string;
  state: SimState;
  dt: number;
}

function createSimRoom(index: number): RoomInstance {
  const arena = generateArena({
    seed: 1000 + index,
    round: 1,
    platformCount: 4,
    islandTiles: 6,
    symmetric: false,
    players: 8,
    powerSpots: 0,
  });

  const players: PlayerState[] = arena.spawns.slice(0, 8).map((sp, i) => ({
    id: `bot_${i + 1}`,
    x: sp.x,
    y: sp.y,
    vx: 0,
    vy: 0,
    facingRight: i % 2 === 0,
    grounded: true,
    airJumpsLeft: 1,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    shoveTimer: 0,
    stunTimer: 0,
    hitsTaken: 0,
    scale: 1.0,
    isOut: false,
    isBot: true,
    score: 0,
    lives: 3,
    botSkill: "normal",
  }));

  const state: SimState = {
    tick: 0,
    rng: { events: 1000 + index },
    players,
    island: arena.island,
    platforms: arena.platforms,
    tileStates: [],
    crates: [],
    mode: "brawl",
    timeLeft: 60,
    nextCrateId: 1,
    powerSpots: arena.powerSpots,
    respawnConfig: { mode: "lives", lives: 3, delaySec: 2, shieldSec: 1.8 },
    itemConfig: {
      allowed: ["mega", "freeze", "swap", "shield"],
      firstTouch: true,
      keepOnKO: false,
    },
    botSkill: "normal",
    events: [],
  };

  return { id: `room_${index}`, state, dt: 1 / TICK_HZ };
}

async function runLoadTest(roomCount: number, durationSeconds: number = 3) {
  console.log(`\n======================================================`);
  console.log(`Starting load test: ${roomCount} concurrent rooms (${roomCount * 8} bots)`);
  console.log(`Duration: ${durationSeconds}s @ 30 Hz fixed sim tick`);
  console.log(`======================================================`);

  const rooms: RoomInstance[] = [];
  for (let i = 0; i < roomCount; i++) {
    rooms.push(createSimRoom(i));
  }

  const tickTimes: number[] = [];
  const startCpu = process.cpuUsage();
  const startTime = performance.now();

  const totalTicksPerRoom = durationSeconds * TICK_HZ;

  for (let t = 0; t < totalTicksPerRoom; t++) {
    const tickStart = performance.now();
    for (const room of rooms) {
      step(room.state, new Map(), [], room.dt);
    }
    const elapsed = performance.now() - tickStart;
    tickTimes.push(elapsed);
  }

  const totalTimeMs = performance.now() - startTime;
  const cpuUsage = process.cpuUsage(startCpu);
  const memUsage = process.memoryUsage();

  tickTimes.sort((a, b) => a - b);
  const p50 = tickTimes[Math.floor(tickTimes.length * 0.5)]!;
  const p95 = tickTimes[Math.floor(tickTimes.length * 0.95)]!;
  const p99 = tickTimes[Math.floor(tickTimes.length * 0.99)]!;

  const cpuUserSec = cpuUsage.user / 1_000_000;
  const cpuSystemSec = cpuUsage.system / 1_000_000;
  const totalCpuSec = cpuUserSec + cpuSystemSec;
  const cpuPercent = ((totalCpuSec / (totalTimeMs / 1000)) * 100).toFixed(1);

  console.log(`Results for ${roomCount} rooms:`);
  console.log(`  - Tick Time (p50): ${p50.toFixed(3)} ms`);
  console.log(`  - Tick Time (p95): ${p95.toFixed(3)} ms`);
  console.log(`  - Tick Time (p99): ${p99.toFixed(3)} ms`);
  console.log(`  - Per-Room Tick: ${(p50 / roomCount).toFixed(4)} ms`);
  console.log(`  - Approx CPU Load: ${cpuPercent} %`);
  console.log(`  - Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  - Status: ${p99 < 33.3 ? "PASS (Under 33.3ms budget)" : "FAIL"}`);

  return { roomCount, p50: +p50.toFixed(3), p95: +p95.toFixed(3), p99: +p99.toFixed(3), cpuPercent, heapMb: +(memUsage.heapUsed / 1024 / 1024).toFixed(1) };
}

async function main() {
  const steps = [10, 25, 50, 75, 100, 125];
  const summary: any[] = [];

  for (const count of steps) {
    const res = await runLoadTest(count, 2);
    summary.push(res);
  }

  console.log("\n--- Final Load Summary ---");
  console.table(summary);
}

main().catch(console.error);

