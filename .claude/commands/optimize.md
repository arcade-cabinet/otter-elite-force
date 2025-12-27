---
allowed-tools: Read,Glob,Grep,LS
description: Analyze code for performance optimizations
---

# Performance Optimization Analysis

Analyze the specified code for performance issues and suggest optimizations.

## Usage

`/optimize <file-or-pattern>`

## Analysis Areas

### 1. Three.js / R3F Performance
- Resource disposal in useEffect cleanup
- InstancedMesh usage for repeated objects
- Material/geometry reuse
- Draw call optimization

### 2. React Performance
- Unnecessary re-renders
- Missing useMemo/useCallback
- Zustand selector optimization
- useFrame callback efficiency

### 3. Memory Management
- Object pooling opportunities
- Garbage collection triggers
- Array pre-allocation
- Avoiding closures in hot paths

### 4. Animation Loop (useFrame)
- Heavy computations that should be memoized
- Object creation inside loop
- State updates causing re-renders

### 5. Mobile-Specific
- Touch event handling efficiency
- Reduced polygon counts
- Simpler shaders
- Battery-conscious audio

## Output Format

For each optimization found:

1. **Issue**: What the problem is
2. **Location**: File, function, line
3. **Impact**: Estimated performance improvement
4. **Solution**: Specific code change with example
5. **Priority**: Critical / High / Medium / Low

## Game-Specific Considerations

- Target: 60 FPS on mobile devices
- InstancedMesh for bullets, particles, enemies
- Yuka AI update efficiency
- Tone.js audio context management

---
