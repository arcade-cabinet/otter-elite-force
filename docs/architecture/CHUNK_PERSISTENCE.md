# Chunk Persistence System

## Overview

The chunk persistence system implements the "fixed-on-discovery" mandate for OTTER: ELITE FORCE's open world. Once a player discovers a chunk, it is permanently generated and stored, never regenerating on revisit. This ensures a consistent, persistent world where player actions have lasting consequences.

## Architecture

### Core Principle: Fixed-on-Discovery

```typescript
// First visit - chunk is generated and stored
const chunk1 = store.discoverChunk(5, 3);  // Generates new chunk

// Later visit - exact same chunk is returned
const chunk2 = store.discoverChunk(5, 3);  // Returns cached chunk
// chunk1 === chunk2 (same entities, same positions)
```

### Data Structure

```typescript
interface ChunkData {
  id: string;                    // "x,z" format
  x: number;                     // Chunk X coordinate
  z: number;                     // Chunk Z coordinate
  seed: number;                  // Deterministic generation seed
  terrainType: TerrainType;      // RIVER, MARSH, DENSE_JUNGLE
  secured: boolean;              // Legacy field (kept for compatibility)
  territoryState: TerritoryState; // HOSTILE, NEUTRAL, SECURED
  entities: ChunkEntity[];       // All entities in chunk
  decorations: ChunkDecoration[]; // Visual elements
  lastVisited?: number;          // Timestamp of last visit
  hibernated?: boolean;          // AI processing suspended
}
```

## Features

### 1. Entity State Persistence

Entity states (health, position, captured status) persist across sessions:

```typescript
// Discover chunk and damage an enemy
const chunk = store.discoverChunk(2, 2);
const enemy = chunk.entities[0];
store.updateChunkEntity("2,2", enemy.id, { hp: 5 });

// Later session - enemy still has 5 HP
const chunk2 = store.discoverChunk(2, 2);
const savedEnemy = chunk2.entities.find(e => e.id === enemy.id);
// savedEnemy.hp === 5
```

### 2. Territory State System

Chunks track ownership with three states:

- **NEUTRAL**: Unclaimed territory (default for new chunks)
- **HOSTILE**: Enemy-controlled areas (future implementation)
- **SECURED**: URA-controlled territory (player secured)

```typescript
// Secure a chunk
store.discoverChunk(3, 3);
store.secureChunk("3,3");

// Chunk now has:
// - territoryState: "SECURED"
// - Visual URA flag entity at center
// - Increased peacekeeping score
```

### 3. Chunk Hibernation

Distant chunks can be hibernated to optimize performance:

```typescript
// Hibernate chunks > 2 chunks away from player at (0, 0)
store.hibernateDistantChunks(0, 0, 2);

// Nearby chunks remain active, distant chunks hibernated
// Hibernated chunks have AI processing suspended
const activeChunks = store.getActiveChunks();
```

**Benefits:**
- Reduced AI processing for distant chunks
- Better performance with 50+ discovered chunks
- Automatic wake-up when player approaches

### 4. Visit Tracking

Chunks track when they were last visited:

```typescript
// Mark chunk as visited
store.visitChunk("4,4");

// Check last visit time
const chunk = store.saveData.discoveredChunks["4,4"];
console.log(chunk.lastVisited); // Timestamp
```

## HUD Integration

### Coordinate Display

The HUD shows both world position and chunk grid coordinates:

```
COORD: 234, 567           (World coordinates)
CHUNK: [2, 5] • NEUTRAL   (Chunk grid + territory state)
```

### Territory Status

Territory state is color-coded:
- 🟢 **GREEN**: SECURED (player controlled)
- 🔴 **RED**: HOSTILE (enemy controlled)
- 🟠 **ORANGE**: NEUTRAL (unclaimed)

### Minimap

The minimap displays territory states with CSS classes:
- `.territory-secured` - Green tint
- `.territory-hostile` - Red tint  
- `.territory-neutral` - Orange tint

## API Reference

### Store Methods

#### `discoverChunk(x: number, z: number): ChunkData`
Discovers or retrieves a chunk. First call generates and stores the chunk, subsequent calls return the cached version.

