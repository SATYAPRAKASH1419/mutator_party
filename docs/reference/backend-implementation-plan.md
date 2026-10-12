# Mutator Party: Backend Implementation Plan

Companion to `backend-spec.md` (the contract) and the product spec `mutator-party-spec` (design intent, sections 3 to 13). This plan turns the spec into concrete work: modules, interfaces, task lists, tests and exit gates. Where this plan and `backend-spec.md` disagree, `backend-spec.md` wins; open conflicts are listed in section 12.

---

## 1. Goals and constraints (recap)

- Authoritative multiplayer server, 2 to 12 players per room, ~60 s rounds, 30 Hz fixed sim, 20 Hz patches.
- Stack is fixed: TypeScript strict, Node 20+ LTS, Colyseus 0.17.x, Zod, pnpm workspaces, Vitest, Playwright, pino.
- Hard rules:
  - **R1** `packages/shared` imports nothing from Colyseus, Node APIs or Phaser.
  - **R2** `step(state, inputs, dt) -> state` is pure, `dt = 1/30`, no `Date.now()`, no `Math.random()`; randomness comes from a seeded RNG stored in state.
- Do not start a step until the previous step's acceptance tests pass. Commit after each step.
- Do not guess Colyseus 0.17 APIs; read https://docs.colyseus.io before each integration task.

### Targets to prove with tests (from spec section 2.2)

| ID | Target | Proven in |
|---|---|---|
| N1/N2 | 30 Hz tick, 20 to 30 Hz patch | Step 3 + Step 7 metrics |
| N3 | < 4 ms tick, 8 players + bots | Step 2 benchmark, Step 8 |
| N4 | input to effect < 100 ms same region | Step 8 / e2e |
| N5 | input payload <= 8 bytes | Step 1 + Step 3 test |
| N6 | patch < 600 bytes, full room | Step 3 + Step 7 metrics |
| N7 | cold join to playing < 2 s | Step 4 e2e |
| N8 | >= 100 rooms per vCPU | Step 8.1 load test |
| N9 | restart does not corrupt other rooms | Step 7 drain test |

---

## 2. Repository layout

```text
mutator-party/
  package.json  pnpm-workspace.yaml  tsconfig.base.json  eslint config  vitest.workspace.ts
  packages/shared/
    src/
      constants.ts        physics + rule numbers (spec s6, product 13.4)
      rng.ts              mulberry32, hashSeed, named streams
      arena.ts            TS port of arena.js (unchanged logic)
      settings.ts         Zod schema + defaults + sanitize (port of settings.js)
      input.ts            bitfield helpers, seq compare
      types.ts            SimState, PlayerState, Phase, Events, message types
      sim/
        step.ts           pure step()
        movement.ts platforms.ts shove.ts
        modes/ brawl.ts bomb.ts crown.ts
        twists/ index.ts (13 twists + category rule)
        items.ts          4 items, power spots, first touch
        respawn.ts scoring.ts
      bots/ bot.ts        input-producing AI (shared so client mock reuses it)
      themes.ts           7 theme objects (colors, linkedTwist)
    test/
  apps/server/
    src/
      index.ts            bootstrap, HTTP routes (/healthz, /metrics)
      config.ts           env parsing (spec s9)
      rooms/GameRoom.ts   Colyseus room
      rooms/schema.ts     Colyseus Schema classes
      rooms/phases.ts     phase machine + timers
      rooms/lobby.ts      host, ready, join validation
      rooms/inputQueue.ts latest-input-per-player
      rooms/pickers.ts    twist picker strategies
      rooms/presence.ts   AFK, reconnect, bot takeover, host migration
      security/           rateLimit.ts origin.ts names.ts profanity.ts roomCode.ts
      obs/                logger.ts metrics.ts sentry.ts
    test/
  apps/client/            (separate task, see frontend plan)
  docs/perf.md            written in Step 8
```

Notes:
- Put bots in `packages/shared` so the client mock server (frontend spec s7) can run the same AI. They still run only on the server in production.
- Theme data lives in shared because the client `ThemeManager` imports it (frontend spec s3) and `round:start` only sends `themeId`.

---

## 3. Cross-cutting design decisions

### 3.1 State split: schema vs. simulation state
The sim works on a plain `SimState` object (pure, serializable, snapshot-able). The Colyseus `RoomState` schema is a thin mirror written once per tick after `step()` (copy changed fields only so Colyseus diffs stay small). Never let the sim touch schema objects. This keeps R1/R2 and makes headless tests, client prediction and the mock server trivial.

