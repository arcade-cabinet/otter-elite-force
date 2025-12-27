# Tech Context: OTTER: ELITE FORCE

## Technology Stack
- **Framework**: React 19 (Stable)
- **3D Engine**: Three.js (r160) via `@react-three/fiber`
- **Audio**: Tone.js (Web Audio API)
- **AI**: YUKA (Steering, FSM)
- **State**: Zustand (with Persistence)
- **Bundler**: Vite
- **Testing**: Vitest, Playwright

## Development Setup
- **Node**: 20+
- **Package Manager**: pnpm 10
- **Linter**: Biome (unified check/format)
- **Repo Structure**: Standard Modular TS

## Technical Constraints
- **NO EXTERNAL ASSETS**: The primary challenge. All geometry must be `THREE.BufferGeometry` primitives or code-generated. No `.obj` or `.gltf`.
- **Mobile Browser Limits**: High priority. Must handle intermittent `AudioContext` suspension and touch event quirks.
- **Save Schema v8**: The current mandatory format for persistent `localStorage` data.

## Deployment Context
- **Hosting**: Render (Static Site)
- **Security**: Strict CSP headers in `render.yaml` ensuring `unsafe-eval` is only used for Three.js shader compilation.
- **Caching**: 1-year immutable caching for build assets.

## Tool Usage
- `pnpm dev`: Local iteration.
- `pnpm build`: Production readiness check.
- `pnpm test`: Mandatory for logic changes.
- `pnpm lint`: Strictly enforced formatting and code quality.
