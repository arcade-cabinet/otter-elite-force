# Gap Analysis: OEF vs Reference POCs and Design Vision

**Date:** 2024-03-24
**Scope:** Comprehensive comparison of our current implementation against all five reference materials.

---

## Reference Materials Analyzed

| # | Reference | What It Represents |
|---|-----------|-------------------|
| 1 | `poc.html` — Pond Warfare | Canvas RTS with procedural otter/gator sprites, fog of war, minimap, synth audio, day/night cycle, full build/train/fight loop |
| 2 | `poc_warcraft.html` — Warcraft-Style RTS | Same engine but Warcraft-themed; adds projectile system, archer unit, guard tower auto-fire, rally points, floating damage text |
| 3 | `poc_handdrawn.html` — ASCII Sprite RTS | Best pixel art of the three POCs; hand-drawn ASCII sprite maps for every entity, construction progress animation, spawn queue indicators |
| 4 | `Gemini-Conversation.md` | Iteration history showing how each POC version added fog, minimap, projectiles, rally points, peace timer, and satisfying harvest feedback |
| 5 | `Copilot-Copilot_Chat_VT91k21R.md` | Rich design bible: SP-DSL concept, complete Tailwind palette, component styling (canvas textures, rivets, phosphor minimap, manila briefings), faction identity, unit/building tech trees, 4-tier progression, mobile parity rules |

---

## 1. SPRITE QUALITY

### What the POCs Do

- **poc.html**: Procedural pixel art using `SpriteGen.generate()` — paints pixels via `rect()`, `circle()`, and `p()` helpers. Each otter has a body, belly, nose, eyes, arms, legs, tail, and faction-identifying equipment (clam for gatherer, stick+helmet for brawler, slingshot for sniper). Gators have scutes, snout, eye, legs. Buildings are mud lodges with sticks, armories with training pools, towers with slit windows. 16px units scaled 2.5x, 32px buildings scaled 3x. Characters are **instantly readable** at game zoom.
- **poc_handdrawn.html**: ASCII character grids (`SPRITE_DATA`) mapped through a `PALETTE` object. Every sprite is a hand-tuned 16x16 or 32x32 grid of characters. Peasants have skin, armor layers, boots, tools. Buildings have roofs, walls, windows, doors, scaffolding. Trees have randomized leaf canopies. The detail level per pixel is higher than the procedural approach — you can see individual windows, roof tiles, door frames.
- **poc_warcraft.html**: Same procedural approach as poc.html but Warcraft-themed. Adds equipment differentiation (sword+shield for footman, bow for archer).

### What We Have

- SP-DSL layered sprites: `body`, `uniform`, `weapon` as separate numeric grids composited at render time. 7 URA units, 7 SG units, 6 heroes, 12 URA buildings, 6 SG buildings, 3 resources, 2 props, 7 portraits — all with multi-layer SP-DSL definitions.
- Palette system (`palettes.ts`) with named palettes per faction.
- Sprite compiler (`compiler.ts`) + atlas system (`atlas.ts`) for batched rendering.

### Gap Assessment

| Dimension | POCs | Us | Verdict |
|-----------|------|----|---------|
| Entity count | ~8 types total | 40+ entity types | **WE WIN** |
| Layer system | Single flat sprite | Multi-layer compositing (body/uniform/weapon) | **WE WIN** |
| Animation frames | None (static sprites) | Walk cycle with layer overrides | **WE WIN** |
| Portrait art | None | 7 hand-drawn 64x96 portraits | **WE WIN** |
| Visual readability | Excellent — faction colors pop at 2.5x zoom | Untested at runtime — need visual QC | **UNKNOWN** |
| Character personality | Good — equipment tells role at a glance | Numeric grids harder to visually validate | **NEEDS QC** |

**Priority actions:**
1. **Visual QC in browser** — render every sprite at game zoom and verify readability. Our numeric grids are harder to eyeball than ASCII chars.
2. Verify faction colors (URA blue vs SG red) are as instantly distinguishable as POC palette choices.
3. Ensure building silhouettes are distinct — POC buildings each have a unique roof shape that makes them identifiable.

---

## 2. UI/UX FEEL

