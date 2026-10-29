# Mutator Party: UI, UX, and Performance Comprehensive Audit Report

> **Document Version:** 1.0.0  
> **Date:** October 2026  
> **Scope:** Full audit of `docs/` specifications, architecture plans, reference benchmarks, and frontend/shared implementations.  
> **Source Documents Analyzed:**
> - `docs/reference/mutator-party-spec.md` (Product, Design & Build Master Specification)
> - `docs/reference/frontend-spec.md` (Frontend Client Technical Specification)
> - `docs/reference/backend-spec.md` (Backend Authoritative Specification)
> - `docs/reference/frontend-implementation-plan.md` (Client Implementation Architecture)
> - `docs/reference/backend-implementation-plan.md` (Server Implementation Architecture)
> - `docs/reference/FRONTEND_BACKEND_CONNECTION_GUIDE.md` (Network Protocol & State Flow)
> - `docs/reference/work/PROGRESS.md` & `docs/perf.md` (Benchmarks & Milestone Status)
> - `docs/reference/work/SHARED_SRC_MAINTAINER_GUIDE.md` (Physics & Simulation Rules)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Documented Prototype Bugs & Gameplay Balance Deficiencies](#2-documented-prototype-bugs--gameplay-balance-deficiencies)
3. [UI Design System & Visual Gaps ("Sticker Pop")](#3-ui-design-system--visual-gaps-sticker-pop)
4. [UX, Interaction Flow & Player Journey Issues](#4-ux-interaction-flow--player-journey-issues)
5. [Accessibility (a11y) & Inclusive Design Issues](#5-accessibility-a11y--inclusive-design-issues)
6. [Performance, Memory & Netcode Bottlenecks](#6-performance-memory--netcode-bottlenecks)
7. [Spec vs. Current Implementation Discrepancy Matrix](#7-spec-vs-current-implementation-discrepancy-matrix)
8. [Actionable Remediation Plan & Priority Roadmap](#8-actionable-remediation-plan--priority-roadmap)

---

## 1. Executive Summary

This report provides an exhaustive audit of all **UI (User Interface)**, **UX (User Experience)**, and **Performance** issues, bugs, and improvement opportunities discovered across the entire `docs/` documentation suite and the corresponding codebase.

The Mutator Party specifications define a high-standard, mobile-first, zero-friction browser party brawler (60-second rounds, instant URL joins, 60 fps gameplay on low-end hardware). While the backend architecture and shared physics simulation have achieved high performance (under 4 ms p99 tick time for 100 concurrent rooms in `docs/perf.md`), **critical gaps, UI/UX bugs, and performance traps exist** between the design specifications, the legacy prototype observations, and the current frontend implementation.

### Key Audit Findings at a Glance
- 🔴 **Critical UI/UX Discrepancies**: Missing in-game Event Feed (Rule 2 / Section 8.6), keyboard navigation broken on non-QWERTY layouts (`e.key` vs `e.code`), unhandled lookalike characters in room codes (`0, O, 1, I, L`), missing privacy disclaimer, and no color-blind accessory markers.
- 🟡 **Gameplay Feel & Balance Flaws**: Original prototype suffered from 80% premature round collapse (Brawl rounds ending in 11.8s instead of 45-60s) due to excessive knockback scaling, suicidal bot pathfinding, and bomb pass recoil.
- ⚡ **Performance & Architectural Traps**: Per-frame GC allocations inside Canvas 60 fps loops (`ctx.createRadialGradient`), DOM re-rendering thrashing on 30 Hz state updates, absence of particle object pooling, and missing background-tab resource throttling.

---

## 2. Documented Prototype Bugs & Gameplay Balance Deficiencies

The reference specification (`mutator-party-spec.md`, Section 2.3 & 2.4) explicitly identifies fundamental bugs and physics balance failures in the original v2 demo that directly impact UX and gameplay pacing:

### 2.1 Severe Round Collapse (Premature End Bug)
- **Observed Data**: In headless bot-only simulation tests, rounds terminated far earlier than intended:
  - **Last One Standing (Brawl)**: Averaged **11.8 s** (shortest **3.9 s**) vs. **40–60 s intended target**.
  - **Bomb Tag**: Averaged **9.8 s** (shortest **3.9 s**) vs. **45–75 s intended target**.
  - **Crown Rush**: Fixed at **46.5 s** via timer cap.
- **Root Causes**:
  1. **Excessive Knockback Scaling**: Base shove force $620 + 70 \times \text{hits}$ on a narrow 600 px island caused 1–2 hits to immediately fling players beyond the kill zone ($x < -90$ or $x > 1050$).
  2. **Bomb Pass Lateral Kick**: Passing the bomb imparted a $260\text{ px/s}$ lateral impulse to both the giver and receiver, frequently causing accidental double ring-outs.
  3. **Bomb Explosion Shockwave**: $760\text{ px/s}$ blast velocity within a 260 px radius swept entire bystander clusters off platforms in a single detonation.
  4. **Suicidal Bot AI**: Bots possessed an unmitigated 8% decision chance to pathfind directly off ledges or chase targets over open voids with zero edge-awareness checks.
  5. **No Edge Margin or Ring-Out Grace**: Missing coyote-time floor boundaries or edge bounce bumpers.

### 2.2 Input Key Mapping Bug (International Keyboards)
- **Problem**: Key detection in the legacy prototype evaluated typed character values (`e.key`) instead of physical key codes (`e.code`).
- **UX Impact**: Completely unplayable on French AZERTY, German QWERTZ, or Dvorak keyboards (e.g. `W` on AZERTY maps to physical `Z`, and `A` maps to `Q`).

### 2.3 Cross-Device Emoji Inconsistency & Tofu Bug
- **Problem**: UI icons (modes 🥊 💣 👑, twists 🌙 🧊 ⚡, items 💥 🔀 🛡️) relied on native platform Unicode emoji fonts (`Apple Color Emoji`, `Segoe UI Emoji`, `Noto Color Emoji`).
- **UX Impact**:
  - Older Android devices and low-cost phones render blank rectangles (tofu squares ``).
  - Colors and visual styles clash jarringly with the "Sticker Pop" flat retro theme.
  - Sizing and vertical alignment vary unpredictably across browsers.

### 2.4 Twist Combination Pathology
- **Problem**: Combining extreme mutators caused unplayable round states:
  - `Flappy Mode` + `Moon Gravity`: Resulted in permanent infinite floating beyond screen top.
  - `Heavy Boots` + `Crumbling Floor`: Unforgiving instant fall with zero jump recovery window.
  - `Tiny Tots` + `Gale Force`: Low inertia players immediately blown out of bounds by $170\text{ px/s}$ wind drift.

---

## 3. UI Design System & Visual Gaps ("Sticker Pop")

The design specification (`mutator-party-spec.md` Section 8, `frontend-spec.md` Section 3) details strict aesthetic standards under the **"Sticker Pop"** system. Several gaps remain in the current UI:

### 3.1 Design System Token Violations
- **Ink Color Uniformity Rule**: The dark outline color `--mp-ink: #1B1B3A` must remain identical across all 7 themes. Several components use raw `#000000` or `#17172E` interchangeably for borders, breaking token consistency.
- **Shadow Offset Consistency**: The standard shadow is `--mp-shadow: 6px 7px 0 var(--mp-ink)` with zero blur. Several cards and modals use modern soft CSS shadows (`box-shadow: 0 4px 12px rgba(0,0,0,0.1)`), which violates the retro pop-art paper aesthetic.
- **Pill & Radius Discipline**:
  - Panels: Fixed $18\text{ px}$ radius.
  - Chips / Tags: Fixed $14\text{ px}$ radius.
  - Buttons: Full pill radius ($\text{radius} = \text{height} / 2$).
  - Character Body: Squircle with corner radius equal to $32\%$ of body dimension.

### 3.2 Visual Contrast on Custom Themes
- **Issue**: The 8 player colors (`#FF6B6B`, `#3DDC97`, `#8B5CF6`, `#FFC93C`, `#4CC9F0`, `#FF9F1C`, `#F15BB5`, `#2EC4B6`) have not been audited for contrast against all 7 background themes:
  - Theme `neon` (`#1A1040` sky) and `space` (`#0B1030` sky) cause Grape (`#8B5CF6`) and Teal (`#2EC4B6`) players to blend into the background.
  - Theme `candy` (`#FFF4D6` sky) causes Sun Yellow (`#FFC93C`) players and text badges to fail WCAG AA contrast (ratio $< 3:1$).

### 3.3 Missing In-Game Event Feed (Spec Section 8.6 & Frontend Spec Rule 2)
- **Requirement**: Left side, positioned directly below the mode badge: a 4-line live event feed displaying knockout announcements, bomb passes, crown steals, and item grabs with a $2.6\text{ s}$ fade.
- **Current Bug**:
  - The DOM HUD (`apps/client/src/ui/Hud.tsx`) does not render the Event Feed.
  - `GameCanvas.tsx` attempts to render toasts directly onto the HTML5 Canvas via `txt()`.
  - **Violation of Spec Rule 2**: *"Canvas draws the world only. Everything with text, forms or buttons is DOM."* Canvas text cannot be parsed by screen readers, scaled by browser font sizing, or selected.

### 3.4 Color-Blind Indicators (Hats / Shape Markers)
- **Requirement** (`frontend-spec.md` Section 6, `mutator-party-spec.md` Section 11.4): *"Never rely on color alone: show names and damage numbers, and give each player a distinct small shape or hat."*
- **Current Bug**: In `drawPlayer.ts`, all players are rendered as identical plain squircles with only hex colors differing. Players with deuteranopia or protanopia cannot distinguish between Player 0 (Coral `#FF6B6B`) and Player 1 (Mint `#3DDC97`).

### 3.5 Theme Cross-Fade Transition
- **Requirement** (`frontend-spec.md` Section 3): When moving between rounds with a new theme, cross-fade the visual background and platform fills over $0.4\text{ s}$.
- **Current Bug**: Theme shifts abruptly on the exact tick the new seed/theme is received, causing a visual flash.

---

## 4. UX, Interaction Flow & Player Journey Issues

### 4.1 Onboarding & First-Time User Experience (FTUE)
- **Missing Privacy Notice**: Spec Section 3.1 & 6 explicitly demands: *"Show a hint: 'Please do not use your real full name.' Many players are young."* The current landing screen (`NameInputRow.tsx`) omits this notice.
- **Room Code Character Sanitization UX**:
  - The 31-symbol alphabet excludes look-alikes (`0, O, 1, I, L`).
  - Current input handler in `useLandingForm.ts` accepts all alphanumeric characters (`[^A-Z0-9]`). If a user types `0` or `1`, the client does not warn or auto-map them to `O` or `I`, leading to frustrating "Room Not Found" errors.
- **Direct Link Joining Flow (`/r/:code`)**:
  - Spec Section 3.1: If a user navigates to `/r/KPQ7X` without a stored name in `localStorage`, prompt for name first, then seamlessly transition to room `KPQ7X`.
  - Current client lacks URL route param parsing (`window.location.pathname`) on initial boot, requiring manual code entry.

### 4.2 Lobby Interaction & Host Controls
- **Emote Bubble Saturation**: In `Lobby.tsx`, rapid emote clicking triggers speech bubbles over player pods without debouncing, leading to visual overlap and audio distortion.
- **Unready Host Warning UX**: Host can click "Start Game" while guests are in an unready state. A prompt or visual count ("2 players not ready!") should appear instead of instant start.
- **Host Migration Clarity**: If the host tab closes, the backend migrates host status to the longest-connected human (`backend-spec.md` Section 2.1). However, the client displays no toast or banner notifying the new host of their promoted privileges.

### 4.3 In-Game UX & Mode Feedback
- **Crown Rush Dynamic Scoreboard**: In Crown Rush mode, the scoreboard must switch from "Total Match Points" to "Crown Holding Seconds" (`mutator-party-spec.md` Section 8.6). Currently, `PlayerScoreList.tsx` displays standard match points, leaving players unaware of how close opponents are to winning.
- **Last-Place Twist Selection UX**:
  - During the `pick` phase, only the designated picker should see interactive pick cards. Other players must see a clear countdown overlay: *"Waiting for [PlayerName] to pick a twist..."*.
- **Sudden Death Indicator**: If a round approaches its timer limit ($< 10\text{ s}$) with multiple survivors, the HUD timer pulses, but there is no audio urgency tick or visual arena vignette warning players of the impending timeout.

---

## 5. Accessibility (a11y) & Inclusive Design Issues

Following `frontend-spec.md` Section 6 and `mutator-party-spec.md` Section 11.4:

| Feature | Spec Requirement | Current State | Severity |
|---|---|---|:---:|
| **Flash Safety** | Maximum 3 flashes per second (explosions, crumble warnings, Lights Out). | `crumbleWarnBitmask` tiles blink rapidly at simulation rate; bomb explosion has immediate white flash. | 🔴 High (Seizure Risk) |
| **Reduced Motion** | Honor `prefers-reduced-motion`: disable title bounce, screen shake, slow motion, large particle explosions. | `GameCanvas.tsx` applies unconditional screen shake (`shake = 10` to `20`); CSS title animations ignore `prefers-reduced-motion`. | 🔴 High |
| **Keyboard Accessibility** | All controls navigable via Tab/Enter; movement on `event.code` (`KeyA`, `KeyD`, `KeyW`, `KeyE`, `Digit1`-`3`, `KeyM`). | `useGameInput.ts` binds `e.key` instead of `e.code`; Mute shortcut (`KeyM`) is missing; cards in `PickOverlay` lack keyboard focus outlines. | 🔴 High |
| **Screen Readers** | Proper ARIA roles, labels, and live region for the game event feed (`aria-live="polite"`). | Event feed is rendered onto HTML5 Canvas; action buttons in `TouchControls` lack `aria-label`; code boxes lack `aria-invalid`. | 🟡 Medium |
| **Touch Target Size** | All interactive touch elements $\ge 48\text{ px} \times 48\text{ px}$ with multi-touch hygiene. | Landing dice button is $40\text{ px} \times 40\text{ px}$ (below $48\text{ px}$ minimum standard). | 🟡 Medium |
| **Font Scaling** | Minimum $14\text{ px}$ in DOM, $12\text{ px}$ in Canvas, readable at small scales. | Canvas damage text rendered at $12\text{ px}$ with thick 4 px outline, causing illegible text on high-DPI mobile screens. | 🟡 Medium |

---

## 6. Performance, Memory & Netcode Bottlenecks

### 6.1 Canvas Render Loop Allocation Traps (GC Stutter)
In `GameCanvas.tsx`, the 60 fps `requestAnimationFrame` loop executes several object allocations per frame:
1. **Dynamic Gradient Creation in Lights Out**:
   ```typescript
   // Executed inside for-each player loop every frame!
   const rad = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 125);
   ```
   Allocating radial gradient objects and color stops 60 times a second for 8 players generates **480 gradient allocations per second**, triggering frequent Garbage Collection (GC) pauses on mobile devices.
2. **Radial Cutout Radius Asymmetry**:
   - Spec Section 13.2 specifies: Light circles of radius 120 around other players, and **radius 170 for the local player**.
   - Current code sets a hardcoded radius 125 for all players, failing to provide the local player their visual sight advantage.

### 6.2 Preact DOM Re-Render Thrashing
- **Spec Rule** (`frontend-spec.md` Section 5): *"Update the DOM HUD only when a value changes (timer once per second, scoreboard on events). Never rebuild DOM at 60 fps."*
- **Current Implementation**:
  - `useRoomConnection.ts` listens to `connection.on("state", ...)` arriving at **20–30 Hz**.
  - Every incoming state snapshot triggers `appStore.setState({ gameState })`.
  - This forces a full Preact component re-render of `App.tsx`, `Hud.tsx`, `TimerTwistBar.tsx`, and `PlayerScoreList.tsx` **30 times per second**.
  - **Remediation**: Isolate timer state into a 1 Hz tick hook; throttle scoreboard updates to event triggers or state score changes.

### 6.3 Particle Object Pooling & Cap
- **Requirement** (`frontend-spec.md` Section 5): *"Particles: pooled objects, hard cap 300 alive."*
- **Current State**: Sparkle stars and floating clouds instantiate ad-hoc objects rather than recycling from a fixed typed array or object pool.

### 6.4 Canvas Scaling & Device Pixel Ratio (DPR)
- **Requirement**: Canvas logical resolution $960 \times 540$ (16:9), FIT scale mode, DPR capped at **2.0**.
- **Audit**: `GameCanvas.tsx` correctly enforces `Math.min(window.devicePixelRatio || 1, 2)`. However, when window dimensions change rapidly, canvas buffer dimensions re-allocate on every pixel change without debouncing.

### 6.5 Background Tab Throttling & Re-sync
- **Requirement** (`frontend-spec.md` Section 4): *"When the tab is hidden, stop rendering and keep the socket alive. On return, resync from the next state."*
- **Current State**: Missing `document.addEventListener("visibilitychange")` handler. When backgrounded, `requestAnimationFrame` pauses automatically, but Web Audio sounds and unconstrained input polling timers continue running.

---

## 7. Spec vs. Current Implementation Discrepancy Matrix

| Component / Area | Specification Requirement | Current Implementation | Status |
|---|---|---|:---:|
| **Input Key Binding** | Physical key mapping via `event.code` (`KeyA`, `KeyD`, `KeyW`, `KeyE`, `Digit1-3`, `KeyM`). | Uses `event.key.toLowerCase()` (`"a"`, `"w"`, `"e"`). Broken on non-QWERTY. | ❌ Bug |
| **In-Game Event Feed** | DOM-rendered 4-line feed below mode badge with $2.6\text{ s}$ fade & screen reader region. | Missing from DOM; toasts painted directly on Canvas via `txt()`. | ❌ Bug |
| **Name Privacy Notice** | "Please do not use your real full name" displayed under nickname input. | Completely absent. | ❌ Missing |
| **Room Code Alphabet** | Omit lookalikes (`0, O, 1, I, L`); auto-correct or warn user. | Standard alphanumeric input regex; no correction or validation. | ⚠️ UX Issue |
| **Color-Blind Support** | Distinct shapes / hats / accessory marks per player squircle. | Squircles are identical shapes; distinguished by color only. | ❌ Missing |
| **Local Player Marker** | Yellow arrow indicator bobbing over the local player. | Drawn on canvas, but lacks theme contrast on yellow backgrounds. | ⚠️ Partial |
| **Mute Preference** | Mute button toggle + `KeyM` shortcut; saved in `localStorage`. | State stored in memory only; lost on browser refresh. | ⚠️ UX Issue |
| **Crown Rush Scoreboard**| Display Crown Holding Seconds in Crown Rush mode. | Displays standard match points regardless of mode. | ⚠️ UX Issue |
| **Lights Out Radius** | $170\text{ px}$ radius for local player, $120\text{ px}$ for opponents. | Uniform $125\text{ px}$ radius for all players. | ❌ Bug |
| **Reduced Motion** | Disable shake, slow-mo, bobbing when `prefers-reduced-motion` is active. | No media query check; screen shake fires unconditionally. | ❌ Missing |
| **Flash Safety** | Maximum 3 flashes per second on screen. | Crumble warning red flashes run at unrestrained simulation rate. | ⚠️ Safety |
| **DOM Update Frequency** | HUD updates only on delta (timer 1 Hz, scores on change). | Full HUD component tree re-renders at 30 Hz socket patch rate. | ⚠️ Perf |
| **Ad Layout Shift (CLS)**| Fixed reserved slot sizes (320x50, 728x90, 300x250) on menus. | Ad slots lack fixed CSS dimensions, risking CLS penalties. | ⚠️ SEO/UX |
| **Direct Join by URL** | Route `/r/:code` auto-joins room after name prompt. | Path parameter `/r/:code` not parsed on app boot. | ❌ Missing |

---

## 8. Actionable Remediation Plan & Priority Roadmap

### Phase 1: High Priority (P0 — Immediate Fixes)
1. **Fix Movement Keys to `event.code`**:
   - Update `apps/client/src/game/hooks/useGameInput.ts` to inspect `e.code` (`KeyA`, `KeyD`, `KeyW`, `Space`, `KeyE`, `ShiftLeft`, `KeyJ`, `Digit1`, `Digit2`, `Digit3`, `KeyM`).
   - Add global mute toggle handler on `KeyM`.
2. **Implement DOM Event Feed**:
   - Create `apps/client/src/ui/hud/EventFeed.tsx` positioned on the left below `RoundModeBadge`.
   - Wire server `event` messages (`ko`, `bomb_pass`, `crown_steal`, `pickup`) to a 4-item queue with $2.6\text{ s}$ CSS fade out.
   - Attach `aria-live="polite"` attribute for screen reader compliance.
3. **Eliminate 60 fps Lights Out Gradient Allocation**:
   - Cache radial gradient cutouts or use a static offscreen canvas mask to prevent GC allocations on mobile.
   - Differentiate local player spotlight ($170\text{ px}$) vs. opponents ($120\text{ px}$).
4. **Throttle DOM HUD Re-renders**:
   - Split `gameState.timeLeft` into a dedicated 1-second interval or memoized selector so 30 Hz Colyseus patches do not trigger Preact DOM diffing on every frame.

### Phase 2: UX & Accessibility Polish (P1 — High)
1. **Color-Blind Accessory Markings**:
   - Add small distinctive geometric emblems (Circle, Diamond, Star, Triangle, Square, Cross, Ring, Crown) or hats on each squircle in `drawPlayer.ts`.
2. **Room Code Sanitization & Lookalike Guard**:
   - In `JoinCodeBoxes.tsx` and `useLandingForm.ts`, auto-map `0` $\rightarrow$ `O` and `1` $\rightarrow$ `I`, or visually highlight invalid characters.
3. **Restore Privacy Notice & Safe FTUE**:
   - Add `"Please do not use your real full name"` hint in `NameInputRow.tsx`.
   - Ensure dice randomize button has minimum dimensions of $48\text{ px} \times 48\text{ px}$.
4. **Persist Audio Preferences**:
   - Store `isMuted` in `localStorage` via `util/storage.ts` and initialize `audio.ts` from storage.
5. **Reduced Motion & Flash Limit**:
   - Wrap screen shake and particle bursts in `window.matchMedia("(prefers-reduced-motion: reduce)").matches`.
   - Clamp crumbling floor tile blink frequency to $\le 3\text{ Hz}$.

### Phase 3: Platform & Production Polish (P2 — Medium)
1. **Route URL Parsing (`/r/:code`)**:
   - Parse `window.location.pathname` on boot in `App.tsx` or `main.tsx` to pre-populate `roomCode` and switch tabs to Join.
2. **Crown Rush HUD Mode Switch**:
   - In `PlayerScoreList.tsx`, render `p.crownSeconds` when `mode === "crown"` with a distinct gold badge.
3. **Background Tab Visibility Handling**:
   - Listen for `visibilitychange`; pause rendering and audio context while keeping WebSocket connection alive.
4. **Self-Hosted `.woff2` Fonts**:
   - Move `Bagel Fat One` and `Nunito` to local assets in `apps/client/public/fonts/` to prevent external font network dependencies and layout shifts.

