// ─── src/obs/metrics.ts ───────────────────────────────────────────────────────
// Prometheus telemetry metrics using prom-client.
// Reference: backend-implementation-plan Step 7.
// ─────────────────────────────────────────────────────────────────────────────

import client from "prom-client";

// Initialize default Node.js runtime metrics (event loop lag, memory, gc)
client.collectDefaultMetrics({ prefix: "mp_" });

export const metricsRegistry = client.register;

// ─── Counters ────────────────────────────────────────────────────────────────

export const roomsCreatedCounter = new client.Counter({
  name: "mp_rooms_created_total",
  help: "Total number of game rooms created",
});

export const matchesCompletedCounter = new client.Counter({
  name: "mp_matches_completed_total",
  help: "Total number of matches completed to final standings",
});

export const kicksCounter = new client.Counter({
  name: "mp_kicks_total",
  help: "Total number of player kicks executed by hosts",
});

export const rateLimitDropsCounter = new client.Counter({
  name: "mp_rate_limit_drops_total",
  help: "Total number of actions dropped by rate limiters",
  labelNames: ["type"], // 'join', 'creation', 'input'
});

export const inputsCounter = new client.Counter({
  name: "mp_inputs_total",
  help: "Total number of player input packets processed",
});

// ─── Gauges ──────────────────────────────────────────────────────────────────

export const activeRoomsGauge = new client.Gauge({
  name: "mp_active_rooms",
  help: "Current number of active game rooms",
});

export const activePlayersGauge = new client.Gauge({
  name: "mp_active_players",
  help: "Current number of connected human players across all rooms",
});

export const activeBotsGauge = new client.Gauge({
  name: "mp_active_bots",
  help: "Current number of active AI bots across all rooms",
});

// ─── Histograms ──────────────────────────────────────────────────────────────

export const simTickDurationHistogram = new client.Histogram({
  name: "mp_sim_tick_duration_ms",
  help: "Duration of the pure 30 Hz simulation tick in milliseconds (target: < 4ms)",
  buckets: [0.5, 1, 2, 4, 8, 16],
});

export const patchBytesHistogram = new client.Histogram({
  name: "mp_patch_bytes",
  help: "Size of room state patches sent to clients (target: < 600 bytes)",
  buckets: [100, 300, 600, 1200, 2400],
});