### 3.2 Schema fields (keep small, spec s3)
`phase, round, mode, twists[], themeId, timeLeft, players[] (id, name, color, x, y, vx, vy, flags, score, lives, item), bomb, crown, crates[], arena{seed, settingsHash}`.
- Quantize: positions to int px (Int16), velocities to Int16, `timeLeft` in 0.1 s steps, flags as a single bitfield (grounded, stunned, frozen, shielded, scale-class, hasBomb, hasCrown, isBot, connected, host, ready, out).
- Add per-player damage hits count (needed for knockback and the % display) as Uint8.
- Use `@view` / filtering only if needed later; not required for MVP.
- Budget check: 12 players x ~16 bytes is well under 600 B; assert in a test that a worst-case patch stays below N6.

### 3.3 Input pipeline
- Client message `input {seq, bits}` (bits: left 1, right 2, jump 4, shove 8). Zod: `seq` uint16 wrap-aware, `bits` 0..15.
- `inputQueue` stores only the latest accepted input per player; drops `seq` older than last (wrap-aware compare).
- Each tick: read latest bits per player, edge-detect jump/shove (jump buffer 0.12 s and coyote 0.09 s live inside the sim from the demo), call `step`.
- Server echoes the last processed `seq` per player in state (`ackSeq` Uint16) so the client can reconcile (required by frontend spec s4; add to schema player fields).
- Rate limit 60 `input`/s per client; excess dropped and counted.

### 3.4 Seeds and streams
`roomSeed` random at creation (crypto RNG, allowed outside sim). `roundSeed = hashSeed(roomSeed, roundNumber)`. Streams: `layout`, `spawn`, `power`, `events` via `hashSeed(seed, round, streamName[, attempt])` exactly as in `arena.js`. The sim RNG state (for twist events, bomb first holder, tie-break, crumble order, wind direction) is stored in `SimState.rng` as a single uint32 per stream.

### 3.5 Phases (spec s3)
`lobby -> intro (4 s) -> pick (10 s, only if the picker is human) -> play -> results (6 s) -> intro ... -> final`.
Product spec notes: pick card auto-select countdown; vote picker shows 3 cards for 8 s (product s4.2); intro reveals twists. Order inside a round loop: arena seed -> mode chosen -> (pick) -> intro/reveal -> play -> results. Because the twist picked in round N applies to round N+1 (demo behavior: "choose the twist for the next round"), the pick occurs at the end of results/start of next round; the phase machine must carry `pendingTwist` between rounds. Round 1 has no picker (no scores), twists are random seeded.

All transitions are server timers (Colyseus clock). No client clock is trusted.

---

## 4. Step-by-step plan

Each step: scope, tasks, files, tests, exit gate.

### Step 1: Repo and shared rules

**Scope:** monorepo, tooling, shared pure code, no Colyseus yet.

Tasks
1. `pnpm init` workspace, `tsconfig.base.json` (`strict`, ESM, `noUncheckedIndexedAccess`), ESLint + Prettier, Vitest workspace, a CI script (`pnpm lint && pnpm test && pnpm build`).
2. `constants.ts`: copy exact numbers from product 13.4 (see table in section 6 of this plan). Export as `as const`. Include derived arena constants (MAX_STEP_UP 130, MAX_GAP 220, jump apex 144, etc.) **computed from** GRAV/JUMP/MOVE with an assertion test so changing physics fails the build until arena constants are reviewed (product 5.2 warns of unreachable arenas).
3. `rng.ts`: port `mulberry32` and `hashSeed` unchanged (bit-for-bit identical output to `arena.js`; add golden-value tests).
4. `arena.ts`: convert `arena.js` to TS **without logic changes**. Keep the 40-attempt retry and classic fallback. Types for `Arena`, `Platform`, `Spawn`, `PowerSpot`.
5. `settings.ts`: Zod schema reproducing `settings.js` defaults and clamps. Use `z.preprocess`/custom coercion so out-of-range numbers **clamp** rather than reject, unknown enum values fall back to default, arrays are de-duplicated and filtered. Keep `version: 1`. Export `sanitize(input, base)` as a thin wrapper that mirrors the JS function so the two can be diffed in a test. Gaps vs. product spec to add (all optional with defaults, see section 12): `match.minPlayersToStart`, `respawn.where`, `room.allowKick`.
6. `input.ts`: `encodeBits/decodeBits`, `seqNewer(a, b)` wrap-aware.
7. `themes.ts`: 7 themes with the hex values from product 7.2 and `linkedTwist` (neon: dark, candy: bounce, frozen: ice, desert: wind, space: low, sunny/diwali: none). Note product 7.3 JSON uses `"linkedTwist": "dark"`, so use twist ids, not display names.

Tests
- **Arena suite (gate):** 8,400 combinations (platform count 2..8 x mirror/free x 3 island sizes x seeds x rounds): all reachable, deterministic, zero fallbacks, avg attempts ~1.01, different round gives different arena.
- Settings fuzz: hostile input from product 13.3 yields 12 players, 1 round, `roundTime 'auto'`, valid modes, 8 platforms, valid theme list, 1 life; `sanitize({})` equals defaults; property test with random JSON never throws.
- Cross-check test: TS `sanitize` vs. original `settings.js` on 10k random inputs must be deep-equal (keep `settings.js` as a dev-only fixture).
- Lint rule: forbid `Math.random`, `Date.now`, `process`, `colyseus` imports inside `packages/shared/src/sim`.