### What the POCs Do

All three POCs implement a **classic RTS sidebar layout** in a single HTML file:

- **Left sidebar** (256px wide) with three stacked panels:
  1. **Minimap** (200x200 canvas) with clickable/draggable camera rectangle, unit pips color-coded by faction
  2. **Selection info panel** showing entity name, HP bar (green fill on red background), stats (HP/MaxHP | Dmg), status text, description
  3. **Action panel** (2-column grid) with context-sensitive buttons — build options when worker selected, train options when building selected, cost tooltips

- **Top resource bar** spanning the game area — shows Gold/Clams, Wood/Twigs, Food (current/max), game clock (Day X - HH:MM), threat status ("Peaceful (Xs)" / "Under Attack!")

- **Everything is HTML/CSS** with Tailwind — buttons have inset borders, gradient backgrounds, active states that flip the border direction (classic Win95 beveled button feel). Disabled buttons are greyed + desaturated.

- **Building placement ghost** — translucent sprite follows cursor, green/red overlay indicates affordability.

### What We Have

- React components: `ResourceBar`, `Minimap`, `ActionBar`, `BuildMenu`, `UnitPanel`, `AlertBanner`
- `MainMenu` with New Deployment / Continue / Canteen / Settings
- `BriefingScreen` with portrait + typewriter dialogue
- `CampaignMap` for mission selection
- `SettingsPanel`, `CanteenScreen`
- Mobile-specific: `SquadTabs`, `CommandButtons`, `RadialMenu`

### Gap Assessment

| Dimension | POCs | Us | Verdict |
|-----------|------|----|---------|
| Sidebar layout | Fully integrated, responsive | React components exist but layout untested | **NEEDS VALIDATION** |
| Minimap | Working canvas with camera drag, unit pips, faction colors | Placeholder "RADAR" text with CSS grid overlay | **THEY WIN** |
| Selection info panel | HP bar, stats, status, description — updates live | `UnitPanel` exists but data binding to ECS untested | **NEEDS VALIDATION** |
| Action panel | Context-sensitive buttons with cost display, affordability gating | `BuildMenu` + `ActionBar` exist | **NEEDS VALIDATION** |
| Resource bar | Live-updating counters with colored icons | Koota-bound `ResourceBar` component | **PARITY** |
| Building placement | Ghost sprite + green/red overlay | Likely not implemented yet in Phaser layer | **THEY WIN** |
| Button feel | Classic beveled Win95 inset/outset borders, active press animation | shadcn Base UI components — need to verify tactical theme | **NEEDS VALIDATION** |
| Game clock / day-night | Top bar clock + day-night overlay with opacity transitions | Weather system exists but no clock UI visible | **THEY WIN** |
| Threat indicator | "Peaceful (Xs)" / "Under Attack!" with pulse animation | `AlertBanner` exists | **NEEDS VALIDATION** |
| Menu system | None — straight into gameplay | Full menu flow: Main -> Difficulty -> Campaign -> Briefing -> Game | **WE WIN** |
| Briefing screen | None | Manila-folder themed briefing with portrait + typewriter text | **WE WIN** |
| Mobile input | None — desktop only | `RadialMenu`, `CommandButtons`, `SquadTabs`, gesture detection | **WE WIN** |

**Priority actions:**
1. **Minimap must become functional** — this is the #1 most visible gap. POC minimaps are fully interactive with camera dragging. Ours is a CSS placeholder.
2. Implement building placement ghost with green/red overlay in the Phaser layer.
3. Add game clock display and day/night cycle to the HUD.
4. Wire action panel to show context-sensitive commands based on selection.

---

## 3. GAMEPLAY LOOP

### What the POCs Do

All three POCs implement the **complete Warcraft 1 gameplay loop** in ~800 lines of JS:

1. **Gather**: Workers right-click resources (trees/gold mines or cattails/clam beds). Walk to resource -> gather timer (2s) -> pick up 10 units -> walk to town hall/lodge -> deposit -> floating "+10 Gold" text -> auto-return to resource. This loop is **satisfying** because of the visual feedback (carrying indicator, floating text, sound).

