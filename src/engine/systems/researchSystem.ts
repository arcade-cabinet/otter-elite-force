/**
 * Research System — Processes active research at Research Den / Armory buildings.
 *
 * One research at a time per building. Progress ticks over time; on completion,
 * applies global stat effects to all matching units and marks the research as
 * permanently completed in world.runtime.completedResearch.
 *
 * Research queue stored in world.runtime.productionQueues with type "research".
 * Progress stored in the ProductionEntry.progress field (0-100%).
 *
 * Research definitions:
 *   - hardshell_armor: +20 HP to all Mudfoots
 *   - fish_oil_arrows: +3 damage to all Shellcrackers
 *   - demolition_training: +50% Sapper damage
 *   - fortified_walls: Unlocks Stone Walls (passive check)
 *   - gun_emplacements: Unlocks Gun Towers (passive check)
 *   - advanced_rafts: +30% Raftsman speed, +2 carry capacity
 *   - mortar_precision: -30% Mortar Otter scatter (passive check)
 *   - combat_medics: Unlocks medic auto-heal (passive check)
 *   - diving_gear: Unlocks Diver unit (passive check)
 */

import { Attack, Flags, Health, Speed } from "@/engine/world/components";
import { type GameWorld, getProductionQueue, type ProductionEntry } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Research definitions
// ---------------------------------------------------------------------------

export interface ResearchDef {
	id: string;
	name: string;
	cost: { fish?: number; timber?: number; salvage?: number };
	/** Research time in seconds. */
	time: number;
	effect: string;
	/** Building type where this research is performed. */
	researchAt: string;
}

const RESEARCH: Record<string, ResearchDef> = {
	hardshell_armor: {
		id: "hardshell_armor",
		name: "Hardshell Armor",
		cost: { salvage: 150 },
		time: 20,
		effect: "+20 HP to all Mudfoots (80 -> 100)",
		researchAt: "armory",
	},
	fish_oil_arrows: {
		id: "fish_oil_arrows",
		name: "Fish Oil Arrows",
		cost: { salvage: 100 },
		time: 15,
		effect: "+3 damage to Shellcrackers (10 -> 13)",
		researchAt: "armory",
	},
	demolition_training: {
		id: "demolition_training",
		name: "Demolition Training",
		cost: { salvage: 150 },
		time: 20,
		effect: "+50% Sapper damage vs buildings (30 -> 45)",
		researchAt: "armory",
	},
	fortified_walls: {
		id: "fortified_walls",
		name: "Fortified Walls",
		cost: { salvage: 200 },
		time: 25,
		effect: "Unlocks Stone Walls (150 -> 400 HP)",
		researchAt: "armory",
	},
	gun_emplacements: {
		id: "gun_emplacements",
		name: "Gun Emplacements",
		cost: { salvage: 250 },
		time: 30,
		effect: "Unlocks Gun Towers (6 -> 12 dmg)",
		researchAt: "armory",
	},
	demolition_charges: {
		id: "demolition_charges",
		name: "Demolition Charges",
		cost: { salvage: 150 },
		time: 20,
		effect: "+50% Sapper building damage",
		researchAt: "armory",
	},
	advanced_rafts: {
		id: "advanced_rafts",
		name: "Advanced Rafts",
		cost: { salvage: 100 },
		time: 15,
		effect: "+30% Raftsman speed, +2 carry capacity",
		researchAt: "armory",
	},
	mortar_precision: {
		id: "mortar_precision",
		name: "Mortar Precision",
		cost: { salvage: 200 },
		time: 25,
		effect: "-30% Mortar Otter scatter radius",
		researchAt: "armory",
	},
	combat_medics: {
		id: "combat_medics",
		name: "Combat Medics",
		cost: { salvage: 150 },
		time: 20,
		effect: "Medic Marina auto-heals +3 HP/s to nearby units",
		researchAt: "armory",
	},
	diving_gear: {
		id: "diving_gear",
		name: "Diving Gear",
		cost: { salvage: 100 },
		time: 15,
		effect: "Unlocks Diver unit at Dock",
		researchAt: "armory",
	},
};

export function getResearchDef(id: string): ResearchDef | null {
	return RESEARCH[id] ?? null;
}

// ---------------------------------------------------------------------------
// Queue a new research
// ---------------------------------------------------------------------------

/**
 * Start researching a technology at the given building entity.
 * Returns false if: unknown research, already completed, building already
 * researching, wrong building type, or insufficient resources.
 */
