---
allowed-tools: Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*),Read,Glob,Grep
description: Review a pull request for OTTER: ELITE FORCE
---

Perform a comprehensive code review for this game project.

## Project: OTTER: ELITE FORCE

**Stack:**
- React 19 + TypeScript (strict mode)
- Three.js via React Three Fiber
- Yuka AI (steering, FSM)
- Zustand state management
- Tone.js procedural audio
- Biome (lint), Vitest (unit), Playwright (E2E)

**Core Constraints:**
- No external asset files (procedural generation only)
- Mobile-first (60fps on phones)
- Single-file HTML5 spirit (minimal deps)

## Review Focus Areas

### 1. TypeScript & Code Quality
- No `any` types without justification
- Proper interface definitions
- React hooks follow rules-of-hooks
- No console.log in production code

### 2. Performance (CRITICAL for mobile)
- Three.js resources disposed in cleanup
- Event listeners removed on unmount
- Heavy computations memoized (useMemo, useCallback)
- InstancedMesh for repeated objects
- No memory leaks in animation loops

### 3. Three.js / R3F Patterns
- Geometries and materials reused
- Proper disposal via `useEffect` cleanup
- useFrame callback performance
- No unnecessary re-renders

### 4. Zustand State
- Actions properly defined
- No direct state mutation
- Persist middleware used correctly
- Selectors for derived state

### 5. Testing
- Unit tests for pure logic
- Mocks for Three.js/audio in tests
- E2E for user flows

### 6. Procedural Generation
- Models built from primitives only
- Audio via Web Audio/Tone.js synthesis
- No .obj, .gltf, .mp3 files

## Output

Use inline comments for specific code issues.
Use a summary comment for overall assessment.
Be constructive and specific.

---
