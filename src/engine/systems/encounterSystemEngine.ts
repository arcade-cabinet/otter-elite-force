/**
 * Encounter System (Engine) -- PRNG-driven random encounter spawns.
 *
 * Each encounter entry defines a composition of enemies, a spawn zone,
 * an interval with variance, and a max spawn count. The system uses
 * the gameplay seed for deterministic rolls.
 *
 * Pure function on GameWorld.
 */

import { getUnitTemplate } from "@/engine/content/templateLoader";
import { createRng, deriveGameplaySeed, type Rng } from "@/engine/random/seed";
import { Attack, Speed, VisionRadius } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { spawnUnit } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EncounterComposition {
	unitType: string;
	count: number;
	variance: number;
}

export interface EncounterEntry {
	composition: EncounterComposition[];
	spawnZone: string;
	intervalMs: number;
	intervalVariance: number;
	maxSpawns: number;
	requiresPhase?: string;
}

// ---------------------------------------------------------------------------
// Default encounter tables
// ---------------------------------------------------------------------------

export const DEFAULT_ENCOUNTER_ENTRIES: EncounterEntry[] = [
	{
		composition: [
			{ unitType: "gator", count: 2, variance: 1 },
			{ unitType: "skink", count: 1, variance: 1 },
		],
		spawnZone: "patrol",
		intervalMs: 120_000,
		intervalVariance: 30_000,
		maxSpawns: 5,
	},
	{
		composition: [
			{ unitType: "viper", count: 1, variance: 1 },
			{ unitType: "gator", count: 1, variance: 0 },
		],
		spawnZone: "encounter",
		intervalMs: 180_000,
		intervalVariance: 45_000,
		maxSpawns: 3,
	},
];

// ---------------------------------------------------------------------------
// Encounter RNG
// ---------------------------------------------------------------------------

let encounterRng: Rng | null = null;
let encounterRngSeed = -1;

function getEncounterRng(world: GameWorld): Rng {
	const seed = world.rng.gameplaySeeds.encounter ?? world.rng.numericSeed;
	if (encounterRng === null || encounterRngSeed !== seed) {
		encounterRngSeed = seed;
		encounterRng = createRng(deriveGameplaySeed(seed, `encounter-${world.time.tick}`));
	}
	return encounterRng;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find a matching zone rect for a spawn zone pattern.
 * Zones match if their ID contains the pattern string.
 */
function findSpawnZone(
	world: GameWorld,
	pattern: string,
): { zoneId: string; rect: { x: number; y: number; width: number; height: number } } | null {
	for (const [zoneId, rect] of world.runtime.zoneRects) {
		if (zoneId.includes(pattern)) {
			return { zoneId, rect };
		}
	}
	return null;
}

/**
 * Spawn a unit from content registry at a position within a zone rect.
 */
function spawnEncounterUnit(
	world: GameWorld,
	unitType: string,
	rect: { x: number; y: number; width: number; height: number },
	rng: Rng,
): number {
	const unitDef = getUnitTemplate(unitType);

	// Randomize position within zone
	const x = rect.x + rng.nextInt(Math.max(1, Math.floor(rect.width)));
	const y = rect.y + rng.nextInt(Math.max(1, Math.floor(rect.height)));

	const eid = spawnUnit(world, {
		x,
		y,
		faction: unitDef.faction,
		unitType: unitDef.id,
		health: { current: unitDef.stats.hp, max: unitDef.stats.hp },
	});
	Attack.damage[eid] = unitDef.stats.attackDamage;
	Attack.range[eid] = unitDef.stats.attackRange;
	Attack.cooldown[eid] = unitDef.stats.attackCooldownMs / 1000;
	Speed.value[eid] = unitDef.stats.speed;
	VisionRadius.value[eid] = unitDef.stats.visionRadius;
	return eid;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize encounter entries on the world. Call during mission bootstrap.
 * If no custom entries are provided, uses DEFAULT_ENCOUNTER_ENTRIES.
 */
export function initEncounterEntries(world: GameWorld, entries?: EncounterEntry[]): void {
	const source = entries ?? DEFAULT_ENCOUNTER_ENTRIES;
	world.runtime.encounterEntries = source.map((e) => ({
		...e,
		composition: e.composition.map((c) => ({ ...c })),
	}));
	world.runtime.encounterState = source.map(() => ({ timerMs: 0, spawnCount: 0 }));
}

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the encounter system.
 * Checks encounter timers, rolls composition with variance, and spawns enemies.
 */
export function runEncounterSystem(world: GameWorld): void {
	const deltaMs = world.time.deltaMs;
	if (deltaMs <= 0) return;

	const entries = world.runtime.encounterEntries;
	const state = world.runtime.encounterState;

	// Ensure state array matches entries
	while (state.length < entries.length) {
		state.push({ timerMs: 0, spawnCount: 0 });
	}

	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];
		const s = state[i];

		// Check phase requirement
		if (entry.requiresPhase && world.runtime.scenarioPhase !== entry.requiresPhase) {
			continue;
		}

		// Check max spawns
		if (s.spawnCount >= entry.maxSpawns) {
			continue;
		}

		// Advance timer
		s.timerMs += deltaMs;

		// Calculate actual interval with variance
		const rng = getEncounterRng(world);
		const varianceOffset =
			entry.intervalVariance > 0
				? rng.nextInt(entry.intervalVariance * 2) - entry.intervalVariance
				: 0;
		const actualInterval = entry.intervalMs + varianceOffset;

		if (s.timerMs < actualInterval) {
			continue;
		}

		// Timer fired -- reset
		s.timerMs -= actualInterval;

		// Find spawn zone
		const zone = findSpawnZone(world, entry.spawnZone);
		if (!zone) continue;

		// Roll composition with variance
		let spawnedAny = false;
		for (const comp of entry.composition) {
			const variance = comp.variance > 0 ? rng.nextInt(comp.variance * 2 + 1) - comp.variance : 0;
			const count = Math.max(0, comp.count + variance);

			for (let j = 0; j < count; j++) {
				spawnEncounterUnit(world, comp.unitType, zone.rect, rng);
				spawnedAny = true;
			}
		}

		if (spawnedAny) {
			s.spawnCount++;
			world.events.push({
				type: "encounter-spawned",
				payload: {
					zoneId: zone.zoneId,
					entryIndex: i,
					spawnCount: s.spawnCount,
				},
			});
		}
	}
}

/**
 * Reset encounter state (for tests and new missions).
 */
export function resetEncounterState(): void {
	encounterRng = null;
	encounterRngSeed = -1;
}
