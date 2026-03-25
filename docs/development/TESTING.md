# Testing

This is the command-oriented testing reference for the current repo. For deeper architecture guidance, see `docs/architecture/testing-strategy.md`.

## Core Commands

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:browser
pnpm test:e2e
pnpm test:all
pnpm build
pnpm build:sprites
```

## What Each Command Covers

| Command | Purpose |
|---|---|
| `pnpm typecheck` | TypeScript correctness |
| `pnpm lint` | Biome linting across the repo |
| `pnpm test:unit` | Vitest spec tests in the default config |
| `pnpm test:browser` | browser-mode Vitest coverage via `vitest.browser.config.ts` |
| `pnpm test:e2e` | Playwright end-to-end coverage |
| `pnpm test:all` | unit + browser + e2e |
| `pnpm build` | production build verification |
| `pnpm build:sprites` | SP-DSL / sprite atlas pipeline verification |

## Recommended Validation Path

### For UI work

1. `pnpm typecheck`
2. `pnpm lint`
3. focused Vitest file or `pnpm test:browser` when relevant
4. `pnpm build`

### For mission / ECS / gameplay work

1. `pnpm typecheck`
2. focused `pnpm vitest run ...`
3. `pnpm test:browser` if the change affects runtime rendering
4. `pnpm build`

### For sprite / portrait / pipeline work

1. `pnpm build:sprites`
2. focused entity/pipeline Vitest coverage
3. `pnpm test:browser` when visual/runtime loading is affected
4. `pnpm build`

## Asset Pipeline Validation

`pnpm build:sprites` validates the current sprite pipeline by:

- importing entity definitions from `src/entities/`
- rendering legacy and SP-DSL sprite sources
- packing atlases for `units`, `buildings`, `resources`, `props`, `terrain`, and `portraits`
- writing manifest files to `public/assets/`

When the asset system changes, this command is part of the required verification path.

## Focused Testing Patterns

Examples:

```bash
pnpm vitest run src/__tests__/specs/entities/
pnpm vitest run src/__tests__/specs/ui/main-menu.test.tsx
pnpm vitest run src/__tests__/specs/entities/sprite-quality.test.ts
```

Prefer the smallest meaningful test target before widening scope.

## Browser and E2E Notes

- `pnpm test:browser` uses the dedicated browser Vitest config
- `pnpm test:e2e` uses Playwright
- `pnpm playwright:install` installs Chromium for Playwright when needed

## Current Caveat

Some focused UI spec files currently assume `@testing-library/react`, but that dependency is not installed in the repo yet. Typecheck/build/lint can still pass while those specific tests remain blocked.

If that test path needs to be fully re-enabled, install the dependency through the package manager rather than editing manifests manually.