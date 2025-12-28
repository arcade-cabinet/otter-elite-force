# Contributing to OTTER: ELITE FORCE

Thank you for your interest in contributing to OTTER: ELITE FORCE! This guide will help you understand our development workflow, coding standards, and contribution process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Design Principles](#design-principles)
- [Project-Specific Guidelines](#project-specific-guidelines)

## Code of Conduct

Please be respectful and considerate of other contributors. We aim to foster an open and welcoming environment.

## Getting Started

### Prerequisites

- **Node.js** 20 or higher
- **pnpm** 10 or higher

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/arcade-cabinet/otter-elite-force.git
cd otter-elite-force

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Available Commands

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm lint             # Run Biome linter
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format code with Biome
pnpm typecheck        # Run TypeScript type checking
pnpm test             # Run unit tests (watch mode)
pnpm test:unit        # Run unit tests once
pnpm test:coverage    # Run tests with coverage report
pnpm test:e2e         # Run end-to-end tests
pnpm test:all         # Run all tests
```

## Development Workflow

1. **Fork and Clone**: Fork the repository and clone your fork locally
2. **Create a Branch**: Create a feature branch from `main`
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make Changes**: Implement your changes following our code style guidelines
4. **Test**: Run tests to ensure your changes don't break existing functionality
5. **Lint**: Run the linter and fix any issues
6. **Commit**: Write clear, conventional commit messages
7. **Push**: Push your changes to your fork
8. **Pull Request**: Open a PR against the `main` branch

## Code Style Guidelines

We use **Biome** for linting and formatting. The configuration is defined in `biome.json`.

### Key Style Rules

- **Indentation**: Tabs (width: 2 spaces)
- **Line Width**: 100 characters maximum
- **Quotes**: Double quotes for strings
- **Semicolons**: Always required
- **Trailing Commas**: Always use trailing commas in multi-line structures
- **Import Organization**: Imports are automatically organized by Biome

### TypeScript Guidelines

- Use **strict mode** (enabled in `tsconfig.json`)
- Always define explicit types for function parameters and return values
- Avoid using `any` type (use `unknown` if the type is truly unknown)
- Use `interface` for object shapes, `type` for unions/intersections
- Export types alongside implementations when appropriate

### Example

```typescript
// ✅ Good
interface Enemy {
	id: string;
	hp: number;
	position: THREE.Vector3;
	aiController: EntityManager;
}

export function createEnemy(position: THREE.Vector3): Enemy {
	return {
		id: generateId(),
		hp: 100,
		position,
		aiController: new EntityManager(),
	};
}

// ❌ Bad
const createEnemy = (position: any) => {
	return {
		id: generateId(),
		hp: 100,
		position,
		aiController: new EntityManager()  // Missing trailing comma
	}  // Missing semicolon
}
```

### React Component Guidelines

- Use **functional components** with TypeScript
- Define props interfaces explicitly
- Use **Zustand** for state management (not Context API or prop drilling)
- Use **React Three Fiber** for declarative 3D scene composition

```typescript
// ✅ Good
interface HUDProps {
	health: number;
	kills: number;
	territoryScore: number;
}

export function HUD({ health, kills, territoryScore }: HUDProps) {
	return (
		<div className="hud">
			<span>Health: {health}</span>
			<span>Kills: {kills}</span>
			<span>Territory: {territoryScore}</span>
		</div>
	);
}
```

### Running the Linter

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Format code
pnpm format
```

**Note**: The CI pipeline will fail if linting errors are present.

## Commit Conventions

We follow **Conventional Commits** specification for clear and structured commit history.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes only
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Changes to build process, dependencies, or tooling
- **ci**: Changes to CI configuration files and scripts

### Examples

```bash
# Simple feature
git commit -m "feat: add base building at Landing Zone"

# Bug fix with scope
git commit -m "fix(audio): resolve Web Audio context initialization on iOS"

# Breaking change
git commit -m "feat(world): implement chunk persistence

BREAKING CHANGE: Chunks are now fixed on discovery and never regenerate.
This changes the world generation behavior significantly."

# Documentation
git commit -m "docs: update README with mobile controls"

# Chore
git commit -m "chore: upgrade Three.js to r160"
```

### Commit Message Guidelines

- **Subject**: Use imperative mood ("add" not "added" or "adds")
- **Subject**: Keep under 72 characters
- **Subject**: Don't end with a period
- **Body**: Wrap at 72 characters
- **Body**: Explain *what* and *why*, not *how*
- **Footer**: Reference issues/PRs with `Closes #123` or `Fixes #456`

## Pull Request Process

### Before Submitting

1. **Run All Checks Locally**:
   ```bash
   pnpm lint           # Must pass
   pnpm typecheck      # Must pass
   pnpm test:coverage  # Should pass
   pnpm build          # Must succeed
   ```

2. **Update Documentation**: If your changes affect public APIs or user behavior, update the relevant documentation (README.md, AGENTS.md, etc.)

3. **Add Tests**: Include unit tests and/or E2E tests for new features or bug fixes

4. **Test on Mobile**: If your changes affect gameplay, test on a real mobile device or use browser device emulation

### PR Title Format

Use the same format as commit messages:

```
feat(world): implement chunk-based terrain persistence
fix(ai): resolve gator pack hunting coordination bug
docs: add CONTRIBUTING.md
```

### PR Description Template

Your PR should include:

1. **Summary**: Brief description of changes
2. **Motivation**: Why is this change needed?
3. **Changes**: List of specific changes made
4. **Testing**: How were the changes tested?
5. **Screenshots**: For UI changes, include before/after screenshots
6. **Checklist**: Confirm you've completed all requirements

Example:

```markdown
## Summary
Implements chunk-based terrain persistence for the open world system.

## Motivation
The game requires a persistent open world where discovered chunks never regenerate. This ensures player progress and territory control remain meaningful.

## Changes
- Added `discoveredChunks` Map to game store
- Implemented deterministic seed-based chunk generation
- Added chunk loading/saving to localStorage
- Updated world generator to check for existing chunks before generation

## Testing
- [x] Unit tests for chunk generation and persistence
- [x] E2E test verifying chunk consistency across sessions
- [x] Manual testing: visited chunk (5,3), reloaded game, verified same terrain

## Checklist
- [x] Code follows style guidelines (Biome)
- [x] All tests pass locally
- [x] Documentation updated (if applicable)
- [x] Conventional commit messages used
- [x] No breaking changes (or documented if necessary)
```

### CI Pipeline

All PRs must pass our CI pipeline, which includes:

1. **Linting**: Biome linter checks
2. **Type Checking**: TypeScript compilation
3. **Unit Tests**: Vitest test suite with coverage
4. **Build**: Production build verification
5. **E2E Tests**: Playwright end-to-end tests

The CI workflow is defined in `.github/workflows/ci.yml`.

### Review Process

1. **Automated Checks**: CI must pass before review
2. **Code Review**: At least one maintainer approval required
3. **Feedback**: Address reviewer comments and push updates
4. **Approval**: Once approved and CI passes, your PR will be merged

### Merge Strategy

- **Squash and Merge**: Multiple commits will be squashed into one
- **Commit Message**: Final message will use your PR title and description
- **Branch Deletion**: Your feature branch will be automatically deleted after merge

## Testing Requirements

### Unit Tests (Vitest)

- Write tests for **all game logic** (state management, calculations, algorithms)
- Use **React Testing Library** for component tests
- Aim for **>80% code coverage** for new code
- Test files should be colocated: `Component.tsx` → `Component.test.tsx`

```typescript
// Example unit test
import { describe, it, expect } from "vitest";
import { useGameStore } from "./gameStore";

describe("Game Store", () => {
	it("should track territory score when securing chunks", () => {
		const store = useGameStore.getState();
		store.secureChunk("5,3");
		expect(store.saveData.territoryScore).toBe(1);
	});
});
```

### E2E Tests (Playwright)

- Write E2E tests for **critical user flows**
- Test on Chromium (primary target for mobile)
- Tests located in `e2e/` directory

```typescript
// Example E2E test
import { test, expect } from "@playwright/test";

test("can start new game from menu", async ({ page }) => {
	await page.goto("/");
	await page.click('button:has-text("New Game")');
	await expect(page.locator(".difficulty-selector")).toBeVisible();
});
```

### Running Tests

```bash
# Unit tests (watch mode)
pnpm test

# Unit tests (single run)
pnpm test:unit

# Unit tests with coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# E2E tests with UI
pnpm test:e2e:ui

# All tests
pnpm test:all
```

## Design Principles

When contributing to OTTER: ELITE FORCE, keep these core principles in mind:

### 1. Open World, Not Levels

**CRITICAL**: This is a single persistent world, NOT a collection of levels.

- ❌ NO level select screens
- ❌ NO "Mission 1, 2, 3" structure
- ❌ NO terrain regeneration on revisit
- ✅ One continuous world generated chunk-by-chunk
- ✅ Chunks are FIXED once discovered (stored in Zustand)
- ✅ Returning to a coordinate shows the exact same layout

### 2. Procedural Everything

The game has **zero external asset files**.

- **Models**: Built with Three.js primitives (CapsuleGeometry, CylinderGeometry, etc.)
- **Audio**: Synthesized via Tone.js / Web Audio API
- **Terrain**: Generated at runtime with deterministic seeds

❌ **Do NOT add**: `.obj`, `.gltf`, `.mp3`, `.png`, `.jpg` files

### 3. Mobile-First Design

Touch controls are the PRIMARY input method.

- Virtual joysticks for movement and aiming
- Gyroscope support for fine-tuned aiming
- Responsive UI for phones and tablets
- Target **60fps on mobile devices**

Always test on mobile or use browser device emulation.

### 4. Vietnam-Era Grit

The aesthetic is **"Full Metal Jacket" meets "Wind in the Willows"**.

- ❌ NO cyborgs, time travel, or chrome aesthetics
- ❌ NO sci-fi elements
- ✅ Gritty, analog military aesthetic
- ✅ Humid, bleached environment
- ✅ Tactical realism

## Project-Specific Guidelines

### Zustand Store Structure

- Use **Zustand** for all state management
- Enable **persistence** for save data via localStorage
- Keep stores focused and modular

```typescript
// Example store structure
interface GameState {
	mode: "MENU" | "GAME" | "CANTEEN" | "VICTORY";
	difficulty: "SUPPORT" | "TACTICAL" | "ELITE";
	discoveredChunks: Map<string, ChunkData>;
	setMode: (mode: GameState["mode"]) => void;
}

export const useGameStore = create<GameState>()(
	persist(
		(set) => ({
			mode: "MENU",
			difficulty: "SUPPORT",
			discoveredChunks: new Map(),
			setMode: (mode) => set({ mode }),
		}),
		{
			name: "otter-game-save",
			version: 8,
		},
	),
);
```

### Chunk Generation Rules

When working with world generation:

```typescript
// ✅ Correct: Deterministic, coordinate-based
function generateChunk(x: number, z: number): ChunkData {
	const seed = hashCoords(x, z);
	const rng = seededRandom(seed);
	return {
		id: `${x},${z}`,
		x,
		z,
		seed,
		terrainType: generateTerrainType(rng),
		entities: generateEntities(rng),
		decorations: generateDecorations(rng),
		secured: false,
	};
}

// ❌ Wrong: Random generation without seed
function generateChunk(x: number, z: number): ChunkData {
	return {
		id: `${x},${z}`,
		terrainType: Math.random() > 0.5 ? "swamp" : "forest", // Non-deterministic!
		// ...
	};
}
```

### Audio Context Initialization

Web Audio API requires user interaction before playing sounds:

```typescript
// ✅ Correct: Wait for user gesture
import * as Tone from "tone";

export async function initAudio() {
	await Tone.start(); // Must be called after user click/touch
}

// In component:
<button onClick={() => initAudio()}>Start Game</button>
```

### Performance Optimization

- Use `useMemo` and `useCallback` for expensive calculations
- Use `InstancedMesh` for repeated objects (enemies, vegetation)
- Limit shadow-casting lights
- Implement LOD (Level of Detail) for distant objects
- Use `useFrame` instead of `setInterval`/`setTimeout`

### Three.js / R3F Patterns

```typescript
// ✅ Good: Declarative R3F component
function PlayerRig() {
	const meshRef = useRef<THREE.Mesh>(null);

	useFrame((state, delta) => {
		if (meshRef.current) {
			meshRef.current.rotation.y += delta;
		}
	});

	return (
		<mesh ref={meshRef}>
			<capsuleGeometry args={[0.5, 1, 8, 16]} />
			<meshStandardMaterial color="orange" />
		</mesh>
	);
}
```

## Questions or Help?

- **Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check `memory-bank/` for detailed project context

---

Thank you for contributing to OTTER: ELITE FORCE! 🦦
