# Mutator Party: Backend Spec (for the coding agent)

Short, step-wise, scalable, low latency. Build in the order given. Do not start a step until the previous step's acceptance tests pass.

## 0. What you are building

An authoritative multiplayer game server for **Mutator Party**, a browser party game (2 to 12 players per room, about 60 second rounds). Players join a **room by code or link**. A **host** sets the rules. The server runs the game; browsers only send inputs and draw what the server says.

**Inputs you will be given (attach these):**
- `mutator-party-v2.html`: the working offline demo. It is the reference for physics, modes, twists, items and bots. Port its logic; do not redesign it.
- `arena.js`: deterministic arena generator (tested). Use it as is, converted to TypeScript.
- `settings.js`: default room settings and a `sanitize()` validator. Convert to a Zod schema with the same defaults and ranges.

**Non-goals for now:** accounts, payments, cosmetics, free-text chat, matchmaking of strangers, replays. Leave clean extension points only.

## 1. Stack (fixed)

| Part | Choice |
|---|---|
| Language | TypeScript, `strict: true`, ES modules |
| Runtime | Node.js current LTS (20 or newer) |
| Framework | Colyseus 0.17.x (rooms, schema state sync, reconnection). Follow https://docs.colyseus.io for exact 0.17 APIs. Do not guess APIs. |
| Validation | Zod for every message and every setting |
| Monorepo | pnpm workspaces |
| Tests | Vitest (unit and simulation), Playwright (2 browser end-to-end, later) |
| Logging | pino, JSON logs |

```text
mutator-party/
  apps/server/       Colyseus server (this spec)
  apps/client/       Phaser 4 client (separate task)
  packages/shared/   pure TypeScript game rules: sim, modes, arena, settings schema, constants
```

**Rule 1:** `packages/shared` has **no** imports from Colyseus, Node APIs or Phaser. The server runs it as the authority. The client reuses it for prediction.
**Rule 2:** the simulation is a pure function: `step(state, inputs, dt) -> state`, fixed `dt = 1/30` s. No `Date.now()` and no `Math.random()` inside it. Randomness comes from a seeded generator stored in the state.

## 2. Requirements

### 2.1 Functional

| ID | Requirement |
|---|---|
| F1 | Create a room and get a 5 character code. Join by code. |
| F2 | Player supplies a name and color on join. The server validates and de-duplicates the name. |
| F3 | One host per room. Only the host can change settings and start the match. |
| F4 | Settings are validated and clamped on the server (schema in section 5). |
| F5 | Match flow: lobby, then rounds (intro, optional twist pick, play, results), then final. |
| F6 | Each round gets a new seeded arena (shuffled spawns). Mode and twists follow the settings. |
| F7 | Three modes: `brawl`, `bomb`, `crown`. Thirteen twists. Four items with the **first player to touch a power spot gets it**. |
| F8 | Bots fill empty slots when allowed. A bot also covers a disconnected player. |
| F9 | Reconnect within 30 s keeps the player's slot. Host leaves, so the longest connected human becomes host. |
| F10 | AFK handling: no input 15 s, warn. 30 s, bot takes over. |

### 2.2 Non-functional (targets; verify with tests)

| ID | Requirement | Target |
|---|---|---|
| N1 | Simulation tick | 30 Hz fixed |
| N2 | State patch rate to clients | 20 to 30 Hz |
| N3 | Server time per tick, 8 players plus bots | under 4 ms |
| N4 | Input to visible effect, same region | under 100 ms |
| N5 | Input message size | at most 8 bytes of payload (bitfield plus sequence) |
| N6 | Snapshot size, full room | under 600 bytes per patch |
| N7 | Join to playing (cold) | under 2 s |
| N8 | Capacity goal per 1 vCPU | 100 or more concurrent rooms (must be proven by the load test in step 8) |
| N9 | Server restart | does not corrupt other rooms (drain, then stop) |

## 3. Core design

- **Authoritative server.** Clients send only inputs. The server ignores any position, speed or score sent by a client.
- **Fixed tick loop** per room using the Colyseus simulation interval at 33 ms. Process queued inputs, run `step`, let Colyseus send patches.
- **Input format:** `{ seq: number, bits: number }` where bits = left(1) right(2) jump(4) shove(8). Keep only the latest input per player per tick. Drop inputs with an old `seq`.
- **State** (Colyseus schema, keep it small): `phase`, `round`, `mode`, `twists[]`, `themeId`, `timeLeft`, `players[]` (id, name, color, x, y, vx, vy, flags, score, lives, item), `bomb`, `crown`, `crates[]`, `arena` (only the seed and settings hash; clients rebuild the arena from the seed).
- **Events** (not in state, sent once): `ko`, `bomb_pass`, `crown_steal`, `pickup`, `toast`.
- **Seeds:** `roomSeed` random at room creation. `roundSeed = hash(roomSeed, roundNumber)`. Use separate streams `layout`, `spawn`, `power`, `events`.
- **Phases:** `lobby`, `intro` (4 s), `pick` (10 s, only if the picker is a human), `play`, `results` (6 s), `final`. Server timers drive every change. Never trust a client clock.
- **Bots:** run on the server and produce the same input bitfield as humans. Port the demo's bot logic, then fix the edge-walking problem listed in 8.2.

