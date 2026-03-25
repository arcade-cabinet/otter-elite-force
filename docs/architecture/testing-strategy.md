# Testing Strategy

## Goal

Testing should protect the current RTS product shape:

- simplified command-post flow
- direct mission start / continue behavior
- tactical HUD readability and layout stability
- mission progression and result routing
- SP-DSL asset build integrity

## Main Validation Layers

### 1. Type and build safety

Run these often:

- `pnpm typecheck`
- `pnpm build`

These catch routing breakage, deleted-screen fallout, import drift, and typing regressions.

### 2. Focused Vitest coverage

Use Vitest for:

- ECS state traits and singleton state
- app screen transitions
- menu/front-door behavior
- mission compiler/runtime helpers
- entity and asset-pipeline logic
- AI FSM and pathfinding behavior
- combat, economy, and research systems

Prefer focused runs during iteration, for example:

- `pnpm vitest run src/__tests__/specs/state/app-screen.test.ts`
- `pnpm vitest run src/__tests__/specs/ui/main-menu.test.tsx`
- `pnpm vitest run src/__tests__/systems/combatSystem.test.ts`

### 3. Browser-mode UI verification

Use `pnpm test:browser` when validating runtime-facing UI behavior that benefits from a real browser environment.

This is especially useful for:

- responsive shell behavior
- HUD layout changes
- command-post interaction regressions

### 4. End-to-end verification

Use `pnpm test:e2e` for larger integration coverage when changing:

- core navigation
- campaign start/resume flows
- tactical screen entry
- mission result loops

### 5. Asset pipeline verification

Run `pnpm build:sprites` whenever changing:

- sprite generation logic
- manifest generation
- asset family/contract/preset/recipe registries
- portrait/building/unit output expectations

## Testing Priorities For The Current Product Direction

### Front door

Protect these behaviors:

- menu shows the three primary actions
- new game starts a fresh campaign
- continue resumes current mission directly
- settings remains reachable without cluttering the landing

### Mission intro / dialogue

Protect these behaviors:

- mission intro dialogue appears in tactical HUD context
- command transmission resets when mission changes
- detached briefing screens do not reappear in the main flow

### Result flow

Protect these behaviors:

- mission completion routes to result state
- defeat routes to retry/menu result state
- next mission returns directly to gameplay

## Practical Rule

When simplifying the product, tests should simplify too.

Do not keep tests alive for removed product ideas such as:

- canteen/store loops
- detached mission-select startup flow
- obsolete pre-mission briefing screens

If a product concept is intentionally removed, the matching tests should be removed or rewritten in the same change.