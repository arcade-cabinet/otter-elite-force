/**
 * Research System — processes active research at Armory buildings.
 *
 * One research at a time per Armory (ResearchSlot AoS trait).
 * Progress ticks over time; on completion, applies global stat effects
 * to all matching units and marks the research as permanently completed
 * in the resource store.
 */

import type { Entity, World } from "koota";
import { RESEARCH } from "../data/research";
import { Attack, Health } from "../ecs/traits/combat";
import { ResearchSlot } from "../ecs/traits/economy";
import { IsBuilding, UnitType } from "../ecs/traits/identity";
import { CompletedResearch, ResourcePool } from "../ecs/traits/state";
import { world as defaultWorld } from "../ecs/world";
import { EventBus } from "../game/EventBus";

// ---------------------------------------------------------------------------
// Queue a new research at an Armory
// ---------------------------------------------------------------------------

/**
 * Start researching a technology at the given building.
 * Returns false if: unknown research, already completed, building already
 * researching, wrong building type, or insufficient resources.
 */
export function queueResearch(
	building: Entity,
	researchId: string,
	world: World = defaultWorld,
): boolean {
	const def = RESEARCH[researchId];
	if (!def) return false;

	// Must be researched at the correct building type
	const buildingType = building.get(UnitType)?.type;
	if (buildingType !== def.researchAt) return false;

	// Already completed globally
	const completed = world.get(CompletedResearch);
	if (completed?.ids.has(researchId)) return false;

	// Armory already has active research (one at a time)
	const currentSlot = building.get(ResearchSlot);
	if (currentSlot !== null) return false;

	// Check affordability and deduct
	const pool = world.get(ResourcePool);
	if (
		!pool ||
		pool.fish < (def.cost.fish ?? 0) ||
		pool.timber < (def.cost.timber ?? 0) ||
		pool.salvage < (def.cost.salvage ?? 0)
	)
		return false;

	world.set(ResourcePool, {
		fish: pool.fish - (def.cost.fish ?? 0),
		timber: pool.timber - (def.cost.timber ?? 0),
		salvage: pool.salvage - (def.cost.salvage ?? 0),
	});

	// Set the research slot (AoS — direct ref mutation is fine, but we use
	// the entity.set pattern for the initial assignment since it was null)
	building.set(ResearchSlot, {
		researchId: def.id,
		progress: 0,
		researchTime: def.time,
	});

	return true;
}

// ---------------------------------------------------------------------------
// Per-frame research system
// ---------------------------------------------------------------------------

/**
 * Tick research progress on all buildings with active ResearchSlot.
 * On completion: apply global effects, mark completed, clear slot.
 */
export function researchSystem(world: World, delta: number): void {
	for (const entity of world.query(IsBuilding, ResearchSlot)) {
		const slot = entity.get(ResearchSlot);
		if (slot === null) continue;

		// Advance progress: 100% / researchTime per second
		slot.progress += (100 / slot.researchTime) * delta;

		if (slot.progress >= 100) {
			// Mark completed in world
			const completed = world.get(CompletedResearch);
			if (completed) {
				completed.ids.add(slot.researchId);
			}

			// Apply global effects
			applyResearchEffect(world, slot.researchId);
			EventBus.emit("research-complete", { researchId: slot.researchId });

			// Clear slot (AoS — set back to null)
			entity.set(ResearchSlot, null);
		}
	}
}

// ---------------------------------------------------------------------------
// Effect application — modifies existing entities' stats
// ---------------------------------------------------------------------------

/**
 * Apply the permanent stat effect of a completed research to all matching
 * entities currently in the world.
 */
function applyResearchEffect(world: World, researchId: string): void {
	switch (researchId) {
		case "hardshell_armor":
			// +20 HP to all Mudfoots (80 → 100)
			applyToUnitsOfType(world, "mudfoot", (entity) => {
				const h = entity.get(Health);
				if (h) entity.set(Health, { current: h.current + 20, max: h.max + 20 });
			});
			break;

		case "fish_oil_arrows":
			// +3 damage to all Shellcrackers (10 → 13)
			applyToUnitsOfType(world, "shellcracker", (entity) => {
				const a = entity.get(Attack);
				if (a) entity.set(Attack, { ...a, damage: a.damage + 3 });
			});
			break;

		case "demolition_training":
			// +50% Sapper damage vs buildings — applied as general damage boost
			applyToUnitsOfType(world, "sapper", (entity) => {
				const a = entity.get(Attack);
				if (a) entity.set(Attack, { ...a, damage: Math.round(a.damage * 1.5) });
			});
			break;

		// Research items that unlock buildings or are passive modifiers
		// (fortified_walls, gun_emplacements, advanced_rafts, mortar_precision,
		// combat_medics, diving_gear) — their effects are checked at build/use
		// time via resourceStore.isResearched(). No immediate stat changes.
		default:
			break;
	}
}

/**
 * Helper: iterate all non-building entities matching a unit type and apply fn.
 */
function applyToUnitsOfType(world: World, unitType: string, fn: (entity: Entity) => void): void {
	for (const entity of world.query(UnitType, Health)) {
		if (entity.has(IsBuilding)) continue;
		if (entity.get(UnitType)?.type !== unitType) continue;
		fn(entity);
	}
}
