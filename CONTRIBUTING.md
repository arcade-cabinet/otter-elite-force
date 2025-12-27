# Contributing to OTTER: ELITE FORCE

First off, thanks for taking the time to contribute!

## 🦦 Code of Conduct

As a contributor, you are an elite member of the United River Alliance. Maintain the grit, respect the persistence, and never introduce sci-fi drift.

## 🛠️ Development Workflow

1.  **Clone the Repository**
2.  **Install Dependencies**: `pnpm install`
3.  **Field Testing**: Ensure all tests pass before submitting.
    - `pnpm lint`: Keep the code clean (Biome).
    - `pnpm test`: Verify the logic (Vitest).
    - `pnpm test:e2e`: Field trials (Playwright).
4.  **Conventional Commits**: Use clear, descriptive commit messages.

## 📜 Architectural Rules

- **Zero External Assets**: Models must be procedural (primitives), and audio must be synthesized (Tone.js).
- **Modular Everything**: Follow the directory structure:
  - `src/core/`: Engine logic and systems.
  - `src/entities/`: Game objects (Otters, Gators, Siphons).
  - `src/scenes/`: 3D environments and levels.
  - `src/ui/`: HUD and menus.
  - `src/stores/`: Persistent game state (Zustand).
- **Performance First**: Use `InstancedMesh` for dense vegetation and debris.

## 🧠 AI Collaboration

If you are an AI agent:
- Read `AGENTS.md` and `CLAUDE.md` before starting.
- Respect the "Down and In" OTS camera perspective in all UI and environment design.
- Suppression is a core mechanic—reward fire discipline.

## 🚀 Submission Process

1.  Create a branch for your feature.
2.  Open a Pull Request.
3.  Address all automated review feedback from @gemini, @cursor, and @claude.

*Defend the River. Restore the Reach.*
