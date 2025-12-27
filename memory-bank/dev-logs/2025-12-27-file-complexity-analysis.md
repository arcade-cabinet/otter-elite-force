# File Complexity Analysis: Candidates for Subdirectory Split

> **Threshold**: Files > 400 lines are CRITICAL for splitting
> **Moderate**: Files 250-400 lines should be considered

---

## CRITICAL (> 400 lines) - 15 files

| File | Lines | Recommended Split |
|------|-------|-------------------|
| `ecs/archetypes/index.ts` | 1170 | Split into `ecs/archetypes/{enemies.ts, structures.ts, items.ts, player.ts}` |
| `systems/assembly/componentLibrary.ts` | 1042 | Split into `componentLibrary/{meshes.ts, materials.ts, skeletons.ts, factions.ts}` |
| `stores/gameStore.ts` | 886 | Split into `stores/{actions.ts, selectors.ts, state.ts}` or use Zustand slices |
| `systems/assembly/settlementAssembler.ts` | 724 | Split into `settlementAssembler/{layouts.ts, spawning.ts, paths.ts}` |
| `systems/assembly/structureAssembler.ts` | 721 | Split into `structureAssembler/{huts.ts, platforms.ts, watchtowers.ts}` |
| `stores/worldLayout.ts` | 633 | Split into `worldLayout/{poisson.ts, mst.ts, terrain.ts, pois.ts}` |
| `stores/worldGenerator.ts` | 614 | Split into `worldGenerator/{chunks.ts, entities.ts, decorations.ts}` |
| `ecs/renderers/index.tsx` | 536 | Split into `ecs/renderers/{enemies.tsx, structures.tsx, environment.tsx}` |
| `Scenes/Level.tsx` | 510 | **PRIORITY** - Extract into `Level/{GameWorld.tsx, PlayerController.tsx, ChunkManager.tsx}` |
| `ecs/data/weaponTemplates.ts` | 506 | Split into `weaponTemplates/{primary.ts, secondary.ts, attachments.ts}` |
| `Entities/PlayerRig.tsx` | 478 | Split into `PlayerRig/{Body.tsx, Limbs.tsx, Gear.tsx, Animations.ts}` |
| `ecs/components/index.ts` | 470 | Split into `components/{health.ts, movement.ts, combat.ts, ai.ts}` |
| `ecs/data/slots.ts` | 449 | OK as single file (mostly type definitions) |
| `ecs/integration/assemblyBridge.ts` | 406 | Split into `assemblyBridge/{structures.ts, settlements.ts, spawners.ts}` |
| `ecs/systems/AISystem.ts` | 404 | Split into `AISystem/{states.ts, behaviors.ts, pack.ts}` |

---

## MODERATE (250-400 lines) - 12 files

| File | Lines | Notes |
|------|-------|-------|
| `ecs/hooks.tsx` | 377 | Could split by hook type |
| `ecs/data/buildableTemplates.ts` | 369 | OK - data file |
| `systems/assembly/types.ts` | 343 | OK - type definitions |
| `systems/assembly/canteenLoadout.ts` | 331 | Could extract mesh assembly |
| `Scenes/Victory.tsx` | 328 | Could extract procedural scene elements |
| `systems/assembly/buildMode.ts` | 300 | OK for now |
| `UI/HUD.tsx` | 297 | Could extract sub-components |
| `Core/InputSystem.ts` | 294 | OK - cohesive |
| `Entities/ModularHut.tsx` | 282 | Could extract component parts |
| `stores/types.ts` | 276 | OK - type definitions |
| `ecs/world.ts` | 268 | OK - central ECS definition |
| `Entities/Enemies/Scout.tsx` | 257 | Could extract ScoutAI.ts |

---

## Priority Recommendations

### Phase 1: Immediate (Blocking Development)

1. **`stores/gameStore.ts` (886 lines)**
   - Extract into Zustand slices
   - `stores/slices/playerSlice.ts`
   - `stores/slices/saveSlice.ts`
   - `stores/slices/gameplaySlice.ts`
   - `stores/slices/uiSlice.ts`

