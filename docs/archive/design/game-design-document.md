# OTTER: ELITE FORCE — Game Design Document

## What This Game IS

A campaign-driven 2D RTS inspired by Warcraft: Orcs & Humans, set in a Vietnam-era jungle where otter soldiers fight crocodilian predators. 16 hand-crafted missions across 4 chapters. Playable on desktop AND mobile with equal quality.

## The Core Loop

```
GATHER → BUILD → TRAIN → FIGHT → ADVANCE
```

1. **Gather**: River Rats (workers) collect Fish, Timber, and Salvage from map resources
2. **Build**: Spend resources to construct buildings (Command Post, Barracks, Watchtower, etc.)
3. **Train**: Buildings produce combat units (Mudfoot infantry, Shellcracker ranged, etc.)
4. **Fight**: Move army to engage Scale-Guard enemies, complete mission objectives
5. **Advance**: Complete mission → unlock new units/buildings → next mission briefing

Each mission varies which parts of this loop are available. Tutorial missions restrict to Gather+Build. Defense missions give you a pre-built base and focus on Fight. Commando missions strip everything except Fight with a hero unit.

## What Makes It Fun

### 1. Variety Through Constraint
No two missions play the same. The 16 missions use 8 different objective types:
- **Build & Destroy** (classic RTS)
- **Escort/Defend** (protect a convoy)
- **King of the Hill** (capture and hold points)
- **Commando/Rescue** (stealth hero mission, no base)
- **Survival/Timed** (defend against waves)
- **Capture the Flag** (grab enemy supply crates)
- **Liberation** (free occupied villages)
- **Siege** (assault a fortified position)

### 2. Earned Progression
Heroes are RESCUED in missions, not purchased. Each rescue unlocks a unique unit with special abilities. The player earns their arsenal through gameplay.

### 3. The Briefing Anticipation
Before every mission, a hand-painted portrait delivers a briefing in character. FOXHOUND (radio operator) for early missions, Gen. Whiskers (gruff commander) after his rescue. The player WANTS to see the next briefing.

### 4. Persistent Consequences
Mission 13 reuses the base you built in Mission 11. Over-build in 11? You're rewarded in 13. This creates strategic depth across the campaign, not just within missions.

### 5. Escalating Difficulty Through Situation
Difficulty increases by changing the SITUATION, not inflating stats:
- Fewer starting resources
- Enemy has positional advantage
- Weather reduces visibility
- Map layout creates chokepoints
- Time pressure (sludge flood in Mission 15)

## Feel and Tone

**"Full Metal Jacket meets Wind in the Willows"**

- Gritty military language (grunt slang: "The Soup", "Slick-Skin", "Scale-Bait")
- Cartoon otter soldiers in tactical gear
- Bleached Ektachrome color palette (burnt oranges, silt browns, deep jungle greens)
- No sci-fi. No chrome. No lasers. Analog military.
- The humor is dark and dry, never slapstick

## Player Experience Per Mission (Target)

| Phase | Duration | Player Feeling |
|-------|----------|---------------|
| Briefing | 30-60s | Anticipation, narrative investment |
| Early game (build) | 2-3 min | Strategic planning, economy setup |
| Mid game (expand) | 3-5 min | Tension building, scouting, first contact |
| Late game (assault) | 3-5 min | Climactic action, tactical execution |
| Victory/Score | 15s | Satisfaction, star rating reward |
| **Total** | **8-15 min** | |

Commando missions are shorter (5-8 min). The final mission (The Reckoning) is longer (15-20 min).

## Three Resources

| Resource | Source | Primary Use | Feel |
|----------|--------|------------|------|
| **Fish** | Fishing spots, Fish Traps | Unit production | The bread-and-butter. Always needed. |
| **Timber** | Mangrove trees (finite, regrow) | Buildings, walls | Scarce early. Forces exploration. |
| **Salvage** | Wreckage, enemy drops, caches | Upgrades, advanced units | Rare. Rewards aggression. |

Fish is steady income (traps). Timber forces the player to expand outward (trees run out near base). Salvage rewards combat (enemy drops) — pushing the player to FIGHT, not turtle.

## Population System

- **Burrows** provide +6 population cap each
- **Fish Traps** provide income but NO population (split from draft v1)
- This forces a genuine tradeoff: spend Timber on income OR army capacity
- Starting cap: 4 (tutorial). Max practical: ~60 (10 burrows)

## Two Factions

### United River Alliance (URA) — Player
**Doctrine:** Combined arms. Versatile units, building variety, tech upgrades.
**Strength:** Flexibility — can adapt to any situation.
**Weakness:** No single unit is dominant. Requires army composition thinking.

### Scale-Guard Militia — Enemy
**Doctrine:** Ambush and attrition. Specialized predators.
**Strength:** Individual units are powerful (Gator has 120 HP vs Mudfoot's 80).
**Weakness:** Less diverse. Relies on terrain advantage and surprise.

The asymmetry means the player must outthink, not outmuscle. A head-on fight against Gators is a losing trade — but Shellcrackers at range behind Mudfoot tanks works.

## Difficulty Modes

| Mode | Damage Mult | Resource Mult | Special |
|------|-------------|---------------|---------|
| **Support** | Enemy 0.75x | Player 1.25x | Safety net for first playthrough |
| **Tactical** | 1.0x | 1.0x | The intended experience |
| **Elite** | Enemy 1.25x | Player 0.75x | For mastery. Punishing. |

Escalation only — once committed to a higher difficulty, no going back.

## Victory Scoring

Each mission awards Bronze/Silver/Gold stars:
- **Time score (40%)**: Finish under par time → full marks
- **Survival score (30%)**: Fewer units lost → higher score
- **Bonus objectives (30%)**: Optional challenges (no-alarm, speed, etc.)

Stars unlock Skirmish mode maps. 100% completion requires Gold on all 16 missions.
