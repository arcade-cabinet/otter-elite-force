# Art Direction Bible

## Visual Identity

Pixel art rendered from ASCII character grids at runtime. Every visual element in the game is defined as a grid of characters mapped to a shared color palette. The aesthetic targets late-80s/early-90s PC strategy games — chunky, readable, characterful pixels.

## The Palette

A shared constant (`PALETTE`) maps single characters to hex colors. ALL sprites in the game use this same palette. This ensures visual cohesion — every entity shares the same color language.

| Char | Hex | Name | Used For |
|------|-----|------|----------|
| `.` | transparent | — | Empty pixels |
| `#` | #000000 | Black | Outlines, shadows |
| `S` | #ffcc99 | Skin Light | Otter faces, hands |
| `s` | #eebb88 | Skin Dark | Otter shadow/detail |
| `B` | #1e3a8a | Blue Primary | URA uniforms |
| `b` | #3b82f6 | Blue Secondary | URA highlights |
| `R` | #7f1d1d | Red Primary | Scale-Guard base |
| `r` | #ef4444 | Red Secondary | Scale-Guard highlights |
| `G` | #166534 | Dark Green | Jungle, leaves |
| `g` | #22c55e | Light Green | Foliage highlights, otter skin |
| `W` | #78350f | Dark Wood | Tree trunks, structures |
| `w` | #b45309 | Light Wood | Wood highlights |
| `Y` | #eab308 | Gold | Resources, accents |
| `y` | #fef08a | Light Gold | Gold highlights |
| `C` | #4b5563 | Dark Stone | Stone, metal |
| `c` | #9ca3af | Light Stone | Stone highlights, armor |
| `M` | #1f2937 | Dark Interior | Building doorways, caves |
| `T` | #0d9488 | Teal | Otter-specific accent |
| `t` | #5eead4 | Light Teal | Otter highlights |
| `O` | #c2410c | Orange | Enemy accent, fire |
| `o` | #fb923c | Light Orange | Enemy highlights |
| `P` | #7e22ce | Purple | Poison, special effects |
| `p` | #c084fc | Light Purple | Magic/special highlights |

**Rule:** If a sprite needs a color not in the palette, ADD it to the palette — never use raw hex in a sprite definition. The palette is the source of truth for all colors.

## Sprite Size Standards

| Entity Type | Grid Size | Rendered At (3x) | Notes |
|------------|-----------|-------------------|-------|
| Units | 16×16 | 48×48 px | All units same footprint for readability |
| Buildings | 32×32 | 96×96 px | 2x unit size. Dominant on map. |
| Terrain tiles | 16×16 | 48×48 px | Seamless tiling |
| Portraits | 64×96 | 64×96 px (1x) | Already large. High detail. |
| Props | 16×16 | 48×48 px | Same as units |

Scale factor adapts to device: 2x on small phones, 3x on tablets/desktops, 4x on high-DPI desktops. The grid size is constant — only the pixel multiplier changes.

## Sprite Construction Rules

### Units (16×16)

Every unit sprite follows this anatomy:

```
Row 0-3:   Head (4 rows)
Row 4-9:   Torso + arms (6 rows)
Row 10-14: Legs (5 rows)
Row 15:    Empty (shadow space)
```

**Head:** 4×4 centered block. Skin color for otters (S/s), green (G/g) for Scale-Guard reptiles. Helmet/hair detail on top row.

**Torso:** 6×6 centered block. Faction primary color (B for URA, R for Scale-Guard). Secondary color for chest detail. Arms extend 1px on each side in skin color.

**Equipment:** Weapons/tools rendered as 1-2px wide extensions:
- Workers: tool handle (W) on left side
- Infantry: sword (c/C) on left, shield (W) on right
- Ranged: bow (W) extending right side
- Siege: explosive pack (Y) at feet

**Legs:** 2×3 blocks with 2px gap between. Boot color (W/w). Walk animation shifts legs.

**Faction identification at a glance:** URA = blue torso. Scale-Guard = red torso. Neutral = gold/brown. This must be instantly readable at game zoom.

### Buildings (32×32)

Every building follows this anatomy:

```
Row 0-7:   Roof (8 rows) — faction-colored
Row 8-23:  Walls (16 rows) — wood/stone with windows/door
Row 24-27: Foundation (4 rows) — stone base
Row 28-31: Shadow/ground (4 rows)
```

