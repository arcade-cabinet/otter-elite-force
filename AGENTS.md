# 🦦 AGENTS.md - Technical Briefing for OTTER: ELITE FORCE

## 1. Project Identity & Directive

**Project Name**: OTTER: ELITE FORCE (formerly River Doom, Operation: Clam Thunder)  
**Core Aesthetic**: "Full Metal Jacket" meets "Wind in the Willows."  
**Technical Constraint**: Procedural-only (No external assets - all models, textures, audio generated via code)  
**Primary Goal**: Create a mobile-first, procedurally generated 3rd-person tactical shooter with persistent progression.

## 2. Architecture Overview

### Modern Modular Architecture

```
src/
├── Core/           # Engine systems (AudioEngine, InputSystem)
├── Entities/       # Game objects
│   ├── Enemies/    # Gator, Snake, Snapper with Yuka AI
│   ├── Environment/# Reeds, Mangroves, OilSlick, etc.
│   └── *.tsx       # PlayerRig, Weapon, Particles, Raft, BaseBuilding
├── Scenes/         # Level management (MainMenu, Level, Cutscene, Victory, Canteen)
├── stores/         # Zustand state (gameStore, types, persistence)
├── UI/             # HUD overlay
├── utils/          # Constants, math helpers, shaders
└── test/           # Vitest setup and mocks
```

### State Management (Zustand)

The game uses a centralized Zustand store with five game modes:

| Mode | Input | Render | Purpose |
|------|-------|--------|---------|
| **MENU** | DOM clicks | Cinematic camera | Character/level selection |
| **CUTSCENE** | Next button only | Fixed angles | Story/dialogue delivery |
| **GAME** | Virtual joysticks | Chase camera | Core gameplay |
| **GAMEOVER** | Restart button | Death screen | Failure state |
| **CANTEEN** | Shop UI | Meta-progression | Upgrades/unlocks |

### Difficulty Modes

Three escalating difficulty tiers (ratchet - can only increase):

| Mode | Description | Death Consequence |
|------|-------------|-------------------|
| **SUPPORT** | Rookie | Respawn, DROP button available |
| **TACTICAL** | Standard | Fall trigger at <30 HP (one-time) |
| **ELITE** | Permadeath | Full save wipe |

### Save Data Schema (v8)

```typescript
interface SaveData {
  rank: number;
  xp: number;
  medals: number;
  unlocked: number;
  unlockedCharacters: string[];
  unlockedWeapons: string[];
  coins: number;
  discoveredChunks: Record<string, ChunkData>;
  territoryScore: number;
  peacekeepingScore: number;
  difficultyMode: "SUPPORT" | "TACTICAL" | "ELITE";
  strategicObjectives: { /* siphons, villages, gas, healers, allies */ };
  spoilsOfWar: { /* credits, clams, upgrades */ };
  upgrades: { speedBoost, healthBoost, damageBoost, weaponLvl };
  isLZSecured: boolean;
  baseComponents: PlacedComponent[];  // Base building at LZ
}
```

## 3. Core Systems

### AudioEngine (Tone.js with Synth Pooling)

```typescript
// Synth pools prevent per-call allocation
private shootPool: SynthPool;  // 4 sawtooth synths
private hitPool: SynthPool;    // 4 square synths
private pickupPool: SynthPool; // 4 sine synths

playSFX(type: "shoot" | "hit" | "pickup" | "explode"): void {
  const synth = this.getFromPool(this.shootPool); // Round-robin
  synth.triggerAttackRelease("A2", "16n", now);
}
```

### InputSystem (Touch/Keyboard/Gyro)

- **Virtual Joysticks**: Left stick = movement, Right stick = aim/fire
- **Keyboard Fallback**: WASD/Arrows + Mouse
- **Gyro Tilt**: Optional device orientation aiming
- **Cleanup**: All event listeners properly removed in `destroy()`

### GatorAI (Yuka State Machine)

States: `IDLE → WANDER → STALK → AMBUSH → ATTACK → RETREAT → SUPPRESSED`

```typescript
// Pack hunting: Gators circle during STALK
const GATOR_CONFIG = {
  AMBUSH_TRIGGER_DISTANCE: 15,
  AMBUSH_DURATION_S: 3,
  AMBUSH_COOLDOWN_MIN_S: 5,
  AMBUSH_COOLDOWN_RANDOM_S: 5,
};
```

### Base Building (LZ Forward Operating Base)

Components: `FLOOR`, `WALL`, `ROOF`, `STILT`
- Toggle Build Mode via HUD button
- Place components at player position
- Persisted in `saveData.baseComponents[]`
- Only available when LZ is secured

## 4. Procedural Generation Patterns

### The Otter "Rig" (PlayerRig.tsx)

