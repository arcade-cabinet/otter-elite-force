# 🦦 AGENTS.md - Technical Briefing for OTTER: ELITE FORCE

## 1. Project Identity & Directive

**Project Name**: OTTER: ELITE FORCE (formerly River Doom, Operation: Clam Thunder)  
**Core Aesthetic**: "Full Metal Jacket" meets "Wind in the Willows."  
**Technical Constraint**: Single-File HTML5 (No external assets, bundlers, or local servers required).  
**Primary Goal**: Create a mobile-first, procedurally generated 3rd-person tactical shooter with persistent progression.

## 2. Architecture Overview

### The "Single-File" Mandate

To maintain portability and zero-setup execution, the entire game engine was originally contained within index.html.

- **Libraries**: Three.js is imported via ES Modules from unpkg.
- **Assets**: No .obj, .gltf, or .mp3 files are used. All 3D models are constructed procedurally using THREE.Group composition of primitives. All audio is synthesized in real-time using the Web Audio API.

### Modern Modular Architecture

The project is now being refactored into a modular TypeScript structure:

```
src/
├── Core/           # Core engine systems (GameLoop, InputSystem, AudioEngine)
├── Entities/       # Game objects (PlayerRig, Enemies, Particles)
├── Scenes/         # Level management (MainMenu, Level)
└── UI/             # User interface (HUD)
```

### State Management

The game loop uses a strict finite state machine (FSM) controlled by the global mode variable:

- **MENU**: 
  - Input: Native DOM clicks enabled. Joystick logic disabled.
  - Render: Cinematic camera drift, "Golden Hour" lighting.
  
- **CUTSCENE**: 
  - Input: Limited to "Next Dialogue" button.
  - Render: Fixed camera angles, scripted actor animations.
  
- **GAME**: 
  - Input: Virtual Joysticks enabled via Touch Events. Native clicks disabled on canvas area (prevent default).
  - Render: Chase camera, physics updates, collision detection.

### Input System (The "Tactical Router")

A major challenge during development was the conflict between Touch Events (for joysticks) and Mouse Events (for UI buttons).

**Solution**: The ui-layer listens for touchstart.

**Logic**:
- Check mode. If not GAME, return immediately (allows native button clicks).
- Check event target. If target is a `<button>`, return (allows click).
- Else, call `e.preventDefault()` and map touch coordinates to virtual stick logic.

## 3. Procedural Systems

### The "Rig" (Sgt. Bubbles)

The player character is not a mesh, but a hierarchy of primitives:

- **Torso**: Cylinder (Vest/Body).
- **Limbs**: CapsuleGeometry (requires Three.js r137+).
- **Accessories**: Torus (Bandana), Boxes (Radio Pack).
- **Animation**: Sine-wave rotation applied to limb groups (joints) based on movement velocity.

### The Audio Engine

A custom MusicEngine class uses AudioContext to sequence 16th notes.

- **Instruments**: Oscillators (Sawtooth for Bass/Leads, Noise Buffer for Snare/HiHats).
- **Filters**: BiquadFilters used for "wah" effects on bass and low-pass muffling.
- **Safety**: The engine waits for the first user interaction (click or touchstart) before resuming the context to bypass browser autoplay policies.

### Save Data

Uses localStorage key `otter_v8`.

- **Schema**: `{ rank: int, xp: int, medals: int, unlocked: int }`
- **Versioning**: Keys are versioned (e.g., `_v8`) to prevent conflicts between iterations.

## 4. Known Constraints & Hacks

- **Shadow Mapping**: Shadow map size is set to 2048 for sharp shadows, but bias tweaking is minimal. Artifacts may appear at extreme angles.
- **Fog/Skybox**: The sky is a simple THREE.Color background synced with a THREE.FogExp2 or linear Fog. The "Sun" is a DirectionalLight.
- **Water**: A Vertex Shader displaces a high-segment plane. It does not have real reflections/refractions (too expensive for this context), relying on specular highlights for the "wet" look.

## 5. Future Expansion Paths

To scale this project further:

- **Boss Battles**: Implement a Boss class inheriting from Enemy with multi-stage logic.
- **Terrain**: Replace PlaneGeometry with a Heightmap-based terrain chunk system for uneven ground.
- **Weapons**: Abstract the shooting logic to support different projectile types (Spread, Explosive, Beam).

## 6. Development Guidelines

### Code Style

- Use TypeScript with strict mode enabled
- Follow Biome linting and formatting rules (tabs for indentation, double quotes)
- Prefer functional composition over deep inheritance
- Document complex procedural generation logic

### Testing

- Run `pnpm dev` to test in development mode
- Build with `pnpm build` to verify production builds
- Test on mobile devices for touch input validation

### Architecture Principles

1. **Separation of Concerns**: Keep rendering, logic, and input separate
2. **Minimal Dependencies**: Prefer native APIs over external libraries
3. **Performance First**: Target 60fps on mobile devices
4. **Procedural Everything**: Generate assets at runtime when possible

## 7. AI Agent Instructions

When working on this codebase:

1. **Preserve the Procedural Nature**: Never add external asset files. Everything must be generated via code.
2. **Maintain Single-File Compatibility**: While we're refactoring to modules, keep the spirit of minimal external dependencies.
3. **Mobile-First**: Always consider touch input and mobile performance.
4. **Test Audio**: Remember that Web Audio requires user interaction to start.
5. **Respect the FSM**: Mode transitions should be explicit and well-defined.

### Refactoring Strategy

When extracting code from the monolithic POC:

1. Identify logical boundaries (e.g., all input handling, all audio synthesis)
2. Create TypeScript classes with clear interfaces
3. Maintain backward compatibility with existing save data
4. Test each module independently before integration
5. Document dependencies between modules

### Common Pitfalls

- Don't break the audio context initialization (it MUST wait for user gesture)
- Don't interfere with touch event propagation for UI buttons
- Don't change the localStorage key structure without migration logic
- Don't add Three.js types that conflict with the runtime version (r160)