2. **Build**: Select worker -> click build button (cost shown) -> ghost follows cursor -> left-click to place -> workers auto-walk to construction site -> building rises from 1 HP with increasing opacity + scaffolding outline -> construction complete sound.

3. **Train**: Select building -> click train button (cost + food shown) -> deduct resources -> spawn queue with progress bar -> unit pops out -> auto-walks to rally point if set.

4. **Fight**: Right-click enemy to attack. Melee units chase and swing. Ranged units fire projectiles (tracking, with particle trails). Floating damage text. Hit particles (red splatter). Death removes entity. Guard towers auto-target enemies in range.

5. **Win/Lose**: Destroy all enemy camps = victory. Lose town hall = defeat. Banner overlay with sound.

Additional systems:
- **Peace timer**: 2-minute grace period. Status bar shows countdown. After timer, waves spawn from enemy camps with escalating size.
- **Day/night cycle**: Visual overlay changes opacity based on hour. Clock display shows Day X - HH:MM.
- **Fog of war**: Black overlay with radial gradient cutouts around friendly units/buildings. Buildings have larger vision radius.
- **Rally points**: Right-click ground with building selected. Dashed line + dot visual. New units march to rally point.
- **Floating damage text**: "+10 Gold", "-6 HP" — rises and fades. Black outline for readability.
- **Projectile system**: Arrows/pebbles track targets, travel with speed, leave particle trails, deal damage on arrival.
- **Construction percentage**: Buildings start at 1 HP, gain HP as workers build, visual opacity increases, scaffolding outline visible during construction.
- **Separation steering**: Units push away from each other to prevent stacking.

### What We Have

- **ECS systems**: `combatSystem`, `fogSystem`, `weatherSystem`, `siegeSystem`, `siphonSystem`, `demolitionSystem`, `scenarioSystem` — all with test coverage
- **AI**: Yuka FSM with states/profiles/runner, A* pathfinder with graph builder, steering factory, skirmish AI
- **Scenarios**: Full scenario engine with triggers, actions, and 16 mission definitions across 4 chapters
- **Input**: Selection manager, command dispatcher, gesture detector for mobile
- **Persistence**: SQLite database with campaign/save/settings repos

### Gap Assessment

| Dimension | POCs | Us | Verdict |
|-----------|------|----|---------|
| Gather loop | Working: walk->harvest->carry->deposit->repeat | ECS traits exist (orders, spatial) but untested end-to-end in browser | **NEEDS INTEGRATION** |
| Building placement + construction | Ghost placement, opacity rise, scaffolding, completion sound | Systems defined but visual integration unknown | **NEEDS INTEGRATION** |
| Training queue + spawn | Working with progress bar and rally point march | Production system defined in architecture | **NEEDS INTEGRATION** |
| Combat with projectiles | Tracking projectiles, particle trails, floating damage | `combatSystem` exists with tests | **NEEDS INTEGRATION** |
| Floating damage/resource text | Working in all POCs | Not found in codebase | **THEY WIN** |
| Rally point visuals | Dashed line + dot on minimap | Not found in codebase | **THEY WIN** |
| Peace timer / wave spawner | Working escalating wave system | `scenarioSystem` has trigger-based wave logic | **PARITY (design)** |
| Win/lose detection | Per-frame checks, banner overlay | Scenario engine handles victory/defeat triggers | **PARITY (design)** |
| Day/night cycle | Overlay opacity + clock display | Weather system exists but no time-of-day visual | **THEY WIN** |
| Separation steering | Simple but effective push-apart | Yuka steering with proper separation behaviors | **WE WIN** |
| AI behavior | Random wander + attack nearest during war | FSM profiles with patrol, guard, aggressive, etc. | **WE WIN** |
| Scenario variety | One game mode (destroy all camps) | 8 objective types across 16 missions | **WE WIN** |
| Save/persistence | None | SQLite + Zustand with campaign/save repos | **WE WIN** |
| Pathfinding | Direct walk (no obstacles) | A* with navmesh graph | **WE WIN** |

**Priority actions:**
1. **Floating damage/resource text** — implement immediately. This is the single biggest "game feel" feature the POCs have that we lack. Every "+10 Fish" and "-6 HP" makes the game feel alive.
2. **Rally point visualization** — dashed line from building to rally point.
3. **Construction progress visual** — building opacity rising from foundation to complete.
4. **End-to-end integration testing** — our systems exist in isolation; they need to work together in the Phaser game loop.

