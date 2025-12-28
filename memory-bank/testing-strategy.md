# Testing Strategy & Plan: OTTER: ELITE FORCE

## Executive Summary

This document provides a comprehensive testing plan for OTTER: ELITE FORCE, covering unit testing, integration testing, end-to-end testing, and continuous integration practices. The strategy is designed for AI agents and human developers to ensure consistent quality across all development efforts.

## Testing Philosophy

### Core Principles

1. **Test Pyramid**: Favor many fast unit tests, fewer integration tests, and minimal E2E tests
2. **Deterministic Tests**: Every test should produce the same result on every run
3. **Independent Tests**: Tests should not depend on each other's state
4. **Fast Feedback**: Developers should get test results quickly
5. **Meaningful Coverage**: Focus on critical paths over percentage metrics

### Testing Layers

```
                    ▲
                   /│\
                  / │ \      E2E Tests (5-10%)
                 /  │  \     - User journeys
                /───┼───\    - Visual regression
               /    │    \
              /     │     \  Integration Tests (20-30%)
             /      │      \ - System interactions
            /───────┼───────\ - Game flow
           /        │        \
          /         │         \ Unit Tests (60-70%)
         /          │          \ - Pure logic
        /───────────┴───────────\ - State management
```

## Test Infrastructure

### Configuration Files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Unit/Integration test config |
| `playwright.config.ts` | E2E test config |
| `src/test/setup.ts` | Global test mocks and setup |

### Required Dependencies

```json
{
  "devDependencies": {
    "@playwright/test": "^1.57.0",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.1",
    "@testing-library/user-event": "^14.5.3",
    "@vitest/coverage-v8": "^4.0.16",
    "@vitest/ui": "^4.0.16",
    "happy-dom": "^20.0.11",
    "vitest": "^4.0.16"
  }
}
```

### NPM Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --config vitest.config.ts --reporter=verbose",
    "test:unit:watch": "vitest --config vitest.config.ts",
    "test:unit:ui": "vitest --config vitest.config.ts --ui",
    "test:coverage": "vitest run --config vitest.config.ts --coverage",
    "test:e2e": "playwright test",
    "test:e2e:mcp": "PLAYWRIGHT_MCP=true playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:visual": "PLAYWRIGHT_MCP=true playwright test e2e/visual-regression.spec.ts",
    "test:e2e:update-snapshots": "PLAYWRIGHT_MCP=true playwright test --update-snapshots",
    "test:all": "pnpm test:unit && pnpm test:e2e"
  }
}
```

## Unit Testing

### Directory Structure

```
src/
├── __tests__/
│   ├── unit/           # Pure unit tests
│   │   ├── gameStore.test.ts
│   │   └── ...
│   └── integration/    # Integration tests
│       ├── game-flow.test.ts
│       └── ...
├── Core/
│   ├── AudioEngine.test.ts
│   └── InputSystem.test.ts
├── Entities/
│   └── Enemies/
│       └── __tests__/
│           └── GatorAI.test.ts
└── stores/
    └── gameStore.test.ts
```

### What to Test

#### Game Store (Priority: CRITICAL)

```typescript
// Test all state mutations
describe("gameStore - Player Stats", () => {
  it("should take damage correctly");
  it("should not go below zero health");
  it("should heal correctly");
  it("should not exceed max health");
  it("should increment kills");
  it("should reset stats");
});

// Test mode transitions
describe("gameStore - Mode Management", () => {
  it("should change mode correctly");
  it("should support all game modes");
});

// Test economy
describe("gameStore - Economy", () => {
  it("should add coins correctly");
  it("should spend coins when sufficient balance");
  it("should not spend coins when insufficient");
  it("should buy upgrades");
});

// Test world generation
describe("gameStore - World", () => {
  it("should discover new chunks deterministically");
  it("should return same chunk data for same coordinates");
  it("should generate entities in chunks");
});
```

#### Core Systems (Priority: HIGH)

```typescript
// Audio Engine
describe("AudioEngine", () => {
  it("should initialize audio context on user gesture");
  it("should play SFX");
  it("should handle music transitions");
  it("should respect mute state");
});

