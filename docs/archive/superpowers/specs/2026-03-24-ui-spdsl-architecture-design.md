# UI Architecture + SP-DSL Sprite Pipeline Design

**Date:** 2026-03-24
**Status:** Approved

---

## 1. Overview

Comprehensive redesign of the game's UI layer and sprite pipeline. React returns as the UI framework (via Phaser's official template pattern), shadcn/ui provides themed components across three visual modes, SP-DSL replaces ASCII grids for layered compositional sprites compiled at build time to PNGs, Zustand is removed entirely in favor of Koota as the single state layer, and a Yuka GOAP AI playtester provides full-stack E2E testing through simulated human input.

---

## 2. Technology Changes

### Add
| Package | Purpose |
|---------|---------|
| `react` 19 | UI framework |
| `react-dom` 19 | DOM rendering |
| `@koota/react` | Koota hooks for React (useQuery, useTrait, useWorld) |
| `tailwindcss` 4 | Utility CSS for three themes |
| `shadcn/ui` | Base UI components (Button, Dialog, Tooltip, etc.) |
| `@radix-ui/*` | Primitives underlying shadcn |
| `canvas` (node-canvas) | Build-time sprite compilation (dev dependency) |
| `@vitejs/plugin-react` | Vite React support |

### Remove
| Package | Reason |
|---------|--------|
| `zustand` | Replaced by Koota as single state layer |
| `smol-toml` | No longer parsing TOML |

### Keep
| Package | Role |
|---------|------|
| `phaser` 3.90 | Game canvas ONLY (terrain, units, fog, combat) |
| `koota` + traits/relations/queries | ALL state management |
| `yuka` | AI pathfinding, steering, FSM, GOAP playtester |
| `@capacitor-community/sqlite` | Persistence (Koota world ↔ SQLite) |
| `tone` | Procedural audio |
| `@biomejs/biome` | Lint/format |
| `vitest` + `@vitest/browser-playwright` | Testing (3 layers + AI playtester) |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React App (root)                         │
│                                                              │
│  ┌─ Theme 1: Tactical HUD ────────────────────────────────┐ │
│  │  ResourceBar │ Minimap │ UnitPanel │ ActionBar │ Alerts │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ Theme 2: Command Post ────────────────────────────────┐ │
│  │  MainMenu │ CampaignMap │ Settings │ Canteen            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ Theme 3: Briefing ───────────────────────────────────┐  │
│  │  BriefingScreen │ PortraitDisplay │ DeployButton       │  │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ PhaserGame (wrapper component) ──────────────────────┐  │
│  │  BootScene → GameScene (canvas: terrain, units, fog)   │  │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                     Koota ECS World                          │
│  (ALL state — React reads via @koota/react hooks,            │
│   Phaser systems write during game loop)                     │
├──────────────────────────────────────────────────────────────┤
│  Yuka AI │ Capacitor SQLite │ Tone.js Audio                  │
└──────────────────────────────────────────────────────────────┘
```

### Communication
- **EventBus** (Phaser EventEmitter): scene lifecycle signals only — `boot-complete`, `scene-ready`, `mission-complete`, `mission-failed`
- **React refs**: imperative Phaser control — `startScene('Game', data)`, `pauseScene()`, `resumeScene()`
- **Koota**: the shared state BOTH sides read. React via `useQuery`/`useTrait` hooks. Phaser via direct `world.query()` in systems. No intermediate stores.

### App Flow
```
React: MainMenu (command-post theme)
  → Click "New Deployment"
React: CampaignMap (command-post theme)
  → Click mission marker
React: BriefingScreen (briefing theme)
  → Click "Deploy"
React: PhaserGame + HUD overlay (tactical theme)
  → Phaser GameScene starts, Koota world populates
  → Game plays, HUD reads Koota state via hooks
  → Mission complete → Koota AppScreen changes
React: VictoryOverlay (tactical theme)
  → Click "Next Mission"
React: CampaignMap
  → Continue campaign...
