# Bundle Size Monitoring

This document describes the bundle size monitoring setup for OTTER: ELITE FORCE.

## Overview

Bundle size monitoring helps track the size of our application bundles over time, ensuring we maintain optimal performance for mobile devices.

## Features

### 1. Build-time Analysis

Every build generates a detailed bundle size report showing:
- Total bundle size
- JavaScript, CSS, and asset breakdown
- List of largest files
- File counts per category

**Usage:**
```bash
# Build and analyze
pnpm build
pnpm bundle-size

# View the report
cat bundle-size.json
```

### 2. Visual Bundle Analyzer

Generate an interactive HTML visualization of your bundle composition:

```bash
# Build with visualization
pnpm build:analyze
```

This will:
- Build the application
- Generate `dist/stats.html` with an interactive treemap
- Automatically open the report in your browser
- Show gzip and brotli compressed sizes

### 3. CI Integration

Bundle sizes are automatically tracked in GitHub Actions:

- **Main CI Pipeline** (`ci.yml`):
  - Extracts bundle size after every build
  - Uploads `bundle-size.json` as an artifact
  - Retains reports for 90 days

- **PR Bundle Comparison** (`bundle-size.yml`):
  - Compares PR bundle size against base branch
  - Posts detailed comparison as PR comment
  - Warns if bundle size increases significantly (>5%)
  - Updates comment on each push

### 4. PR Comments

When you open a pull request, a bot will automatically comment with:
- Side-by-side size comparison
- Percentage change
- Breakdown by category (JS/CSS/Assets)
- List of largest files
- Warning if size increase is significant

## Bundle Size Targets

Given our mobile-first focus, we should aim for:

| Metric | Target | Warning Threshold |
|--------|--------|-------------------|
| Total Bundle | < 2 MB | > 3 MB |
| Initial JS | < 500 KB | > 750 KB |
| Per-route JS | < 200 KB | > 300 KB |

**Note**: These are gzipped sizes. The analyzer shows both raw and compressed sizes.

## Optimization Strategies

### Code Splitting

The Vite config is set up with manual chunks for major dependencies:

```typescript
manualChunks: {
  react: ['react', 'react-dom'],
  three: ['three', '@react-three/fiber', '@react-three/drei'],
  audio: ['tone'],
  ai: ['yuka'],
}
```

This ensures:
- Core React code is cached separately
- Heavy 3D libraries don't block initial load
- Audio/AI systems load independently

### Dynamic Imports

For large features, use dynamic imports:

```typescript
// Instead of:
import { HeavyComponent } from './HeavyComponent';

// Use:
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### Tree Shaking

Ensure imports are tree-shakeable:

```typescript
// ✅ Good - allows tree shaking
import { useStore } from 'zustand';

// ❌ Bad - imports entire package
import * as Zustand from 'zustand';
```

## Analyzing Bundle Growth

### Viewing Historical Data

1. Go to Actions → CI → [workflow run]
2. Download `bundle-size-report` artifact
3. Compare `bundle-size.json` across runs

### Identifying Culprits

If bundle size increases unexpectedly:

1. Run `pnpm build:analyze`
2. Open `dist/stats.html`
3. Look for:
   - Unexpectedly large modules
   - Duplicate dependencies
   - Unused code not being tree-shaken

### Common Issues

**Large Dependencies**:
- Check for moment.js, lodash, or other large utilities
- Consider lighter alternatives (date-fns, lodash-es)

**Duplicate Dependencies**:
- Check for multiple versions of same package
- Use `pnpm why <package>` to investigate

**Not Tree-Shaken**:
- Ensure imports are ES modules, not CommonJS
- Check that side effects are properly declared

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm build` | Production build |
| `pnpm build:analyze` | Build with visual analyzer |
| `pnpm bundle-size` | Extract size report from dist/ |

## Files

- `scripts/extract-bundle-size.js` - Bundle analysis script
- `.github/workflows/ci.yml` - Main CI with bundle tracking
- `.github/workflows/bundle-size.yml` - PR comparison workflow
- `vite.config.ts` - Build configuration with code splitting
- `bundle-size.json` - Generated report (gitignored)
- `dist/stats.html` - Visual analyzer (gitignored)

## Performance Budget

To enforce bundle size limits in CI, you can add size checks:

```javascript
// In extract-bundle-size.js, add:
if (totalSize > MAX_SIZE_BYTES) {
  console.error('Bundle size exceeds limit!');
  process.exit(1);
}
```

This is currently **not enforced** to allow flexibility during development, but can be enabled if needed.

## Related Resources

- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Bundle Size Matters](https://web.dev/performance-budgets-101/)
- [React Code Splitting](https://react.dev/reference/react/lazy)
