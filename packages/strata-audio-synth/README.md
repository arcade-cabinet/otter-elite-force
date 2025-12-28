# @strata-game-library/audio-synth

[![npm version](https://img.shields.io/npm/v/@strata-game-library/audio-synth.svg)](https://www.npmjs.com/package/@strata-game-library/audio-synth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Procedural audio synthesis for [Strata 3D](https://strata.game) using Tone.js - SFX, music, and ambient sound generation without external audio files.

## 📚 Documentation

**Full documentation is available at [strata.game/audio-synth](https://strata.game/audio-synth/)**

---

## 🏢 Enterprise Context

**Strata** is the Games & Procedural division of the [jbcom enterprise](https://jbcom.github.io). This package is part of a coherent suite of specialized tools, sharing a unified design system.

## Features

- **Procedural Audio** - Generate sounds at runtime, no external files needed
- **SFX Synthesis** - Gunshots, explosions, impacts, pickups, and more
- **Procedural Music** - Pattern-based music generation for menus and gameplay
- **Ambient Soundscapes** - Environmental audio (wind, rain, water)
- **React Integration** - Hooks and context for easy React/R3F integration
- **Presets** - Ready-to-use sound effect and music presets

## Installation

\`\`\`bash
npm install @strata-game-library/audio-synth tone
# or
pnpm add @strata-game-library/audio-synth tone
\`\`\`

## Usage

### React Context Provider

\`\`\`tsx
import { AudioSynthProvider, useAudioSynth } from '@strata-game-library/audio-synth';

function App() {
  return (
    <AudioSynthProvider>
      <Game />
    </AudioSynthProvider>
  );
}

function Game() {
  const { playSFX, playMusic, isReady } = useAudioSynth();

  const handleShoot = () => {
    playSFX('gunshot');
  };

  return <button onClick={handleShoot}>Shoot</button>;
}
\`\`\`

### Core API (Non-React)

\`\`\`typescript
import { createSynthManager, SFXPresets } from '@strata-game-library/audio-synth/core';

const manager = createSynthManager();
await manager.init();

manager.playSFX(SFXPresets.GUNSHOT);
manager.playMusic('combat');
\`\`\`

### Custom Sound Synthesis

\`\`\`typescript
import { createCustomSFX } from '@strata-game-library/audio-synth/core';

const laserSound = createCustomSFX({
  oscillator: { type: 'sawtooth' },
  envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
  frequency: { start: 880, end: 220, curve: 'exponential' },
});

laserSound.trigger();
\`\`\`

## Available Presets

| Category | Presets |
|----------|---------|
| Combat | `gunshot`, `explosion`, `impact`, `ricochet` |
| UI | `pickup`, `select`, `confirm`, `error` |
| Environment | `splash`, `footstep`, `wind`, `rain` |
| Music | `menuTheme`, `combatTheme`, `ambientTheme` |

## Related

- [Strata Documentation](https://strata.game) - Full documentation
- [Strata Core](https://github.com/strata-game-library/core) - Main library
- [Strata Presets](https://github.com/strata-game-library/presets) - Pre-configured settings
- [Strata Shaders](https://github.com/strata-game-library/shaders) - GLSL shaders

## License

MIT © [Strata Game Library Contributors](https://github.com/strata-game-library)
