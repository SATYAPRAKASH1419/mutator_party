# Mutator Party: Frontend Implementation Plan

Companion to `frontend-spec.md` (the contract), `backend-spec.md` (messages, settings, phases) and the product spec `mutator-party-spec` (look, feel, screens, mockups 11 to 14, real screenshots 01 to 10). This plan converts the spec into modules, interfaces, tasks, tests and exit gates. If this plan disagrees with `frontend-spec.md`, the spec wins; open conflicts are in section 13.

---

## 1. Goals and constraints (recap)

- Mobile-first browser client: link to playing in under 15 s on a phone; 60 fps on a low-end Android phone; interactive in under 3 s on 4G.
- Fixed stack: TypeScript strict, Vite, Phaser 4 (pin exact 4.2.x), Preact for DOM UI, Colyseus SDK 0.18.x, shared Zod schema, Lucide + Noto Emoji/Twemoji, Bagel Fat One + Nunito (self-hosted woff2), Vitest, Playwright.
- Rules:
  - **R1** All game rules and numbers come from `packages/shared`. Import, never copy.
  - **R2** Phaser draws the world only (arena, players, crates, effects). Anything with text, forms or buttons is DOM.
  - **R3** Every screen works against the mock server so UI is built before the backend exists.
- Do not start a step until the previous step's checks pass. Commit after each step.
- Do not guess Colyseus or Phaser 4 APIs; consult their docs for each integration task.

---

## 2. Project layout (from frontend-spec s1, expanded)

```text
apps/client/
  index.html
  vite.config.ts  tsconfig.json  vitest.config.ts  playwright.config.ts
  public/ fonts/*.woff2  manifest.webmanifest  og-image.png  icons/
  src/
    main.ts                     boot, router (/ and /r/:code), screen switching
    app/
      store.ts                  tiny reactive store (signals) for session/room/ui state
      router.ts                 path parsing, history
      screens.ts                screen enum + transitions driven by room phase
    net/
      connection.ts             interface RoomConnection + real Colyseus impl
      mockServer.ts             same interface, runs shared sim + shared bots locally
      inputSender.ts            bitfield sender (on change + 100 ms heartbeat, <= 60/s)
      prediction.ts             local player prediction + reconciliation
      interpolation.ts          snapshot buffer, 100 ms render delay
      events.ts                 typed event bus for server events
      reconnect.ts              reconnect state machine UI hooks
    game/
      GameScene.ts  ArenaView.ts  PlayerView.ts  CrateView.ts  BombView.ts  CrownView.ts
      effects.ts                particles (pooled, cap 300), shake, hit-stop, slow-mo
      twistsView.ts             dark overlay, wind streaks, crumble tiles, size changes
      audio.ts                  WebAudio blips, unlock, mute
      theme.ts                  ThemeManager (CSS vars + Phaser colors)
      markers.ts                per-player shape/hat for color-blind marks
    ui/
      Landing.tsx CreateRoom.tsx Lobby.tsx Hud.tsx Pick.tsx Results.tsx Final.tsx
      Toasts.tsx Banner.tsx TouchControls.tsx SettingsForm/ (sections A..H) StyleGuide.tsx
      components/ Button Panel Chip Toggle Stepper Segmented Slider Modal Icon
    ads/ ads.ts consent.ts      interface + no-op, consent hook
    util/ storage.ts track.ts device.ts i18n-ready strings.ts
    styles/ tokens.css base.css components.css themes.css
  test/ (Vitest unit) e2e/ (Playwright)
```

Design choices:
- State management: a minimal signals store (or Preact signals) so HUD updates only on value change (frontend-spec s5).
- Use `@mutator/shared` workspace package imports (`step`, `generateArena`, `sanitize`/Zod schema, `themes`, constants, input helpers, bots for mock).
- One `RoomConnection` interface; the app never imports Colyseus outside `net/connection.ts`.

---

## 3. Core interfaces

```ts
// net/connection.ts
export interface RoomConnection {
  connect(opts: { code?: string; create?: boolean; settings?: Partial<Settings>;
                  name: string; color: number; playerId: string; token?: string }): Promise<JoinResult>;
  send: {
    input(seq: number, bits: number): void;
    settingsUpdate(patch: DeepPartial<Settings>): void;
    ready(value: boolean): void;
    start(): void;
    pick(index: 0 | 1 | 2): void;
    emote(id: EmoteId): void;
    kick(playerId: string): void;
    rematch(): void;                 // see section 13 (proposed addition)
  };
  on(evt: 'state', cb: (s: ClientState) => void): Unsub;      // decoded snapshot with server time
  on(evt: 'settings', cb: (s: Settings) => void): Unsub;
  on(evt: 'roundStart', cb: (r: RoundStart) => void): Unsub;
  on(evt: 'event', cb: (e: GameEvent) => void): Unsub;
  on(evt: 'error', cb: (e: { code: string; message: string }) => void): Unsub;
  on(evt: 'status', cb: (s: 'connected' | 'reconnecting' | 'lost' | 'kicked') => void): Unsub;
  ping(): number;                    // smoothed ms
  leave(): void;
}
```

