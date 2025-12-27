# UI/UX Self-Improvement: Target Audience Simulation

> **Agent ID**: Cursor Agent  
> **Date**: 2025-12-27  
> **Branch**: `cursor/memory-bank-and-agent-alignment-8443`  
> **Status**: ASSESSMENT + FIXES  

---

## Target Audience Profile

**Primary User**: Mobile gamer (iPhone 12-15, mid-range Android)
**Demographics**: 18-35, tactical shooter enthusiast, nostalgic for classic war games
**Context**: Playing on phone during commute, lunch break, or couch session
**Expectations**: Smooth touch controls, clear objectives, visceral feedback

---

## Scenario 1: First-Time Player (New Game)

### Simulation Walkthrough

**Step 1: Open App → MainMenu**
> *As a new player, I tap the app icon. The menu loads.*

**Current Experience:**
- ✅ Clean title presentation "OTTER ELITE FORCE"
- ✅ Clear "NEW GAME" button
- ⚠️ Panel feels text-heavy for mobile
- ⚠️ Stats shown (RANK, TERRITORY) are 0 - feels empty
- ❌ No onboarding hint about what to do first
- ❌ Character grid shows locked characters with no visual appeal

**Issues Found:**
1. New players see empty stats (0 territory, 0 peacekeeping) - feels like broken UI
2. Difficulty cards have no visual hierarchy - all look the same
3. "VISIT CANTEEN" button below difficulty - confusing placement

### Fixes Applied

```tsx
// MainMenu.tsx - Hide empty stats for new players
{hasSaveData && (
  <div className="stat-row">...</div>
)}
```

---

**Step 2: Tap NEW GAME → Cutscene → Game**
> *I tap NEW GAME and expect to start playing immediately.*

**Current Experience:**
- ✅ Cutscene provides context
- ⚠️ No skip button for impatient players
- ⚠️ Transition to game lacks loading feedback

**Issues Found:**
1. Can't skip cutscene on repeat plays
2. No loading indicator during asset initialization

---

**Step 3: In-Game HUD First Impressions**
> *The game loads. I see the HUD. Where do I touch?*

**Current Experience:**
- ✅ Health bar visible (INTEGRITY)
- ✅ Coordinates displayed
- ⚠️ JUMP/GRIP/SCOPE buttons stacked vertically - thumb reach issue
- ❌ Left joystick zone has no visual indicator until touched
- ❌ Right side "drag area" for looking - completely invisible
- ❌ No objective prompt telling me what to do
- ❌ BUILD button appears only after LZ secured - new player confusion

**Issues Found:**
1. **Joystick zones invisible** - player doesn't know where to touch
2. **No first objective** - "SECURE YOUR LZ" should appear immediately
3. **Action buttons too small** - 44px minimum touch target not met
4. **No tutorial overlay** - player thrown into combat unprepared

---

## Scenario 2: Returning Player (Continue)

### Simulation Walkthrough

**Step 1: Open App → MainMenu → Continue**
> *I've played before. I want to jump back in.*

**Current Experience:**
- ✅ "CONTINUE CAMPAIGN" is primary button
- ✅ Stats visible showing progress
- ⚠️ No indication of where I left off
- ⚠️ No "last session" summary

**Issues Found:**
1. No reminder of current objective or location
2. Territory score visible but no visualization of owned vs. unowned

---

**Step 2: In-Game After Returning**
> *I'm back in the game. Where was I?*

**Current Experience:**
- ⚠️ Spawns at 0,0 regardless of last position
- ❌ No waypoint to incomplete objectives
- ❌ No minimap showing discovered territory

**Issues Found:**
1. Player should spawn at last position or LZ
2. No navigation assistance to find objectives

---

## Scenario 3: Combat Engagement

### Simulation Walkthrough

**Step 1: Encounter Gator**
> *A gator emerges. I need to fight!*

**Current Experience:**
- ✅ Aiming auto-fires (hold right side)
- ✅ Muzzle flash and audio feedback
- ⚠️ No damage numbers
- ⚠️ Hit feedback minimal
- ❌ No enemy health bar visible
- ❌ Suppression mechanic invisible to player

