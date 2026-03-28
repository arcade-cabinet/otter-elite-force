---
title: Contributing
version: 1.0.0
updated: 2026-03-26
tags: [process, workflow, standards]
---

# Contributing

Private repository. Internal team + AI agents only.

## Workflow

1. Branch from `main` — `feat/`, `fix/`, `chore/`, `docs/` prefixes
2. Conventional commit messages
3. PR with description — wait for CI green
4. Squash merge via release-please or manual review
5. Verify deployed result before moving on

## Commit Convention

```
feat: add new game system
fix: resolve click detection on units
chore: update dependencies
docs: rewrite architecture overview
refactor: extract combat resolution into separate system
test: add mission validation tests
ci: fix Android build pipeline
```

## Code Standards

- **TypeScript** — strict mode, no `any`, no `!` assertions
- **Biome** — lint + format (`pnpm lint`)
- **Tests** — Vitest (`pnpm test` + `pnpm test:browser`)
- **Node** — 24 LTS (see `.nvmrc`)

## PR Checklist

- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npx biome check .` — 0 errors
- [ ] `npx vitest run` — all tests pass
- [ ] Tested in browser manually (not just compiled)
- [ ] CI fully green before merge
- [ ] Deployed result verified (if affects GH Pages)
