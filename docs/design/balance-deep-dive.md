---
title: Balance Deep Dive
description: Comprehensive RTS balance research, per-mission paper playtesting, PRNG tables, and progression curves
version: 1.0.0
updated: 2026-03-26
tags: [design, balance, economy, combat, progression, prng]
status: active
---

# Balance Deep Dive

This document is the definitive balance reference for Otter: Elite Force. It contains
concrete numbers, minute-by-minute economy timelines, combat math, PRNG tables, and
progression curves for all 16 missions. A game designer or systems programmer should be
able to implement the entire balance layer from this document alone.

---

## Part 1: RTS Balance Research (Genre Foundations)

### 1.1 Economy Patterns Across Classic RTS

#### Warcraft II
- **Gold mines**: Finite (~10,000 gold per mine, ~100 gold per worker trip, ~10s round trip).
  Optimal saturation: 4-5 workers per mine. Beyond 5, workers idle-queue.
- **Lumber**: Infinite but slow (~100 lumber per trip, ~20s round trip including travel).
  Optimal: 4-6 choppers depending on distance to nearest tree line.
- **Oil**: Finite offshore. Requires oil platform (800 gold, 200 lumber). Tanker ships
  gather ~100 oil per trip (~25s). Scarce — 1-2 patches per map.
- **First military unit**: Footman at ~2:30 (build barracks ~1:00 + train ~40s + gathering startup).
- **Income curve**: Early game is pure scarcity (one mine, close trees). Mid game has 2-3
  mines, established lumber camps, oil flowing. Late game is strategic scarcity — mines
  deplete, forcing expansion or aggression.

#### StarCraft
- **Minerals**: 8 patches per base, ~65 minerals per trip (~6s per trip at saturation).
  Optimal: 2.0-2.5 workers per patch (16-20 workers per base).
- **Vespene**: 1-2 geysers per base, ~8 gas per trip, slower but steady.
  Optimal: 3 workers per geyser.
- **First military unit**: ~1:45 (Zealot/Marine/Zergling depending on race).
- **Income curve**: Sharp early scarcity. Natural expansion expected by 4-6 minutes.
  Late game is a multi-base logistics war.

#### Age of Empires II
- **Food**: Multiple sources (berries, farms, boar, deer, fish). Farms are renewable but
  cost wood. Hunting is fastest early.
- **Wood**: Infinite, slow. ~20 wood per trip.
- **Gold/Stone**: Finite mines. Gold is the scarce late-game resource.
- **First military unit**: ~6:00 (after Dark Age tech). Militia rush possible at ~4:30.
- **Income curve**: Gentlest early ramp of the three. Multiple age-ups gate progression
  more than resource scarcity.

#### Key Lessons for Otter: Elite Force
| Principle | Classic RTS Pattern | OEF Application |
|-----------|-------------------|-----------------|
| Resource scarcity drives expansion | WC2 gold depletion | Timber depletion near lodge forces pushing out |
| Two resource types minimum | Gold + Wood (WC2), Minerals + Gas (SC) | Fish + Timber (basic), Salvage (advanced) |
| Worker saturation point | 4-6 per source | 2-3 per fish spot, 3-4 on timber grove |
| First military unit timing | 2-3 minutes | 2:00-2:30 target (Mudfoot) |
| Income must outpace static defense | Income doubles per expansion | Fish Traps + liberated villages provide passive income growth |

### 1.2 Unit Progression Tiers

#### How Classic RTS Handles Tiers

**Warcraft II** (3 building tiers):
- Tier 1: Footman (6 damage, 60 HP). Cheap, disposable.
- Tier 2: Knight (8 damage, 90 HP, faster). Clear power jump. Requires Keep.
- Tier 3: Paladin (8 damage, 90 HP + healing aura). Requires Castle. Same stats but
  ability makes the difference.

**StarCraft** (tech tree branches, not linear tiers):
- Bio: Marine (6 dmg, 40 HP) -> Medic (healing) -> upgrade stim-pack (+50% attack speed).
- Mech: Vulture (20 dmg, 80 HP) -> Siege Tank (70 splash) -> Goliath (anti-air).
- Each branch counters different things. No strict "better version of same unit."

**Key insight**: The best progression systems give each tier a qualitative difference
(new abilities, new tactical role) rather than just quantitative stat boosts. A Paladin
is not a "bigger Footman" — it is a frontline anchor that heals nearby units.

#### OEF Tier Structure

OEF uses a flat roster with research-gated upgrades rather than tier replacements.
A Mudfoot is always a Mudfoot — it gets tougher with Hardshell Armor but it never
becomes a "Super Mudfoot." New unit types expand tactical options rather than replacing
old ones.

| Tier | Units Available | Buildings Available | Research Available |
|------|----------------|--------------------|--------------------|
| 0 (Lodge only) | River Rat | Lodge, Burrow | None |
| 1 (Command Post) | Mudfoot | Barracks, Fish Trap, Watchtower, Sandbag Wall | None |
| 2 (Armory) | Shellcracker, Sapper | Armory, Stone Wall, Gun Tower | Hardshell Armor, Fish Oil Arrows |
| 3 (Dock + Field Hospital) | Raftsman, Diver, Mortar Otter | Dock, Field Hospital, Minefield | Demolition Training, Fortified Walls |
| 4 (Shield Generator) | All + heroes | Shield Generator | Precision Bombardment, all upgrades |

### 1.3 Mission Design Patterns (Campaign Pacing)

#### Warcraft II Campaign Observations
- **Missions 1-3**: Small maps, 2-5 starting units, single objective, 5-10 minutes.
  Each introduces one mechanic (movement, combat, building).
- **Missions 4-6**: Medium maps, 5-10 starting units, 2-3 objectives, 10-15 minutes.
  First real base-building and multi-front combat.
- **Missions 7-10**: Large maps, full base, multiple expansions, 15-25 minutes.
  Player must manage economy and multiple army groups.
- **Missions 11-14**: Largest maps, maximum enemy density, 25-40 minutes.
  Full roster, all upgrades, complex multi-phase objectives.

#### Pacing Rules
1. **Every mission introduces exactly one new mechanic.** Never two. The player needs
   time to learn each system before the next is layered on.
2. **Starting resources should always allow the player to "do something" immediately.**
   Zero-resource starts feel punishing. Even 50 timber lets the player start gathering.
3. **The first enemy contact should be survivable.** Tutorial missions should never
   result in a wipe from the first encounter on any difficulty.
4. **Mission length should increase gradually.** 8 min -> 12 min -> 15 min -> 20 min
   is better than 8 min -> 25 min.
5. **Commando missions (no base) should alternate with base-building missions.**
   Variety prevents monotony.

### 1.4 Combat Balance Fundamentals

#### Time to Kill (TTK)
The most important balance metric. If TTK is too fast, micro does not matter. If TTK
is too slow, battles feel sluggish.

**Target TTK ranges:**
| Matchup | Target TTK | Rationale |
|---------|-----------|-----------|
| Basic unit vs basic unit (1v1) | 5-8 seconds | Long enough to react, short enough to feel lethal |
| Basic unit vs heavy unit (1v1) | 10-15 seconds | Heavy should win but not instantly |
| Heavy unit vs heavy unit (1v1) | 12-18 seconds | Gives time for micro, reinforcement |
| Hero vs basic unit (1v1) | 3-5 seconds | Hero should feel powerful |
| Basic unit vs hero (1v1) | 20-30 seconds | Hero can absorb punishment |
| AoE vs group (5+ units) | 3-5 seconds to first kill | AoE punishes clustering fast |
| Any unit vs building | 15-30 seconds per building | Buildings should require commitment |

#### The 33% Rule for Upgrades
An upgrade that gives +33% effective power is the sweet spot. Less than +20% feels
invisible. More than +50% makes pre-upgrade units feel useless.

Examples:
- +2 damage on a 6-damage unit = +33% damage. Noticeable.
- +10 HP on an 80 HP unit = +12.5%. Not very noticeable.
- +10 HP on an 80 HP unit AND the enemy does 12 damage = surviving 7 hits instead of 6
  = +16.6% effective HP. Still marginal but calculable.

#### Rock-Paper-Scissors Depth
Pure RPS (unit A always beats B, B always beats C, C always beats A) is too deterministic.
Good balance uses "soft" counters: A beats B 70-80% of the time, not 100%. Micro skill,
positioning, and numbers can overcome soft counters.

### 1.5 Loot/Drops/Rewards

#### What Makes Mission Rewards Feel Meaningful
1. **Immediate tactical impact.** A salvage drop that lets you train one more Shellcracker
   before the next fight is more exciting than +200 fish going into a stockpile.
2. **Visible progress.** Star ratings, bonus objective checkmarks, and loot notifications
   provide dopamine loops.
3. **Carry-forward value.** Resources that persist between missions matter more than
   resources consumed within a mission.
4. **Rarity signals.** Color-coded or named drops feel more valuable even at similar
   resource amounts: "Ironjaw's War Chest: 500 salvage" vs "Salvage Cache: 500 salvage."

---

## Part 2: OEF Unit Stat Sheet (Canonical Reference)

### 2.1 OEF (Player) Units

| Unit | HP | Armor | Damage | Range | Speed | Attack Speed | Cost (F/T/S) | Train Time | Pop |
|------|-----|-------|--------|-------|-------|-------------|-------------|-----------|-----|
| River Rat | 40 | 0 | 4 | 1 (melee) | 8 | 1.5s | 50/0/0 | 10s | 1 |
| Mudfoot | 80 | 2 | 12 | 1 (melee) | 7 | 1.2s | 75/0/0 | 15s | 1 |
| Shellcracker | 100 | 3 | 10 | 5 (ranged) | 5 | 1.8s | 100/25/25 | 20s | 2 |
| Sapper | 60 | 1 | 6 | 1 (melee) | 7 | 1.5s | 75/0/50 | 18s | 1 |
| Raftsman | 70 | 1 | 8 | 1 (melee) | 6 | 1.5s | 100/0/50 | 15s | 1 |
| Mortar Otter | 50 | 0 | 20 (AoE 3) | 7 (ranged) | 4 | 3.0s | 125/50/75 | 25s | 2 |
| Diver | 48 | 1 | 10 | 1 (melee) | 7 (9 in water) | 1.3s | 75/0/75 | 15s | 1 |

**Special abilities:**
- **River Rat**: Gather (fish, timber, salvage), Build, Repair. 10 resource per trip.
- **Sapper**: Breach Charge (80 damage to buildings, 30s cooldown), Lay Mine, Repair.
- **Raftsman**: Build Raft (seats 4), Board Barge (5s channel).
- **Mortar Otter**: AoE splash (3-tile radius). Cannot attack within range 3 (min range).
- **Diver**: Invisible while submerged. Board Barge (3s channel). Fragile on land.

### 2.2 Scale-Guard (Enemy) Units

| Unit | HP | Armor | Damage | Range | Speed | Attack Speed | Notes |
|------|-----|-------|--------|-------|-------|-------------|-------|
| Skink | 35 | 0 | 6 | 1 (melee) | 9 | 1.0s | Scout, fast, fragile |
| Gator | 120 | 4 | 18 | 1 (melee) | 5 | 1.5s | Main infantry, tanky |
| Viper | 60 | 1 | 14 | 6 (ranged) | 4 | 2.0s | Ranged, fragile |
| Snapper | 200 | 6 | 14 | 6 (ranged) | 3 | 2.5s | Heavy turret, slow |
| Croc Champion | 300 | 6 | 25 | 2 (melee) | 5 | 2.0s | Elite melee, boss-tier |
| Siphon Drone | 80 | 2 | 0 | 0 | 0 | N/A | Objective target, non-combat |
| Serpent King | 500 | 8 | 30 | 3 (melee) | 4 | 2.5s | Mini-boss |
| Kommandant Ironjaw | 5000 | 10 | 40 | 3 (melee) | 4 | 2.0s | Final boss, 3 phases |

### 2.3 Hero Units

| Hero | HP | Armor | Damage | Range | Speed | Special |
|------|-----|-------|--------|-------|-------|---------|
| Cpl. Splash | 120 | 3 | 14 | 1 (melee) | 8 (11 in water) | Sonar Reveal (12-tile radius), invisible submerged, +50% swim speed |
| Sgt. Fang | 150 | 4 | 18 | 1 (melee) | 6 | Breach Charge (80 dmg to buildings, 35s CD), +50% damage vs buildings |
| Col. Bubbles | 100 | 2 | 10 | 5 (ranged) | 5 | Rally Cry (+20% damage to nearby allies for 10s, 45s CD) |

### 2.4 Buildings

| Building | HP | Cost (F/T/S) | Build Time | Pop Cap | Prereq |
|----------|-----|-------------|-----------|---------|--------|
| Lodge | 600 | Pre-placed | N/A | 4 | None |
| Burrow | 150 | 0/80/0 | 12s | +6 | Lodge |
| Command Post | 400 | 200/100/0 | 25s | 0 | Lodge |
| Barracks | 300 | 150/75/0 | 20s | 0 | Command Post |
| Fish Trap | 200 | 0/100/0 | 15s | 0 | Command Post |
| Watchtower | 250 | 100/75/25 | 18s | 0 | Command Post |
| Sandbag Wall | 150 | 0/50/0 | 8s | 0 | Command Post |
| Stone Wall | 400 | 0/100/50 | 12s | 0 | Armory |
| Armory | 350 | 200/100/75 | 30s | 0 | Command Post |
| Gun Tower | 300 | 150/100/75 | 22s | 0 | Armory |
| Field Hospital | 350 | 250/100/0 | 25s | 0 | Command Post |
| Dock | 300 | 200/150/50 | 25s | 0 | Command Post |
| Minefield | 100 | 0/0/50 | 10s | 0 | Armory |
| Shield Generator | 500 | 0/300/150 | 35s | 0 | Armory |

**Building abilities:**
- **Fish Trap**: +3 fish per 10 seconds (passive income).
- **Watchtower**: 8-tile vision radius, 8 damage at range 6, attacks automatically.
- **Gun Tower**: 16 damage at range 7, attacks automatically. Outranges Watchtower.
- **Field Hospital**: Heals nearby friendly units 1 HP/second within 6-tile radius.
- **Minefield**: Deals 40 damage to first enemy unit that enters the tile. Single use.
- **Shield Generator**: Reduces incoming ranged damage by 30% for all friendly units
  within 8-tile radius.

### 2.5 Research Tree

| Research | Cost (F/T/S) | Time | Effect | Building |
|----------|-------------|------|--------|----------|
| Hardshell Armor | 150/0/75 | 30s | All melee units +15 HP, +1 armor | Armory |
| Fish Oil Arrows | 150/50/50 | 30s | Shellcracker/Viper damage +2 | Armory |
| Demolition Training | 100/0/100 | 25s | Sapper Breach Charge damage +45 (80->125) | Armory |
| Fortified Walls | 0/200/100 | 35s | Sandbag Wall HP 150->250, Stone Wall HP 400->600 | Armory |
| Precision Bombardment | 150/75/100 | 35s | Mortar Otter scatter radius -30% | Armory (M11+) |
| Advanced Fishing | 100/50/0 | 20s | Fish Trap income +2 fish/10s (3->5) | Command Post |
| Rapid Construction | 0/150/50 | 25s | All building build time -25% | Command Post |
| Field Triage | 200/0/50 | 30s | Field Hospital heal rate +50% (1->1.5 HP/s) | Field Hospital |

