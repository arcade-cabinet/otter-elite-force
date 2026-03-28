/**
 * Wave Spawner System -- Spawns enemy waves at timed intervals.
 *
 * Reads waveCounter from world.runtime and spawns enemy entities
 * based on the current scenario phase. Wave spawning is triggered
 * by scenario actions (setWaveCounter, incrementWaveCounter) and
 * this system handles the actual entity spawning.
 *
 * Composition scales with wave count:
 *   Early (1-3):  skinks + a few gators
 *   Mid   (4-6):  gators + vipers + scout_lizards
 *   Late  (7+):   croc_champions + siphon_drones + snappers
 *
 * Stats are pulled from the entity registry (getUnit()) — no
 * hardcoded HP/damage values.
 *
 * Pure function on GameWorld.
 */

import { TILE_SIZE } from "@/config/constants";
import { resolveCategoryId } from "@/engine/content/ids";
import { createRng, deriveGameplaySeed, type Rng } from "@/engine/random/seed";
import { Armor, Attack, Speed, VisionRadius } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { spawnUnit } from "@/engine/world/gameWorld";
import { getUnit } from "@/entities/registry";
import type { UnitDef } from "@/entities/types";

// ---------------------------------------------------------------------------
// Wave composition tables
// ---------------------------------------------------------------------------

/** A weighted entry in the wave composition pool. */
interface WaveSlot {
	unitType: string;
	/** Relative weight for PRNG selection. */
	weight: number;
}

/** Early waves (1-3): cannon-fodder skinks backed by a few gators. */
const EARLY_POOL: readonly WaveSlot[] = [
	{ unitType: "skink", weight: 5 },
	{ unitType: "gator", weight: 2 },
];

/** Mid waves (4-6): infantry core with ranged and scout support. */
const MID_POOL: readonly WaveSlot[] = [
	{ unitType: "gator", weight: 4 },
	{ unitType: "viper", weight: 3 },
	{ unitType: "scout_lizard", weight: 2 },
	{ unitType: "skink", weight: 1 },
];

/** Late waves (7+): elite heavies, support drainers, and turrets. */
const LATE_POOL: readonly WaveSlot[] = [
	{ unitType: "croc_champion", weight: 3 },
	{ unitType: "siphon_drone", weight: 2 },
	{ unitType: "snapper", weight: 2 },
	{ unitType: "gator", weight: 2 },
	{ unitType: "viper", weight: 1 },
];

function getPoolForWave(waveCounter: number): readonly WaveSlot[] {
	if (waveCounter <= 3) return EARLY_POOL;
	if (waveCounter <= 6) return MID_POOL;
	return LATE_POOL;
}

// ---------------------------------------------------------------------------
// Weighted random pick
// ---------------------------------------------------------------------------

function pickWeighted(pool: readonly WaveSlot[], rng: Rng): string {
	let totalWeight = 0;
	for (const slot of pool) {
		totalWeight += slot.weight;
	}
	let roll = rng.next() * totalWeight;
	for (const slot of pool) {
		roll -= slot.weight;
		if (roll <= 0) return slot.unitType;
	}
	// Fallback to last entry (shouldn't happen with valid weights).
	return pool[pool.length - 1].unitType;
}

// ---------------------------------------------------------------------------
// Per-session wave RNG (lazy, seeded from gameplaySeeds.waves)
// ---------------------------------------------------------------------------

let waveRng: Rng | null = null;
let waveRngSeed = -1;

function getWaveRng(world: GameWorld): Rng {
	const seed = world.rng.gameplaySeeds.waves ?? world.rng.numericSeed;
	if (waveRng === null || waveRngSeed !== seed) {
		waveRngSeed = seed;
		waveRng = createRng(deriveGameplaySeed(seed, `waves-${world.time.tick}`));
	}
	return waveRng;
}

// ---------------------------------------------------------------------------
// Wave timers
// ---------------------------------------------------------------------------

/** Accumulated wave spawn timer per wave counter value. */
const waveTimers = new Map<number, number>();

/** Minimum interval between wave spawns in seconds. */
const WAVE_COOLDOWN = 30;

// ---------------------------------------------------------------------------
// Spawn helper
// ---------------------------------------------------------------------------

/**
 * Spawn a single enemy unit from its registry definition.
 *
 * Reads HP, armor, damage, range, speed, and vision from the UnitDef
 * so stats stay in sync with the entity data files.
 */
function spawnWaveUnit(world: GameWorld, def: UnitDef, x: number, y: number): number {
	const eid = spawnUnit(world, {
		x,
		y,
		faction: def.faction,
		unitType: def.id,
		categoryId: resolveCategoryId(def.category),
		health: { current: def.hp, max: def.hp },
	});
	Armor.value[eid] = def.armor;
	Attack.damage[eid] = def.damage;
	Attack.range[eid] = def.range * TILE_SIZE;
	Attack.cooldown[eid] = def.attackCooldown;
	Speed.value[eid] = def.speed * TILE_SIZE;
	VisionRadius.value[eid] = def.visionRadius * TILE_SIZE;
	return eid;
}

// ---------------------------------------------------------------------------
// Main tick
// ---------------------------------------------------------------------------

/**
 * Run one tick of the wave spawner system.
 * Manages wave timing and spawning based on scenario state.
 */
export function runWaveSpawnerSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	const waveCounter = world.runtime.waveCounter;
	if (waveCounter <= 0) return;

	// Track time for current wave
	const timer = (waveTimers.get(waveCounter) ?? 0) + deltaSec;
	waveTimers.set(waveCounter, timer);

	// Only spawn once per wave counter value
	if (timer < WAVE_COOLDOWN) return;

	// Reset timer so we don't spawn again for this wave value
	waveTimers.set(waveCounter, -999999);

	const rng = getWaveRng(world);
	const pool = getPoolForWave(waveCounter);

	// Find enemy spawn zones
	for (const [zoneId, rect] of world.runtime.zoneRects) {
		if (!zoneId.includes("enemy") && !zoneId.includes("spawn") && !zoneId.includes("scale")) {
			continue;
		}

		// Wave size scales with wave counter, capped at 8
		const count = Math.min(2 + waveCounter, 8);

		for (let i = 0; i < count; i++) {
			const unitType = pickWeighted(pool, rng);
			const def = getUnit(unitType);
			if (!def) {
				console.warn(`[waveSpawner] Unknown unit type '${unitType}', skipping`);
				continue;
			}

			// Scatter units within the zone rect using RNG
			const x = rect.x + rng.nextInt(Math.max(1, Math.floor(rect.width)));
			const y = rect.y + rng.nextInt(Math.max(1, Math.floor(rect.height)));

			spawnWaveUnit(world, def, x, y);
		}

		world.events.push({
			type: "wave-spawned",
			payload: {
				waveCounter,
				count,
				zoneId,
			},
		});
		break; // One spawn zone per wave
	}
}

/** Reset wave timers (for new missions/tests). */
export function resetWaveTimers(): void {
	waveTimers.clear();
	waveRng = null;
	waveRngSeed = -1;
}