---

## 4. MAP / TERRAIN

### What the POCs Do

- Pre-rendered background canvas (MAP_WIDTH * TILE_SIZE) painted with noise:
  - Base fill (dark green for grass, deep water for swamp)
  - 30,000-50,000 random noise pixels for texture variation
  - 50-100 random circular patches (dirt on grass, mud on water) using polar coordinate scatter
- Result: organic, varied terrain that reads as "jungle floor" or "swamp" without any tile seams

### What We Have

- `map-painter.ts` using `paintMap()` from mission terrain data
- `tiles.ts` for terrain tile definitions
- 16 mission maps with terrain zones

### Gap Assessment

| Dimension | POCs | Us | Verdict |
|-----------|------|----|---------|
| Terrain generation | Single pre-rendered canvas with noise | Tile-based painting from mission definitions | **DIFFERENT APPROACH** |
| Visual variety | Noise creates organic look — no visible tile grid | Tile-based may show grid seams | **NEEDS QC** |
| Map size | 80x80 tiles (2560x2560 px) | Per-mission maps of varying size | **WE WIN (variety)** |
| Terrain types | 2 (grass/water base + dirt patches) | Multiple terrain types per mission definition | **WE WIN** |

**Priority actions:**
1. Add noise/dither to tile rendering to break up grid regularity.
2. Visual QC tile seams in browser at game zoom.

---

## 5. SOUND

### What the POCs Do

- `AudioSys` object with Web Audio API (not Tone.js):
  - Simple oscillator + gain envelope per sound
  - ~10 SFX: chop, mine, build, hit, shoot, alert, click, win, lose
  - Frequency slides for character (e.g., `200Hz -> 100Hz` for chop gives a "snap" feel)
  - No music — SFX only
  - Triggered inline at point of gameplay event (hit, build, select)

### What We Have

- Full `AudioEngine` class wrapping Tone.js
- `SFXPlayer` with typed SFX catalog (14+ effects defined in design doc)
- `MusicPlayer` with 3 procedural tracks (menu, combat, briefing)
- Volume control with master/sfx/music separation
- Design doc specifies exact frequencies, durations, and oscillator types for every sound

### Gap Assessment

| Dimension | POCs | Us | Verdict |
|-----------|------|----|---------|
| SFX variety | ~10 basic synth bursts | 14+ designed effects | **WE WIN** |
| Music | None | 3 procedural tracks (menu/combat/briefing) | **WE WIN** |
| Audio init | Simple AudioContext on first click | Tone.start() on user gesture | **PARITY** |
| Feedback feel | Immediate — sounds fire inline with game events | Engine exists but sound-to-event wiring needs validation | **NEEDS INTEGRATION** |
| Volume control | None | Master/SFX/Music sliders with settings persistence | **WE WIN** |

**Priority actions:**
1. Verify all SFX are wired to gameplay events (hit, gather, build, select, etc.).
2. Ensure combat music fades in when fighting starts and fades out when it ends.

---

## 6. BRIEFING / NARRATIVE

### What the POCs Do

- **Nothing.** Zero narrative. No briefings, no story, no character dialogue. Jump straight into gameplay.

### What the Copilot Design Doc Envisions

- **Manila folder aesthetic** with paper grain
- Stamped mission codes
- Black-and-white recon photos
- Redacted lines for flair
- Typewriter text
- Commander's pawprint signature
- Dramatic pulp operation names ("Operation Mudslide Fury")
- Intel summary in military cadence with dry humor

### What We Have

- `BriefingScreen` component with portrait + typewriter dialogue
- `PortraitDisplay` component rendering SP-DSL portraits
- `DeployButton` CTA
- `BriefingData` interface with speaker, text, missionName, subtitle
- 7 character portraits (Foxhound, Sgt. Bubbles, Gen. Whiskers, Cpl. Splash, Sgt. Fang, Medic Marina, Pvt. Muskrat)

### Gap Assessment

