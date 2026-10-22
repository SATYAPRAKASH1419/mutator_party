# Mutator Party: Frontend Spec (for the coding agent)

Short, step-wise, mobile-first, low latency. Build in the order given. Do not start a step until the previous step's acceptance checks pass. This spec pairs with `backend-spec.md`; message names and settings keys must match it exactly.

## 0. What you are building

The browser client for **Mutator Party**: a party game for 2 to 12 players with about 60 second rounds. Players enter a name, join a room by code or link, and play on a phone or a laptop. The server is authoritative. The client sends inputs, predicts only the local player, and draws what the server says.

**Inputs you will be given (attach these):**
- `mutator-party-v2.html`: the working offline demo. It is the reference for look, feel, HUD and effects. Port the visuals and effects; do not redesign them.
- `screenshots/` folder (from the docs bundle): real game screens `01` to `10`, and UI mockups `11` (name screen), `12` (create room), `13` (lobby), `14` (themes).
- `backend-spec.md`: messages, settings schema, phases.
- `packages/shared` (from the backend task): game rules, arena generator, settings schema, constants. **Import it; never copy it.**

**Non-goals for now:** accounts, shop, free-text chat, replays, desktop app.

## 1. Stack (fixed)

| Part | Choice |
|---|---|
| Language and build | TypeScript (`strict`), Vite |
| Game rendering | Phaser 4, pin an exact 4.2.x version. No Phaser plugins at first. |
| Menus, lobby, settings, HUD | DOM (HTML and CSS) with Preact (or plain TypeScript). Not drawn inside Phaser. |
| Network | Colyseus client SDK 0.18.x (follow https://docs.colyseus.io; do not guess APIs) |
| Validation | the shared Zod schema from `packages/shared` |
| Icons | Lucide (UI icons) and Noto Emoji or Twemoji sprites (game icons); check licenses, keep a `CREDITS` page |
| Fonts | Bagel Fat One (display) and Nunito 700 and 900 (body), self-hosted `.woff2` |
| Tests | Vitest (pure logic), Playwright (two-browser smoke test) |

```text
apps/client/
  index.html
  src/
    main.ts              boot, router (/ and /r/:code), screen switching
    net/                 connection.ts, mockServer.ts, inputSender.ts, interpolation.ts, prediction.ts
    game/                GameScene.ts, ArenaView.ts, PlayerView.ts, effects.ts, audio.ts, theme.ts
    ui/                  Landing, CreateRoom, Lobby, Hud, Pick, Results, Final, Toasts, Banner (Preact)
    ads/                 ads.ts (interface plus no-op), consent.ts
    util/                storage.ts, track.ts, device.ts
    styles/              tokens.css, base.css
```

**Rule 1:** all game rules and numbers come from `packages/shared`. The client never invents a rule.
**Rule 2:** Phaser draws the world only (arena, players, crates, effects). Everything with text, forms or buttons is DOM.
**Rule 3:** every screen works with a mock server (section 7) so the UI can be built before the backend is ready.

## 2. Screens

| Screen | Route | Content |
|---|---|---|
| Landing | `/` | Name box with random-name dice, color picker (8 colors), Create a room, Join with code. Mockup `11`. |
| Join link | `/r/KPQ7X` | Same as landing, but joins that room after the name is saved. |
| Create room | modal or page | Sections A to H of the settings (match, arena, modes, hurdles, respawn, items, theme, room). Presets: Classic, Chaos Party, Tournament, Chill. Mockup `12`. |
| Lobby | in room | Room code, Copy link, WhatsApp share, players with ready flags, bot slots, rules summary, Edit rules (host), Start (host), emotes. Mockup `13`. |
| Game | in room | Phaser canvas plus DOM HUD. |
| Pick twist | overlay | 3 cards, keys 1 2 3 or tap, 10 s countdown. Only the picker sees the choice; others see "X is picking". |
| Round results and Final | overlay | Standings and points. Rematch and Leave buttons on Final. |
| Error states | banner or modal | Wrong code, room full, kicked, connection lost, reconnecting. |

**Name rules (client side, for instant feedback only; the server decides):** 2 to 16 characters, letters, digits, space, `_ - '`. Show a hint, "Please do not use your real full name."

## 3. Design system ("Sticker Pop")

Define in `tokens.css` as CSS variables. Phaser reads the same values from the active theme object.

| Token | Hex | Use |
|---|---|---|
| `--mp-ink` | `#1B1B3A` | all outlines, text on light panels |
| `--mp-paper` | `#FFF8E7` | panels and cards |
| `--mp-butter` | `#FFF3D6` | page background (light) |
| `--mp-night` | `#17172E` | page background (dark mode) |
| `--mp-muted` | `#55557A` | secondary text |
| `--mp-sun` | `#FFC93C` | primary buttons, selected state |
| `--mp-mint` | `#3DDC97` | on, ready, success |
| `--mp-coral` | `#FF6B6B` | danger, out |
| `--mp-grape` | `#8B5CF6` | badges, focus ring |
| `--mp-danger` | `#FF4D4D` | high damage, bomb ring |
| `--mp-shield` | `#7DD3FC` | shield bubble |

Player colors, in order: `#FF6B6B`, `#3DDC97`, `#8B5CF6`, `#FFC93C`, `#4CC9F0`, `#FF9F1C`, `#F15BB5`, `#2EC4B6`.

Shape rules: 3 to 4 px ink outline on every shape; hard shadow offset (6 px, 7 px) with no blur; panel radius 18 px; chips and buttons are full pills; player body is a squircle (corner radius 32 percent). Fonts: display Bagel Fat One 400; body Nunito 700 and 900. Support light and dark page backgrounds.

**Themes:** 7 theme objects come from `packages/shared` (`sunny`, `neon`, `candy`, `frozen`, `desert`, `space`, `diwali`). A `ThemeManager` applies one: sets the CSS variables for DOM and updates the Phaser sky, floor, platform and particle colors. On a round change with a new theme, cross-fade over 0.4 s. Keep the ink color the same in every theme.

## 4. Client networking (low latency)

| Topic | Rule |
|---|---|
| Connection | Connect with the Colyseus SDK. Use its automatic reconnection (30 s window). Store `playerId` and the session token in `localStorage`. |
| Input send | Send `{ seq, bits }` (left 1, right 2, jump 4, shove 8) **when bits change**, plus a heartbeat every 100 ms. Never more than 60 messages per second. |
| Local player | **Predict** movement and jumps with the shared `step()` at the same fixed 30 Hz. Keep a buffer of unacknowledged inputs; on each server state, rewind to the server position and replay the buffer. Smooth any correction over about 100 ms; snap if the error is above 100 px. |
| Shoves and blasts | Do **not** predict knockback on other players. Play the shove animation instantly, but move players only from server state. |
| Remote players | Render about 100 ms in the past and interpolate between two server snapshots. If a snapshot is late, extrapolate for at most 100 ms, then hold. |
| Events | Server events (`ko`, `bomb_pass`, `crown_steal`, `pickup`, `toast`) trigger effects, sounds and the feed. |
| Cosmetic time effects | Hit-stop (70 ms, 120 ms for Mega Shove), slow motion on the final knockout, and screen shake are **client only** and must never change the simulation. |
| Ping | Show ping in a corner. Warn above 150 ms. |
| Visibility | When the tab is hidden, stop rendering and keep the socket alive. On return, resync from the next state. |

Targets: input to visible effect for the local player under 16 ms (prediction); remote movement smooth at 60 fps on a mid-range phone.

## 5. Rendering and performance

- Canvas logical size 960 x 540 (16:9). Phaser scale mode FIT, centered. Device pixel ratio capped at 2. Landscape layout.
- Build the arena from the **seed** with the shared generator (no arena data over the network). Draw platforms, players and crates as generated textures or Graphics objects; no large image files are required.
- Particles: pooled objects, hard cap 300 alive. Max one dark-overlay draw per frame (Lights Out).
- Update the DOM HUD only when a value changes (timer once per second, scoreboard on events). Never rebuild DOM at 60 fps.
- Target 60 fps on a low-end Android phone. Measure initial load, set a bundle budget in CI, and aim for interactive in under 3 s on 4G.
- Show a loading screen, then the landing screen. Avoid layout shift: reserve fixed sizes for ad slots and fonts.

## 6. Input, mobile and accessibility

| Area | Rule |
|---|---|
| Keyboard | Use `event.code` (position-based): move `KeyA`/`KeyD` or arrows, jump `KeyW`/`ArrowUp`/`Space`, shove `KeyE`/`ShiftLeft`/`KeyJ`, pick twist `Digit1` to `Digit3`, mute `KeyM`. Allow rebinding later. |
| Touch | On-screen buttons: left, right, jump, shove. At least 48 px, pointer events with multi-touch, no text selection, no pull-to-refresh, haptic tap where supported. Respect safe-area insets. |
| Audio | Start sound only after the first tap or key press. Mute button visible; remember the choice. Synthesized blips as the default; a sound pack can replace them later. |
| Reduce motion | Setting plus `prefers-reduced-motion`: turns off title wave, screen shake, slow motion and big bursts. |
| Flash safety | No more than 3 flashes per second, including explosions and Lights Out. |
| Color-blind safe | Never rely on color alone: show names and damage numbers, and give each player a distinct small shape or hat. |
| Screen readers | Proper labels and focus order for all DOM controls. Visible focus ring using `--mp-grape`. Live region for the event feed. |
| Text size | Minimum 12 px on the canvas, 14 px in the DOM, scalable. |

## 7. Mock server (build this first)

`mockServer.ts` implements the **same interface** as the real connection (join, settings, phases, input, state, events) and runs the shared simulation locally with bots. It lets you build and test every screen and the full game loop before the backend exists, and it stays useful for tests and demos. A single flag (`?mock=1` or an env variable) switches between mock and real.

## 8. Build steps (do in order)

Each step ends with something runnable. Commit after each step.

### Step 1: Scaffold
- Vite plus TypeScript, Preact, Phaser 4, lint, Vitest. Folder layout from section 1. Import `packages/shared`.
- **Done when:** `pnpm dev` shows an empty Phaser canvas inside the page, and a shared constant imports without errors.

### Step 2: Design system
- `tokens.css`, fonts, buttons, panels, chips, toggles, steppers, segmented controls (match the mockups). `ThemeManager` with the 7 themes.
- **Done when:** a style-guide page shows every component in all 7 themes and in light and dark mode.

### Step 3: Landing and name
- Name box with validation hints, dice for a random name, color picker, Create a room, Join with code, route `/r/:code`. Save name, color and `playerId` in `localStorage`.
- **Done when:** a returning player skips straight to the lobby flow with the saved name, and the layout works at 360 px width.

### Step 4: Connection layer
- Real connection plus mock server behind one interface. Error states: wrong code, room full, kicked, connection lost, reconnecting.
- **Done when:** with the mock, create and join a room, drop the connection, and see the reconnect state resolve.

### Step 5: Lobby and Create Room
- Full settings form (sections A to H) built from the shared Zod schema, presets, host-only editing, read-only summary for guests, ready flags, Start button, copy link, WhatsApp share (use the Web Share API on phones).
- **Done when:** the host edits a setting, every client sees it update, and invalid values are clamped to what the server returns.

### Step 6: Game scene (offline with the mock)
- Build the arena from the seed, draw players with names and damage percent, crates and power spots (with the 3 second beacon), bomb ring, crown, shield bubble, DOM HUD (round, mode chip, twist chips, timer, scoreboard, event feed).
- **Done when:** a full round plays against mock bots and looks like the screenshots `04` to `08`.

### Step 7: Netcode
- Input sender, prediction with reconciliation, remote interpolation, event handling, ping display.
- **Done when:** on a throttled connection (150 ms ping, 5 percent packet loss) your own player feels instant and others move smoothly, with no visible rubber-banding larger than about 100 ms.

### Step 8: Round flow and effects
- Intro with twist reveal, pick overlay, results, final, rematch. Hit-stop, slow motion, shake, particles, per-round theme changes, all twists visual (Lights Out overlay, wind streaks, crumbling tiles, size changes).
- **Done when:** a 5 round match runs start to finish against the real server (or mock) with every phase screen shown correctly.

### Step 9: Mobile, accessibility, performance
- Touch controls, safe-area handling, reduce motion, color-blind marks, focus rings, audio unlock, background-tab handling.
- **Done when:** a low-end Android phone holds about 60 fps, all buttons are at least 48 px, and the checks in section 6 pass.

### Step 10: Ads, analytics, install
- `ads.ts` with an interface (`showBanner(slot)`, `hide()`, `showRewarded()`), a no-op default and a consent hook. Ad slots only on landing, lobby and results; **never visible during play**. `track()` for events (`room_created`, `player_joined`, `match_started`, `match_finished`, `share_clicked`, `ad_viewed`). PWA manifest and offline shell. Open Graph image and title for link previews.
- **Done when:** ads are provably hidden in the `play` phase (test), and share links show a proper preview.

### Later (do not build yet)
- Accounts, cosmetics shop, public room list, replays and clips, gamepad support, more themes, localization (Hinglish and Hindi).

## 9. Configuration

| Variable | Meaning |
|---|---|
| `VITE_SERVER_URL` | WebSocket URL of the game server |
| `VITE_MOCK` | `1` to use the mock server |
| `VITE_ANALYTICS_ID` | Analytics site id (empty disables) |
| `VITE_ADS_ENABLED` | `0` or `1` |

## 10. Definition of done (whole client)

1. A new player goes from opening a link to playing in under 15 seconds, on a phone.
2. A full 5 round match works on the real server with all three modes and all twists.
3. Local movement feels instant and remote movement is smooth at 150 ms ping.
4. Every screen matches the mockups and tokens, and works in all 7 themes.
5. Section 6 accessibility checks pass; no ad is ever shown during play.
6. `pnpm test` passes and `pnpm build` meets the bundle budget.