---

## Part 3: Economy Model

### 3.1 Resource Gathering Rates

| Activity | Rate | Workers | Net Income |
|----------|------|---------|-----------|
| 1 River Rat on fish spot | 10 fish per trip, 8s round trip | 1 | ~75 fish/min |
| 1 River Rat on timber | 10 timber per trip, 10s round trip | 1 | ~60 timber/min |
| 1 River Rat on salvage | 10 salvage per trip, 12s round trip | 1 | ~50 salvage/min |
| Fish Trap (passive) | 3 fish per 10s (5 with Advanced Fishing) | 0 | 18 fish/min (30 with research) |
| Liberated village (M10+) | 1 fish per 10s | 0 | 6 fish/min |

**Saturation points per resource node:**
- Fish spot: 2-3 workers (beyond 3, idle-queuing begins due to small interaction area)
- Timber grove (8 trees): 3-4 workers (workers auto-select nearest un-occupied tree)
- Salvage cache: 1-2 workers (caches are small, deplete fast — 3 trips to empty one cache)

### 3.2 Standard Economy Timeline (Tactical Difficulty)

Assuming Mission 1 (Beachhead) starting conditions: 4 River Rats, 100 fish, 50 timber.

```
TIME    ACTION                          FISH    TIMBER  SALVAGE  NOTES
0:00    Start. Assign 3 RR to timber,   100     50      0        4th RR scouts east
        1 RR to scout.
0:10    First timber trip returns.       100     60      0        +10 timber
0:20    Second timber trip returns.      100     70      0
0:30    Third trip, scout finds fish.    100     80      0
0:40    Reassign scout to fish.          100     90      0
0:50    Fish trip #1 returns. Timber     110     100     0
        continues flowing.
1:00    Timber trip #4.                  110     110     0
1:10    Fish #2.                         120     120     0
1:20    Timber #5.                       120     130     0
1:30    Fish #3. Timber #6.              130     140     0
1:40    Timber continues.                130     150     0        Phase 1 obj. complete
2:00    Continue gathering.              150     170     0
2:30    Can afford Command Post          150     170     0        CP costs 200F/100T
        (200F/100T). Need 50 more fish.
3:00    Command Post started.            200     200     0        CP building (25s)
3:25    CP complete. Start Barracks.     0       100     0        Barracks costs 150F/75T
3:45    Barracks building (20s).         25      110     0
4:05    Barracks complete. Start         75      135     0        Mudfoot costs 75F
        Mudfoot #1.
4:20    Mudfoot #1 training (15s).       0       145     0
4:35    Mudfoot #1 ready. Start #2.      75      160     0
4:50    Mudfoot #2 training.             0       170     0
5:05    Mudfoot #2 ready. Start #3.      75      185     0
5:20    Mudfoot #3 ready.                0       195     0        3 Mudfoots trained!
```

**Summary**: From a cold start with 100F/50T, a player needs approximately **5 minutes**
to have a Command Post, a Barracks, and 3 Mudfoots. This is the "ready to fight" threshold
for Mission 1.

### 3.3 Income Scaling Across Campaign

| Mission | Starting Fish | Starting Timber | Starting Salvage | Fish Spots | Timber Nodes | Salvage Caches | Fish Traps Possible | Est. Income at 5min (fish/min) |
|---------|--------------|----------------|-----------------|-----------|-------------|---------------|--------------------|-----------------------------|
| 1 Beachhead | 100 | 50 | 0 | 3 | 8 | 3 | 1 | ~120 |
| 2 Causeway | 200 | 100 | 50 | 2 | 6 | 3 | 1 | ~130 |
| 3 Firebase Delta | 300 | 200 | 100 | 3 | 10 | 3 | 2 | ~180 |
| 4 Prison Break | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (commando) |
| 5 Siphon Valley | 150 | 100 | 50 | 3 | 8 | 6 | 2 | ~160 |
| 6 Monsoon Ambush | 200 | 150 | 75 | 3 | 8 | 2 | 2 | ~170 |
| 7 River Rats | 150 | 100 | 50 | 5 | 9 | 3 | 2 | ~180 |
| 8 Underwater Cache | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 (commando) |
| 9 Dense Canopy | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (commando) |
| 10 Scorched Earth | 300 | 250 | 150 | 3 | 8 | 4 | 2 | ~200 |
| 11 Entrenchment | 350 | 250 | 150 | 3 | 8 | 4 | 2 | ~200 |
| 12 Fang Rescue | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (commando) |
| 13 Great Siphon | 400 | 300 | 200 | 4 | 10 | 6 | 3 | ~250 |
| 14 Iron Delta | 500 | 300 | 250 | 4 | 8 | 6 | 3 | ~260 |
| 15 Serpent's Lair | 500 | 400 | 300 | 3 | 8 | 4 | 2 | ~220 |
| 16 The Reckoning | 600 | 500 | 400 | 5 | 12 | 8 | 4 | ~350 |

### 3.4 Key Economic Tension Points

**Timber scarcity** is the primary expansion driver. Trees near the lodge deplete in
3-4 minutes of active harvesting (8 trees x 3 trips per tree x 10 timber per trip =
240 timber). After that, workers must travel further, reducing effective income by 20-40%.
This forces the player to push outward or build Fish Traps (which cost timber).

**Salvage hunger** is the upgrade driver. Salvage only comes from three sources:
wreckage caches (finite, small), combat loot drops (see PRNG tables), and bonus objectives.
Advanced units (Shellcracker, Mortar Otter) require salvage. Research requires salvage.
This means the player must fight to progress. Turtling leads to salvage starvation.

**Pop cap ceiling** forces hard choices. The Lodge provides 4 pop. Each Burrow adds 6
pop for 80 timber. A typical army of 12-15 units needs 2-3 Burrows = 160-240 timber
that cannot go to other buildings.

**Fish Trap ROI**: Costs 100 timber. Produces 18 fish/min (30 with Advanced Fishing).
At 18 fish/min, the trap pays for itself in equivalent worker labor (1 worker produces
~75 fish/min, but you save the pop slot) within 4-5 minutes. Building 2 Fish Traps
early is almost always correct.

---

## Part 4: Combat Simulation Tables

### 4.1 1v1 Matchup Results

All values assume no upgrades, no terrain modifier, both units at full HP, no micro.

| Attacker | Defender | Winner | Winner HP | TTK (seconds) | Notes |
|----------|----------|--------|-----------|--------------|-------|
| Mudfoot | Mudfoot | Coin flip | ~10 HP | 8.0 | Even matchup |
| Mudfoot | Gator | Gator | ~50 HP | 8.0 (Mudfoot dies) | Gator's 18 dmg vs 2 armor = 16 effective. 80/16 = 5 hits. 5 x 1.5s = 7.5s |
| Mudfoot | Viper | Mudfoot | ~30 HP | 5.4 | Mudfoot closes and kills fast (Viper 60 HP / 10 effective dmg = 6 hits = 7.2s) |
| Mudfoot | Skink | Mudfoot | ~65 HP | 3.5 | Skink dies fast |
| Shellcracker | Gator | Shellcracker | ~40 HP | 14.4 | Shellcracker kites. Gator speed 5 vs Shell speed 5 means Gator can close, but Shell gets 2 shots before contact |
| Shellcracker | Viper | Even | ~20 HP | 12.0 | Range vs range, Viper fires faster but Shell has more HP |
| Gator | Gator | Coin flip | ~15 HP | 11.3 | Tanky mirror match |
| Mortar Otter | Gator | Gator (if closes) | ~10 HP | 7.5 | Mortar needs escort. If Gator starts outside range 7, Mortar gets 2 shots before Gator closes (20 x 2 = 40 of 120 HP, then Gator murders Mortar) |
| Sapper | Snapper (building) | Sapper | N/A | 3 charges | Breach Charge does 80 per use. Snapper has 200 HP. 3 charges. But Sapper dies fast in direct combat |

### 4.2 Group Engagement Results