**Roof shape** identifies the building type:
- Town Hall: wide triangular roof (blue/red)
- Barracks: flat battlements (stone)
- Farm: peaked thatch roof (gold)
- Tower: tall narrow profile

**Door:** Always centered, 4px wide, dark (M color). This is the rally point indicator.

**Windows:** 4×4 blocks of stone (c/C) on each side of door.

### Portraits (64×96)

Full character bust. Much more detail than unit sprites. These are the "paintings" of the game.

```
Row 0-15:   Background / cap / helmet
Row 16-50:  Face — eyes, nose, mouth, whiskers for otters
Row 51-80:  Shoulders, chest, uniform detail
Row 81-95:  Fade to background
```

**Key detail requirements:**
- Eyes must be expressive (at least 3×3 with highlight dot)
- Uniform faction colors visible
- Character-specific details: Whiskers' cigar, Splash's goggles, Fang's scars
- FOXHOUND wears a radio headset

## Animation System

### Frame Counts Per Animation

| Animation | Frames | Rate (fps) | Notes |
|-----------|--------|-----------|-------|
| idle | 1 | — | Static. All entities need this. |
| walk | 2-4 | 6-8 | Leg alternation. Smooth but readable. |
| attack | 2-3 | 8-10 | Wind-up + strike. Quick. |
| gather | 2 | 4 | Tool swing for workers. |
| death | 1 | — | Fallen pose (optional, can just remove sprite). |
| build | 2 | 4 | Hammer/wrench motion for workers. |

**Rule:** idle is ALWAYS frame 0 of the idle animation. This is the default texture key. Other frames are `{id}_walk_0`, `{id}_walk_1`, etc.

### Animation Transitions

```
idle ──(move order)──→ walk ──(arrive)──→ idle
idle ──(attack order)──→ walk ──(in range)──→ attack ──(target dead)──→ idle
idle ──(gather order)──→ walk ──(at resource)──→ gather ──(full)──→ walk ──(at depot)──→ idle
```

Buildings don't animate (or have a 2-frame "working" animation when producing).

### Directional Facing

Units face left or right. The sprite is drawn facing RIGHT. When moving left, flip horizontally (`sprite.setFlipX(true)` in Phaser). This halves the sprite art needed.

## Terrain Painting

Terrain is NOT tile-by-tile sprites. It's a large painted Canvas background, like the POC's `buildMap()`.

### Per-Terrain Paint Rules

| Terrain | Base Color | Noise Colors | Noise Density | Notes |
|---------|-----------|-------------|---------------|-------|
| Grass | #14532d | #166534, #15803d | 0.3 | Standard ground |
| Dirt | #713f12 | #854d0e, #92400e | 0.25 | Paths, clearings |
| Beach | #d4a574 | #c4956a, #b8865e | 0.2 | Coastal areas |
| Mud | #5c4033 | #6b4c3b, #4a3428 | 0.35 | Slow terrain, swampy |
| Water | #1e3a5f | #1e40af, #2563eb | 0.4 | Animated shimmer (post-paint) |
| Mangrove | #0f3d0f | #1a4a1a, #0d2d0d | 0.4 | Dense, dark, blocks vision |
| Toxic sludge | #2d1b4e | #4a1d7a, #3b0d6b | 0.5 | Bubbling, purple tint |
| Bridge | #8B6914 | #7a5c12, #6b4e10 | 0.15 | Wooden planks over water |

The painter fills the base color, then scatters noise pixels at the specified density for organic variation. Rivers get extra treatment: a serpentine path painted with water rules, bank edges blended with adjacent terrain.

## Visual QC Checklist

Before a sprite is considered "done":

- [ ] All characters in the grid exist in PALETTE
- [ ] Grid is exactly the declared size (no short/long rows)
- [ ] Renders visibly at 1x, 2x, 3x scale (not a blob)
- [ ] Faction is identifiable at game zoom (blue = URA, red = enemy)
- [ ] Silhouette is distinct from other units of same size
- [ ] Animation frames transition smoothly (no jarring jumps)
- [ ] Portrait: eyes are visible, expression is readable
- [ ] Screenshot comparison against POC sprites at same scale