#### `updateChunkEntity(chunkId: string, entityId: string, updates: Partial<ChunkEntity>): void`
Updates a specific entity's state within a chunk. Changes are persisted to localStorage.

#### `visitChunk(chunkId: string): void`
Marks a chunk as visited with current timestamp. Also sets hibernated to false.

#### `secureChunk(chunkId: string): void`
Secures a chunk for URA control:
- Sets `territoryState` to "SECURED"
- Adds visual flag entity
- Updates strategic objectives
- Increases peacekeeping score

#### `hibernateDistantChunks(centerX: number, centerZ: number, distance?: number): void`
Hibernates chunks beyond specified distance threshold (default: 2 chunks).

#### `getActiveChunks(): ChunkData[]`
Returns array of all non-hibernated chunks.

## Performance Characteristics

### Memory
- Each chunk: ~2-5 KB serialized
- 100 chunks: ~200-500 KB
- localStorage limit: 5-10 MB (2000-5000 chunks)

### Processing
- Chunk discovery: O(1) if cached, O(n) if new (n = entities)
- Entity update: O(n) where n = entities per chunk
- Hibernation: O(m) where m = total discovered chunks
- Tested performant with 50+ chunks

## Data Migration

Old saves (v7) are automatically migrated to v8 schema:

```typescript
// Old chunk (v7)
{
  id: "5,5",
  x: 5, z: 5,
  seed: 123,
  terrainType: "RIVER",
  secured: false,
  entities: [...],
  decorations: [...]
}

// After migration (v8)
{
  id: "5,5",
  x: 5, z: 5,
  seed: 123,
  terrainType: "RIVER",
  secured: false,
  territoryState: "NEUTRAL",  // Added
  lastVisited: 1234567890,    // Added
  hibernated: false,           // Added
  entities: [...],
  decorations: [...]
}
```

## Testing

### Unit Tests (10 tests)
- Entity state persistence (3 tests)
- Territory state system (3 tests)
- Chunk hibernation (4 tests)

### E2E Tests (8 tests)
- Cross-session persistence
- Entity state preservation
- Territory tracking
- Hibernation system
- Visit timestamps
- Schema migration
- 50+ chunk performance

Run tests:
```bash
npm run test -- src/stores/gameStore.test.ts  # Unit tests
npm run test:e2e -- chunk-persistence.spec.ts # E2E tests
```

## Future Enhancements

### Potential Improvements
1. **IndexedDB Storage**: For larger worlds (1000+ chunks)
2. **Chunk Streaming**: Load chunks on-demand from storage
3. **Hostile Territory**: AI-driven enemy territory control
4. **Territory Contests**: Dynamic territory ownership changes
5. **Chunk Compression**: Reduce storage footprint

### Integration Points
- **ECS System**: Chunk entities spawn as Miniplex entities
- **AI System**: Use `hibernated` flag to skip AI processing
- **Save System**: Chunks persist automatically via gameStore
- **World Generator**: Deterministic generation from seed

## Best Practices

### DO ✅
- Always use `discoverChunk()` to access chunks
- Update entity state via `updateChunkEntity()` for persistence
- Call `hibernateDistantChunks()` periodically for performance
- Check `chunk.hibernated` before processing AI

### DON'T ❌
- Don't regenerate chunks (breaks fixed-on-discovery)
- Don't mutate chunk data directly (use store methods)
- Don't assume chunks exist (check discoveredChunks first)
- Don't skip save calls after important changes

## Architecture Decisions

### Why Zustand + localStorage?
- **Simple**: Single source of truth
- **Automatic**: Changes auto-save via store methods
- **Fast**: In-memory access, async persistence
- **Testable**: Easy to mock and test

### Why Hibernation vs Unloading?
- Preserves chunk in memory for quick access
- Allows fast awakening when player approaches
- Enables querying all chunks (for minimap, etc.)
- Simpler than async chunk loading

### Why Territory State + Secured Flag?
- `territoryState`: New system for fine-grained control
- `secured`: Legacy compatibility with existing code
- Both maintained until full migration complete

## See Also

- [Project Brief](memory-bank/projectbrief.md) - Core requirements
- [Game Store](src/stores/gameStore.ts) - Implementation
- [Types](src/stores/types.ts) - Type definitions
- [World Generator](src/stores/worldGenerator.ts) - Chunk generation
