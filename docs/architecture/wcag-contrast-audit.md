# WCAG AA Contrast Audit

Audited: 2026-03-25

## Standard

All text/background combinations must meet WCAG AA contrast ratios:
- **4.5:1** for normal text (under 18px or under 14px bold)
- **3:1** for large text (18px+ or 14px+ bold)

## Theme: Tactical (gameplay HUD)

| Pair | Foreground | Background | Ratio | Req | Status |
|---|---|---|---|---|---|
| Body text on background | #e8dfc1 | #0f2f1c | 10.91:1 | 4.5:1 | PASS |
| Card text on card | #d3c89e | #12311f | 8.44:1 | 4.5:1 | PASS |
| Primary on background | #9a916c | #0f2f1c | 4.60:1 | 3:1 | PASS |
| Primary fg on primary | #07140d | #9a916c | 5.96:1 | 4.5:1 | PASS |
| Muted text on background | #b8ad85 | #0f2f1c | 6.48:1 | 4.5:1 | PASS |
| Muted text on card | #b8ad85 | #12311f | 6.30:1 | 4.5:1 | PASS |
| Accent on background | #00ff41 | #0f2f1c | 10.65:1 | 3:1 | PASS |
| Accent fg on accent | #07140d | #00ff41 | 13.80:1 | 4.5:1 | PASS |
| Destructive on background | #ff4500 | #0f2f1c | 4.23:1 | 3:1 | PASS |
| Destructive fg on destructive | #1a0a00 | #ff4500 | 5.61:1 | 4.5:1 | PASS |
| Foreground on card | #e8dfc1 | #12311f | 10.61:1 | 4.5:1 | PASS |

## Theme: Command Post (menus, settings)

| Pair | Foreground | Background | Ratio | Req | Status |
|---|---|---|---|---|---|
| Body text on background | #e8dfc1 | #3a2f1e | 9.82:1 | 4.5:1 | PASS |
| Card text on card | #d3c89e | #4d2a1b | 7.53:1 | 4.5:1 | PASS |
| Primary on background | #d4a574 | #3a2f1e | 5.88:1 | 3:1 | PASS |
| Primary fg on primary | #3a1f14 | #d4a574 | 6.81:1 | 4.5:1 | PASS |
| Muted text on background | #b8ad85 | #3a2f1e | 5.83:1 | 4.5:1 | PASS |
| Muted text on card | #b8ad85 | #4d2a1b | 5.63:1 | 4.5:1 | PASS |
| Accent on background | #ffe28a | #3a2f1e | 10.28:1 | 3:1 | PASS |
| Accent fg on accent | #3a1f14 | #ffe28a | 11.90:1 | 4.5:1 | PASS |
| Destructive on background | #d9533f | #3a2f1e | 3.28:1 | 3:1 | PASS |
| Destructive fg on destructive | #1a0a00 | #d9533f | 4.84:1 | 4.5:1 | PASS |
| Foreground on card | #e8dfc1 | #4d2a1b | 9.48:1 | 4.5:1 | PASS |

## Theme: Briefing (mission briefing)

| Pair | Foreground | Background | Ratio | Req | Status |
|---|---|---|---|---|---|
| Body text on background | #e8dfc1 | #0a0a0c | 14.84:1 | 4.5:1 | PASS |
| Card text on card | #d3c89e | #1a1a1c | 10.36:1 | 4.5:1 | PASS |
| Primary on background | #f5e6c8 | #0a0a0c | 16.05:1 | 3:1 | PASS |
| Primary fg on primary | #0a0a0c | #f5e6c8 | 16.05:1 | 4.5:1 | PASS |
| Muted text on background | #9a916c | #0a0a0c | 6.26:1 | 4.5:1 | PASS |
| Muted text on card | #9a916c | #1a1a1c | 5.50:1 | 4.5:1 | PASS |
| Accent on background | #ffe28a | #0a0a0c | 15.54:1 | 3:1 | PASS |
| Accent fg on accent | #0a0a0c | #ffe28a | 15.54:1 | 4.5:1 | PASS |
| Destructive on background | #d9533f | #0a0a0c | 4.95:1 | 3:1 | PASS |
| Destructive fg on destructive | #1a0a00 | #d9533f | 4.84:1 | 4.5:1 | PASS |
| Foreground on card | #e8dfc1 | #1a1a1c | 13.04:1 | 4.5:1 | PASS |

## Fixes Applied

- **destructive-foreground** changed from `#e8dfc1` (light khaki) to `#1a0a00` (warm near-black) across all three themes. The previous value failed at 2.58-3.00:1 against the destructive red backgrounds. The new value achieves 4.84-5.61:1.

## Intentional Exceptions

- **Decorative opacity overlays** (e.g. `text-accent/80`, `text-muted-foreground` at reduced opacity via Tailwind classes) are used for non-essential labels and status indicators. These elements are supplementary and convey the same information through other channels (badges, position, icons).
- **Combat floating text** uses colored text (#f87171 red, #5eead4 green, #facc15 yellow) over the game canvas with a hard black drop-shadow for readability. These are transient feedback indicators, not persistent content.
