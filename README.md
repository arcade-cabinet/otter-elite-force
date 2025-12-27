# 🦦 OTTER: ELITE FORCE — The Copper-Silt Reach

[![CI](https://github.com/arcade-cabinet/otter-elite-force/actions/workflows/ci.yml/badge.svg)](https://github.com/arcade-cabinet/otter-elite-force/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19_RC-blue)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r160-black)](https://threejs.org/)

> **"Full Metal Jacket" meets "Wind in the Willows."**

A persistent, procedurally generated 3rd-person tactical shooter built on a foundation of zero external assets. Lead the **United River Alliance (URA)** into the Emerald Meat-Grinder of the Copper-Silt Reach. Liberate villages, dismantle Scale-Guard industrial siphons, and occupy territory in an infinite, deterministic 3D world.

---

## 🎭 The Theater of War

The Reach is a 110-degree mangrove swamp where the air tastes of burnt fuel and decaying silt. 

*   **Tactical Verticality**: Use the environment to your advantage. Climbing, jumping, and positioning are critical for survival.
*   **Squad Intelligence**: You aren't fighting individuals; you're fighting a pack. Scale-Guard predators use coordinate-based logic to flank and ambush.
*   **Persistent Occupation**: Every coordinate you secure is saved. The world remembers your impact.

---

## 🛠️ Technical Bulwark

This project is a technical showcase of high-performance web-based game development.

*   **⚛️ React 19 + R3F**: Leveraging the latest React features and React Three Fiber for a declarative 3D engine.
*   **🧠 Yuka AI**: Advanced steering behaviors, FSM-driven agents, and navigation mesh pathfinding.
*   **📦 Chunk-Based World**: Infinite exploration using deterministic seeding. Only 100x100 unit deltas are persisted.
*   **🎵 Tone.js**: 100% procedural audio. No MP3/WAV files—every splash, gunshot, and atmospheric hum is synthesized in real-time.
*   **💾 Zustand**: Atomic state management with local persistence for Rank, XP, and territory status.

---

## 🚀 Deployment & Operations

### Prerequisites
- **Node.js**: 20.x (LTS)
- **pnpm**: 10.x

### Standard Operating Procedures
```bash
# 1. Arm the environment
pnpm install

# 2. Install Playwright browsers (E2E)
pnpm playwright:install

# 3. Launch the simulation (Dev Mode)
pnpm dev

# 4. Verify logic (Unit Tests)
pnpm test

# 5. Conduct field trials (E2E Tests)
pnpm test:e2e

# 6. Quality Audit (Linting & Formatting)
pnpm lint
```

---

## 🗺️ Field Manuals (Documentation)

*   **[LORE.md](./LORE.md)**: Intelligence briefing on the URA, Villagers, and the Scale-Guard Militia.
*   **[AGENTS.md](./AGENTS.md)**: Technical architecture overview for developers and AI collaborators.
*   **[CLAUDE.md](./CLAUDE.md)**: Mission Control — current operational goals and tactical verticals.
*   **[SETUP_SUMMARY.md](./SETUP_SUMMARY.md)**: Deep dive into the infrastructure and POC roadmap.

---

## ⚠️ Tactical Warning

This project uses **React 19 (RC)**. While it provides cutting-edge performance, expect some volatility until the final stable release. Field repairs (bug fixes) are constant.

---

*Defend the River. Fear the Clam. Restore the Reach.*