export function queueResearch(world: GameWorld, buildingEid: number, researchId: string): boolean {
	const def = RESEARCH[researchId];
	if (!def) return false;

	// Must be researched at the correct building type
	const buildingType = world.runtime.entityTypeIndex.get(buildingEid);
	if (buildingType !== def.researchAt && buildingType !== "research_den") return false;

	// Already completed globally
	if (world.runtime.completedResearch.has(researchId)) return false;

	// Building already has active research (one at a time)
	const queue = world.runtime.productionQueues.get(buildingEid);
	if (queue) {
		const hasActiveResearch = queue.some((e) => e.type === "research");
		if (hasActiveResearch) return false;
	}

	// Check affordability and deduct
	const res = world.session.resources;
	if (
		res.fish < (def.cost.fish ?? 0) ||
		res.timber < (def.cost.timber ?? 0) ||
		res.salvage < (def.cost.salvage ?? 0)
	) {
		return false;
	}

	res.fish -= def.cost.fish ?? 0;
	res.timber -= def.cost.timber ?? 0;
	res.salvage -= def.cost.salvage ?? 0;

	// Add to production queue as a research entry
	const prodQueue = getProductionQueue(world, buildingEid) as ProductionEntry[];
	prodQueue.push({
		type: "research",
		contentId: researchId,
		progress: 0,
	});

	return true;
}

// ---------------------------------------------------------------------------
// Per-frame research system
// ---------------------------------------------------------------------------

/**
 * Tick research progress on all buildings with active research in their
 * production queue. On completion: apply effects, mark completed, clear entry.
 */
export function runResearchSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] !== 1) continue;

		const queue = world.runtime.productionQueues.get(eid);
		if (!queue || queue.length === 0) continue;

		// Find active research entry (first one of type "research")
		const researchIdx = queue.findIndex((e) => e.type === "research");
		if (researchIdx === -1) continue;

		const entry = queue[researchIdx];
		const def = RESEARCH[entry.contentId];
		if (!def) {
			// Unknown research — remove entry
			queue.splice(researchIdx, 1);
			continue;
		}

		// Advance progress: 100% / researchTime per second
		entry.progress += (100 / def.time) * deltaSec;

		if (entry.progress >= 100) {
			// Mark completed in world
			world.runtime.completedResearch.add(entry.contentId);

			// Apply global effects
			applyResearchEffect(world, entry.contentId);

			world.events.push({
				type: "research-complete",
				payload: { researchId: entry.contentId },
			});

			// Remove from queue
			queue.splice(researchIdx, 1);
		}
	}
}

// ---------------------------------------------------------------------------
// Effect application
// ---------------------------------------------------------------------------

/**
 * Apply the permanent stat effect of a completed research to all matching
 * entities currently in the world.
 */
function applyResearchEffect(world: GameWorld, researchId: string): void {
	switch (researchId) {
		case "hardshell_armor":
			// +20 HP to all Mudfoots (80 -> 100)
			applyToUnitsOfType(world, "mudfoot", (eid) => {
				Health.current[eid] += 20;
				Health.max[eid] += 20;
			});
			break;

		case "fish_oil_arrows":
			// +3 damage to all Shellcrackers (10 -> 13)
			applyToUnitsOfType(world, "shellcracker", (eid) => {
				Attack.damage[eid] += 3;
			});
			break;

		case "demolition_training":
			// +50% Sapper damage vs buildings
			applyToUnitsOfType(world, "sapper", (eid) => {
				Attack.damage[eid] = Math.round(Attack.damage[eid] * 1.5);
			});
			break;

		case "advanced_rafts":
			// +30% Raftsman speed
			applyToUnitsOfType(world, "raftsman", (eid) => {
				Speed.value[eid] = Math.round(Speed.value[eid] * 1.3);
			});
			break;

		// Research items that unlock buildings or are passive modifiers
		// (fortified_walls, gun_emplacements, mortar_precision, combat_medics,
		// diving_gear) — their effects are checked at build/use time via
		// world.runtime.completedResearch.has(). No immediate stat changes.
		default:
			break;
	}
}

/**
 * Helper: iterate all non-building entities matching a unit type and apply fn.
 */
function applyToUnitsOfType(world: GameWorld, unitType: string, fn: (eid: number) => void): void {
	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] === 1) continue;
		if (Flags.isResource[eid] === 1) continue;
		if (Flags.isProjectile[eid] === 1) continue;

		const entityType = world.runtime.entityTypeIndex.get(eid);
		if (entityType !== unitType) continue;

		fn(eid);
	}
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Check if a research has been completed.
 */
export function isResearchCompleted(world: GameWorld, researchId: string): boolean {
	return world.runtime.completedResearch.has(researchId);
}