### 3.1 Room code

5 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (31 symbols, no look-alikes). Generate randomly, retry on collision. Look the room up by code (for example through room metadata, or a presence key; check the Colyseus docs). A wrong or full room returns a generic error with no hints.

## 4. Messages

All messages are validated with Zod. Unknown or malformed messages are dropped and counted. Max message size 1 KB.

| Direction | Type | Payload |
|---|---|---|
| C to S | `join` options | `{ code?, name, color, playerId, token? }` |
| C to S | `input` | `{ seq, bits }` |
| C to S | `settings:update` | host only, partial settings |
| C to S | `ready` | `{ value }` |
| C to S | `start` | host only |
| C to S | `pick` | `{ index: 0 to 2 }` (twist picker or voter) |
| C to S | `emote` | `{ id }` from a fixed list |
| C to S | `kick` | host only, `{ playerId }` |
| S to C | `settings` | full validated settings |
| S to C | `round:start` | `{ n, mode, twists, themeId, seed, slot, pickedBy? }` |
| S to C | `event` | `{ type, ...data }` |
| S to C | `error` | `{ code, message }` |

## 5. Settings (host controlled)

Validate with Zod and **clamp** instead of rejecting when a number is out of range. Defaults are in `settings.js`.

| Group | Keys |
|---|---|
| room | `name` (max 24, filtered), `visibility` (private/public), `password` (max 12), `chat` (off/emotes/filtered), `spectators` |
| match | `maxPlayers` 2 to 12 (default 8), `fillBots`, `botSkill` (easy/normal/hard), `rounds` 1 to 15 (default 5), `roundTime` (auto or 30 to 120), `scoring` |
| arena | `platformCount` 2 to 8 (default 4), `islandSize` S/M/L, `layout` (every_round/per_match/classic), `mirror`, `shuffleSpawns` |
| modes | `pool` (subset of brawl, bomb, crown), `order` (shuffle_bag/random/fixed), `fixedList`, `twistPicker` (last_place/vote/host/random/round_robin) |
| twists | `allowed` (subset of 13 ids), `perRound` (1/2/3/ramp), `themeLinked` |
| respawn | `mode` (off/lives/unlimited), `lives` 1 to 9, `delaySec` 1 to 5, `shieldSec` 0 to 3 |
| items | `enabled`, `allowed`, `spots` 0 to 5, `firstTouch`, `keepOnKO` |
| theme | `mode` (fixed/rotate/random/custom), `fixed`, `perRound[]` (7 theme ids) |

Rules: only the host may change settings. Settings lock while a round is playing (theme and twist picker may change between rounds). Every accepted change is broadcast as `settings`. The object carries `version: 1`.

## 6. Game rules to port (do not change numbers without a test)

Take exact values from the demo. Key ones:

| Rule | Value |
|---|---|
| Gravity / run speed / jump | 1800 px/s squared / 420 px/s / 720 px/s (air jump x0.88) |
| Shove | cooldown 0.85 s, range 62 px x scale, force 620 plus 70 per hit taken |
| Bomb fuse | 4 plus 0.6 x players alive, seconds |
| Round time | brawl 60 s, bomb 75 s, crown 45 s |
| Twists per round | ramp 1, 1, 2, 2, 3; never two twists from the same category |
| First touch | the first player whose body overlaps a power spot gets it; same-tick tie goes to the lower total score, then a seeded random choice; one item per player |

## 7. Security and abuse

- Server decides everything. Clamp speeds and actions. No client-sent positions.
- Rate limits: 60 `input`/s per client, 10 join attempts per minute per IP, 5 room creations per minute per IP, max 3 open rooms per IP.
- Check the `Origin` header on connect. Use TLS (wss) in production.
- Names and room names: letters, digits, space, `_ - '`; 2 to 16 characters; block URLs, e-mails, phone numbers and reserved words (`you`, `host`, `admin`, `bot`, `system`); server-side profanity filter.
- Empty rooms are disposed after 60 s. Rooms with no humans are disposed immediately.
- Do not log personal data beyond IP in access logs. No accounts or personal data in this phase.