Client-side decoded state: `phase, round, mode, twists[], themeId, timeLeft, players[] {id,name,color,x,y,vx,vy,flags,score,lives,item,hits,ackSeq}, bomb, crown, crates[], arena{seed, settingsHash}, serverTime`. Mock and real connections both produce this shape.

---

## 4. Screen and phase mapping

| Server phase / client status | Screen shown |
|---|---|
| no connection | Landing (`/`) or Join link (`/r/:code`) after name |
| connecting | Loading / "Joining..." |
| `lobby` | Lobby (code, players, rules summary, emotes) |
| `intro` | Game canvas + intro overlay (mode title, twist cards locking one by one, "Get ready!") |
| `pick` | Pick overlay (picker sees 3 cards + keys 1 2 3 + 10 s countdown; others "X is picking"; vote mode shows cards to all with 8 s) |
| `play` | Game canvas + HUD (+ touch controls on touch devices) |
| `results` | Round results overlay (pts, total, "Tap or press Space to continue" in demo; server timer is authoritative so it auto-advances) |
| `final` | Final overlay (winner, standings, Rematch, Leave) |
| status `reconnecting` / `lost` / `kicked`, error `ROOM_UNAVAILABLE` | Banner/modal error states |

Spectators (out players and late joiners) see the game without touch controls and get "You're out. Watching at 2.5x speed." style text (product screenshot 04; the 2.5x is a **client-only** cosmetic and must not alter sim; confirm behavior with design, it is a demo feature).

---

## 5. Step-by-step plan

### Step 1: Scaffold

Tasks
1. `pnpm create vite` inside `apps/client` (TS template), add Preact (`@preact/preset-vite`), Phaser 4 pinned exactly (`4.2.x`, verify the real published version), ESLint, Vitest, path alias `@shared`.
2. Create folder layout from section 2 with empty modules.
3. `main.ts`: mount Preact root, create `Phaser.Game` in a container `div` with a placeholder scene. Phaser config: logical 960 x 540, `Scale.FIT`, `autoCenter`, `resolution = Math.min(devicePixelRatio, 2)`, transparent background.
4. Import one constant from shared (`GRAV`) and log it to prove the workspace link.
5. Env typing for `VITE_SERVER_URL, VITE_MOCK, VITE_ANALYTICS_ID, VITE_ADS_ENABLED`.

Check: `pnpm dev` shows an empty Phaser canvas inside the page; shared constant imports without errors; `pnpm build` passes.

### Step 2: Design system

Tasks
1. `tokens.css`: all tokens from frontend-spec s3 plus product s8.2 extras (`--mp-aqua`, `--mp-ok`, `--mp-muted-page`, `--mp-gold-glow`, outline 3 px, panel radius 18, chip radius 14, shadow `6px 7px 0 var(--mp-ink)`). Dark mode via `prefers-color-scheme` + manual toggle (`data-theme`).
2. Fonts: self-host Bagel Fat One 400 and Nunito 700/900 as woff2 (subset Latin; leave a Devanagari fallback stack for later). `font-display: swap` with metric-matched fallbacks to avoid layout shift. CSS stacks from product 8.1.
3. Components: Button (full pill, 4 px outline, hard shadow, pressed state), Panel, Chip, Toggle, Stepper (- n +), Segmented control, Slider (platform count), Modal, Card (twist card), Badge, Icon wrapper (Lucide for UI, Noto/Twemoji SVG sprite for game icons; keep `CREDITS` data in one file for the Credits page).
4. `ThemeManager` (`game/theme.ts`): loads the 7 themes from shared; `apply(themeId, {crossfadeMs: 400})` sets CSS variables for DOM and calls a Phaser-side `applyTheme(theme)` (sky gradient, orb, stars, floor/platform fill+edge, particle preset). Ink stays `#1B1B3A` in every theme. Cross-fade implementation: two sky layers with alpha tween.
5. `StyleGuide.tsx` route (`/styleguide`, dev only) showing every component across 7 themes x light/dark.