2. **`Scenes/Level.tsx` (510 lines)**
   - This is the main game scene with 0% test coverage
   - Extract:
     - `Level/GameWorld.tsx` - 3D world rendering
     - `Level/PlayerController.tsx` - Movement logic
     - `Level/CollisionManager.ts` - Collision detection
     - `Level/ChunkRenderer.tsx` - Chunk visualization

3. **`ecs/archetypes/index.ts` (1170 lines)**
   - Split by entity category:
     - `archetypes/enemies.ts`
     - `archetypes/structures.ts`
     - `archetypes/items.ts`
     - `archetypes/environment.ts`

### Phase 2: High Impact

4. **`systems/assembly/componentLibrary.ts` (1042 lines)**
   - Split by concern:
     - `componentLibrary/meshDefinitions.ts`
     - `componentLibrary/materialFactory.ts`
     - `componentLibrary/skeletonFactory.ts`
     - `componentLibrary/factionPalettes.ts`

5. **`Entities/PlayerRig.tsx` (478 lines)**
   - Split into modular parts:
     - `PlayerRig/OtterBody.tsx`
     - `PlayerRig/Limbs.tsx`
     - `PlayerRig/GearSlots.tsx`
     - `PlayerRig/useAnimations.ts`

### Phase 3: Nice to Have

6. **World Generation Split**
   - `worldLayout.ts` + `worldGenerator.ts` could be unified under `world/`
   - `world/layout/poisson.ts`
   - `world/layout/mst.ts`
   - `world/generation/chunks.ts`
   - `world/generation/entities.ts`

---

## Current Directory Structure Issues

```
src/
├── stores/           # 4 large files, could use slices pattern
├── ecs/
│   ├── archetypes/   # 1 giant file (1170 lines!)
│   ├── components/   # 1 large file (470 lines)
│   ├── data/         # Well organized ✓
│   ├── systems/      # OK but AISystem is large
│   └── renderers/    # 1 large file (536 lines)
├── systems/assembly/ # Well organized but files are large
├── Scenes/           # Level.tsx needs splitting
├── Entities/         # Could use more subdirectories
│   ├── Enemies/      # OK ✓
│   ├── Environment/  # OK ✓
│   └── Objectives/   # OK ✓
└── UI/               # HUD could be split
```

---

## Suggested New Structure

```
src/
├── stores/
│   ├── slices/           # NEW
│   │   ├── playerSlice.ts
│   │   ├── saveSlice.ts
│   │   └── gameplaySlice.ts
│   ├── world/            # NEW - consolidate world gen
│   │   ├── layout.ts
│   │   ├── generator.ts
│   │   └── chunks.ts
│   └── types.ts
├── ecs/
│   ├── archetypes/
│   │   ├── enemies.ts    # NEW
│   │   ├── structures.ts # NEW
│   │   └── index.ts      # Barrel export
│   ├── components/
│   │   ├── health.ts     # NEW
│   │   ├── movement.ts   # NEW
│   │   └── index.ts
│   └── ...
├── Scenes/
│   ├── Level/            # NEW directory
│   │   ├── GameWorld.tsx
│   │   ├── PlayerController.tsx
│   │   ├── ChunkRenderer.tsx
│   │   └── index.tsx
│   └── ...
└── ...
```

---

## Summary

| Category | Files | Total Lines |
|----------|-------|-------------|
| CRITICAL (>400) | 15 | ~9,500 |
| MODERATE (250-400) | 12 | ~3,700 |
| **Total needing attention** | **27** | **~13,200** |

**Top 5 Files to Split First:**
1. `ecs/archetypes/index.ts` (1170 lines)
2. `systems/assembly/componentLibrary.ts` (1042 lines)
3. `stores/gameStore.ts` (886 lines)
4. `Scenes/Level.tsx` (510 lines) - 0% coverage!
5. `Entities/PlayerRig.tsx` (478 lines)
