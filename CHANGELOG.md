# Changelog: OTTER ELITE FORCE

## [v8.0] - The "Unstoppable" Patch (Current)

**Released**: Definitive Edition

- **FIX**: Completely restructured UI Z-indexing. Joysticks are now functionally separated from the Menu layer.
- **FIX**: "Campaign" button is now fully clickable on all devices (Touch event propagation fixed).
- **FIX**: Audio Context now initializes via a global listener on the first tap, ensuring sound works immediately.
- **POLISH**: Added "Loading..." spinner to handle module latency.

## [v7.0] - The "Syman" Patch

- **MECHANIC**: Restored "Freedom Movement". Player turns to face movement direction when running, but locks to aim direction when firing.
- **VISUAL**: Fixed Skybox colors (Orange for Menu, Blue/Green for Levels).
- **AUDIO**: Re-enabled Procedural Music Engine with distinct tracks for Menu and Combat.

## [v6.0] - The "Patton" Edition

- **VISUAL**: Added Procedural Flag Shader (Vertex displacement for waving effect).
- **CAMERA**: Shifted Briefing Camera to a "Diorama" rear view to emphasize scale.
- **INPUT**: Added Gyroscopic Aiming (Tilt to fine-tune). Added Scope Button (Toggle Zoom).

## [v5.0] - The "Platinum" Overhaul

- **GAMEPLAY**: Introduced "Surfacing" mechanic. Enemies stalk underwater (visible as ripples) before breaching.
- **AI**: Enemies no longer spawn on top of the player; they spawn at distance and close the gap.
- **CONTROLS**: Fixed "Endless Walk" bug by adding input zeroing on touch end.

## [v4.0] - The "Redux" / "Napalm" Update

- **ENGINE**: Switched from CDN script tags to ES Modules to force Three.js r160 (fixing CapsuleGeometry crash).
- **VISUAL**: Switched from Night Mode to Day Mode/Golden Hour for better mobile visibility.
- **JUICE**: Added Shell Ejection particles, Blood/Oil splatters, and screen shake.

## [v3.0] - Operation Clam Thunder

- **THEME**: Pivoted from generic "River Doom" to Vietnam-War-style Otter aesthetic.
- **UI**: Added "Top Secret Dossier" menu style.
- **AUDIO**: First implementation of the Web Audio Synth.

## [v2.0] - Swamp Arena

- **GENRE**: Shifted from "Endless Runner" to "Arena Survival".
- **RIG**: Created the first compound geometry Otter rig with distinct limbs.

## [v1.0] - River Doom

- **CONCEPT**: Initial prototype. Procedural river generation.