```

---

## 4. Three Visual Themes

### Theme 1: Tactical HUD (gameplay)
- Background: `#0f2f1c` jungle depth green
- Text: stenciled monospace, `#c2b28a` muddy khaki
- Accents: `#00ff41` phosphor green (minimap, selection), `#ff4500` blood orange (alerts, enemies)
- Borders: thick beveled, gunmetal gray
- Textures: canvas grain, subtle noise overlay
- Wraps AROUND the Phaser canvas during gameplay

### Theme 2: Command Post (menus, campaign map, settings)
- Background: `#3a2f1e` rust brown
- Text: typewriter headers, `#d4a574` faded yellow labels
- Panels: scratched metal, riveted edges
- Campaign map: weathered parchment/atlas substrate
- Manila folder aesthetic for mission select

### Theme 3: Mission Briefing
- Background: dark with spotlight vignette
- Portrait: rendered large, character name in faction-colored accent
- Dialogue: typewriter animation, dossier/intel report layout
- Single CTA: "DEPLOY >>" button, military emphasis
- Minimal chrome — portrait and text dominate

### Shared Tailwind Config
All three themes share one `tailwind.config.ts` with the color palette:
```
jungle-depth: '#0f2f1c'
khaki: '#c2b28a'
rust: '#3a2f1e'
gunmetal: '#6b4e3a'
phosphor: '#00ff41'
blood-orange: '#ff4500'
faded-yellow: '#d4a574'
parchment: '#f5e6c8'
```
Themes switch via `data-theme` attribute on the root element. CSS variables per theme.

---

## 5. React Component Structure

```
src/
├── app/
│   ├── App.tsx                    # Root — theme switching + screen routing
│   ├── PhaserGame.tsx             # Wrapper (official template forwardRef pattern)
│   └── EventBus.ts                # Phaser EventEmitter for lifecycle signals
│
├── ui/
│   ├── themes/
│   │   ├── tactical.css           # HUD theme CSS variables
│   │   ├── command-post.css       # Menu/campaign theme variables
│   │   └── briefing.css           # Briefing theme variables
│   │
│   ├── hud/
│   │   ├── ResourceBar.tsx
│   │   ├── Minimap.tsx
│   │   ├── UnitPanel.tsx
│   │   ├── ActionBar.tsx
│   │   ├── BuildMenu.tsx
│   │   └── AlertBanner.tsx
│   │
│   ├── command-post/
│   │   ├── MainMenu.tsx
│   │   ├── CampaignMap.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── CanteenScreen.tsx
│   │
│   ├── briefing/
│   │   ├── BriefingScreen.tsx
│   │   ├── PortraitDisplay.tsx
│   │   └── DeployButton.tsx
│   │
│   ├── shared/
│   │   ├── StarRating.tsx
│   │   ├── HealthBar.tsx
│   │   └── TooltipField.tsx
│   │
│   └── mobile/
│       ├── SquadTabs.tsx
│       ├── CommandButtons.tsx
│       └── RadialMenu.tsx
│
├── game/
│   ├── scenes/
│   │   ├── BootScene.ts           # Load PNGs from public/assets/
│   │   └── GameScene.ts           # Terrain, units, fog, combat, camera
│   ├── EventBus.ts
│   └── config.ts                  # Phaser.Game config (canvas only, no UI scenes)
```

---

## 6. SP-DSL Sprite Format

### Entity Definition (TypeScript module)

```typescript
export const mudfoot: EntityDef = {
  id: 'mudfoot',
  faction: 'ura',
  category: 'infantry',
  base: { width: 16, height: 16 },

  sprite: {
    palette: 'otter_default',
    layers: [
      { id: 'shadow', zIndex: 0, grid: [/* shadow pixels */] },
      { id: 'body', zIndex: 1, grid: [/* otter body in brown fur tones */] },
      { id: 'uniform', zIndex: 2, grid: [/* blue URA uniform */] },
      { id: 'weapon', zIndex: 3, offset: [1, -1], grid: [/* sword */] },
    ],
    animations: {
      idle: { frames: [0], rate: 1 },
      walk: { frames: [0, 1], rate: 6 },
      attack: { frames: [0, 1, 2], rate: 10 },
    },
    procedural: {
      mud_splatter: 'random',
      damage_overlay: 'conditional',
    },
  },

  // Gameplay stats (same as current)
  hp: 80, armor: 2, damage: 12, range: 1,
  attackCooldown: 1.0, speed: 8, visionRadius: 5,
  cost: { fish: 80, salvage: 20 },
  populationCost: 1, trainTime: 10,
  trainedAt: 'barracks', unlockedAt: 'mission_1',
  tags: ['IsUnit'],
};
```

