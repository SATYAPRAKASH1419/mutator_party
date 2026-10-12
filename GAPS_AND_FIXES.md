# Senior Software Engineer Audit: Gaps & Fixes

> **Audit Target**: `packages/shared` (Step 2: Fixed-Step Simulation)  
> **Reference Specs**: 
> - [`docs/reference/backend-spec.md`](./docs/reference/backend-spec.md)
> - [`docs/reference/backend-implementation-plan.md`](./docs/reference/backend-implementation-plan.md)
> - [`docs/reference/mutator-party-spec.md`](./docs/reference/mutator-party-spec.md)
> - [`docs/reference/Mutator Party 2 (demo).html`](./docs/reference/Mutator%20Party%202%20(demo).html)
> - [`docs/reference/code/arena.js`](./docs/reference/code/arena.js)

---

## 🎯 Executive Summary

Before transitioning to **Step 3 (Server Skeleton)**, a deep audit of the fixed-timestep simulation (`packages/shared/src/sim/`) was conducted. While all 31 existing Vitest tests currently pass, there are **4 critical behavioral and architectural discrepancies** between the current implementation and the authoritative specification / reference demo.

Resolving these issues is necessary so the authoritative server in Step 3 runs physics that faithfully match gameplay rules.

---

## 🔍 Detailed Gaps & Prescribed Fixes

### 1. 🚨 Critical Bug: Infinite Floor Collision (Missing Island X-Bounds)