| Dimension | POCs | Copilot Vision | Us | Verdict |
|-----------|------|----------------|----|---------|
| Briefing exists | No | Yes (detailed spec) | Yes | **WE WIN vs POCs** |
| Manila folder aesthetic | N/A | Paper grain, stamps, redactions | Not yet — dark bg + text | **COPILOT WINS** |
| Typewriter animation | N/A | Clacking typewriter effect | Click-to-advance text (no char-by-char animation) | **COPILOT WINS** |
| Recon photos | N/A | B&W intel photos | Not implemented | **COPILOT WINS** |
| Pawprint stamp | N/A | Commander signature flourish | Not implemented | **COPILOT WINS** |
| Operation names | N/A | Dramatic pulp titles | Mission names exist in definitions | **PARITY** |

**Priority actions:**
1. Add character-by-character typewriter animation with optional sound.
2. Add manila folder / dossier visual treatment (paper texture, stamp, redacted lines).
3. Consider adding a "TOP SECRET" stamp overlay and pawprint signature.

---

## 7. INPUT

### What the POCs Do

- **Left-click**: Select single entity (click) or drag-select rectangle (box select)
- **Right-click**: Context-sensitive command — move to ground, attack enemy, gather resource, build structure, return resources to town hall, set rally point
- **WASD / Arrow keys**: Camera pan (12px/frame)
- **Edge scroll**: Mouse near screen edge triggers camera pan
- **Minimap click/drag**: Click snaps camera, drag pans camera smoothly
- **Selection rectangle**: Green border + green fill (20% opacity) drawn in world space
- **Building placement**: Click to place, right-click to cancel

### What We Have

- `DesktopInput` with `SelectionManager` + `CommandDispatcher`
- `MobileInput` with gesture detection
- `GestureDetector` for pinch/zoom/pan
- `RadialMenu` for mobile commands
- `CommandButtons` for mobile action bar
- Camera controls in GameScene (WASD, arrows, edge scroll, zoom)

### Gap Assessment

| Dimension | POCs | Us | Verdict |
|-----------|------|----|---------|
| Click select | Working | SelectionManager exists | **PARITY (design)** |
| Box select | Working with green rectangle visual | SelectionManager exists | **NEEDS VISUAL QC** |
| Right-click commands | Full context sensitivity | CommandDispatcher exists | **NEEDS INTEGRATION** |
| Camera controls | WASD + edge scroll | Implemented in GameScene | **PARITY** |
| Minimap interaction | Click-to-snap + drag-to-pan with offset tracking | Placeholder — not functional | **THEY WIN** |
| Mobile support | None | Full mobile input system with gestures | **WE WIN** |
| Keyboard shortcuts | None | Not found | **PARITY** |

**Priority actions:**
1. Wire minimap to Phaser camera system — click and drag to pan.
2. Verify selection rectangle renders correctly in Phaser.
3. Test right-click command dispatch end-to-end.

---

## 8. MISSING FEATURES (POCs have, we do NOT)

| Feature | Where in POCs | Impact | Priority |
|---------|---------------|--------|----------|
| **Floating damage/resource text** | All three POCs — `floatingTexts` array, rises + fades, black outline | CRITICAL for game feel | P0 |
| **Interactive minimap** | All three — canvas with camera drag, unit pips | CRITICAL for playability | P0 |
| **Building placement ghost** | All three — translucent sprite + green/red overlay | HIGH for build loop | P1 |
| **Rally point visualization** | poc.html + poc_warcraft.html — dashed line + dot | MEDIUM for training feel | P1 |
| **Construction progress visual** | poc_handdrawn.html — opacity rise + scaffolding | HIGH for build satisfaction | P1 |
| **Game clock display** | poc.html + poc_warcraft.html — "Day 1 - 08:00" | LOW-MEDIUM for atmosphere | P2 |
| **Day/night overlay** | poc.html + poc_warcraft.html — blue/sky overlay with opacity | MEDIUM for atmosphere | P2 |
| **Spawn queue progress bar** | poc_handdrawn.html — blue bar under building | MEDIUM for training feedback | P2 |
| **Resource carrying indicator** | poc_handdrawn.html — colored square above unit head | LOW for visual clarity | P2 |
| **Projectile particle trail** | poc.html + poc_warcraft.html — 2px dots behind projectile | LOW for combat feel | P3 |
| **Victory/defeat banner** | All three — fullscreen overlay with title + description | MEDIUM for session closure | P1 |
| **Edge scroll with mouse-in detection** | All three — `mouse.in` flag prevents false triggers | LOW but important for polish | P2 |