```
Hierarchy:
├── Body (Capsule + Spheres for streamlined torso)
├── Head (Skull, Snout, Ears, Eyes, Whiskers)
├── Tail (3-segment rudder with swim animation)
├── Arms (Upper, Forearm, WebbedPaw)
├── Legs (Thigh, Lower, WebbedPaw)
├── Gear (Vest, Headgear, Backgear - conditional)
└── Weapon (attached to right arm)
```

**Critical**: Materials are memoized with `useMemo` to prevent memory leaks.

### World Generation (Chunk-Based)

```typescript
discoverChunk(x, z): ChunkData {
  const seed = Math.abs(x * 31 + z * 17);
  const rand = pseudoRandom(seed);  // Deterministic
  
  // Generate entities, decorations based on seed
  return { id: `${x},${z}`, terrainType, entities, decorations };
}
```

## 5. Testing Strategy

### Test Pyramid

```
         ▲ E2E (5-10%): Playwright smoke/menu/visual
        / \
       /   \ Integration (20-30%): Game flow, combat
      /     \
     /       \ Unit (60-70%): gameStore, AI, utils
    ───────────
```

### Commands

```bash
pnpm test:unit      # Vitest unit tests
pnpm test:coverage  # With coverage report
pnpm test:e2e       # Playwright E2E
pnpm test:all       # Full suite
```

### Mocking Requirements

```typescript
// src/test/setup.ts provides:
- localStorage mock
- matchMedia mock  
- ResizeObserver/IntersectionObserver
- WebGL context mock
- React Three Fiber Canvas mock
- Tone.js mock
- Yuka mock
```

## 6. CI/CD Pipeline

### GitHub Actions Workflow

```
Lint (Biome) → Type Check (tsc) → Unit Tests → Build → E2E Tests → Deploy
```

### Claude Automation Jobs

| Job | Trigger | Purpose |
|-----|---------|---------|
| `claude-interactive` | @claude mention | On-demand assistance |
| `claude-review` | PR opened | Automatic code review |
| `claude-triage` | Issue opened | Auto-label issues |
| `claude-maintenance` | Weekly | Health check |
| `claude-security` | Manual | Security audit |
| `claude-deps` | Manual | Dependency updates |

## 7. AI Agent Instructions

### Before Making Changes

1. **Read Context**: Check `memory-bank/activeContext.md` for current focus
2. **Run Validation**: `pnpm lint && pnpm typecheck && pnpm test:unit`
3. **Understand Dependencies**: Check imports and store usage

### Code Quality Requirements

1. **No External Assets**: Everything procedural (models, audio, textures)
2. **Mobile Performance**: Target 60fps, use InstancedMesh for repeated objects
3. **Memory Management**: Dispose Three.js resources, cleanup event listeners
4. **Type Safety**: No `any` types in critical paths
5. **Test Coverage**: Add tests for new logic

### Common Pitfalls to Avoid

| Pitfall | Solution |
|---------|----------|
| Creating synths per-call | Use synth pooling |
| Rotation on geometry | Apply to parent mesh |
| Mutating React props | Clone objects first |
| Forgetting cleanup | Add useEffect return |
| Using Math.random in render | Memoize random values |

### Multi-Agent Collaboration

When working with other AI agents:

1. **Request Reviews**: Post `@claude review`, `/gemini review`, `@cursor review`
2. **Resolve Threads**: Use GraphQL mutations to hide completed feedback
3. **Update Docs**: Keep memory-bank files synchronized
4. **Log Sessions**: Create dev-logs in `memory-bank/dev-logs/`

### Refactoring Checklist

- [ ] Identify logical boundaries
- [ ] Create TypeScript interfaces first
- [ ] Maintain localStorage compatibility (schema v8)
- [ ] Test module independently
- [ ] Document dependencies
- [ ] Add unit tests
- [ ] Verify mobile performance

## 8. Quick Reference

### Key Files

| File | Purpose |
|------|---------|
| `src/stores/gameStore.ts` | Central state management |
| `src/Core/AudioEngine.ts` | Synth-pooled audio |
| `src/Core/InputSystem.ts` | Touch/keyboard handling |
| `src/Entities/PlayerRig.tsx` | Procedural otter model |
| `src/Entities/Enemies/Gator.tsx` | AI predator with Yuka |
| `src/Scenes/Level.tsx` | Main gameplay scene |

### Validation Commands

```bash
# Quick check
pnpm lint && pnpm typecheck

# Full validation
pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build && pnpm test:e2e

# Development
pnpm dev
```

### Coordinates of Interest

| Location | Purpose |
|----------|---------|
| (0, 0) | LZ / Base Building Site |
| (5, 5) | Prison Camp (Gen. Whiskers) |
| (10, -10) | The Great Siphon (Boss) |
| (-15, 20) | Healer's Grove |
