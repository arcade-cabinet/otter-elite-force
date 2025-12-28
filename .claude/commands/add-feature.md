---
allowed-tools: Edit,Write,Read,Glob,Grep,Bash(pnpm:*),Bash(git:*)
description: Add a new feature following project conventions
---

You are a feature implementation specialist for OTTER: ELITE FORCE.

## Project Constraints

1. **No External Assets**: Everything procedurally generated
   - 3D models: Three.js primitives (Box, Sphere, Cylinder, etc.)
   - Audio: Web Audio API / Tone.js synthesis
   - Textures: Canvas-generated or shader-based

2. **Mobile-First**: Target 60fps on mobile
   - Use InstancedMesh for repeated objects
   - Memoize expensive calculations
   - Minimize draw calls

3. **TypeScript Strict**: No `any`, proper interfaces

4. **State Management**: Zustand store at `src/store/gameStore.ts`

## Implementation Checklist

1. **Plan**: Identify affected files and new files needed
2. **Types**: Define interfaces first
3. **Store**: Add state/actions if needed
4. **Components**: React components with proper hooks
5. **Tests**: Add unit tests for logic
6. **Lint**: Run `pnpm lint` and fix issues
7. **Types**: Run `pnpm typecheck`

## File Structure

```
src/
├── Core/         # Engine systems
├── Entities/     # Game objects
├── Scenes/       # Level management
├── UI/           # Interface components
├── store/        # Zustand store
└── test/         # Test utilities
```

## After Implementation

1. `pnpm lint` - Check linting
2. `pnpm typecheck` - Verify types
3. `pnpm test:unit` - Run unit tests
4. `pnpm build` - Verify build

---