---

## 9. ART DIRECTION: Copilot Vision vs Implementation

The Copilot conversation defines an extremely specific visual direction that should permeate every pixel:

### What Copilot Envisions

**Theme:** "Sgt. Rock meets Apocalypse Now... but with elite otters"

- **Canvas/metal textures** on all panels (paper grain, scratched metal, damp canvas)
- **Riveted corners** on panels
- **Stenciled military typography** (Black Ops One for headers, typewriter for body, monospace for numbers)
- **Phosphor-green radar** minimap with CRT curvature, grid lines, sweep line, blinking pips
- **Manila folder** briefings with stamps, redacted lines, pawprint signatures
- **No rounded corners** — military UI is all sharp rectangles
- **Palette:** jungle-950 through jungle-500, khaki-900 through khaki-100, rust tones, steel tones, alert orange, phosphor green, highlight yellow
- **Faction identity:** URA = rounded-but-rugged, pawprints, fishbone insignias; SG = angular, serrated, teeth/claws
- **Sound:** Metal switch clicks, radio chirps, static bursts, typewriter clacks, ammo crate clunks

### What We Actually Have

- shadcn Base UI with Tailwind — clean but **not yet styled** to the Copilot vision
- `bg-background`, `text-foreground`, `border-border` CSS variables — generic, not jungle-military
- No canvas/metal textures applied
- No rivet decorations
- No phosphor-green minimap styling
- No manila folder briefing treatment
- Typography not verified as stencil/typewriter
- Color tokens exist but may not match the Copilot palette spec

### Gap Assessment

The art direction gap is **significant**. Our components exist structurally but lack the visual personality the Copilot conversation meticulously defines. The POCs get their charm from the integrated aesthetic — dark slate panels, inset borders, monospace fonts. Our React components look like a generic dark-mode app unless the theme tokens are correctly wired.

**Priority actions:**
1. Map Copilot's palette (jungle/khaki/rust/steel/accents) to Tailwind CSS variables.
2. Apply canvas-grain or noise texture overlays to panel backgrounds.
3. Style minimap with phosphor-green border glow and CRT grid lines.
4. Add rivet/corner-bracket decorations to major panels.
5. Verify typography matches the stencil/typewriter direction.
6. Ensure `border-radius: 0` across all components (military = sharp corners).

---

## 10. PRIORITIZED ACTION LIST

### Tier 0: Must Fix (Blocks Playability)

| # | Action | Why |
|---|--------|-----|
| 1 | **Functional minimap** with camera sync, click-to-snap, drag-to-pan, and unit pips | Without this, the game is unplayable on maps larger than viewport. Every POC has this. |
| 2 | **Floating damage and resource text** | Every POC has this. It is the single most impactful "game feel" feature. "+10 Fish" and "-8 HP" floating text makes every action feel consequential. |
| 3 | **End-to-end integration** — verify the gather/build/train/fight loop works in browser | Individual systems exist and pass unit tests. They have never been validated working together in Phaser. |

### Tier 1: Must Fix (Core Experience)

| # | Action | Why |
|---|--------|-----|
| 4 | **Building placement ghost** with translucent preview + green/red affordability overlay | Critical for the build part of the core loop. |
| 5 | **Construction progress visual** — opacity rise from foundation, scaffolding outline | Makes building satisfying. POC_handdrawn does this excellently. |
| 6 | **Rally point visualization** — dashed line from building to rally point | Important training feedback. Both enhanced POCs have this. |
| 7 | **Victory/defeat overlay** with sound | Session needs closure. All POCs have this. |
| 8 | **Selection rectangle visual** in Phaser (green box with translucent fill) | Core input feedback for multi-select. |

### Tier 2: Should Fix (Polish & Theme)