| Player Force | Enemy Force | Expected Result (Tactical) | Player Survivors |
|-------------|------------|---------------------------|-----------------|
| 3 Mudfoot | 2 Gator | Player wins | 1-2 Mudfoots at ~30-50% HP |
| 3 Mudfoot | 3 Gator | Enemy wins | 0-1 Mudfoot barely alive |
| 4 Mudfoot | 3 Gator | Player wins | 2-3 Mudfoots at ~40% HP |
| 6 Mudfoot | 4 Gator + 2 Skink | Player wins | 3-4 Mudfoots remaining |
| 2 Shellcracker + 2 Mudfoot | 3 Gator | Player wins | All alive, Mudfoots ~60% HP |
| 1 Mortar + 4 Mudfoot | 5 Gator (clustered) | Player wins | 3-4 Mudfoots. Mortar splash is decisive |
| 3 Mudfoot | 2 Viper | Mudfoot wins | 2 Mudfoots at ~50% HP (after closing range) |
| 2 Shellcracker | 2 Viper | Even | 1 surviving unit at low HP |
| 6 Mudfoot | 1 Croc Champion | Mudfoot wins | 4-5 Mudfoots (Champion's 25 dmg + 6 armor is fearsome but numbers prevail) |
| 8 mixed (4MF+2SC+1MO+1SA) | 6G+2V+1CC | Player wins | 5-6 units. Mortar tips it. |

### 4.3 Damage vs Armor Formula

```
effective_damage = max(1, base_damage - target_armor)
```

This is deliberately simple. Armor subtracts linearly from damage. The minimum damage
is always 1 (no unit is immune to any attack). This means:

- Gator (18 damage) vs Mudfoot (2 armor) = 16 effective damage. 80 HP / 16 = 5 hits to kill.
- Mudfoot (12 damage) vs Gator (4 armor) = 8 effective damage. 120 HP / 8 = 15 hits to kill.
- A 3:1 Mudfoot advantage is needed to beat Gators in a straight fight.

**Upgrade impact (Hardshell Armor: +15 HP, +1 armor):**
- Post-upgrade Mudfoot: 95 HP, 3 armor.
- Gator vs upgraded Mudfoot: 18 - 3 = 15 effective damage. 95 / 15 = 6.3 hits (7 hits).
- Pre-upgrade: 5 hits to kill. Post-upgrade: 7 hits to kill. That is a **40% effective HP increase**
  vs Gators specifically. Very noticeable.

---

## Part 5: Per-Mission Paper Playtest

### Mission 1: BEACHHEAD (Tutorial) — EXTREME DETAIL

#### Starting Conditions
- **Player units**: 4 River Rats
- **Player buildings**: Lodge (at x:40, y:80)
- **Starting resources**: 100 fish, 50 timber
- **Map size**: 128x96 tiles (small)
- **Available buildings**: Lodge, Burrow, Command Post, Barracks, Fish Trap, Watchtower, Sandbag Wall
- **Available units**: River Rat, Mudfoot

#### Minute-by-Minute Timeline (Tactical Difficulty)

**0:00 - Mission start.**
Player has 4 River Rats near the lodge on the southern beach. Jungle_south with
timber is northwest. Fish spots are along the mud banks (y~44, about 38 tiles away).
Salvage field is to the east.

Optimal opening: Send 3 River Rats to mangrove grove (timber), 1 River Rat to scout
east toward salvage field.

**0:15 - FOXHOUND welcome radio.**
"Captain, you're on the ground. Mangrove grove to the northwest..."
Player should already have workers moving to timber.

**0:20 - First timber trips begin.**
Mangrove grove is ~12 tiles from lodge. At speed 8, travel time is ~1.5 seconds per
tile = ~18s one way. Round trip with gathering animation: ~8-10s total for nearby trees.
First timber delivery: 50 + 10 = 60 timber.

**0:30 - Second timber returns. Scout reaches salvage field.**
60 + 10 = 70 timber. Scout discovers 3 salvage caches.

**0:45 - Col. Bubbles radio ("establish resource flow").**
100 fish, ~90 timber. Three workers continuously delivering timber.

**1:00 - Timber flowing steadily.**
100 fish, ~110 timber.

**1:30 - Timber stockpile growing.**
100 fish, ~140 timber. Almost at the 150 timber threshold for Phase 1 objective.

**1:40-2:00 - Phase 1 objective complete (150 timber gathered).**
FOXHOUND: "Resource stockpile building nicely, Captain."
Phase 2 begins. New objectives: Build Command Post, Build Barracks.

**2:00 - Start building Command Post.**
Cost: 200 fish, 100 timber. Player has ~100 fish, ~160 timber.
Problem: Not enough fish! Need 100 more fish.
Solution: Reassign 1-2 workers to nearest fish spot (mud banks, ~24 tiles south of
mangrove grove, ~14 tiles from lodge via mud_banks).

**2:00-3:00 - Gathering fish. 1 worker on fish, 2 on timber.**
Fish income: ~75 fish/min with 1 worker. Need 100 fish in ~80 seconds.
Timber continues flowing for surplus.

**3:00-3:20 - Can afford Command Post (200F/100T). Building starts.**
Build time: 25 seconds. All idle workers rally to build.

**3:25 - Command Post complete.**
Col. Bubbles: "Command Post operational. Now get that Barracks up."
Start Barracks immediately. Cost: 150 fish, 75 timber.
Current resources after CP: ~25 fish, ~80 timber. Need 125 more fish.

**3:25-4:30 - Gathering fish for Barracks.**
2 workers on fish (reassigned from timber after gathering enough). ~150 fish/min.
At ~4:30, enough fish accumulated.

**4:30 - Barracks building starts.**
Build time: 20 seconds.

**4:50 - Barracks complete.**
Col. Bubbles: "Barracks online. Train some Mudfoots."
Start training Mudfoot #1 immediately. Cost: 75 fish, 15s train time.

**5:00 - IMPORTANT: Scout patrol spawns (2 Skinks at bridge area).**
FOXHOUND: "Movement near the river."
Skinks are not aggressive yet. Player has ~30 seconds before they patrol south.

**5:05 - Mudfoot #1 ready. Train Mudfoot #2.**

**5:20 - Mudfoot #2 ready. Train Mudfoot #3.**

**5:35 - Mudfoot #3 ready! Phase 2 objectives auto-complete.**
"Both buildings done." Phase 3 begins.
Col. Bubbles: "Captain, we need to push north. The bridge crossing is our only path."

**5:35-6:30 - Build Fish Trap (100 timber), build Burrow (80 timber).**
Fish Trap starts passive income. Burrow raises pop cap from 4 to 10.
Continue training Mudfoots for insurance.

**7:00 - Player army: 3-5 Mudfoots + 4 River Rats (some gathering).**
Move Mudfoots toward bridge. Send 1 River Rat to bridge for repair.

**7:30 - River Rat enters bridge zone. Bridge repair starts (30s).**
IMMEDIATELY: Bridge defenders spawn — 4 Gators + 2 Skinks north of bridge.
FOXHOUND: "Bridge repair underway. This will draw attention."
Col. Bubbles: "Contacts north of the bridge! Defend the workers!"

**COMBAT: 3-5 Mudfoots vs 4 Gators + 2 Skinks.**
Reference group combat table: 4 Mudfoots vs 3 Gators is a close player win.
4 Gators + 2 Skinks is approximately equal to 5 Gators in combat power.
Player needs 5-6 Mudfoots to win this fight with acceptable casualties.
If player only has 3 Mudfoots, this is very tight. May lose 2-3 units.
Bridge repair continues during combat (worker is at the bridge, not fighting).

Expected outcome with 4 Mudfoots: Player wins, 1-2 Mudfoots survive at low HP.
Expected outcome with 5 Mudfoots: Player wins, 3 Mudfoots survive.

**8:00 - Bridge repaired. Cross river.**
Move surviving Mudfoots north. Phase 3 objective "Cross the river" completes when
any URA unit enters jungle_north.

**8:30 - Phase 4 begins: Clear the Outpost.**
Enemy outpost: 6 Gators + 1 Skink + 1 Viper + 1 Flag Post.

Player should have been training replacements. At this point, reasonable army:
3-4 Mudfoots (survivors + new trainees) + fresh Mudfoot from barracks.

**8:30-10:00 - Build up reinforcements while scouting outpost.**
Train 2-3 more Mudfoots. Gather more resources. Push timing depends on army size.

**10:00-12:00 - Assault outpost with 5-7 Mudfoots.**
6 Gators + 1 Skink + 1 Viper. Player needs 6+ Mudfoots for comfortable victory.
Focus fire the Viper first (ranged threat). Mudfoots close on Gators.

Expected outcome with 6 Mudfoots: Win with 2-4 survivors.
Destroy Flag Post (building, ~200 HP, takes ~30 seconds of Mudfoot attacks).

**12:00-13:00 - Mission complete.**
Gen. Whiskers: "Outstanding work, Captain. Beachhead is secured."

#### Summary
- **Optimal completion time**: ~12-13 minutes
- **Par time (gold star)**: 15 minutes
- **Average player completion**: ~14-16 minutes (50% efficiency)
- **Total Mudfoots trained**: 6-8
- **Total River Rats lost**: 0 (should not be in combat)
- **Total Mudfoots lost**: 3-5 (acceptable attrition)

#### Difficulty Scaling

| Parameter | Support | Tactical | Elite |
|-----------|---------|----------|-------|
| Starting resources | 150F/75T | 100F/50T | 75F/25T |
| Scout patrol at 5:00 | 1 Skink | 2 Skinks | 3 Skinks |
| Bridge defenders | 3 Gators | 4 Gators + 2 Skinks | 6 Gators + 2 Skinks |
| Outpost garrison | 4 enemies | 8 enemies | 8 enemies + 1 Croc Champion |
| Outpost reinforcement wave | None | None | 4 Gators at 13:00 |
| Fish Trap passive income | +4 fish/10s | +3 fish/10s | +2 fish/10s |

#### PRNG Requirements for Mission 1
- **Salvage cache contents**: Each cache yields 15-25 salvage (uniform random).
- **Timber per tree**: Each mangrove tree yields 30-40 timber before depletion (3-4 trips).
- **Enemy patrol route variance**: Skink patrol at 5:00 follows one of 3 preset routes
  (deterministic per seed, not truly random during gameplay).

---

### Mission 2: THE CAUSEWAY (Escort)

#### Starting Conditions
- 6 Mudfoots, 2 River Rats, Barracks + Command Post (pre-built), 3 convoy trucks
- 200 fish, 100 timber, 50 salvage
- 128x128 map (medium)

#### Economy Math
- 2 River Rats stay at depot gathering. At full efficiency: ~150 fish/min, ~120 timber/min.
- Player can train 4-5 additional Mudfoots before departure (~5 min gathering + training).
- Fish Trap should be built immediately (100 timber) for passive income during escort.
- Salvage from supply_cache bonus: 100 salvage (if discovered).

#### Combat Timeline
- **Phase 1 (0:00-4:00)**: Prep time. Train 2-3 extra Mudfoots. Total escort force: 8-9 Mudfoots.
- **Phase 2 (4:00-9:00)**: Ambush 1 — 4 Gators + 2 Skinks. Manageable with 8 Mudfoots. Lose 1-2.
- **Phase 3 (9:00-15:00)**: Ambush 2 — 5 Gators + 2 Skinks + barricade. Harder. Need to destroy barricade (destructible, ~200 HP). Lose 2-3 Mudfoots.
- **Phase 4 (15:00+)**: Ambush 3 — 4 Gators + 2 Vipers + 2 Skinks + mortar pit. Mortar forces priority target. Reinforcements at +45s (4 Gators + 2 Skinks). Hardest fight. Lose 2-4 Mudfoots.

#### Convoy Survival Math
- Convoy truck HP: 400. Gator damage: 18. Effective damage vs truck (0 armor): 18.
- 400 / 18 = 22 hits to destroy. At 1.5s attack speed = 33 seconds of focused fire from 1 Gator.
- 4 Gators focusing a truck: 33 / 4 = ~8 seconds to destroy.
- **Implication**: Player has approximately 8-10 seconds to respond when enemies engage a truck. This is tight but fair — teaches urgency.

#### Expected Duration: 18-22 minutes (par: 20 minutes)

#### Difficulty Scaling

| Parameter | Support | Tactical | Elite |
|-----------|---------|----------|-------|
| Ambush 1 | 2G+1SK | 4G+2SK | 6G+3SK |
| Ambush 2 | 3G+1SK | 5G+2SK+barricade | 7G+3SK+barricade |
| Ambush 3 | 3G+1V+1SK | 4G+2V+2SK+mortar | 6G+3V+3SK+mortar+splash |
| Reinforcement wave | None | 4G+2SK at 45s | 4G+2SK at 45s + 3G+1V at 90s |
| Convoy truck HP | 500 | 400 | 350 |
| Convoy speed | 70% unit speed | 60% unit speed | 50% unit speed |

---

### Mission 3: FIREBASE DELTA (Capture & Hold)

#### Starting Conditions
- 6 Mudfoots, 2 Shellcrackers, 3 River Rats, Barracks + CP (pre-built)
- 300 fish, 200 timber, 100 salvage
- 128x128 map

#### Economy Math
- Rich start. Can immediately build Armory (200F/100T/75S) for Shell + research.
- 3 River Rats on resources: ~180 fish/min, ~150 timber/min.
- After 3 minutes: can field 8-10 combat units total.

#### Combat Timeline
- **Phase 1 (0:00-5:00)**: Build up, research Hardshell Armor. Push toward Hilltop Charlie.
- **Hilltop Charlie assault**: 3 Gators + 1 Skink + 1 Watchtower. Player army of 8 beats this.
- **Hilltop Bravo assault**: 4 Gators + 2 Vipers + gun emplacement. Harder. Shellcrackers counter Vipers. Mortar Otter (first available this mission) wrecks emplacements.
- **Hilltop Alpha assault**: 6 Gators + 2 Vipers + 2 Skinks + radio tower. Full strength needed.
- **Hold phase**: After all 3 captured, hold 3 minutes against counterattack waves.

#### Expected Duration: 20-25 minutes (par: 25 minutes)

---

### Mission 4: PRISON BREAK (Stealth Commando)

#### Starting Conditions
- 3 Mudfoots (named), 1 Shellcracker (named). No lodge, no resources.
- 128x96 map
- Stealth-kill mechanic: instant kill from behind, 5s cooldown.

#### Combat Math (Stealth Path)
- Observation post: 2 Skinks. 2 stealth kills. Zero combat noise.
- Optimal route: East jungle -> drainage canal -> compound interior (bypasses front gate).
- Compound garrison: ~15 enemies if no alarm. Stealth route requires 6-8 stealth kills.
- Prison block: 2-3 guards. Stealth kill or quick combat.
- Extraction: Gen. Whiskers (200 HP, slow) must survive. Alarm guaranteed within 60s.
- Full alarm: 3 waves of 24+ enemies. Must reach exfil before wave 3.

#### Stealth Kill Timing Math
- Stealth kill requires: within 1 tile, behind target (rear 180-degree arc), 5s cooldown.
- At speed 7, a Mudfoot closes 1 tile in ~0.14 seconds. The limiting factor is the
  5-second cooldown between kills, not movement.
- A patrol of 2 Gators walking in formation: player kills rear Gator. Front Gator
  continues walking for ~2 seconds before noticing (detection radius 5-8 tiles behind).
  Player has 5s cooldown. Can the player close on the front Gator in 5s?
  If Gators are 2 tiles apart and player is behind rear Gator, distance to front Gator
  is ~3 tiles. At speed 7: 3/7 = ~0.4 seconds to close. But 5s cooldown means player
  must wait ~4.6 seconds while the front Gator walks away. Sprint to close.
  This is TIGHT. Player may need to split commandos: one kills rear, another
  simultaneously kills front. Rewards coordination.

#### Brute Force Path (Alarm Triggered)
- If player triggers alarm immediately: compound sends 15 garrison + 24 reinforcements
  (3 waves of 8) = 39 enemies total. 4 player units vs 39 enemies = impossible.
- If player fights to prison and triggers alarm at rescue: ~8 enemies killed in combat,
  ~7 garrison remaining + 24 reinforcements. 4 player units (damaged) + Gen. Whiskers
  (200 HP, 8 damage, slow) vs ~31 enemies. Still extremely difficult.
- **Verdict**: Stealth is not optional on Tactical or Elite. Player can fight ~4-6 guards
  in open combat with 4 units, but alarm reinforcements will overwhelm.

#### Difficulty Scaling (Mission 4)

| Parameter | Support | Tactical | Elite |
|-----------|---------|----------|-------|
| Detection radii | -30% all | Baseline | +20% all |
| Compound garrison | ~10 enemies | ~15 enemies | ~18 enemies |
| Alarm reinforcements | 12 total (2 waves) | 24 total (3 waves) | 34 total (3 waves + faster) |
| Cell discovery timer | 90 seconds | 60 seconds | 45 seconds |
| Searchlight sweep speed | Slow | Medium | Fast |
| Medkits on map | 4 | 3 | 2 |
| Stealth kill cooldown | 4 seconds | 5 seconds | 6 seconds |

#### Expected Duration: 12-18 minutes (par: 18 minutes)

---

### Mission 5: SIPHON VALLEY (Multi-Objective Assault)

#### Starting Conditions
- 4 River Rats, 2 Mudfoots, 1 Mortar Otter
- 150 fish, 100 timber, 50 salvage
- 160x128 map (large)

#### Economy Math
- Need to build Barracks + train army before first assault.
- Build order: Barracks (150F/75T) -> 3 Mudfoots (225F) -> push Alpha.
- Alpha is winnable with starting force (2 Mudfoots + 1 Mortar) if micro is good.
- After Alpha: build more units. Bravo requires 5-6 Mudfoots + Mortar.
- Charlie requires full army: 8+ Mudfoots, 2 Shellcrackers, 2 Mortars.

#### Combat Timeline
- **Phase 1-2 (0:00-10:00)**: Build base, take Siphon Alpha (light defense).
- **Phase 3 (10:00-16:00)**: Reinforce, navigate toxic terrain, take Siphon Bravo.
  Toxic sludge deals 2 HP/s. A Mudfoot (80 HP) has 40 seconds in sludge before death.
  Raftsmen are immune to toxic water damage — key tactical advantage.
- **Phase 4 (16:00+)**: Full assault on Siphon Charlie (walled compound).
  Croc Champion (300 HP, 6 armor, 25 damage) requires focused fire from 4+ units.
  Watchtowers (8 damage, range 6) must be outranged by Mortar Otters (range 7).

#### Toxic Terrain Exposure Math
- Toxic sludge: 2 HP/s. Mudfoot (80 HP) has 40 seconds. Shellcracker (100 HP) has 50s.
- Toxic water (river): 3 HP/s. Mudfoot dies in 26.7 seconds. Cannot linger.
- Ford crossings: Reduce toxic exposure. Crossing a ford is ~6 tiles at speed 0.6 x 7 =
  4.2 tiles/s = ~1.4 seconds. At 3 HP/s, ford crossing costs ~4 HP. Manageable.
- Without ford (swimming toxic river): ~16 tiles at speed 0.0 = impossible for non-water
  units. Raftsmen or Divers must be used.

#### Difficulty Scaling (Mission 5)

| Parameter | Support | Tactical | Elite |
|-----------|---------|----------|-------|
| Siphon Alpha garrison | 1G | 2G+1SK+1Drone | 2G+1V+1SK+1Drone |
| Siphon Bravo garrison | 2G+1Drone | 4G+2Drone+1V+Spire | 6G+2Drone+1V+1CC+Spire |
| Siphon Charlie garrison | 4G+1WT | 6G+2V+2Drone+2WT+1CC+walls | 10G+3V+2Drone+2WT+2CC+walls |
| Toxic sludge damage | 1 HP/s | 2 HP/s | 3 HP/s |
| Reinforcements after Bravo | None | 4G+2SK+1V | 8G+4SK+2V |
| Phase 4 reinforcement at 90s | None | 3G+1V | 6G+2V+1CC |

#### Expected Duration: 18-22 minutes (par: 20 minutes)

---

### Mission 6: MONSOON AMBUSH (8-Wave Defense)

#### Starting Conditions
- 5 River Rats, 3 Mudfoots, Watchtower + sandbag walls (pre-built)
- 200 fish, 150 timber, 75 salvage
- 128x128 map

#### Build Phase Math (0:00-3:00)
- 3 minutes to fortify. Must be aggressive with building.
- Priority: Barracks (150F/75T) -> 2 Sandbag Walls (100T) -> Fish Trap (100T).
- At 3:00, player should have: Barracks, 2-3 extra walls, 1 Fish Trap, 1-2 trained Mudfoots.
- Total combat force at wave 1: 3 starting + 1-2 trained = 4-5 Mudfoots + 1 Watchtower.

#### Wave-by-Wave Combat Math

| Wave | Time | Enemies | Player Army (est.) | Expected Losses | Difficulty |
|------|------|---------|-------------------|----------------|-----------|
| 1 | 3:00 | 4 Skinks (N) | 4-5 MF + tower | 0-1 | Easy |
| 2 | 4:30 | 6G (E) + 6G (W) | 5-6 MF + tower | 1-2 | Medium (split) |
| 3 | 6:00 | 4G + 2V (S) | 5-7 MF + tower | 1-2 | Medium |
| 4 | 8:30 | 8G (N) + 8G (E) | 6-8 MF + SC | 2-3 | Hard (16 total) |
| 5 | 10:30 | 4 Snapper + 2G (S) | 6-8 MF + SC | 2-3 | Hard (Snappers) |
| 6 | 12:30 | 3G+2SK(N) + 3G+1V(E) + 3G+2SK(S) + 3G+1V(W) | 8-10 mixed | 3-4 | Very Hard (all dirs) |
| 7 | ~14:00 | 12G+4V+2CC (N) | 8-12 mixed | 3-5 | Brutal |
| 8 | ~15:00 | 6G+2V+SK(N) + 3G+1Snap(E) + 3G+2V+1CC(S) + 3G+1Snap(W) | 8-14 mixed | 4-6 | Extreme |

**Key insight**: The player MUST be training continuously between waves. Losing 2-3 units
per wave means 16-24 replacements needed across 8 waves. At 15 seconds per Mudfoot and
75 fish each, that is 1200-1800 fish just for replacement troops. Fish Traps and
continuous gathering are essential.

#### Defensive Structure Value Math
- **Watchtower**: 8 damage at range 6, ~2s attack speed = 4 DPS. Over a 30-second
  wave engagement, a tower deals ~120 damage = 1 Gator killed. At 100F/75T/25S cost,
  each tower effectively "buys" 1 free Gator kill per wave.
- **Sandbag Wall**: 150 HP. A Gator does 18-0=18 damage to walls. 150/18 = 8 hits =
  12 seconds of delay per Gator. Four Gators chew through a wall in 3 seconds.
  Walls buy time, not prevent breakthroughs.
- **Field Hospital**: 1 HP/s heal in 6-tile radius. Over 90 seconds between waves,
  heals 90 HP per unit. A damaged Mudfoot (40 HP remaining) is back to 80 HP by next wave.
  This is the equivalent of getting a free Mudfoot replacement every 80 seconds.
  At 250F/100T cost, the hospital pays for itself in 3 waves.

#### Difficulty Scaling (Mission 6)

| Parameter | Support | Tactical | Elite |
|-----------|---------|----------|-------|
| Total waves | 3 (Waves 1-3 only) | 8 | 8 (+50% enemies per wave) |
| Build window | 4 minutes | 3 minutes | 2.5 minutes |
| Wave 8 composition | N/A | Multi-dir + Serpent King | Multi-dir + 2 Serpent Kings |
| Croc Champions appear | Never | Wave 7+ | Wave 5+ |
| Starting Watchtowers | 2 | 1 | 0 |
| Starting Sandbag Walls | 6 | 4 | 2 |
| Weather visibility | 60% | 50%/40%/35% | 40%/30%/25% |
| Movement speed penalty | -10% | -20%/-25% | -25%/-30% |

#### Expected Duration: 16-20 minutes (par: 20 minutes)

---

### Mission 7: RIVER RATS (Barge Interception)

#### Starting Conditions
- 3 River Rats, 3 Raftsmen, 2 Divers, 2 Mudfoots, pre-built Dock
- 150 fish, 100 timber, 50 salvage

#### Interception Math
- 7 barges, need 5. Can miss 2.
- Barge 1 (1:00): South Bend, slow (45s crossing). Easy — Diver can reach in time.
- Barge 2 (3:00): Main Channel, medium (30s). Need pre-positioned unit.
- Barge 3 (5:00): North Fork, medium + escort. Requires combat before boarding.
- Barge 4 (9:00): Main Channel, fast (20s). Very tight timing.
- Barge 5 (11:00): South Bend, medium + escort.
- Barges 6-7: Backup opportunities with heavy escorts.

**Critical timing**: Fast barges cross in 20 seconds. Boarding takes 5s (Diver: 3s).
A Diver must be within ~5 tiles of the barge's path to intercept a fast barge.
Pre-positioning is essential.

#### Expected Duration: 14-18 minutes (par: 18 minutes)

---

### Mission 8: THE UNDERWATER CACHE (Commando — Water Specialist)

#### Starting Conditions
- 3 Mudfoots, 3 Divers, 1 Raftsman. No lodge. 7 units total.

#### Critical Path
1. Approach via marshland (fewer enemies). ~2 minutes.
2. Clear ruin entrance or ruin east. ~3 minutes.
3. Navigate flooded corridor. ~2 minutes.
4. Detention block (Divers only). 3 Gators vs 3 Divers. Diver stealth first-strike
   advantage: each Diver gets 1 free attack (10 damage each = 30 total on one Gator,
   killing it with 2nd hit). 3v3 becomes 3v2. Divers win with ~1-2 survivors at low HP.
5. Rescue Splash. Hero joins (full HP).
6. Navigate to cache vault (Splash required). ~2 minutes.
7. Recover cache. Reinforcements spawn.
8. Extraction: fight rearguard while Splash (slowed 30%) retreats south. ~3-4 minutes.

#### Expected Duration: 12-16 minutes (par: 16 minutes)

---

### Mission 9: DENSE CANOPY (Fog Recon — Commando)

#### Starting Conditions
- 4 Mudfoots, 3 Divers, 2 Shellcrackers. No lodge. No resources.

#### Intel Marker Path (Optimal)
1. Split force: Divers scout ahead (6-tile vision vs 3-tile for others), Mudfoots follow.
2. Intel-SE (closest): 2 guards. Quick kill. ~3 minutes.
3. Intel-Center: 3 guards. Moderate fight. ~5 minutes cumulative.
4. Intel-NW: 2 guards. Long trek through deep marsh. ~8 minutes cumulative.
5. Intel-NE: 3G+1V guards. Hardest. ~10 minutes cumulative.
6. Fog lifts at 7:00 — if player has not found all 4, counterattack spawns.

**Key tension**: Fog timer at 7:00. Player must move fast with Divers but not overextend.

#### Fog Vision Math
- Standard units in fog: 3-tile vision. At speed 7, a Mudfoot covers ~7 tiles/second.
  In 3 minutes, a Mudfoot can traverse ~1260 tiles of path — enough to reach any corner
  of the 128x128 map. But at 3-tile vision, the player sees barely anything.
- Divers in fog: 6-tile vision. Double the standard. This means a Diver-led column can
  detect enemy patrols at ~6 tiles, giving 0.86 seconds of reaction time at patrol
  speed 5. Just enough to halt and avoid contact if alert.
- Enemy patrols in fog: 2-tile vision. They cannot see the player at more than 2 tiles.
  Contact range is effectively 5 tiles (3 player vision + 2 enemy vision minus overlap).
  With Divers: contact range is 8 tiles (6+2). This asymmetry is the Diver's advantage.

#### Difficulty Scaling

| Parameter | Support | Tactical | Elite |
|-----------|---------|----------|-------|
| Fog vision (standard) | 4 tiles | 3 tiles | 2 tiles |
| Fog vision (Divers) | 7 tiles | 6 tiles | 5 tiles |
| Intel marker guards | 1-2 per marker | 2-4 per marker | 3-5 per marker (+1 Viper each) |
| Fog lift time | 8:00 | 7:00 | 5:30 |
| Patrol route length | -20% (tighter loops) | Baseline | +20% (wider, more dangerous) |
| Counterattack after fog lift | 4G+2SK | 6G+3V+2SK | 8G+4V+2CC |

#### Expected Duration: 10-14 minutes (par: 12 minutes)

---

### Mission 10: SCORCHED EARTH (Fuel Depot Destruction)

#### Starting Conditions
- Pre-built base (CP, Barracks, Armory, Burrow)
- 300 fish, 250 timber, 150 salvage
- Combat units depend on what player trains

#### Fuel Tank Destruction Math
- 4 fuel tanks, each 300 HP.
- Sapper Breach Charge: 80 damage (125 with Demolition Training). 4 charges to kill unupgraded, 3 upgraded.
- Shellcracker: 10 damage at range 5. 30 shots = 54 seconds of sustained fire.
- Mortar Otter: 20 damage. 15 shots = 45 seconds.
- **Optimal**: Sapper + Mortar combo. 2 Breach Charges (160 damage) + 7 Mortar shots (140 damage) = tank destroyed in ~25s.

#### Fire Cascade Math
- Each explosion creates 8-tile fire radius lasting 90 seconds (5 HP/s to units inside).
- Oil channels can propagate fire. Destruction order matters.
- **Recommended**: SW -> NE -> NW -> SE (avoids blocking paths with fire).

#### Expected Duration: 12-16 minutes (par: 15 minutes)

---

### Mission 11: ENTRENCHMENT (Tidal Siege)

#### Starting Conditions
- Pre-built base (CP, Barracks, Armory, Burrow)
- 350 fish, 250 timber, 150 salvage

#### Tidal Cycle Windows
- Low tide (bridges exposed): 0:00-3:00, 6:00-9:00, 12:00-15:00
- High tide (bridges submerged): 3:00-6:00, 9:00-12:00
- Any unit on a tidal bridge during high tide: instant death (999 damage).

#### Siege Math
- Fortress Command Post: 500 HP.
- Mortar Otter: 20 damage. 25 shots to destroy. At 3.0s per shot = 75 seconds continuous fire.
- Sapper: 80 damage per charge, 30s cooldown. 7 charges total = 210 seconds (3.5 minutes).
- **Optimal**: 2 Mortar Otters + 1 Sapper = 40 + 80 = 120 per barrage cycle (every 30s). 5 cycles = 600 damage (overkill). Total time: ~150 seconds of siege.
- But: Must fight through 18 garrison units + 3 Venom Spires first.

#### Expected Duration: 14-20 minutes (par: 18 minutes)

---

### Mission 12: THE STRONGHOLD / Fang Rescue (Full Assault Commando)

#### Starting Conditions
- 20 units: 1 hero (Col. Bubbles), 8 MF, 4 SC, 3 SA, 2 MO, 2 Divers. No base.

#### Layer-by-Layer Assault
1. **Outer compound** (~10 defenders + 2 Spires): Sappers breach gate. Mortar Otters suppress Spires (outrange 7 > 6). 2 Sapper charges on gate. ~5 minutes.
2. **Inner courtyard** (~12 defenders + 2 Spires + Vipers + Snappers): Hardest pre-rescue fight. Mortar suppression from behind gate. Push with Shellcrackers as shields. ~5 minutes.
3. **Detention block** (~6 defenders + 1 Spire): Breach with last Sapper charge. Free Sgt. Fang. ~3 minutes.
4. **Extraction**: Lockdown reinforcements — 30 enemies over 60 seconds. Fight rearguard back to LZ. Both heroes must survive and reach LZ. ~5 minutes.

#### Expected Duration: 12-16 minutes (par: 14 minutes)

---

### Mission 13: THE GREAT SIPHON (Multi-Layer Siege)

#### Starting Conditions
- Full base, 400F/300T/200S
- Large map (160x128), 3 bunker lines + siphon core

#### Siege Timeline
1. **Bunker Line 1** (sandbags + Gators): Clear with combined arms. ~3 minutes.
2. **No-man's land**: Open ground. Expect casualties from crossfire. ~2 minutes.
3. **Bunker Line 2** (bunkers + Watchtowers): Mortar Otters suppress towers. ~3 minutes.
4. **Kill zone + trenches**: Fortified positions. Flank through trenches if possible. ~3 minutes.
5. **Siphon Core** (3 sections: West 2000 HP, Center 3000 HP, East 2000 HP): Sustained siege. Sappers + Mortars. ~5 minutes.

Total enemy count: ~70. Reinforcements every 60-90 seconds.

#### Expected Duration: 18-25 minutes (par: 12 minutes aggressive / 25 minutes cautious)

---

### Mission 14: IRON DELTA (Amphibious Multi-Island)

#### Starting Conditions
- 500F/300T/250S. Largest starting economy yet.
- Full base with all buildings available.
- 160x160 map (largest)

#### Island Assault Order
1. **Fishbone Island** (10 enemies): Easiest. Training mission for amphibious ops. 2 Raftsman loads + Divers.
2. **Mire Rock** (14 enemies + bunker): Medium. Establish forward dock for shorter crossings.
3. **Ironhull Atoll** (22 enemies + buildings): Full amphibious assault. Multiple Raftsman loads. Naval support from Divers.

Water patrol timing: 20-second cycles. Player times crossings between sweeps.

#### Amphibious Math
- Raftsman carries 4 units. Building a raft takes 10s. Crossing a deep channel (~16 tiles
  at speed 6) takes ~27 seconds. Round trip: ~64 seconds per raft load.
- To assault Fishbone (need ~8 combat units): 2 raft trips = ~2 minutes crossing time.
- Forward dock on Fishbone cuts crossing to Ironhull by half (8 tiles instead of 16).
- Divers swim independently at speed 9: ~18s crossing. Can establish beachhead while
  Raftsmen ferry slower units.
- **Critical bottleneck**: Water patrols. 2 Gator patrol boats cycle every 20 seconds.
  Player must clear patrols with Divers BEFORE sending Raftsmen (Raft has no combat ability
  while loaded). Losing a loaded Raft = 4 combat units drowned.

#### Per-Island Combat Math
- **Fishbone** (10 enemies: 4G+2V+2SK+2 structures): 8 Mudfoots + 2 Shellcrackers win
  with ~5-6 survivors. Establish forward dock here.
- **Mire Rock** (14 enemies: 6G+3V+2Snap+1SK+2 structures): Harder. Snappers on
  elevated ground. Need Mortar Otters for suppression. 10-12 mixed units recommended.
  Expected losses: 3-5 units.
- **Ironhull** (22 enemies: 8G+4V+2Snap+2CC+4SK+2 buildings): Full combined-arms assault.
  Multiple landing points recommended. Divers flank from water. Mortar suppression on
  towers. Shellcrackers as frontline. Expected losses: 6-10 units. This is the mission's
  climax.

#### Difficulty Scaling

| Parameter | Support | Tactical | Elite |
|-----------|---------|----------|-------|
| Water patrols | None | 2 patrol boats | 4 patrol boats |
| Fishbone garrison | 6 enemies | 10 enemies | 14 enemies |
| Ironhull garrison | 16 enemies | 22 enemies | 26 enemies + Predator Nest |
| Raft crossing speed | +20% | Baseline | -10% |
| Diver stealth reveal range | 3 tiles | 4 tiles | 5 tiles |

#### Expected Duration: 18-25 minutes (par: 15 minutes)

---

### Mission 15: SERPENT'S LAIR (Boss Fight)

#### Starting Conditions
- 500F/400T/300S. Full base, all buildings.
- Toxic moat (5 HP/s) blocks non-causeway approaches.
- 3 concentric rings + boss throne room.

#### Boss Fight Math (Kommandant Ironjaw)
- **Phase 1 (100%-60% = 2000 damage needed)**: Heavy melee. 2 Croc Champions every 30s.
  DPS needed to outpace reinforcements: Kill Champions fast, then DPS boss.
  6 Mudfoots + 2 Shellcrackers + 2 Mortar Otters = ~80 DPS.
  Time to burn 2000 HP at 80 DPS: ~25 seconds (minus time killing Champions).
  Realistic Phase 1 duration: ~90 seconds.

- **Phase 2 (60%-25% = 1750 damage)**: AoE ground slam. Must spread units.
  Reinforcements every 20s but smaller groups.
  DPS drops due to spreading. ~60 DPS effective.
  Realistic Phase 2 duration: ~120 seconds.

- **Phase 3 (25%-0% = 1250 damage)**: Periodic AoE pulse but +50% damage taken.
  No reinforcements. Pure DPS race.
  ~80 DPS x 1.5 = 120 effective DPS against boss (boss takes more damage).
  Realistic Phase 3 duration: ~15 seconds.

Total boss fight: ~4-5 minutes. Plus time to clear outer/middle rings: ~10-12 minutes.

#### Expected Duration: 14-18 minutes (par: 15 minutes)

---

### Mission 16: THE RECKONING (Final Mission — Defense + Counterattack)

#### Starting Conditions
- 600F/500T/400S. Pre-built walls, towers, full base. 5 Burrows (30 pop cap).
- 160x160 map. Largest, most complex mission.

#### Phase 1: Defense (10 Waves)

| Wave | Time | Composition | Direction | Total Enemies |
|------|------|------------|-----------|--------------|
| 1 | 2:00 | 6G+4SK | North | 10 |
| 2 | 4:00 | 5G+3V | East | 8 |
| 3 | 5:30 | 8G+4SK | South | 12 |
| 4 | 7:00 | 6G+3V+2SK (N) + 4G+2SK (W) | Multi | 17 |
| 5 | 8:30 | 4Snap+4G (E) + 6G+2V (S) | Multi | 16 |
| 6 | 10:00 | 4G+2V+1CC (each of 4 dirs) | All | 28 |
| 7 | 12:00 | 8G+4V+2CC+1SK (N) + 6G+2Snap (S) | Multi | 23 |
| 8 | 13:30 | 10G+4V+2CC (N) + 4G+2Snap (E) + 6G+2V+1CC (W) | Multi | 31 |
| 9 | 15:00 | Everything from N+E+S+W | All | 34 |
| 10 | 16:30 | Everything + 2 Serpent Kings | All | 42 |

**Total wave enemies: ~221**

#### Defense Economy Math
Over 10 waves (~14 minutes of combat), the player will lose approximately 30-50 units
on Tactical difficulty. At 75 fish + 15s per Mudfoot, replacing 40 Mudfoots costs
3000 fish and requires ~10 minutes of continuous Barracks output.

Income sources during defense:
- 7 River Rats gathering: ~525 fish/min (if not disrupted by waves)
- 4 Fish Traps: ~72 fish/min passive
- Loot from ~221 enemy kills: ~750-1000 fish total (see loot tables)
- Starting stockpile: 600 fish

Total fish available over 14 minutes: 600 + (525 x 14) + (72 x 14) + ~875
= 600 + 7350 + 1008 + 875 = **9833 fish**.
Cost to train 40 Mudfoots: 3000 fish. Cost to train 10 Shellcrackers: 1000 fish.
Remaining for buildings/research: ~5800 fish. Economy is generous but not infinite.

**The real constraint is pop cap and barracks throughput.** With 1 Barracks training
continuously, 14 minutes / 15s per Mudfoot = 56 Mudfoots. With 2 Barracks: 112.
Player should build 2 Barracks for sustained replacement capacity.

#### Phase 2: Counterattack
- ~30 static defenders + buildings at SG base.
- SG Command Post: 4000 HP. Sappers deal 80 per charge (50 charges needed). Mortar
  Otters deal 20 per shot at 3s = 6.7 DPS. 2 Mortars = 13.3 DPS. Time to destroy
  CP with 2 Mortars only: 300 seconds (5 minutes). With Sapper charges mixed in:
  4 charges (320 damage) + Mortar fire for remaining 3680 HP = ~276 seconds.
  Total siege time: ~4-5 minutes.
- Player rebuilds/retrains between phases (no timer). Typical rebuild: 3-5 minutes
  to replenish losses and research remaining upgrades.
- SG base approach: 3 routes (center through river crossing, flank west, flank east).
  Center is fastest but crosses an open bridge under fire. Flanks are safer but longer.
- Expected counterattack duration: 6-10 minutes including approach, clearing garrison,
  and destroying Command Post.

#### Difficulty Scaling (Mission 16)

| Parameter | Support | Tactical | Elite |
|-----------|---------|----------|-------|
| Number of waves | 8 | 10 | 12 |
| Wave sizes | -30% | Baseline | +25% |
| Wave arrival speed | +30% gap | Baseline | -15% gap (faster) |
| Command Post HP | 2500 | 4000 | 5500 |
| Starting pop cap | 35 (6 Burrows) | 30 (5 Burrows) | 25 (4 Burrows) |
| Pre-built walls | 12 segments | 9 segments | 6 segments |
| Pre-built towers | 7 | 5 | 3 |
| SG base Predator Nests | 0 | 2 | 3 (spawn Croc Champions) |
| Serpent Kings in wave 10 | 1 | 2 | 3 |

#### Expected Duration: 22-30 minutes (par: 20 minutes for gold star)

---

## Part 6: Campaign Progression Curve

### 6.1 Unlock Table

| Mission | New Buildings | New Units | New Research | New Mechanic |
|---------|-------------|-----------|-------------|-------------|
| 1 Beachhead | CP, Barracks, Fish Trap, Watchtower, Burrow, Sandbag Wall | River Rat, Mudfoot | -- | Base building, gathering, combat |
| 2 Causeway | -- | Shellcracker | -- | Escort mechanics |
| 3 Firebase Delta | Gun Tower, Stone Wall | Mortar Otter | Hardshell Armor, Fish Oil Arrows | Capture & hold, AoE combat |
| 4 Prison Break | Armory, Minefield | Sapper, Diver | Demolition Training | Stealth, commando mission |
| 5 Siphon Valley | -- | Raftsman | -- | Toxic terrain, ford crossings |
| 6 Monsoon Ambush | Field Hospital, Dock | -- | Field Triage | Wave defense, weather effects |
| 7 River Rats | -- | -- | -- | Naval interception, boarding |
| 8 Underwater Cache | -- | Cpl. Splash (hero) | -- | Deep water, hero unit, sonar |
| 9 Dense Canopy | -- | -- | -- | Fog mechanic, intel markers |
| 10 Scorched Earth | -- | -- | -- | Fire spread, terrain destruction |
| 11 Entrenchment | -- | -- | Precision Bombardment | Tidal mechanics |
| 12 Fang Rescue | -- | Sgt. Fang (hero) | -- | Large-scale commando, layered siege |
| 13 Great Siphon | Shield Generator | -- | -- | Multi-layer fortress siege |
| 14 Iron Delta | -- | Full roster unlocked | -- | Amphibious multi-island ops |
| 15 Serpent's Lair | -- | -- | -- | Boss fight (3-phase) |
| 16 The Reckoning | -- | -- | -- | Epic defense + counterattack |

### 6.2 Difficulty Curve

| Mission | Enemy Count (Tactical) | Player Army (Peak) | Map Size | Duration Target | Difficulty Rating (1-10) |
|---------|----------------------|-------------------|----------|----------------|------------------------|
| 1 | 14 | 8-10 | 128x96 | 12-15 min | 2 |
| 2 | 22 | 10-12 | 128x128 | 18-22 min | 3 |
| 3 | 30 | 12-16 | 128x128 | 20-25 min | 4 |
| 4 | 15 (stealth) | 4 (fixed) | 128x96 | 12-18 min | 5 (different axis) |
| 5 | 28 | 12-16 | 160x128 | 18-22 min | 5 |
| 6 | ~80 (waves) | 12-18 | 128x128 | 16-20 min | 6 |
| 7 | 20 + barges | 10-14 | 128x128 | 14-18 min | 5 |
| 8 | 25 | 7 (fixed) | 128x128 | 12-16 min | 6 |
| 9 | 18 | 9 (fixed) | 128x128 | 10-14 min | 5 |
| 10 | 35 + counterattack waves | 14-18 | 128x128 | 12-16 min | 6 |
| 11 | 25 + fortress | 14-18 | 160x128 | 14-20 min | 7 |
| 12 | 58 (assault) | 20 (fixed) | 128x128 | 12-16 min | 7 |
| 13 | 70 | 18-24 | 160x128 | 18-25 min | 8 |
| 14 | 70 | 20-28 | 160x160 | 18-25 min | 8 |
| 15 | 85 + boss | 20-28 | 128x128 | 14-18 min | 9 |
| 16 | 250+ | 25-35 | 160x160 | 22-30 min | 10 |

### 6.3 Starting Resources Curve

```
Mission:  1    2    3    4    5    6    7    8    9    10   11   12   13   14   15   16
Fish:     100  200  300  0    150  200  150  0    0    300  350  0    400  500  500  600
Timber:   50   100  200  0    100  150  100  0    0    250  250  0    300  300  400  500
Salvage:  0    50   100  0    50   75   50   0    0    150  150  0    200  250  300  400
```

The curve follows a sawtooth pattern: base-building missions have increasing resources,
commando missions reset to zero. Each chapter starts with a lower resource level than
the previous chapter's peak, creating tension at chapter transitions.

### 6.4 Expected Player Army Size (Start of Mission)

| Mission | Combat Units at Start | Workers at Start | Total Pop |
|---------|---------------------|-----------------|----------|
| 1 | 0 | 4 | 4 |
| 2 | 6 (MF) | 2 | 8 |
| 3 | 8 (6MF+2SC) | 3 | 11 |
| 4 | 4 (3MF+1SC) | 0 | 4 |
| 5 | 3 (2MF+1MO) | 4 | 7 |
| 6 | 3 (MF) | 5 | 8 |
| 7 | 7 (3Raft+2Div+2MF) | 3 | 10 |
| 8 | 7 (3MF+3Div+1Raft) | 0 | 7 |
| 9 | 9 (4MF+3Div+2SC) | 0 | 9 |
| 10 | 4-6 (varies) | 4 | 8-10 |
| 11 | 4-6 (varies) | 4 | 8-10 |
| 12 | 20 (hero+8MF+4SC+3SA+2MO+2Div) | 0 | 20 |
| 13 | 4-6 (varies) | 5 | 9-11 |
| 14 | 6-8 (varies) | 5 | 11-13 |
| 15 | 6-8 (varies) | 5 | 11-13 |
| 16 | 14 (7MF+3SC+2MO+2SA) | 7 | 21 |

---

## Part 7: PRNG Tables

### 7.1 Encounter Spawn Tables

These tables define what spawns for each trigger point. The `variance` field specifies
how much the count can vary (uniform random within range).

#### Mission 1 — Beachhead

```typescript
const ENCOUNTER_TABLES_M1 = {
  scout_patrol: {
    support:  { enemies: [{ type: "skink", count: 1, variance: 0 }], triggerCondition: "timer(300)", cooldownMs: null },
    tactical: { enemies: [{ type: "skink", count: 2, variance: 0 }], triggerCondition: "timer(300)", cooldownMs: null },
    elite:    { enemies: [{ type: "skink", count: 3, variance: 1 }], triggerCondition: "timer(240)", cooldownMs: null },
  },
  bridge_defenders: {
    support:  { enemies: [{ type: "gator", count: 3, variance: 0 }], triggerCondition: "areaEntered('bridge_crossing')", cooldownMs: null },
    tactical: { enemies: [{ type: "gator", count: 4, variance: 0 }, { type: "skink", count: 2, variance: 0 }], triggerCondition: "areaEntered('bridge_crossing')", cooldownMs: null },
    elite:    { enemies: [{ type: "gator", count: 6, variance: 1 }, { type: "skink", count: 2, variance: 1 }], triggerCondition: "areaEntered('bridge_crossing')", cooldownMs: null },
  },
};
```

#### Mission 6 — Monsoon Ambush (Wave Spawns)

```typescript
const WAVE_TABLES_M6 = {
  wave_1: {
    support:  { enemies: [{ type: "skink", count: 3, variance: 1 }], direction: "north", timeMs: 180000 },
    tactical: { enemies: [{ type: "skink", count: 4, variance: 0 }], direction: "north", timeMs: 180000 },
    elite:    { enemies: [{ type: "skink", count: 6, variance: 1 }], direction: "north", timeMs: 180000 },
  },
  wave_2: {
    support:  { enemies: [{ type: "gator", count: 4, variance: 1 }], direction: "east+west", timeMs: 270000 },
    tactical: { enemies: [{ type: "gator", count: 6, variance: 0 }], direction: "east", timeMs: 270000,
                enemies2: [{ type: "gator", count: 6, variance: 0 }], direction2: "west" },
    elite:    { enemies: [{ type: "gator", count: 9, variance: 1 }], direction: "east", timeMs: 270000,
                enemies2: [{ type: "gator", count: 9, variance: 1 }], direction2: "west" },
  },
  wave_3: {
    support:  { enemies: [{ type: "gator", count: 3, variance: 1 }, { type: "viper", count: 1, variance: 0 }], direction: "south", timeMs: 360000 },
    tactical: { enemies: [{ type: "gator", count: 4, variance: 0 }, { type: "viper", count: 2, variance: 0 }], direction: "south", timeMs: 360000 },
    elite:    { enemies: [{ type: "gator", count: 6, variance: 1 }, { type: "viper", count: 3, variance: 1 }], direction: "south", timeMs: 360000 },
  },
  wave_4: {
    support:  { enemies: [{ type: "gator", count: 6, variance: 2 }], direction: "north+east", timeMs: 510000 },
    tactical: { enemies: [{ type: "gator", count: 8, variance: 0 }], direction: "north", timeMs: 510000,
                enemies2: [{ type: "gator", count: 8, variance: 0 }], direction2: "east" },
    elite:    { enemies: [{ type: "gator", count: 12, variance: 2 }], direction: "north", timeMs: 510000,
                enemies2: [{ type: "gator", count: 12, variance: 2 }], direction2: "east" },
  },
  wave_5: {
    support:  { enemies: [{ type: "snapper", count: 2, variance: 0 }, { type: "gator", count: 2, variance: 1 }], direction: "south", timeMs: 630000 },
    tactical: { enemies: [{ type: "snapper", count: 4, variance: 0 }, { type: "gator", count: 2, variance: 0 }], direction: "south", timeMs: 630000 },
    elite:    { enemies: [{ type: "snapper", count: 6, variance: 1 }, { type: "gator", count: 4, variance: 1 }, { type: "croc_champion", count: 1, variance: 0 }], direction: "south", timeMs: 630000 },
  },
  wave_6: {
    support:  { enemies: [{ type: "gator", count: 3, variance: 1 }], directions: ["north","east","south","west"], timeMs: 750000 },
    tactical: { enemies: [{ type: "gator", count: 3, variance: 0 }, { type: "skink", count: 2, variance: 0 }], direction: "north",
                enemies_e: [{ type: "gator", count: 3, variance: 0 }, { type: "viper", count: 1, variance: 0 }], direction_e: "east",
                enemies_s: [{ type: "gator", count: 3, variance: 0 }, { type: "skink", count: 2, variance: 0 }], direction_s: "south",
                enemies_w: [{ type: "gator", count: 3, variance: 0 }, { type: "viper", count: 1, variance: 0 }], direction_w: "west",
                timeMs: 750000 },
    elite:    { /* as tactical but +50% per direction */ },
  },
  wave_7: {
    support:  { enemies: [{ type: "gator", count: 8, variance: 2 }, { type: "viper", count: 2, variance: 1 }], direction: "north", timeMs: "wave_6_clear + 60000" },
    tactical: { enemies: [{ type: "gator", count: 12, variance: 0 }, { type: "viper", count: 4, variance: 0 }, { type: "croc_champion", count: 2, variance: 0 }], direction: "north", timeMs: "wave_6_clear + 60000" },
    elite:    { enemies: [{ type: "gator", count: 18, variance: 2 }, { type: "viper", count: 6, variance: 1 }, { type: "croc_champion", count: 3, variance: 0 }], direction: "north", timeMs: "wave_6_clear + 45000" },
  },
  wave_8: {
    support:  { enemies: [{ type: "gator", count: 6, variance: 2 }], directions: ["north","east","south","west"], timeMs: "wave_7_clear + 30000" },
    tactical: { /* as defined in mission doc — multi-direction + Serpent King from north */ },
    elite:    { /* as tactical + second Serpent King from south, +25% all counts */ },
  },
};
```

#### Mission 16 — The Reckoning (10 Waves)

```typescript
const WAVE_TABLES_M16 = {
  // Waves 1-3: Single direction, teaching waves
  wave_1:  { direction: "north",  gators: 6,  skinks: 4,  vipers: 0, snappers: 0, champions: 0, serpents: 0 },
  wave_2:  { direction: "east",   gators: 5,  skinks: 0,  vipers: 3, snappers: 0, champions: 0, serpents: 0 },
  wave_3:  { direction: "south",  gators: 8,  skinks: 4,  vipers: 0, snappers: 0, champions: 0, serpents: 0 },
  // Waves 4-6: Multi-direction
  wave_4:  { directions: ["north","west"], gators: 10, skinks: 4, vipers: 3, snappers: 0, champions: 0, serpents: 0 },
  wave_5:  { directions: ["east","south"], gators: 8,  skinks: 0, vipers: 2, snappers: 4, champions: 0, serpents: 0 },
  wave_6:  { directions: ["north","east","south","west"], gators: 16, skinks: 4, vipers: 4, snappers: 0, champions: 4, serpents: 0 },
  // Waves 7-8: Full commitment
  wave_7:  { directions: ["north","south"], gators: 12, skinks: 2, vipers: 4, snappers: 2, champions: 2, serpents: 1 },
  wave_8:  { directions: ["north","east","west"], gators: 16, skinks: 4, vipers: 4, snappers: 4, champions: 2, serpents: 1 },
  // Waves 9-10: Apocalyptic
  wave_9:  { directions: ["all"], gators: 18, skinks: 4, vipers: 6, snappers: 4, champions: 2, serpents: 0 },
  wave_10: { directions: ["all"], gators: 20, skinks: 6, vipers: 6, snappers: 4, champions: 4, serpents: 2 },
};
```

#### Mission 2 — Causeway (Ambush Encounters)

```typescript
const ENCOUNTER_TABLES_M2 = {
  ambush_1: {
    support:  { enemies: [{ type: "gator", count: 2, variance: 1 }, { type: "skink", count: 1, variance: 0 }] },
    tactical: { enemies: [{ type: "gator", count: 4, variance: 0 }, { type: "skink", count: 2, variance: 0 }] },
    elite:    { enemies: [{ type: "gator", count: 6, variance: 1 }, { type: "skink", count: 3, variance: 0 }] },
  },
  ambush_2: {
    support:  { enemies: [{ type: "gator", count: 3, variance: 1 }, { type: "skink", count: 1, variance: 0 }], barricade: true },
    tactical: { enemies: [{ type: "gator", count: 5, variance: 0 }, { type: "skink", count: 2, variance: 0 }], barricade: true },
    elite:    { enemies: [{ type: "gator", count: 7, variance: 1 }, { type: "skink", count: 3, variance: 0 }], barricade: true },
  },
  ambush_3: {
    support:  { enemies: [{ type: "gator", count: 3, variance: 1 }, { type: "viper", count: 1, variance: 0 }, { type: "skink", count: 1, variance: 0 }], mortar: false },
    tactical: { enemies: [{ type: "gator", count: 4, variance: 0 }, { type: "viper", count: 2, variance: 0 }, { type: "skink", count: 2, variance: 0 }], mortar: true },
    elite:    { enemies: [{ type: "gator", count: 6, variance: 1 }, { type: "viper", count: 3, variance: 0 }, { type: "skink", count: 3, variance: 0 }], mortar: true, mortarSplash: true },
  },
  reinforcement_wave: {
    support:  { enemies: [], triggerMs: null },
    tactical: { enemies: [{ type: "gator", count: 4, variance: 0 }, { type: "skink", count: 2, variance: 0 }], triggerMs: 45000 },
    elite:    { enemies: [{ type: "gator", count: 4, variance: 1 }, { type: "skink", count: 2, variance: 0 }], triggerMs: 45000,
                wave2:   [{ type: "gator", count: 3, variance: 1 }, { type: "viper", count: 1, variance: 0 }], trigger2Ms: 90000 },
  },
};
```

#### Mission 5 — Siphon Valley (Progressive Assault)

```typescript
const ENCOUNTER_TABLES_M5 = {
  siphon_alpha: {
    support:  { enemies: [{ type: "gator", count: 1, variance: 0 }] },
    tactical: { enemies: [{ type: "gator", count: 2, variance: 0 }, { type: "skink", count: 1, variance: 0 }, { type: "siphon_drone", count: 1, variance: 0 }] },
    elite:    { enemies: [{ type: "gator", count: 2, variance: 1 }, { type: "viper", count: 1, variance: 0 }, { type: "skink", count: 1, variance: 0 }, { type: "siphon_drone", count: 1, variance: 0 }] },
  },
  siphon_bravo: {
    support:  { enemies: [{ type: "gator", count: 2, variance: 1 }, { type: "siphon_drone", count: 1, variance: 0 }] },
    tactical: { enemies: [{ type: "gator", count: 4, variance: 0 }, { type: "siphon_drone", count: 2, variance: 0 }, { type: "viper", count: 1, variance: 0 }], venomSpire: true },
    elite:    { enemies: [{ type: "gator", count: 6, variance: 1 }, { type: "siphon_drone", count: 2, variance: 0 }, { type: "viper", count: 2, variance: 0 }, { type: "croc_champion", count: 1, variance: 0 }], venomSpire: true },
  },
  siphon_charlie: {
    support:  { enemies: [{ type: "gator", count: 4, variance: 1 }, { type: "watchtower", count: 1, variance: 0 }] },
    tactical: { enemies: [{ type: "gator", count: 6, variance: 0 }, { type: "viper", count: 2, variance: 0 }, { type: "siphon_drone", count: 2, variance: 0 }, { type: "watchtower", count: 2, variance: 0 }, { type: "croc_champion", count: 1, variance: 0 }], walls: true },
    elite:    { enemies: [{ type: "gator", count: 10, variance: 1 }, { type: "viper", count: 3, variance: 0 }, { type: "siphon_drone", count: 2, variance: 0 }, { type: "watchtower", count: 2, variance: 0 }, { type: "croc_champion", count: 2, variance: 0 }], walls: true },
  },
  northern_reinforcements: {
    support:  { enemies: [] },
    tactical: { enemies: [{ type: "gator", count: 4, variance: 0 }, { type: "skink", count: 2, variance: 0 }, { type: "viper", count: 1, variance: 0 }], triggerMs: 0 },
    elite:    { enemies: [{ type: "gator", count: 8, variance: 1 }, { type: "skink", count: 4, variance: 0 }, { type: "viper", count: 2, variance: 0 }], triggerMs: 0 },
  },
};
```

#### Mission 10 — Scorched Earth (Counterattack Waves)

```typescript
const COUNTERATTACK_TABLES_M10 = {
  // Triggered 30 seconds after each fuel tank destruction
  wave_after_tank_1: {
    support:  { enemies: [{ type: "gator", count: 2, variance: 1 }, { type: "viper", count: 1, variance: 0 }], direction: "north" },
    tactical: { enemies: [{ type: "gator", count: 4, variance: 0 }, { type: "viper", count: 2, variance: 0 }], direction: "north" },
    elite:    { enemies: [{ type: "gator", count: 6, variance: 1 }, { type: "viper", count: 3, variance: 0 }], direction: "north" },
  },
  wave_after_tank_2: {
    support:  { enemies: [{ type: "gator", count: 2, variance: 1 }], direction: "west", enemies2: [{ type: "snapper", count: 1, variance: 0 }], direction2: "east" },
    tactical: { enemies: [{ type: "gator", count: 3, variance: 0 }], direction: "west", enemies2: [{ type: "snapper", count: 2, variance: 0 }], direction2: "east" },
    elite:    { enemies: [{ type: "gator", count: 5, variance: 1 }], direction: "west", enemies2: [{ type: "snapper", count: 3, variance: 0 }], direction2: "east" },
  },
  wave_after_tank_3: {
    support:  { enemies: [{ type: "gator", count: 3, variance: 1 }, { type: "viper", count: 1, variance: 0 }], direction: "north" },
    tactical: { enemies: [{ type: "gator", count: 5, variance: 0 }, { type: "viper", count: 3, variance: 0 }], direction: "north",
                enemies2: [{ type: "snapper", count: 2, variance: 0 }], direction2: "east" },
    elite:    { enemies: [{ type: "gator", count: 8, variance: 1 }, { type: "viper", count: 4, variance: 0 }], direction: "north",
                enemies2: [{ type: "snapper", count: 3, variance: 0 }, { type: "croc_champion", count: 1, variance: 0 }], direction2: "east" },
  },
  wave_after_tank_4: {
    // Final counterattack — only fires if player destroys all 4
    support:  { enemies: [{ type: "gator", count: 4, variance: 2 }], direction: "north" },
    tactical: { enemies: [{ type: "gator", count: 6, variance: 0 }, { type: "viper", count: 2, variance: 0 }, { type: "croc_champion", count: 1, variance: 0 }], direction: "north" },
    elite:    { enemies: [{ type: "gator", count: 10, variance: 1 }, { type: "viper", count: 4, variance: 0 }, { type: "croc_champion", count: 2, variance: 0 }], direction: "north" },
  },
};
```

#### Mission 15 — Serpent's Lair (Boss Reinforcements)

```typescript
const BOSS_REINFORCEMENT_TABLES_M15 = {
  ironjaw_phase_1: {
    // Reinforcements every 30 seconds during Phase 1
    support:  { enemies: [{ type: "croc_champion", count: 1, variance: 0 }], intervalMs: 45000 },
    tactical: { enemies: [{ type: "croc_champion", count: 2, variance: 0 }], intervalMs: 30000 },
    elite:    { enemies: [{ type: "croc_champion", count: 2, variance: 0 }, { type: "gator", count: 2, variance: 1 }], intervalMs: 25000 },
  },
  ironjaw_phase_2: {
    // Smaller groups, faster cadence
    support:  { enemies: [{ type: "gator", count: 2, variance: 1 }], intervalMs: 30000 },
    tactical: { enemies: [{ type: "gator", count: 3, variance: 0 }, { type: "viper", count: 1, variance: 0 }], intervalMs: 20000 },
    elite:    { enemies: [{ type: "gator", count: 4, variance: 1 }, { type: "viper", count: 2, variance: 0 }], intervalMs: 15000 },
  },
  ironjaw_phase_3: {
    // No reinforcements — pure DPS race
    support:  { enemies: [] },
    tactical: { enemies: [] },
    elite:    { enemies: [] },
  },
};
```

### 7.2 Loot Drop Tables

When an enemy unit is killed, it has a chance to drop resources. Drops are placed as
collectible entities at the death location. Any friendly unit can pick them up by
walking over them (auto-collect within 2 tiles).

#### Per-Enemy-Type Drop Tables

```typescript
const LOOT_TABLES = {
  skink: {
    drops: [
      { item: "fish",    probability: 0.30, countMin: 3,  countMax: 8 },
      { item: "salvage", probability: 0.05, countMin: 2,  countMax: 5 },
    ],
    // Expected value per kill: 0.30 * 5.5 + 0.05 * 3.5 = 1.65 fish + 0.175 salvage
  },
  gator: {
    drops: [
      { item: "fish",    probability: 0.40, countMin: 5,  countMax: 12 },
      { item: "salvage", probability: 0.15, countMin: 3,  countMax: 8 },
      { item: "timber",  probability: 0.10, countMin: 3,  countMax: 6 },
    ],
    // Expected value per kill: 3.4 fish + 0.825 salvage + 0.45 timber
  },
  viper: {
    drops: [
      { item: "fish",    probability: 0.35, countMin: 5,  countMax: 10 },
      { item: "salvage", probability: 0.20, countMin: 5,  countMax: 12 },
    ],
    // Expected value per kill: 2.625 fish + 1.7 salvage
  },
  snapper: {
    drops: [
      { item: "fish",    probability: 0.50, countMin: 8,  countMax: 15 },
      { item: "salvage", probability: 0.30, countMin: 8,  countMax: 15 },
      { item: "timber",  probability: 0.20, countMin: 5,  countMax: 10 },
    ],
    // Expected value per kill: 5.75 fish + 3.45 salvage + 1.5 timber
  },
  croc_champion: {
    drops: [
      { item: "fish",    probability: 0.80, countMin: 15, countMax: 25 },
      { item: "salvage", probability: 0.60, countMin: 10, countMax: 20 },
      { item: "timber",  probability: 0.30, countMin: 5,  countMax: 15 },
    ],
    // Expected value per kill: 16.0 fish + 9.0 salvage + 3.0 timber
  },
  serpent_king: {
    drops: [
      { item: "fish",    probability: 1.00, countMin: 25, countMax: 40 },
      { item: "salvage", probability: 1.00, countMin: 20, countMax: 35 },
      { item: "timber",  probability: 0.50, countMin: 10, countMax: 20 },
    ],
    // Expected value per kill: 32.5 fish + 27.5 salvage + 7.5 timber
  },
  siphon_drone: {
    drops: [
      { item: "salvage", probability: 0.80, countMin: 10, countMax: 20 },
    ],
    // Expected value per kill: 12.0 salvage (tech unit, salvage-rich)
  },
};
```

#### Building Destruction Drops

```typescript
const BUILDING_LOOT = {
  flag_post:     { drops: [{ item: "salvage", probability: 1.00, countMin: 30, countMax: 50 }] },
  watchtower:    { drops: [{ item: "timber",  probability: 0.80, countMin: 15, countMax: 25 }] },
  sandbag_wall:  { drops: [] },  // No loot from walls
  stone_wall:    { drops: [{ item: "timber",  probability: 0.30, countMin: 5,  countMax: 10 }] },
  fuel_tank:     { drops: [{ item: "salvage", probability: 1.00, countMin: 40, countMax: 60 }] },
  mortar_pit:    { drops: [{ item: "salvage", probability: 1.00, countMin: 20, countMax: 30 }] },
  venom_spire:   { drops: [{ item: "salvage", probability: 1.00, countMin: 25, countMax: 40 }] },
  command_post_sg: { drops: [{ item: "salvage", probability: 1.00, countMin: 50, countMax: 80 }, { item: "fish", probability: 1.00, countMin: 30, countMax: 50 }] },
};
```

#### Loot Economy Impact

In Mission 6 (Monsoon Ambush, ~80 enemies killed on Tactical), expected loot:
- ~80 Gator-equivalent kills: ~272 fish, ~66 salvage, ~36 timber from loot alone.
- This is roughly equivalent to 2 minutes of dedicated fish gathering.
- Loot is meaningful but not transformative. It supplements gathering, not replaces it.

In Mission 16 (The Reckoning, ~200+ enemies killed):
- Mixed kills (heavy on Gators + Champions): ~800-1200 fish, ~400-600 salvage from loot.
- This IS significant — almost enough to fund an entire army rebuild between Phase 1 and Phase 2.

### 7.3 Promotion / Veterancy Tables

Units gain XP from combat. XP thresholds are based on damage dealt to enemies (not kills,
to prevent kill-stealing incentives).

#### XP Thresholds

```typescript
const VETERANCY = {
  thresholds: {
    veteran: 100,  // XP required for first promotion
    elite:   300,  // XP required for second promotion
    hero:    600,  // XP required for third promotion (rare, late-campaign only)
  },
  xpPerDamage: 1,  // 1 XP per point of damage dealt to enemies
  // A Mudfoot killing 1 Gator (dealing ~120 damage over the fight): 120 XP. Just over Veteran.
  // A Mudfoot surviving 3 engagements: likely ~300-400 XP. Elite tier.
};
```

#### Veterancy Bonuses

| Rank | Damage Bonus | HP Bonus | Speed Bonus | Visual | Special |
|------|-------------|---------|------------|--------|---------|
| Recruit (default) | +0% | +0% | +0% | No badge | None |
| Veteran | +10% | +10% | +0% | Silver chevron | None |
| Elite | +20% | +20% | +5% | Gold chevron | None |
| Hero | +30% | +30% | +10% | Star emblem | Unique ability unlock |

#### Hero-Tier Ability Unlocks

```typescript
const HERO_ABILITIES = {
  mudfoot_hero:       { name: "War Cry",       effect: "+15% damage to all nearby allies for 8s", cooldown: 60 },
  shellcracker_hero:  { name: "Piercing Shot",  effect: "Next attack ignores armor",               cooldown: 30 },
  sapper_hero:        { name: "Double Charge",   effect: "Place 2 Breach Charges in one cooldown",  cooldown: 45 },
  mortar_hero:        { name: "Barrage",         effect: "Fire 3 shells in rapid succession",        cooldown: 45 },
  diver_hero:         { name: "Silent Kill",     effect: "Instant-kill on non-Champion enemy from stealth", cooldown: 60 },
  raftsman_hero:      { name: "Armored Raft",    effect: "Raft gains 200 HP shield for 15s",         cooldown: 45 },
  river_rat_hero:     { name: "Overloaded Haul", effect: "Next gather trip yields 3x resources",     cooldown: 90 },
};
```

#### Veterancy in Practice

In a typical playthrough, veteran promotions start appearing in Mission 3-4 (after
2-3 significant engagements). Elite promotions appear in Mission 6-8 for units that
survive multiple missions. Hero promotions are achievable only in Missions 12-16 for
units that have been in combat for the entire back half of the campaign.

**Design intent**: Veterancy rewards the player for keeping units alive. Losing a Hero-rank
Mudfoot in Mission 14 stings far more than losing a fresh recruit. This creates emotional
attachment to individual units — a hallmark of the best RTS campaigns (XCOM effect).

### 7.4 Resource Node Variance Tables

```typescript
const RESOURCE_VARIANCE = {
  mangrove_tree: {
    timberPerTrip: 10,
    tripsBeforeDepletion: { min: 3, max: 4 },  // 30-40 timber per tree
    regrowthTimeMs: null,  // Trees do not regrow in OEF
  },
  fish_spot: {
    fishPerTrip: 10,
    tripsBeforeDepletion: { min: 20, max: 30 },  // 200-300 fish per spot
    regrowthTimeMs: 60000,  // Replenishes 1 trip worth per 60 seconds after depletion
  },
  salvage_cache: {
    salvagePerTrip: { min: 10, max: 15 },
    tripsBeforeDepletion: { min: 2, max: 3 },  // 20-45 salvage per cache
    regrowthTimeMs: null,  // Caches are one-time only
  },
};
```

### 7.5 Patrol Route Variance

Enemy patrol routes are selected from a pool at mission start based on the game seed.
Each patrol has 2-3 route variants. The variant is deterministic per seed (so the same
seed always produces the same routes, enabling replays and debugging).

```typescript
const PATROL_VARIANTS = {
  mission_1_scout: {
    routes: [
      [[52,30],[56,28],[60,32],[56,34]],  // Tight loop near bridge
      [[52,30],[48,26],[44,30],[48,34]],  // Wider loop, more west
      [[52,30],[60,26],[68,30],[60,34]],  // Wider loop, more east
    ],
    loopTimeMs: 20000,
    pauseAtWaypointMs: 2000,
  },
};
```

### 7.6 Weather/Event Timing Variance

```typescript
const WEATHER_VARIANCE = {
  mission_6_monsoon: {
    monsoonStartMs: 180000,  // Fixed at 3:00 (no variance — narrative timing)
    lightningStrikeIntervalMs: { min: 12000, max: 18000 },  // 12-18 seconds between strikes
    lightningRevealRadiusTiles: 16,
    lightningRevealDurationMs: 500,
    windDirectionChanges: [300000, 600000, 900000],  // Wind shifts at 5:00, 10:00, 15:00
  },
  mission_11_tides: {
    tidalCycleMs: 180000,  // 3 minutes per half-cycle (fixed)
    warningBeforeChangeMs: 30000,  // 30 seconds audio warning
    visualIndicatorStartMs: 10000,  // Water line visual starts 10 seconds before change
  },
};
```

---

## Part 8: Difficulty System Detail

### 8.1 Global Difficulty Modifiers

These modifiers apply across ALL missions. Per-mission overrides are in the mission
sections above.

| Parameter | Support (Easy) | Tactical (Normal) | Elite (Hard) |
|-----------|---------------|-------------------|-------------|
| Player unit HP | +20% | Baseline | -10% |
| Enemy unit HP | -15% | Baseline | +15% |
| Enemy damage | -15% | Baseline | +10% |
| Gathering rate | +25% | Baseline | -15% |
| Build time | -20% | Baseline | +10% |
| Train time | -20% | Baseline | +10% |
| Lodge HP | 750 | 600 | 500 |
| Auto-retreat threshold | 30% HP | 25% HP | 20% HP |
| Loot drop probability | +30% absolute | Baseline | -10% absolute |
| Veterancy XP rate | +50% | Baseline | -25% |
| Enemy detection radius (stealth missions) | -30% | Baseline | +20% |
| Wave inter-arrival time | +30% | Baseline | -15% |
| Par time for gold star | +30% | Baseline | -20% |

### 8.2 Star Rating System

Each mission awards 1-3 stars based on performance:

| Stars | Requirement |
|-------|------------|
| 1 (Bronze) | Complete all primary objectives |
| 2 (Silver) | Complete all primary objectives within par time |
| 3 (Gold) | Complete all primary + bonus objectives within par time |

Star ratings persist per-difficulty. A player with 3 stars on Support and 1 star on
Elite sees both. Stars unlock cosmetic rewards and campaign bonuses:

| Total Stars | Reward |
|-------------|--------|
| 8 | +10% starting resources in all future missions |
| 16 | All River Rats start as Veterans |
| 24 | Col. Bubbles' Rally Cry cooldown reduced to 30s |
| 32 | Unlock "Ironclad" difficulty (Elite + permadeath across missions) |
| 48 (max) | Campaign completion badge + all heroes start as Elite rank |

---

## Part 9: Balance Validation Tests

These are the automated combat simulations that should run in Vitest to validate balance
changes. If any test fails, the stat change that caused it must be reviewed.

```typescript
// === CORE COMBAT TESTS ===

// 1. Mudfoot vs Gator: Gator wins with >50% HP
test("1v1: Gator beats Mudfoot", () => {
  const result = simulate1v1("mudfoot", "gator");
  expect(result.winner).toBe("gator");
  expect(result.winnerHpPercent).toBeGreaterThan(0.5);
});

// 2. 3 Mudfoots vs 2 Gators: Mudfoots win with 1-2 survivors
test("3v2: 3 Mudfoots beat 2 Gators", () => {
  const result = simulateGroup([3, "mudfoot"], [2, "gator"]);
  expect(result.winner).toBe("ura");
  expect(result.uraSurvivors).toBeGreaterThanOrEqual(1);
  expect(result.uraSurvivors).toBeLessThanOrEqual(2);
});

// 3. Mudfoot beats Viper 1v1 (range closer wins)
test("1v1: Mudfoot beats Viper", () => {
  const result = simulate1v1("mudfoot", "viper");
  expect(result.winner).toBe("mudfoot");
});

// 4. Shellcracker beats Gator 1v1 (kiting)
test("1v1: Shellcracker beats Gator with kiting", () => {
  const result = simulate1v1("shellcracker", "gator", { kiting: true });
  expect(result.winner).toBe("shellcracker");
});

// 5. Mortar Otter AoE: 1 Mortar vs 5 clustered Gators, kills 2-3
test("AoE: 1 Mortar Otter vs 5 clustered Gators", () => {
  const result = simulateAoE("mortar_otter", [5, "gator"], { clustered: true });
  expect(result.enemyKills).toBeGreaterThanOrEqual(2);
  expect(result.enemyKills).toBeLessThanOrEqual(3);
});

// 6. Sapper vs Building: Breach Charge kills building in expected charges
test("Sapper Breach Charge: 4 charges kill 300 HP building", () => {
  const charges = Math.ceil(300 / 80);
  expect(charges).toBe(4);
});

// 7. Upgraded Sapper: 3 charges kill 300 HP building
test("Upgraded Sapper: 3 charges with Demolition Training", () => {
  const charges = Math.ceil(300 / 125);
  expect(charges).toBe(3);
});

// === ECONOMY TESTS ===

// 8. 2 workers gathering for 60s: expect ~120-150 fish
test("Economy: 2 workers on fish for 60s", () => {
  const result = simulateGathering(2, "fish_spot", 60000);
  expect(result.totalFish).toBeGreaterThanOrEqual(120);
  expect(result.totalFish).toBeLessThanOrEqual(160);
});

// 9. Fish Trap ROI: pays for itself in worker-equivalent within 5 min
test("Economy: Fish Trap ROI", () => {
  const trapCost = 100; // timber
  const trapIncome60s = 18; // fish per minute (3 per 10s)
  const workerIncome60s = 75; // fish per minute
  // Trap saves 1 pop slot worth of income
  // In 5 min: trap produces 90 fish. Worker would produce 375 fish.
  // Trap value is the pop slot it frees, not raw output.
  expect(trapIncome60s).toBeGreaterThan(0);
});

// 10. Build order: CP + Barracks from 100F/50T with 4 workers takes ~5 min
test("Economy: Build order timing", () => {
  const result = simulateBuildOrder([
    { building: "command_post", cost: { fish: 200, timber: 100 } },
    { building: "barracks", cost: { fish: 150, timber: 75 } },
  ], { startFish: 100, startTimber: 50, workers: 4 });
  expect(result.totalTimeMs).toBeLessThan(330000); // Under 5.5 minutes
  expect(result.totalTimeMs).toBeGreaterThan(240000); // Over 4 minutes
});

// === MISSION-SPECIFIC TESTS ===

// 11. Mission 1: Bridge fight is winnable with 4 Mudfoots
test("M1: 4 Mudfoots survive bridge defense (Tactical)", () => {
  const result = simulateGroup([4, "mudfoot"], [4, "gator", 2, "skink"]);
  expect(result.winner).toBe("ura");
});

// 12. Mission 6: Wave 1 is trivial (4 Skinks vs 5 Mudfoots + tower)
test("M6: Wave 1 winnable with starting force", () => {
  const result = simulateGroup([5, "mudfoot"], [4, "skink"], { towerSupport: 1 });
  expect(result.winner).toBe("ura");
  expect(result.uraSurvivors).toBeGreaterThanOrEqual(4);
});

// 13. Mission 15: Boss Phase 3 DPS race is winnable
test("M15: 10 mixed units can kill Ironjaw Phase 3 (1250 HP, +50% dmg taken)", () => {
  const dps = (4 * 12 + 2 * 10 + 2 * 20 + 2 * 6); // 4MF + 2SC + 2MO + 2SA
  const effectiveDps = dps * 1.5; // Boss takes +50% damage
  const timeToKill = 1250 / effectiveDps;
  expect(timeToKill).toBeLessThan(15); // Must be killable in under 15 seconds
});
```

---

## Part 10: Tuning Knobs (Post-Implementation)

These are the parameters most likely to need adjustment after first playable. Sorted by
impact and ease of change.

### 10.1 High Impact, Easy to Change
1. **Enemy wave counts per mission** — just numbers in spawn tables.
2. **Starting resources per mission** — single constant per mission.
3. **Unit train time** — affects pacing enormously. 15s -> 12s for Mudfoot = ~20% faster
   army buildup.
4. **Loot drop probabilities** — if economy feels tight, increase drop rates.
5. **Par time thresholds** — if players consistently miss gold star, extend par times.

### 10.2 High Impact, Medium Effort
6. **Damage and HP values** — requires re-validating all combat simulation tests.
7. **Building costs** — shifts build orders and economy pacing.
8. **Veterancy XP thresholds** — affects when promotions happen in the campaign arc.
9. **Wave inter-arrival timing** — affects defense mission pacing dramatically.

### 10.3 Medium Impact, High Effort
10. **Unit speed values** — affects all movement-based timing: kiting, pursuit, retreat.
11. **AoE radius** — small changes have large effect on group combat.
12. **Research effects** — must re-validate post-upgrade combat tests.
13. **Boss phase HP thresholds** — changes boss fight pacing and difficulty.

### 10.4 Balance Red Flags
If any of these occur during testing, the balance is broken:

- **Red flag**: Player can complete a mission without building any military units.
  (Economy-only win should be impossible except possibly Mission 1 with extreme micro.)
- **Red flag**: Any mission takes more than 35 minutes on Tactical difficulty.
  (Max target is 30 minutes for Mission 16.)
- **Red flag**: A single unit type dominates all matchups.
  (If Mortar Otter + mass Mudfoot wins everything, other units need buffs or Mortar
  needs a nerf.)
- **Red flag**: Stealth missions can be completed by brute-forcing combat.
  (Alarm reinforcements must be overwhelming enough to prevent this on Tactical+.)
- **Red flag**: The player never feels resource pressure after minute 5 of any mission.
  (Indicates starting resources are too high or income is too fast.)
- **Red flag**: Veteran/Elite units feel identical to Recruits.
  (Veterancy bonuses too small. Consider increasing to +15%/+25%/+35%.)

---

## Appendix A: Quick Reference — All Mission Summary Table

| # | Name | Chapter | Type | Map | Start Units | Start Res (F/T/S) | Enemies | Duration | Unlock | Difficulty |
|---|------|---------|------|-----|------------|-------------------|---------|----------|--------|-----------|
| 1 | Beachhead | 1-1 | Tutorial/Base | 128x96 | 4 RR | 100/50/0 | 14 | 12-15 | CP, Barracks, FT, WT, Burrow, Wall, RR, MF | 2/10 |
| 2 | Causeway | 1-2 | Escort | 128x128 | 6MF+2RR | 200/100/50 | 22 | 18-22 | Shellcracker | 3/10 |
| 3 | Firebase Delta | 1-3 | Capture/Hold | 128x128 | 6MF+2SC+3RR | 300/200/100 | 30 | 20-25 | Mortar, Gun Tower, Stone Wall | 4/10 |
| 4 | Prison Break | 1-4 | Stealth/Commando | 128x96 | 3MF+1SC | 0/0/0 | 15 | 12-18 | Sapper, Diver, Armory, Minefield | 5/10 |
| 5 | Siphon Valley | 2-1 | Multi-Obj Assault | 160x128 | 2MF+1MO+4RR | 150/100/50 | 28 | 18-22 | Raftsman | 5/10 |
| 6 | Monsoon Ambush | 2-2 | Wave Defense | 128x128 | 3MF+5RR | 200/150/75 | ~80 | 16-20 | Field Hospital, Dock | 6/10 |
| 7 | River Rats | 2-3 | Naval Intercept | 128x128 | 3Raft+2Div+2MF+3RR | 150/100/50 | 20 | 14-18 | -- | 5/10 |
| 8 | Underwater Cache | 2-4 | Commando/Water | 128x128 | 3MF+3Div+1Raft | 0/0/0 | 25 | 12-16 | Cpl. Splash | 6/10 |
| 9 | Dense Canopy | 3-1 | Recon/Fog | 128x128 | 4MF+3Div+2SC | 0/0/0 | 18 | 10-14 | Intel Markers | 5/10 |
| 10 | Scorched Earth | 3-2 | Destruction | 128x128 | built base | 300/250/150 | 35+ | 12-16 | Fire spread | 6/10 |
| 11 | Entrenchment | 3-3 | Tidal Siege | 160x128 | built base | 350/250/150 | 25+ | 14-20 | Precision Bombardment | 7/10 |
| 12 | Fang Rescue | 3-4 | Full Commando | 128x128 | 20 units (hero) | 0/0/0 | 58 | 12-16 | Sgt. Fang | 7/10 |
| 13 | Great Siphon | 4-1 | Multi-Layer Siege | 160x128 | built base | 400/300/200 | 70 | 18-25 | Shield Generator | 8/10 |
| 14 | Iron Delta | 4-2 | Amphibious | 160x160 | built base | 500/300/250 | 70 | 18-25 | Full roster | 8/10 |
| 15 | Serpent's Lair | 4-3 | Boss Fight | 128x128 | built base | 500/400/300 | 85+ | 14-18 | -- | 9/10 |
| 16 | The Reckoning | 4-4 | Defense+Counter | 160x160 | 21 units+base | 600/500/400 | 250+ | 22-30 | -- | 10/10 |

---

## Appendix B: Design Constants

```typescript
// === CORE GAME CONSTANTS ===
const TILE_SIZE_PX = 32;
const SPRITE_SCALE = 3;  // 16x16 sprites rendered at 48x48
const GAME_TICK_MS = 16;  // ~60 FPS target
const GATHER_RETURN_AMOUNT = 10;  // Resources per worker trip (all types)

// === ECONOMY CONSTANTS ===
const FISH_TRAP_INCOME_PER_10S = 3;
const FISH_TRAP_INCOME_UPGRADED = 5;
const VILLAGE_INCOME_PER_10S = 1;
const LODGE_STARTING_POP_CAP = 4;
const BURROW_POP_CAP_BONUS = 6;
const MAX_POP_CAP = 50;

// === COMBAT CONSTANTS ===
const MIN_DAMAGE = 1;  // Armor can never reduce damage below 1
const AUTO_RETREAT_HP_PERCENT = 0.25;  // 25% HP triggers auto-retreat to lodge
const VETERANCY_XP_PER_DAMAGE = 1;
const VETERANCY_THRESHOLDS = [100, 300, 600];
const VETERANCY_BONUSES = [
  { damage: 1.10, hp: 1.10, speed: 1.00 },  // Veteran
  { damage: 1.20, hp: 1.20, speed: 1.05 },  // Elite
  { damage: 1.30, hp: 1.30, speed: 1.10 },  // Hero
];

// === FOG OF WAR ===
const FOG_UNEXPLORED_ALPHA = 1.0;  // Fully black
const FOG_EXPLORED_ALPHA = 0.5;    // Dimmed
const FOG_VISIBLE_ALPHA = 0.0;     // Clear

// === BUILDING CONSTANTS ===
const WALL_SEGMENT_LENGTH_TILES = 2;
const WATCHTOWER_VISION_RADIUS = 8;
const WATCHTOWER_ATTACK_RANGE = 6;
const WATCHTOWER_DAMAGE = 8;
const GUN_TOWER_ATTACK_RANGE = 7;
const GUN_TOWER_DAMAGE = 16;
const FIELD_HOSPITAL_HEAL_RANGE = 6;
const FIELD_HOSPITAL_HEAL_RATE = 1;  // HP per second
const SHIELD_GENERATOR_RANGE = 8;
const SHIELD_GENERATOR_REDUCTION = 0.30;  // 30% ranged damage reduction
const MINEFIELD_DAMAGE = 40;

// === TERRAIN MOVEMENT MODIFIERS ===
const TERRAIN_SPEED = {
  grass: 1.0,
  dirt: 1.0,
  beach: 0.9,
  mud: 0.7,
  shallow_water: 0.7,  // Divers unaffected
  deep_water: 0.0,     // Impassable to non-water units
  mangrove: 0.8,
  stone: 1.0,
  toxic_sludge: 0.6,   // + 2 HP/s damage
  toxic_water: 0.0,    // Impassable + 3 HP/s if entered via ford
  swamp: 0.5,
  thicket: 0.6,
};

// === DIFFICULTY MODIFIERS ===
const DIFFICULTY = {
  support: {
    playerHpMult: 1.20,
    enemyHpMult: 0.85,
    enemyDamageMult: 0.85,
    gatherRateMult: 1.25,
    buildTimeMult: 0.80,
    trainTimeMult: 0.80,
    lodgeHp: 750,
    autoRetreatPercent: 0.30,
    lootProbBonus: 0.30,
    veterancyXpMult: 1.50,
    waveIntervalMult: 1.30,
    parTimeMult: 1.30,
  },
  tactical: {
    playerHpMult: 1.00,
    enemyHpMult: 1.00,
    enemyDamageMult: 1.00,
    gatherRateMult: 1.00,
    buildTimeMult: 1.00,
    trainTimeMult: 1.00,
    lodgeHp: 600,
    autoRetreatPercent: 0.25,
    lootProbBonus: 0.00,
    veterancyXpMult: 1.00,
    waveIntervalMult: 1.00,
    parTimeMult: 1.00,
  },
  elite: {
    playerHpMult: 0.90,
    enemyHpMult: 1.15,
    enemyDamageMult: 1.10,
    gatherRateMult: 0.85,
    buildTimeMult: 1.10,
    trainTimeMult: 1.10,
    lodgeHp: 500,
    autoRetreatPercent: 0.20,
    lootProbBonus: -0.10,
    veterancyXpMult: 0.75,
    waveIntervalMult: 0.85,
    parTimeMult: 0.80,
  },
};
```

---

## Appendix C: Seeding and Determinism

All PRNG in Otter: Elite Force uses a seeded PRNG (Mulberry32 or similar) initialized
from the mission seed. The seed is derived from:

```typescript
function missionSeed(campaignSeed: number, missionId: number, difficulty: string): number {
  return hash(campaignSeed ^ (missionId * 65537) ^ hash(difficulty));
}
```

This ensures:
1. The same campaign playthrough always produces the same mission layouts.
2. Different difficulty levels produce different random outcomes (patrol routes, loot drops).
3. Replay mode can reproduce any mission exactly by storing only the campaign seed.

All random calls within a mission (patrol route selection, loot drops, resource node
variance, weather timing) pull from the same seeded generator in deterministic order.
This means the game is fully replayable and debuggable.

---

## Appendix D: Movement and Engagement Distance Reference

### D.1 Movement Speed Table (Tiles Per Second)

All speeds in tiles per second on normal terrain (grass/dirt, modifier 1.0):

| Unit | Base Speed | On Mud (0.7) | On Mangrove (0.8) | On Swamp (0.5) | In Shallow Water (0.7) |
|------|-----------|-------------|-------------------|---------------|----------------------|
| River Rat | 8 | 5.6 | 6.4 | 4.0 | 5.6 |
| Mudfoot | 7 | 4.9 | 5.6 | 3.5 | 4.9 |
| Shellcracker | 5 | 3.5 | 4.0 | 2.5 | 3.5 |
| Sapper | 7 | 4.9 | 5.6 | 3.5 | 4.9 |
| Raftsman | 6 | 4.2 | 4.8 | 3.0 | 4.2 |
| Mortar Otter | 4 | 2.8 | 3.2 | 2.0 | 2.8 |
| Diver | 7 (9 water) | 4.9 | 5.6 | 3.5 | 9.0 (full speed) |
| Skink | 9 | 6.3 | 7.2 | 4.5 | 6.3 |
| Gator | 5 | 3.5 | 4.0 | 2.5 | 3.5 |
| Viper | 4 | 2.8 | 3.2 | 2.0 | 2.8 |
| Snapper | 3 | 2.1 | 2.4 | 1.5 | 2.1 |
| Croc Champion | 5 | 3.5 | 4.0 | 2.5 | 3.5 |

### D.2 Engagement Distance Calculations

**How long until contact?** The distance from spawn point to player base determines how
much warning time the player gets for each incoming attack.

| Mission | Enemy Spawn Distance (tiles) | Fastest Enemy | Time to Contact (s) |
|---------|---------------------------|--------------|-------------------|
| 1 (bridge defenders) | ~12 from bridge | Gator (5) | 2.4s |
| 2 (ambush 1) | ~8 from convoy | Gator (5) | 1.6s |
| 6 (wave 1 from north) | ~40 from base center | Skink (9) | 4.4s |
| 6 (wave 4 from north) | ~40 from base center | Gator (5) | 8.0s |
| 16 (wave 1 from north) | ~56 from lodge | Skink (9) | 6.2s |
| 16 (wave 10 from all) | ~40-56 depending on dir | Gator (5) | 8.0-11.2s |

**Implication for defense timing**: On Mission 6, the player has only 4.4 seconds from
wave 1 spawn to first contact (Skinks are fast). On later waves with slower Gators,
8+ seconds provides time to reposition. This is why Skink-first waves are probes, not
assaults — they arrive fast but die fast. The real damage comes from the slower, heavier
follow-up waves.

### D.3 Kiting Math

Kiting occurs when a ranged unit retreats while firing at a pursuing melee unit.
The key question: can the ranged unit stay outside melee range long enough to kill
the pursuer?

**Shellcracker (speed 5, range 5) vs Gator (speed 5, range 1):**
- Speeds are equal. If both move, Gator never closes. But Shellcracker must stop to fire
  (attack takes 1.8s). During that 1.8s, Gator closes 5 x 1.8 = 9 tiles.
- Starting at range 5: Shellcracker fires (1.8s). Gator closes 9 tiles. New range: -4
  (Gator is now in melee). Shellcracker takes 1 hit during attack animation.
- **Verdict**: Pure 1v1 kiting does not work at equal speed. Shellcracker MUST have a
  head start (range 8+) or terrain advantage (Gator slowed by mud) to kite effectively.
- With mud (Gator speed 3.5): Shellcracker fires (1.8s). Gator closes 3.5 x 1.8 = 6.3
  tiles. Starting range 5: new range 5 - 6.3 = -1.3. Still in melee.
  Starting range 8: new range 8 - 6.3 = 1.7. Shellcracker retreats 5 x 0.5 = 2.5 tiles
  (half-second move). New range: 4.2. Fire again. This cycle IS sustainable.
- **Mud terrain makes Shellcracker kiting viable.** This is intentional — defensive
  positions on mud terrain reward Shellcracker placement.

**Mortar Otter (speed 4, range 7, min range 3) vs Gator (speed 5):**
- Gator is faster. Mortar cannot kite. Must have Mudfoot escort.
- If Mortar fires from range 7: Gator closes 5 tiles per 3.0s attack cycle. After 1 shot,
  Gator is at range 2 (inside min range). Mortar cannot fire.
- Mortar gets exactly 1 shot (20 damage) before Gator closes. Then Mortar dies in
  50 HP / (18-0) = 2.8 hits = 4.2 seconds.
- **Verdict**: Mortar Otters MUST have at least 1 Mudfoot bodyguard per Mortar.
  Unescorted Mortars are dead Mortars.

### D.4 Army Composition Templates

Based on all combat math above, these are the recommended army compositions for
different mission types:

**Standard Assault (Missions 1, 3, 5, 10, 13):**
- 6 Mudfoots (frontline)
- 2 Shellcrackers (ranged DPS)
- 1-2 Mortar Otters (AoE/siege)
- 1 Sapper (building destruction)
- 4 River Rats (economy)
- Pop: 15-16

**Wave Defense (Missions 6, 16):**
- 8-10 Mudfoots (rotational frontline)
- 3-4 Shellcrackers (static ranged positions)
- 2 Mortar Otters (AoE chokepoint coverage)
- 4-5 River Rats (continuous gathering)
- Buildings: 2+ Watchtowers, sandbag perimeter, Fish Traps, Field Hospital
- Pop: 18-22

**Commando (Missions 4, 8, 9, 12):**
- Fixed force, no production. Composition pre-set per mission.
- Key principle: preserve every unit. No acceptable losses.
- Split force into scout element (Divers/fast units) and combat element (Mudfoots/SC).

**Amphibious (Missions 7, 14):**
- 3-4 Raftsmen (transport)
- 2-3 Divers (naval combat + stealth)
- 4-6 Mudfoots (landing force)
- 2 Shellcrackers (beach suppression)
- 1 Mortar Otter (shore bombardment)
- Pop: 14-18

**Boss Fight (Mission 15):**
- 6 Mudfoots (tank/distract)
- 3 Shellcrackers (sustained DPS)
- 2 Mortar Otters (high burst DPS)
- 2 Sappers (Breach Charges on boss)
- Heroes: Splash (flanking DPS), Fang (anti-building), Bubbles (Rally Cry buff)
- Pop: 16-20

---

*End of document. Total sections: 10 + 4 appendices.*
*Covers: economy model, combat math, all 16 missions, PRNG tables, progression curve,*
*difficulty system, veterancy, loot tables, validation tests, tuning knobs, movement*
*calculations, kiting math, and army composition templates.*