Exit gate: arena + settings tests pass, `pnpm build` ok.

---

### Step 2: Fixed-step simulation

**Scope:** port movement, platforms, shove, damage. No modes yet (a plain "survive" test mode).

Tasks
1. Define `SimState`: `tick, rng, players[], platforms/arena ref, tiles (crumble state), crates[], bomb?, crown?, events[]` (events emitted per step, drained by the room).
2. `movement.ts`: gravity 1800, run 420 with accel/braking (default grip; ice 420/110), jump 720, air jump x0.88, coyote 0.09 s, jump buffer 0.12 s, max fall 1300, scale-aware body size (36 px x scale), kill zone (y > 630, x < -90 or x > 1050).
3. `platforms.ts`: floor tiles (6 x 100 px at y=400) plus floating platforms from arena; one-way landing semantic as in demo (read the demo for exact collision rules; port, do not redesign).
4. `shove.ts`: cooldown 0.85 s, range 62 x scale + target half size, force `(620 + 70 x hitsTaken) x sqrt(scaleRatio)`, pop-up 260 px/s, stun 0.22 s, damage display = hits x 12 %. Keep numbers in constants so Step 8.2 tuning is a one-line change (start near base 420 there).
5. Event emission: `ko`, `shove_hit` (for client hit-stop timing; extra event beyond spec list, see section 12).
6. Benchmark script: time 10,000 steps with 12 players; log p50/p99.

Tests
- Determinism (gate): 8 scripted players, 60 s, two runs with the same seed + input script give byte-identical serialized state (hash compare each tick).
- Unit: jump apex ~144 px, double jump ~111 px extra, horizontal air distance ~336 px at full speed (validates arena constants).
- Unit: shove range/cooldown, knockback scales with hits, kill zone elimination.
- Perf: step time for 12 players under 1 ms on dev hardware (leave headroom for N3).

Exit gate: determinism test green, benchmark recorded in the PR description.

---

### Step 3: Server skeleton

**Scope:** Colyseus server, one `GameRoom`, lobby only.

Tasks
1. `config.ts`: parse env (spec s9) with Zod: `PORT 2567, ALLOWED_ORIGINS, TICK_HZ 30, PATCH_HZ 20, MAX_ROOMS_PER_IP 3, REDIS_URL, LOG_LEVEL info, SENTRY_DSN`.
2. `index.ts`: Colyseus server on Node HTTP, register `GameRoom`, `GET /healthz` (returns 200 + `{ok, rooms, uptime}`). Check the 0.17 docs for exact `Server`/`defineRoom` and transport APIs.
3. `roomCode.ts`: 5 chars from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (31 symbols), crypto random, retry on collision. Store `code` in room metadata; lookup by code via matchmaker query/presence key (confirm in docs). A wrong code, full room or locked room all return the **same** generic error `{code:'ROOM_UNAVAILABLE', message:'We could not find that room.'}`.
4. `GameRoom.onAuth/onJoin`: validate join options with Zod `{code?, name, color, playerId, token?}`.
   - Name: letters/digits/space/`_ - '`, 2 to 16 chars, trimmed, collapse repeated spaces rejected; block URLs, e-mails, phone numbers, reserved words (`you, host, admin, bot, system`, plus bot names); profanity filter (English + Hinglish list, leetspeak/look-alike normalization). De-dupe in-room with ` #2`, ` #3`.
   - Color index 0 to 7; if taken, assign next free (colors need not be unique but prefer unique).
   - `playerId` UUID; issue signed `sessionToken` (HMAC with server secret; payload `playerId + roomId`; used for reconnect, see Step 6).
5. Host assignment: first human to join. `ready` flag toggle. Lobby state in schema. `maxPlayers` enforced, spectators path if `room.spectators` (spectator = connected client without a player entity).
6. Room creation: `create` path validates settings via `sanitize`, applies defaults, sets `room.name` default `"{name}'s room"`.
7. Disposal: autoDispose off; custom timer disposes rooms empty for 60 s; rooms with no humans dispose immediately (spec s7).
8. Message plumbing: central `onMessage` wrapper that Zod-validates every message, drops and counts invalid ones (hook for Step 7 metrics), enforces 1 KB max.

Tests (Vitest + Colyseus test helpers/`@colyseus/testing`, verify availability for 0.17)
- Two clients join one room by code and see each other (gate), ready flags sync.
- Wrong code, full room, bad name: generic error, identical shape.
- Input payload size test (N5) and a patch size snapshot test.
- `/healthz` returns 200.

