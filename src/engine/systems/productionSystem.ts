/**
 * Production System — Building unit queues and construction progress.
 *
 * Each frame:
 * 1. Advance production progress on buildings with active queues.
 * 2. When production completes, spawn the unit with full stats and dequeue.
 */

import { resolveCategoryId } from "@/engine/content/ids";
import { Faction, Flags, Position } from "@/engine/world/components";
import type { GameWorld, ProductionEntry } from "@/engine/world/gameWorld";
import { spawnUnit } from "@/engine/world/gameWorld";
import { getHero, getUnit } from "@/entities/registry";

/**
 * Run one tick of the production system.
 * Advances build queues and construction progress.
 */
export function runProductionSystem(world: GameWorld): void {
	const deltaMs = world.time.deltaMs;
	if (deltaMs <= 0) return;

	for (const eid of world.runtime.alive) {
		// Only process buildings
		if (Flags.isBuilding[eid] !== 1) continue;

		const queue = world.runtime.productionQueues.get(eid);
		if (!queue || queue.length === 0) continue;

		const current: ProductionEntry = queue[0];

		// buildTime is stored in ms; progress is 0-100%
		// If buildTime is 0, complete immediately
		if (current.progress < 100) {
			const buildTimeMs = getBuildTimeMs(current);
			if (buildTimeMs <= 0) {
				current.progress = 100;
			} else {
				current.progress += (deltaMs / buildTimeMs) * 100;
			}
		}

		if (current.progress >= 100) {
			// Spawn the unit near the building with full stats from registry
			const spawnX = Position.x[eid] + 32;
			const spawnY = Position.y[eid];
			const faction =
				Faction.id[eid] === 1 ? "ura" : Faction.id[eid] === 2 ? "scale_guard" : "neutral";

			const unitDef = getUnit(current.contentId) ?? getHero(current.contentId);
			if (unitDef) {
				spawnUnit(world, {
					x: spawnX,
					y: spawnY,
					faction,
					unitType: current.contentId,
					categoryId: resolveCategoryId(unitDef.category),
					health: { current: unitDef.hp, max: unitDef.hp },
					stats: {
						hp: unitDef.hp,
						armor: unitDef.armor,
						speed: unitDef.speed,
						attackDamage: unitDef.damage,
						attackRange: unitDef.range,
						attackCooldownMs: unitDef.attackCooldown,
						visionRadius: unitDef.visionRadius,
						popCost: unitDef.populationCost,
					},
					abilities: unitDef.tags.filter((t) =>
						[
							"gather",
							"build",
							"swim",
							"heal",
							"snipe",
							"demolition",
							"stealth",
							"rally",
							"shield_bash",
						].includes(t),
					),
					flags: {
						canSwim: unitDef.canSwim ?? false,
						canStealth: unitDef.canCrouch ?? false,
					},
				});
			} else {
				// Fallback: spawn with just the type name (no stats)
				spawnUnit(world, {
					x: spawnX,
					y: spawnY,
					faction,
					unitType: current.contentId,
				});
			}

			world.events.push({
				type: "training-complete",
				payload: {
					entityId: eid,
					unitType: current.contentId,
					x: Position.x[eid],
					y: Position.y[eid],
				},
			});

			queue.shift();
		}
	}
}

/** Extract build time in ms from a ProductionEntry. */
function getBuildTimeMs(entry: ProductionEntry): number {
	// ProductionEntry can carry buildTimeMs as an extended field.
	// A value of 0 means "instant build". Fall back to 5000ms default
	// only when the field is absent.
	if (
		"buildTimeMs" in entry &&
		typeof (entry as { buildTimeMs?: unknown }).buildTimeMs === "number"
	) {
		return (entry as { buildTimeMs: number }).buildTimeMs;
	}
	return 5000;
}