Check: style-guide page renders every component in all 7 themes and both modes; matches mockups 11 to 14 visually.

### Step 3: Landing and name

Tasks
1. `Landing.tsx` per mockup 11: logo wordmark, "2 to 12 friends. One link. Zero setup.", name input with dice button (random name generator, e.g. adjective + food list, ~200 combos; Hinglish-friendly foods), color picker (8 colors, player-color order from spec), hint "Please do not use your real full name.", Create a room, "or join with a code" 5-box code input (uppercase, alphabet filter to the 31 allowed symbols, auto-advance, paste support), Join.
2. Name validation (client, instant feedback only): trim, 2 to 16 chars, regex `^[\p{L}\p{N} _'-]+$`, no repeated spaces, no URL/e-mail/phone patterns. Error text under the field. Server remains authority; show server `NAME_INVALID` message if returned.
3. `util/storage.ts`: typed localStorage wrapper with try/catch and in-memory fallback: `name, color, playerId (UUID via crypto.randomUUID), token, muted, reduceMotion, textScale, rebinds (later), myPresets`.
4. Router: `/` landing; `/r/:code` same screen with join context; if saved name exists skip prompt and go straight to connect (returning player flow) but offer "Edit name". Returning player on `/` goes to the lobby flow (i.e. directly shows Create/Join with saved identity prefilled; "skips straight to the lobby flow" means no re-entry of name).
5. Layout must work at 360 px width; landscape and portrait both usable on menus (game itself is landscape). Safe-area padding.
6. Page content for ad approval and SEO later (How to play, FAQ) can be static sections below the fold; keep out of MVP.

Check: returning player skips name entry; layout works at 360 px; join link with no saved name shows name prompt then joins that room.

### Step 4: Connection layer