// Input System
describe("InputSystem", () => {
  it("should detect touch vs keyboard");
  it("should normalize joystick input");
  it("should handle concurrent inputs");
});
```

#### Entity AI (Priority: MEDIUM)

```typescript
// Gator AI
describe("GatorAI", () => {
  it("should wander when no target");
  it("should seek player when in range");
  it("should flee when suppressed");
  it("should attack when in melee range");
});
```

### Mocking Strategy

#### Browser APIs

```typescript
// Mock in src/test/setup.ts
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
```

#### Three.js / WebGL

```typescript
// Mock WebGL context
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type) => {
  if (type === "webgl" || type === "webgl2") {
    return { /* mock WebGL context */ };
  }
  return null;
});
```

#### Tone.js (Audio)

```typescript
vi.mock("tone", () => ({
  start: vi.fn().mockResolvedValue(undefined),
  Synth: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    triggerAttackRelease: vi.fn(),
  })),
  // ... other mocks
}));
```

#### Yuka (AI)

```typescript
vi.mock("yuka", () => ({
  Vehicle: class MockVehicle { /* ... */ },
  SeekBehavior: class MockSeekBehavior { /* ... */ },
  StateMachine: class MockStateMachine { /* ... */ },
}));
```

## Integration Testing

### Test Scenarios

#### Complete Game Loop

```typescript
describe("Integration - Complete Game Loop", () => {
  it("should complete full menu to game flow", () => {
    // 1. Start in menu
    expect(store.mode).toBe("MENU");
    
    // 2. Select character
    store.selectCharacter("bubbles");
    
    // 3. Start campaign
    store.setMode("CUTSCENE");
    
    // 4. Begin gameplay
    store.setMode("GAME");
  });
});
```

#### Combat Scenario

```typescript
describe("Integration - Combat", () => {
  it("should handle combat with damage and kills", () => {
    store.setMode("GAME");
    store.takeDamage(20);
    store.addKill();
    store.gainXP(10);
    
    expect(store.health).toBe(80);
    expect(store.kills).toBe(1);
    expect(store.saveData.xp).toBe(10);
  });
});
```

#### Character Progression

```typescript
describe("Integration - Progression", () => {
  it("should rank up through gameplay", () => {
    for (let i = 0; i < 20; i++) {
      store.addKill();
      store.gainXP(10);
    }
    
    expect(store.saveData.rank).toBe(1);
  });
});
```

## End-to-End Testing

### Test Categories

#### Smoke Tests (Always Run)

```typescript
// e2e/smoke.spec.ts
test("app loads and displays title");
test("app renders without console errors");
test("navigation works");
test("localStorage is accessible");
```

#### Menu Tests

```typescript
// e2e/menu.spec.ts
test("should display main menu with correct title");
test("should have character selection cards");
test("should navigate to canteen");
test("should start campaign");
```

#### Game Tests (Conditional)

```typescript
// e2e/game.spec.ts
test("should render canvas element");
test("should display HUD during gameplay", { skip: !hasMcpSupport });
test("should track score", { skip: !hasMcpSupport });
```

#### Visual Regression

```typescript
// e2e/visual-regression.spec.ts
test("should match main menu screen");
test("should render correctly on mobile viewport");
test("should render canteen screen");
```

### WebGL Testing Strategy

WebGL tests face unique challenges in CI environments:

1. **Headless Mode** (CI default):
   - Uses SwiftShader software rendering
   - Basic WebGL functionality works
   - Complex 3D rendering may fail
   - Skip GPU-dependent assertions

2. **MCP Mode** (Full testing):
   - Requires GPU access
   - Full WebGL support
   - Run all tests including visual

```typescript
const hasMcpSupport = process.env.PLAYWRIGHT_MCP === "true";

test("should render 3D scene", async ({ page }) => {
  test.skip(!hasMcpSupport, "Requires WebGL/MCP support");
  // Full WebGL test here
});
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Lint
        run: pnpm lint
        
      - name: Type Check
        run: pnpm typecheck
        
      - name: Unit Tests & Coverage
        run: pnpm test:coverage
        
      - name: Build
        run: pnpm build
        
      - name: E2E Tests
        run: pnpm test:e2e
```

### Test Artifacts

```yaml
- name: Upload coverage
  uses: coverallsapp/github-action@v2
  with:
    file: ./coverage/lcov.info

- name: Upload Playwright report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: |
      playwright-report/
      test-results/
```

## Coverage Goals

### Minimum Thresholds

```typescript
// vitest.config.ts
coverage: {
  lines: 25,
  functions: 25,
  branches: 25,
  statements: 25,
}
```

### Target Thresholds

| Module | Current | Target |
|--------|---------|--------|
| Game Store | 90% | 95% |
| Core Systems | 70% | 85% |
| UI Components | 30% | 60% |
| 3D Components | 0%* | N/A |

*3D components are covered via visual regression testing

## Test Writing Guidelines

### Naming Conventions

```typescript
// Good
it("should take 20 damage when hit by gator");
it("should not exceed max health when healing");
it("should unlock character after rescue");

// Bad
it("test damage");
it("works");
it("character stuff");
```

### Test Structure (AAA Pattern)

```typescript
it("should heal correctly after taking damage", () => {
  // Arrange
  const store = useGameStore.getState();
  store.takeDamage(50);
  
  // Act
  store.heal(20);
  
  // Assert
  expect(useGameStore.getState().health).toBe(70);
});
```

### Cleanup

```typescript
beforeEach(() => {
  // Reset store to clean state
  useGameStore.setState({
    health: 100,
    kills: 0,
    mode: "MENU",
  });
});

afterEach(() => {
  // Clear any spies/mocks
  vi.clearAllMocks();
});
```

## Troubleshooting

### Common Issues

#### "Cannot find module" Errors

```bash
# Ensure dependencies are installed
pnpm install

# Clear vitest cache
rm -rf node_modules/.vitest
```

#### WebGL Context Errors

```bash
# Run with MCP mode for full WebGL
PLAYWRIGHT_MCP=true pnpm test:e2e
```

#### Flaky E2E Tests

```typescript
// Add explicit waits
await page.waitForTimeout(1000);
await expect(element).toBeVisible({ timeout: 10000 });
```

### Debug Mode

```bash
# Vitest debug
pnpm vitest --inspect-brk

# Playwright debug
pnpm playwright test --debug
```

## Roadmap

### Phase 1: Foundation ✅
- [x] Configure Vitest with happy-dom
- [x] Set up comprehensive mocks
- [x] Create game store unit tests
- [x] Create integration tests

### Phase 2: E2E Expansion ✅
- [x] Set up Playwright with WebGL support
- [x] Create smoke tests
- [x] Create menu tests
- [x] Create visual regression tests

### Phase 3: Coverage Improvement 🔄
- [ ] Add UI component tests
- [ ] Add more entity tests
- [ ] Improve branch coverage
- [ ] Add performance benchmarks

### Phase 4: Advanced Testing
- [ ] Accessibility audits (a11y)
- [ ] Performance regression tests
- [ ] Cross-browser testing
- [ ] Mobile device testing

## References

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [React Three Fiber Testing](https://docs.pmnd.rs/react-three-fiber/advanced/testing)
- [Zustand Testing](https://docs.pmnd.rs/zustand/guides/testing)
