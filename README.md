# OTTER: ELITE FORCE

> "Defend the River. Fear the Clam."

OTTER: ELITE FORCE is a mobile-first, procedurally generated 3rd-person tactical shooter set in a **persistent open world**. You play as Sgt. Bubbles, a battle-hardened otter deployed to the Copper-Silt Reach to liberate territory from the Scale-Guard Militia.

## 🎮 Game Concept

### Open World, Not Levels

This is a **single persistent world** — not a collection of discrete levels:

- 🌍 **Infinite Exploration**: The world generates chunk-by-chunk as you explore
- 📌 **Fixed on Discovery**: Once visited, terrain is permanent and never regenerates
- 🏴 **Territory Control**: Destroy enemy siphons to capture and secure territory
- 🏗️ **Base Building**: Build and expand your Forward Operating Base at the LZ

### Three Victory Verticals

1. **Platoon Rescues**: Find and rescue specialists at specific world coordinates
2. **Arsenal Upgrades**: Spend credits at the Canteen for permanent gear improvements  
3. **Intel Rewards**: High peacekeeping scores reveal map Points of Interest

### Three Difficulty Modes

| Mode | Description |
|------|-------------|
| **SUPPORT** | Supply drops anywhere, extract from any coordinate |
| **TACTICAL** | "The Fall" at 30% HP — must return to LZ for extraction |
| **ELITE** | Permadeath — one death ends your campaign |

*Difficulty can go UP but never DOWN.*

## 🎮 How to Play

### Mobile Controls (Touch)

- **Left Stick**: Move & Strafe
- **Right Stick**: Aim & Auto-Fire
- **GRIP Button**: Hold to climb surfaces
- **JUMP Button**: Vertical movement
- **SCOPE Button**: Toggle zoom for long-range

### Desktop Controls

- Mouse/Keyboard fallback for testing
- WASD movement, Mouse aim

## 🌟 Features

### Procedural Everything

- **Zero External Assets**: All geometry is code-generated primitives
- **Synthesized Audio**: Music and SFX via Tone.js (Web Audio API)
- **Infinite World**: Deterministic seed-based chunk generation

### Tactical Depth

- **Three-Faction Conflict**: URA Peacekeepers vs Scale-Guard Militia vs Native Inhabitants
- **Environmental Hazards**: Oil slicks (flammable), mud pits (slowing), toxic sludge
- **Pack Hunting AI**: Predators coordinate with YUKA steering behaviors

### Persistent Progression

- **Open World Persistence**: Discovered territory stays fixed forever
- **Base Building**: Modular construction at your Landing Zone
- **Meta-Progression**: Permanent upgrades at the Canteen between sessions

## 🛠️ Technical Stack

- **Framework**: React 19 + TypeScript
- **3D Engine**: Three.js r160 via @react-three/fiber
- **Audio**: Tone.js (procedural synthesis)
- **AI**: YUKA (steering behaviors, FSM)
- **State**: Zustand (with localStorage persistence)
- **Build**: Vite + pnpm
- **Quality**: Biome (lint/format), Vitest (unit), Playwright (E2E)

## 📜 Lore

The year is unimportant. The location is **The Copper-Silt Reach**, a bleached, humid hellscape known to the grunts as the **"Emerald Meat-Grinder."**

The **Scale-Guard Militia**—a brutal cult of biological river predators—has seized the ancestral clam beds, clear-cutting the mangroves and siphoning the river's lifeblood into their industrial sludge-pits.

**Sgt. Bubbles**, a battle-hardened veteran of the early campaigns, has been recalled to lead a ragtag platoon of specialists into the soup. Navigate through burnt mangroves and murky silt to dismantle Scale-Guard siphons, rescue trapped allies, and liberate the native villages.

Lock and load. We're going in hot.

## 🚀 Installation & Development

### Prerequisites

- Node.js 20+
- pnpm 10+

### Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test        # Unit tests
pnpm test:e2e    # End-to-end tests

# Lint & format
pnpm lint
```

## 📁 Project Structure

```
src/
├── Core/           # Engine systems (Audio, Input, GameLoop)
├── Entities/       # Game objects
│   ├── Enemies/    # Gator, Snake, Snapper AI
│   ├── Environment/# Hazards, Decorations, Objectives
│   └── ...
├── Scenes/         # Application states (Menu, Level, Canteen, Victory)
├── stores/         # Zustand state management
│   ├── gameStore.ts      # Main FSM and game state
│   ├── worldGenerator.ts # Chunk generation
│   └── persistence.ts    # Save/Load logic
└── UI/             # HUD components

memory-bank/        # Agent documentation
├── projectbrief.md # Core requirements and open world design
├── productContext.md # UX goals and game loader interface
├── systemPatterns.md # Architecture and chunk persistence
├── activeContext.md  # Current work focus
├── progress.md       # Feature checklist
└── techContext.md    # Technology details
```

## 🎯 Roadmap

### Completed ✅
- [x] Modular TypeScript architecture
- [x] Procedural otter rig and enemies
- [x] Combat system with projectiles
- [x] Environmental hazards (oil ignition, mud)
- [x] Basic Canteen meta-progression
- [x] Victory extraction sequence

### In Progress 🔄
- [ ] Main Menu → Game Loader redesign (New Game / Continue / Canteen)
- [ ] Chunk persistence (fixed-on-discovery)
- [ ] Territory control tracking
- [ ] Difficulty mode implementation

### Planned ⏳
- [ ] Base building at LZ
- [ ] Character rescue system
- [ ] Pack hunting AI coordination
- [ ] Weather effects
- [ ] Boss encounters

## 🚢 Deployment

This project includes deployment configurations for:
- **Render**: `render.yaml` blueprint for static site
- **GitHub Pages**: CI/CD workflow in `.github/workflows/`

## 📚 Documentation

For AI agents and developers:
- `CLAUDE.md` - Mission control and tactical priorities
- `AGENTS.md` - Technical briefing and guidelines
- `docs/BUNDLE_SIZE.md` - Bundle size monitoring guide
- `memory-bank/` - Comprehensive project context

## 📊 Performance Monitoring

The project includes comprehensive bundle size monitoring:
- Automatic bundle analysis on every build
- PR comments with size comparisons
- Visual bundle analyzer (`pnpm build:analyze`)
- Historical tracking in CI artifacts

See `docs/BUNDLE_SIZE.md` for details.

---

*Built with procedural love by the River-Rats of the Copper-Silt Reach.*