Tasks
1. `RoomConnection` interface (section 3) and two implementations behind a factory: `?mock=1` or `VITE_MOCK=1` selects `mockServer`.
2. Real connection (`connection.ts`): Colyseus client 0.18 `joinById`/`create`/`reconnect` per docs (consult docs for how to find a room by the 5-char code, matching the backend's metadata lookup). Store `playerId` and `sessionToken` (and Colyseus reconnection token if it differs) in localStorage after join. Map server `error` messages and thrown join errors to UI states.
3. State decoding: subscribe to schema changes and emit a decoded immutable snapshot with a server timestamp; keep decode allocation-light.
4. Reconnect: use SDK auto-reconnect within the 30 s window; `status` goes `reconnecting` (banner with countdown), resolves to `connected` and refreshes state, else `lost` with "Back to home".
5. Error states UI (Banner/Modal): wrong code ("We could not find that room."), room full (offer spectate if allowed), kicked, connection lost, reconnecting, version mismatch, rate limited.
6. Mock server (`mockServer.ts`, build now per spec s7): implements join, settings (via shared `sanitize`), ready, start, phase machine (simplified clone of server phases with same timings), shared `step()` at 30 Hz via `setInterval`/rAF accumulator, shared bots for the other slots, event emission, round seeds from shared arena generator, twist pickers (at least last_place and random), results and final events. Include `mock.simulateDisconnect()` and `mock.setLatency(ms, loss)` dev hooks to test reconnect and netcode without a backend.
7. A dev panel (hidden unless `?dev=1`) with buttons: drop connection, add latency, kick me, make me host, force phase.

Check: with the mock, create a room, join, drop the connection, see reconnect state resolve; wrong-code error renders.

### Step 5: Lobby and Create Room

Tasks
1. Settings form built **from the shared Zod schema** so options and ranges can never drift. Write a small schema-to-field metadata layer (`SettingsForm/fields.ts`) mapping each key to a control type, label, and section. Sections per mockup 12: A Match and players, B Arena, C Modes and level picks, D Hurdles (twists), E Respawn and lives, F Power-ups, G Theme, H Room and safety (second tab).
   - A: maxPlayers stepper 2 to 12, fillBots toggle, botSkill segmented, rounds stepper 1 to 15, roundTime segmented (Auto 45s 60s 75s per mockup; the schema allows 30 to 120 so add "Custom" number if desired), scoring segmented (if exposed), spectators.
   - B: platformCount slider 2 to 8, islandSize S/M/L, layout every round/per match/classic, mirror toggle, shuffleSpawns toggle.
   - C: mode pool chips (brawl, bomb, crown; at least one must remain), order (shuffle bag/random/fixed + ordered list editor for fixed), twistPicker (last place/vote/host/random/round robin).
   - D: 13 twist chips (toggle each; empty list allowed per product spec), perRound (1, Ramp 1 to 3, 2, 3), themeLinked toggle, "Hazards: coming later" note.
   - E: respawn mode (Off/Limited lives/Unlimited), lives, delay, shield seconds (0 to 3, step 0.5).
   - F: items.enabled, allowed chips (Mega Shove, Freeze, Swap, Shield), spots stepper 0 to 5, firstTouch toggle, keepOnKO toggle.
   - G: theme mode (Fixed/Rotate/Random/Custom), theme tiles (7) and a per-round strip for Custom (one theme per round up to `rounds`).
   - H: room name (24 max), visibility, password (12 max), chat (off/emotes/filtered), spectators.
2. Presets (product 4.1): Classic, Chaos Party (default), Tournament, Chill, Custom. Presets are plain partial settings objects in the client (or shared if the backend wants them), applied through `settings:update`. Show "Reset to preset" and "Save as my preset" (localStorage).
3. Create flow: Landing "Create a room" opens Create Room (modal or page) with the form; on confirm, connect with `create: true, settings`. Lobby editing uses the same form via "Edit rules (host only)".
4. Lobby (mockup 13): big room code tiles (tap to copy), Copy link (`https://domain/r/CODE`), Share on WhatsApp (Web Share API on phones, fallback `https://wa.me/?text=` link), players grid with ready/choosing chips, host crown, empty slots shown as "Bot joins at start" when fillBots, quick emotes row (fixed list; sends `emote`), rules summary panel (read-only for guests), Edit rules (host), Start (host; disabled with reason "Waiting for N more player(s)" when below min), Ready toggle for non-hosts, Leave button, kick button per player (host, Lucide icon).
5. Optimistic UI: host edits send `settings:update` and wait for the `settings` broadcast; **never** show the local edit as final. Values returned by the server replace local values (clamping visible to the user, e.g. maxPlayers 9999 shows 12).
6. Guests see read-only summary; use `aria-live` for "Host changed the rules".
7. Emote feed: show floating emoji above player cards (client-only effect, 1 per second per sender rate limit mirrored).

Check: host edits a setting and every client (mock with 2+ tabs or simulated peers) sees it update; invalid values clamp to server values.

### Step 6: Game scene (offline with the mock)

Tasks
1. `ArenaView`: build from seed with shared `generateArena({seed, round, platformCount, islandTiles, symmetric: mirror, players, powerSpots})`. Draw island tiles (6 x 100 px, rounded rect with 3 to 4 px ink outline, hard shadow), floating platforms, sky gradient, clouds, sun/moon orb, stars for night themes, danger glow at screen bottom. Generate textures with Phaser Graphics once per round (no image files). Cache generated textures by theme+size.
2. `PlayerView`: squircle body (corner radius 32 %), 3 to 4 px ink outline, eyes and mouth (face facing direction, blink), name and damage % above head (ramp: under 30 % white, 30 to 60 % orange `#FF9F1C`, above 60 % red `#FF4D4D`; number always shown), local player yellow arrow marker, held-item icon, bomb icon + fuse ring (red arc), crown icon, shield bubble (`--mp-shield`), frozen tint, scale from twists, color-blind marker (distinct small shape or hat per player index; see Step 9). Names font minimum 12 px logical.
3. `CrateView` / power spots: spot marker with beacon rings and "3, 2, 1" countdown (3 s before drop), crate sprite with item icon (or "?" before pickup as in product figure 6.1), expiry blink in last 3 s.
4. `BombView`, `CrownView`, crumbling tile blink (about-to-fall `#FF6B6B`) then fall, wind streaks, lights-out overlay (single draw per frame, light circles radius 120, 170 for local), size lottery scaling, ice tint on platforms (`#C8F0FF` / `#D7F5FF`, edge `#8FD0EA`), trampoline floor (`#FF9DBB` / `#E0668C`).
5. DOM HUD (`Hud.tsx`, absolutely positioned over the canvas, scaled with the canvas): top-left round chip and mode chip; top-center timer (updates once per second) and twist chips; top-right scoreboard (round totals or crown seconds in Crown Rush; rows sorted, leader highlight, local row highlighted); left event feed (last 4 lines, fade after 2.6 s, `aria-live="polite"`); bottom hint text for spectators; ping badge; mute button; Lucide icons.
6. Round intro overlay: round title, mode rules sentence, twist cards locking one by one (stagger), "Pappu picked X for being in last place" line when `pickedBy` provided.
7. Rendering: Update views from the interpolated snapshot each frame; avoid per-frame allocations; object pools for particles and feed lines.
8. Match screenshots 04 to 08 side by side with the running scene (visual QA checklist in `docs/visual-qa.md`).

Check: a full round plays against mock bots and looks like screenshots 04 to 08.

### Step 7: Netcode

Tasks
1. `inputSender.ts`: read keyboard/touch into a 4-bit mask; send `{seq, bits}` when bits change, plus heartbeat every 100 ms; cap 60 msg/s; `seq` increments per send (uint16 wrap). Keep a ring buffer of `{seq, bits, tick}` for reconciliation. Use `event.code` (frontend-spec s6): move `KeyA`/`KeyD`/`ArrowLeft`/`ArrowRight`, jump `KeyW`/`ArrowUp`/`Space`, shove `KeyE`/`ShiftLeft`/`KeyJ`, pick `Digit1..3`, mute `KeyM`. Handle blur/visibilitychange by releasing all keys.
2. `prediction.ts`: run shared `step()` on the **local player only** at fixed 30 Hz using a fixed-timestep accumulator (render at 60 fps, interpolate the local view between the last two predicted ticks). Remote players in the predicted world are held at their latest server position (do not simulate their knockback on our client). On each server snapshot: set local player to server state, drop acked inputs (`ackSeq`), replay unacked inputs. Correction smoothing over ~100 ms; snap if error > 100 px. Expect a mismatch source: the sim treats other players as collidable/shoveable; document that prediction ignores interactions with remote players (shoves and blasts are server-driven per spec).
3. Shoves and blasts: play shove animation instantly on button press; apply no knockback to others locally; apply received knockback only via server state.
4. `interpolation.ts`: snapshot buffer (last ~10) with server timestamps; render remote players at `now - 100 ms`; interpolate between two snapshots; if late, extrapolate max 100 ms then hold. Clock sync: estimate server-time offset from patch timestamps with smoothing; keep it separate from game logic.
5. Events: typed bus mapping `ko`, `bomb_pass`, `crown_steal`, `pickup`, `toast` (+ added types in section 13) to effects, sounds, feed lines.
6. Cosmetic time effects: hit-stop 70 ms (120 ms Mega Shove) by freezing **rendering/animation time**, not the sim or the network stream (snapshots keep buffering); slow motion 0.25x on the final knockout recovering over ~0.5 s applied to render time scale; screen shake 5 to 18 px decaying. All gated by reduce-motion.
7. Ping: use SDK ping or an app-level `ping/pong` if the backend exposes one (confirm; add to backend spec if needed). Show corner badge; warn above 150 ms.
8. Visibility: on `hidden` stop Phaser rendering (`game.loop.sleep()` or equivalent in Phaser 4 docs), keep the socket alive, and on `visible` clear buffers and resync from the next state.
9. Network test harness: `mockServer.setLatency(150, 0.05)` and a Playwright run with Chrome DevTools Protocol network throttling against the real server later.

Check: throttled to 150 ms ping and 5 % packet loss, local player feels instant, remotes are smooth, no rubber-banding larger than ~100 ms (log max correction magnitude; assert in an automated mock-latency test).

### Step 8: Round flow and effects

Tasks
1. Phase-driven UI: intro with twist reveal, pick overlay (cards with emoji/icon, number badge 1 2 3, keys and tap, 10 s countdown ring; vote mode: counts per card; non-pickers see "X is picking" with their avatar), results (rows with color dot, name, `+pts`, total; local row highlighted; shows after server `round_end` event), final (winner in display font, standings, Rematch and Leave).
2. Rematch: sends `rematch` (see section 13) and returns to lobby/intro when the server resets; Leave returns to landing and clears the room session.
3. Per-round theme changes: on `round:start` with new `themeId`, ThemeManager cross-fades over 0.4 s.
4. All 13 twists visual: Moon Gravity (floaty particles), Heavy Boots (dust), Tiny/Big/Lottery (scale tween on round start), Reversed (control icon flip hint), Ice (ice tint), Turbo (speed lines), Flappy (wing icon on jump), Crumbling (tile blink then fall), Gale Force (wind streaks, direction arrow from server flag), Lights Out (overlay), Trampoline (bounce squash).
5. Particle system: pooled, hard cap 300 alive, presets per theme (`sparkle`, snow, embers, confetti). Explosions and Lights Out obey the 3-flashes-per-second rule via a global `flashLimiter`.
6. Audio: synthesized blips (square/triangle/sawtooth) for jump, shove, hit, ko, bomb tick/explode, pickup, crown, pick, win; no sound before the first gesture; one looping track per theme is a later pack. Visual cues for important sounds (product 11.4 subtitles): bomb ring pulse, crate spawn beacon.
7. Toasts: host changed, player joined/left, AFK warning ("You will be replaced by a bot in 15 s"), kicked.

Check: a 5-round match runs start to finish against the mock (then real server) with every phase screen shown correctly.

### Step 9: Mobile, accessibility, performance

Tasks
1. Touch controls (`TouchControls.tsx`): four buttons (left, right, jump, shove) at least 48 px (target 64 px), Pointer Events with multi-touch (separate pointer ids), `touch-action: none`, `user-select: none`, `overscroll-behavior: none` (no pull-to-refresh), haptic tap via `navigator.vibrate` where supported, safe-area insets. Left cluster move, right cluster jump + shove; optional one-handed layout later.
2. Orientation: landscape for gameplay; show a "rotate your phone" hint in portrait during play; menus work in portrait.
3. Audio unlock on first pointer/key event; persistent mute; `M` key.
4. Reduce motion: setting + `prefers-reduced-motion` disable title wave, shake, slow motion, big bursts, intro animations (use fades).
5. Flash safety: `flashLimiter` caps at 3 per second across explosions, crown glow, lights-out flickers.
6. Color-blind marks: each of 8 player colors gets a distinct small shape or hat (e.g. circle, triangle, square, star, diamond, heart, cross, hex) drawn on the body and in the scoreboard; names and damage numbers always shown.
7. Screen readers: labels and focus order for all DOM controls, visible focus ring `--mp-grape` (3 px), live region for event feed, `role="dialog"` for overlays with focus trap, `prefers-contrast` check, text min 12 px canvas / 14 px DOM, text scale setting (100/115/130 %).
8. Performance: Chrome profiler on a low-end Android (or 4x CPU throttle) targeting 60 fps; DPR cap 2; no DOM rebuild per frame; pooled objects; one dark overlay draw; measure bundle with `rollup-plugin-visualizer`; set a budget in CI (suggested starting point: JS <= 450 KB gzip including Phaser, fonts <= 150 KB, initial interactive < 3 s on throttled 4G; adjust after measuring, and consider a custom/trimmed Phaser build if over budget).
9. Background tab handling done in Step 7; verify on iOS Safari and Chrome Android.
10. Rebinding keys: later (store schema reserved).

Check: low-end Android holds ~60 fps; all buttons >= 48 px; section 6 accessibility checks pass (axe-core run on each screen + manual keyboard walkthrough).

### Step 10: Ads, analytics, install

Tasks
1. `ads.ts`: interface `{ showBanner(slot), hide(), showRewarded(): Promise<boolean> }` with a no-op default and a consent hook (`consent.ts` exposing `getConsent()`/`onChange`). Slots only on Landing (below the name box, never adjacent to Play/Create), Lobby (side rectangle), Results (rectangle). Reserve fixed-size containers to avoid layout shift. Automatically call `hide()` on entering `play` and `pick`/`intro` for safety.
2. Test: a Vitest + Playwright test asserting no ad container is visible/in the DOM when `phase === 'play'`, across mock phase transitions (gate).
3. `track.ts`: `track(event, props)` with events `room_created, player_joined, match_started, match_finished, share_clicked, ad_viewed` (plus `round_length`, `rage_quit` suggested by product s11.5); batched via `navigator.sendBeacon` to the future `POST /events` endpoint; disabled when `VITE_ANALYTICS_ID` is empty; no personal data (no names).
4. PWA: manifest (name, icons maskable 192/512, display `standalone`, orientation `landscape` hint), service worker caching app shell and fonts (Workbox/vite-plugin-pwa), offline shell page explaining multiplayer needs a connection.
5. Open Graph / Twitter tags and an OG image; for `/r/:code` links, static OG (server-side per-code tags not needed). Verify previews in WhatsApp/Discord.
6. Credits page (`/credits`) listing fonts (OFL), Lucide (ISC), emoji pack (Noto OFL/Apache or Twemoji CC BY 4.0 attribution), audio packs if any. Privacy Policy and Terms links in footer (pages come from the M3 milestone in product spec).

Check: ads provably hidden in `play` (test); share links show a proper preview.

---

## 6. Prediction and netcode design notes

- Fixed 30 Hz sim step; render loop independent (60 fps). Local view position = lerp between last two predicted ticks.
- Reconciliation algorithm per server snapshot:
  1. Find `ackSeq` for local player; discard buffered inputs with seq <= ack.
  2. Set predicted state := server state for local player at server tick T.
  3. Replay remaining inputs through shared `step` (remote players frozen) up to the current predicted tick.
  4. `err = newPred - oldPred`; if `|err| > 100 px` snap; else add to a smoothing offset decaying to zero over ~100 ms.
- Because the server also applies input one tick after receipt, compute the number of ticks ahead from RTT/2 only for display statistics; the replay method does not need explicit tick alignment as long as inputs carry their local tick index. If drift appears, send the client tick in a later protocol version (not in the 8-byte payload now).
- Remote interpolation delay 100 ms; if snapshot interval is 50 ms (20 Hz) keep at least 2 snapshots in buffer; adapt delay up to 150 ms under jitter, clamped.
- Knockback-related changes to the local player (being shoved, blast, bounce from items like Swap/Freeze) always come from the server; prediction suppresses its own prediction for ~one RTT after a stun or freeze flag appears to avoid fighting the server.
- Item pickups and crown/bomb changes are not predicted; the crate disappears when the server says so (optionally a local "ghost" fade-out on touch).

---

## 7. Visual QA and asset checklist

| Item | Source | Check |
|---|---|---|
| Fonts | Bagel Fat One 400, Nunito 700/900 | woff2, preload, no layout shift |
| Colors | tokens in spec s3, product s8.2 | token diff test against shared themes |
| Themes (7) | shared `themes.ts` | all 8 player colors readable on each sky (automated contrast report) |
| Screens | screenshots 01 to 10 (real), 11 to 14 (mockups) | side-by-side review per screen |
| Icons | Lucide for UI; Noto Emoji/Twemoji for game icons | consistent across devices (no system emoji fallback) |
| Sound | synthesized | unlock after first gesture; mute persisted |
| Motion | spec s6 | reduce-motion honored everywhere |

Game icon map (from product 8.3): modes 🥊 brawl, 💣 bomb, 👑 crown; items 💥 mega, 🧊 freeze, 🔀 swap, 🛡️ shield; twists 🌙 low, ⚓ heavy, 🐭 tiny, 🦣 giant, 🎲 lotto, 🙃 reverse, 🧊 ice, ⚡ speed, 🐦 flap, ⚫ crumble (hole), 💨 wind, 🔦 dark, 🦘 bounce. Replace with sprite assets in the build step so every device shows the same artwork.

---

## 8. Testing strategy

| Layer | Tool | What |
|---|---|---|
| Pure logic | Vitest | input bitfield, name validator, schema-to-field mapping, prediction reconcile math, interpolation buffer, ThemeManager token output, flash limiter |
| Component | Vitest + Preact testing | Landing validation, Lobby states, SettingsForm clamping, Pick overlay keyboard |
| Mock integration | Vitest | full match against `mockServer` reaches `final`; reconnect state resolves |
| E2E | Playwright (two contexts) | A creates room, B joins by link, both ready, host starts, round plays, one drops and returns; run with `VITE_MOCK=1` first, then against the real server when available |
| Visual | Playwright screenshots | key screens x 3 themes at 360 px and 960 px widths |
| Accessibility | axe-core in Playwright | each screen; focus order; contrast |
| Perf | Lighthouse CI + manual device | bundle budget, TTI on throttled 4G, 60 fps on low-end Android |
| Ads | Vitest + Playwright | no ad node visible during `play` |

---

## 9. Definition of done (from frontend-spec s10)

1. New player goes from opening a link to playing in under 15 seconds on a phone.
2. A full 5-round match works on the real server with all three modes and all twists.
3. Local movement feels instant; remote movement smooth at 150 ms ping.
4. Every screen matches the mockups and tokens, in all 7 themes.
5. Section 6 accessibility checks pass; no ad ever shown during play.
6. `pnpm test` passes and `pnpm build` meets the bundle budget.

---

## 10. Dependencies on the backend plan

| Frontend need | Backend plan reference |
|---|---|
| `packages/shared` published as workspace package (sim, arena, settings schema, themes, bots, constants) | Backend Step 1 and Step 2 |
| Join by code with generic errors and session token | Backend Step 3 |
| `settings` broadcasts, `round:start`, phases, picker flow | Backend Step 4 |
| Events (`ko`, `bomb_pass`, `crown_steal`, `pickup`, `toast` + additions) | Backend Step 5 |
| `ackSeq` per player in state | Backend s3.2 |
| Reconnect (30 s), AFK warnings, host migration toast | Backend Step 6 |
| Real server for exit-gate tests (Steps 7 and 8) | Backend Steps 3 to 6 done; until then use mock |

Parallel work plan: Frontend Steps 1 to 6 need only shared (Backend Steps 1 and 2) and the mock. Start Frontend Step 7 against the mock; switch to the real server once Backend Step 5 is passing.

---

## 11. Suggested work order and rough sizing

| Step | Rough effort (1 dev) |
|---|---|
| 1 scaffold | 1 to 2 days |
| 2 design system + ThemeManager | 4 to 5 days |
| 3 landing and name | 2 to 3 days |
| 4 connection layer + mock server | 5 to 6 days |
| 5 lobby + create room (full settings form) | 6 to 8 days |
| 6 game scene | 8 to 10 days |
| 7 netcode | 5 to 6 days |
| 8 round flow + effects | 6 to 8 days |
| 9 mobile, a11y, performance | 5 to 6 days |
| 10 ads, analytics, install | 3 to 4 days |

Consistent with product roadmap M1 and M2 (5 to 7 and 4 to 6 weeks at 10 to 12 h/week) only if backend and frontend are worked in parallel by separate agents; a single developer should expect more.

---

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Phaser 4 API differs from Phaser 3 examples | read Phaser 4 docs/migration notes per task; keep Phaser calls inside `game/` |
| Bundle too large (Phaser) | measure early (Step 1), consider custom build/feature flags, lazy-load the game scene and settings form |
| Prediction disagrees with server sim | reuse shared `step`, golden tests, simplest prediction (local player only), smoothing + snap threshold |
| Low-end Android fps | pools, capped particles, single overlay draw, DPR cap, profile every step from Step 6 |
| Emoji differences across devices | use Noto/Twemoji sprites from the start (Step 2) |
| Settings form drifts from schema | generate fields from the shared Zod schema; test that every schema key is covered by a field |
| Ads accidentally visible during play | enforced by phase hook + automated test |

---

## 13. Alignment notes: gaps and conflicts between the documents

Decisions proposed here; confirm or overrule.

| # | Finding | Proposed resolution |
|---|---|---|
| 1 | Product spec s9.1: "vanilla Canvas 2D, optional Phaser 3"; frontend-spec: Phaser 4 pinned 4.2.x | Follow frontend-spec (Phaser 4). Verify the exact 4.2.x release exists and its API before pinning |
| 2 | Product s9.3 lists a `vote` message; backend-spec uses `pick {index}` for picker and voter | Client sends `pick` only |
| 3 | Frontend needs `round_end`, `match_end` data and a rematch action; backend-spec s4 has no such messages | Use `event` types `round_end`, `match_end`; add a `rematch` message (host or vote). Mirror in backend plan s12 |
| 4 | Reconciliation needs the server's last processed `seq` | Backend adds `ackSeq` per player |
| 5 | Effects need cues beyond five events (`shove_hit`, `bomb_explode`, `crate_spawn`, `afk_warn`) | Backend adds these free-form event types; client ignores unknown events safely |
| 6 | Round time chooser: mockup shows Auto/45s/60s/75s; schema allows `auto` or 30 to 120 | Show the four mockup options plus "Custom" |
| 7 | Scoring setting (`standard`, `winner_plus`, `kills`) exists in schema but not in mockup 12 | Show as a segmented control under A; hide behind "Advanced" if the mockup must be matched exactly |
| 8 | Product s4.2 settings not in backend-spec (`minPlayersToStart`, `respawn.where`, `room.allowKick`, hazards) | Render only fields present in the shared schema; add the first three once backend adds them |
| 9 | Demo shows "Watching at 2.5x speed" for eliminated players | Treat as client-side render speed only; confirm with design whether to keep |
| 10 | Pick timer: demo shows auto-pick in 7 s; spec says 10 s | Use server-driven countdown (10 s); render whatever `timeLeft` says |
| 11 | Frontend-spec s1 lists Lucide + Noto/Twemoji "check licenses"; Twemoji needs CC BY 4.0 attribution | Prefer Noto Emoji (Apache/OFL) to minimize attribution work; Credits page either way |
| 12 | Frontend-spec s4: "Send when bits change plus 100 ms heartbeat"; backend rate limit 60/s | Cap at 30/s in practice (bits change at most ~15 times/s for human input); hard cap 60 |
| 13 | Ad rules: product says banner on landing not next to Create/Join; frontend slots on landing, lobby, results | Place landing banner below the code-join row with a spacer; verify in layout test |
| 14 | Frontend step 3 "returning player skips straight to the lobby flow" is ambiguous | Interpret as: no name prompt when saved; Landing still offers Create/Join with edit-name link |
