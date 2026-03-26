# Documentation Map

This file defines which documents are authoritative, which are supporting, and which are historical or partially superseded.

## Source-of-Truth Order

When documents conflict, use this order:

1. `docs/superpowers/specs/2026-03-24-rts-canon-responsive-asset-overhaul-plan.md`
2. `docs/references/Copilot-Copilot_Chat_VT91k21R.md`
3. `README.md`
4. `AGENTS.md` and `CLAUDE.md`
5. current implementation in `src/` and `scripts/`
6. supporting docs in `docs/design/`, `docs/architecture/`, and root operational docs

## Canonical Documents

### Product canon

- `docs/superpowers/specs/2026-03-24-rts-canon-responsive-asset-overhaul-plan.md`
  - authoritative product and canon lock
  - defines campaign-first RTS direction
  - explicitly de-authorizes the open-world shooter framing

### UI / design direction

- `docs/references/Copilot-Copilot_Chat_VT91k21R.md`
  - design bible and visual reference
  - use for command-post, dossier, theming, component direction, and SP-DSL references

### Repo-facing summaries

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`

These should stay concise and consistent with the canon doc above.

## Supporting Documents

- `docs/architecture/overview.md` — current runtime and pipeline architecture
- `docs/architecture/testing-strategy.md` — deeper testing guidance
- `docs/architecture/wcag-contrast-audit.md` — WCAG AA contrast validation results
- `TESTING.md` — command-oriented testing quick reference
- `docs/design/game-design-document.md` — gameplay framing and mission fantasy
- `LORE.md` — world framing and faction language

## Historical / Partially Superseded Documents

These are worth keeping for context, but they are **not** the active source of truth.

- `CHUNK_PERSISTENCE.md`
  - historical open-world shooter documentation
  - no longer authoritative for the current RTS product

- `docs/superpowers/specs/2026-03-23-rts-pivot-design.md`
  - important transition document
  - contains useful early RTS thinking, but also outdated implementation assumptions

- `docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md`
  - still useful as a reference for UI and SP-DSL ambition
  - some implementation details are outdated or aspirational

- `docs/superpowers/plans/2026-03-23-*.md`
- `docs/superpowers/plans/2026-03-24-*.md`
  - planning artifacts, not current truth

## Consolidation Guidance

### Keep and maintain

- canon / source-of-truth docs
- architecture + testing docs that match the current code
- supporting design docs that still help day-to-day work

### Merge or remove later

- duplicate plan files whose unique content has already been absorbed elsewhere
- obsolete root docs that describe the pre-RTS/open-world architecture
- older implementation plans that no longer match the file structure or stack

### Editing rule

If you change:

- the core product direction
- the build pipeline
- the root UI flow
- faction naming or conflict framing

then update the canonical/supporting docs in the same change set.