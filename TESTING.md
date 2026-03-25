# Testing Quick Reference

## Commands

```bash
# Type checking
pnpm typecheck

# Lint (Biome)
pnpm lint
pnpm lint:fix

# Unit tests (Vitest)
pnpm test:unit
pnpm test:unit:watch

# Single test file
pnpm vitest run src/__tests__/specs/state/app-screen.test.ts

# Coverage
pnpm test:coverage

# Browser tests (Vitest browser mode)
pnpm test:browser

# End-to-end tests (Playwright)
pnpm test:e2e
pnpm test:e2e:headed
pnpm test:e2e:ui

# All tests
pnpm test:all

# Asset pipeline
pnpm build:sprites

# Full build
pnpm build
```

## What to Run When

| Changed | Run |
|---|---|
| Any TypeScript | `pnpm typecheck` |
| UI components | `pnpm typecheck && pnpm lint` |
| ECS traits / systems | `pnpm test:unit` |
| HUD layout | `pnpm test:browser` |
| Navigation flows | `pnpm test:e2e` |
| Sprite definitions | `pnpm build:sprites` |
| Everything | `pnpm test:all` |

## Test Organization

- `src/__tests__/specs/` — specification tests (state, UI, entities, combat, economy)
- `src/__tests__/systems/` — ECS system behavior tests
- `src/__tests__/ai/` — AI FSM and pathfinding tests
- `src/__tests__/browser/` — browser-mode Phaser tests
- `src/__tests__/ui/` — component rendering tests
- `e2e/` — Playwright end-to-end tests

## Quality Gates

Pre-commit minimum: `pnpm typecheck && pnpm lint`

Full validation: `pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:e2e`
