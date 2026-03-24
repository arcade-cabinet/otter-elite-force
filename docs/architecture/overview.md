# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     PHASER GAME                          │
│                                                          │
│  BootScene ──→ MenuScene ──→ BriefingScene ──→ GameScene │
│                                                  ↕       │
│                                               HUDScene   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ENTITY DEFINITIONS (src/entities/)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ UnitDef  │ │BuildDef  │ │ ResDef   │ │MissionDef│   │
│  │ sprite + │ │ sprite + │ │ sprite + │ │ terrain  │   │
│  │ stats +  │ │ stats +  │ │ yield +  │ │ zones +  │   │
│  │ AI +     │ │ trains + │ │ regrowth │ │ triggers │   │
│  │ drops    │ │ heals    │ │          │ │ briefing │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │             │            │             │          │
│       ▼             ▼            ▼             ▼          │
│  ┌─────────────────────────────────────────────────┐     │
│  │              RENDERER (entities/renderer.ts)     │     │
│  │  ASCII grid + PALETTE → Canvas → Phaser Texture  │     │
│  └─────────────────────────────────────────────────┘     │
│       │                                                   │
│       ▼                                                   │
│  ┌─────────────────────────────────────────────────┐     │
│  │              SPAWNER (entities/spawner.ts)        │     │
│  │  Definition → Koota Entity with all traits        │     │
│  └─────────────────────┬───────────────────────────┘     │
│                        │                                  │
│                        ▼                                  │
├─────────────────────────────────────────────────────────┤
│                    KOOTA ECS WORLD                        │
│                                                          │
│  Traits: Position, Health, Attack, Armor, Faction, ...   │
│  Relations: Targeting, OwnedBy, GatheringFrom, ...       │
│  Queries: playerUnits, enemiesInVision, idleWorkers, ... │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                    GAME SYSTEMS                           │
│                                                          │
│  scenarioSystem → orderSystem → movementSystem →         │
│  combatSystem → aggroSystem → projectileSystem →         │
│  deathSystem → economySystem → productionSystem →        │
│  buildingSystem → stealthSystem → waterSystem →          │
│  weatherSystem → fogSystem → syncSystem                  │
│                                                          │
├──────────────────────┬──────────────────────────────────┤
│   YUKA AI            │   ZUSTAND + SQLITE               │
│   ├ Graph A*         │   ├ campaignStore                │
│   ├ SteeringVehicle  │   ├ settingsStore                │
│   ├ FSM States       │   ├ resourceStore                │
│   └ Skirmish AI      │   ├ territoryStore               │
│                      │   └ SQLite persistence            │
└──────────────────────┴──────────────────────────────────┘
```

## Data Flow: Boot → Play

### 1. Boot
```
BootScene.create()
  → Import ALL entity definitions from registry
  → For each definition with sprite data:
      renderer.registerSpriteTextures(textures, def.id, def.sprite)
      (Creates Canvas at device scale, registers with Phaser)
  → Transition to MenuScene
```

### 2. Menu → Mission Select
```
MenuScene
  → Read campaignStore for available missions
  → Player clicks "New Deployment" or selects mission on CampaignMap
  → Transition to BriefingScene with { missionId, difficulty }
```

### 3. Briefing
```
BriefingScene
  → Load mission.briefing from definition
  → Display portrait sprite + typewriter dialogue
  → Player clicks "Deploy"
  → Transition to GameScene with { missionId, difficulty }
```

### 4. Game Start
```
GameScene.create({ missionId, difficulty })
  → Load MissionDef from registry
  → mapPainter.paintTerrain(mission.terrain) → register as background
  → For each mission.placement:
      spawner.spawn(world, definition, x, y, faction)
  → Set starting resources from mission.startResources
  → Initialize ScenarioEngine with mission.triggers
  → Launch HUDScene in parallel
  → Start game loop: tickAllSystems() each frame
```

### 5. Game Loop (each frame)
```
GameScene.update(time, delta)
  → tickAllSystems({world, scene, delta, fog, weather, scenario})
      1. scenarioSystem — evaluate triggers
      2. orderSystem — translate player commands → ECS state
      3. movementSystem — Yuka steering → Position sync
      4. combatSystem — damage, aggro, projectiles, death
      5. economySystem — gathering, deposits, income
      6. productionSystem — unit training queues
      7. buildingSystem — construction progress
      8. stealthSystem — detection, concealment
      9. waterSystem — raft passengers, underwater
     10. weatherSystem — visibility, accuracy modifiers
     11. fogSystem — vision radius → fog overlay
     12. syncSystem — Koota Position → Phaser sprite positions
```

### 6. Victory/Defeat
```
scenarioSystem detects all primary objectives complete
  → Calculate star rating via scoringSystem
  → Persist to campaignStore + SQLite
  → Transition to VictoryScene
  → VictoryScene shows stars → "Next Mission" or "Return to HQ"
```

## Key Boundaries

| Boundary | Rule |
|----------|------|
| Entity definitions → ECS | Definitions are ARCHETYPES (templates). ECS entities are INSTANCES. The spawner translates. |
| Koota → Phaser | Koota owns all game state. Phaser is a dumb renderer. The syncSystem is the only bridge. |
| Yuka → Koota | Yuka owns pathfinding/steering. Results flow INTO Koota Position/Velocity via movementSystem. |
| Game → UI | HUDScene reads from Zustand stores (resourceStore, rtsGameStore). Never queries ECS directly. |
| Phaser → Audio | Phaser events trigger Tone.js calls. Tone.js has no knowledge of Phaser. |

## File Organization Principle

**Things that change together live together.**

A Mudfoot's sprite, stats, cost, and AI profile change together when balancing. They live in ONE file: `src/entities/units/ura/mudfoot.ts`.

A mission's terrain, placements, triggers, and briefing change together when designing. They live in ONE file: `src/entities/missions/chapter1/mission-01-beachhead.ts`.

Systems (combatSystem, economySystem) are separate because they operate on TRAITS, not entity types. The combatSystem doesn't care if the entity is a Mudfoot or a Gator — it sees Health + Attack + Targeting.
