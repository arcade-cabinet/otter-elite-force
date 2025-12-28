# Code Complexity Reduction Plan

## Status: IN PROGRESS

This document tracks the systematic refactoring of overly large files to restore proper code complexity levels.

## ✅ Completed

### E2E Tests (Commit: c893555)
- **`e2e/gameplay.spec.ts`**: 1127 → 150 lines (73% reduction)
  - Split into 7 focused modules:
    - `helpers.ts` (132 lines) - Shared utilities
    - `gameplay.spec.ts` (150 lines) - Core menu-to-game flow
    - `canteen.spec.ts` (110 lines) - Canteen operations
    - `character-selection.spec.ts` (50 lines) - Character UI
    - `save-persistence.spec.ts` (57 lines) - Save management
    - `error-handling.spec.ts` (73 lines) - Edge cases
    - `advanced-mechanics.spec.ts` (294 lines) - Complex gameplay systems

## 🔄 Next Priority Files (Over 500 Lines)

### High Priority (Over 700 Lines)
1. **`src/systems/assembly/componentLibrary.ts`** - 1042 lines
   - Split into:
     - `factionPalettes.ts` (~60 lines) - Material palettes
     - `skeleton.ts` (~350 lines) - Joint definitions
     - `meshLibrary.ts` (~450 lines) - Mesh catalog
     - `meshUtils.ts` (~180 lines) - Creation utilities

2. **`src/systems/assembly/settlementAssembler.ts`** - 724 lines
   - Split into:
     - `villageGenerator.ts` - Village-specific logic
     - `defenseGenerator.ts` - Defense structure logic
     - `settlementUtils.ts` - Shared utilities

3. **`src/systems/assembly/structureAssembler.ts`** - 721 lines
   - Split into:
     - `baseStructures.ts` - Foundation/frame logic
     - `roofingSystem.ts` - Roof generation
     - `structureUtils.ts` - Helper functions

4. **`src/test/setup.ts`** - 710 lines
   - Split into:
     - `mockSetup.ts` - Mock configurations
     - `testUtils.ts` - Test utilities
     - `fixtures.ts` - Test data

5. **`src/stores/gameStore.ts`** - 672 lines
   - Split into:
     - `gameState.ts` - State definition
     - `gameActions.ts` - State mutations
     - `gameSelectors.ts` - Derived state
     - `gameMiddleware.ts` - Side effects

### Medium Priority (500-700 Lines)
6. **`src/stores/worldLayout.ts`** - 633 lines
7. **`src/stores/worldGenerator.ts`** - 616 lines
8. **`src/ecs/systems/__tests__/AISystem.test.ts`** - 596 lines
9. **`src/__tests__/integration/game-flow.test.ts`** - 569 lines
10. **`src/ecs/renderers/index.tsx`** - 536 lines
11. **`src/stores/gameStore.test.ts`** - 515 lines
12. **`src/__tests__/unit/gameStore.test.ts`** - 514 lines
13. **`src/ecs/data/weaponTemplates.ts`** - 506 lines

## Principles

### File Size Guidelines
- **Maximum**: 300 lines per file
- **Target**: 150-250 lines per file
- **Minimum**: No artificial splitting below 100 lines

### Refactoring Approach
1. **Identify Natural Boundaries**: Look for section comments, export blocks
2. **Single Responsibility**: Each file should have one clear purpose
3. **Shared Utilities**: Extract common helpers into separate files
4. **Maintain Tests**: Ensure all tests pass after refactoring
5. **Update Imports**: Use find/replace to update import paths

### Module Naming Conventions
- **Core logic**: `entityName.ts` (e.g., `skeleton.ts`)
- **Utilities**: `entityUtils.ts` (e.g., `meshUtils.ts`)
- **Types**: `entityTypes.ts` (e.g., `skeletonTypes.ts`)
- **Constants**: `entityConstants.ts` (e.g., `factionPalettes.ts`)
- **Tests**: Keep test files co-located with source

## Benefits Already Achieved

### E2E Tests
- ✅ Easier navigation (find tests by feature name)
- ✅ Faster test execution (better parallelization)
- ✅ Clearer intent (file names document purpose)
- ✅ Better maintainability (isolated changes)
- ✅ Parallel development (multiple devs, no conflicts)

## Success Metrics

- [ ] No files over 500 lines
- [ ] Average file size under 250 lines
- [ ] All tests passing
- [ ] No linting errors
- [ ] Build time unchanged or improved
- [ ] Code coverage maintained

## Timeline

- **Phase 1** (Completed): E2E tests refactored
- **Phase 2** (In Progress): Assembly system refactoring
- **Phase 3** (Next): Store refactoring
- **Phase 4** (After): Remaining large files

## Notes

- Keep `gameplay.spec.ts.old` as reference during this phase
- Delete backup files after refactoring is complete and tested
- Update documentation to reflect new file structure
- Consider adding a pre-commit hook to prevent files exceeding 500 lines
