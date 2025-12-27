# GitHub Copilot Instructions for OTTER: ELITE FORCE

## Project Overview

OTTER: ELITE FORCE is a mobile-first 3D tactical shooter built with React 19, Three.js (via React Three Fiber), and TypeScript. The game features a **persistent open world** with procedural generation, real-time audio synthesis, and sophisticated AI using Yuka.

## CRITICAL DESIGN PRINCIPLE: Open World, Not Levels

**THE GAME HAS NO LEVELS. It is a single persistent open world.**

- ❌ NO level select screens
- ❌ NO "Mission 1, 2, 3" structure
- ❌ NO terrain regeneration on revisit

Instead:
- ✅ One continuous world generated chunk-by-chunk
- ✅ Chunks are FIXED once discovered (stored in Zustand)
- ✅ Returning to coordinate (5, 3) shows the exact same layout
- ✅ Changes persist: destroyed objectives stay destroyed

### Main Menu = Game Loader

```
[ NEW GAME ]     - Fresh campaign with difficulty selection
[ CONTINUE ]     - Resume persistent world from save
[ CANTEEN ]      - Meta-progression shop for permanent upgrades
```

## Technology Stack

- **Frontend Framework**: React 19 (Stable)
- **3D Engine**: Three.js r160 via @react-three/fiber
- **Game AI**: Yuka (steering behaviors, state machines)
- **State Management**: Zustand (with persistence)
- **Audio**: Tone.js (procedural synthesis)
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Language**: TypeScript (strict mode)
- **Linting/Formatting**: Biome
- **Testing**: Vitest (unit) + Playwright (E2E)

## Architecture Principles

### 1. Modular Structure

```
src/
├── Core/           # Engine systems (GameLoop, InputSystem, AudioEngine)
├── Entities/       # Game objects (PlayerRig, Enemies, Environment)
│   ├── Enemies/    # Gator, Snake, Snapper with YUKA AI
│   └── Environment/# Hazards, Decorations, Objectives
├── Scenes/         # Application states (Menu, Level, Canteen, Victory)
├── stores/         # Zustand state stores
│   ├── gameStore.ts      # Main FSM and game state
│   ├── worldGenerator.ts # Chunk generation
│   └── persistence.ts    # Save/Load logic
└── UI/             # React components (HUD, Menus)
```

### 2. Procedural Generation First

- **NO external asset files** (models, textures, audio files)
- All 3D models built with Three.js primitives (CapsuleGeometry, CylinderGeometry, etc.)
- All audio synthesized via Tone.js / Web Audio API
- All terrain/environments generated at runtime with deterministic seeds

### 3. Open World Chunk Persistence

```typescript
// Chunk generation is coordinate-based and deterministic
function generateChunk(x: number, y: number): ChunkData {
  const seed = hashCoords(x, y);
  const rng = seededRandom(seed);
  return {
    x, y, seed,
    entities: generateEntities(rng),
    isDiscovered: false,
    isSecured: false,
  };
}

// RULE: Once discovered, chunks are NEVER regenerated
// They are loaded from the Zustand store
```

### 4. Mobile-First Design

- Touch controls are PRIMARY input method
- Virtual joysticks for movement and aiming
- Gyroscope support for fine-tuned aiming
- Responsive UI for phones and tablets
- Target 60fps on mobile devices

## Game Design Context

### Three Difficulty Modes (Escalation Only)

| Mode | Key Mechanic |
|------|--------------|
| SUPPORT | Supply drops anywhere, extract anywhere |
| TACTICAL | "The Fall" at 30% HP - must return to LZ |
| ELITE | Permadeath - one death ends campaign |

**Rule**: Difficulty can go UP but NEVER DOWN.

### Three Victory Verticals

1. **Platoon Rescues**: Find characters at specific coordinates (not store purchases)
2. **Arsenal Upgrades**: Spend credits at Canteen for permanent gear
3. **Intel Rewards**: High peacekeeping scores reveal map POIs

### Base Building at LZ (0, 0)

First objective is securing the Landing Zone with modular construction.

### Three-Faction Conflict

- **URA Peacekeepers** (Player): Liberation mission
- **Scale-Guard Militia** (Enemy): Industrial predator cult
- **Native Inhabitants** (Neutral): Villagers awaiting rescue

## Coding Guidelines

### TypeScript

```typescript
// ✅ DO: Use strict typing
interface Enemy {
	id: string;
	hp: number;
	position: THREE.Vector3;
	aiController: EntityManager;
}

// ✅ DO: Export types alongside implementations
export type { Enemy };
export class EnemyController implements Enemy { ... }

// ❌ DON'T: Use 'any' type
const data: any = {}; // Bad
```

### React Components

```typescript
// ✅ DO: Use functional components with TypeScript
interface HUDProps {
	health: number;
	kills: number;
	territoryScore: number;
}

export function HUD({ health, kills, territoryScore }: HUDProps) {
	return <div>...</div>;
}

// ✅ DO: Use Zustand for state management
import { create } from "zustand";

interface GameState {
	mode: 'MENU' | 'GAME' | 'CANTEEN' | 'VICTORY';
	difficulty: 'SUPPORT' | 'TACTICAL' | 'ELITE';
	discoveredChunks: Map<string, ChunkData>;
	setMode: (mode: GameState['mode']) => void;
}

export const useGameStore = create<GameState>((set) => ({
	mode: 'MENU',
	difficulty: 'SUPPORT',
	discoveredChunks: new Map(),
	setMode: (mode) => set({ mode }),
}));
```

