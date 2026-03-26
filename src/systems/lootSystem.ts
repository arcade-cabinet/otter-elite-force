/**
 * Loot System — resource drops on enemy unit death.
 *
 * When an enemy entity dies, rolls against its loot table using gameplay
 * noise (GameClock.tick seed) and spawns resource pickups at the death
 * position.
 *
 * Loot tables are per-unit-type with configurable drop rates and amounts.
 * Uses the shared noise utility for deterministic-per-tick rolls.
 */

import type { Entity, World } from "koota";
import { Faction } from "@/ecs/traits/identity";
import { GameClock, ResourcePool } from "@/ecs/traits/state";
import { createNoise } from "@/utils/noise";

// ─── Loot Table ───

export interface LootEntry {
	/** Resource type: "fish" | "timber" | "salvage" */
	resource: "fish" | "timber" | "salvage";
	/** Drop probability [0, 1] */
	chance: number;
	/** Amount range [min, max] */
	min: number;
	max: number;
}

/**
 * Loot tables keyed by unit type.
 * Only enemy units drop loot. Player units don't.
 */
export const LOOT_TABLES: Record<string, LootEntry[]> = {
	// Basic enemies — small resource drops
	skink: [{ resource: "fish", chance: 0.3, min: 5, max: 10 }],
	gator: [
		{ resource: "salvage", chance: 0.5, min: 10, max: 20 },
		{ resource: "fish", chance: 0.3, min: 5, max: 15 },
	],
	viper: [{ resource: "salvage", chance: 0.4, min: 8, max: 15 }],
	scout_lizard: [{ resource: "timber", chance: 0.2, min: 5, max: 10 }],
	snapper: [{ resource: "salvage", chance: 0.6, min: 15, max: 30 }],
	// Elite enemies — guaranteed drops
	croc_champion: [
		{ resource: "salvage", chance: 0.9, min: 25, max: 50 },
		{ resource: "fish", chance: 0.6, min: 15, max: 30 },
		{ resource: "timber", chance: 0.4, min: 10, max: 20 },
	],
	siphon_drone: [{ resource: "salvage", chance: 0.7, min: 10, max: 25 }],
	serpent_king: [
		{ resource: "salvage", chance: 1.0, min: 100, max: 200 },
		{ resource: "fish", chance: 1.0, min: 50, max: 100 },
		{ resource: "timber", chance: 1.0, min: 50, max: 100 },
	],
};

/**
 * Roll loot drops for a killed entity and add resources to the pool.
 *
 * @param world - The Koota ECS world.
 * @param entity - The entity that just died (must still have traits).
 * @param unitType - The unit type string.
 */
export function rollLootDrops(world: World, entity: Entity, unitType: string): void {
	const table = LOOT_TABLES[unitType];
	if (!table) return;

	// Only enemy deaths drop loot
	const faction = entity.has(Faction) ? entity.get(Faction) : null;
	if (!faction || faction.id === "ura") return;

	// Seed from game clock tick for deterministic gameplay rolls
	const tick = world.get(GameClock)?.tick ?? 0;
	const noise = createNoise(tick * 31 + entity.id());

	const pool = world.get(ResourcePool);
	if (!pool) return;

	let fishDrop = 0;
	let timberDrop = 0;
	let salvageDrop = 0;

	for (const entry of table) {
		if (!noise.chance(entry.chance)) continue;
		const amount = noise.int(entry.min, entry.max);
		switch (entry.resource) {
			case "fish":
				fishDrop += amount;
				break;
			case "timber":
				timberDrop += amount;
				break;
			case "salvage":
				salvageDrop += amount;
				break;
		}
	}

	if (fishDrop > 0 || timberDrop > 0 || salvageDrop > 0) {
		world.set(ResourcePool, {
			fish: pool.fish + fishDrop,
			timber: pool.timber + timberDrop,
			salvage: pool.salvage + salvageDrop,
		});
	}
}