* **Affected File**: [`packages/shared/src/sim/platforms.ts`](./packages/shared/src/sim/platforms.ts#L54-L64)
* **Severity**: **Critical** (Gameplay breaking)

#### Problem
In `platforms.ts`:
```typescript
// Current implementation
if (!landed) {
  const floorTop   = FLOOR_Y;
  const crossFloor = (feetY - player.vy * dt) <= floorTop && feetY >= floorTop;

  if (player.vy >= 0 && crossFloor) {
    player.y  = floorTop - halfH;
    player.vy = 0;
    landed    = true;
  }
}
```
`crossFloor` tests `FLOOR_Y` across the entire world coordinate space without checking `player.x`. Consequently:
1. Players who walk or are shoved off the island into empty space (`x < island.x` or `x > island.x + island.w`) **land on invisible thin air** at `y = 400` instead of falling into the kill zone (`y > 630`).
2. In the `crumble` twist, when individual floor tiles drop, players continue floating over the gaps because the global floor plane remains active.

#### Spec & Reference Requirements
In the reference demo (`Mutator Party 2 (demo).html` lines 145–150 and 509):
- The floor is composed strictly of the central island's tiles (`tiles = [{ x: isl.x + i * 100, y: FLOOR_Y, w: 100 }, ...]`).
- Landing is only valid when the player overlaps an active platform or tile:
  ```javascript
  p.x + p.hs * 0.8 > pl.x && p.x - p.hs * 0.8 < pl.x + pl.w
  ```

#### Prescribed Fix
1. Update `SimState` in [`packages/shared/src/types.ts`](./packages/shared/src/types.ts) or pass island bounds into `applyPlatforms`.
2. Ensure floor checks require `player.x + halfW * 0.8 > floor.x && player.x - halfW * 0.8 < floor.x + floor.w`.
3. Support crumbling tile state checks so fallen tiles no longer collide.

---

### 2. 🥊 Incomplete Shove & Knockback Physics

* **Affected File**: [`packages/shared/src/sim/shove.ts`](./packages/shared/src/sim/shove.ts)
* **Severity**: **High** (Combat balance & feel)

#### Problem
1. **Missing Attacker Lunge**: Per reference demo (`p.vx += p.face * 140;`) and spec, when an attacker triggers a shove, they should receive an immediate forward momentum burst (`±140 px/s` along their facing direction). Current implementation does not apply any velocity to the attacker.
2. **Target Grounded State Not Reset**: When a target takes an upward knockback impulse (`target.vy = ny * force - SHOVE_POPUP`), `target.grounded` is not reset to `false`. In `applyMovement`, if `grounded` remains `true`, gravity is skipped on the subsequent tick:
   ```typescript
   if (!player.grounded) {
     player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL_SPEED);
   }
   ```
3. **Knockback Overwrite vs. Impulse Addition**: Currently `target.vx = nx * force` unconditionally overwrites the target's existing velocity rather than adding knockback impulse to current momentum (`target.vx += nx * force`).

#### Prescribed Fix
Update `applyShove` in [`shove.ts`](./packages/shared/src/sim/shove.ts):
```typescript
// Attacker lunge
const lungeDir = attacker.facingRight ? 1 : -1;
attacker.vx += lungeDir * 140;

// Target knockback
target.vx += nx * force;
target.vy = ny * force - SHOVE_POPUP;
target.grounded = false; // Ensure airborne physics kick in
target.stunTimer = SHOVE_STUN;
target.hitsTaken += 1;
```

---

### 3. 📦 Missing Module Exports in Package Entry Point

* **Affected File**: [`packages/shared/src/index.ts`](./packages/shared/src/index.ts)
* **Severity**: **Medium** (Integration blocker)

#### Problem
[`packages/shared/src/index.ts`](./packages/shared/src/index.ts) currently re-exports:
```typescript
export * from './constants.js';
export * from './rng.js';
export * from './arena.js';
export * from './settings.js';
export * from './input.js';
export * from './theme.js';
export * from './types.js';
```
It does **not** export the simulation engine modules (`step`, `movement`, `platforms`, `shove`). When `apps/server` or `apps/client` attempts to import `step` from `@mutator-party/shared`, TypeScript and Node will fail to find the symbol.

#### Prescribed Fix
Add the sim exports to [`packages/shared/src/index.ts`](./packages/shared/src/index.ts):
```typescript
export * from './sim/step.js';
export * from './sim/movement.js';
export * from './sim/platforms.js';
export * from './sim/shove.js';
```

---

### 4. 🧪 Missing Spec Gate Unit Test: Horizontal Air Distance

* **Affected File**: [`packages/shared/test/sim.test.ts`](./packages/shared/test/sim.test.ts)
* **Severity**: **Low** (Verification gap)

#### Problem
In [`docs/reference/backend-implementation-plan.md`](./docs/reference/backend-implementation-plan.md) (line 150):
> *“Unit: jump apex ~144 px, double jump ~111 px extra, **horizontal air distance ~336 px at full speed** (validates arena constants).”*

We have unit tests for:
- Jump apex (`~144 px`)
- Air jump (`~111 px`)
- Shove cooldown and hit scaling
- Kill zones
- Determinism (60 s, 8 players)

However, the **horizontal air distance (~336 px)** test was omitted. This test ensures the platform generator's `MAX_GAP = 220` parameter is safely reachable by jumping at full run speed (`420 px/s * ~0.8s air time ≈ 336 px`).

#### Prescribed Fix
Add the test case to [`sim.test.ts`](./packages/shared/test/sim.test.ts):
```typescript
it('horizontal air distance at full run speed is approximately 336 px', () => {
  const player = makePlayer({ x: 200, y: 382, grounded: true, vx: RUN_SPEED });
  const state = makeState([player]);

  // Jump on tick 0 while maintaining rightward run
  step(state, new Map([['p1', encodeBits({ right: true, jump: true })]]), [], DT);

  const startX = player.x;
  // Step until landing
  for (let i = 0; i < 200; i++) {
    step(state, new Map([['p1', encodeBits({ right: true })]]), [], DT);
    if (player.grounded) break;
  }

  const distance = player.x - startX;
  // Theoretical ~336 px (tolerance ±35 px)
  expect(distance).toBeGreaterThan(300);
  expect(distance).toBeLessThan(375);
});
```

---

## 📋 Implementation Checklist

- [ ] **Task 1**: Update `platforms.ts` to respect island platform boundaries and support floor tile layout.
- [ ] **Task 2**: Update `shove.ts` with attacker lunge, `target.grounded = false`, and impulse addition.
- [ ] **Task 3**: Re-export sim modules in `packages/shared/src/index.ts`.
- [ ] **Task 4**: Add the horizontal air distance unit test in `packages/shared/test/sim.test.ts`.
- [x] **Task 5**: Update [`PROGRESS.md`](./PROGRESS.md) to record Step 2 status and link to `GAPS_AND_FIXES.md` (✅ Completed).
- [ ] **Task 6**: Verify all Vitest test suites and TypeScript builds pass cleanly.