| # | Action | Why |
|---|--------|-----|
| 9 | **Apply Copilot palette** to Tailwind CSS variables | Our UI has no visual personality until the theme is applied. |
| 10 | **Typewriter animation** for briefing dialogue | Character-by-character reveal with optional clack sound. Copilot spec demands this. |
| 11 | **Manila folder briefing treatment** — paper texture, stamps, redacted lines | Major narrative identity piece from Copilot spec. |
| 12 | **Day/night cycle visual** — overlay opacity tied to game time | Both enhanced POCs have this. Atmospheric. |
| 13 | **Game clock display** — "Day X - HH:MM" in resource bar area | Both enhanced POCs have this. |
| 14 | **Spawn queue progress bar** under training buildings | POC_handdrawn has this. Good training feedback. |
| 15 | **Canvas/metal texture overlays** on UI panels | Copilot spec demands gritty, textured panels. |
| 16 | **Phosphor-green minimap styling** with CRT grid | Copilot spec's most distinctive UI element. |

### Tier 3: Should Add (Elevation Beyond POCs)

| # | Action | Why |
|---|--------|-----|
| 17 | **Unit voice barks** — short synth chirps on select/command | No POC has this. Would differentiate our audio. |
| 18 | **Rivet/bracket panel decorations** | Copilot's "rivets in corners" direction. |
| 19 | **Resource carrying indicator** — colored pip above worker's head | POC_handdrawn has this. Nice visual clarity. |
| 20 | **Projectile particle trails** | Both enhanced POCs have this. Low priority but adds combat polish. |
| 21 | **Edge scroll mouse-in detection** | Prevents false camera pans when mouse enters game area. Polish. |
| 22 | **HP bar color gradient** — green to yellow to red based on percentage | Not in POCs but standard RTS polish. |

---

## Summary Scorecard

| Dimension | vs POCs | vs Copilot Vision |
|-----------|---------|-------------------|
| Sprite quality | **AHEAD** (40+ entities, layers, animations vs 8 flat sprites) | **PARITY** (SP-DSL matches the vision) |
| UI structure | **AHEAD** (full menu/briefing/campaign flow vs direct-to-game) | **BEHIND** (components exist but lack themed styling) |
| Minimap | **BEHIND** (placeholder vs fully functional) | **BEHIND** (no phosphor-green CRT styling) |
| Gameplay loop | **BEHIND** (systems exist in isolation, not integrated in browser) | **BEHIND** (vision demands all loops working perfectly) |
| Combat feel | **BEHIND** (no floating text, no projectile trails) | **BEHIND** (vision demands satisfying feedback on every hit) |
| Sound | **AHEAD** (Tone.js engine + music vs basic Web Audio SFX) | **PARITY** (design matches vision, needs wiring) |
| Narrative | **FAR AHEAD** (briefings + portraits vs nothing) | **BEHIND** (no manila folder treatment, no typewriter animation) |
| AI | **FAR AHEAD** (FSM + A* + skirmish AI vs random-walk) | **PARITY** |
| Mobile | **FAR AHEAD** (full mobile input system vs nothing) | **PARITY** (vision demands mobile parity) |
| Art direction | **EVEN** (both use pixel art with dark palettes) | **BEHIND** (no textures, no rivets, no phosphor-green) |
| Persistence | **FAR AHEAD** (SQLite + Zustand vs nothing) | **AHEAD** |

### Bottom Line

Our **architecture and systems are far more sophisticated** than any POC. We have 40+ entity types, a full ECS with relations, AI with FSM and pathfinding, 16 mission definitions, persistence, and mobile support. The POCs have none of this.

But the POCs are **playable right now** and we are not. Their advantage is integration: every system is wired together and produces satisfying feedback on every player action. Our systems exist in tested isolation but have not been validated as a working game in the browser.

**The path to elevation is clear:**
1. Wire everything together (Tier 0).
2. Add the missing feedback elements that make the loop feel good (Tier 1).
3. Apply the Copilot visual identity to make it look as good as it plays (Tier 2).
4. Add the differentiating polish that no POC has (Tier 3).

We are not trying to match the POCs. We are trying to make them look like tech demos — which they are. We have the foundation to be a real game. The gap is integration and polish, not architecture.
