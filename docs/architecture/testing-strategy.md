# Testing Strategy

## Philosophy

**Tests are the specification, not the verification.**

We write tests FIRST that define what something SHOULD be. Then we build until the tests pass. If we change a stat, the test breaks BEFORE the code does. The test IS the design document in executable form.

## Three Testing Layers

### Layer 1: Specification Tests (Vitest, no browser)

These define the RULES of the game. They run in happy-dom, no Phaser, no Canvas. Pure logic.

**What they test:**
- Entity definitions (stats, costs, sprite grid validity)
- Combat outcomes (3 Mudfoots vs 2 Gators → Mudfoots win with 1-2 survivors)
- Economy rates (2 workers gathering for 60s → expect ~120 fish)
- Pathfinding correctness (path avoids water, prefers low-cost tiles)
- Scenario triggers (timer fires at correct time, area trigger detects entry)
- Balance assertions (Shellcracker out-ranges Gator, Sapper does 3x damage to buildings)
- Research effects (Hardshell Armor adds exactly 20 HP to existing Mudfoots)
- Scoring calculations (par time + 0 losses + all bonuses = Gold)

**Example:**
```typescript
describe('Mudfoot vs Gator combat', () => {
  it('Gator wins 1v1 with >50% HP remaining', () => {
    const result = simulateCombat(gator, mudfoot);
    expect(result.winner).toBe('gator');
    expect(result.winnerHpPercent).toBeGreaterThan(0.5);
  });

  it('3 Mudfoots beat 2 Gators with 1-2 survivors', () => {
    const result = simulateGroupCombat([mudfoot, mudfoot, mudfoot], [gator, gator]);
    expect(result.winner).toBe('ura');
    expect(result.survivorCount).toBeGreaterThanOrEqual(1);
    expect(result.survivorCount).toBeLessThanOrEqual(2);
  });
});
```

### Layer 2: Visual Specification Tests (Vitest Browser Mode, Chromium)

These define what things LOOK LIKE. They run in real Chromium via `@vitest/browser-playwright`. They render sprites and take screenshots for visual comparison.

**What they test:**
- Sprite renders at correct dimensions (16×16 grid at 3x = 48×48 canvas)
- Sprite has pixels at expected locations (not all transparent, not all black)
- Faction colors are correct (URA blue at torso, Scale-Guard red at torso)
- Portrait is recognizable at intended size (not a blob)
- Terrain painting produces correct colors per region
- HUD elements display correct initial values
- Scene transitions render without errors

**Example:**
```typescript
describe('Mudfoot sprite', () => {
  it('renders a 48x48 canvas at 3x scale', () => {
    const canvas = renderSprite(mudfoot.sprite, 'idle', 0, 3);
    expect(canvas.width).toBe(48);
    expect(canvas.height).toBe(48);
  });

  it('has blue pixels in torso region (rows 4-9)', () => {
    const canvas = renderSprite(mudfoot.sprite, 'idle', 0, 1);
    const ctx = canvas.getContext('2d');
    // Sample pixel at torso center (8, 7)
    const pixel = ctx.getImageData(8, 7, 1, 1).data;
    // Should be PALETTE['B'] = #1e3a8a → RGB(30, 58, 138)
    expect(pixel[0]).toBe(30);
    expect(pixel[1]).toBe(58);
    expect(pixel[2]).toBe(138);
  });

  it('has 2 walk frames', () => {
    expect(mudfoot.sprite.frames.walk.length).toBe(2);
  });

  it('screenshot matches baseline', async () => {
    const canvas = renderSprite(mudfoot.sprite, 'idle', 0, 3);
    await expect(canvas).toMatchSnapshot();
  });
});
```

### Layer 3: Integration Tests (Vitest Browser Mode + Phaser)

These test the full pipeline: entity definition → renderer → Phaser texture → game scene.

**What they test:**
- BootScene loads all textures without errors
- GameScene spawns entities at correct positions
- Clicking a unit selects it (sprite → Koota entity → selection state)
- HUD updates when resources change
- Scene flow works end-to-end (Menu → Briefing → Game → Victory)
- Fog of war renders correctly around units
- Combat visually shows projectiles and damage

**These use the Phaser test helper from the browser test infrastructure (already built).**

## Test File Organization

```
src/__tests__/
├── specs/                     # Layer 1: Specification tests
│   ├── combat/
│   │   ├── melee-outcomes.test.ts     # Expected 1v1 and group combat results
│   │   ├── ranged-outcomes.test.ts
│   │   └── building-damage.test.ts
│   ├── economy/
│   │   ├── gather-rates.test.ts       # Expected resource income
│   │   ├── build-order.test.ts        # Build time validations
│   │   └── population.test.ts         # Pop cap math
│   ├── entities/
│   │   ├── unit-stats.test.ts         # ALL unit stats match design doc
│   │   ├── building-stats.test.ts
│   │   ├── research-effects.test.ts
│   │   └── sprite-validity.test.ts    # All sprites have valid palette chars, correct grid size
│   ├── balance/
│   │   ├── counter-matrix.test.ts     # Unit counter relationships hold
│   │   └── economy-curves.test.ts     # Income rates match design targets
│   └── scenarios/
│       ├── trigger-logic.test.ts
│       └── scoring.test.ts
├── visual/                    # Layer 2: Visual specification tests
│   ├── sprites/
│   │   ├── unit-renders.test.ts       # Each unit renders with correct colors/dimensions
│   │   ├── building-renders.test.ts
│   │   ├── portrait-renders.test.ts
│   │   └── terrain-painting.test.ts
│   └── screenshots/                   # Baseline screenshots for visual regression
├── browser/                   # Layer 3: Integration tests (existing)
│   ├── boot-scene.test.ts
│   ├── game-scene.test.ts
│   ├── hud-scene.test.ts
│   ├── sync-layer.test.ts
│   └── scene-flow.test.ts
```

## Running Tests

```bash
# Layer 1: Specification tests (fast, no browser)
pnpm vitest run src/__tests__/specs/

# Layer 2: Visual tests (browser, screenshots)
pnpm vitest run --config vitest.browser.config.ts src/__tests__/visual/

# Layer 3: Integration tests (browser, Phaser)
pnpm test:browser

# All layers
pnpm test:all
```

## Screenshot Workflow

Visual tests generate screenshots on first run (baseline). On subsequent runs, they compare against the baseline. If a sprite changes intentionally, update the baseline:

```bash
pnpm vitest run --config vitest.browser.config.ts --update
```

## What "Done" Means

An entity is DONE when:
1. ✅ Specification test passes (stats, cost, grid validity)
2. ✅ Visual test passes (renders at correct size, correct colors, faction-identifiable)
3. ✅ Screenshot baseline exists
4. ✅ Balance test passes (combat outcomes match counter matrix)
5. ✅ Integration test passes (spawns in game, renders in scene)

A mission is DONE when:
1. ✅ Terrain renders correctly (regions + overrides)
2. ✅ All placements spawn valid entities
3. ✅ All triggers fire at correct conditions
4. ✅ Briefing displays with correct portrait and dialogue
5. ✅ Victory/defeat conditions work
6. ✅ Par time is achievable on Tactical difficulty
7. ✅ Screenshot baseline exists for starting state
