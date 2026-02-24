# Testing Strategy for OTTER: ELITE FORCE

This document outlines the comprehensive testing strategy for the game, including unit tests, integration tests, and end-to-end tests.

## Test Coverage Summary

### Unit Tests
Located in `src/__tests__/unit/` and `src/**/*.test.{ts,tsx}`

- **Game Store Tests** (`src/__tests__/unit/gameStore.test.ts`): 45+ tests
  - Player state management (health, damage, healing)
  - Mode transitions
  - World generation and discovery
  - Character management and unlocks
  - Economy and upgrades
  - XP and ranking system
  - Base building

- **Persistence Tests** (`src/stores/persistence.ts`): Schema validation and migration
  - Save/Load functionality
  - Data migration between versions
  - Validation of save data structure

- **Core Systems Tests**:
  - `src/Core/AudioEngine.test.ts` - Audio synthesis and playback
  - `src/Core/InputSystem.test.ts` - Touch and keyboard input
  - `src/utils/math.test.ts` - Math utilities

- **Entity Tests**:
  - `src/Entities/Enemies/__tests__/GatorAI.test.ts` - Enemy AI behaviors

### Integration Tests
Located in `src/__tests__/integration/`

- **Game Flow Tests** (`game-flow.test.ts`): 15+ tests
  - Complete game loops (menu → cutscene → game → victory)
  - Combat scenarios
  - Character progression
  - World exploration
  - Economy loops
  - Base building
  - Difficulty modes
  - State persistence

### End-to-End Tests
Located in `e2e/`

- **Smoke Tests** (`smoke.spec.ts`): 6 tests
  - App loading and title display
  - Console error monitoring
  - Navigation basics
  - localStorage availability

- **Menu Tests** (`menu.spec.ts`): 20+ tests
  - Main menu rendering
  - Character selection
  - Navigation to canteen
  - Campaign start
  - Cutscene display
  - Accessibility checks

- **Game Tests** (`game.spec.ts`): 15+ tests
  - WebGL capability detection
  - Canvas rendering
  - Game flow progression
  - State persistence

- **Visual Regression Tests** (`visual-regression.spec.ts`): 12+ tests
  - Main menu snapshots
  - Character cards
  - Canteen screen
  - Cutscene rendering
  - Responsive design (mobile/tablet)

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests once
pnpm test:unit

# Watch mode for development
pnpm test:unit:watch

# With UI (Vitest UI)
pnpm test:unit:ui

# With coverage report
pnpm test:coverage
```

### End-to-End Tests

#### Headless Mode (CI)

```bash
# Basic E2E tests (works in headless/CI environments)
pnpm test:e2e
```

Note: WebGL-dependent tests are automatically skipped in headless mode to prevent false failures.

#### Full WebGL Testing (MCP Mode)

```bash
# Full tests with WebGL/GPU support (requires display)
pnpm test:e2e:mcp

# Or with UI
pnpm test:e2e:ui

# Headed mode (see browser)
pnpm test:e2e:headed
```

This mode requires:
- Display server (X11 or Wayland)
- GPU acceleration
- Full browser environment

#### Visual Regression Testing

```bash
# Run visual regression tests
pnpm test:e2e:visual

