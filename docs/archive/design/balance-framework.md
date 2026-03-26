# Balance Framework

## Design Philosophy

The player should win through COMPOSITION and POSITIONING, not unit spam. Every unit has a counter. Every strategy has a weakness.

## Unit Counter Matrix

| Attacker → | Mudfoot | Shellcracker | Sapper | Mortar | Gator | Viper | Snapper |
|-----------|---------|-------------|--------|--------|-------|-------|---------|
| **Mudfoot** | Even | Loses | — | — | Loses | Wins | — |
| **Shellcracker** | Wins | Even | — | — | Wins | Even | Loses |
| **Sapper** | — | — | — | — | — | — | Wins |
| **Mortar Otter** | — | — | — | Even | Wins (AoE) | Wins (AoE) | Wins |
| **Gator** | Wins | Loses | — | Loses | Even | — | — |
| **Viper** | Loses | Even | — | Loses | — | Even | — |
| **Snapper** | — | Wins | Loses | Loses | — | — | Even |

**Key interactions:**
- Mudfoot beats Viper (closes range fast, Viper is fragile)
- Shellcracker beats Gator (kites at range 5, Gator speed 5 can't close)
- Gator beats Mudfoot (120 HP + 4 armor vs 80 HP + 2 armor, 18 vs 12 damage)
- Mortar beats groups (AoE splash wipes clusters)
- Sapper beats buildings (30 base damage vs buildings, 45 with research)
- Snapper beats ranged (anchored turret, 14 damage at range 6, outranges Shellcracker range 5)

## Economy Curves

### Fish Income Sources
| Source | Rate | Available |
|--------|------|-----------|
| Worker gathering | ~10 fish per trip (8s round trip) | Immediate |
| Fish Trap | +3 fish per 10s | After building (100 Timber) |
| Liberated village | +1 fish per 10s | Mission 10+ |

**Target income at 5 min mark:** 3 workers + 2 fish traps = ~15 fish/10s + 30 fish per minute gathering ≈ 120 fish/min. Enough to train 1 Mudfoot per minute with surplus for buildings.

### Build Order (Support difficulty, Mission 1)
```
0:00  Start with 3 River Rats, 0 resources → gather timber
0:30  Build Command Post (starts at mission start in most missions)
1:00  Build Barracks (200 Timber)
1:30  Build Fish Trap (100 Timber)
2:00  Train first Mudfoot (80 Fish, 20 Salvage)
2:30  Build Burrow (80 Timber) — pop cap 4→10
3:00  Train 2 more Mudfoots
4:00  Have 3 Mudfoots + 3 workers. Stable economy.
```

### Tension Points
- **Timber scarcity:** Trees near base deplete by minute 3-4. Player MUST expand.
- **Salvage hunger:** Advanced units and research need Salvage, which only comes from combat loot + caches. Rewards aggression.
- **Pop cap ceiling:** Burrows cost Timber that could go to buildings. Every Burrow is a Barracks delayed.

## Difficulty Scaling

### Enemy Wave Sizes (Defense Missions)
| Wave | Support | Tactical | Elite |
|------|---------|----------|-------|
| 1 | 2 Gators | 3 Gators | 4 Gators |
| 4 | 3 Gators + 1 Viper | 4 Gators + 2 Vipers | 5 Gators + 3 Vipers |
| 8 | 4 mixed + 1 Champion | 6 mixed + 2 Champions | 8 mixed + 3 Champions |

### Par Times (for Gold star)
| Mission | Par Time | Notes |
|---------|----------|-------|
| 1 Beachhead | 8 min | Tutorial pace |
| 2 Causeway | 6 min | Escort is timed by convoy speed |
| 3 Firebase Delta | 10 min | Must hold points for 2 min |
| 4 Prison Break | 5 min | Stealth can be fast |
| 5 Siphon Valley | 12 min | Full base build + 3 objectives |
| 6 Monsoon Ambush | 10 min | 8 waves, fixed duration |
| 7 River Rats | 8 min | CTF pace |
| 8 Underwater Cache | 6 min | Hero mission |
| 9 Dense Canopy | 12 min | Full skirmish |
| 10 Healer's Grove | 12 min | 5 villages |
| 11 Entrenchment | 15 min | 12 waves |
| 12 The Stronghold | 12 min | Siege |
| 13 Supply Lines | 12 min | Multi-base |
| 14 Gas Depot | 6 min | Demolition hero |
| 15 Sacred Sludge | 15 min | Largest map |
| 16 The Reckoning | 20 min | 3-phase boss |

## Research Impact

Research should feel MEANINGFUL — noticeable in the next engagement after completing it.

| Research | Before | After | Feels Like |
|----------|--------|-------|-----------|
| Hardshell Armor | Mudfoot dies in 5 Gator hits | Dies in 6 hits | "My guys are tougher" |
| Fish Oil Arrows | Shellcracker needs 12 shots to kill Gator | Needs 10 shots | "Noticeably faster kills" |
| Demolition Training | Sapper needs 4 hits on barracks | Needs 3 hits | "Walls crumble faster" |
| Fortified Walls | Sandbag wall (150 HP) | Stone wall (400 HP) | "Actually holds a line" |

## Testing Balance

Balance is validated through automated combat simulations, NOT manual playtesting alone:

```typescript
// Test: 3 Mudfoots vs 2 Gators → Mudfoots should win with 1-2 survivors
// Test: 1 Gator vs 1 Mudfoot → Gator wins with >50% HP remaining
// Test: 2 Shellcrackers vs 1 Gator → Shellcrackers win (kiting)
// Test: 5 workers gathering for 60s → expect ~120 fish collected
// Test: Building a barracks from 0 resources → expect ~90s with 2 workers
```

These tests run in Vitest (no rendering needed — pure ECS simulation). If a unit stat change breaks the expected combat outcome, the test fails before the sprite is ever drawn.