### Shared Palettes

```typescript
export const PALETTES = {
  otter_default: {
    '0': 'transparent',
    '1': '#000000',      // outline
    '2': '#5C4033',      // dark brown fur
    '3': '#8B7355',      // light brown fur/belly
    '4': '#1a1a1a',      // nose/dark detail
    '5': '#1e3a8a',      // blue (URA uniform)
    '6': '#3b82f6',      // light blue (uniform highlight)
    '7': '#78350f',      // dark wood (weapons/tools)
    '8': '#b45309',      // light wood
    '9': '#ffffff',      // eye highlight
  },
  croc_default: {
    '0': 'transparent',
    '1': '#000000',
    '2': '#166534',      // dark green (reptile)
    '3': '#22c55e',      // light green
    '4': '#1a1a1a',      // dark detail
    '5': '#7f1d1d',      // red (Scale-Guard)
    '6': '#ef4444',      // light red
    '7': '#4b5563',      // stone/metal
    '8': '#9ca3af',      // light stone
    '9': '#eab308',      // gold accent
  },
};
```

### Build Pipeline

```
pnpm run build:sprites

Input:  src/entities/**/*.ts (SP-DSL definitions)
Output: public/assets/{units,buildings,terrain,portraits}/*.png + *.json

Process:
1. Import all entity definitions
2. For each entity with sprite data:
   a. Resolve palette by name
   b. Compose layers bottom-up (zIndex order)
   c. Apply offsets per layer
   d. Apply blend modes
   e. Generate procedural variants (mud_splatter etc.)
   f. For each animation frame:
      - Render composite at base resolution
      - Scale to 1x, 2x, 3x (nearest-neighbor)
   g. Pack frames into spritesheet
3. Output: PNG spritesheet + JSON atlas per category
4. Output: manifest.json mapping entity IDs → atlas frame keys

Tool: Node.js script using `canvas` (node-canvas) package
Format: Phaser-compatible atlas JSON (TexturePacker format)
```

---

## 7. Koota as Single State Layer

### Remove All Zustand

Delete: `src/stores/campaignStore.ts`, `settingsStore.ts`, `rtsGameStore.ts`, `resourceStore.ts`, `territoryStore.ts`

### New Koota Singleton Traits

```typescript
// Game resources (singleton entity)
const ResourcePool = trait({ fish: 0, timber: 0, salvage: 0 });
const PopulationState = trait({ current: 0, max: 4 });

// Game clock and flow
const GameClock = trait({ elapsed: 0, paused: false });
const AppScreen = trait({ screen: 'menu' as AppScreenType });
// AppScreenType = 'menu' | 'campaign' | 'briefing' | 'game' | 'victory' | 'settings'

// Campaign persistence (singleton, serialized to SQLite)
const CampaignProgress = trait(() => ({
  missions: {} as Record<string, { status: string; stars: number; bestTime: number }>,
  currentMission: null as string | null,
  difficulty: 'support' as string,
}));

// User preferences (singleton, serialized to SQLite)
const UserSettings = trait(() => ({
  musicVolume: 0.7,
  sfxVolume: 1.0,
  touchMode: 'auto' as string,
  showGrid: false,
}));

// Selection state
const Selected = trait(); // tag on selected entities
```

### React Reads Koota

