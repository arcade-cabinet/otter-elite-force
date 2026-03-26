# Mission Design Framework

## Map Standard
- **Minimum**: 128x96 tiles (4096x3072px)
- **Standard**: 128x128 tiles (4096x4096px)
- **Large**: 160x128 or 160x160 for expansive missions
- Tile size: 32x32px

## Zone Design
- Every mission has 4-8 named zones
- Zones define discovery triggers, enemy placements, and fog reveal
- Zone format: `{ x, y, width, height }` in tile coordinates
- Zones can overlap (e.g., a patrol route crossing multiple terrain zones)

## Phase System
- 2-4 phases per mission
- Each phase has: entry condition, new objectives, dialogue, enemy spawns
- Phases unlock zones, reveal fog, and escalate difficulty
- Phase transitions triggered by: objective completion, zone entry, timer, or enemy count

## Command Structure (Radio Contacts)
- **Gen. Whiskers** (HQ) — campaign-level orders, victory/defeat announcements
- **Col. Bubbles** (Tactical) — mission briefings, tactical directives, primary radio contact
- **FOXHOUND** (Intel) — enemy positions, threat warnings, zone intel
- **Medic Marina** (Medical) — casualty reports, field hospital updates (later missions)
- **Player = Captain** — silent protagonist, commands from the lodge

## Win/Lose Conditions
- **Standard Win**: Complete all primary objectives
- **Standard Lose**: Lodge destroyed (player's field HQ)
- **Commando missions** (no lodge): All units killed, or VIP killed
- **Defense missions**: Specific building/entity survives
- **Bonus objectives**: Optional, award extra resources/unlocks

## Lodge Mechanics
- Lodge = player's command post, always present (except commando missions)
- Resource drop-off point
- Units auto-retreat to lodge at 25% HP
- Camera starts centered on lodge

## Document Format Per Mission
Each mission doc contains:
1. **Header** — ID, name, chapter, map size, setting, win/lose
2. **Zone Map** — ASCII art showing zone layout + terrain
3. **Phases** — Detailed progression with entry conditions
4. **Placements** — Starting units, buildings, resources, enemies per zone
5. **Dialogue Script** — Every radio line with trigger ID and speaker
6. **Trigger Flowchart** — Mermaid diagram of trigger chain
7. **Balance Notes** — Par time, difficulty scaling, resource pacing
