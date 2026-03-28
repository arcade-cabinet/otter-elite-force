# Mission Tuning Notes

Generated 2026-03-27 from governor playtest at 30000 ticks (beginner difficulty).

## Baseline Results (before tuning)

| Mission | Type | Outcome | Objectives | Peak Army | Trained | Notes |
|---------|------|---------|------------|-----------|---------|-------|
| 1 Beachhead | tutorial | VICTORY | 8/8 | 14 | 15 | Working perfectly |
| 2 The Causeway | escort | TIMEOUT | 5/10 | 15 | 4 | Escort -- governor cannot direct convoy |
| 3 Firebase Delta | capture-hold | TIMEOUT | 2/6 | 14 | 9 | Governor builds but cannot capture hilltops fast enough |
| 4 Prison Break | commando | DEFEAT | 4/7 | 5 | 0 | Commando -- expected, requires human |
| 5 Siphon Valley | assault | TIMEOUT | 0/6 | 14 | 16 | Governor builds army but never reaches fuel tanks |
| 6 Monsoon Ambush | defense | TIMEOUT | 1/3 | 24 | 18 | Governor survives waves but 30k ticks < mission length |
| 7 River Rats | naval | TIMEOUT | 1/2 | 15 | 18 | Naval interception -- requires human |
| 8 Underwater Cache | commando | DEFEAT | 2/5 | 8 | 0 | Commando -- expected, requires human |
| 9 Dense Canopy | commando | DEFEAT @1 | 0/5 | 9 | 0 | BUG: unitCount("all") not treated as wildcard |
| 10 Scorched Earth | destruction | TIMEOUT | 0/5 | 20 | 6 | Governor hoards resources (2299 fish) but doesn't push |
| 11 Entrenchment | tidal | VICTORY | 1/2 | 23 | 5 | Fast win at 996 ticks, only 1/2 objectives |
| 12 The Stronghold | commando | DEFEAT @1 | 0/4 | 19 | 0 | BUG: sgt_bubbles hero alias missing |
| 13 Great Siphon | siege | TIMEOUT | 3/8 | 34 | 24 | Good progress, needs more time |
| 14 Iron Delta | amphibious | TIMEOUT | 2/5 | 25 | 8 | Amphibious -- governor cannot cross water |
| 15 Serpent's Lair | boss | TIMEOUT | 4/7 | 33 | 24 | Boss mission -- requires human |
| 16 Last Stand | finale | TIMEOUT | 1/5 | 53 | 10 | 10-wave defense + counterattack -- needs more time |

## Bugs Fixed

### Mission 9 (Dense Canopy) -- instant defeat
- **Root cause**: `on.unitCount("ura", "all", "eq", 0)` interpreted "all" as a literal unit type name.
- **Fix**: `countUnits()` in runtimeMissionFlow.ts now treats `unitType === "all"` as a wildcard (skip type filter).

### Mission 12 (The Stronghold) -- instant defeat
- **Root cause**: Mission places `sgt_bubbles` hero but registry only has `col_bubbles`.
  `getHero("sgt_bubbles")` returned undefined, entity spawned without proper type tag,
  `unitCount("ura", "sgt_bubbles", "eq", 0)` immediately true, mission fails.
- **Fix**: Added `HERO_ALIASES` map in `src/entities/registry.ts` with `sgt_bubbles -> col_bubbles`.

## Resource Tuning

### Mission 3 (Firebase Delta) -- capture-hold, base-building
- **Problem**: Starting resources (300/150/75) insufficient for governor to build army and capture 3 hilltops.
- **Change**: 300/150/75 -> 500/300/150, pop cap 20 -> 25.
- **Rationale**: Governor needs to build faster to push hilltops before counterattack timers fire.

### Mission 5 (Siphon Valley) -- assault, base-building
- **Problem**: Very low starting resources (150/100/50). Governor builds army (16 trained!) but 0 objectives.
- **Change**: 150/100/50 -> 400/250/100, pop cap 20 -> 25.
- **Rationale**: Governor needs immediate economy to cross the river and destroy fuel tanks.

### Mission 6 (Monsoon Ambush) -- wave defense
- **Problem**: 30000 ticks = ~8.3 minutes game time, but wave 8 clear fires at timer 1140 (~19 min). Governor cannot physically reach the victory condition in 30k ticks.
- **Change**: 200/150/75 -> 400/300/150, pop cap 20 -> 25.
- **Rationale**: More starting resources let the governor train faster. However, the real limit is mission length vs tick budget. Governor likely still times out but will be closer.

### Mission 10 (Scorched Earth) -- destruction
- **Problem**: Governor hoards 2299 fish but trains only 6 units. Doesn't push to destroy fuel tanks.
- **Change**: 300/250/150 -> 500/400/250, pop cap 20 -> 25.
- **Rationale**: More starting salvage allows immediate training without waiting for gather.

## Governor-Expected Victories

Target missions for governor victory: 1, 3, 5, 6, 10, 11.

| Mission | Status |
|---------|--------|
| 1 Beachhead | PASS -- victory before tuning |
| 3 Firebase Delta | TUNED -- increased resources, needs retest |
| 5 Siphon Valley | TUNED -- increased resources, needs retest |
| 6 Monsoon Ambush | TUNED but likely still timeout (20-min mission vs 8-min tick budget) |
| 10 Scorched Earth | TUNED -- increased resources, needs retest |
| 11 Entrenchment | PASS -- victory before tuning (fast win at 996 ticks) |

## Missions Requiring Human Player

| Mission | Reason |
|---------|--------|
| 2 The Causeway | Escort mechanics -- governor cannot direct convoy trucks |
| 4 Prison Break | Commando -- no lodge, no economy, stealth required |
| 7 River Rats | Naval interception -- governor has no water unit strategy |
| 8 Underwater Cache | Commando -- no lodge, underwater mechanics |
| 9 Dense Canopy | Commando/recon -- no lodge, fog exploration required |
| 12 The Stronghold | Commando -- no lodge, 5-phase assault + rescue |
| 14 Iron Delta | Amphibious -- governor cannot cross deep water channels |
| 15 Serpent's Lair | Boss fight -- requires specialized tactics |
| 16 Last Stand | Finale -- 10-wave defense + counterattack, requires full campaign unlock |