Exit gate: two test clients join; wrong code returns generic error.

---

### Step 4: Settings and match flow

Tasks
1. `settings:update` (host only): partial Zod parse -> deep-merge onto current -> `sanitize` -> assign -> broadcast `settings` (full validated object, `version: 1`). Non-hosts get `error {code:'NOT_HOST'}` and are counted.
2. Lock rules: reject (with `error SETTINGS_LOCKED`) while `phase === 'play'`; `theme.*` and `modes.twistPicker` stay editable in `lobby/results/pick/intro`? Spec: they may change **between rounds**; allow in `lobby` and `results` only. Changes to `maxPlayers` below current count are clamped up to current count.
3. Phase machine (`phases.ts`): states and durations as in 3.5. Use a single `PhaseController` with `enter(phase)`, `tick(dtMs)`, deterministic timers from the Colyseus clock.
4. Mode selection: `modes.pool` + `modes.order` (`shuffle_bag` keeps a bag that refills when empty; `random`; `fixed` uses `fixedList` cycling). Store bag in room (not sim) state.
5. Theme selection: `theme.mode` fixed/rotate/random(no immediate repeat)/custom(`perRound[round-1]`, fall back to rotate). If `twists.themeLinked`, add the theme's linked twist (counts toward the per-round twist budget and category rule).
6. Twist selection per round: `twists.perRound` 1/2/3/ramp (ramp 1,1,2,2,3 for rounds 1..5, then 3). Draw from `twists.allowed` with the **no two from same category** rule (categories: gravity: low/heavy; size: tiny/giant/lotto; controls: reverse/ice/speed; jumping: flap; world: crumble/wind/dark/bounce). If fewer categories are available than requested, reduce count.
7. Twist pickers (`pickers.ts`), each returns `{pickerId | 'vote' | 'server', cards: 3 twist ids}`:
   - `last_place`: lowest total score (tie: seeded random) gets 3 random cards; bot picks randomly after short delay.
   - `vote`: everyone sees the 3 cards for 8 s; `pick {index}` counts as a vote; most votes wins, ties random (seeded).
   - `host`: host picks each round.
   - `random`: server picks.
   - `round_robin`: players in join order, one pick each in turn.
   - Pick timeout 10 s -> auto-pick (seeded). Skip `pick` phase entirely if the picker is a bot or mode is `random`.
   - The picked twist plus remaining slots (if `perRound` > 1) are filled randomly under the category rule.
8. Round seeds: `roundSeed = hash(roomSeed, n)`; `layout: classic` uses fixed classic layout, `per_match` uses `hash(roomSeed, 0)` every round, `every_round` per round. Pass `platformCount`, `islandTiles` (S 4 / M 6 / L 8), `mirror`, `players = capacity incl. bots`, `powerSpots = items.enabled ? items.spots : 0`.
9. `round:start` broadcast per client `{ n, mode, twists, themeId, seed, slot, pickedBy? }` where `slot` is that player's spawn index (shuffled when `shuffleSpawns`).
10. Scoring (`scoring.ts`): `standard` placement points (demo: 8 players give 9/6/5/4/3/2/1/0 on round 1 in the screenshot, so read the demo for the exact table; extend generically for N players), `winner_plus` bonus for clear winner, `kills`. Tie-breaks defined for points, crown seconds and timer end (product 11.3 MUST).
11. Results/final payloads: send as `event {type:'round_end', ranking, points}` and `event {type:'match_end', standings}` (see section 12; the product spec lists `round:end`/`match:end` but backend-spec s4 does not).
12. Rematch: client message `rematch` (host or any player vote, simplest: host-only `start` again from `final` resets scores, keeps settings, new seed). See section 12 for the message addition.
13. Minimum players: `start` requires at least `minPlayersToStart` (default 2), counting bots when `fillBots`.
14. Bot fill at start: add bots up to `maxPlayers` if `fillBots`, remove bots in lobby when humans join later.

Tests
- Scripted-client full 5-round match runs to `final` (gate) with phase timings within +/- 1 tick of spec.
- Unit tests per picker; category rule never violated over 10k draws; shuffle bag covers all modes before repeating.
- Settings lock test; host-only test; invalid update gets clamped and rebroadcast.
- Seed test: same `roomSeed` + round gives same arena on server and shared lib.

Exit gate: full 5-round match with scripted clients; phase timing assertions pass.

---

### Step 5: Modes, twists, items

