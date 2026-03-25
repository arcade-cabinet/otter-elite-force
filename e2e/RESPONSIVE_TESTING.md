# Responsive Visual Testing Guide

## Overview

This test suite captures screenshots across **17 different device configurations** to verify responsive design, touch targets, and visual consistency.

## Device Matrix

### Desktop (1 config)
- **Chrome 1920x1080** - Standard desktop

### iOS Devices (4 configs)
- **iPhone 15 Pro** (393x852) - Latest flagship
  - Portrait
  - Landscape
- **iPhone SE (3rd gen)** (375x667) - Budget/older device
  - Portrait
  - Landscape

### Android Phones (2 configs)
- **Pixel 8a** (412x915) - Mid-range Android
  - Portrait
  - Landscape

### Foldable Devices (4 configs)
- **OnePlus Open Folded** (387x812) - Cover screen
  - Portrait
  - Landscape
- **OnePlus Open Unfolded** (1080x2268) - Tablet mode
  - Portrait
  - Landscape

### Tablets (4 configs)
- **iPad Pro 12.9** (1024x1366) - Premium iOS tablet
  - Portrait
  - Landscape
- **Pixel Tablet** (1600x2560) - Android tablet
  - Portrait
  - Landscape

## Running Tests

### Quick Screenshot Capture

Capture screenshots on all devices:

```bash
# Run all responsive tests
pnpm test:e2e responsive-visual-tests.spec.ts

# Run with MCP for headed mode
PLAYWRIGHT_MCP=true pnpm test:e2e responsive-visual-tests.spec.ts

# Run specific device only
pnpm test:e2e responsive-visual-tests.spec.ts --project="iPhone 15 Pro (Portrait)"
```

### Generate Screenshot Report

```bash
# Generate HTML report with all screenshots
pnpm playwright show-report
```

## Screenshot Locations

Screenshots are saved to:
```
screenshots/
├── main-menu-Desktop-Chrome.png
├── main-menu-iPhone-15-Pro-(Portrait).png
├── main-menu-iPhone-15-Pro-(Landscape).png
├── main-menu-iPhone-SE-(Portrait).png
├── main-menu-iPhone-SE-(Landscape).png
├── main-menu-Pixel-8a-(Portrait).png
├── main-menu-Pixel-8a-(Landscape).png
├── main-menu-OnePlus-Open-Folded-(Portrait).png
├── main-menu-OnePlus-Open-Folded-(Landscape).png
├── main-menu-OnePlus-Open-Unfolded-(Portrait).png
├── main-menu-OnePlus-Open-Unfolded-(Landscape).png
├── main-menu-iPad-Pro-12.9-(Portrait).png
├── main-menu-iPad-Pro-12.9-(Landscape).png
├── main-menu-Pixel-Tablet-(Portrait).png
├── main-menu-Pixel-Tablet-(Landscape).png
└── ... (decorations, 3d-canvas, orientation, etc.)
```

## What We're Testing

### 1. Responsive Scaling
- Layouts adapt to viewport size
- NativeWind Tailwind classes work across devices
- Expo responsive utilities function correctly

### 2. Touch Targets
- Minimum 44x44 pixels on iOS
- Minimum 48x48 pixels on Android
- Buttons accessible on all form factors

### 3. Orientation Handling
- Portrait mode (vertical)
- Landscape mode (horizontal)
- UI adapts without breaking

### 4. Design System
- Vietnam-era color palette renders
- Google Fonts load correctly
- SVG decorations visible
- Immersive atmosphere maintained

### 5. 3D Rendering
- Babylon.js canvas appears
- WebGL works across devices
- Reactylon components render

### 6. Typography
- Military fonts readable at all sizes
- Text scales appropriately
- Line heights prevent overlap

## Test Categories

### Main Menu Tests
- `main-menu-*.png` - Full main menu state
- `decorations-*.png` - SVG decoration visibility
- Touch target validation (mobile only)

### Difficulty Selection Tests
- `difficulty-*.png` - Difficulty selector (if implemented)

### 3D Canvas Tests
- `3d-canvas-*.png` - Babylon.js rendering

### Orientation Tests
- `orientation-portrait-*.png` - Portrait layouts
- `orientation-landscape-*.png` - Landscape layouts

### Styling Tests
- `styling-*.png` - Design token application
- Font family validation

### Complete Archive
- `complete-*.png` - Final screenshot for each device

## Visual Regression

To enable visual regression testing:

```typescript
// In test file
await expect(page).toHaveScreenshot('main-menu.png', {
  maxDiffPixels: 100,
});
```

This compares screenshots and fails if differences exceed threshold.

## CI Integration

Tests run automatically on CI with:
- Headless mode (software rendering)
- Screenshot capture on all devices
- HTML report generation
- Upload to artifacts

## Debugging

### View specific device
```bash
# Open browser for specific device
PLAYWRIGHT_MCP=true pnpm test:e2e --project="iPhone 15 Pro (Portrait)" --headed
```

### Slow motion
```bash
# Add delays to see what's happening
pnpm test:e2e --slow-mo=1000
```

### Debug mode
```bash
# Pause execution
pnpm test:e2e --debug
```

## Expected Results

**All tests should pass with:**
- ✅ Main menu visible on all devices
- ✅ Buttons accessible (proper size)
- ✅ 3D canvas renders (where applicable)
- ✅ Design tokens applied
- ✅ No layout overflow
- ✅ No text truncation
- ✅ Touch targets minimum size

**Screenshots should show:**
- Immersive Vietnam-era aesthetic
- Responsive layouts
- Clear typography
- Visible decorations (helicopter, insignia, etc.)
- Working 3D scenes

## Troubleshooting

### Metro server not starting
```bash
# Start Metro manually first
pnpm web

# Then run tests in another terminal
pnpm test:e2e
```

### WebGL not rendering
- Check `screenshots/3d-canvas-*.png` for black canvas
- Verify GPU flags in playwright.config.ts
- Try with MCP mode: `PLAYWRIGHT_MCP=true`

### Screenshots all black
- Metro server may not be ready
- Increase timeout in playwright.config.ts
- Check console for errors

### Font not loading
- Verify Google Fonts in index.html
- Check network tab for failed requests
- Ensure fonts are preconnected

## Performance Targets

- **Desktop**: < 3s to interactive
- **Mobile**: < 5s to interactive
- **Tablets**: < 4s to interactive
- **Foldable**: < 4s to interactive

All measured from navigation to "OTTER: ELITE FORCE" title visible.

## Next Steps

1. Review screenshots in `screenshots/` directory
2. Verify responsive behavior across all devices
3. Check touch target sizes on mobile
4. Confirm 3D rendering on capable devices
5. Validate design system consistency
6. Fix any layout issues discovered
7. Enable visual regression testing
8. Add performance budgets

**With 17 device configurations, we have COMPREHENSIVE coverage.** 🎯