# Update baseline snapshots (when intentional visual changes are made)
pnpm test:e2e:update-snapshots
```

Visual regression tests use Playwright's screenshot comparison to validate:
- 3D rendering accuracy
- Character model appearances
- UI component rendering
- Responsive design across viewports

**First Run:** Generates baseline snapshots in `e2e/*.spec.ts-snapshots/`
**Subsequent Runs:** Compares against baselines, highlights pixel differences
**On Failure:** Creates `-actual.png` and `-diff.png` files for review

#### All Tests

```bash
# Run both unit and E2E tests
pnpm test:all
```

## Test Structure

### Unit Tests

Unit tests focus on isolated components and pure logic:
- ✅ Zustand store mutations
- ✅ Game constants and configuration
- ✅ Character and weapon balance
- ✅ Scoring and progression logic
- ✅ Save data persistence
- ✅ World generation determinism
- ✅ AI behavior logic

### Integration Tests

Integration tests verify systems working together:
- ✅ Complete game flow (menu → cutscene → game → victory)
- ✅ Combat mechanics (damage, healing, kills)
- ✅ Character-specific gameplay
- ✅ World exploration and territory control
- ✅ Economy loops (earn/spend/upgrade)
- ✅ Base building system
- ✅ Difficulty modes and their effects
- ✅ State transitions

### E2E Tests

E2E tests verify the complete user experience:
- ✅ Page loading and initialization
- ✅ Character selection UI
- ⚠️ Movement (WASD keys) - requires WebGL
- ⚠️ Shooting mechanics - requires WebGL
- ⚠️ Enemy spawning and AI - requires WebGL
- ✅ Touch controls (UI buttons)
- ✅ Score tracking
- ✅ Game state persistence

⚠️ = Tests that require full GPU/WebGL support

## Test Environment

### Vitest Configuration (`vitest.config.ts`)

- Environment: `happy-dom` (lightweight DOM implementation)
- Setup file: `src/test/setup.ts`
- Coverage provider: V8
- Mocked APIs:
  - localStorage
  - matchMedia
  - ResizeObserver
  - WebGL context
  - Tone.js (audio synthesis)
  - Yuka (AI library)
  - Three.js WebGLRenderer

### Playwright Configuration (`playwright.config.ts`)

- Browser: Chromium (optimized for WebGL)
- Two modes:
  1. **Headless** (default): Software WebGL via SwiftShader
  2. **MCP** (`PLAYWRIGHT_MCP=true`): Full GPU, headed mode
- Timeout: 60s (MCP) / 30s (headless)
- Screenshots on failure
- Video recording (MCP mode only)
- Visual regression: 20% diff tolerance

## Coverage Reporting

### Local Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### CI Coverage

Coverage is automatically:
- Generated during CI test runs
- Uploaded to Coveralls (if configured)
- Tracked over time
- Reported on pull requests

### Coverage Goals

- **Lines**: 25% minimum → **Target: 50%+**
- **Functions**: 25% minimum
- **Branches**: 25% minimum
- **Statements**: 25% minimum

Current coverage focus areas:
- Game Store: ~90%
- Core Systems: ~70%
- UI Components: 30-50%
- **3D Components**: 0% (traditional) → **Functional via visual testing**

## Known Limitations

### WebGL in CI/Headless

WebGL and Three.js require GPU acceleration to fully function. In headless/CI environments:
- Software rendering (SwiftShader) provides basic WebGL
- Complex 3D scenes may perform poorly
- Some rendering tests must be skipped

**Solutions:**
1. Mock Three.js for unit tests ✅
2. Skip GPU-dependent E2E tests in headless mode ✅
3. Run full E2E tests with MCP/GPU in dev environment ✅
4. Use visual regression testing for critical rendering

### Test Performance

- Unit tests: ~1-2s (fast, run often)
- Integration tests: ~2-3s (medium, run per commit)
- E2E tests: ~30-60s (slow, run before PR)

## Best Practices

1. **Test Pyramid**: More unit tests, fewer E2E tests
2. **Isolation**: Each test should be independent
3. **Cleanup**: Always reset state between tests
4. **Descriptive Names**: Tests should document behavior
5. **Fast Feedback**: Keep unit tests under 100ms each
6. **Realistic Data**: Use production-like test data
7. **Error Messages**: Clear assertions with context

## Debugging Tests

### Vitest

```bash
# Run specific test file
pnpm vitest src/__tests__/unit/gameStore.test.ts

# Run tests matching pattern
pnpm vitest -t "should take damage"

# Run with debugger
pnpm vitest --inspect-brk

# Update snapshots
pnpm vitest -u
```

### Playwright

```bash
# Run specific test
pnpm playwright test -g "should display main menu"

# Debug mode (opens browser)
pnpm playwright test --debug

# Generate test code
pnpm playwright codegen http://localhost:4173

# Show trace viewer
pnpm playwright show-trace test-results/trace.zip
```

## Contributing

When adding new features:
1. Write unit tests first (TDD)
2. Add integration tests for feature interactions
3. Update E2E tests if UI changes
4. Ensure coverage doesn't decrease
5. Update this README if test strategy changes

## Test File Naming Conventions

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.test.ts` in `__tests__/integration/`
- E2E tests: `*.spec.ts` in `e2e/`
- Test fixtures: `__fixtures__/` directory

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [React Three Fiber Testing](https://docs.pmnd.rs/react-three-fiber/advanced/testing)
- [Zustand Testing Patterns](https://docs.pmnd.rs/zustand/guides/testing)
