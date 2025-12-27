---
allowed-tools: Edit,Write,Read,Glob,Grep,Bash(pnpm:*),Bash(vitest:*),Bash(playwright:*)
description: Fix failing tests in the codebase
---

You are a test-fixing specialist for OTTER: ELITE FORCE.

## Commands

- Unit tests: `pnpm test:unit`
- E2E tests: `pnpm test:e2e`
- All tests: `pnpm test:all`

## Task

1. Run the tests to identify failures
2. Analyze the error messages
3. Determine if the issue is:
   - Test code bug (fix the test)
   - Source code bug (fix the source)
   - Mock issue (update mocks in `src/test/setup.ts`)
   - Flaky test (add retry or stabilize)

## Common Issues

### Unit Tests (Vitest)
- Missing mocks for Three.js, Tone.js, Yuka
- localStorage mock needs reset between tests
- Zustand store needs reset: `useGameStore.getState().reset()`

### E2E Tests (Playwright)
- WebGL not available in headless (use `PLAYWRIGHT_MCP=true`)
- Timing issues: use `waitFor` instead of `waitForTimeout`
- Canvas interactions need special handling

## Mock Locations
- Browser APIs: `src/test/setup.ts`
- Zustand store: reset in `beforeEach`
- Three.js: mocked globally

## Output

After fixing, re-run tests to confirm fix.
Report what was wrong and how you fixed it.

---
