# Memory Bank

This directory contains project documentation and context files to ensure continuity across AI coding sessions.

## Structure

```
memory-bank/
├── README.md           # This file
├── dev-logs/           # Development session logs
│   └── *.md           # Individual session transcripts
├── activeContext.md    # Current work focus (TODO)
├── progress.md         # Project progress tracking (TODO)
├── projectbrief.md     # Foundation document (TODO)
├── productContext.md   # Product vision and goals (TODO)
├── systemPatterns.md   # Architecture and patterns (TODO)
└── techContext.md      # Technical setup and constraints (TODO)
```

## Development Logs

The `dev-logs/` directory contains markdown exports of AI coding agent sessions, providing a historical record of development decisions and implementations.

### Available Logs

#### Main Integration Sessions
| Date | Agent ID | Branch | Messages | Description |
|------|----------|--------|----------|-------------|
| 2025-12-26 | `bc-428303a1` | `copilot/initialize-pnpm-repo` | 133+83 | Initial modular refactor + rebase integration |

#### Feature Branch Sessions
| Date | Agent ID | Branch | Messages | Description |
|------|----------|--------|----------|-------------|
| 2025-12-27 | `bc-59938bf2` | `feat/infra-build` | 16 | Infrastructure & build system |
| 2025-12-27 | `bc-a8cfd265` | `feat/game-store` | 6 | Zustand state management |
| 2025-12-27 | `bc-21183315` | `feat/env-objs` | 4 | Environment objects |
| 2025-12-27 | `bc-c4b3c036` | `feat/actors-combat` | 7 | Actors & combat system |
| 2025-12-27 | `bc-674adc06` | `feat/scenes-ui` | 2 | Scenes & UI components |
| 2025-12-27 | `bc-875eaad3` | `codex/assess-agent-collaboration` | 2 | Agent collaboration assessment |

**Note**: All sensitive tokens (GitHub PATs, API keys, etc.) have been automatically redacted from logs.

## Purpose

After each AI session reset, the agent relies **entirely** on the Memory Bank to understand the project and continue work effectively. These files must be maintained with precision and clarity.

## Key Principles

1. **Procedural Supremacy**: All assets are generated via code, no external files
2. **Mobile-First**: Touch input and mobile performance are priorities
3. **Full Metal Jacket meets Wind in the Willows**: Tactical realism with whimsical charm
4. **React 19 Baseline**: Modern stack with Zustand, R3F, and Yuka AI
