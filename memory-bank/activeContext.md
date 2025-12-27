# Active Context: OTTER: ELITE FORCE

## Current State (December 2024)

The project has successfully completed a **comprehensive multi-agent integration phase**. Six parallel feature branches were developed by specialized AI agents, each addressing a specific domain. These have been consolidated and stabilized through rigorous testing and documentation overhaul efforts.

**Branch Status**: `cursor/testing-and-documentation-overhaul-a16f` → Active development
**Primary PR**: [PR #1](https://github.com/arcade-cabinet/otter-elite-force/pull/1) on `copilot/initialize-pnpm-repo-otter-elite-force`

## Multi-Agent Development Summary

### Completed Feature Branches

| Branch | PR | Focus Area | Key Contributions |
|--------|-----|------------|-------------------|
| `feat/infra-build` | #3 | Infrastructure | CI/CD, Render deploy, CSP headers, documentation |
| `feat/game-store` | #6 | State Management | Zustand modularization, persistence, race condition fixes |
| `feat/env-objs` | #7 | Environment | Procedural entities, oil ignition, InstancedMesh optimization |
| `feat/actors-combat` | #8 | AI & Combat | GatorAI state machine, pack hunting, material memoization |
| `feat/scenes-ui` | #9 | UI/UX | Level.tsx refactor, Cutscene dialogue, HUD safe-area |
| `codex/assess-agent...` | #2 | Optimization | HUD selector consolidation, Gator ambush unification |

### Agent Collaboration Patterns Observed

1. **Cross-Agent Review**: Agents posted `/gemini review`, `@claude review`, `@cursor review` commands to trigger peer AI reviews
2. **GraphQL Thread Resolution**: Agents resolved completed review threads via GitHub GraphQL mutations
3. **Shared Context Files**: `CLAUDE.md`, `AGENTS.md`, and `memory-bank/` provided consistent context across sessions
4. **Iterative Refinement**: Multiple rounds of feedback led to hardened implementations

## Recent Accomplishments

### Engine & Performance
- ✅ **AudioEngine Synth Pooling**: Implemented reusable synth pools (shoot, hit, pickup) to eliminate per-call allocations
- ✅ **Material Memoization**: All Three.js materials in PlayerRig, Gator, Snapper use `useMemo` to prevent recreation
- ✅ **InstancedMesh Optimization**: Environment components (Reeds, Mangroves, Lilypads) use pre-allocated dummy objects
- ✅ **Memory Leak Fixes**: Proper disposal in AudioEngine, InputSystem event listener cleanup

### AI & Gameplay
- ✅ **GatorAI Pack Hunting**: Coordinated circling behavior during STALK state
- ✅ **Ambush Mechanics**: Extracted magic numbers into `AMBUSH_*` constants
- ✅ **State Machine Hardening**: Exit conditions for RETREAT/SUPPRESSED, emergency break-contact from AMBUSH
- ✅ **Entity ID Generation**: Unique chunk-based IDs (`e-${chunkId}-${i}`) prevent React key collisions

### Testing & Quality
- ✅ **Testing Strategy Document**: Comprehensive `memory-bank/testing-strategy.md` with pyramid approach
- ✅ **Vitest Unit Tests**: gameStore, AudioEngine, InputSystem, GatorAI coverage
- ✅ **Playwright E2E**: Smoke, menu, game, visual regression tests
- ✅ **CI/CD Pipeline**: Lint → Type Check → Unit Tests → Build → E2E → Deploy

### Documentation & Automation
- ✅ **Claude Automation Suite**: 6 workflow jobs (interactive, review, triage, maintenance, security, deps)
- ✅ **Custom Claude Commands**: `/fix-issue`, `/commit`, `/create-pr`, `/release`, `/optimize`, `/review-pr`
- ✅ **Specialized Agents**: performance-reviewer, security-reviewer, threejs-reviewer, testing-reviewer, zustand-reviewer
- ✅ **Memory Bank**: Full context preservation system operational

## Current Work Focus

### Testing & Documentation Overhaul (This Session)
1. **Code Quality Fixes**: AudioEngine synth pooling optimization implemented
2. **Memory Bank Alignment**: Synchronizing all documentation with agent planning history
3. **PR #1 Verification**: Ensuring all Claude/Bugbot comments are addressed

### Immediate Priorities
1. **CI Stability**: Visual regression tests conditionally skipped unless `PLAYWRIGHT_VISUAL=true`
2. **E2E Resilience**: Tests use `.stat-val` selectors and graceful character card handling
3. **Weapon.tsx Fix**: Rotation props moved from geometry to parent mesh elements

## Active Technical Decisions

### Architecture
- **Unified Store**: `src/stores/gameStore.ts` is the single source of truth for game state
- **Domain Separation**: Core/, Entities/, Scenes/, UI/, stores/ maintain clear boundaries
- **Singleton Engines**: AudioEngine and InputSystem manage browser resources independently

### Testing Strategy
- **Test Pyramid**: 60-70% unit, 20-30% integration, 5-10% E2E
- **Mock Strategy**: Browser APIs in setup.ts, Three.js/Tone.js/Yuka mocked per-test
- **Coverage Targets**: gameStore 95%, Core 85%, UI 60%, 3D via visual regression

### Automation
- **Claude Interactive**: @claude mentions for on-demand assistance
- **Auto PR Review**: Progress tracking, inline comments, checklist summary
- **CI Auto-Fix**: Automatic analysis and fix of failing CI runs
- **Weekly Maintenance**: Scheduled health checks and issue hygiene

## Pending Items (Non-Blocking)

1. **Advanced AI**: Blackboard system for coordinated pack flanking maneuvers
2. **Narrative Layer**: Procedural dialogue injection with mission context
3. **Weather System**: Rain/fog visibility and sound modifiers
4. **Performance Profiling**: Dense Jungle stress testing on mobile
5. **Accessibility**: ARIA labels, keyboard navigation improvements

## Key Files to Monitor

| File | Purpose | Watch For |
|------|---------|-----------|
| `src/stores/gameStore.ts` | Central state | Race conditions, schema changes |
| `src/Core/AudioEngine.ts` | Audio synthesis | Context lifecycle, synth disposal |
| `src/Entities/Enemies/Gator.tsx` | AI rendering | State sync with Yuka vehicle |
| `.github/workflows/claude_code.yml` | Automation | Trigger conditions, permissions |
| `memory-bank/progress.md` | Milestone tracking | Feature completion status |
