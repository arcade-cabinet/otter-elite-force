# GitHub Copilot Instructions

**OTTER: ELITE FORCE** - Mobile-first tactical shooter with Expo + Babylon.js + Reactylon

## 📚 Primary Documentation

**For complete project context, architecture, and coding guidelines, see:**

👉 **[AGENTS.md](../AGENTS.md)** in repository root

This file is a brief wrapper pointing to the central documentation.

## 🎯 Key Points

## 🎯 Key Points

- **Open World**: No levels, single persistent world with chunk-based generation
- **Tech Stack**: Expo 52 + React Native 0.76 + Babylon.js 8.52 + Reactylon 3.5
- **Build System**: Metro bundler (NOT Vite)
- **Package Manager**: pnpm (ALWAYS use pnpm, never npm)
- **Procedural**: No external assets - all 3D models and audio generated at runtime
- **Mobile-First**: Touch controls, responsive design, 60fps target
- **Vietnam-Era Aesthetic**: Gritty tactical realism

## 🚀 Quick Commands

```bash
pnpm dev          # Start Metro dev server
pnpm build        # Build with Metro (expo export:web)
pnpm lint         # Run Biome linter
pnpm lint:fix     # Auto-fix linting issues
pnpm test         # Run Vitest unit tests
pnpm test:e2e     # Run Playwright E2E tests
```

## 📖 Full Documentation

See **[AGENTS.md](../AGENTS.md)** for:
- Complete architecture overview
- Design principles and patterns
- Coding guidelines
- Game mechanics and systems
- Performance optimization
- Testing strategies