### Three.js / R3F

```typescript
// ✅ DO: Use R3F for declarative scene setup
import { Canvas } from "@react-three/fiber";

function Scene() {
	return (
		<Canvas>
			<ambientLight intensity={0.5} />
			<PlayerRig position={[0, 0, 0]} />
		</Canvas>
	);
}

// ✅ DO: Use refs for imperative Three.js operations
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

function PlayerRig() {
	const meshRef = useRef<THREE.Mesh>(null);

	useFrame((state, delta) => {
		if (meshRef.current) {
			meshRef.current.rotation.y += delta;
		}
	});

	return <mesh ref={meshRef}>...</mesh>;
}
```

### Game AI with Yuka

```typescript
// ✅ DO: Use Yuka for enemy AI
import * as YUKA from "yuka";

class EnemyAI {
	private vehicle: YUKA.Vehicle;
	private seekBehavior: YUKA.SeekBehavior;

	constructor() {
		this.vehicle = new YUKA.Vehicle();
		this.seekBehavior = new YUKA.SeekBehavior();
		this.vehicle.steering.add(this.seekBehavior);
	}
}
```

### Audio Synthesis (Tone.js)

```typescript
// ✅ DO: Initialize audio on user gesture
import * as Tone from "tone";

export async function initAudio() {
	await Tone.start();
}

// ✅ DO: Use synth pools for efficient SFX
const sfxSynth = new Tone.Synth().toDestination();

export function playSFX(type: "shoot" | "hit" | "pickup") {
	sfxSynth.triggerAttackRelease("C4", "16n");
}
```

### Testing

```typescript
// ✅ DO: Write unit tests for game logic
import { describe, it, expect } from "vitest";
import { useGameStore } from "./gameStore";

describe("Game Store", () => {
	it("should track territory score", () => {
		const store = useGameStore.getState();
		store.secureChunk(5, 3);
		expect(store.territoryScore).toBe(1);
	});
});

// ✅ DO: Write E2E tests for user flows
import { test, expect } from "@playwright/test";

test("can start new game from menu", async ({ page }) => {
	await page.goto("/");
	await page.click('button:has-text("New Game")');
	await expect(page.locator(".difficulty-selector")).toBeVisible();
});
```

## What NOT to Do

❌ Don't add external asset files (models, textures, audio)  
❌ Don't create "level select" screens (use game loader pattern)  
❌ Don't allow chunks to regenerate on revisit  
❌ Don't use class components (use functional components)  
❌ Don't mutate Three.js objects directly (use R3F refs and state)  
❌ Don't ignore mobile performance (always test on mobile)  
❌ Don't skip type definitions (use TypeScript strictly)  
❌ Don't bypass Biome formatting  
❌ Don't add cyborg/sci-fi aesthetics (keep Vietnam-era grit)  
❌ Don't make characters purchasable (they must be rescued)  
❌ Don't allow difficulty downgrade  

## Performance Guidelines

1. **Use `useMemo` and `useCallback`** for expensive calculations
2. **Use `InstancedMesh`** for repeated objects (enemies, vegetation)
3. **Limit draw calls** - merge geometries when possible
4. **Optimize shadows** - limit shadow-casting lights
5. **Use LOD** for distant objects
6. **Debounce/throttle** input handlers
7. **Use `useFrame`** instead of setInterval/setTimeout
8. **Implement chunk hibernation** for distant AI

## Development Workflow

```bash
# Start development server
pnpm dev

# Run linter
pnpm lint

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Build for production
pnpm build
```

## Git Commit Convention

Use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding tests
- `docs:` - Documentation changes
- `chore:` - Build/tooling changes

## Questions to Ask

When making changes, consider:

1. Does this maintain mobile-first performance?
2. Is this procedurally generated (no external assets)?
3. Does this respect open world persistence (chunks never regenerate)?
4. Are types properly defined?
5. Does this follow the modular architecture?
6. Are there tests for this functionality?
7. Does this work with touch input?
8. Does this maintain the "Vietnam-era grit" aesthetic?

## Claude AI Automation

This repository has extensive Claude Code integration for automated development tasks.

### Interactive Mode

Mention `@claude` in any issue or PR comment to trigger Claude assistance.

**Examples:**
- `@claude please review this PR for open world persistence issues`
- `@claude fix the linting errors`
- `@claude add unit tests for chunk generation`

### Automatic Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| PR Review | PR opened/updated | Automatic code review |
| Issue Triage | Issue opened | Auto-labeling |
| CI Auto-Fix | CI failure on PR | Fix failing tests/lint |

### Specialized Review Agents

Located in `.claude/agents/`:

- **performance-reviewer** - Mobile 3D optimization
- **security-reviewer** - Game security concerns
- **threejs-reviewer** - Three.js/R3F patterns
- **testing-reviewer** - Test quality
- **zustand-reviewer** - State management

## Memory Bank

For comprehensive project context, see `/memory-bank/`:

- `projectbrief.md` - Core requirements and open world design
- `productContext.md` - UX goals and game loader interface
- `systemPatterns.md` - Architecture and chunk persistence
- `activeContext.md` - Current work focus
- `progress.md` - Feature checklist and known issues
- `techContext.md` - Technology stack details

## Resources

- [Three.js Docs](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Yuka Docs](https://mugen87.github.io/yuka/docs/)
- [Zustand Guide](https://docs.pmnd.rs/zustand)
- [Tone.js](https://tonejs.github.io/)
- [Biome](https://biomejs.dev/)
- [Playwright](https://playwright.dev/)