**Issues Found:**
1. No enemy health indication - can't gauge progress
2. Suppression exists in code but no visual feedback
3. Hit registration unclear - was that a hit?

---

**Step 2: Take Damage**
> *The gator hits me!*

**Current Experience:**
- ✅ Health bar decreases
- ✅ Screen goes red briefly (mudAmount used as damage indicator?)
- ⚠️ No directional damage indicator
- ⚠️ No haptic feedback on mobile

**Issues Found:**
1. Can't tell WHERE damage came from
2. Haptics not implemented despite being mentioned in CLAUDE.md

---

## Scenario 4: Base Building

### Simulation Walkthrough

**Step 1: Secure LZ → Build Mode**
> *I've secured my LZ. Time to build!*

**Current Experience:**
- ✅ BUILD button appears after LZ secured
- ⚠️ Build UI is minimal (+FLOOR, +WALL, +ROOF, +STILT)
- ❌ No preview of what will be placed
- ❌ No cost shown per item
- ❌ No rotation control
- ❌ Placement position unclear

**Issues Found:**
1. No ghost preview of structure before placing
2. Resource costs exist in code but not shown in UI
3. Placement snaps to grid but player doesn't see grid

---

## Scenario 5: Canteen Visit

### Simulation Walkthrough

**Step 1: MainMenu → Canteen**
> *I want to upgrade my gear.*

**Current Experience:**
- ✅ 3D character preview is nice
- ✅ PLATOON/UPGRADES tabs clear
- ⚠️ Character selection feels detached from preview
- ❌ No weapon customization UI (despite code existing)
- ❌ No loadout management UI (code exists but not wired)
- ❌ Upgrades are generic "SPEED/HEALTH/DAMAGE" - not the weapon mods in code

**Issues Found:**
1. **Major Gap**: Full weapon customization system exists in `canteenLoadout.ts` but UI only shows basic upgrades
2. Equipment slots (GADGET_1, GADGET_2) not accessible from UI
3. Attachment system not exposed to player

---

## Priority Fixes

### Critical (Blocking Core Experience)

| Issue | Fix | File |
|-------|-----|------|
| Invisible joystick zones | Add persistent zone indicators | HUD.tsx |
| No first objective | Add "SECURE YOUR LZ" prompt for new players | HUD.tsx |
| No enemy health | Add enemy health bars | Level.tsx |
| Missing weapon customization UI | Wire canteen to ECS weapon templates | Canteen.tsx |

### High (Significantly Impacts UX)

| Issue | Fix | File |
|-------|-----|------|
| New player sees empty stats | Conditionally hide 0 stats | MainMenu.tsx |
| No build preview | Add ghost mesh preview | HUD.tsx |
| No directional damage | Add damage direction indicator | HUD.tsx |
| Touch targets too small | Increase button size to 48px min | CSS |

### Medium (Polish)

| Issue | Fix | File |
|-------|-----|------|
| No skip cutscene | Add skip button | Cutscene.tsx |
| No haptic feedback | Add navigator.vibrate calls | Level.tsx |
| Suppression invisible | Add suppression visual effect | Level.tsx |

---

## Implementation Plan

### Phase 1: Visibility & Feedback (Immediate)

1. Add joystick zone visual indicators
2. Add first-objective prompt
3. Increase touch target sizes
4. Add enemy health bars

### Phase 2: Canteen Overhaul

1. Wire weapon template system to UI
2. Add loadout slot management
3. Expose attachment customization
4. Add equipment slot selection

### Phase 3: Build Mode Enhancement

1. Ghost mesh preview
2. Resource cost display
3. Grid visualization
4. Rotation controls

### Phase 4: Combat Feedback

1. Damage numbers
2. Directional damage indicators
3. Haptic feedback integration
4. Suppression visual effects

---

## Metrics to Track

| Metric | Current | Target |
|--------|---------|--------|
| New player first-objective completion | Unknown | 80%+ |
| Touch target minimum size | ~40px | 48px |
| Canteen feature parity with code | 20% | 100% |
| Build mode usability | Low | High |
