# Mission Design Guide

## What Makes a Good Mission

Every mission needs ONE memorable moment. Not just "destroy the enemy base" — a specific scripted beat that surprises the player. Examples:
- Mission 2: The third ambush is larger than expected — the player learns to scout ahead
- Mission 4: The alarm triggers and the player must adapt from stealth to escape
- Mission 8: Discovering the underwater path — a mechanic reveal
- Mission 11: Wave 8 comes from an unexpected direction
- Mission 15: The sludge starts flooding and the music shifts

## Mission Structure Template

```
1. BRIEFING (30-60s)
   - Portrait + 3-5 dialogue lines
   - First line: situation report (what's happening)
   - Middle lines: objective explanation (what you need to do)
   - Last line: character response (Sgt. Bubbles acknowledges)

2. OPENING (30s-2min)
   - Player sees the map, orients
   - Starting resources displayed
   - Tutorial prompt if new mechanic (first 4 missions only)
   - If pre-built base: player surveys their position
   - If build-from-scratch: player begins gathering

3. RISING TENSION (2-5min)
   - First enemy contact (or first objective challenge)
   - Scripted event: reinforcements arrive, weather changes, new threat revealed
   - Player is building their response

4. CLIMAX (2-5min)
   - Main objective engagement
   - All player resources committed
   - Highest intensity moment

5. RESOLUTION
   - Objective complete → victory transition
   - If bonus objectives remain → player decides to pursue or exit
   - Star rating calculated
```

## Terrain Declaration Format

### Regions (Coarse)
Regions paint broad strokes. A mission starts with a base region that fills the entire map, then overlays specific areas.

```typescript
terrain: {
  width: 48,  // tiles
  height: 40, // tiles
  regions: [
    // Base layer — fills entire map
    { terrainId: 'grass', fill: true },

    // Beach along the southern edge
    { terrainId: 'beach', rect: { x: 0, y: 32, w: 48, h: 8 } },

    // River running east-west
    { terrainId: 'water', river: { points: [[0, 20], [20, 18], [48, 22]], width: 3 } },

    // Dense jungle in the north
    { terrainId: 'mangrove', rect: { x: 5, y: 0, w: 38, h: 12 } },

    // Mud around the river
    { terrainId: 'mud', rect: { x: 0, y: 16, w: 48, h: 2 } },
    { terrainId: 'mud', rect: { x: 0, y: 23, w: 48, h: 2 } },
  ],
  overrides: [
    // Bridge crossing
    { x: 24, y: 18, terrainId: 'bridge' },
    { x: 24, y: 19, terrainId: 'bridge' },
    { x: 24, y: 20, terrainId: 'bridge' },

    // Clearing for player base
    { x: 22, y: 34, terrainId: 'dirt' },
    { x: 23, y: 34, terrainId: 'dirt' },
    { x: 24, y: 34, terrainId: 'dirt' },
    // (etc. — small area)
  ],
}
```

### Placement Zones
Named rectangles that entity groups scatter within.

```typescript
zones: {
  ura_start:        { x: 20, y: 32, width: 8, height: 6 },
  fishing_spot:     { x: 10, y: 25, width: 4, height: 3 },
  timber_grove:     { x: 30, y: 5, width: 10, height: 8 },
  enemy_patrol:     { x: 15, y: 10, width: 20, height: 5 },
  salvage_area:     { x: 40, y: 15, width: 5, height: 5 },
},
```

### Entity Placements

```typescript
placements: [
  // Player starting units — scattered in zone
  { type: 'river_rat', zone: 'ura_start', count: 3, faction: 'ura' },

  // Resources — key ones at exact coords, clusters in zones
  { type: 'fish_spot', x: 12, y: 26, faction: 'neutral' },
  { type: 'mangrove_tree', zone: 'timber_grove', count: 15, faction: 'neutral' },
  { type: 'salvage_cache', x: 42, y: 17, faction: 'neutral' },

  // Enemies — patrol zone with waypoints
  { type: 'gator', zone: 'enemy_patrol', count: 2, faction: 'scale_guard',
    patrol: [[15, 10], [35, 12], [15, 10]] },

  // Objective entity at exact position
  { type: 'siphon', x: 35, y: 8, faction: 'scale_guard' },
],
```

## Trigger Patterns

### Timer Trigger
```typescript
{ condition: { type: 'timer', seconds: 300 },
  action: { type: 'spawnUnits', units: [{type:'gator',x:5,y:5,count:3}] },
  once: true }
```

### Objective Completion Trigger
```typescript
{ condition: { type: 'objectiveComplete', objectiveId: 'destroy_siphon_1' },
  action: { type: 'showDialogue', portrait: 'foxhound',
            text: 'Siphon neutralized! Two more to go.' },
  once: true }
```

### Area Enter Trigger
```typescript
{ condition: { type: 'areaEntered', zone: 'ambush_point', faction: 'ura' },
  action: { type: 'spawnUnits', units: [{type:'gator',zone:'ambush_spawn',count:4}] },
  once: true }
```

### HP Threshold Trigger (Boss)
```typescript
{ condition: { type: 'healthThreshold', entityType: 'siphon', hpPercent: 50 },
  action: { type: 'showDialogue', portrait: 'gen_whiskers',
            text: 'It\'s fighting back! Watch the sludge!' },
  once: true }
```

## Dialogue Standards

- **FOXHOUND** (Missions 1-3): Professional, clipped military comms. "Copy that." "Confirm visual." "FOXHOUND out."
- **Gen. Whiskers** (Missions 4+): Gruff, experienced, colorful. "Listen up, Bubbles..." "Those scale-skins won't know what hit 'em." Always has a cigar metaphor.
- **Sgt. Bubbles** (Player character responses): Confident but not cocky. "River Rats, move out." "We've got a job to do."
- **Enemy commanders** (Rare): Cold, predatory. Scale-Guard speak in short, menacing fragments.

Max 5 lines per briefing. Max 1 line per in-mission event. Players skip long dialogue.

## Difficulty Per Chapter

| Chapter | Player Knowledge | Mission Complexity |
|---------|-----------------|-------------------|
| 1 (First Landing) | Learning mechanics | Simple objectives, generous resources, few enemies |
| 2 (Into the Soup) | Comfortable with basics | Multi-objective, resource pressure, weather |
| 3 (Heart of Darkness) | Experienced | Multi-front warfare, territory control, siege |
| 4 (The Great Siphon) | Mastery expected | Everything combined, time pressure, boss mechanics |
