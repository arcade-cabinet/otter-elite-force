# Memory Bank

This directory contains project documentation and context files to ensure continuity across AI coding sessions.

## Purpose

After each AI session reset, the agent relies **entirely** on the Memory Bank to understand the project and continue work effectively. These files must be maintained with precision and clarity.

## Structure

```
memory-bank/
├── README.md           # This file
├── projectbrief.md     # Core requirements, open world design, difficulty modes
├── productContext.md   # UX goals, game loader interface, victory verticals
├── systemPatterns.md   # Architecture, chunk persistence, three-faction conflict
├── techContext.md      # Technology stack, constraints, dependencies
├── activeContext.md    # Current work focus, recent changes, next steps
├── progress.md         # Feature checklist, known issues, roadmap
├── testing-strategy.md # Testing philosophy and patterns
├── claude-automation.md# Claude Code integration docs
└── dev-logs/           # Historical session transcripts
    └── *.md           # Individual agent session logs
```

## Related Documentation

**Technical Docs** (in `docs/` directory):
- `docs/architecture/` - System design documentation
- `docs/development/` - Development guides and analysis
- `docs/guides/` - User and contributor guides

**Work Log**: See `WORKLOG.md` in repository root for formal development activity log.

## Core Files (Always Read)

### 1. projectbrief.md
Foundation document defining:
- Open world design (NOT levels)
- Capture the flag mechanics
- Territory control
- Base building at LZ
- Three difficulty modes (escalation only)
- Three victory verticals

### 2. productContext.md
User experience goals:
- Main Menu = Game Loader (New/Continue/Canteen)
- "Vietnam but with Otters" aesthetic
- Three-faction conflict
- Persistent progression

### 3. systemPatterns.md
Architecture and patterns:
- Chunk-based world generation
- Fixed-on-discovery persistence
- Zustand state management
- YUKA AI framework
- Modular entity system

### 4. techContext.md
Technology details:
- React 19 + TypeScript
- Three.js via R3F
- Tone.js audio synthesis
- Save schema v8
- Build/test commands

### 5. activeContext.md
Current work focus:
- Main menu redesign
- Chunk persistence implementation
- Base building foundation
- Active decisions and pending items

### 6. progress.md
Status tracking:
- Completed features
- In-progress work
- Known issues
- Roadmap to 1.0

## Key Design Principles

### Open World, NOT Levels
```
❌ NO level select screens
❌ NO "Mission 1, 2, 3" structure
❌ NO terrain regeneration on revisit

✅ One continuous world
✅ Chunks fixed once discovered
✅ Changes persist forever
```

### Main Menu = Game Loader
```
[ NEW GAME ]  - Fresh campaign with difficulty selection
[ CONTINUE ]  - Resume persistent world
[ CANTEEN ]   - Meta-progression shop
```

### Three Difficulty Modes
| Mode | Mechanic |
|------|----------|
| SUPPORT | Supply drops anywhere |
| TACTICAL | "The Fall" at 30% HP |
| ELITE | Permadeath |

*Difficulty can go UP but never DOWN.*

### Victory Verticals
1. **Platoon Rescues**: Find characters at specific coordinates
2. **Arsenal Upgrades**: Permanent gear at Canteen
3. **Intel Rewards**: Peacekeeping reveals POIs

## Development Logs

The `dev-logs/` directory contains markdown exports of AI coding agent sessions, providing a historical record of development decisions and implementations.

### Available Logs

| Date | Agent | Branch | Description |
|------|-------|--------|-------------|
| 2025-12-26 | `bc-428303a1` | `copilot/initialize-pnpm-repo` | Initial refactor + memory bank init |
| 2025-12-27 | `bc-59938bf2` | `feat/infra-build` | Infrastructure & build system |
| 2025-12-27 | `bc-a8cfd265` | `feat/game-store` | Zustand state management |
| 2025-12-27 | `bc-21183315` | `feat/env-objs` | Environment objects |
| 2025-12-27 | `bc-c4b3c036` | `feat/actors-combat` | Actors & combat system |
| 2025-12-27 | `bc-674adc06` | `feat/scenes-ui` | Scenes & UI components |
| 2025-12-27 | `bc-875eaad3` | `codex/assess-agent-collaboration` | Agent collaboration assessment |

**Note**: All sensitive tokens have been automatically redacted from logs.

## Agent Instructions

When starting a new session:

1. **Read ALL memory bank files** — this is not optional
2. **Check activeContext.md** for current work focus
3. **Review progress.md** for known issues
4. **Consult dev-logs/** for historical context if needed

When making changes:

1. **Update activeContext.md** with your work
2. **Update progress.md** with completed items
3. **Add dev-log entry** for significant sessions
4. **Respect open world design** — no level select screens

## References

- `/CLAUDE.md` - Claude-specific mission control
- `/AGENTS.md` - General agent technical briefing
- `/.github/copilot-instructions.md` - GitHub Copilot guidelines
- `/.clinerules` - Memory bank workflow specification
