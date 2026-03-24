# UI + SP-DSL Architecture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Phaser UI with React+shadcn across three visual themes, migrate from Zustand to Koota-only state, compile SP-DSL layered sprites to PNGs at build time, and create a GOAP AI playtester that plays the game like a human.

**Architecture:** React 19 owns ALL UI (menus, HUD, briefings) via Phaser's official template pattern. Koota is the single state layer — React reads via @koota/react hooks, Phaser systems write during game loop. SP-DSL definitions compile at build time to PNG spritesheets. A Yuka GOAP agent plays the game through real browser events as the ultimate E2E test.

**Tech Stack:** React 19, @koota/react, shadcn/ui, Tailwind 4, Phaser 3.90, Koota ECS, Yuka GOAP, node-canvas, Vitest

**Spec:** `docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md`

**Design Docs:** `docs/design/` (game-design-document, art-direction, audio-design, balance-framework, mission-design-guide)

**Reference:** `docs/references/Copilot-Copilot_Chat_VT91k21R.md` (UI design direction, SP-DSL format)

**Phaser React Template:** `/Users/jbogaty/src/reference-codebases/template-react/` (official integration pattern)

---

## Phase A: Foundation — React + Phaser Integration + Koota Hooks

### Task A1: Install React deps + Vite React plugin + Tailwind
**Owner:** infra-agent
**Files:**
- Modify: `package.json` (add react, react-dom, @koota/react, @vitejs/plugin-react, tailwindcss, @radix-ui/*, shadcn deps)
- Modify: `vite.config.ts` (add react plugin)
- Create: `tailwind.config.ts` (three-theme color palette from spec §4)
- Create: `src/index.css` (Tailwind directives + theme CSS variables)
- Modify: `index.html` (React root div wrapping game-container)
- Remove: `zustand` from package.json

### Task A2: PhaserGame wrapper + EventBus
**Owner:** infra-agent
**Files:**
- Create: `src/app/PhaserGame.tsx` (forwardRef wrapper — follow template-react pattern exactly)
- Create: `src/app/EventBus.ts` (Phaser EventEmitter)
- Create: `src/app/App.tsx` (root — renders PhaserGame + screen router)
- Modify: `src/main.ts` (render React App instead of raw Phaser.Game)
- Modify: `src/game/config.ts` (Phaser config: parent='game-container', no UI scenes)

### Task A3: Koota singleton state traits + remove Zustand
**Owner:** state-agent
**Files:**
- Create: `src/ecs/traits/state.ts` (ResourcePool, PopulationState, GameClock, AppScreen, CampaignProgress, UserSettings, Selected tag)
- Delete: `src/stores/` (all 5 Zustand stores)
- Modify: `src/systems/economySystem.ts` (read/write ResourcePool trait instead of Zustand)
- Modify: `src/systems/productionSystem.ts` (PopulationState instead of resourceStore)
- Modify: `src/systems/scoringSystem.ts` (no Zustand)
- Modify: Any other file importing from `@/stores/`
- Create: `src/ecs/singletons.ts` (helper: initSingletons(world) creates ResourcePool, GameClock, AppScreen, etc.)

### Task A4: Phaser scene reduction
**Owner:** infra-agent
**Files:**
- Simplify: `src/Scenes/BootScene.ts` (load PNGs from public/assets/, emit 'boot-complete')
- Simplify: `src/Scenes/GameScene.ts` (canvas only — terrain, units, fog, camera. No HUD.)
- Delete: `src/Scenes/MenuScene.ts`, `HUDScene.ts`, `BriefingScene.ts`, `PauseScene.ts`, `VictoryScene.ts`, `CampaignMapScene.ts`
- Modify: `src/game/config.ts` (scene list: [BootScene, GameScene] only)

---

## Phase B: Specification Tests (tests FIRST)

### Task B1: React component spec tests
**Owner:** test-agent
**Files:**
- Create: `src/__tests__/specs/ui/resource-bar.test.tsx`
- Create: `src/__tests__/specs/ui/unit-panel.test.tsx`
- Create: `src/__tests__/specs/ui/action-bar.test.tsx`
- Create: `src/__tests__/specs/ui/main-menu.test.tsx`
- Create: `src/__tests__/specs/ui/briefing-screen.test.tsx`
- Create: `src/__tests__/specs/ui/campaign-map.test.tsx`

Tests define what each component SHOULD render given Koota state:
- ResourceBar shows "150" when Koota ResourcePool has fish=150
- UnitPanel shows Mudfoot stats when an entity has Selected + UnitType('mudfoot')
- ActionBar shows "Train Mudfoot" when a Barracks has Selected tag
- MainMenu shows "Continue" when CampaignProgress has started missions
- BriefingScreen animates dialogue lines from MissionDef
- CampaignMap shows star ratings from CampaignProgress

### Task B2: SP-DSL build pipeline spec tests
**Owner:** test-agent
**Files:**
- Create: `src/__tests__/specs/spdsl/layer-composition.test.ts`
- Create: `src/__tests__/specs/spdsl/palette-resolution.test.ts`
- Create: `src/__tests__/specs/spdsl/spritesheet-packing.test.ts`
- Create: `src/__tests__/specs/spdsl/multi-resolution.test.ts`

Tests:
- 3 layers compose in zIndex order (higher z draws on top)
- Palette index '4' resolves to correct hex for otter_default
- Spritesheet packing produces atlas JSON with valid frame rects
- 1x, 2x, 3x outputs all exist with correct dimensions

### Task B3: Koota state spec tests
**Owner:** test-agent
**Files:**
- Create: `src/__tests__/specs/state/resource-pool.test.ts`
- Create: `src/__tests__/specs/state/app-screen.test.ts`
- Create: `src/__tests__/specs/state/campaign-progress.test.ts`

Tests:
- ResourcePool trait updates correctly via economySystem
- AppScreen changes drive React screen routing
- CampaignProgress serializes/deserializes to SQLite correctly
- Selected tag addition triggers @koota/react re-render

### Task B4: AI playtester perception spec tests
**Owner:** test-agent
**Files:**
- Create: `src/__tests__/specs/ai-playtester/perception.test.ts`
- Create: `src/__tests__/specs/ai-playtester/input.test.ts`

Tests:
- Perception model only includes entities in revealed fog tiles
- Perception excludes entities outside camera viewport
- Input actions dispatch real MouseEvents to canvas
- APM limiter throttles actions correctly
- Camera scroll updates viewport bounds

---

## Phase C: SP-DSL Build Pipeline

### Task C1: SP-DSL types + shared palettes
**Owner:** pipeline-agent
**Files:**
- Modify: `src/entities/types.ts` (add SPDSLSprite, SpriteLayer, ProceduralRules to existing types)
- Create: `src/entities/palettes.ts` (PALETTES record: otter_default, croc_default — brown fur, not teal)
- Delete: `src/entities/palette.ts` (old single PALETTE constant)

### Task C2: Build script — layer compositor + spritesheet packer
**Owner:** pipeline-agent
**Files:**
- Create: `scripts/build-sprites.ts` (Node script using canvas package)
  - Import all entity definitions
  - Resolve palettes
  - Compose layers per zIndex
  - Apply offsets + blend modes
  - Generate procedural variants
  - Scale to 1x, 2x, 3x
  - Pack into spritesheets per category
  - Output PNGs + atlas JSON to public/assets/
  - Output manifest.json
- Modify: `package.json` (add `"build:sprites"` script, add `canvas` dev dep)

### Task C3: Migrate entity definitions to SP-DSL layers
**Owner:** sprite-agent
**Files:**
- Modify: ALL files in `src/entities/units/`, `buildings/`, `resources/`, `props/`, `portraits/`
- Change: monolithic `sprite.frames.idle` string[][] → `sprite.layers` array with zIndex, separate body/uniform/weapon
- Change: ASCII chars → palette numeric indices
- Change: palette reference from inline to named (`palette: 'otter_default'`)
- Fix: otter skin colors to brown (#5C4033, #8B7355) not teal

### Task C4: Run build, generate PNGs, wire into BootScene
**Owner:** pipeline-agent
**Files:**
- Run: `pnpm run build:sprites` → verify PNGs in public/assets/
- Modify: `src/Scenes/BootScene.ts` (load PNGs via this.load.atlas())
- Modify: `src/Scenes/GameScene.ts` (use atlas frame keys for sprites)
- Delete: `src/entities/renderer.ts` (runtime Canvas rendering — replaced by PNGs)

---

## Phase D: React UI Components (satisfy Phase B tests)

### Task D1: Theme CSS + Tailwind config
**Owner:** ui-agent
**Files:**
- Create: `src/ui/themes/tactical.css`
- Create: `src/ui/themes/command-post.css`
- Create: `src/ui/themes/briefing.css`
- Modify: `tailwind.config.ts` (all colors from spec §4)
- Create: `src/ui/themes/index.ts` (theme switcher utility)

### Task D2: shadcn component setup
**Owner:** ui-agent
**Files:**
- Run: shadcn init + add Button, Dialog, Tooltip, Card, ScrollArea
- Create: `src/ui/shared/StarRating.tsx`, `HealthBar.tsx`, `TooltipField.tsx`

### Task D3: Tactical HUD components
**Owner:** ui-agent
**Files:**
- Create: `src/ui/hud/ResourceBar.tsx` (reads Koota ResourcePool)
- Create: `src/ui/hud/Minimap.tsx` (reads Koota positions, phosphor green)
- Create: `src/ui/hud/UnitPanel.tsx` (reads Selected entities)
- Create: `src/ui/hud/ActionBar.tsx` (context-sensitive commands)
- Create: `src/ui/hud/BuildMenu.tsx` (building/training queue)
- Create: `src/ui/hud/AlertBanner.tsx` (attack warnings)

### Task D4: Command Post components
**Owner:** ui-agent
**Files:**
- Create: `src/ui/command-post/MainMenu.tsx`
- Create: `src/ui/command-post/CampaignMap.tsx`
- Create: `src/ui/command-post/SettingsPanel.tsx`

### Task D5: Briefing components
**Owner:** ui-agent
**Files:**
- Create: `src/ui/briefing/BriefingScreen.tsx` (typewriter dialogue)
- Create: `src/ui/briefing/PortraitDisplay.tsx` (large rendered portrait)
- Create: `src/ui/briefing/DeployButton.tsx` (military styled)

### Task D6: Mobile components
**Owner:** ui-agent
**Files:**
- Create: `src/ui/mobile/SquadTabs.tsx`
- Create: `src/ui/mobile/CommandButtons.tsx`
- Create: `src/ui/mobile/RadialMenu.tsx`

### Task D7: App.tsx screen routing + theme switching
**Owner:** ui-agent
**Files:**
- Modify: `src/app/App.tsx` (read AppScreen from Koota, render correct screen + theme)
- Wire: MainMenu → CampaignMap → Briefing → Game+HUD → Victory flow

---

## Phase E: AI Playtester

### Task E1: PlayerPerception model
**Owner:** ai-agent
**Files:**
- Create: `src/ai/playtester/perception.ts` (builds PlayerPerception from Koota, fog-constrained, viewport-constrained)

### Task E2: PlayerInput model
**Owner:** ai-agent
**Files:**
- Create: `src/ai/playtester/input.ts` (PlayerAction → real MouseEvent dispatch to canvas, APM limiter, error rate)

### Task E3: GOAP goal structure
**Owner:** ai-agent
**Files:**
- Create: `src/ai/playtester/goals/` (SurviveGoal, EconomyGoal, MilitaryGoal, ObjectiveGoal, ExplorationGoal + subgoals)
- Create: `src/ai/playtester/evaluators/` (SurviveEvaluator, EconomyEvaluator, etc.)
- Create: `src/ai/playtester/AIPlaytester.ts` (Think brain + tick loop)

### Task E4: Single mission E2E test
**Owner:** ai-agent
**Files:**
- Create: `src/__tests__/e2e/ai-mission-1.test.ts`
- Test: AI completes Mission 1 on Support difficulty via real input

### Task E5: Full campaign E2E test
**Owner:** ai-agent
**Files:**
- Create: `src/__tests__/e2e/ai-full-campaign.test.ts`
- Test: AI completes all 16 missions on Support

---

## Phase F: Integration + Visual QC

### Task F1: Visual snapshot tests
**Owner:** test-agent
**Files:**
- Create: `src/__tests__/visual/themes/` (screenshot baselines for all 3 themes)
- Create: `src/__tests__/visual/sprites/` (compiled PNG validation)

### Task F2: Integration tests
**Owner:** test-agent
**Files:**
- Update: `src/__tests__/browser/` (React mount → Phaser boot → scene flow)
- Test: full pipeline Menu → Briefing → Deploy → Game → Victory

### Task F3: Chrome DevTools playtest + screenshots
**Owner:** lead (me)
- Verify game boots with real pixel art sprites from compiled PNGs
- Verify React HUD renders over Phaser canvas
- Verify three themes apply correctly
- Screenshot every screen for visual QC

---

## Phase G: Cleanup + Tag

### Task G1: Delete legacy code
- Delete: `src/stores/` (Zustand)
- Delete: `src/entities/palette.ts` (old single palette)
- Delete: `src/entities/renderer.ts` (runtime Canvas)
- Delete: Old Phaser UI scenes (Menu, HUD, Briefing, Pause, Victory, CampaignMap)
- Delete: `smol-toml` from deps
- Remove: unused imports across codebase

### Task G2: Final verification + tag
- Run: `pnpm tsc --noEmit` (0 errors)
- Run: `pnpm vitest run` (all spec tests pass)
- Run: `pnpm test:browser` (visual + integration pass)
- Run: `pnpm build:sprites` (PNGs generate)
- Run: `pnpm build` (production build clean)
- Run: `pnpm dev` → Chrome DevTools screenshot
- Tag: `git tag v0.4.0-ui-spdsl`

---

## Dependency Graph

```
A1 (deps+tailwind) ──→ A2 (PhaserGame+EventBus) ──→ A4 (scene reduction)
                   └──→ A3 (Koota state)

B1-B4 (spec tests) — can start after A1+A3

C1 (SP-DSL types) ──→ C2 (build script) ──→ C3 (migrate entities) ──→ C4 (wire PNGs)

D1 (themes) ──→ D2 (shadcn) ──→ D3-D7 (all UI components)

E1 (perception) ──→ E2 (input) ──→ E3 (GOAP goals) ──→ E4-E5 (E2E tests)

F1-F3 (integration QC) — after D + C4 + E4

G1-G2 (cleanup + tag) — after everything
```

## Agent Team (8 agents)

| Agent | Owns | Track |
|-------|------|-------|
| **infra-agent** | A1, A2, A4 | React+Phaser scaffold, scene reduction |
| **state-agent** | A3 | Koota migration, kill Zustand |
| **test-agent** | B1-B4, F1-F2 | ALL specification + visual + integration tests |
| **pipeline-agent** | C1, C2, C4 | SP-DSL types, build script, PNG wiring |
| **sprite-agent** | C3 | Migrate ALL entity definitions to SP-DSL layers |
| **ui-agent** | D1-D7 | ALL React components, themes, routing |
| **ai-agent** | E1-E5 | Perception, input, GOAP goals, E2E tests |
| **lead** | F3, G1-G2 | Chrome DevTools playtest, cleanup, tag |
