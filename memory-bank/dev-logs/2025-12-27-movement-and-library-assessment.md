# Movement & Library Assessment

> **Agent ID**: Cursor Agent  
> **Date**: 2025-12-27  
> **Branch**: `cursor/memory-bank-and-agent-alignment-8443`  
> **Status**: ASSESSMENT  

---

## 1. MOVEMENT SYSTEM ASSESSMENT

### ✅ NOT Tank Controls - CONFIRMED

Looking at `Level.tsx` lines 395-401:

```typescript
} else if (moveVec.lengthSq() > 0.01) {
    const targetAngle = Math.atan2(moveVec.x, moveVec.z);
    let diff = targetAngle - playerRef.current.rotation.y;
    diff = ((((diff + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
    playerRef.current.rotation.y += diff * 5 * delta;
    playerRef.current.position.add(moveVec.normalize().multiplyScalar(moveSpeed * delta));
}
```

**This is WORLD-SPACE movement:**
- Player moves in the direction the joystick points (relative to camera)
- Smooth rotation interpolation (character turns to face movement direction over time)
- NOT tank controls where forward/back is relative to character facing

**Aiming mode (lines 380-394):**
- Strafing while aiming is supported
- Look stick controls rotation
- Fire while moving in any direction

### ⚠️ Movement System GAPS

| Gap | Current State | Ideal State |
|-----|---------------|-------------|
| **Physics Engine** | Manual position updates | Rapier/Cannon rigid body physics |
| **Collision Detection** | Simple distance checks | Proper AABB/mesh collision |
| **Wall Sliding** | None | Physics-based sliding |
| **Character Controller** | Custom gravity/jump | `@react-three/rapier` CharacterController |
| **Ground Detection** | `position.y <= 0` check | Raycast/physics ground sensor |
| **Slopes/Stairs** | Not handled | Proper step-up mechanics |

### ECS Movement System Analysis

The `src/ecs/systems/MovementSystem.ts` is **minimal**:
- Basic velocity integration
- Yuka steering for AI
- Friction application

**Missing ECS movement features:**
- Player input processing in ECS
- Collision response
- Ground state management
- Jump/climb state machine

---

## 2. LIBRARY ASSESSMENT

### Currently Using ✅

| Library | Purpose | Status |
|---------|---------|--------|
| `@react-three/fiber` | React Three.js bindings | ✅ Good |
| `@react-three/drei` | Helper components | ✅ Good |
| `@react-three/postprocessing` | Post-processing | ✅ Good |
| `three` | 3D engine | ✅ Good |
| `miniplex` | ECS | ✅ Good |
| `yuka` | AI steering behaviors | ✅ Good |
| `nipplejs` | Touch joysticks | ✅ Good |
| `tone` | Procedural audio | ✅ Good |
| `zustand` | State management | ✅ Good |

### ❌ MISSING Libraries That Would Fill Gaps

#### 1. `@react-three/rapier` - Physics Engine (CRITICAL)

**What it solves:**
- Proper collision detection with geometry
- Rigid body physics (gravity, forces, momentum)
- Character controller with ground detection
- Projectile physics (no tunneling)
- Environmental hazards (trigger zones for toxic sludge, mud pits)
- Raft physics (buoyancy simulation)

**Current workaround:** Manual position updates, distance-based collision checks

**Why it's needed:**
- Dev log mentions "bullet tunneling at high framerates" as known issue
- Mud pits/oil slicks need proper trigger volumes
- Platform collision is hacky (manual AABB checks)
- Climbing needs physics-based grip zones

#### 2. `@react-spring/three` - Smooth Animations (MEDIUM)

**What it solves:**
- Smooth camera transitions
- UI animations
- Procedural character polish (weapon sway, head bob)

**Current workaround:** Manual lerping with `THREE.MathUtils.lerp`

#### 3. `leva` - Debug Controls (DEV)

**What it solves:**
- Runtime parameter tweaking
- Visual debugging of physics values
- Quick iteration on movement feel

#### 4. `@dimforge/rapier3d-compat` - Direct Rapier Access

If `@react-three/rapier` is too heavy, the raw WASM bindings can be used for:
- Custom physics queries
- More control over simulation step

