# OTTER: ELITE FORCE (The Copper-Silt Reach)

A persistent, procedurally generated 3rd-person tactical shooter with open-world exploration, territory occupation, and base building.

## 🚀 Quick Start

### Prerequisites
- Node.js 20
- pnpm 10

> [!IMPORTANT]
> This project uses **React 19 (RC)**. While considered stable enough for development, be aware of its release candidate status and monitor for breaking changes until the final stable release.

### Installation
```bash
pnpm install
pnpm playwright:install
```

### Development
```bash
pnpm dev
```

### Testing
```bash
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests
```

### Linting & Formatting
```bash
pnpm lint
```

## 🎮 Game Architecture
- **World**: Chunk-based deterministic generation.
- **State**: Zustand with persistence.
- **AI**: Yuka FSM for squad intelligence.
- **Audio**: Procedural synthesis via Tone.js.

## 🦦 Mission
Transition from Technical Demo to Tactical Simulation. The foundation is built, now we must breathe life into the "Internal Organs" of the Copper-Silt Reach.
