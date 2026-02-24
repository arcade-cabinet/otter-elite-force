# Claude Mission Control

**OTTER: ELITE FORCE** - Mobile-first tactical shooter with Expo + Babylon.js + Reactylon

## 📚 Primary Documentation

**For complete project context, architecture, game mechanics, and coding guidelines:**

👉 **[AGENTS.md](./AGENTS.md)** in repository root

This file is a brief wrapper pointing to the central technical briefing.

## 🎯 Quick Reference

- **Tech Stack**: Expo 52 + React Native 0.76 + Babylon.js 8.52 + Reactylon 3.5
- **Build System**: Metro bundler (NOT Vite)
- **Package Manager**: **pnpm ONLY** (never npm or yarn)
- **Procedural**: No external assets - all runtime generation
- **Mobile-First**: Touch controls, 60fps target, responsive design
- **Vietnam-Era**: Gritty tactical realism ("Full Metal Jacket" meets "Wind in the Willows")

## 🚀 Commands

```bash
pnpm dev          # Metro dev server (port 8081)
pnpm build        # expo export:web
pnpm lint         # Biome linter
pnpm lint:fix     # Auto-fix linting
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright E2E
```

## 📖 Complete Documentation

See **[AGENTS.md](./AGENTS.md)** for:
- Complete architecture and design philosophy
- Open world chunk persistence system
- Difficulty modes and game mechanics
- Coding standards and patterns
- Performance optimization guidelines
- Testing strategies
- All technical details
