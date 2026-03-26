# Full Polish Plan — OTTER: ELITE FORCE

> **Status**: Active execution plan. Every item is a concrete action, not a wish.

## Current State

- **Rendering**: Konva canvas working. 47 game sprites + 12 portraits, all hand-crafted.
- **ECS**: 20 Phaser-free systems functional. DialogueState trait added.
- **Tests**: 104 files, 2,376 tests, 0 failures. TypeScript clean.
- **Lore**: LORE.md with 5 named villains. All 16 mission briefings converted to dialogue.
- **Gallery**: gallery.html for visual sprite inspection.

## What's Broken or Missing

### P0 — Game won't play without these

1. **BriefingDialogue not wired into GameplayScreen** — the dialogue overlay component exists but App.tsx never renders it. Player enters a mission and sees no briefing.

2. **DialogueState not read by any UI** — the ECS trait exists, mid-mission `act.exchange()` triggers exist, but nothing reads `DialogueState` to show the portrait overlay during gameplay.

3. **showDialogueExchange not handled by action handler** — the scenario engine delegates to `actionHandler`, but `GameCanvas.tsx` doesn't handle the `showDialogueExchange` action type. It needs to write to `DialogueState`.

4. **AlertBanner not rendered in GameLayout** — alerts for "under attack", "building complete", "training complete" have no UI in the new layout.

5. **Dead CommandConsole.tsx** — still exists, imported nowhere. Delete it.

### P1 — Game is playable but rough

6. **Landing page action shot** — MainMenu has placeholder faction cards. Needs Sgt. Bubbles vs Ironjaw rendered from portraits at large scale.

7. **Mid-mission exchanges for ALL missions** — Only M4 has `act.exchange()` calls. M1-3, M5-16 still use single-line `act.dialogue()` for mid-mission events. Key moments that need exchanges:
   - M8: Cpl. Splash rescue conversation
   - M10: Medic Marina joins (if applicable)
   - M12: Sgt. Fang rescue
   - M13: First sight of the Great Siphon
   - M15: Confronting Ironjaw
   - M16: Final stand speech

8. **Yuka playtester governor** — `src/ai/playtester/simulation.ts` exists but was written for the Phaser era. Needs verification that it works with the new rendering layer (or is purely ECS-driven and doesn't care).

9. **E2E tests** — the Playwright tests reference old selectors. Menu tests may still work but game screen tests need updating for the new GameLayout.

### P2 — Polish

10. **Sound during dialogue** — typewriter clack sound should play during text reveal. Audio engine exists but isn't hooked into BriefingDialogue.

11. **Scroll to continue indicator** — mobile players need a visual "tap to continue" prompt during dialogue, not just text at the bottom.

12. **Game clock display** — GameLayout's resource strip needs to show elapsed mission time.

13. **Objective tracker** — compact objective status somewhere in the HUD (not the massive expanded list from the old CommandConsole).

14. **Selection info in GameLayout** — the middle panel of the POC-style layout should show selected unit stats. Currently it's a placeholder.

15. **Action buttons in GameLayout** — the bottom panel should show build/train/research buttons based on selection. Currently placeholder.

## Execution Order

```
P0-1: Wire BriefingDialogue into GameplayScreen
P0-2: Wire DialogueState → BriefingDialogue (mid-mission)
P0-3: Handle showDialogueExchange in action handler
P0-4: Add AlertBanner to GameLayout
P0-5: Delete CommandConsole.tsx
P1-6: Landing page action shot
P1-7: Mid-mission exchanges for key moments (6 missions)
P1-8: Verify Yuka playtester
P1-9: Update E2E tests
P2-10 through P2-15: Polish items
```