```tsx
function ResourceBar() {
  const pool = useQueryFirst(ResourcePool);
  const res = useTrait(pool, ResourcePool);
  return (
    <div className="resource-bar">
      <span>FISH: {res?.fish ?? 0}</span>
      <span>TIMBER: {res?.timber ?? 0}</span>
    </div>
  );
}
```

### Persistence

Koota world → `serializeWorld()` → Capacitor SQLite (existing `saveLoadSystem.ts`). On load: SQLite → `deserializeWorld()`. No Zustand persistence layer.

---

## 8. Phaser Scene Reduction

### Before (8 scenes)
Boot, Menu, CampaignMap, Briefing, Game, HUD, Pause, Victory

### After (2 scenes)
- **BootScene** — Load PNG spritesheets from `public/assets/`, emit `boot-complete` via EventBus
- **GameScene** — Terrain painting, unit sprites, fog of war, projectiles, particles, camera. NO UI rendering.

React handles ALL other screens. Phaser is a pure rendering engine for the battlefield.

---

## 9. AI Playtester (Yuka GOAP with Human Perception)

### Constraints (simulated human)
- **Sees only revealed tiles** — fog of war constrains perception
- **Inputs via real events** — dispatches MouseEvent/PointerEvent to Phaser's canvas element
- **Reads only UI-visible data** — resource counts, selected unit stats, minimap dots
- **Must scroll camera** — can only interact with what's in the viewport
- **Human-like timing** — configurable APM (30-60 casual, 120 skilled), action delay between decisions
- **Can misclick** — configurable error rate for input accuracy
- **No Koota direct access** — reads a `PlayerPerception` model built from visible state only

### Perception Model

```typescript
interface PlayerPerception {
  viewport: { x: number, y: number, width: number, height: number };
  exploredTiles: Set<string>;
  resources: { fish: number, timber: number, salvage: number };
  population: { current: number, max: number };
  selectedUnits: VisibleUnitInfo[];
  visibleFriendlyUnits: VisibleUnitInfo[];
  visibleEnemyUnits: VisibleUnitInfo[];
  visibleBuildings: VisibleBuildingInfo[];
  visibleResources: VisibleResourceInfo[];
  minimapDots: MinimapDot[];
}
```

### Input Model

```typescript
interface PlayerAction {
  type: 'click' | 'rightClick' | 'drag' | 'scroll' | 'keypress';
  screenX: number;
  screenY: number;
  endX?: number;      // for drag
  endY?: number;
  duration?: number;
  key?: string;
}

// Dispatched to Phaser canvas as real browser events
function executeAction(canvas: HTMLCanvasElement, action: PlayerAction) {
  canvas.dispatchEvent(new MouseEvent('mousedown', {
    clientX: action.screenX,
    clientY: action.screenY,
    button: action.type === 'rightClick' ? 2 : 0,
  }));
  // ... mouseup after duration
}
```

### Goal Structure (Yuka GOAP)

```
Think (top-level arbitrator)
├── SurviveEvaluator → DefendBaseGoal
│   ├── ScrollToBaseGoal
│   ├── SelectMilitaryUnitsGoal
│   └── AttackNearestEnemyGoal
├── EconomyEvaluator → BuildEconomyGoal
│   ├── SelectIdleWorkerGoal
│   ├── RightClickResourceGoal
│   ├── OpenBuildMenuGoal
│   ├── PlaceFishTrapGoal
│   └── PlaceBurrowGoal
├── MilitaryEvaluator → BuildArmyGoal
│   ├── SelectBarracksGoal
│   ├── ClickTrainButtonGoal
│   └── SetRallyPointGoal
├── ObjectiveEvaluator → CompleteObjectiveGoal
│   ├── ScrollToObjectiveGoal
│   ├── SelectArmyGoal
│   ├── RightClickObjectiveGoal
│   └── WaitForCompletionGoal
└── ExplorationEvaluator → ScoutMapGoal
    ├── SelectScoutGoal
    ├── RightClickUnexploredGoal
    └── ScrollToFollowGoal
```

### Test Levels