---

## 3. FLAGGED ITEMS FROM DEV LOGS - AUDIT

### ✅ RESOLVED

| Flagged Item | Resolution |
|--------------|------------|
| "Tank control style" camera | ✅ OTS camera with lateral offset implemented |
| Missing collision detection | ✅ Distance-based collision in Level.tsx |
| Projectile collisions | ✅ Implemented in Level.tsx frame loop |
| Input system memory leaks | ✅ Cleanup handlers added |
| Diagonal movement speed boost | ✅ Normalized in InputSystem.ts |
| Pack hunting AI | ✅ Pack coordination in AISystem.ts |
| Suppression mechanics | ✅ Suppression component in ECS |

### ⚠️ PARTIALLY RESOLVED

| Flagged Item | Current State | Needed |
|--------------|---------------|--------|
| "Liquid Physics/Hazards" | Components exist (MudPit, ToxicSludge, OilSlick) | Need physics trigger volumes |
| "Face Collision" | Basic AABB in Level.tsx | Proper physics engine |
| "Vertical Physics" | Jump/gravity works | Needs physics-based climbing |
| "Class Mechanics mapping to physics" | Traits exist in store | Need ECS integration |

### ❌ NOT YET ADDRESSED

| Flagged Item | From Dev Log | Solution |
|--------------|--------------|----------|
| "Bullet tunneling at high framerates" | Known Issues | Rapier CCD (Continuous Collision Detection) |
| "Proper AABB face collision" | Line 751 | Physics engine collision shapes |
| "Character stands on platforms" | Line 771 | Physics character controller |
| "Climbing with physics" | Line 796 | Physics grip/climb zones |

---

## 4. RECOMMENDED ACTION PLAN

### Phase 1: Add Physics Engine (HIGH PRIORITY)

```bash
pnpm add @react-three/rapier
```

**Implementation:**
1. Wrap `<Canvas>` with `<Physics>` provider
2. Convert player to `<RigidBody>` with `<CharacterController>`
3. Add `<CuboidCollider>` to platforms/structures
4. Convert hazards to trigger volumes (`sensor={true}`)
5. Update projectiles to use Rapier raycasting (fixes tunneling)

### Phase 2: Migrate Player Movement to Physics

**Current (Level.tsx):**
```typescript
playerRef.current.position.add(moveVec.normalize().multiplyScalar(moveSpeed * delta));
```

**After (with Rapier):**
```typescript
const movement = moveVec.normalize().multiplyScalar(moveSpeed);
characterController.computeColliderMovement(
  playerCollider,
  { x: movement.x * delta, y: -9.81 * delta, z: movement.z * delta }
);
rigidBody.setNextKinematicTranslation(characterController.computedMovement());
```

### Phase 3: Update ECS Movement System

Integrate Rapier with Miniplex:
- Add `RigidBodyRef` component to entities
- MovementSystem updates physics bodies
- Sync transforms from physics after step

### Phase 4: Hazard Trigger Volumes

```tsx
<RigidBody type="fixed" sensor>
  <CuboidCollider args={[5, 0.5, 5]} />
  <ToxicSludge />
</RigidBody>
```

Use `onIntersectionEnter` for damage/slow effects.

---

## 5. LIBRARY INSTALLATION COMMANDS

```bash
# Physics (CRITICAL)
pnpm add @react-three/rapier

# Animation polish (OPTIONAL)
pnpm add @react-spring/three

# Debug tools (DEV)
pnpm add -D leva
```

---

## 6. SUMMARY

| Category | Status |
|----------|--------|
| Tank Controls | ❌ NOT present - using world-space movement |
| Movement Quality | ⚠️ Functional but needs physics engine |
| Library Gaps | ❌ Missing `@react-three/rapier` for proper physics |
| Dev Log Items | ⚠️ 70% resolved, 30% need physics engine |

**PRIMARY RECOMMENDATION:** Add `@react-three/rapier` as it solves:
- Bullet tunneling
- Proper platform collision
- Hazard trigger volumes
- Character controller with slopes/stairs
- Climbing grip zones
- Raft buoyancy physics
