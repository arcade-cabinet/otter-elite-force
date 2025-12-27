# Tech Context: OTTER: ELITE FORCE

## Technology Stack

- **Framework**: React 19 (Stable)
- **3D Engine**: Three.js (r160) via `@react-three/fiber`
- **Audio**: Tone.js (Web Audio API procedural synthesis)
- **AI**: YUKA (Steering, FSM, EntityManager)
- **State**: Zustand (with Persistence middleware)
- **Bundler**: Vite
- **Testing**: Vitest (Unit), Playwright (E2E)

## Development Setup

- **Node**: 20+ (LTS)
- **Package Manager**: pnpm 10
- **Linter**: Biome (unified check/format)
- **Repo Structure**: Modular TypeScript with domain separation

## Technical Constraints

### Procedural Supremacy (MANDATORY)
- **NO EXTERNAL ASSETS**: All geometry must be `THREE.BufferGeometry` primitives or code-generated
- No `.obj`, `.gltf`, `.glb`, `.png`, `.jpg`, `.mp3`, `.wav` files
- Everything rendered must be procedurally constructed at runtime

### Open World Persistence (MANDATORY)
- Chunks are generated deterministically from coordinate seeds
- Once discovered, chunks are stored in Zustand and NEVER regenerated
- World state changes (destroyed objectives, rescued villagers) persist
- Save schema v8 format for localStorage

### Mobile Browser Limits
- High priority: Handle intermittent `AudioContext` suspension
- Touch event quirks must be carefully routed
- Target 60fps on mid-range mobile devices
- Use `InstancedMesh` for dense vegetation/decorations

### React 19 Baseline
- Firmly established as project standard
- Use stable features only (no RC/experimental)
- Zustand for state management (not Context)

## Save Data Schema (v8)

```typescript
interface SaveData {
  version: 8;
  difficulty: 'SUPPORT' | 'TACTICAL' | 'ELITE';
  rank: number;
  xp: number;
  medals: number;
  coins: number;
  unlockedCharacters: string[];
  activeCharacter: string;
  discoveredChunks: Record<string, ChunkData>;
  securedChunks: string[];
  baseState: BaseState;
  territoryScore: number;
  peacekeepingScore: number;
  upgrades: {
    speed: number;
    health: number;
    damage: number;
  };
}
```

### Save Data Rules
- Key: `otter_v8` in localStorage
- Versioned to prevent conflicts between iterations
- Migration logic required for schema changes
- Quota error handling for localStorage limits

## Deployment Context

- **Hosting**: Render (Static Site) / GitHub Pages
- **Security**: Strict CSP headers in `render.yaml`
- **Shader Compilation**: `unsafe-eval` required for Three.js
- **Caching**: 1-year immutable caching for build assets

## Build & Test Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Local development server |
| `pnpm build` | Production build verification |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | End-to-end tests (Playwright) |
| `pnpm lint` | Biome linting and formatting |
| `pnpm typecheck` | TypeScript type verification |

## Key Dependencies

### Runtime
```json
{
  "react": "^19.2.3",
  "react-dom": "^19.2.3",
  "@react-three/fiber": "^8.x",
  "@react-three/drei": "^9.x",
  "three": "^0.160.0",
  "zustand": "^4.x",
  "tone": "^14.x",
  "yuka": "^0.7.x",
  "uuid": "^11.x"
}
```

### Development
```json
{
  "@biomejs/biome": "latest",
  "vitest": "^4.x",
  "@playwright/test": "^1.x",
  "vite": "^6.x",
  "typescript": "^5.x"
}
```

## Architecture Patterns

### Singleton Engines
`AudioEngine` and `InputSystem` are singletons managing long-lived browser resources:
- `AudioContext` for audio synthesis
- Touch/Mouse event listeners
- Independent of React component lifecycle

### Imperative Handles
`Projectiles` and `Particles` systems use `useImperativeHandle`:
- High-performance spawning without React re-renders
- Ref-based state for thousands of objects
- Direct buffer attribute manipulation

### Chunk-Based World Generation
```typescript
// Deterministic seeding from coordinates
const seed = hashCoords(x, y);
const rng = seededRandom(seed);

// Same coordinates = same terrain every time
generateChunk(5, 3) === generateChunk(5, 3) // Always true
```

### FSM-Driven Game States
```typescript
type GameMode = 
  | 'MENU'      // Main menu / game loader
  | 'CUTSCENE'  // Narrative sequences
  | 'GAME'      // Active gameplay
  | 'VICTORY'   // Extraction success
  | 'GAMEOVER'  // Death / Fall failure
  | 'CANTEEN';  // Meta-progression shop
```

## Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| FPS | 60fps stable | InstancedMesh, LOD |
| Bundle Size | <2MB | Code splitting |
| First Paint | <3s | Lazy loading |
| Memory | <200MB | Chunk cache limit |

## Known Technical Debt

- [ ] Continuous collision detection for high-framerate bullet tunneling
- [ ] localStorage quota error handling with user feedback
- [ ] Mobile safe-area padding for ultrawide devices
- [ ] Chunk hibernation for distant AI (CPU optimization)
- [ ] LOD system for dense enemy encounters
- [ ] Weather system performance impact

## Integration Points

### Audio Engine
- Must wait for user gesture before `AudioContext.resume()`
- Cross-fading for music transitions
- Synth pool for efficient SFX

### Input System
- Dual-stick touch controls via nipplejs
- Keyboard fallback for desktop
- Gyroscope integration for tilt aiming
- Touch routing to separate UI from gameplay

### Store Persistence
- Auto-save on significant state changes
- Debounced writes to prevent quota issues
- Schema validation on load
- Migration support for version upgrades
