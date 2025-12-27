# Coverage Gap Analysis: 50% → 75%

> **Current**: 49.85% statements
> **Target**: 75% statements
> **Gap**: ~25 percentage points

---

## High Coverage (Already Good ✅)

| Module | Coverage | Notes |
|--------|----------|-------|
| `src/stores` | 94.46% | Excellent |
| `src/systems/assembly` | 96.74% | Excellent |
| `src/ecs/data` | 85.71% | Good |
| `src/utils` | 95.83% | Excellent |
| `src/ecs/world.ts` | 80.85% | Good |

---

## Critical Gaps (Must Address)

### 1. `src/Entities` - 1.79% ❌

| File | Coverage | Lines | Priority |
|------|----------|-------|----------|
| `PlayerRig.tsx` | 1.81% | 339 | HIGH |
| `ModularHut.tsx` | 0% | 265 | MEDIUM |
| `Villager.tsx` | 0% | 63 | MEDIUM |
| `Weapon.tsx` | 0% | 90 | MEDIUM |
| `Raft.tsx` | 5% | 154 | LOW |
| `Particles.tsx` | 2.12% | 124 | LOW |
| `Projectiles.tsx` | 3.84% | 72 | MEDIUM |
| `BaseBuilding.tsx` | 0% | 52 | LOW |

**Impact**: ~1100 uncovered lines

### 2. `src/Entities/Environment` - 1.14% ❌

| File | Coverage | Lines |
|------|----------|-------|
| `MudPit.tsx` | 0% | 80 |
| `OilSlick.tsx` | 5.26% | 208 |
| `ToxicSludge.tsx` | 0% | 115 |
| `Platform.tsx` | 0% | 121 |
| Others (6 files) | 0% | ~200 |

**Impact**: ~700 uncovered lines

### 3. `src/Entities/Objectives` - 0% ❌

| File | Coverage | Lines |
|------|----------|-------|
| `Clam.tsx` | 0% | 56 |
| `Siphon.tsx` | 0% | 83 |

**Impact**: ~140 uncovered lines

### 4. `src/Scenes/Level.tsx` - 0% ❌

| File | Coverage | Lines |
|------|----------|-------|
| `Level.tsx` | 0% | 496 |

**Impact**: ~500 uncovered lines - **LARGEST SINGLE FILE**

### 5. `src/ecs/systems` - 33.86%

| File | Coverage | Lines |
|------|----------|-------|
| `AISystem.ts` | 19.2% | 378 |
| `CombatSystem.ts` | 60% | 124 |
| `MovementSystem.ts` | 58.06% | 72 |

**Impact**: ~300 uncovered lines

---

## Strategy to Reach 75%

### Phase 1: Quick Wins (Low Effort, High Impact)

1. **Add Scout.tsx tests** - Already has Gator tests pattern to follow
2. **Add Snake.tsx tests** - Similar structure to Gator
3. **Add Snapper.tsx tests** - Similar structure

**Estimated gain**: +3-5%

### Phase 2: Entity Component Tests

Testing React Three Fiber components requires mocking:

```typescript
// Example test pattern for Entity components
vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn((callback) => callback({ clock: { elapsedTime: 0 } }, 0.016)),
}));

describe("Villager", () => {
  it("should render without crashing", () => {
    const { container } = render(
      <Canvas>
        <Villager data={{ id: "v1", position: new THREE.Vector3() }} />
      </Canvas>
    );
    expect(container).toBeDefined();
  });
});
```

**Target files**:
- `Villager.tsx` (+3%)
- `Weapon.tsx` (+2%)
- `Projectiles.tsx` (+2%)

**Estimated gain**: +7-10%

### Phase 3: Environment & Objectives

Simple render tests for procedural components:

```typescript
describe("OilSlick", () => {
  it("should create mesh with correct geometry", () => {
    // Test procedural generation output
  });
});
```

**Target files**:
- `OilSlick.tsx`, `MudPit.tsx`, `ToxicSludge.tsx`
- `Clam.tsx`, `Siphon.tsx`

**Estimated gain**: +5-7%

### Phase 4: Level.tsx (Hardest)

Level.tsx is a monolithic component with:
- useFrame animation loops
- Complex collision detection
- State management
- Multiple child components

**Options**:
1. **Extract testable logic** into pure functions
2. **Integration test** with mocked Three.js
3. **Snapshot testing** for structure

**Estimated gain**: +8-12%

### Phase 5: Increase AISystem Coverage

Add more state transition tests:
- Suppression edge cases
- Pack coordination scenarios
- Alert level thresholds

**Estimated gain**: +3-5%

---

## Recommended Immediate Actions

1. **Create `src/Entities/Enemies/__tests__/Scout.test.tsx`**
2. **Create `src/Entities/Enemies/__tests__/Snake.test.tsx`**
3. **Create `src/Entities/Enemies/__tests__/Snapper.test.tsx`**
4. **Create `src/Entities/__tests__/Villager.test.tsx`**
5. **Extract Level.tsx logic into testable utilities**

---

## Coverage Math

| Current Lines | ~2500 covered out of ~5000 |
| Target (75%) | ~3750 covered |
| Need to add | ~1250 lines of coverage |

The path to 75%:
- Enemy tests: +200 lines
- Entity tests: +300 lines
- Environment tests: +250 lines
- Level.tsx refactor + tests: +400 lines
- AISystem boost: +100 lines

**Total**: ~1250 additional lines covered ✅