```typescript
// Single mission
it('AI completes Mission 1 on Support', async () => {
  const { world, canvas } = bootGame();
  loadMission(world, 'mission_1', 'support');
  const ai = new AIPlaytester(canvas, world, { apm: 60, errorRate: 0.05 });
  const result = await runUntilComplete(ai, { maxTicks: 30000 });
  expect(result.outcome).toBe('victory');
});

// Full campaign
it('AI completes all 16 missions on Support', async () => {
  for (const mission of CAMPAIGN) {
    const { world, canvas } = bootGame();
    loadMission(world, mission.id, 'support');
    const ai = new AIPlaytester(canvas, world, { apm: 60 });
    const result = await runUntilComplete(ai, { maxTicks: 60000 });
    expect(result.outcome).toBe('victory');
  }
}, 600000);
```

---

## 10. Testing Strategy (docs → tests → code)

### Layer 1: Component Specification Tests (Vitest + @testing-library/react)
- ResourceBar renders correct values from Koota state
- UnitPanel shows Mudfoot stats when Selected
- MainMenu shows "Continue" only when campaign has progress
- BriefingScreen typewriter-animates dialogue
- Theme switching applies correct CSS variables
- Mobile components render at 375px viewport

### Layer 2: Visual Snapshot Tests (Vitest browser mode)
- Each theme renders correctly (tactical, command-post, briefing)
- Each compiled sprite PNG exists and has correct dimensions
- Spritesheet atlas JSON has valid frame rects
- Campaign map renders with mission markers

### Layer 3: Integration Tests (Vitest browser + Phaser)
- React mounts PhaserGame → BootScene loads PNGs → EventBus emits boot-complete
- Full flow: MainMenu → CampaignMap → Briefing → Deploy → GameScene
- Koota resource changes → React ResourceBar re-renders
- Select unit in Phaser → Selected tag → React UnitPanel updates

### Layer 4: AI Playtester Tests (Vitest + Yuka GOAP)
- AI beats Mission 1 on Support (single mission E2E)
- AI beats all 16 missions on Support (full campaign E2E)
- AI achieves Bronze+ on Missions 1-4 (score validation)
- AI economy reaches 100 fish in 60s (economy health check)

### SP-DSL Build Tests (Node, vitest)
- Layer composition produces correct pixel data
- Palette indices resolve to correct hex colors
- Procedural variation generates distinct outputs
- Multi-resolution scaling produces all 3 sizes
- Atlas JSON matches spritesheet dimensions

---

## 11. What Gets Deleted

| Delete | Reason |
|--------|--------|
| `src/stores/` (all 5 Zustand stores) | Koota replaces entirely |
| `src/Scenes/MenuScene.ts` | React MainMenu |
| `src/Scenes/BriefingScene.ts` | React BriefingScreen |
| `src/Scenes/HUDScene.ts` | React HUD components |
| `src/Scenes/PauseScene.ts` | React overlay |
| `src/Scenes/VictoryScene.ts` | React overlay |
| `src/Scenes/CampaignMapScene.ts` | React CampaignMap |
| `src/entities/palette.ts` | Replaced by `palettes.ts` with named palettes |
| `src/entities/renderer.ts` | Replaced by build-time compiler |
| `src/sprites/` (if still exists) | Legacy |
| `zustand` from package.json | No longer used |

---

## 12. What Gets Kept/Adapted

| Keep | Adaptation |
|------|-----------|
| `src/Scenes/BootScene.ts` | Simplified: just load PNGs from public/assets/ |
| `src/Scenes/GameScene.ts` | Simplified: no UI, just canvas rendering |
| `src/ecs/` (all Koota traits, relations, queries) | Add singleton state traits |
| `src/systems/` (all game systems) | Unchanged |
| `src/ai/` (pathfinding, FSM, skirmish AI) | Add GOAP playtester |
| `src/entities/` (definitions) | Migrate from ASCII grids to SP-DSL layers |
| `src/persistence/` (SQLite) | Remove Zustand refs, wire to Koota directly |
| `src/input/` | Keep desktop + mobile input, they dispatch to Phaser |