Tasks
1. **Brawl** (Last One Standing): knockout when leaving kill zone; with `respawn.mode` off, KO = out, round ends when one alive (or timer 60 s; ranking by survival time then damage). With lives/unlimited, round ends by timer or when only one has lives left; winner by lives, then points (product 4.2 E).
2. **Bomb**: seeded first holder; fuse `4 + 0.6 x alive` s; holder speed x1.12; pass on shove with cooldown 0.7 s; blast radius 260; on explosion holder is eliminated and bystander blast speed (cap 500 after Step 8 tuning; keep 760 constant until tuned); **no sideways kick on pass** is a Step 8.2 change, implement behind constants `BOMB_PASS_KICK` and `BLAST_SPEED_MAX`. Round time 75 s.
3. **Crown**: holder speed x0.9; score 1 point per second held (display crown seconds); steal by shove; 1.0 s steal protection for the loser; falling respawns the player (1.5 s delay, 1.8 s shield) and drops the crown; round 45 s; tie-break defined.
4. **Twists (13)** as pure modifiers applied at round setup or in-step hooks: `low` gravity x0.33 + jump x0.78; `heavy` gravity x1.7 + jump x1.2; `tiny` scale 0.55; `giant` 1.7; `lotto` random 0.5 to 1.8 per player (seeded `events` stream); `reverse` swaps left/right in sim input stage (bots too); `ice` accel 420, braking 110; `speed` x1.55; `flap` unlimited air jumps at 0.88; `crumble` island tiles fall first at 4 s then every 3.2 s (seeded order, warn state exposed in flags/tile bitmask for the client's blinking red tile); `wind` drift 170 px/s, direction change every 2.5 to 4 s; `dark` has no sim effect (client-only overlay; server just lists the twist); `bounce` bounce back at 80 % if landing faster than 260 px/s.
   - Interactions to test: `giant` + shove range, `lotto` + knockback sqrt ratio, `reverse` + bots, `crumble` + respawn spot validity (never respawn on a fallen tile).
   - Product 11.3 asks to test all pairs/triples for unfun combos; add a simulation matrix test producing a CSV of round lengths per pair, and a configurable `bannedCombos` list in constants (empty initially, filled from results).
5. **Items & power spots** (`items.ts`): `items.spots` fixed spots from arena `powerSpots` (never within 200 px of each other); crate first spawns at 4 s then every 6 to 9 s, max 2 alive, life 14 s; refill 6 to 9 s after pickup; announce beacon 3 s before drop (state flag `crate.state: beacon|live`, `crate.t`); **first touch**: first player whose body overlaps the crate gets it; same-tick tie goes to lower total score, then seeded random; one item per player (touching another does nothing); use item by Shove (consumed): Mega x2.6 force x1.5 range; Freeze 170 px radius, 1.4 s no move; Swap nearest rival within 460 px; Shield 5 s no knockback/freeze/bomb pass (applied on pickup). `items.allowed` filters item pool; `keepOnKO` keeps held item through KO; items clear between rounds otherwise.
   - Lag compensation (product 6.2): forgive up to 100 ms. Implement by keeping a ring buffer of the last 4 ticks of positions and evaluating crate overlap against the claimant's position in the previous 3 ticks (documented, bounded, and only for pickups).
   - `firstTouch: false` fallback: random assignment among overlappers (spec allows setting off).
   - Optional Summit Bonus: stub flag off.
6. **Respawn** (`respawn.ts`): modes off/lives/unlimited, `lives` 1 to 9, `delaySec` 1 to 5, `shieldSec` 0 to 3, `where` random_platform/center/top (default random_platform).
7. **Events** emitted into the per-tick event list: `ko`, `bomb_pass`, `crown_steal`, `pickup`, `toast` (and `bomb_explode`, `shove_hit`, `crate_spawn` flagged for client effects, see section 12).

Tests (gate list from spec)
- Each mode's win rule; bomb pass and explosion; crown steal and respawn; first-touch tie-break (same tick, lower score wins, then seeded random); one item per player; each item effect; each twist modifier numeric check; category rule.

Exit gate: all unit tests above pass.

---

### Step 6: Bots, reconnect, AFK, host migration

Tasks
1. **Bots** (`packages/shared/bots`): port demo AI (chase, flee, shove, item use, bomb/crown goals). Output the same 4-bit input mask. `botSkill` easy/normal/hard scales reaction delay and edge awareness. Include the edge-safety logic now (Step 8.2 depends on it): before applying left/right, if the position after ~0.25 s lookahead is beyond island/platform edges with no platform below within jump reach, cancel the move; remove the 8 % "suicidal" random decision (or make it `easy`-only, ~2 %). Bot RNG uses the seeded `events` stream so server sims are reproducible.
2. **Bot takeover**: when a player disconnects (consented=false) or is AFK >= 30 s, flip `isBot` flag and route AI input within 1 tick (gate). Keep name and score. When the human reconnects and is accepted, flip back and resume human input on the next tick.
3. **Reconnect (30 s)**: use Colyseus `allowReconnection(client, 30)` per 0.17 docs; validate `sessionToken` + `playerId`; if the room was disposed, return generic error. Rate limit reconnect attempts.
4. **AFK**: track last non-zero input time during `play` only; warn at 15 s via `event {type:'toast', ...}` (or a dedicated `afk_warn` event), bot at 30 s, after 2 consecutive missed rounds convert to spectator (product 3.3). Any input returns control only after the player explicitly sends input (don't flap).
5. **Host migration**: on host leave (after grace? host leave is immediate for lobby; for disconnect use reconnect window with host role retained 30 s, then migrate). Longest-connected human becomes host; broadcast `toast` ("X is now the host"). If no humans remain, dispose.
6. **Kick**: host-only `kick {playerId}`; kicked token is banned for that room for its lifetime (`room.allowKick` setting).
7. **Late joiners**: join during a round => spectator until next round or match (product 3.3 "game already started").

Tests
- Kill a client mid-round: bot input applied within 1 tick; reconnect restores control (gate).
- Host tab closed in lobby and mid-match: next human becomes host, match continues (gate).
- AFK timeline test with fake clock.
- Bot round-edge test: 1,000 bot-only steps measure fall-offs without opponent contact (feeds Step 8.2).

Exit gate: both gates above pass.

---

### Step 7: Hardening and observability

Tasks
1. `rateLimit.ts`: token buckets: 60 `input`/s per client; 10 join attempts/min per IP; 5 room creations/min per IP; max `MAX_ROOMS_PER_IP` (3) open rooms per IP. Use in-memory maps with periodic cleanup now; Redis-backed in Step 9 (hide behind an interface `RateLimiter`).
2. `origin.ts`: check `Origin` header against `ALLOWED_ORIGINS` on connect (reject if missing in production). Document that TLS terminates at the proxy and clients use `wss`.
3. Message size cap 1 KB at the transport/`onMessage` level, drop-and-count for invalid type/shape/unknown messages.
4. `logger.ts` (pino JSON, `LOG_LEVEL`). Log IP only in access logs, no names in logs beyond ids (spec s7: no personal data).
5. `metrics.ts` and `GET /metrics` (Prometheus text or JSON; pick Prometheus text): `rooms`, `players`, `bots`, `tick_ms` p50/p95/p99 (use an HDR-like histogram), `patch_bytes`, `dropped_messages{reason}`, `rate_limited{type}`, `reconnects`, `round_length_seconds{mode}` (supports product s11.5 `round_length` metric).
6. Sentry hook (`SENTRY_DSN` optional) capturing room errors without PII.
7. Graceful shutdown: on SIGTERM stop accepting new rooms (flag returned from the create route), let running matches finish or hit a fixed timeout (e.g. 10 min, env-configurable), then close; verify other rooms are untouched (N9). Honor Colyseus lifecycle hooks for shutdown per docs.
8. Reserved-name/profanity lists in versioned JSON files with unit tests (including leetspeak and look-alike normalization).
9. Versioning: `settings.version` and a `PROTOCOL_VERSION` sent on join response; reject mismatched major versions with a clear error (product 11.2 SHOULD).

Tests
- Abuse suite: spam `input` at 1000/s, 10 MB payloads, wrong types, unknown messages, thousands of joins: process never crashes, metrics counters increase (gate).
- Shutdown test with two rooms mid-round.

Exit gate: abuse suite green and visible in `/metrics`.

---

### Step 8: Balance and load test

**8.1 Load test**
- Script `scripts/loadtest.ts`: spawns N simulated rooms x 8 bot-only players (bots on the server) and optionally real WebSocket clients sending `input` at 20 Hz for a sample of rooms. Record CPU (via `process.cpuUsage`/`pidusage`), tick p50/p95/p99, bytes out per room, memory. Pin to 1 vCPU (cgroup/`taskset`/Docker `--cpus=1`).
- Ramp 10, 25, 50, 75, 100, 125 rooms; report the highest room count where tick p99 < 33 ms and CPU < 70 % (product 13.8 pass condition). Compare with N8 (>= 100). Write results to `docs/perf.md` with machine specs and Node version.
- If tick time is the limit: first profile `step`, then consider batching schema writes, lowering patch rate, uWebSockets transport (per spec s8 Step 9 option).

**8.2 Round length (known problem)**
Measured in the product spec s2.4: brawl avg 11.8 s (target 40 to 60), bomb avg 9.8 s (target 45 to 75), crown 46.5 s (fine). Tuning order (re-run the sim test after each change, record in a table in `docs/perf.md`):
1. Base knockback 620 -> ~420 (keep +70 per hit; adjust slope if needed).
2. Remove sideways kick on bomb passes (260 px/s -> 0).
3. Cap blast speed 760 -> ~500.
4. Bot edge avoidance (done in Step 6) and remove 8 % suicide chance.
5. Add a short ring-out grace/safety margin if still short (e.g. 0.15 s kill-zone coyote; product 2.4 point 4) and check it does not hurt feel.
6. If still short, consider `damageScaling` (knockback grows with hits) or a smaller per-hit increment before touching other numbers.
- Vitest simulation: 30 rounds per mode with 8 bots (seeded, deterministic), assert brawl average within 40 to 60 s, bomb within 45 to 75 s, crown ~45 s; also assert min round length > 10 s to catch pathological early KOs. Run with all twists off and again with `ramp` twists to see the spread.
- Deliver a second sim: pair/triple twist matrix (Step 5) now with tuned numbers to fill `bannedCombos`.

Exit gate: `docs/perf.md` has the load numbers and the round-length tests pass.

---

### Step 9: Scale-out (only after 1 to 8)

Tasks
1. Add Colyseus Redis presence and driver packages (names/versions from the 0.17 docs). `REDIS_URL` toggles multi-process mode; empty = in-memory.
2. Move rate limiter, room code uniqueness lookup and per-IP room counts to Redis behind existing interfaces.
3. Deployment: reverse proxy/load balancer per Colyseus deployment docs (sticky sessions or processId-based routing as documented), TLS, health checks on `/healthz`.
4. Optional uWebSockets transport if Step 8 shows the network layer is the limit.
5. Region: Mumbai first (product 9). One independent cluster per region later; rooms never move.
6. Docker image (multi-stage), `pnpm build` yields runnable image; env docs in README.

Exit gate: two processes behind one entry point create and join rooms across each other with no game-logic changes.

---

## 5. Message contract (authoritative list, from backend-spec s4)

| Dir | Type | Payload | Validation notes |
|---|---|---|---|
| C->S | join options | `{code?, name, color, playerId, token?}` | name rules s7, color 0..7 |
| C->S | `input` | `{seq, bits}` | seq uint16, bits 0..15, <= 8 B payload |
| C->S | `settings:update` | partial settings | host only, sanitize, locked in play |
| C->S | `ready` | `{value}` | boolean |
| C->S | `start` | none | host only, needs min players |
| C->S | `pick` | `{index 0..2}` | picker or voter only, once per phase |
| C->S | `emote` | `{id}` | fixed list, rate limit 1/s |
| C->S | `kick` | `{playerId}` | host only |
| S->C | `settings` | full validated settings | `version:1` |
| S->C | `round:start` | `{n, mode, twists, themeId, seed, slot, pickedBy?}` | per-client slot |
| S->C | `event` | `{type, ...}` | `ko, bomb_pass, crown_steal, pickup, toast` + additions in s12 |
| S->C | `error` | `{code, message}` | generic for room lookup failures |

Error codes (stable strings for the client): `ROOM_UNAVAILABLE, NAME_INVALID, NOT_HOST, SETTINGS_LOCKED, RATE_LIMITED, KICKED, VERSION_MISMATCH, BAD_MESSAGE`.

---

## 6. Rule constants (single source: `constants.ts`)

| Rule | Value |
|---|---|
| Canvas / arena | 960 x 540; floor y 400; tile 100 px; tiers y 300/210/130; classic platforms (50,290,190), (720,290,190), (385,195,190) |
| Gravity / run / jump | 1800 / 420 / 720; air jump x0.88; coyote 0.09 s; buffer 0.12 s; max fall 1300 |
| Body | 36 px (half 18) x scale |
| Kill zone | y > 630, x < -90 or x > 1050 |
| Shove | cooldown 0.85 s; range 62 x scale + target half size; force (base + 70 x hits) x sqrt(scale ratio), base 620 now, ~420 after tuning; pop-up 260; stun 0.22 s; damage display hits x 12 % |
| Bomb | fuse 4 + 0.6 x alive; holder x1.12; pass cooldown 0.7 s; blast radius 260; blast speed 760 -> cap ~500; pass kick 260 -> 0 |
| Crown | holder x0.9; steal protection 1.0 s; respawn 1.5 s + 1.8 s shield |
| Crates | first at 4 s then every 6 to 9 s; max 2; life 14 s; spots >= 200 px apart |
| Items | mega x2.6 force, x1.5 range; freeze 170 px, 1.4 s; swap 460 px; shield 5 s |
| Round time | brawl 60, bomb 75, crown 45 (override by `match.roundTime` 30 to 120) |
| Twists per round | ramp 1,1,2,2,3 |
| Phases | intro 4 s, pick 10 s, results 6 s, vote 8 s |
| Reconnect / AFK | 30 s / warn 15 s, bot 30 s |

Do not change any number without a test that references it.

---

## 7. Test strategy summary

| Layer | Tool | Examples |
|---|---|---|
| Pure shared | Vitest | arena 8,400 combos, settings fuzz, step determinism, mode rules, twists, items |
| Sim balance | Vitest (slow project) | 30 rounds/mode length, twist pair matrix |
| Room integration | Vitest + Colyseus testing | lobby, settings, phases, pickers, reconnect, AFK, host migration |
| Abuse | Vitest | spam, huge payloads, bad types, rate limits |
| Load | script + `docs/perf.md` | 100 rooms x 8 bots per vCPU |
| E2E | Playwright (later, with client) | 2 browsers join, play a round, one drops and returns |

CI order: lint, typecheck, unit, room integration, then slow sims nightly.

---

## 8. Definition of done (from spec s10)

1. Four real clients finish a 5-round match; all three modes work.
2. A dropped client returns within 30 s without breaking the round.
3. Any invalid setting or message is clamped or rejected without a crash.
4. Round length targets met; load numbers documented.
5. `pnpm test` passes and `pnpm build` produces a runnable server image.

---

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Colyseus 0.17 API differs from memory | Read docs per task; wrap Colyseus in thin adapters so only `GameRoom.ts` and `index.ts` touch it |
| Schema patch grows past 600 B | quantize, bitfield flags, patch-size test in CI |
| Sim drift between server and client prediction | shared `step`, golden-state tests, `ackSeq` reconciliation |
| Rounds still too short after tuning | constants isolated; simulation test gates every tuning PR |
| Bot cost dominates CPU | cheap AI (decide every 4 to 6 ticks), measure in Step 8.1 |
| Unfun twist combos | pair/triple matrix + `bannedCombos` |

---

## 10. Out of scope (extension points only)

Accounts and Postgres, `POST /events` ads/analytics endpoint, public room list, replays/clips, new modes and hazards. Keep interfaces (`RateLimiter`, `EventSink`, `RoomDirectory`) so these slot in later; do not build them.

---

## 11. Suggested work order and rough sizing

| Step | Rough effort (1 dev) |
|---|---|
| 1 shared + arena + settings | 3 to 4 days |
| 2 simulation | 4 to 5 days |
| 3 server skeleton | 3 days |
| 4 settings + match flow | 5 to 6 days |
| 5 modes, twists, items | 8 to 10 days |
| 6 bots, reconnect, AFK, host | 5 to 6 days |
| 7 hardening + observability | 4 days |
| 8 balance + load | 4 to 5 days |
| 9 scale-out | 3 to 4 days |

Product roadmap (M1 online MVP 5 to 7 weeks, M2 host controls/themes 4 to 6 weeks) is consistent with this at 10 to 12 hours per week; revisit after Step 4.

---

## 12. Alignment notes: gaps and conflicts between the documents

Decisions proposed here; confirm or overrule before building.

| # | Finding | Proposed resolution |
|---|---|---|
| 1 | Product spec s9.3 lists `vote` as a message; backend-spec s4 uses `pick {index}` for picker and voter | Use `pick` only |
| 2 | Product spec lists `joined`, `round:end`, `match:end`; backend-spec s4 has none | Room join result carries player id/settings/host; use `event` types `round_end`, `match_end` (and a `rematch` message) so frontend Results/Final screens have data. Add to backend-spec |
| 3 | Product settings include `minPlayersToStart`, `respawn.where`, `room.allowKick`, `hazards.allowed`; `settings.js` and backend-spec s5 omit them | Add the first three as optional with defaults; defer `hazards` (planned, not built) |
| 4 | Frontend needs reconciliation but backend schema lacks last-processed input seq | Add `ackSeq` per player to schema |
| 5 | Client needs effect cues (hit-stop, explosion, crate spawn) not in the 5 listed events | Add `shove_hit`, `bomb_explode`, `crate_spawn`, `round_end`, `match_end`, `afk_warn` event types (events are free-form `{type,...data}` so compatible) |
| 6 | Product spec s9.1 says Node 22 + vanilla Canvas/Phaser 3; backend-spec says Node 20+, frontend-spec says Phaser 4 | Follow backend/frontend specs (Node 20+ LTS; Node 22 also fine) |
| 7 | Product s6.1 says pick auto-selects in 7 s in the demo screenshot; backend-spec says 10 s | Use 10 s (backend-spec) |
| 8 | Product s3.3: after 2 missed rounds AFK -> spectator; backend F10 stops at bot takeover | Implement spectator conversion (product) as a post-F10 step |
| 9 | Round-end `bomb` holder elimination and bystander blast tuning conflict with "do not change numbers without a test" | Tuning is allowed only via Step 8.2 with the sim test as the guard |
| 10 | Backend schema list says `arena` carries seed and settings hash; client also needs `islandTiles/mirror/platformCount` | Client can derive from `settings` broadcast; settings hash lets client detect mismatch. Keep both |
| 11 | Pick flow timing: demo applies the picked twist to the **next** round | Implement `pendingTwist` carry-over; round 1 uses seeded random twists |
| 12 | Crumble tile warning blink needs per-tile state | Expose a small tile bitmask + next-fall timer in schema |
