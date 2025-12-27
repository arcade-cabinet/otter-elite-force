# GitHub Copilot Instructions for OTTER: ELITE FORCE

## Project Overview

OTTER: ELITE FORCE is a mobile-first 3D tactical shooter built with React 19, Three.js (via React Three Fiber), and TypeScript. The game features procedural generation, real-time audio synthesis, and sophisticated AI using Yuka.

## Technology Stack

- **Frontend Framework**: React 19 RC
- **3D Engine**: Three.js r160 via @react-three/fiber
- **Game AI**: Yuka (steering behaviors, state machines)
- **State Management**: Zustand
- **Animation**: GSAP
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Language**: TypeScript (strict mode)
- **Linting/Formatting**: Biome
- **Testing**: Vitest (unit/component) + Playwright (E2E)

## Architecture Principles

### 1. Modular Structure

```
src/
├── Core/           # Engine systems (GameLoop, InputSystem, AudioEngine)
├── Entities/       # Game objects (PlayerRig, Enemies, Particles)
├── Scenes/         # Level management (MainMenu, Level)
├── UI/             # React components (HUD, Menus)
└── stores/         # Zustand state stores
```

### 2. Procedural Generation First

- **NO external asset files** (models, textures, audio files)
- All 3D models built with Three.js primitives (CapsuleGeometry, CylinderGeometry, etc.)
- All audio synthesized via Web Audio API
- All terrain/environments generated at runtime

### 3. React + Three.js Integration

- Use `@react-three/fiber` for declarative Three.js
- Use `@react-three/drei` for helpers (OrbitControls, Sky, etc.)
- Use `@react-three/postprocessing` for visual effects
- React components for UI, R3F Canvas for 3D scene

### 4. Mobile-First Design

- Touch controls are PRIMARY input method
- Virtual joysticks for movement and aiming
- Gyroscope support for fine-tuned aiming
- Responsive UI that works on phones and tablets
- Target 60fps on mobile devices

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
}

export function HUD({ health, kills }: HUDProps) {
	return <div>...</div>;
}

// ✅ DO: Use Zustand for state management
import { create } from "zustand";