## 8. Build steps (do in order)

Each step ends with a runnable result and tests. Commit after each step.

### Step 1: Repo and shared rules
- Create the pnpm monorepo, TypeScript config, lint, Vitest.
- In `packages/shared`: constants, seeded RNG, arena generator (from `arena.js`), settings schema and defaults, input bitfield helpers.
- **Done when:** the 8,400 combination arena test passes (all reachable, deterministic, no fallbacks), and settings fuzz tests clamp bad input.

### Step 2: Fixed-step simulation
- Port movement, platforms, shove and damage from the demo into `step(state, inputs, dt)` with `dt = 1/30`.
- **Done when:** a headless test runs 8 scripted players for 60 s with identical results on two runs (same seed, same inputs).

### Step 3: Server skeleton
- Colyseus server, one `GameRoom`. Create and join by code. Name and color validation. Host assignment. Ready flags. Lobby state.
- Health endpoint `GET /healthz`.
- **Done when:** two test clients join one room, see each other, and a wrong code returns the generic error.

### Step 4: Settings and match flow
- `settings:update` (host only, validated, broadcast). Phase machine lobby, intro, pick, play, results, final. Round seeds. Mode and theme selection per settings. Twist picker (last place, vote, host, random, round robin).
- **Done when:** a full 5 round match can run with scripted clients and the phase timings match section 3.

### Step 5: Modes, twists, items
- Implement `brawl`, `bomb`, `crown`, the 13 twists, 4 items, power spots with first touch, respawn rules.
- **Done when:** unit tests cover each mode's win rule, bomb pass and explosion, crown steal and respawn, first-touch tie-break, and one item per player.

### Step 6: Bots, reconnect, AFK, host migration
- Server bots (port the demo AI). Bot takeover on disconnect and AFK. Use Colyseus reconnection (30 s). Host migration.
- **Done when:** killing a client mid-round gives a bot within 1 tick and returns control on reconnect, and closing the host tab moves host to the next human.

### Step 7: Hardening and observability
- Rate limits, origin check, message size cap, drop-and-count of invalid messages.
- pino logs, a `/metrics` endpoint (rooms, players, tick time p50/p95/p99, patch bytes, dropped messages). Error tracking hook (Sentry).
- Graceful shutdown: stop new rooms, let running matches finish (or a fixed timeout), then exit.
- **Done when:** abuse tests (spam, huge payloads, bad types) never crash the process and show up in metrics.

### Step 8: Balance and load test
- **8.1 Load test:** script 100 simulated rooms of 8 bots each. Record CPU, tick time and bandwidth. Report the real rooms-per-vCPU number and compare with N8.
- **8.2 Round length (known problem):** in the demo, bot-only rounds ended in about 12 s (brawl) and 10 s (bomb) against targets of 40 to 60 s and 45 to 75 s. Tune knockback (start near base force 420), remove the sideways kick on bomb passes, cap blast speed near 500, and make bots avoid edges. Add a Vitest simulation that runs 30 rounds per mode and asserts the average length.
- **Done when:** the load numbers are recorded in `docs/perf.md` and the round-length tests pass.

### Step 9: Scale-out (only after steps 1 to 8)
- Add Redis presence and driver (Colyseus packages) so several server processes share one room directory. Put a load balancer or proxy in front, following the Colyseus deployment docs.
- Optionally switch to the uWebSockets transport if the load test shows the network layer is the limit.
- Deploy in the region closest to players (Mumbai for India). Add a second region later by running an independent cluster per region; rooms never move between regions.
- **Done when:** two processes behind one entry point can create and join rooms across each other with no code changes in the game logic.

### Later (extension points, do not build yet)
- Accounts (Google or phone sign-in) and Postgres for cosmetics.
- Ad and analytics events endpoint (`POST /events`, batched).
- Public room list, replays and clips, more modes and hazards.

## 9. Configuration (environment variables)

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | 2567 | Server port |
| `ALLOWED_ORIGINS` | none | Comma separated list for the Origin check |
| `TICK_HZ` | 30 | Simulation rate |
| `PATCH_HZ` | 20 | State patch rate |
| `MAX_ROOMS_PER_IP` | 3 | Abuse limit |
| `REDIS_URL` | empty | Enables multi-process mode (step 9) |
| `LOG_LEVEL` | info | pino level |
| `SENTRY_DSN` | empty | Error tracking |

## 10. Definition of done (whole backend)

1. Four real clients can finish a 5 round match and all three modes work.
2. A dropped client returns within 30 s without breaking the round.
3. Any invalid setting or message is clamped or rejected without a crash.
4. Round length targets met; load numbers documented.
5. `pnpm test` passes and `pnpm build` produces a runnable server image.
