/**
 * Loot System -- Drop tables for enemy deaths.
 *
 * Each enemy unit type has a drop table defining what resources it may
 * yield on death. Rolls are deterministic via world.rng gameplay seed.
 *
 * Hooks into combatSystem death handling via world events.
 * Pure function on GameWorld.
 */

import { FACTION_IDS } from "@/engine/content/ids";
import { createRng, deriveGameplaySeed, type Rng } from "@/engine/random/seed";
import { Faction, Flags } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Drop table types
// ---------------------------------------------------------------------------

export interface DropTableEntry {
	resource?: "fish" | "timber" | "salvage";
	amount: number;
	maxAmount?: number;
	probability: number;
	xpBonus?: number;
}

export interface DropTable {
	entries: DropTableEntry[];
}

// ---------------------------------------------------------------------------
// Per-enemy drop tables
// ---------------------------------------------------------------------------

export const DROP_TABLES: Record<string, DropTable> = {
	scale_grunt: {
		entries: [{ resource: "fish", amount: 5, maxAmount: 10, probability: 0.5 }],
	},
	scale_archer: {
		entries: [
			{ resource: "fish", amount: 5, maxAmount: 8, probability: 0.5 },
			{ resource: "timber", amount: 3, maxAmount: 5, probability: 0.2 },
		],
	},
	scale_brute: {
		entries: [
			{ resource: "fish", amount: 10, maxAmount: 15, probability: 0.7 },
			{ resource: "timber", amount: 5, maxAmount: 10, probability: 0.3 },
		],
	},
	scale_sniper: {
		entries: [
			{ resource: "fish", amount: 8, maxAmount: 12, probability: 0.6 },
			{ resource: "salvage", amount: 5, maxAmount: 5, probability: 0.25 },
		],
	},
	scale_demolisher: {
		entries: [
			{ resource: "fish", amount: 8, maxAmount: 15, probability: 0.8 },
			{ resource: "timber", amount: 5, maxAmount: 10, probability: 0.4 },
			{ resource: "salvage", amount: 3, maxAmount: 8, probability: 0.2 },
		],
	},
	scale_commander: {
		entries: [
			{ resource: "fish", amount: 15, maxAmount: 25, probability: 0.9 },
			{ resource: "timber", amount: 10, maxAmount: 15, probability: 0.5 },
			{ resource: "salvage", amount: 5, maxAmount: 10, probability: 0.4 },
		],
	},
	boss_ironjaw: {
		entries: [
			{ resource: "fish", amount: 50, maxAmount: 50, probability: 1.0 },
			{ resource: "timber", amount: 30, maxAmount: 30, probability: 1.0 },
			{ resource: "salvage", amount: 20, maxAmount: 20, probability: 1.0 },
		],
	},
	siphon_drone: {
		entries: [{ resource: "salvage", amount: 5, maxAmount: 5, probability: 1.0 }],
	},
	// Legacy unit types mapped to new drop tables
	skink: {
		entries: [{ resource: "fish", amount: 5, maxAmount: 10, probability: 0.5 }],
	},
	gator: {
		entries: [
			{ resource: "fish", amount: 5, maxAmount: 15, probability: 0.5 },
			{ resource: "salvage", amount: 10, maxAmount: 20, probability: 0.3 },
		],
	},
	viper: {
		entries: [{ resource: "salvage", amount: 8, maxAmount: 15, probability: 0.4 }],
	},
	scout_lizard: {
		entries: [{ resource: "timber", amount: 5, maxAmount: 10, probability: 0.2 }],
	},
	snapper: {
		entries: [{ resource: "salvage", amount: 15, maxAmount: 30, probability: 0.6 }],
	},
	croc_champion: {
		entries: [
			{ resource: "salvage", amount: 25, maxAmount: 50, probability: 0.9 },
			{ resource: "fish", amount: 15, maxAmount: 30, probability: 0.6 },
			{ resource: "timber", amount: 10, maxAmount: 20, probability: 0.4 },
		],
	},
	serpent_king: {
		entries: [
			{ resource: "salvage", amount: 100, maxAmount: 200, probability: 1.0 },
			{ resource: "fish", amount: 50, maxAmount: 100, probability: 1.0 },
			{ resource: "timber", amount: 50, maxAmount: 100, probability: 1.0 },
		],
	},
};

// ---------------------------------------------------------------------------
// Loot RNG
// ---------------------------------------------------------------------------

/** Per-session loot RNG, lazily created from the gameplay seed. */
let lootRng: Rng | null = null;
let lootRngSeed = -1;

function getLootRng(world: GameWorld): Rng {
	const seed = world.rng.gameplaySeeds.loot ?? world.rng.numericSeed;
	if (lootRng === null || lootRngSeed !== seed) {
		lootRngSeed = seed;
		lootRng = createRng(deriveGameplaySeed(seed, `loot-${world.time.tick}`));
	}
	return lootRng;
}

// ---------------------------------------------------------------------------
// Loot rolling
// ---------------------------------------------------------------------------

/**
 * Roll loot for a specific unit type using deterministic RNG.
 * Returns the resources awarded (for testing/inspection).
 */
export function rollLootFromTable(
	world: GameWorld,
	unitType: string,
	eid: number,
): Array<{ resource: "fish" | "timber" | "salvage"; amount: number }> {
	// Check runtime loot tables first, then static tables
	const runtimeTable = world.runtime.lootTables.get(unitType);
	const staticTable = DROP_TABLES[unitType];

	const results: Array<{ resource: "fish" | "timber" | "salvage"; amount: number }> = [];

	if (runtimeTable) {
		// Use legacy runtime table format
		const rng = getLootRng(world);
		for (const entry of runtimeTable) {
			if (rng.next() > entry.chance) continue;
			const amount = entry.min + rng.nextInt(entry.max - entry.min + 1);
			if (amount <= 0) continue;
			world.session.resources[entry.resource] += amount;
			results.push({ resource: entry.resource, amount });
			world.events.push({
				type: "loot-collected",
				payload: { eid, resource: entry.resource, amount },
			});
		}
	} else if (staticTable) {
		const rng = getLootRng(world);
		for (const entry of staticTable.entries) {
			if (!entry.resource) continue;
			if (rng.next() > entry.probability) continue;
			const maxAmt = entry.maxAmount ?? entry.amount;
			const amount = entry.amount + rng.nextInt(maxAmt - entry.amount + 1);
			if (amount <= 0) continue;
			world.session.resources[entry.resource] += amount;
			results.push({ resource: entry.resource, amount });
			world.events.push({
				type: "loot-collected",
				payload: { eid, resource: entry.resource, amount },
			});
		}
	}

	return results;
}

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the loot system.
 * Processes unit-died events and rolls loot from drop tables.
 */
export function runLootSystem(world: GameWorld): void {
	for (const eid of world.runtime.removals) {
		if (Faction.id[eid] === FACTION_IDS.ura) continue;
		if (Faction.id[eid] === FACTION_IDS.neutral) continue;
		if (Flags.isResource[eid] === 1) continue;
		if (Flags.isProjectile[eid] === 1) continue;

		const unitType = world.runtime.entityTypeIndex.get(eid);
		if (!unitType) continue;

		rollLootFromTable(world, unitType, eid);
	}
}

/**
 * Reset loot RNG state (for tests and new missions).
 */
export function resetLootRng(): void {
	lootRng = null;
	lootRngSeed = -1;
}
