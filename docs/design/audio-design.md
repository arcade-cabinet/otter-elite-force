# Audio Design

## Engine

Tone.js for procedural synth. All sounds generated at runtime — no audio files.

Phaser integration: Phaser's `SoundManager` is NOT used. Tone.js runs independently. Game events (unit selected, attack landed, building complete) trigger Tone.js synth calls. This keeps audio decoupled from the rendering engine.

## SFX Catalog

Each SFX is a short procedural synth burst. Defined as Tone.js oscillator type + frequency + duration + envelope.

### UI Sounds
| SFX | Trigger | Synth | Character |
|-----|---------|-------|-----------|
| click | Any UI button pressed | sine 800Hz, 50ms | Crisp, minimal |
| unit_select | Unit(s) selected | sine 600Hz→800Hz, 80ms | Rising confirmation |
| unit_deselect | Click empty ground | sine 400Hz, 40ms | Soft dismissal |
| error | Invalid action (can't afford, wrong target) | square 200Hz, 150ms | Buzzy rejection |

### Gameplay Sounds
| SFX | Trigger | Synth | Character |
|-----|---------|-------|-----------|
| move_order | Right-click move command | triangle 500Hz→300Hz, 100ms | Descending acknowledgment |
| attack_order | Right-click attack command | sawtooth 400Hz→600Hz, 100ms | Ascending aggression |
| melee_hit | Melee damage applied | sawtooth 80Hz→40Hz, 200ms | Heavy thud |
| ranged_fire | Ranged unit fires projectile | triangle 600Hz→1200Hz, 100ms | Whistling arrow |
| ranged_hit | Projectile connects | noise burst 100ms + sine 300Hz | Impact crunch |
| unit_death | Entity HP reaches 0 | sawtooth 200Hz→50Hz, 400ms | Descending groan |
| building_place | Ghost building placed | sine 150Hz→50Hz, 150ms | Thump of placement |
| building_complete | Construction reaches 100% | sine 400→600→800Hz, 300ms (3-note rise) | Triumphant completion |
| resource_gather | Worker harvests a tick | square 100Hz, 50ms with slide to 50Hz | Chop/dig |
| resource_deposit | Worker deposits at Command Post | sine 500Hz, 80ms + triangle 700Hz, 80ms | Two-tone cash register |
| alert | Enemy spotted / attack warning | square 400Hz→300Hz, 800ms | Urgent alarm |
| victory | Mission complete | sine 400→600→800Hz staggered 200ms apart | Fanfare |
| defeat | Mission failed | sawtooth 200→100→50Hz staggered 400ms apart | Descending doom |

### Environment Sounds
| SFX | Trigger | Synth | Character |
|-----|---------|-------|-----------|
| rain_ambient | Weather = RAIN | Filtered noise loop, low volume | Soft patter |
| monsoon_ambient | Weather = MONSOON | Filtered noise loop + occasional thunder (low sine burst) | Heavy, oppressive |
| siphon_hum | Near active siphon | Low drone sine 60Hz, continuous | Industrial menace |

## Music

Two procedural music tracks. Both use Tone.js Transport for tempo sync.

### Menu Track
- **Tempo:** 72 BPM
- **Key:** D minor
- **Instruments:** Sine pad (sustained D-F-A chord), triangle arpeggiation (D-A-F-D pattern), filtered noise for texture
- **Feel:** Brooding military ambience. Slow. Tension without action.

### Combat Track
- **Tempo:** 120 BPM
- **Key:** A minor
- **Instruments:** Sawtooth bass (A-E pattern, staccato), square lead (melody line), hi-hat noise pattern (8th notes)
- **Feel:** Driving urgency. The player should feel time pressure.
- **Trigger:** Plays when combat is active (any friendly unit has Targeting relation). Fades back to ambient when combat ends.

### Briefing Track
- **Tempo:** 80 BPM
- **Key:** G minor
- **Instruments:** Sine pad with slow attack, triangle melody (simple 4-note motif)
- **Feel:** Military briefing room. Serious but not combat-intense.

## Volume & Mixing

| Channel | Default Volume | User Adjustable |
|---------|---------------|-----------------|
| SFX | 1.0 | Yes (settings) |
| Music | 0.7 | Yes (settings) |
| Ambient | 0.4 | Tied to SFX slider |

## Implementation Notes

- **Audio unlock:** Tone.js requires user interaction before playing. Initialize `Tone.start()` on first pointer event in MenuScene.
- **Concurrent SFX limit:** Max 4 simultaneous SFX to prevent cacophony during large battles. Oldest SFX gets cut.
- **Positional audio:** Not needed for 2D top-down. All sounds play at global volume regardless of camera position.
- **Fade transitions:** Music cross-fades over 1s when switching tracks (menu→combat→ambient).
