# 🤖 CLAUDE MISSION CONTROL: OTTER ELITE FORCE

## 🎯 Current Operational Goal
Transition from **Technical Demo** to **Tactical Simulation**. The foundation is built (Chunking, OTS Camera, MOS), now we must breathe life into the "Internal Organs" of the Copper-Silt Reach.

## 📊 Project Status (December 2024)

**Multi-Agent Integration**: ✅ Complete  
**Testing Framework**: ✅ Operational  
**CI/CD Pipeline**: ✅ Deployed  
**Documentation**: ✅ Synchronized  

See `memory-bank/activeContext.md` for detailed current state.

## 🪖 Tactical Verticals

### 1. Squad Intelligence (Priority: HIGH) 🔄
- **Problem**: Predators are individually smart but collectively dumb.
- **Solution**: Implement "Pack Logic" where Scale-Guard scouts signal heavy gators. Use Yuka's `EntityManager` to coordinate pincer maneuvers.
- **Progress**: GatorAI has circling behavior in STALK state. Blackboard system pending.

### 2. Environmental Hazards (Priority: MEDIUM) ✅
- **Objective**: The Reach should feel like an enemy.
- **Hazards**: 
  - **Oil Slicks**: ✅ Implemented with ignition VFX
  - **Mud Pits**: ✅ Slow movement effect
  - **Toxic Sludge**: 🔄 Health drain pending
  - **Monsoon Rain**: 🔄 Visual haze pending

### 3. Destruction & Explosives (Priority: MEDIUM)
- **Mechanics**: Implement **Claymore Clams** and **Grenade Launchers**. 
- **Destructibility**: Allow modular hut components and wooden platforms to be splintered by high-damage impacts.

### 4. Rescue & Extraction (Priority: HIGH) ✅
- **Loop**: Rescue Ally -> Escort to LZ -> New Specialist Unlocked.
- **Vertical**: Map characters like `GEN. WHISKERS` to specific high-threat chunks (5, 5).
- **Progress**: Prison cage system implemented, character unlock flow working.

### 5. Base Building at LZ (Priority: MEDIUM) ✅
- **Components**: Floor, Wall, Roof, Stilt (procedural wooden structures)
- **Placement**: Build Mode toggle in HUD, components placed at player position
- **Persistence**: `baseComponents[]` saved to localStorage, survives sessions
- **Location**: Only at secured LZ (0, 0) - the Forward Operating Base

### 6. Difficulty Modes (Priority: HIGH) ✅
Three escalating difficulty tiers with permanent consequences:

| Mode | Description | Mechanics |
|------|-------------|-----------|
| **SUPPORT** | Rookie training | DROP button available, respawn on death |
| **TACTICAL** | Standard ops | Fall trigger at <30 HP (one-time penalty), no DROP |
| **ELITE** | Permadeath | Full save wipe on death, ultimate challenge |

- **Ratchet System**: Can only increase difficulty, never decrease
- **UI**: Difficulty selector in Main Menu with visual feedback

## 🛠️ Tech Stack & Bulwarks
- **Frontend**: React 19 + R3F + Drei
- **AI**: Yuka (FSM, Steering)
- **Audio**: Tone.js (Procedural Synth with Pooling)
- **State**: Zustand (Persistent Save Data v8)
- **Quality**: Biome (Lint/Format), Vitest (Logic), Playwright (E2E)
- **Automation**: Claude Code Action (Interactive, Review, Triage, Fix)

## 🕵️ AI Self-Improvement Loops
When performing a loop, Claude must:
1. **Analyze Store Impact**: Does this mechanic need to save state?
2. **Verify Performance**: Test with high-density `InstancedMesh`.
3. **Audit Grit**: Does it look like *Full Metal Jacket* or *Tron*? Reject any sci-fi drift.
4. **Haptic Sync**: Ensure impacts trigger the vibration API where supported.
5. **Memory Check**: Verify Three.js resources are disposed on unmount.
6. **Test Coverage**: Add unit tests for new logic paths.

## 🗺️ Persistent Coordinates of Interest
- **(0, 0)**: Initial LZ / Base Site.
- **(5, 5)**: Scale-Guard Prison Camp (Prisoner Rescue - Gen. Whiskers).
- **(10, -10)**: The Great Siphon (Boss Encounter).
- **(-15, 20)**: Healer's Grove (Peacekeeping Hub).

## 📚 Multi-Agent Collaboration Patterns

### Learned from Agent Sessions

1. **Cross-Agent Review Protocol**
   - Post `/gemini review`, `@claude review`, `@cursor review` for peer AI feedback
   - Address ALL feedback before marking threads resolved
   - Use GraphQL mutations to hide resolved comments

2. **Context Preservation**
   - Always read `memory-bank/activeContext.md` first
   - Update `memory-bank/progress.md` after completing milestones
   - Create dev-logs in `memory-bank/dev-logs/` for session continuity

3. **Code Quality Gates**
   - Run `pnpm lint && pnpm typecheck` before committing
   - Ensure `pnpm test:unit` passes
   - Check `pnpm build` succeeds

4. **Common Pitfalls to Avoid**
   - Don't create synths per-call (use pooling)
   - Don't apply rotation to geometry (apply to mesh)
   - Don't mutate React props directly (clone first)
   - Don't forget to cleanup event listeners
   - Don't use `any` types in critical paths

### Agent Communication Templates

**Requesting Review:**
```
@claude Please review the changes in this PR, focusing on:
1. Memory management in Three.js components
2. Zustand selector optimization
3. Test coverage for new logic
```

**Reporting Status:**
```
## Session Summary
- Fixed: [list of fixes]
- Added: [new features]
- Tests: [test status]
- Pending: [remaining items]
```

## 🔧 Quick Reference Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm preview          # Preview build

# Quality
pnpm lint             # Biome lint & format
pnpm typecheck        # TypeScript check
pnpm test:unit        # Vitest unit tests
pnpm test:coverage    # With coverage report
pnpm test:e2e         # Playwright E2E

# Full Validation
pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build && pnpm test:e2e
```

## 📂 Critical Files

| File | Purpose |
|------|---------|
| `src/stores/gameStore.ts` | Central game state |
| `src/Core/AudioEngine.ts` | Synth pooling audio |
| `src/Core/InputSystem.ts` | Touch/keyboard input |
| `src/Entities/Enemies/Gator.tsx` | AI predator with Yuka |
| `src/Scenes/Level.tsx` | Main gameplay scene |
| `memory-bank/activeContext.md` | Current development focus |
| `memory-bank/progress.md` | Milestone tracking |