interface GameState {
	health: number;
	setHealth: (hp: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
	health: 100,
	setHealth: (hp) => set({ health: hp }),
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

### Audio Synthesis

```typescript
// ✅ DO: Initialize AudioContext on user gesture
let audioContext: AudioContext | null = null;

export function initAudio() {
	if (!audioContext) {
		audioContext = new AudioContext();
	}
	if (audioContext.state === "suspended") {
		audioContext.resume();
	}
}

// ✅ DO: Create reusable sound effects
export function playSFX(type: "shoot" | "hit" | "pickup") {
	if (!audioContext) return;

	const osc = audioContext.createOscillator();
	const gain = audioContext.createGain();
	// ... configure oscillator
}
```

### Testing

```typescript
// ✅ DO: Write unit tests for game logic
import { describe, it, expect } from "vitest";
import { calculateDamage } from "./combat";

describe("Combat System", () => {
	it("should calculate correct damage", () => {
		expect(calculateDamage(10, 0.5)).toBe(5);
	});
});

// ✅ DO: Write E2E tests for user flows
import { test, expect } from "@playwright/test";

test("can start game from menu", async ({ page }) => {
	await page.goto("/");
	await page.click('button:has-text("Campaign")');
	await expect(page.locator("#game-canvas")).toBeVisible();
});
```

## Common Patterns

### State Management Pattern

```typescript
// stores/gameStore.ts
import { create } from "zustand";

interface GameState {
	mode: "MENU" | "CUTSCENE" | "GAME";
	health: number;
	kills: number;
	level: number;
	setMode: (mode: GameState["mode"]) => void;
	takeDamage: (amount: number) => void;
	addKill: () => void;
}

export const useGameStore = create<GameState>((set) => ({
	mode: "MENU",
	health: 100,
	kills: 0,
	level: 0,
	setMode: (mode) => set({ mode }),
	takeDamage: (amount) =>
		set((state) => ({ health: Math.max(0, state.health - amount) })),
	addKill: () => set((state) => ({ kills: state.kills + 1 })),
}));
```

### Animation Pattern

```typescript
import gsap from "gsap";

// Smooth camera transitions
export function transitionCamera(
	camera: THREE.Camera,
	target: THREE.Vector3,
	duration = 1,
) {
	gsap.to(camera.position, {
		x: target.x,
		y: target.y,
		z: target.z,
		duration,
		ease: "power2.inOut",
	});
}
```

### Input Handling Pattern

```typescript
// Use React state for input
import { useState, useEffect } from "react";

export function useJoystick(side: "left" | "right") {
	const [input, setInput] = useState({ x: 0, y: 0, active: false });

	useEffect(() => {
		const handleTouch = (e: TouchEvent) => {
			// Process touch input
			setInput({ x: normalizedX, y: normalizedY, active: true });
		};

		window.addEventListener("touchstart", handleTouch);
		return () => window.removeEventListener("touchstart", handleTouch);
	}, []);

	return input;
}
```

## What NOT to Do

❌ Don't add external asset files (models, textures, audio)  
❌ Don't use class components (use functional components)  
❌ Don't mutate Three.js objects directly (use R3F refs and state)  
❌ Don't ignore mobile performance (always test on mobile)  
❌ Don't skip type definitions (use TypeScript strictly)  
❌ Don't bypass Biome formatting (run `pnpm format` before committing)  
❌ Don't mix direct Three.js and R3F patterns (choose R3F when possible)

## Performance Guidelines

1. **Use `useMemo` and `useCallback`** for expensive calculations
2. **Limit draw calls** - merge geometries when possible
3. **Use instancing** for repeated objects (enemies, particles)
4. **Optimize shadows** - limit shadow-casting lights
5. **Use level-of-detail (LOD)** for distant objects
6. **Debounce/throttle** input handlers
7. **Use `useFrame`** instead of setInterval/setTimeout

## Development Workflow

```bash
# Start development server
pnpm dev

# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Build for production
pnpm build

# Preview production build
pnpm preview
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
3. Are types properly defined?
4. Does this follow the modular architecture?
5. Are there tests for this functionality?
6. Does this work with touch input?
7. Is the audio system respecting user gesture requirements?

## Claude AI Automation

This repository has extensive Claude Code integration for automated development tasks.

### Interactive Mode

Mention `@claude` in any issue or PR comment to trigger Claude assistance. Available to repo collaborators only.

**Examples:**
- `@claude please review this PR for performance issues`
- `@claude fix the linting errors`
- `@claude add unit tests for this component`

### Automatic Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| PR Review | PR opened/updated | Automatic code review with checklist |
| Issue Triage | Issue opened | Auto-labeling and categorization |
| CI Auto-Fix | CI failure on PR | Automatically fix failing tests/lint |
| Flaky Test Detection | CI failure | Detect and report flaky tests |
| Weekly Maintenance | Sunday midnight | Dependency audit, issue hygiene |

### Manual Triggers

Go to Actions → Claude Code → Run workflow:

- **maintenance**: Weekly health check
- **security-audit**: Deep security review
- **dependency-update**: Safe dependency updates with PR

### Custom Commands

Located in `.claude/commands/`:

- `/label-issue` - Triage and label issues
- `/review-pr` - Comprehensive PR review
- `/fix-tests` - Debug and fix failing tests
- `/add-feature` - Add feature following conventions

### Specialized Review Agents

Located in `.claude/agents/`:

- **performance-reviewer** - Mobile 3D optimization
- **security-reviewer** - Game security concerns
- **threejs-reviewer** - Three.js/R3F patterns
- **testing-reviewer** - Test quality
- **zustand-reviewer** - State management

## Resources

- [Three.js Docs](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Yuka Docs](https://mugen87.github.io/yuka/docs/)
- [Zustand Guide](https://docs.pmnd.rs/zustand)
- [Biome](https://biomejs.dev/)
- [Playwright](https://playwright.dev/)
- [Claude Code Action](https://github.com/anthropics/claude-code-action)
